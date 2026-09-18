import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsAPI } from '../services/api';

export const fetchDashboardAnalytics = createAsyncThunk(
  'analytics/fetchDashboardAnalytics',
  async ({ restaurantUuid, days = 7 }, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getDashboardAnalytics(restaurantUuid, days);
      return response.data;
    } catch (error) {
      // Extract the most descriptive error message from the backend response
      const data = error.response?.data;
      let message = 'Failed to fetch dashboard analytics';

      if (data) {
        // Backend ApiError format: { status, error, message, timestamp, path }
        if (typeof data.message === 'string' && data.message.trim()) {
          message = data.message;
        } else if (typeof data.error === 'string' && data.error.trim()) {
          message = data.error.replace(/_/g, ' ').toLowerCase();
          // Capitalize first letter
          message = message.charAt(0).toUpperCase() + message.slice(1);
        } else if (typeof data === 'string' && data.trim()) {
          message = data;
        }
      } else if (error.message) {
        // Network errors or other axios errors
        if (error.code === 'ERR_NETWORK') {
          message = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.code === 'ECONNABORTED') {
          message = 'The request timed out. Please try again.';
        } else {
          message = error.message;
        }
      }

      return rejectWithValue(message);
    }
  }
);

const initialState = {
  dashboard: null,
  loading: false,
  error: null,
  lastUpdated: null,
  days: 7,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalyticsError: (state) => {
      state.error = null;
    },
    setAnalyticsDays: (state, action) => {
      state.days = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch dashboard analytics';
      });
  },
});

export const { clearAnalyticsError, setAnalyticsDays } = analyticsSlice.actions;

export const selectDashboardAnalytics = (state) => state.analytics.dashboard;
export const selectDashboardAnalyticsLoading = (state) => state.analytics.loading;
export const selectDashboardAnalyticsError = (state) => state.analytics.error;
export const selectDashboardAnalyticsLastUpdated = (state) => state.analytics.lastUpdated;
export const selectDashboardAnalyticsDays = (state) => state.analytics.days;

export default analyticsSlice.reducer;
