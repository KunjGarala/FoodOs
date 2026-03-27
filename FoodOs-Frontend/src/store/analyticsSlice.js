import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsAPI } from '../services/api';

export const fetchDashboardAnalytics = createAsyncThunk(
  'analytics/fetchDashboardAnalytics',
  async ({ restaurantUuid, days = 7 }, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getDashboardAnalytics(restaurantUuid, days);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch dashboard analytics'
      );
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
