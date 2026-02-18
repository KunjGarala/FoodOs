import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { modifierGroupAPI } from '../services/api';

// ─────────────────────────────────────────────────────────
// Async Thunks
// ─────────────────────────────────────────────────────────

export const fetchModifierGroups = createAsyncThunk(
  'modifierGroups/fetchAll',
  async ({ restaurantUuid, includeInactive = false }, { rejectWithValue }) => {
    try {
      const response = await modifierGroupAPI.getAll(restaurantUuid, includeInactive);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch modifier groups');
    }
  }
);

export const fetchModifierGroupById = createAsyncThunk(
  'modifierGroups/fetchById',
  async ({ restaurantUuid, modifierGroupUuid }, { rejectWithValue }) => {
    try {
      const response = await modifierGroupAPI.getById(restaurantUuid, modifierGroupUuid);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch modifier group');
    }
  }
);

export const searchModifierGroups = createAsyncThunk(
  'modifierGroups/search',
  async ({ restaurantUuid, searchTerm }, { rejectWithValue }) => {
    try {
      const response = await modifierGroupAPI.search(restaurantUuid, searchTerm);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to search modifier groups');
    }
  }
);

export const createModifierGroup = createAsyncThunk(
  'modifierGroups/create',
  async ({ restaurantUuid, data }, { rejectWithValue }) => {
    try {
      const response = await modifierGroupAPI.create(restaurantUuid, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create modifier group');
    }
  }
);

export const updateModifierGroup = createAsyncThunk(
  'modifierGroups/update',
  async ({ restaurantUuid, modifierGroupUuid, data }, { rejectWithValue }) => {
    try {
      const response = await modifierGroupAPI.update(restaurantUuid, modifierGroupUuid, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update modifier group');
    }
  }
);

export const deleteModifierGroup = createAsyncThunk(
  'modifierGroups/delete',
  async ({ restaurantUuid, modifierGroupUuid }, { rejectWithValue }) => {
    try {
      await modifierGroupAPI.remove(restaurantUuid, modifierGroupUuid);
      return modifierGroupUuid;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete modifier group');
    }
  }
);

export const toggleModifierGroupStatus = createAsyncThunk(
  'modifierGroups/toggleStatus',
  async ({ restaurantUuid, modifierGroupUuid, isActive }, { rejectWithValue }) => {
    try {
      await modifierGroupAPI.toggleStatus(restaurantUuid, modifierGroupUuid, isActive);
      return { modifierGroupUuid, isActive };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to toggle modifier group status');
    }
  }
);

// ─────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────
const initialState = {
  modifierGroups: [],
  currentModifierGroup: null,
  searchResults: [],
  loading: false,
  actionLoading: false,
  error: null,
  success: null,
};

// ─────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────
const modifierGroupSlice = createSlice({
  name: 'modifierGroups',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    clearSuccess: (state) => { state.success = null; },
    clearModifierGroups: () => initialState,
    clearSearchResults: (state) => { state.searchResults = []; },
    clearCurrentModifierGroup: (state) => { state.currentModifierGroup = null; },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchModifierGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModifierGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.modifierGroups = action.payload;
      })
      .addCase(fetchModifierGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch By ID
      .addCase(fetchModifierGroupById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModifierGroupById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentModifierGroup = action.payload;
      })
      .addCase(fetchModifierGroupById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Search
      .addCase(searchModifierGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchModifierGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchModifierGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createModifierGroup.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createModifierGroup.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.modifierGroups.push(action.payload);
        state.success = 'Modifier group created successfully';
      })
      .addCase(createModifierGroup.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateModifierGroup.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateModifierGroup.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.modifierGroups.findIndex(mg => mg.modifierGroupUuid === action.payload.modifierGroupUuid);
        if (idx !== -1) state.modifierGroups[idx] = action.payload;
        state.success = 'Modifier group updated successfully';
      })
      .addCase(updateModifierGroup.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteModifierGroup.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteModifierGroup.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.modifierGroups = state.modifierGroups.filter(mg => mg.modifierGroupUuid !== action.payload);
        state.success = 'Modifier group deleted successfully';
      })
      .addCase(deleteModifierGroup.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Toggle Status
      .addCase(toggleModifierGroupStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(toggleModifierGroupStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.modifierGroups.findIndex(mg => mg.modifierGroupUuid === action.payload.modifierGroupUuid);
        if (idx !== -1) state.modifierGroups[idx].isActive = action.payload.isActive;
        state.success = 'Modifier group status updated';
      })
      .addCase(toggleModifierGroupStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  clearSuccess, 
  clearModifierGroups,
  clearSearchResults,
  clearCurrentModifierGroup,
} = modifierGroupSlice.actions;

export default modifierGroupSlice.reducer;
