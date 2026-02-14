import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// ─────────────────────────────────────────────────────────
// Async Thunks - Category Management
// ─────────────────────────────────────────────────────────

// Create Category
export const createCategory = createAsyncThunk(
  'categories/create',
  async ({ restaurantUuid, categoryData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/restaurants/${restaurantUuid}/categories/create`,
        categoryData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create category');
    }
  }
);

// Get All Categories
export const fetchCategories = createAsyncThunk(
  'categories/fetchAll',
  async (restaurantUuid, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/restaurants/${restaurantUuid}/categories`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch categories');
    }
  }
);

// Get Category by UUID
export const fetchCategoryByUuid = createAsyncThunk(
  'categories/fetchByUuid',
  async ({ restaurantUuid, categoryUuid }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/restaurants/${restaurantUuid}/categories/${categoryUuid}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch category');
    }
  }
);

// Update Category
export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ restaurantUuid, categoryUuid, categoryData }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/api/restaurants/${restaurantUuid}/categories/${categoryUuid}`,
        categoryData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update category');
    }
  }
);

// Delete Category
export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async ({ restaurantUuid, categoryUuid }, { rejectWithValue }) => {
    try {
      await api.delete(
        `/api/restaurants/${restaurantUuid}/categories/${categoryUuid}`
      );
      return categoryUuid;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete category');
    }
  }
);

// ─────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────
const initialState = {
  categories: [],
  currentCategory: null,
  loading: false,
  actionLoading: false,
  error: null,
  success: null,
};

// ─────────────────────────────────────────────────────────
// Category Slice
// ─────────────────────────────────────────────────────────
const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Category
      .addCase(createCategory.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.categories.push(action.payload);
        state.success = 'Category created successfully';
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Fetch All Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Category by UUID
      .addCase(fetchCategoryByUuid.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryByUuid.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCategory = action.payload;
      })
      .addCase(fetchCategoryByUuid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Category
      .addCase(updateCategory.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.categories.findIndex(c => c.uuid === action.payload.uuid);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
        state.success = 'Category updated successfully';
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Delete Category
      .addCase(deleteCategory.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.categories = state.categories.filter(c => c.uuid !== action.payload);
        state.success = 'Category deleted successfully';
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearSuccess,
  clearCurrentCategory,
} = categorySlice.actions;

export default categorySlice.reducer;
