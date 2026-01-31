import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../services/api';
import { decodeToken, getUserRole, getAccessibleRestaurants, isTokenExpired } from '../utils/authUtils';
import { use } from 'react';

// Helper to initialize state from localStorage
const initializeState = () => {
  const token = localStorage.getItem('token');
  let user = null;
  try {
      const storedUser = localStorage.getItem('user');
      // Attempt to parse if it's a JSON object string
      if (storedUser) {
          if (storedUser.startsWith('{')) {
             user = JSON.parse(storedUser);
          } else {
             user = { username: storedUser };
          }
      }
  } catch (e) {
      console.warn("Failed to parse user from local storage", e);
      user = null;
  }
  
  const savedActiveRestaurantId = localStorage.getItem('activeRestaurantId');

  if (!token) {
    return {
      user: null,
      userId: null,
      token: null,
      role: null,
      restaurantIds: [],
      activeRestaurantId: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
  }

  const decoded = decodeToken(token);
  
  // Check if token is valid and not expired
  if (!decoded || isTokenExpired(decoded)) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeRestaurantId');
    return {
      user: null,
      userId: null,
      token: null,
      role: null,
      restaurantIds: [],
      activeRestaurantId: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
  }

  const role = getUserRole(decoded);
  const restaurantIds = getAccessibleRestaurants(decoded);
  
  // Determine active restaurant ID
  let activeId = savedActiveRestaurantId;
  
  // If specific logic for MANAGER (users with only 1 restaurant)
  if (!activeId) {
     if (restaurantIds.length === 1) {
         activeId = restaurantIds[0];
     } else if (restaurantIds.length > 0) {
         activeId = restaurantIds[0]; // Default to first for Owners if nothing selected
     }
  }

  // Extract username
  const username = decoded.username || decoded.sub || (user ? user.username : null);

  return {
    user: username,
    userId: decoded.userId || decoded.id,         // User ID
    token: token,
    role: role,
    restaurantIds: restaurantIds,
    activeRestaurantId: activeId,
    isAuthenticated: true,
    loading: false,
    error: null,
  };
};

// Async thunks
export const signup = createAsyncThunk(
  'auth/signup',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.signup(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Signup failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);

      const token = response.headers['authorization']?.substring(7);
      
      if (!token) {
          throw new Error("No token received");
      }
      
      localStorage.setItem('token', token);

      const decoded = decodeToken(token);
      const role = getUserRole(decoded);
      const restaurantIds = getAccessibleRestaurants(decoded);
      const userId = decoded.userId || decoded.id;
      const username = decoded.username || decoded.sub || credentials.username;
      
      // Auto-select restaurant logic
      let activeRestaurantId = null;
      if (restaurantIds.length > 0) {
          activeRestaurantId = restaurantIds[0];
          localStorage.setItem('activeRestaurantId', activeRestaurantId);
      }
      
      // Store complete user object in localStorage
      const userObj = {
          username: username,
          roles: Array.isArray(role) ? role : [role],
          restaurantIds: restaurantIds
      };
      localStorage.setItem('user', JSON.stringify(userObj));

      return { 
          user: username,
          userId,
          token, 
          role, 
          restaurantIds,
          activeRestaurantId
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Login failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: initializeState(),
  reducers: {
    logout: (state) => {
      state.user = null;
      state.userId = null;
      state.token = null;
      state.role = null;
      state.restaurantIds = [];
      state.activeRestaurantId = null;
      state.isAuthenticated = false;
      state.error = null;
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('activeRestaurantId');
      localStorage.removeItem('refreshToken');
    },
    clearError: (state) => {
      state.error = null;
    },
    setActiveRestaurant: (state, action) => {
        state.activeRestaurantId = action.payload;
        localStorage.setItem('activeRestaurantId', action.payload);
    },
    setGoogleAuthTokens: (state, action) => {
      const { token, user } = action.payload;
      const decoded = decodeToken(token);
      
      state.token = token;
      state.user = user.username || decoded.username || decoded.sub;
      state.userId = decoded.userId || decoded.id;
      state.role = use.role || getUserRole(decoded);
      state.restaurantIds = getAccessibleRestaurants(decoded);
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      
      // Auto select restaurant
      if (state.restaurantIds.length > 0) {
          state.activeRestaurantId = state.restaurantIds[0];
          localStorage.setItem('activeRestaurantId', state.activeRestaurantId);
      }

      // Store complete user object
      const userObj = {
          username: state.user,
          roles: user.roles || (state.role ? [state.role] : []), 
          restaurantIds: state.restaurantIds || []
      };
      
      localStorage.setItem('user', JSON.stringify(userObj));
      localStorage.setItem('token', token);
    },
    updateTokenAndRole: (state, action) => {
      const token = typeof action.payload === 'string' ? action.payload : action.payload.token;
      
      if (token) {
        const decoded = decodeToken(token);
        const role = getUserRole(decoded);
        const restaurantIds = getAccessibleRestaurants(decoded);
        const userId = decoded.userId || decoded.id;
        const username = decoded.username || decoded.sub;

        state.token = token;
        state.role = role;
        
        if (userId) state.userId = userId;
        if (username) state.user = username;
        if (restaurantIds) state.restaurantIds = restaurantIds;

        localStorage.setItem('token', token);
        
        const userObj = {
            username: state.user,
            roles: Array.isArray(state.role) ? state.role : [state.role],
            restaurantIds: state.restaurantIds || []
        };
        localStorage.setItem('user', JSON.stringify(userObj));
      }
    }
    
  },
  extraReducers: (builder) => {
    builder
      // Signup
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.userId = action.payload.userId;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.restaurantIds = action.payload.restaurantIds;
        state.activeRestaurantId = action.payload.activeRestaurantId;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, setGoogleAuthTokens, setActiveRestaurant, updateTokenAndRole } = authSlice.actions;
export const selectRole = (state) => state.auth.role;
export const selectActiveRestaurant = (state) => state.auth.activeRestaurantId;
export const selectCurrentUser = (state) => state.auth.user;
export default authSlice.reducer;
