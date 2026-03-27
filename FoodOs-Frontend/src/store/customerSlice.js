import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// ─────────────────────────────────────────────────────────
// Async Thunks - Customer CRM
// ─────────────────────────────────────────────────────────

// Fetch customers for a restaurant (paginated)
export const fetchCustomers = createAsyncThunk(
  'customers/fetchAll',
  async ({ restaurantUuid, page = 0, size = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/customers/restaurant/${restaurantUuid}?page=${page}&size=${size}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch customers');
    }
  }
);

// Search customers
export const searchCustomers = createAsyncThunk(
  'customers/search',
  async ({ restaurantUuid, query, page = 0, size = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/customers/restaurant/${restaurantUuid}/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to search customers');
    }
  }
);

// Fetch customer detail
export const fetchCustomerDetail = createAsyncThunk(
  'customers/fetchDetail',
  async (customerUuid, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/v1/customers/${customerUuid}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch customer detail');
    }
  }
);

// Update customer CRM data
export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ customerUuid, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/v1/customers/${customerUuid}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update customer');
    }
  }
);

// Fetch CRM stats
export const fetchCrmStats = createAsyncThunk(
  'customers/fetchStats',
  async (restaurantUuid, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/v1/customers/restaurant/${restaurantUuid}/stats`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch CRM stats');
    }
  }
);

// Fetch top spenders
export const fetchTopSpenders = createAsyncThunk(
  'customers/fetchTopSpenders',
  async ({ restaurantUuid, size = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/customers/restaurant/${restaurantUuid}/top-spenders?size=${size}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch top spenders');
    }
  }
);

// Fetch top visitors
export const fetchTopVisitors = createAsyncThunk(
  'customers/fetchTopVisitors',
  async ({ restaurantUuid, size = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/customers/restaurant/${restaurantUuid}/top-visitors?size=${size}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch top visitors');
    }
  }
);

// ─────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────
const customerSlice = createSlice({
  name: 'customers',
  initialState: {
    // List view
    customers: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    
    // Detail view
    selectedCustomer: null,
    
    // Stats
    stats: null,
    
    // Top lists
    topSpenders: [],
    topVisitors: [],
    
    // UI state
    loading: false,
    detailLoading: false,
    statsLoading: false,
    error: null,
    searchQuery: '',
  },
  reducers: {
    clearCustomerDetail(state) {
      state.selectedCustomer = null;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.content || [];
        state.totalElements = action.payload.totalElements || 0;
        state.totalPages = action.payload.totalPages || 0;
        state.currentPage = action.payload.number || 0;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Search Customers
      .addCase(searchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.content || [];
        state.totalElements = action.payload.totalElements || 0;
        state.totalPages = action.payload.totalPages || 0;
        state.currentPage = action.payload.number || 0;
      })
      .addCase(searchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Customer Detail
      .addCase(fetchCustomerDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomerDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedCustomer = action.payload;
      })
      .addCase(fetchCustomerDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })

      // Update Customer
      .addCase(updateCustomer.fulfilled, (state, action) => {
        // Update in list
        const index = state.customers.findIndex(c => c.customerUuid === action.payload.customerUuid);
        if (index >= 0) {
          state.customers[index] = { ...state.customers[index], ...action.payload };
        }
        // Update selected if same
        if (state.selectedCustomer?.customerUuid === action.payload.customerUuid) {
          state.selectedCustomer = { ...state.selectedCustomer, ...action.payload };
        }
      })

      // Fetch CRM Stats
      .addCase(fetchCrmStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchCrmStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchCrmStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload;
      })

      // Top Spenders
      .addCase(fetchTopSpenders.fulfilled, (state, action) => {
        state.topSpenders = action.payload.content || [];
      })

      // Top Visitors
      .addCase(fetchTopVisitors.fulfilled, (state, action) => {
        state.topVisitors = action.payload.content || [];
      });
  },
});

export const { clearCustomerDetail, setSearchQuery, clearError } = customerSlice.actions;
export default customerSlice.reducer;
