import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// ─────────────────────────────────────────────────────────
// Async Thunks - Product Management
// ─────────────────────────────────────────────────────────

// Create Product
export const createProduct = createAsyncThunk(
  'products/create',
  async ({ restaurantUuid, productData }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('product', new Blob([JSON.stringify(productData)], { type: 'application/json' }));
      
      const response = await api.post(
        `/api/restaurants/${restaurantUuid}/products/create`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create product');
    }
  }
);

// Get All Products
export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async ({ restaurantUuid, includeInactive = false }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/restaurants/${restaurantUuid}/products?includeInactive=${includeInactive}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch products');
    }
  }
);

// Get Product by UUID
export const fetchProductByUuid = createAsyncThunk(
  'products/fetchByUuid',
  async ({ restaurantUuid, productUuid }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/restaurants/${restaurantUuid}/products/${productUuid}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch product');
    }
  }
);

// Get Products by Category
export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchByCategory',
  async ({ restaurantUuid, categoryUuid }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/restaurants/${restaurantUuid}/products/category/${categoryUuid}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch products');
    }
  }
);

// Get Featured Products
export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeatured',
  async (restaurantUuid, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/restaurants/${restaurantUuid}/products/featured`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch featured products');
    }
  }
);

// Get Bestseller Products
export const fetchBestsellerProducts = createAsyncThunk(
  'products/fetchBestsellers',
  async (restaurantUuid, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/restaurants/${restaurantUuid}/products/bestsellers`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch bestseller products');
    }
  }
);

// Search Products
export const searchProducts = createAsyncThunk(
  'products/search',
  async ({ restaurantUuid, searchTerm }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/restaurants/${restaurantUuid}/products/search?q=${encodeURIComponent(searchTerm)}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to search products');
    }
  }
);

// Update Product
export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ restaurantUuid, productUuid, productData }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/api/restaurants/${restaurantUuid}/products/${productUuid}`,
        productData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update product');
    }
  }
);

// Delete Product
export const deleteProduct = createAsyncThunk(
  'products/delete',
  async ({ restaurantUuid, productUuid }, { rejectWithValue }) => {
    try {
      await api.delete(
        `/api/restaurants/${restaurantUuid}/products/${productUuid}`
      );
      return productUuid;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete product');
    }
  }
);

// Toggle Product Availability
export const toggleProductAvailability = createAsyncThunk(
  'products/toggleAvailability',
  async ({ restaurantUuid, productUuid }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/api/restaurants/${restaurantUuid}/products/${productUuid}/availability`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to toggle availability');
    }
  }
);

// Toggle Featured Status
export const toggleFeaturedStatus = createAsyncThunk(
  'products/toggleFeatured',
  async ({ restaurantUuid, productUuid }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/api/restaurants/${restaurantUuid}/products/${productUuid}/featured`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to toggle featured status');
    }
  }
);

// ─────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────
const initialState = {
  products: [],
  currentProduct: null,
  featuredProducts: [],
  bestsellerProducts: [],
  searchResults: [],
  loading: false,
  actionLoading: false,
  error: null,
  success: null,
  filters: {
    category: 'all',
    searchTerm: '',
    includeInactive: false,
  },
};

// ─────────────────────────────────────────────────────────
// Product Slice
// ─────────────────────────────────────────────────────────
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.products.unshift(action.payload);
        state.success = 'Product created successfully';
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Fetch All Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Product by UUID
      .addCase(fetchProductByUuid.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductByUuid.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductByUuid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Products by Category
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Featured Products
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.featuredProducts = action.payload;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Bestseller Products
      .addCase(fetchBestsellerProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBestsellerProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.bestsellerProducts = action.payload;
      })
      .addCase(fetchBestsellerProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Search Products
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.products.findIndex(p => p.uuid === action.payload.uuid);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        state.success = 'Product updated successfully';
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.products = state.products.filter(p => p.uuid !== action.payload);
        state.success = 'Product deleted successfully';
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Toggle Availability
      .addCase(toggleProductAvailability.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(toggleProductAvailability.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.products.findIndex(p => p.uuid === action.payload.uuid);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        state.success = 'Product availability updated';
      })
      .addCase(toggleProductAvailability.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Toggle Featured
      .addCase(toggleFeaturedStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(toggleFeaturedStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.products.findIndex(p => p.uuid === action.payload.uuid);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        state.success = 'Featured status updated';
      })
      .addCase(toggleFeaturedStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearSuccess,
  setFilter,
  resetFilters,
  clearSearchResults,
  clearCurrentProduct,
} = productSlice.actions;

export default productSlice.reducer;
