import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { variationAPI } from '../services/api';

// ─────────────────────────────────────────────────────────
// Async Thunks
// ─────────────────────────────────────────────────────────

export const fetchVariations = createAsyncThunk(
  'variations/fetchAll',
  async ({ restaurantUuid, productUuid, includeInactive = true }, { rejectWithValue }) => {
    try {
      const response = await variationAPI.getAll(restaurantUuid, productUuid, includeInactive);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch variations');
    }
  }
);

export const createVariation = createAsyncThunk(
  'variations/create',
  async ({ restaurantUuid, productUuid, data }, { rejectWithValue }) => {
    try {
      const response = await variationAPI.create(restaurantUuid, productUuid, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create variation');
    }
  }
);

export const createVariationsBulk = createAsyncThunk(
  'variations/createBulk',
  async ({ restaurantUuid, productUuid, data }, { rejectWithValue }) => {
    try {
      const response = await variationAPI.createBulk(restaurantUuid, productUuid, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create variations');
    }
  }
);

export const updateVariation = createAsyncThunk(
  'variations/update',
  async ({ restaurantUuid, productUuid, variationUuid, data }, { rejectWithValue }) => {
    try {
      const response = await variationAPI.update(restaurantUuid, productUuid, variationUuid, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update variation');
    }
  }
);

export const deleteVariation = createAsyncThunk(
  'variations/delete',
  async ({ restaurantUuid, productUuid, variationUuid }, { rejectWithValue }) => {
    try {
      await variationAPI.remove(restaurantUuid, productUuid, variationUuid);
      return variationUuid;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete variation');
    }
  }
);

export const toggleVariationStatus = createAsyncThunk(
  'variations/toggleStatus',
  async ({ restaurantUuid, productUuid, variationUuid, isActive }, { rejectWithValue }) => {
    try {
      await variationAPI.toggleStatus(restaurantUuid, productUuid, variationUuid, isActive);
      return { variationUuid, isActive };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to toggle variation status');
    }
  }
);

export const setDefaultVariation = createAsyncThunk(
  'variations/setDefault',
  async ({ restaurantUuid, productUuid, variationUuid }, { rejectWithValue }) => {
    try {
      const response = await variationAPI.setDefault(restaurantUuid, productUuid, variationUuid);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to set default variation');
    }
  }
);

// ─────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────
const initialState = {
  variations: [],
  loading: false,
  actionLoading: false,
  error: null,
  success: null,
};

// ─────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────
const variationSlice = createSlice({
  name: 'variations',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearSuccess: (state) => { state.success = null; },
    clearVariations: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchVariations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVariations.fulfilled, (state, action) => {
        state.loading = false;
        state.variations = action.payload;
      })
      .addCase(fetchVariations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createVariation.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createVariation.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.variations.push(action.payload);
        state.success = 'Variation created successfully';
      })
      .addCase(createVariation.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Bulk Create
      .addCase(createVariationsBulk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createVariationsBulk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.variations.push(...action.payload);
        state.success = 'Variations created successfully';
      })
      .addCase(createVariationsBulk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateVariation.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateVariation.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.variations.findIndex(v => v.variationUuid === action.payload.variationUuid);
        if (idx !== -1) state.variations[idx] = action.payload;
        state.success = 'Variation updated successfully';
      })
      .addCase(updateVariation.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteVariation.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteVariation.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.variations = state.variations.filter(v => v.variationUuid !== action.payload);
        state.success = 'Variation deleted successfully';
      })
      .addCase(deleteVariation.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Toggle Status
      .addCase(toggleVariationStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(toggleVariationStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.variations.findIndex(v => v.variationUuid === action.payload.variationUuid);
        if (idx !== -1) state.variations[idx].isActive = action.payload.isActive;
        state.success = 'Variation status updated';
      })
      .addCase(toggleVariationStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Set Default
      .addCase(setDefaultVariation.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(setDefaultVariation.fulfilled, (state, action) => {
        state.actionLoading = false;
        // The response contains the newly-set-default variation; clear old defaults
        state.variations = state.variations.map(v => ({
          ...v,
          isDefault: v.variationUuid === action.payload.variationUuid,
        }));
        state.success = 'Default variation updated';
      })
      .addCase(setDefaultVariation.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess, clearVariations } = variationSlice.actions;
export default variationSlice.reducer;
