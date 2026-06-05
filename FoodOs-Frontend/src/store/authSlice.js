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
  // NOTE: the outlet list no longer rides in the JWT. getAccessibleRestaurants
  // is kept only as a backward-compatible fallback for old tokens; for current
  // tokens it returns [] and the real list comes from GET /api/me/context.
  const restaurantIds = getAccessibleRestaurants(decoded);

  return { username, userId, role, restaurantIds };
}

// Normalize the /api/me/context payload into the flat shape the store uses.
// `restaurants` are full RestaurantBasicDTOs (primary first); `restaurantIds`
// is the UUID-only projection that the rest of the app already consumes.
function normalizeContext(data) {
  const restaurants   = Array.isArray(data?.restaurants) ? data.restaurants : [];
  const restaurantIds = restaurants.map((r) => r.restaurantUuid).filter(Boolean);
  const primaryRestaurantUuid =
    data?.primaryRestaurantUuid ||
    data?.primaryRestaurant?.restaurantUuid ||
    restaurantIds[0] ||
    null;
  return { restaurants, restaurantIds, primaryRestaurantUuid };
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
  restaurants:         [], // full RestaurantBasicDTOs from /api/me/context (for the picker)
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

  const { username, userId, role } = buildUserPayload(decoded);

  // Outlets are no longer in the token — hydrate the last-known list from the
  // persisted user blob so the picker doesn't flash empty on reload. The fresh
  // list is then re-fetched from /api/me/context on app mount (see MainLayout).
  const storedUser = parseStoredUser();
  const restaurantIds = Array.isArray(storedUser?.restaurantIds)
    ? storedUser.restaurantIds
    : [];

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
    restaurants:        [],
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
      const { authAPI, meAPI } = await import('../services/api');
      const response    = await authAPI.login(credentials);

      // Extract the access token. The backend returns it in the JSON body
      // (accessToken) and also in the Authorization header. Prefer the body,
      // fall back to the header for backward compatibility.
      const authHeader = response.headers?.['authorization'] || '';
      const token =
        response.data?.accessToken ||
        response.data?.token ||
        (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null);

      if (!token) {
        return rejectWithValue('No authentication token received from server');
      }

      const decoded = decodeToken(token);
      if (!decoded) {
        return rejectWithValue('Invalid token received from server');
      }

      const { username, userId, role } = buildUserPayload(decoded, credentials);

      // Persist the access token FIRST so the request interceptor attaches it
      // to the /me/context call below.
      localStorage.setItem(KEYS.TOKEN, token);

      // Fetch the outlet list from /api/me/context (replaces the old JWT claim).
      // A fresh GUEST with no outlets yet returns an empty list — that's fine,
      // it just routes them into the create-restaurant flow.
      let restaurants = [];
      let restaurantIds = [];
      let primaryRestaurantUuid = null;
      try {
        const ctxRes = await meAPI.getContext();
        ({ restaurants, restaurantIds, primaryRestaurantUuid } = normalizeContext(ctxRes.data));
      } catch (ctxErr) {
        console.warn('[auth] /me/context failed at login; continuing with empty outlets', ctxErr);
      }

      // Persist user info (restaurantIds kept for no-flash hydration on reload).
      localStorage.setItem(KEYS.USER, JSON.stringify({
        username,
        roles: Array.isArray(role) ? role : [role],
        restaurantIds,
      }));

      // Auto-select the primary outlet (falls back to the first accessible one).
      const activeRestaurantId = primaryRestaurantUuid || restaurantIds[0] || null;
      if (activeRestaurantId) {
        localStorage.setItem(KEYS.ACTIVE_RESTAURANT, activeRestaurantId);
      }

      // NOTE: The HttpOnly refresh-token cookie was set automatically by the
      // backend in the Set-Cookie header.  We do NOT touch it here.

      return { user: username, userId, token, role, restaurantIds, restaurants, activeRestaurantId };
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

// Fetch (or refresh) the user's outlet context from /api/me/context.
// Dispatched on app mount (MainLayout) and after OAuth login so the picker
// always reflects current access, independent of what the token froze in.
export const fetchMeContext = createAsyncThunk(
  'auth/fetchMeContext',
  async (_, { rejectWithValue }) => {
    try {
      const { meAPI } = await import('../services/api');
      const response  = await meAPI.getContext();
      return normalizeContext(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to load context'
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

      const { username, userId, role } = buildUserPayload(decoded);

      state.token           = token;
      state.role            = role;
      state.isAuthenticated = true;
      if (userId)        state.userId        = userId;
      if (username)        state.user          = username;
      // Outlets are NOT in the token — preserve whatever /me/context last loaded.

      // Persist.
      localStorage.setItem(KEYS.TOKEN, token);
      localStorage.setItem(KEYS.USER, JSON.stringify({
        username: state.user || username,
        roles:    Array.isArray(state.role) ? state.role : [state.role],
        restaurantIds: state.restaurantIds || [],
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
      // Outlets come from /api/me/context, which GoogleCallback dispatches right
      // after this — not from the token. Start empty; fetchMeContext fills it.
      state.restaurantIds   = [];
      state.restaurants     = [];
      state.isAuthenticated = true;
      state.loading         = false;
      state.error           = null;

      localStorage.setItem(KEYS.TOKEN, token);
      localStorage.setItem(KEYS.USER, JSON.stringify({
        username:      state.user,
        roles:         user?.roles || (state.role ? [state.role] : []),
        restaurantIds: [],
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
        const { user, userId, token, role, restaurantIds, restaurants, activeRestaurantId } = action.payload;
        state.loading            = false;
        state.error              = null;
        state.user               = user;
        state.userId            = userId;
        state.token              = token;
        state.role               = role;
        state.restaurantIds      = restaurantIds;
        state.restaurants        = restaurants || [];
        state.activeRestaurantId = activeRestaurantId;
        state.isAuthenticated    = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading         = false;
        state.error           = action.payload;
        state.isAuthenticated = false;
      })

      // ── /me/context refresh (app mount, OAuth) ───────────
      .addCase(fetchMeContext.fulfilled, (state, action) => {
        const { restaurantIds, restaurants, primaryRestaurantUuid } = action.payload;
        state.restaurantIds = restaurantIds;
        state.restaurants   = restaurants;

        // Keep the current selection if it's still accessible; otherwise fall
        // back to the primary outlet (or the first one).
        if (!state.activeRestaurantId || !restaurantIds.includes(state.activeRestaurantId)) {
          state.activeRestaurantId = primaryRestaurantUuid || restaurantIds[0] || null;
          if (state.activeRestaurantId) {
            localStorage.setItem(KEYS.ACTIVE_RESTAURANT, state.activeRestaurantId);
          }
        }

        // Refresh the persisted outlet list so the next reload hydrates fresh.
        const storedUser = parseStoredUser() || {};
        localStorage.setItem(KEYS.USER, JSON.stringify({ ...storedUser, restaurantIds }));
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