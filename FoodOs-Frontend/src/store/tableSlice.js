import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { tableAPI } from '../services/api';

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

// Valid status transitions matching backend validation
export const VALID_STATUS_TRANSITIONS = {
  VACANT: ['OCCUPIED', 'RESERVED'],
  OCCUPIED: ['BILLED', 'VACANT'],
  BILLED: ['DIRTY', 'VACANT'],
  DIRTY: ['VACANT'],
  RESERVED: ['OCCUPIED', 'VACANT'],
};

// ─────────────────────────────────────────────────────────
// Async Thunks for Table Management
// ─────────────────────────────────────────────────────────

// Create new table
export const createTable = createAsyncThunk(
  'tables/create',
  async (tableData, { rejectWithValue }) => {
    try {
      const response = await tableAPI.createTable(tableData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create table'
      );
    }
  }
);

// Update table configuration
export const updateTable = createAsyncThunk(
  'tables/update',
  async ({ tableUuid, data }, { rejectWithValue }) => {
    try {
      const response = await tableAPI.updateTable(tableUuid, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update table'
      );
    }
  }
);

// Update table status (VACANT, OCCUPIED, BILLED, DIRTY, RESERVED)
export const updateTableStatus = createAsyncThunk(
  'tables/updateStatus',
  async ({ tableUuid, statusData }, { rejectWithValue }) => {
    try {
      const response = await tableAPI.updateTableStatus(tableUuid, statusData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update table status'
      );
    }
  }
);

// Get single table by UUID
export const getTableByUuid = createAsyncThunk(
  'tables/getByUuid',
  async (tableUuid, { rejectWithValue }) => {
    try {
      const response = await tableAPI.getTableByUuid(tableUuid);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch table'
      );
    }
  }
);

// Get all tables (paginated with optional status filter)
export const getAllTables = createAsyncThunk(
  'tables/getAll',
  async ({ page = 0, size = 20, status = null }, { rejectWithValue }) => {
    try {
      const response = await tableAPI.getAllTables({ page, size, status });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch tables'
      );
    }
  }
);

// Get tables by restaurant (for floor plan)
export const getTablesByRestaurant = createAsyncThunk(
  'tables/getByRestaurant',
  async (restaurantUuid, { rejectWithValue }) => {
    try {
      const response = await tableAPI.getTablesByRestaurant(restaurantUuid);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch restaurant tables'
      );
    }
  }
);

// Get tables by restaurant chain
export const getTablesByChain = createAsyncThunk(
  'tables/getByChain',
  async (parentRestaurantUuid, { rejectWithValue }) => {
    try {
      const response = await tableAPI.getTablesByChain(parentRestaurantUuid);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch chain tables'
      );
    }
  }
);

// Delete table (soft delete)
export const deleteTable = createAsyncThunk(
  'tables/delete',
  async (tableUuid, { rejectWithValue }) => {
    try {
      await tableAPI.deleteTable(tableUuid);
      return tableUuid;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to delete table'
      );
    }
  }
);

// Merge tables
export const mergeTables = createAsyncThunk(
  'tables/merge',
  async ({ parentTableUuid, childTableUuids }, { rejectWithValue }) => {
    try {
      const response = await tableAPI.mergeTables({ parentTableUuid, childTableUuids });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to merge tables'
      );
    }
  }
);

// Transfer table order
export const transferTable = createAsyncThunk(
  'tables/transfer',
  async ({ fromTableUuid, toTableUuid }, { rejectWithValue }) => {
    try {
      const response = await tableAPI.transferTable({ fromTableUuid, toTableUuid });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to transfer table'
      );
    }
  }
);

// Get table analytics
export const getTableAnalytics = createAsyncThunk(
  'tables/analytics',
  async (restaurantUuid, { rejectWithValue }) => {
    try {
      const response = await tableAPI.getTableAnalytics(restaurantUuid);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch analytics'
      );
    }
  }
);

// ─────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────
const initialState = {
  tables: [],
  selectedTable: {},
  analytics: null,
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
  filters: {
    status: null,
    section: 'All',
  },
  loading: false,
  actionLoading: false, // For individual actions like merge/transfer
  error: null,
};

// ─────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────
const tableSlice = createSlice({
  name: 'tables',
  initialState,

  reducers: {
    // Clear error state
    clearError: (state) => {
      state.error = null;
    },

    // Set selected table
    setSelectedTable: (state, action) => {
      state.selectedTable = action.payload;
    },

    // Update filter
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
    },

    setSectionFilter: (state, action) => {
      state.filters.section = action.payload;
    },

    // Clear selected table
    clearSelectedTable: (state) => {
      state.selectedTable = null;
    },

    // Optimistic update for table status (for better UX)
    optimisticUpdateTableStatus: (state, action) => {
      const { tableUuid, status } = action.payload;
      const table = state.tables.find(t => t.tableUuid === tableUuid);
      if (table) {
        table.status = status;
      }
    },

    // Reset all tables state
    resetTablesState: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      // Create Table
      .addCase(createTable.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createTable.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.tables.push(action.payload);
      })
      .addCase(createTable.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Update Table
      .addCase(updateTable.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateTable.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.tables.findIndex(t => t.tableUuid === action.payload.tableUuid);
        if (index !== -1) {
          state.tables[index] = action.payload;
        }
        if (state.selectedTable?.tableUuid === action.payload.tableUuid) {
          state.selectedTable = action.payload;
        }
      })
      .addCase(updateTable.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Update Table Status
      .addCase(updateTableStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateTableStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.tables.findIndex(t => t.tableUuid === action.payload.tableUuid);
        if (index !== -1) {
          state.tables[index] = action.payload;
        }
        if (state.selectedTable?.tableUuid === action.payload.tableUuid) {
          state.selectedTable = action.payload;
        }
      })
      .addCase(updateTableStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Get Table By UUID
      .addCase(getTableByUuid.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTableByUuid.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTable = action.payload;
      })
      .addCase(getTableByUuid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get All Tables
      .addCase(getAllTables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllTables.fulfilled, (state, action) => {
        state.loading = false;
        state.tables = action.payload.content || action.payload;
        if (action.payload.pageable) {
          state.pagination = {
            page: action.payload.number,
            size: action.payload.size,
            totalElements: action.payload.totalElements,
            totalPages: action.payload.totalPages,
          };
        }
      })
      .addCase(getAllTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Tables By Restaurant
      .addCase(getTablesByRestaurant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTablesByRestaurant.fulfilled, (state, action) => {
        state.loading = false;
        state.tables = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getTablesByRestaurant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Tables By Chain
      .addCase(getTablesByChain.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTablesByChain.fulfilled, (state, action) => {
        state.loading = false;
        state.tables = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(getTablesByChain.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Table
      .addCase(deleteTable.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteTable.fulfilled, (state, action) => {
        state.actionLoading = false;
        // action.payload contains the deleted tableUuid
        state.tables = state.tables.filter(t => t.tableUuid !== action.payload);
        // Clear selected table if it was deleted
        if (state.selectedTable?.tableUuid === action.payload) {
          state.selectedTable = null;
        }
      })
      .addCase(deleteTable.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Merge Tables
      .addCase(mergeTables.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(mergeTables.fulfilled, (state, action) => {
        state.actionLoading = false;
        // The response contains the updated parent table and child tables
        if (action.payload.parentTable) {
          const index = state.tables.findIndex(t => t.tableUuid === action.payload.parentTable.tableUuid);
          if (index !== -1) {
            state.tables[index] = action.payload.parentTable;
          }
        }
        // Update child tables if provided
        if (action.payload.childTables) {
          action.payload.childTables.forEach(childTable => {
            const childIndex = state.tables.findIndex(t => t.tableUuid === childTable.tableUuid);
            if (childIndex !== -1) {
              state.tables[childIndex] = childTable;
            }
          });
        }
      })
      .addCase(mergeTables.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Transfer Table
      .addCase(transferTable.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(transferTable.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update both source and destination tables
        if (action.payload.fromTable) {
          const fromIndex = state.tables.findIndex(t => t.tableUuid === action.payload.fromTable.tableUuid);
          if (fromIndex !== -1) state.tables[fromIndex] = action.payload.fromTable;
        }
        if (action.payload.toTable) {
          const toIndex = state.tables.findIndex(t => t.tableUuid === action.payload.toTable.tableUuid);
          if (toIndex !== -1) state.tables[toIndex] = action.payload.toTable;
        }
      })
      .addCase(transferTable.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Get Analytics
      .addCase(getTableAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTableAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(getTableAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ─────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────
export const {
  clearError,
  setSelectedTable,
  setStatusFilter,
  setSectionFilter,
  clearSelectedTable,
  optimisticUpdateTableStatus,
  resetTablesState,
} = tableSlice.actions;

// Selectors
export const selectAllTables = (state) => state.tables.tables;
export const selectSelectedTable = (state) => state.tables.selectedTable;
export const selectTableAnalytics = (state) => state.tables.analytics;
export const selectTableLoading = (state) => state.tables.loading;
export const selectTableActionLoading = (state) => state.tables.actionLoading;
export const selectTableError = (state) => state.tables.error;
export const selectTableFilters = (state) => state.tables.filters;
export const selectTablePagination = (state) => state.tables.pagination;

// Derived selectors
export const selectFilteredTables = (state) => {
  const tables = state.tables.tables;
  const { status, section } = state.tables.filters;
  
  let filtered = tables;
  
  if (status && status !== 'ALL') {
    filtered = filtered.filter(t => t.status === status);
  }
  
  if (section && section !== 'All') {
    filtered = filtered.filter(t => t.sectionName === section);
  }
  
  return filtered;
};

export const selectTablesByStatus = createSelector(
  [(state) => state.tables.tables],
  (tables) => ({
    vacant: tables.filter(t => t.status === 'VACANT').length,
    occupied: tables.filter(t => t.status === 'OCCUPIED').length,
    billed: tables.filter(t => t.status === 'BILLED').length,
    dirty: tables.filter(t => t.status === 'DIRTY').length,
    reserved: tables.filter(t => t.status === 'RESERVED').length,
  })
);

// ─────────────────────────────────────────────────────────
// Validation Helpers
// ─────────────────────────────────────────────────────────

/**
 * Get valid next statuses for a given current status
 * @param {string} currentStatus - Current table status
 * @returns {Array<string>} Array of valid next statuses
 */
export const getValidNextStatuses = (currentStatus) => {
  return VALID_STATUS_TRANSITIONS[currentStatus] || [];
};

/**
 * Check if status transition is valid
 * @param {string} currentStatus - Current table status
 * @param {string} newStatus - Desired new status
 * @returns {boolean} Whether transition is valid
 */
export const isValidStatusTransition = (currentStatus, newStatus) => {
  const validStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return validStatuses.includes(newStatus);
};

/**
 * Selector to get valid next statuses for selected table
 */
export const selectValidNextStatuses = createSelector(
  [selectSelectedTable],
  (selectedTable) => {
    if (!selectedTable || !selectedTable.status) return [];
    return getValidNextStatuses(selectedTable.status);
  }
);

export default tableSlice.reducer;
