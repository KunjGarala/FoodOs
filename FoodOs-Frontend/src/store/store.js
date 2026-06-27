import { configureStore } from '@reduxjs/toolkit';
import authReducer           from './authSlice';
import tableReducer          from './tableSlice';
import productReducer        from './productSlice';
import categoryReducer       from './categorySlice';
import menuReducer           from './menuSlice';
import orderReducer          from './orderSlice';
import variationReducer      from './variationSlice';
import modifierGroupReducer  from './modifierGroupSlice';
import modifierReducer       from './modifierSlice';
import customerReducer       from './customerSlice';
import couponReducer         from './couponSlice';
import analyticsReducer from './analyticsSlice';
import { setupInterceptors } from '../services/api';

// ─────────────────────────────────────────────────────────
// Middleware: keeps the Axios interceptor queue in sync with
// auth lifecycle events.  When the user logs out (or a fresh
// login starts), any requests that were queued waiting for a
// token refresh are immediately rejected so they don't replay
// with a stale or wrong token.
// ─────────────────────────────────────────────────────────
const interceptorSyncMiddleware = () => (next) => (action) => {
  if (action.type === 'auth/logout' || action.type === 'auth/login/pending') {
    // Dynamic import keeps the bundle lean — api.js is already loaded by this
    // point in practice, so the import resolves from the module cache instantly.
    import('../services/api').then(({ default: api }) => {
      // Reset default Authorization header so the next request doesn't send
      // a stale token before the interceptor has a chance to attach the new one.
      delete api.defaults.headers.common.Authorization;
    });
  }
  return next(action);
};

// ─────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: {
    auth: authReducer,
    tables: tableReducer,
    products: productReducer,
    menu: menuReducer,
    categories: categoryReducer,
    orders: orderReducer,
    variations: variationReducer,
    modifierGroups: modifierGroupReducer,
    modifiers: modifierReducer,
    customers: customerReducer,
    coupon: couponReducer,
    analytics: analyticsReducer,
  },
  middleware: (getDefault) => getDefault().concat(interceptorSyncMiddleware),
});

// Give the Axios interceptors a reference to the store so they can
// dispatch updateTokenAndRole / logout after a refresh attempt.
setupInterceptors(store);

export default store;