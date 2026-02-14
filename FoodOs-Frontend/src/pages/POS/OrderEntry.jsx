import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Plus, Minus, Trash2, ChefHat, CreditCard, Loader2, AlertCircle, CheckCircle, X, Users, MapPin } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  fetchProducts,
  fetchProductsByCategory,
  searchProducts as searchProductsAction,
  clearSearchResults,
  setFilter,
} from '../../store/productSlice';
import {
  fetchCategories,
} from '../../store/categorySlice';
import {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  createOrder,
  sendKot,
  clearError,
  clearSuccess,
} from '../../store/orderSlice';
import {
  getTablesByRestaurant,
} from '../../store/tableSlice';

const OrderEntry = () => {
  const dispatch = useDispatch();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  // Redux State
  const { activeRestaurantId } = useSelector((state) => state.auth);
  const { products, loading: productsLoading, searchResults, filters } = useSelector((state) => state.products);
  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);
  const { cart, loading: orderLoading, actionLoading, error, success } = useSelector((state) => state.orders);
  const { tables, loading: tablesLoading } = useSelector((state) => state.tables);

  // Fetch products, categories, and tables on mount
  useEffect(() => {
    if (activeRestaurantId) {
      dispatch(fetchProducts({ restaurantUuid: activeRestaurantId, includeInactive: false }));
      dispatch(fetchCategories(activeRestaurantId));
      dispatch(getTablesByRestaurant(activeRestaurantId));
    }
  }, [dispatch, activeRestaurantId]);

  // Handle search with debounce
  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        dispatch(searchProductsAction({ restaurantUuid: activeRestaurantId, searchTerm: searchQuery }));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      dispatch(clearSearchResults());
    }
  }, [searchQuery, dispatch, activeRestaurantId]);

  // Handle category filter
  useEffect(() => {
    if (activeRestaurantId && activeCategory !== 'all') {
      const category = categories.find(cat => cat.name === activeCategory);
      if (category) {
        dispatch(fetchProductsByCategory({ 
          restaurantUuid: activeRestaurantId, 
          categoryUuid: category.categoryUuid 
        }));
      }
    } else if (activeRestaurantId && activeCategory === 'all') {
      dispatch(fetchProducts({ restaurantUuid: activeRestaurantId, includeInactive: false }));
    }
  }, [activeCategory, dispatch, activeRestaurantId, categories]);

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

  const displayProducts = searchQuery.trim() ? searchResults : products;

  // Get available tables for selection (only VACANT tables)
  const availableTables = tables.filter(table => table.status === 'VACANT');

  const getStatusColor = (status) => {
    const colors = {
      OCCUPIED: 'bg-amber-50 border-amber-300 text-amber-900',
      VACANT: 'bg-green-50 border-green-300 text-green-900',
      BILLED: 'bg-blue-50 border-blue-300 text-blue-900',
      DIRTY: 'bg-red-50 border-red-300 text-red-900',
      RESERVED: 'bg-purple-50 border-purple-300 text-purple-900',
    };
    return colors[status] || 'bg-slate-50 border-slate-300 text-slate-900';
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setShowTableModal(false);
  };

  const handleAddToCart = (product) => {
    console.log('Adding to cart:', product);
    dispatch(addToCart(product));
  };

  const handleUpdateQuantity = (productUuid, delta) => {
    const item = cart.find(item => item.productUuid === productUuid);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity > 0) {
        dispatch(updateCartQuantity({ productUuid, quantity: newQuantity }));
      } else {
        dispatch(removeFromCart(productUuid));
      }
    }
  };

  const handleRemoveFromCart = (productUuid) => {
    dispatch(removeFromCart(productUuid));
  };

  const handleSendKOT = async () => {
    if (!selectedTable || cart.length === 0) {
      return;
    }

    const orderData = {
      restaurantUuid: activeRestaurantId,
      tableUuid: selectedTable.tableUuid,
      customerName: customerName || 'Guest',
      orderType: 'DINE_IN',
      orderNotes: notes || '',
      items: cart.map(item => ({
        productUuid: item.productUuid,
        variationUuid: item.variations?.[0]?.variationUuid || null,
        quantity: item.quantity,
        itemNotes: '',
        modifiers: []
      })),
      sendKotImmediately: true
    };

    try {
      console.log('Order Data:', orderData);
      
      const result = await dispatch(createOrder(orderData)).unwrap();
      if (result) {
        setCustomerName('');
        setNotes('');
      }
    } catch (error) {
      console.error('Failed to send KOT:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedTable || cart.length === 0) {
      return;
    }

    setShowPaymentModal(true);
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => {
      const price = item.variations?.[0]?.price || item.basePrice || 0;
      return sum + (price * item.quantity);
    }, 0);
    const tax = subtotal * 0.05; // 5% tax
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: (subtotal + tax).toFixed(2),
    };
  };

  const totals = calculateTotal();

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Notification Toast */}
      {(error || success) && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in ${
          error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <span className="font-medium">{error || success}</span>
        </div>
      )}

      {/* Left: Menu Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Search & Categories */}
        <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Search items by name or code..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'all' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Items
            </button>
            {categoriesLoading ? (
              <div className="flex items-center gap-2 px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-slate-500">Loading...</span>
              </div>
            ) : (
              categories.map(cat => (
                <button
                  key={cat.categoryUuid}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.name 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto">
          {productsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <AlertCircle className="h-12 w-12 mb-2" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {displayProducts.map(product => {
                const price = product.variations?.[0]?.price || product.basePrice || 0;
                const isAvailable = product.isActive !== false;
                
                return (
                  <div 
                    key={product.productUuid}
                    onClick={() => isAvailable && handleAddToCart(product)}
                    className={`bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between group h-32 transition-all ${
                      isAvailable 
                        ? 'hover:border-blue-500 hover:shadow-md cursor-pointer' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm">{product.name}</h3>
                      <div className={`h-4 w-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                        ['VEG', 'VEGAN', 'JAIN'].includes(product.dietaryType) ? 'border-green-600' : 'border-red-600'
                      }`}>
                        <div className={`h-2 w-2 rounded-full ${
                          ['VEG', 'VEGAN', 'JAIN'].includes(product.dietaryType) ? 'bg-green-600' : 'bg-red-600'
                        }`} />
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-end">
                      <span className="font-bold text-slate-900">₹{price}</span>
                      {product.sku && (
                        <span className="text-xs text-slate-400 font-mono bg-slate-50 px-1 rounded">
                          {product.sku}
                        </span>
                      )}
                    </div>
                    {!isAvailable && (
                      <span className="text-xs text-red-600 font-medium">Unavailable</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart Summary */}
      <Card className="w-96 flex flex-col h-full border-0 shadow-lg ring-1 ring-slate-200">
        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl space-y-3">
          <div className="flex items-center justify-between">
            <input
              type="text"
              placeholder="Customer Name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="text-sm flex-1 text-slate-800 border-none bg-transparent focus:outline-none focus:ring-0 placeholder:text-slate-400"
            />
          </div>
          
          {/* Table Selection - Prominent Display */}
          <button
            onClick={() => setShowTableModal(true)}
            className={`
              w-full p-3 rounded-lg border-2 transition-all text-left
              ${selectedTable 
                ? 'bg-green-50 border-green-300 hover:bg-green-100' 
                : 'bg-amber-50 border-amber-300 hover:bg-amber-100 animate-pulse'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${selectedTable ? 'bg-green-200' : 'bg-amber-200'}`}>
                  <MapPin className={`h-4 w-4 ${selectedTable ? 'text-green-700' : 'text-amber-700'}`} />
                </div>
                <div>
                  <div className={`text-xs font-medium ${selectedTable ? 'text-green-700' : 'text-amber-700'}`}>
                    {selectedTable ? 'Selected Table' : 'Select Table'}
                  </div>
                  <div className={`text-sm font-bold ${selectedTable ? 'text-green-900' : 'text-amber-900'}`}>
                    {selectedTable ? `Table ${selectedTable.tableNumber || selectedTable.number}` : 'Click to choose'}
                  </div>
                </div>
              </div>
              <Badge variant={selectedTable ? 'success' : 'warning'} className="text-xs">
                {selectedTable ? selectedTable.status : 'Required'}
              </Badge>
            </div>
            {selectedTable?.sectionName && (
              <div className="mt-2 text-xs text-green-700 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>Section: {selectedTable.sectionName}</span>
              </div>
            )}
          </button>
          
          <textarea
            placeholder="Order notes (e.g., allergies, preferences)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs text-slate-600 border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="bg-slate-50 p-4 rounded-full mb-3">
                <CreditCard className="h-8 w-8 text-slate-300" />
              </div>
              <p className="font-medium">Cart is empty</p>
              <p className="text-xs mt-1">Add items to start an order</p>
            </div>
          ) : (
            <>
              {/* Warning for no table selected */}
              {!selectedTable && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Please select a table before sending KOT or placing order
                  </p>
                </div>
              )}
              
              {cart.map(item => {
                const price = item.variations?.[0]?.price || item.basePrice || 0;
                return (
                  <div key={item.productUuid} className="flex gap-3 group">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                        <p className="font-semibold text-slate-900 text-sm">
                          ₹{(price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">₹{price} each</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                          <button 
                            onClick={() => handleUpdateQuantity(item.productUuid, -1)} 
                            className="p-1 hover:bg-white rounded-md shadow-sm transition-all"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => handleUpdateQuantity(item.productUuid, 1)} 
                            className="p-1 hover:bg-white rounded-md shadow-sm transition-all"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.productUuid)}
                          className="p-1 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>₹{totals.subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax (5%)</span>
              <span>₹{totals.tax}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>₹{totals.total}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button 
              variant="outline" 
              className={`w-full border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 ${
                (!selectedTable || cart.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleSendKOT}
              disabled={cart.length === 0 || !selectedTable || actionLoading}
              title={!selectedTable ? 'Please select a table first' : cart.length === 0 ? 'Cart is empty' : 'Send to kitchen'}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ChefHat className="h-4 w-4 mr-2" />
              )}
              Send KOT
            </Button>
            <Button 
              variant="primary" 
              className={`w-full bg-slate-900 hover:bg-slate-800 ${
                (!selectedTable || cart.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || !selectedTable || actionLoading}
              title={!selectedTable ? 'Please select a table first' : cart.length === 0 ? 'Cart is empty' : 'Proceed to payment'}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Charge
            </Button>
          </div>
        </div>
      </Card>

      {/* Table Selection Modal */}
      <Modal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        title="Select Table"
        size="lg"
      >
        <div className="space-y-4">
          {/* Quick Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium">Select a table to place your order</p>
              <p className="text-blue-700 mt-1">Only vacant tables can be selected for new orders</p>
            </div>
          </div>

          {/* Table Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-900">
                {availableTables.length}
              </div>
              <div className="text-xs text-green-700 mt-1">Available</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-900">
                {tables.filter(t => t.status === 'OCCUPIED').length}
              </div>
              <div className="text-xs text-amber-700 mt-1">Occupied</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-slate-900">
                {tables.length}
              </div>
              <div className="text-xs text-slate-700 mt-1">Total Active</div>
            </div>
          </div>

          {/* Tables Grid */}
          {tablesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No tables found</p>
              <p className="text-sm mt-1">Please add tables in Table Management</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
                {tables.map((table) => {
                  const isAvailable = table.status === 'VACANT';
                  const statusColor = getStatusColor(table.status);
                  
                  return (
                    <button
                      key={table.tableUuid}
                      onClick={() => isAvailable && handleTableSelect(table)}
                      disabled={!isAvailable}
                      className={`
                        relative p-4 rounded-xl border-2 text-left transition-all
                        ${statusColor}
                        ${isAvailable 
                          ? 'hover:shadow-lg hover:scale-105 cursor-pointer' 
                          : 'opacity-60 cursor-not-allowed'
                        }
                        ${selectedTable?.tableUuid === table.tableUuid 
                          ? 'ring-2 ring-blue-500 ring-offset-2' 
                          : ''
                        }
                      `}
                    >
                      {/* Table Number */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold">
                          {table.tableNumber || table.number}
                        </span>
                        <Badge 
                          variant={table.status === 'VACANT' ? 'success' : 'default'}
                          className="text-xs"
                        >
                          {table.status}
                        </Badge>
                      </div>

                      {/* Table Info */}
                      <div className="space-y-1">
                        {table.sectionName && (
                          <div className="flex items-center gap-1 text-xs opacity-75">
                            <MapPin className="h-3 w-3" />
                            <span>{table.sectionName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs opacity-75">
                          <Users className="h-3 w-3" />
                          <span>Capacity: {table.capacity}</span>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {selectedTable?.tableUuid === table.tableUuid && isAvailable && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setShowTableModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowTableModal(false)}
              disabled={!selectedTable}
              className="flex-1 bg-slate-900 hover:bg-slate-800"
            >
              Confirm Table
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderEntry;
