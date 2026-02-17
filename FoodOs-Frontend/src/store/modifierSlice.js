import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { modifierAPI } from '../services/api';

// ─────────────────────────────────────────────────────────
// Async Thunks
// ─────────────────────────────────────────────────────────

export const fetchModifiers = createAsyncThunk(
  'modifiers/fetchAll',
  async ({ restaurantUuid, modifierGroupUuid, includeInactive = false }, { rejectWithValue }) => {
    try {
      const response = await modifierAPI.getAll(restaurantUuid, modifierGroupUuid, includeInactive);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch modifiers');
    }
  }
);

export const fetchModifierById = createAsyncThunk(
  'modifiers/fetchById',
  async ({ restaurantUuid, modifierGroupUuid, modifierUuid }, { rejectWithValue }) => {
    try {
      const response = await modifierAPI.getById(restaurantUuid, modifierGroupUuid, modifierUuid);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch modifier');
    }
  }
);

export const createModifier = createAsyncThunk(
  'modifiers/create',
  async ({ restaurantUuid, modifierGroupUuid, data }, { rejectWithValue }) => {
    try {
      const response = await modifierAPI.create(restaurantUuid, modifierGroupUuid, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create modifier');
    }
  }
);

export const createModifiersBulk = createAsyncThunk(
  'modifiers/createBulk',
  async ({ restaurantUuid, modifierGroupUuid, data }, { rejectWithValue }) => {
    try {
      const response = await modifierAPI.createBulk(restaurantUuid, modifierGroupUuid, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create modifiers');
    }
  }
);

export const updateModifier = createAsyncThunk(
  'modifiers/update',
  async ({ restaurantUuid, modifierGroupUuid, modifierUuid, data }, { rejectWithValue }) => {
    try {
      const response = await modifierAPI.update(restaurantUuid, modifierGroupUuid, modifierUuid, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update modifier');
    }
  }
);

export const deleteModifier = createAsyncThunk(
  'modifiers/delete',
  async ({ restaurantUuid, modifierGroupUuid, modifierUuid }, { rejectWithValue }) => {
    try {
      await modifierAPI.remove(restaurantUuid, modifierGroupUuid, modifierUuid);
      return modifierUuid;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete modifier');
    }
  }
);

export const toggleModifierStatus = createAsyncThunk(
  'modifiers/toggleStatus',
  async ({ restaurantUuid, modifierGroupUuid, modifierUuid, isActive }, { rejectWithValue }) => {
    try {
      await modifierAPI.toggleStatus(restaurantUuid, modifierGroupUuid, modifierUuid, isActive);
      return { modifierUuid, isActive };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to toggle modifier status');
    }
  }
);

// ─────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────
const initialState = {
  modifiers: [],
  currentModifier: null,
  loading: false,
  actionLoading: false,
  error: null,
  success: null,
};

// ─────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────
const modifierSlice = createSlice({
  name: 'modifiers',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearSuccess: (state) => { state.success = null; },
    clearModifiers: () => initialState,
    clearCurrentModifier: (state) => { state.currentModifier = null; },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchModifiers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModifiers.fulfilled, (state, action) => {
        state.loading = false;
        state.modifiers = action.payload;
      })
      .addCase(fetchModifiers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch By ID
      .addCase(fetchModifierById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModifierById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentModifier = action.payload;
      })
      .addCase(fetchModifierById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createModifier.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createModifier.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.modifiers.push(action.payload);
        state.success = 'Modifier created successfully';
      })
      .addCase(createModifier.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Bulk Create
      .addCase(createModifiersBulk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createModifiersBulk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.modifiers.push(...action.payload);
        state.success = 'Modifiers created successfully';
      })
      .addCase(createModifiersBulk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateModifier.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateModifier.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.modifiers.findIndex(m => m.modifierUuid === action.payload.modifierUuid);
        if (idx !== -1) state.modifiers[idx] = action.payload;
        state.success = 'Modifier updated successfully';
      })
      .addCase(updateModifier.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteModifier.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteModifier.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.modifiers = state.modifiers.filter(m => m.modifierUuid !== action.payload);
        state.success = 'Modifier deleted successfully';
      })
      .addCase(deleteModifier.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Toggle Status
      .addCase(toggleModifierStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(toggleModifierStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.modifiers.findIndex(m => m.modifierUuid === action.payload.modifierUuid);
        if (idx !== -1) state.modifiers[idx].isActive = action.payload.isActive;
        state.success = 'Modifier status updated';
      })
      .addCase(toggleModifierStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  clearSuccess, 
  clearModifiers,
  clearCurrentModifier,
} = modifierSlice.actions;

export default modifierSlice.reducer;
