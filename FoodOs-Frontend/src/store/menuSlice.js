import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// ─────────────────────────────────────────────────────────
// Async Thunks - Menu Management
// ─────────────────────────────────────────────────────────

// Fetch complete menu with categories, products, variations and modifiers
export const fetchMenu = createAsyncThunk(
  'menu/fetchMenu',
  async (restaurantUuid, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/restaurants/${restaurantUuid}/menu`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch menu');
    }
  }
);

// ─────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────
const menuSlice = createSlice({
  name: 'menu',
  initialState: {
    restaurant: null,
    categories: [],
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    clearMenu: (state) => {
      state.restaurant = null;
      state.categories = [];
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Menu
      .addCase(fetchMenu.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurant = action.payload.restaurant;
        state.categories = action.payload.categories;
        state.success = 'Menu loaded successfully';
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch menu';
      });
  },
});

export const { clearError, clearSuccess, clearMenu } = menuSlice.actions;
export default menuSlice.reducer;
