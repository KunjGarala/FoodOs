import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { decodeToken, getUserRole, getAccessibleRestaurants, isTokenExpired } from '../utils/authUtils';

// ─────────────────────────────────────────────────────────
// localStorage keys (refresh token is NEVER here — it lives
// in an HttpOnly cookie managed by the backend).
// ─────────────────────────────────────────────────────────
const KEYS = {
  TOKEN: 'token',
  USER: 'user',
  ACTIVE_RESTAURANT: 'activeRestaurantId',
};

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function clearLocalStorage() {
  localStorage.removeItem(KEYS.TOKEN);
  localStorage.removeItem(KEYS.USER);
  localStorage.removeItem(KEYS.ACTIVE_RESTAURANT);
}

function parseStoredUser() {
  try {
    const raw = localStorage.getItem(KEYS.USER);
    if (!raw) return null;
    return raw.startsWith('{') ? JSON.parse(raw) : { username: raw };
  } catch {
    return null;
  }
}

function buildUserPayload(decoded, credentials = {}) {
  const username = decoded.username || decoded.sub || credentials.username || null;
  const userId   = decoded.userId  || decoded.id  || null;
  const role      = getUserRole(decoded);
  const restaurantIds = getAccessibleRestaurants(decoded);

  return { username, userId, role, restaurantIds };
}

// ─────────────────────────────────────────────────────────
// Default / empty state shape
// ─────────────────────────────────────────────────────────
const EMPTY_STATE = {
  user:                null,
  userId:             null,
  token:               null,
  role:                null,
  restaurantIds:       [],
  activeRestaurantId:  null,
  isAuthenticated:     false,
  loading:             false,
  error:               null,
};

// ─────────────────────────────────────────────────────────
// Hydrate state from localStorage on page load / reload.
//
// KEY INSIGHT: If we have an access token (even expired) we
// assume the HttpOnly refresh-token cookie is still valid and
// keep isAuthenticated = true.  The Axios response interceptor
// will transparently refresh the access token on the first
// API call that returns 401.  Only if the refresh itself fails
// do we actually log the user out.
// ─────────────────────────────────────────────────────────
function initializeState() {
  const token = localStorage.getItem(KEYS.TOKEN);

  // Nothing persisted → clean logged-out state.
  if (!token) return { ...EMPTY_STATE };

  const decoded = decodeToken(token);

  // Token is completely unparseable (corrupted) → wipe and reset.
  if (!decoded) {
    clearLocalStorage();
    return { ...EMPTY_STATE };
  }

  const { username, userId, role, restaurantIds } = buildUserPayload(decoded);

  // Restore the active restaurant, or default to the first accessible one.
  let activeRestaurantId = localStorage.getItem(KEYS.ACTIVE_RESTAURANT);
  if (!activeRestaurantId && restaurantIds.length > 0) {
    activeRestaurantId = restaurantIds[0];
  }

  return {
    user:               username,
    userId,
    token,
    role,
    restaurantIds,
    activeRestaurantId,
    // ✅ Stay authenticated even if access token is expired.
    //    The interceptor will refresh it before any real request hits the server.
    isAuthenticated:    true,
    loading:            false,
    error:              null,
  };
}

// ─────────────────────────────────────────────────────────
// Async thunks
// ─────────────────────────────────────────────────────────
export const signup = createAsyncThunk(
  'auth/signup',
  async (userData, { rejectWithValue }) => {
    try {
      const { authAPI } = await import('../services/api');
      const response    = await authAPI.signup(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.response?.data || 'Signup failed'
      );
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { authAPI } = await import('../services/api');
      console.log("asidgash");
      debugger;
      const response    = await authAPI.login(credentials);
      
      // Extract access token from the Authorization header.
      const authHeader = response.headers?.['authorization'] || '';
      const token      = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

      if (!token) {
        return rejectWithValue('No authentication token received from server');
      }

      const decoded = decodeToken(token);
      if (!decoded) {
        return rejectWithValue('Invalid token received from server');
      }

      const { username, userId, role, restaurantIds } = buildUserPayload(decoded, credentials);

      // Persist access token and user info.
      localStorage.setItem(KEYS.TOKEN, token);
      localStorage.setItem(KEYS.USER, JSON.stringify({
        username,
        roles: Array.isArray(role) ? role : [role],
        restaurantIds,
      }));

      // Auto-select first restaurant.
      let activeRestaurantId = null;
      if (restaurantIds.length > 0) {
        activeRestaurantId = restaurantIds[0];
        localStorage.setItem(KEYS.ACTIVE_RESTAURANT, activeRestaurantId);
      }

      // NOTE: The HttpOnly refresh-token cookie was set automatically by the
      // backend in the Set-Cookie header.  We do NOT touch it here.

      return { user: username, userId, token, role, restaurantIds, activeRestaurantId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.error    ||
        error.response?.data          ||
        error.message                 ||
        'Login failed'
      );
    }
  }
);

// ─────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────
const authSlice = createSlice({
  name:         'auth',
  initialState: initializeState(),

  reducers: {
    // ── Full logout ──────────────────────────────────────
    logout: (state) => {
      Object.assign(state, EMPTY_STATE);
      clearLocalStorage();
      // The HttpOnly refresh-token cookie is cleared by calling a backend
      // logout endpoint (handled elsewhere) or expires on its own.
    },

    // ── Clear transient error ────────────────────────────
    clearError: (state) => {
      state.error = null;
    },

    // ── Switch active restaurant (multi-outlet) ─────────
    setActiveRestaurant: (state, action) => {
      state.activeRestaurantId = action.payload;
      localStorage.setItem(KEYS.ACTIVE_RESTAURANT, action.payload);
    },

    // ── Called by the interceptor after a successful token refresh ─
    // Updates the access token + derived fields in Redux & localStorage.
    updateTokenAndRole: (state, action) => {
      const token = typeof action.payload === 'string'
        ? action.payload
        : action.payload?.token;

      if (!token) return;

      const decoded = decodeToken(token);
      if (!decoded) return; // Silently ignore undecodable tokens.

      const { username, userId, role, restaurantIds } = buildUserPayload(decoded);

      state.token           = token;
      state.role            = role;
      state.isAuthenticated = true;
      if (userId)        state.userId        = userId;
      if (username)        state.user          = username;
      if (restaurantIds)   state.restaurantIds = restaurantIds;

      // Persist.
      localStorage.setItem(KEYS.TOKEN, token);
      localStorage.setItem(KEYS.USER, JSON.stringify({
        username: state.user || username,
        roles:    Array.isArray(state.role) ? state.role : [state.role],
        restaurantIds: state.restaurantIds || restaurantIds || [],
      }));
    },

    // ── Google / OAuth sign-in (token arrives via callback) ─
    setGoogleAuthTokens: (state, action) => {
      const { token, user } = action.payload;
      const decoded         = decodeToken(token);
      if (!decoded) return;

      const payload = buildUserPayload(decoded);

      state.token           = token;
      state.user            = payload.username || user?.username;
      state.userId         = payload.userId;
      state.role            = user?.role || payload.role;
      state.restaurantIds   = payload.restaurantIds;
      state.isAuthenticated = true;
      state.loading         = false;
      state.error           = null;

      if (state.restaurantIds.length > 0) {
        state.activeRestaurantId = state.restaurantIds[0];
        localStorage.setItem(KEYS.ACTIVE_RESTAURANT, state.activeRestaurantId);
      }

      localStorage.setItem(KEYS.TOKEN, token);
      localStorage.setItem(KEYS.USER, JSON.stringify({
        username:      state.user,
        roles:         user?.roles || (state.role ? [state.role] : []),
        restaurantIds: state.restaurantIds,
      }));
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(signup.pending,   (state)         => { state.loading = true;  state.error = null; })
      .addCase(signup.fulfilled, (state)         => { state.loading = false; state.error = null; })
      .addCase(signup.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(login.pending,    (state)         => { state.loading = true;  state.error = null; })
      .addCase(login.fulfilled,  (state, action) => {
        const { user, userId, token, role, restaurantIds, activeRestaurantId } = action.payload;
        state.loading            = false;
        state.error              = null;
        state.user               = user;
        state.userId            = userId;
        state.token              = token;
        state.role               = role;
        state.restaurantIds      = restaurantIds;
        state.activeRestaurantId = activeRestaurantId;
        state.isAuthenticated    = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading         = false;
        state.error           = action.payload;
        state.isAuthenticated = false;
      });
  },
});

// ─────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────
export const {
  logout,
  clearError,
  setActiveRestaurant,
  updateTokenAndRole,
  setGoogleAuthTokens,
} = authSlice.actions;

export const selectRole              = (state) => state.auth.role;
export const selectActiveRestaurant  = (state) => state.auth.activeRestaurantId;
export const selectCurrentUser       = (state) => state.auth.user;
export const selectIsAuthenticated   = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;