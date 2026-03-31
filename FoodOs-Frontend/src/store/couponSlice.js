import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { couponAPI } from '../services/api';
import { setCurrentOrderExternal } from './orderSlice';

const normalizeCode = (code = '') => code.trim().toUpperCase();

const mapReasonToMessage = (reason, minAmount) => {
  if (!reason) return 'Coupon not applicable';
  const msg = reason.toLowerCase();
  if (msg.includes('expired')) return 'Coupon expired';
  if (msg.includes('not started')) return 'Coupon not active yet';
  if (msg.includes('inactive')) return 'Coupon not active yet';
  if (msg.includes('minimum') || msg.includes('below')) {
    if (minAmount) return `Minimum order ₹${Number(minAmount).toFixed(0)} required`;
    return 'Minimum order amount required';
  }
  if (msg.includes('usage limit')) return 'Coupon usage limit reached';
  if (msg.includes('customer')) return 'Coupon usage limit reached for this customer';
  if (msg.includes('restaurant')) return 'Not valid for this outlet';
  if (msg.includes('applicable')) return 'Invalid coupon code';
  return reason;
};

const deriveErrorMessage = (error, minAmount, fallback = 'Something went wrong') => {
  const isNetwork = error?.code === 'ERR_NETWORK' || (!error?.response && error?.request);
  if (isNetwork) return 'Server not responding. Try again.';
  const reason = error?.response?.data?.reason || error?.response?.data?.message || error?.message || fallback;
  return mapReasonToMessage(reason, minAmount);
};

const initialState = {
  code: '',
  discountAmount: 0,
  isApplied: false,
  loading: false,
  removing: false,
  validating: false,
  revalidating: false,
  suggestions: [],
  availableCoupons: [],
  bestCoupon: null,
  error: null,
  message: null,
  warning: null,
  lastOrderAmount: null,
  lastOrderUuid: null,
  lastCartSignature: null,
  autoRemovedReason: null,
  lastValidatedAt: null,
};

export const applyCouponToOrder = createAsyncThunk(
  'coupon/apply',
  async ({ orderUuid, couponCode, customerUuid, cartSignature, orderAmount }, { dispatch, rejectWithValue }) => {
    try {
      const normalized = normalizeCode(couponCode);
      const response = await couponAPI.apply({ orderUuid, couponCode: normalized, customerUuid });
      dispatch(setCurrentOrderExternal(response.data));
      return { order: response.data, couponCode: normalized, cartSignature, orderAmount };
    } catch (error) {
      return rejectWithValue(deriveErrorMessage(error));
    }
  }
);

export const removeCouponFromOrder = createAsyncThunk(
  'coupon/remove',
  async ({ orderUuid, cartSignature, orderAmount }, { dispatch, rejectWithValue }) => {
    try {
      const response = await couponAPI.remove(orderUuid);
      dispatch(setCurrentOrderExternal(response.data));
      return { order: response.data, cartSignature, orderAmount };
    } catch (error) {
      return rejectWithValue(deriveErrorMessage(error));
    }
  }
);

export const validateCouponCode = createAsyncThunk(
  'coupon/validate',
  async ({ couponCode, restaurantUuid, orderAmount, orderUuid, customerUuid }, { rejectWithValue }) => {
    try {
      const normalized = normalizeCode(couponCode);
      const response = await couponAPI.validate({ couponCode: normalized, restaurantUuid, orderAmount, orderUuid, customerUuid });
      return { validation: response.data, code: normalized };
    } catch (error) {
      return rejectWithValue(deriveErrorMessage(error, orderAmount));
    }
  }
);

export const fetchCouponSuggestions = createAsyncThunk(
  'coupon/suggest',
  async ({ restaurantUuid, orderAmount, orderUuid, customerUuid }, { rejectWithValue }) => {
    try {
      const response = await couponAPI.suggest({ restaurantUuid, orderAmount, orderUuid, customerUuid });
      // Suggest endpoint returns a single best coupon response
      return { suggestion: response.data };
    } catch (error) {
      return rejectWithValue(deriveErrorMessage(error, orderAmount));
    }
  }
);

export const revalidateCoupon = createAsyncThunk(
  'coupon/revalidate',
  async ({ couponCode, restaurantUuid, orderAmount, orderUuid, customerUuid, cartSignature }, { dispatch, rejectWithValue }) => {
    try {
      const normalized = normalizeCode(couponCode);
      const response = await couponAPI.validate({ couponCode: normalized, restaurantUuid, orderAmount, orderUuid, customerUuid });
      const validation = response.data;
      if (!validation?.valid) {
        const removal = await couponAPI.remove(orderUuid);
        dispatch(setCurrentOrderExternal(removal.data));
        return { removed: true, reason: validation?.reason, order: removal.data, cartSignature, orderAmount };
      }
      return { removed: false, validation, cartSignature, orderAmount };
    } catch (error) {
      return rejectWithValue(deriveErrorMessage(error, orderAmount));
    }
  }
);

export const fetchAvailableCoupons = createAsyncThunk(
  'coupon/fetchAvailable',
  async ({ restaurantUuid }, { rejectWithValue }) => {
    try {
      const response = await couponAPI.getAll({ restaurantUuid, size: 50, page: 0 });
      const data = response.data;
      // Handle both paginated format { content: [...] } and raw array
      const coupons = data?.content || data || [];
      // Transform to CouponItem-compatible shape
      return coupons
        .filter(c => c.active !== false)
        .map(c => ({
          couponCode: c.code,
          couponName: c.name,
          discountType: c.discountType,
          discountValue: c.discountValue,
          computedDiscount: c.discountValue,
          maxDiscountAmount: c.maxDiscountAmount,
          minOrderAmount: c.minOrderAmount,
          valid: true,
          description: c.description,
        }));
    } catch (error) {
      return rejectWithValue(deriveErrorMessage(error));
    }
  }
);

const couponSlice = createSlice({
  name: 'coupon',
  initialState,
  reducers: {
    setCouponCode: (state, action) => {
      state.code = normalizeCode(action.payload || '');
      state.error = null;
      state.message = null;
    },
    hydrateFromOrder: (state, action) => {
      const { couponCode, discountAmount, orderUuid, cartSignature, orderAmount } = action.payload || {};
      state.code = normalizeCode(couponCode || '');
      state.discountAmount = discountAmount || 0;
      state.isApplied = Boolean(couponCode);
      state.lastOrderUuid = orderUuid || null;
      state.lastCartSignature = cartSignature || null;
      state.lastOrderAmount = orderAmount ?? null;
      state.error = null;
      state.message = null;
      state.autoRemovedReason = null;
      state.warning = null;
    },
    clearCouponFeedback: (state) => {
      state.error = null;
      state.message = null;
      state.warning = null;
      state.autoRemovedReason = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(applyCouponToOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(applyCouponToOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.isApplied = true;
        state.code = action.payload.couponCode;
        state.discountAmount = action.payload.order?.discountAmount || 0;
        state.message = 'Coupon applied';
        state.lastOrderUuid = action.payload.order?.orderUuid || state.lastOrderUuid;
        state.lastOrderAmount = action.payload.orderAmount ?? action.payload.order?.subtotal ?? state.lastOrderAmount;
        state.lastCartSignature = action.payload.cartSignature ?? state.lastCartSignature;
        state.autoRemovedReason = null;
      })
      .addCase(applyCouponToOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to apply coupon';
      })
      .addCase(removeCouponFromOrder.pending, (state) => {
        state.removing = true;
        state.error = null;
        state.message = null;
      })
      .addCase(removeCouponFromOrder.fulfilled, (state, action) => {
        state.removing = false;
        state.isApplied = false;
        state.code = '';
        state.discountAmount = 0;
        state.message = 'Coupon removed';
        state.lastOrderAmount = action.payload.orderAmount ?? action.payload.order?.subtotal ?? state.lastOrderAmount;
        state.lastCartSignature = action.payload.cartSignature ?? state.lastCartSignature;
        state.autoRemovedReason = null;
        state.warning = null;
      })
      .addCase(removeCouponFromOrder.rejected, (state, action) => {
        state.removing = false;
        state.error = action.payload || 'Failed to remove coupon';
      })
      .addCase(validateCouponCode.pending, (state) => {
        state.validating = true;
        state.error = null;
        state.warning = null;
      })
      .addCase(validateCouponCode.fulfilled, (state, action) => {
        state.validating = false;
        state.message = action.payload.validation?.valid ? 'Coupon valid' : mapReasonToMessage(action.payload.validation?.reason);
      })
      .addCase(validateCouponCode.rejected, (state, action) => {
        state.validating = false;
        state.error = action.payload || 'Validation failed';
      })
      .addCase(fetchCouponSuggestions.fulfilled, (state, action) => {
        const suggestion = action.payload.suggestion;
        state.suggestions = suggestion ? [suggestion] : [];
        state.bestCoupon = suggestion && suggestion.valid ? suggestion : null;
      })
      .addCase(fetchCouponSuggestions.rejected, (state) => {
        state.suggestions = [];
        state.bestCoupon = null;
      })
      .addCase(revalidateCoupon.pending, (state) => {
        state.revalidating = true;
        state.warning = 'Cart updated. Coupon revalidated.';
      })
      .addCase(revalidateCoupon.fulfilled, (state, action) => {
        state.revalidating = false;
        state.lastCartSignature = action.payload.cartSignature ?? state.lastCartSignature;
        state.lastOrderAmount = action.payload.orderAmount ?? state.lastOrderAmount;
        if (action.payload.removed) {
          state.isApplied = false;
          state.code = '';
          state.discountAmount = 0;
          state.autoRemovedReason = mapReasonToMessage(action.payload.reason);
        } else {
          state.autoRemovedReason = null;
          state.warning = null;
        }
      })
      .addCase(revalidateCoupon.rejected, (state, action) => {
        state.revalidating = false;
        state.warning = action.payload || 'Could not revalidate coupon';
      })
      .addCase(fetchAvailableCoupons.fulfilled, (state, action) => {
        state.availableCoupons = action.payload || [];
      })
      .addCase(fetchAvailableCoupons.rejected, (state) => {
        state.availableCoupons = [];
      });
  },
});

export const { setCouponCode, hydrateFromOrder, clearCouponFeedback } = couponSlice.actions;
export default couponSlice.reducer;
