# Redux Integration Quick Reference

## Store Structure

```javascript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import tableReducer from './tableSlice';
import productReducer from './productSlice';
import categoryReducer from './categorySlice';
import orderReducer from './orderSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tables: tableReducer,
    products: productReducer,
    categories: categoryReducer,
    orders: orderReducer,
  },
});
```

## How to Use Redux in Components

### 1. Import Required Hooks and Actions

```javascript
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../store/productSlice';
```

### 2. Set Up Component

```javascript
const MyComponent = () => {
  const dispatch = useDispatch();
  
  // Get state from Redux
  const { products, loading, error } = useSelector((state) => state.products);
  const { activeRestaurantId } = useSelector((state) => state.auth);
  
  // Use state and dispatch actions
  useEffect(() => {
    dispatch(fetchProducts({ restaurantUuid: activeRestaurantId }));
  }, [dispatch, activeRestaurantId]);
  
  return (
    // Your JSX
  );
};
```

## Common Patterns

### Pattern 1: Fetch Data on Mount

```javascript
useEffect(() => {
  if (activeRestaurantId) {
    dispatch(fetchProducts({ 
      restaurantUuid: activeRestaurantId,
      includeInactive: false 
    }));
  }
}, [dispatch, activeRestaurantId]);
```

### Pattern 2: Handle Form Submission

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    await dispatch(createProduct({
      restaurantUuid: activeRestaurantId,
      productData: formData,
    })).unwrap(); // unwrap() to get the actual result or throw error
    
    // Success - close modal, reset form, etc.
    handleCloseModal();
  } catch (error) {
    // Error is automatically handled by Redux slice
    console.error('Failed to create product:', error);
  }
};
```

### Pattern 3: Debounced Search

```javascript
const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  if (searchTerm.trim()) {
    const timer = setTimeout(() => {
      dispatch(searchProducts({
        restaurantUuid: activeRestaurantId,
        searchTerm,
      }));
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  } else {
    dispatch(clearSearchResults());
  }
}, [searchTerm, dispatch, activeRestaurantId]);
```

### Pattern 4: Loading and Error States

```javascript
{loading ? (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
  </div>
) : error ? (
  <div className="flex flex-col items-center justify-center h-64 text-red-600">
    <AlertCircle className="h-12 w-12 mb-2" />
    <p>{error}</p>
  </div>
) : products.length === 0 ? (
  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
    <AlertCircle className="h-12 w-12 mb-2" />
    <p>No products found</p>
  </div>
) : (
  // Render products
)}
```

### Pattern 5: Toast Notifications

```javascript
// In component:
const { error, success } = useSelector((state) => state.products);

// Clear messages after 3 seconds
useEffect(() => {
  if (error) {
    const timer = setTimeout(() => dispatch(clearError()), 3000);
    return () => clearTimeout(timer);
  }
}, [error, dispatch]);

useEffect(() => {
  if (success) {
    const timer = setTimeout(() => dispatch(clearSuccess()), 3000);
    return () => clearTimeout(timer);
  }
}, [success, dispatch]);

// In JSX:
{(error || success) && (
  <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
    error ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
  }`}>
    {error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
    <span>{error || success}</span>
  </div>
)}
```

## Product Slice - Complete API

### Actions

```javascript
// Fetch
dispatch(fetchProducts({ restaurantUuid, includeInactive: false }))
dispatch(fetchProductByUuid({ restaurantUuid, productUuid }))
dispatch(fetchProductsByCategory({ restaurantUuid, categoryUuid }))
dispatch(fetchFeaturedProducts(restaurantUuid))
dispatch(fetchBestsellerProducts(restaurantUuid))
dispatch(searchProducts({ restaurantUuid, searchTerm }))

// Create/Update/Delete
dispatch(createProduct({ restaurantUuid, productData }))
dispatch(updateProduct({ restaurantUuid, productUuid, productData }))
dispatch(deleteProduct({ restaurantUuid, productUuid }))

// Toggle
dispatch(toggleProductAvailability({ restaurantUuid, productUuid }))
dispatch(toggleFeaturedStatus({ restaurantUuid, productUuid }))

// State Management
dispatch(setFilter({ category: 'drinks' }))
dispatch(resetFilters())
dispatch(clearSearchResults())
dispatch(clearCurrentProduct())
dispatch(clearError())
dispatch(clearSuccess())
```

### State

```javascript
const { 
  products,              // Array of all products
  currentProduct,        // Single product (for detail view)
  featuredProducts,      // Array of featured products
  bestsellerProducts,    // Array of bestsellers
  searchResults,         // Array of search results
  loading,               // Boolean - main loading state
  actionLoading,         // Boolean - for create/update/delete
  error,                 // String - error message
  success,               // String - success message
  filters,               // Object - current filters
} = useSelector((state) => state.products);
```

## Category Slice - Complete API

### Actions

```javascript
dispatch(fetchCategories(restaurantUuid))
dispatch(fetchCategoryByUuid({ restaurantUuid, categoryUuid }))
dispatch(createCategory({ restaurantUuid, categoryData }))
dispatch(updateCategory({ restaurantUuid, categoryUuid, categoryData }))
dispatch(deleteCategory({ restaurantUuid, categoryUuid }))
dispatch(clearError())
dispatch(clearSuccess())
dispatch(clearCurrentCategory())
```

## Order Slice - Complete API

### Actions

```javascript
// Order Management
dispatch(createOrder(orderData))
dispatch(fetchOrderByUuid(orderUuid))
dispatch(updateOrder({ orderUuid, orderData }))
dispatch(deleteOrder(orderUuid))
dispatch(changeOrderStatus({ orderUuid, newStatus }))
dispatch(cancelOrder({ orderUuid, cancellationReason }))
dispatch(completeOrder(orderUuid))

// Order Items
dispatch(addItemsToOrder({ orderUuid, items }))
dispatch(removeItemFromOrder({ orderUuid, itemUuid }))
dispatch(cancelOrderItem({ orderUuid, itemUuid, reason }))

// Payment & KOT
dispatch(addPayment({ orderUuid, paymentData }))
dispatch(sendKot({ orderUuid, itemUuids }))

// Queries
dispatch(fetchOrdersByRestaurant({ restaurantUuid, params }))
dispatch(fetchOrdersByTable(tableUuid))
dispatch(fetchOrdersByStatus({ restaurantUuid, status }))
dispatch(fetchKitchenOrders(restaurantUuid))
dispatch(fetchOrderAnalytics({ restaurantUuid, startDate, endDate }))

// Cart Management
dispatch(addToCart(product))
dispatch(removeFromCart(productUuid))
dispatch(updateCartQuantity({ uuid, quantity }))
dispatch(clearCart())
dispatch(setCart(cartArray))

// State Management
dispatch(clearError())
dispatch(clearSuccess())
dispatch(clearCurrentOrder())
```

### State

```javascript
const { 
  orders,           // Array of orders
  currentOrder,     // Single order
  kitchenOrders,    // Orders for kitchen display
  analytics,        // Analytics data
  cart,             // Cart items (Array)
  loading,          // Boolean
  actionLoading,    // Boolean
  error,            // String
  success,          // String
  pagination,       // Object { page, size, totalElements, totalPages }
} = useSelector((state) => state.orders);
```

## Order Data Structure Example

```javascript
const orderData = {
  restaurantId: activeRestaurantId,
  tableId: selectedTable.uuid,
  customerName: 'John Doe',
  orderType: 'DINE_IN', // or 'TAKEAWAY', 'DELIVERY'
  notes: 'Extra spicy',
  items: [
    {
      productId: 'product-uuid',
      productVariationId: 'variation-uuid', // optional
      quantity: 2,
      specialInstructions: 'No onions',
      modifiers: [] // array of modifier UUIDs
    }
  ],
  sendKotImmediately: true // boolean
};

// Create order
dispatch(createOrder(orderData));
```

## Product Data Structure Example

```javascript
const productData = {
  name: 'Butter Chicken',
  description: 'Creamy tomato-based chicken curry',
  sku: 'MC001',
  basePrice: 299.00,
  categoryId: 'category-uuid',
  isVeg: false,
  isFeatured: true,
  isAvailable: true,
};

// Create product
dispatch(createProduct({
  restaurantUuid: activeRestaurantId,
  productData,
}));
```

## Cart Management Example

```javascript
// Adding to cart
const handleAddToCart = (product) => {
  dispatch(addToCart(product));
};

// Update quantity
const handleUpdateQuantity = (uuid, delta) => {
  const item = cart.find(item => item.uuid === uuid);
  if (item) {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      dispatch(updateCartQuantity({ uuid, quantity: newQuantity }));
    } else {
      dispatch(removeFromCart(uuid));
    }
  }
};

// Remove from cart
const handleRemove = (uuid) => {
  dispatch(removeFromCart(uuid));
};

// Clear cart (after order placed)
dispatch(clearCart());

// Calculate total
const cartTotal = cart.reduce((sum, item) => {
  const price = item.variations?.[0]?.price || item.basePrice || 0;
  return sum + (price * item.quantity);
}, 0);
```

## Error Handling Best Practices

```javascript
// 1. Use try-catch with unwrap()
try {
  const result = await dispatch(createProduct(data)).unwrap();
  // Handle success
  console.log('Product created:', result);
  handleCloseModal();
} catch (error) {
  // Error is already in Redux state
  console.error('Failed to create product:', error);
  // Optionally show additional UI feedback
}

// 2. Check loading and error states
if (actionLoading) {
  // Show loading spinner
}

if (error) {
  // Show error message
}

// 3. Auto-dismiss messages
useEffect(() => {
  if (error) {
    const timer = setTimeout(() => dispatch(clearError()), 3000);
    return () => clearTimeout(timer);
  }
}, [error, dispatch]);
```

## Performance Tips

1. **Use selectors wisely** - Only subscribe to needed state
```javascript
// Good - only subscribes to products
const products = useSelector((state) => state.products.products);

// Bad - subscribes to entire products slice
const productsSlice = useSelector((state) => state.products);
```

2. **Cleanup in useEffect**
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    // do something
  }, 300);
  
  return () => clearTimeout(timer); // Cleanup
}, [dependency]);
```

3. **Avoid unnecessary API calls**
```javascript
useEffect(() => {
  // Only fetch if we have restaurantId
  if (activeRestaurantId && !products.length) {
    dispatch(fetchProducts({ restaurantUuid: activeRestaurantId }));
  }
}, [dispatch, activeRestaurantId, products.length]);
```

4. **Debounce search inputs**
```javascript
const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  if (searchTerm.trim()) {
    const timer = setTimeout(() => {
      dispatch(searchProducts({ 
        restaurantUuid: activeRestaurantId, 
        searchTerm 
      }));
    }, 300); // Wait 300ms after user stops typing
    
    return () => clearTimeout(timer);
  }
}, [searchTerm]);
```

## Common Issues and Solutions

### Issue: Component not updating after dispatch
**Solution**: Make sure you're using `useSelector` to get the state

### Issue: Infinite loop with useEffect
**Solution**: Check your dependencies array, don't include objects/arrays directly

### Issue: API called multiple times
**Solution**: Use debouncing for search, check loading states before dispatching

### Issue: Error not clearing
**Solution**: Dispatch `clearError()` action after timeout or user action

### Issue: Form not resetting after submit
**Solution**: Reset local state after successful dispatch

---

**Quick Start Checklist:**
- [ ] Import `useDispatch` and `useSelector`
- [ ] Import required actions from slice
- [ ] Get state with `useSelector`
- [ ] Dispatch actions with `dispatch(action(params))`
- [ ] Handle loading and error states
- [ ] Add cleanup in `useEffect` where needed
- [ ] Clear messages after showing them
- [ ] Use `.unwrap()` for error handling in async actions

**Happy Coding! 🚀**
