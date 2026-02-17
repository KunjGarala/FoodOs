import axios from 'axios';
import API_BASE_URL from '../config';

// ─────────────────────────────────────────────────────────
// Store reference — injected once at app bootstrap via
// setupInterceptors().  Used only to dispatch updateTokenAndRole
// or logout after a refresh succeeds or fails.
// ─────────────────────────────────────────────────────────
let _store = null;

export function setupInterceptors(storeInstance) {
  _store = storeInstance;
}

// ─────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────
const api = axios.create({
  baseURL:        API_BASE_URL,
  withCredentials: true, // ← sends HttpOnly refresh-token cookie automatically
});

// ─────────────────────────────────────────────────────────
// Refresh-token queue
// Guarantees that when multiple requests fail with 401
// simultaneously, only ONE refresh call is made.  All others
// wait and are retried with the new token.
// ─────────────────────────────────────────────────────────
let isRefreshing    = false;
let pendingRequests = []; // { resolve, reject }

function enqueue() {
  return new Promise((resolve, reject) => {
    pendingRequests.push({ resolve, reject });
  });
}

function drainQueue(error, token) {
  pendingRequests.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  pendingRequests = [];
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function extractToken(response) {
  // 1. Authorization header  (most common)
  const header = response.headers?.['authorization'] || '';
  if (header.startsWith('Bearer ')) return header.substring(7);

  // 2. Response body  (fallback)
  const data = response.data;
  if (typeof data === 'string' && data.length > 20) return data;
  if (data?.token)       return data.token;
  if (data?.accessToken) return data.accessToken;

  return null;
}

async function dispatchAction(actionPath, payload) {
  if (!_store) return;
  try {
    const mod = await import(actionPath);
    _store.dispatch(mod[Object.keys(mod).find((k) => typeof mod[k] === 'function' && k !== 'default')](payload));
  } catch (e) {
    console.warn('[api] dispatch failed:', e);
  }
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.replace('/login');
  }
}

function wipeAccessToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('activeRestaurantId');
}

// ─────────────────────────────────────────────────────────
// REQUEST interceptor
// ─────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  // Attach the access token from localStorage (if present) to every request.
  // The refresh-token endpoint itself does NOT need an access token — the
  // backend authenticates it via the HttpOnly cookie sent by withCredentials.
  if (!config.url?.includes('refresh-token')) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─────────────────────────────────────────────────────────
// RESPONSE interceptor
// ─────────────────────────────────────────────────────────
api.interceptors.response.use(
  // ── Success path ─────────────────────────────────────
  async (response) => {
    // Some backends rotate the access token on every response.
    // If a new one arrives, persist it silently.
    const newToken = extractToken(response);
    if (newToken && newToken !== localStorage.getItem('token')) {
      localStorage.setItem('token', newToken);
      if (_store) {
        const { updateTokenAndRole } = await import('../store/authSlice');
        _store.dispatch(updateTokenAndRole(newToken));
      }
      console.log('[api] Access token updated from response');
    }
    return response;
  },

  // ── Error path ───────────────────────────────────────
  async (error) => {
    const originalRequest = error.config;

    // ── Not a 401 → propagate immediately ──────────────
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // ── 401 on the login endpoint itself → just reject ─
    if (originalRequest.url?.includes('genrate-token')) {
      return Promise.reject(error);
    }

    // ── 401 on the refresh endpoint → refresh token is
    //    invalid/expired.  Log out hard.
    if (originalRequest.url?.includes('refresh-token')) {
      wipeAccessToken();
      const { logout } = await import('../store/authSlice');
      if (_store) _store.dispatch(logout());
      redirectToLogin();
      return Promise.reject(error);
    }

    // ── No access token at all → nothing to refresh from ─
    if (!localStorage.getItem('token')) {
      wipeAccessToken();
      const { logout } = await import('../store/authSlice');
      if (_store) _store.dispatch(logout());
      redirectToLogin();
      return Promise.reject(error);
    }

    // ── Already retried this exact request → bail ──────
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // ── Another refresh is in flight → queue this request
    if (isRefreshing) {
      return enqueue().then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        originalRequest._retry = true;
        return api(originalRequest);
      });
    }

    // ── Kick off the refresh ────────────────────────────
    originalRequest._retry = true;
    isRefreshing           = true;

    try {
      // POST /refresh-token with NO body.
      // The HttpOnly cookie is sent automatically by withCredentials: true.
      // The backend reads it from there.
      const response = await axios.post(
        `${API_BASE_URL}/refresh-token`,
        null,                          // ← empty body
        { withCredentials: true }      // ← cookie is sent here
      );

      const newToken = extractToken(response);
      if (!newToken) {
        throw new Error('Refresh endpoint did not return a token');
      }

      // ── Persist & broadcast ──────────────────────────
      localStorage.setItem('token', newToken);

      if (_store) {
        const { updateTokenAndRole } = await import('../store/authSlice');
        _store.dispatch(updateTokenAndRole(newToken));
      }

      // Update the default header so future requests from this instance use it.
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

      // ── Retry the original failed request ────────────
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      // ── Unblock all queued requests ──────────────────
      drainQueue(null, newToken);
      isRefreshing = false;

      return api(originalRequest);

    } catch (refreshError) {
      // ── Refresh itself failed ────────────────────────
      drainQueue(refreshError, null);
      isRefreshing = false;

      // Only force-logout when the server explicitly rejects the refresh
      // token (401 / 403 / 400).  Network errors are transient — don't
      // log the user out over a blip.
      const status = refreshError.response?.status;
      if (status === 400 || status === 401 || status === 403) {
        wipeAccessToken();
        const { logout } = await import('../store/authSlice');
        if (_store) _store.dispatch(logout());
        redirectToLogin();
      }

      return Promise.reject(refreshError);
    }
  }
);

// ─────────────────────────────────────────────────────────
// API endpoint helpers
// ─────────────────────────────────────────────────────────
export const authAPI = {
  signup:                (userData)  => api.post('/api/auth/signup', userData),
  login:                 (creds)     => api.post('/genrate-token', creds),
  userWantCreateRestaurant: (flag)   => api.post(`/api/auth/user-want-create-restaurant?wantToCreateRestaurant=${flag}`),
  requestPasswordReset:  (email)     => api.post('/api/auth/request-password-reset', { email }),
  resetPassword:         (payload)   => api.post('/api/auth/reset-password', payload),
  logout:                ()          => api.post('/api/auth/logout'), // clears HttpOnly cookie server-side
};

export const restaurantAPI = {
  createFirstRestaurant: (formData)                  => api.post('/api/restaurants/create-first', formData),
  createOutlet:          (parentUuid, data)           => api.post(`/api/restaurants/${parentUuid}/outlets`, data),
  getRestaurantDetail:   (restaurantUuid)             => api.get(`/api/restaurants/${restaurantUuid}/detail`),
};

export const employeeAPI = {
  getAll: (params) => api.get('/api/restaurants/employees', { params }),
  update: (userId, data) => api.patch(`/api/users/employee/${userId}`, data),
};

export const tableAPI = {
  // Create new table
  createTable: (data) => api.post('/api/v1/tables', data),
  
  // Update table configuration
  updateTable: (tableUuid, data) => api.put(`/api/v1/tables/${tableUuid}`, data),
  
  // Update table status (VACANT, OCCUPIED, BILLED, DIRTY, RESERVED)
  updateTableStatus: (tableUuid, statusData) => api.patch(`/api/v1/tables/${tableUuid}/status`, statusData),
  
  // Get single table by UUID
  getTableByUuid: (tableUuid) => api.get(`/api/v1/tables/${tableUuid}`),
  
  // Get all tables (paginated with optional status filter)
  getAllTables: ({ page = 0, size = 20, status = null }) => {
    const params = { page, size };
    if (status) params.status = status;
    return api.get('/api/v1/tables', { params });
  },
  
  // Get tables by restaurant (for floor plan)
  getTablesByRestaurant: (restaurantUuid) => api.get(`/api/v1/tables/restaurant/${restaurantUuid}`),
  
  // Get tables by restaurant chain
  getTablesByChain: (parentRestaurantUuid) => api.get(`/api/v1/tables/chain/${parentRestaurantUuid}`),
  
  // Delete table (soft delete)
  deleteTable: (tableUuid) => api.delete(`/api/v1/tables/${tableUuid}`),
  
  // Merge tables
  mergeTables: (data) => api.post('/api/v1/tables/merge', data),
  
  // Transfer table order
  transferTable: (data) => api.post('/api/v1/tables/transfer', data),
  
  // Get table analytics
  getTableAnalytics: (restaurantUuid) => api.get(`/api/v1/tables/analytics/${restaurantUuid}`),
};

export const variationAPI = {
  create:       (restaurantUuid, productUuid, data) =>
    api.post(`/api/restaurants/${restaurantUuid}/products/${productUuid}/variations`, data),

  createBulk:   (restaurantUuid, productUuid, data) =>
    api.post(`/api/restaurants/${restaurantUuid}/products/${productUuid}/variations/bulk`, data),

  getAll:       (restaurantUuid, productUuid, includeInactive = false) =>
    api.get(`/api/restaurants/${restaurantUuid}/products/${productUuid}/variations?includeInactive=${includeInactive}`),

  getById:      (restaurantUuid, productUuid, variationUuid) =>
    api.get(`/api/restaurants/${restaurantUuid}/products/${productUuid}/variations/${variationUuid}`),

  update:       (restaurantUuid, productUuid, variationUuid, data) =>
    api.put(`/api/restaurants/${restaurantUuid}/products/${productUuid}/variations/${variationUuid}`, data),

  remove:       (restaurantUuid, productUuid, variationUuid) =>
    api.delete(`/api/restaurants/${restaurantUuid}/products/${productUuid}/variations/${variationUuid}`),

  toggleStatus: (restaurantUuid, productUuid, variationUuid, isActive) =>
    api.patch(`/api/restaurants/${restaurantUuid}/products/${productUuid}/variations/${variationUuid}/toggle-status?isActive=${isActive}`),

  setDefault:   (restaurantUuid, productUuid, variationUuid) =>
    api.patch(`/api/restaurants/${restaurantUuid}/products/${productUuid}/variations/${variationUuid}/set-default`),
};

export const modifierGroupAPI = {
  create:       (restaurantUuid, data) =>
    api.post(`/api/restaurants/${restaurantUuid}/modifier-groups`, data),

  getAll:       (restaurantUuid, includeInactive = false) =>
    api.get(`/api/restaurants/${restaurantUuid}/modifier-groups?includeInactive=${includeInactive}`),

  getById:      (restaurantUuid, modifierGroupUuid) =>
    api.get(`/api/restaurants/${restaurantUuid}/modifier-groups/${modifierGroupUuid}`),

  search:       (restaurantUuid, searchTerm) =>
    api.get(`/api/restaurants/${restaurantUuid}/modifier-groups/search?searchTerm=${encodeURIComponent(searchTerm)}`),

  update:       (restaurantUuid, modifierGroupUuid, data) =>
    api.put(`/api/restaurants/${restaurantUuid}/modifier-groups/${modifierGroupUuid}`, data),

  remove:       (restaurantUuid, modifierGroupUuid) =>
    api.delete(`/api/restaurants/${restaurantUuid}/modifier-groups/${modifierGroupUuid}`),

  toggleStatus: (restaurantUuid, modifierGroupUuid, isActive) =>
    api.patch(`/api/restaurants/${restaurantUuid}/modifier-groups/${modifierGroupUuid}/toggle-status?isActive=${isActive}`),
};

export const modifierAPI = {
  create:       (restaurantUuid, modifierGroupUuid, data) =>
    api.post(`/api/restaurants/${restaurantUuid}/modifier-groups/${modifierGroupUuid}/modifiers`, data),

  createBulk:   (restaurantUuid, modifierGroupUuid, data) =>
    api.post(`/api/restaurants/${restaurantUuid}/modifier-groups/${modifierGroupUuid}/modifiers/bulk`, data),

  getAll:       (restaurantUuid, modifierGroupUuid, includeInactive = false) =>
    api.get(`/api/restaurants/${restaurantUuid}/modifier-groups/${modifierGroupUuid}/modifiers?includeInactive=${includeInactive}`),

  getById:      (restaurantUuid, modifierGroupUuid, modifierUuid) =>
    api.get(`/api/restaurants/${restaurantUuid}/modifier-groups/${modifierGroupUuid}/modifiers/${modifierUuid}`),

  update:       (restaurantUuid, modifierGroupUuid, modifierUuid, data) =>
    api.put(`/api/restaurants/${restaurantUuid}/modifier-groups/${modifierGroupUuid}/modifiers/${modifierUuid}`, data),

  remove:       (restaurantUuid, modifierGroupUuid, modifierUuid) =>
    api.delete(`/api/restaurants/${restaurantUuid}/modifier-groups/${modifierGroupUuid}/modifiers/${modifierUuid}`),

  toggleStatus: (restaurantUuid, modifierGroupUuid, modifierUuid, isActive) =>
    api.patch(`/api/restaurants/${restaurantUuid}/modifier-groups/${modifierGroupUuid}/modifiers/${modifierUuid}/toggle-status?isActive=${isActive}`),
};

export const productModifierGroupAPI = {
  // Assign a modifier group to a product
  assign:       (restaurantUuid, productUuid, modifierGroupUuid) =>
    api.post(`/api/restaurants/${restaurantUuid}/products/${productUuid}/modifier-groups/${modifierGroupUuid}`),

  // Remove a modifier group from a product
  remove:       (restaurantUuid, productUuid, modifierGroupUuid) =>
    api.delete(`/api/restaurants/${restaurantUuid}/products/${productUuid}/modifier-groups/${modifierGroupUuid}`),

  // Get all modifier groups assigned to a product
  getAll:       (restaurantUuid, productUuid) =>
    api.get(`/api/restaurants/${restaurantUuid}/products/${productUuid}/modifier-groups`),
};

export default api;