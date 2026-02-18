import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// ─────────────────────────────────────────────────────────
// Async Thunks - Order Management
// ─────────────────────────────────────────────────────────

// Create Order
export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/orders', orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create order');
    }
  }
);

// Get Order by UUID
export const fetchOrderByUuid = createAsyncThunk(
  'orders/fetchByUuid',
  async (orderUuid, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/v1/orders/${orderUuid}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch order');
    }
  }
);

// Update Order
export const updateOrder = createAsyncThunk(
  'orders/update',
  async ({ orderUuid, orderData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/v1/orders/${orderUuid}`, orderData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update order');
    }
  }
);

// Delete Order
export const deleteOrder = createAsyncThunk(
  'orders/delete',
  async (orderUuid, { rejectWithValue }) => {
    try {
      await api.delete(`/api/v1/orders/${orderUuid}`);
      return orderUuid;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete order');
    }
  }
);

// Change Order Status
export const changeOrderStatus = createAsyncThunk(
  'orders/changeStatus',
  async ({ orderUuid, newStatus }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/api/v1/orders/${orderUuid}/status?newStatus=${newStatus}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to change order status');
    }
  }
);

// Cancel Order
export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async ({ orderUuid, cancellationReason }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/v1/orders/${orderUuid}/cancel?cancellationReason=${encodeURIComponent(cancellationReason)}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to cancel order');
    }
  }
);

// Complete Order
export const completeOrder = createAsyncThunk(
  'orders/complete',
  async (orderUuid, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/v1/orders/${orderUuid}/complete`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to complete order');
    }
  }
);

// Generate Bill
export const generateBill = createAsyncThunk(
  'orders/generateBill',
  async (orderUuid, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/v1/orders/${orderUuid}/bill`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to generate bill');
    }
  }
);

// Add Items to Order
export const addItemsToOrder = createAsyncThunk(
  'orders/addItems',
  async ({ orderUuid, items }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/v1/orders/${orderUuid}/items`, items);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add items');
    }
  }
);

// Remove Item from Order
export const removeItemFromOrder = createAsyncThunk(
  'orders/removeItem',
  async ({ orderUuid, itemUuid }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/v1/orders/${orderUuid}/items/${itemUuid}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to remove item');
    }
  }
);

// Cancel Order Item
export const cancelOrderItem = createAsyncThunk(
  'orders/cancelItem',
  async ({ orderUuid, itemUuid, reason }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/v1/orders/${orderUuid}/items/${itemUuid}/cancel`,
        { cancellationReason: reason }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to cancel item');
    }
  }
);

// Add Payment
export const addPayment = createAsyncThunk(
  'orders/addPayment',
  async ({ orderUuid, paymentData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/v1/orders/${orderUuid}/payments`,
        paymentData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add payment');
    }
  }
);

// Send KOT (Kitchen Order Ticket)
export const sendKot = createAsyncThunk(
  'orders/sendKot',
  async ({ orderUuid, orderItemUuids }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/v1/orders/${orderUuid}/kot`, {
        orderItemUuids
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to send KOT');
    }
  }
);

// Get Orders by Restaurant
export const fetchOrdersByRestaurant = createAsyncThunk(
  'orders/fetchByRestaurant',
  async ({ restaurantUuid, params }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await api.get(
        `/api/v1/orders/restaurant/${restaurantUuid}?${queryParams}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch orders');
    }
  }
);

// Get Orders by Table
export const fetchOrdersByTable = createAsyncThunk(
  'orders/fetchByTable',
  async (tableUuid, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/v1/orders/table/${tableUuid}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch orders');
    }
  }
);

// Get Orders by Status
export const fetchOrdersByStatus = createAsyncThunk(
  'orders/fetchByStatus',
  async ({ restaurantUuid, status }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/orders/restaurant/${restaurantUuid}/status/${status}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch orders');
    }
  }
);

// Get Kitchen Orders (for Kitchen Display)
export const fetchKitchenOrders = createAsyncThunk(
  'orders/fetchKitchen',
  async (restaurantUuid, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/orders/restaurant/${restaurantUuid}/kitchen`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch kitchen orders');
    }
  }
);

// Get Order Analytics
export const fetchOrderAnalytics = createAsyncThunk(
  'orders/fetchAnalytics',
  async ({ restaurantUuid, startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/orders/analytics/restaurant/${restaurantUuid}?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch analytics');
    }
  }
);

// ─────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────
const initialState = {
  orders: [],
  currentOrder: null,
  kitchenOrders: [],
  analytics: null,
  cart: [],
  loading: false,
  actionLoading: false,
  error: null,
  success: null,
  pagination: {
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  },
};

// ─────────────────────────────────────────────────────────
// Order Slice
// ─────────────────────────────────────────────────────────
const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    // Cart Management
    addToCart: (state, action) => {
      const existing = state.cart.find(item => item.productUuid === action.payload.productUuid);
      console.log('Adding to cart - Product:', action.payload);
      console.log('Existing item:', existing);
      
      if (existing) {
        existing.quantity += 1;
      } else {
        state.cart.push({ ...action.payload, quantity: 1 });
        console.log('Cart after adding:', state.cart);
      }
    },
    removeFromCart: (state, action) => {
      state.cart = state.cart.filter(item => item.productUuid !== action.payload);
    },
    updateCartQuantity: (state, action) => {
      const { productUuid, quantity } = action.payload;
      const item = state.cart.find(item => item.productUuid === productUuid);
      if (item) {
        item.quantity = quantity;
        if (item.quantity <= 0) {
          state.cart = state.cart.filter(item => item.productUuid !== productUuid);
        }
      }
    },
    clearCart: (state) => {
      state.cart = [];
    },
    setCart: (state, action) => {
      state.cart = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.orders.unshift(action.payload);
        state.currentOrder = action.payload;
        state.cart = [];
        state.success = 'Order created successfully';
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Order by UUID
      .addCase(fetchOrderByUuid.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderByUuid.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderByUuid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Order
      .addCase(updateOrder.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.orders.findIndex(o => o.uuid === action.payload.uuid);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        state.currentOrder = action.payload;
        state.success = 'Order updated successfully';
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Delete Order
      .addCase(deleteOrder.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.orders = state.orders.filter(o => o.uuid !== action.payload);
        state.success = 'Order deleted successfully';
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Change Order Status
      .addCase(changeOrderStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(changeOrderStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.orders.findIndex(o => o.uuid === action.payload.uuid);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        state.currentOrder = action.payload;
        state.success = 'Order status updated';
      })
      .addCase(changeOrderStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Cancel Order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o.uuid === action.payload.uuid);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        state.success = 'Order cancelled';
      })
      
      // Complete Order
      .addCase(completeOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o.uuid === action.payload.uuid);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        state.success = 'Order completed';
      })
      
      // Add Items
      .addCase(addItemsToOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o.uuid === action.payload.uuid);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        state.currentOrder = action.payload;
        state.success = 'Items added to order';
      })
      
      // Remove Item
      .addCase(removeItemFromOrder.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
        state.success = 'Item removed from order';
      })
      
      // Send KOT
      .addCase(sendKot.fulfilled, (state, action) => {
        state.success = 'KOT sent to kitchen';
      })
      
      // Generate Bill
      .addCase(generateBill.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(generateBill.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.orders.findIndex(o => o.uuid === action.payload.uuid);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        state.currentOrder = action.payload;
        state.success = 'Bill generated successfully';
      })
      .addCase(generateBill.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Orders by Restaurant
      .addCase(fetchOrdersByRestaurant.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrdersByRestaurant.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.content || action.payload;
        if (action.payload.pageable) {
          state.pagination = {
            page: action.payload.number,
            size: action.payload.size,
            totalElements: action.payload.totalElements,
            totalPages: action.payload.totalPages,
          };
        }
      })
      .addCase(fetchOrdersByRestaurant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Kitchen Orders
      .addCase(fetchKitchenOrders.fulfilled, (state, action) => {
        state.kitchenOrders = action.payload;
      })
      
      // Fetch Analytics
      .addCase(fetchOrderAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      });
  },
});

export const {
  clearError,
  clearSuccess,
  clearCurrentOrder,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  setCart,
} = orderSlice.actions;

export default orderSlice.reducer;
