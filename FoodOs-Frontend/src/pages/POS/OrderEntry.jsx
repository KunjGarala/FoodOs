import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Plus, Minus, Trash2, ChefHat, CreditCard, Loader2, AlertCircle, CheckCircle, Users, MapPin, ShoppingCart, Send } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import {
  fetchProducts,
  fetchProductsByCategory,
  searchProducts as searchProductsAction,
  clearSearchResults,
} from '../../store/productSlice';
import {
  fetchCategories,
} from '../../store/categorySlice';
import {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  createOrder,
  clearError,
  clearSuccess,
  handleOrderWsEvent,
} from '../../store/orderSlice';
import {
  getTablesByRestaurant,
  handleTableWsEvent,
} from '../../store/tableSlice';
import useWebSocket from '../../hooks/useWebSocket';
import { Pill, BtnPrimary, BtnGhost, Sheet } from '../../components/ui/kit';
import { cn } from '../../utils/cn';

const OrderEntry = () => {
  const dispatch = useDispatch();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [, setShowPaymentModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [variationSelectionProduct, setVariationSelectionProduct] = useState(null);
  const [showCartSheet, setShowCartSheet] = useState(false);

  // Redux State
  const { activeRestaurantId } = useSelector((state) => state.auth);
  const { products, loading: productsLoading, searchResults } = useSelector((state) => state.products);
  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);
  const { cart, actionLoading, error, success } = useSelector((state) => state.orders);
  const { tables, loading: tablesLoading } = useSelector((state) => state.tables);

  // Fetch products, categories, and tables on mount
  useEffect(() => {
    if (activeRestaurantId) {
      dispatch(fetchProducts({ restaurantUuid: activeRestaurantId, includeInactive: false }));
      dispatch(fetchCategories(activeRestaurantId));
      dispatch(getTablesByRestaurant(activeRestaurantId));
    }
  }, [dispatch, activeRestaurantId]);

  // ─── WebSocket: real-time order & table updates ───
  useWebSocket(
    activeRestaurantId ? `/topic/orders/${activeRestaurantId}` : null,
    (data) => dispatch(handleOrderWsEvent(data))
  );
  useWebSocket(
    activeRestaurantId ? `/topic/tables/${activeRestaurantId}` : null,
    (data) => dispatch(handleTableWsEvent(data))
  );

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
    if (product.hasVariations) {
      setVariationSelectionProduct(product);
    } else {
      console.log('Adding to cart:', product);
      dispatch(addToCart(product));
    }
  };

  const handleVariationSelect = (variation) => {
    if (variationSelectionProduct) {
      // Create a product object that looks like what addToCart expects but with specific variation info
      const productWithVariation = {
        ...variationSelectionProduct,
        selectedVariation: variation
      };

      dispatch(addToCart(productWithVariation));
      setVariationSelectionProduct(null);
    }
  };

  const handleUpdateQuantity = (productUuid, variationUuid, delta) => {
    const item = cart.find(item =>
      item.productUuid === productUuid &&
      item.variationUuid === (variationUuid || null)
    );

    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity > 0) {
        dispatch(updateCartQuantity({ productUuid, variationUuid, quantity: newQuantity }));
      } else {
        dispatch(removeFromCart({ productUuid, variationUuid }));
      }
    }
  };

  const handleRemoveFromCart = (productUuid, variationUuid) => {
    dispatch(removeFromCart({ productUuid, variationUuid }));
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
        variationUuid: item.variationUuid || null,
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
      const price = item.price || item.variations?.[0]?.price || item.basePrice || 0;
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
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ─── Dark cart content (shared between fixed panel + mobile sheet) ───
  const cartBody = (
    <>
      <div className="p-4 border-b border-ink-line space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow text-[10px] text-txt-faintDark">New Order</p>
            <h2 className="font-display font-bold text-lg text-txt-light leading-tight">
              {selectedTable ? `Table ${selectedTable.tableNumber || selectedTable.number}` : 'Cart'}
            </h2>
          </div>
          <Pill tone="marigold">{cartCount} item{cartCount === 1 ? '' : 's'}</Pill>
        </div>

        <input
          type="text"
          placeholder="Customer name (optional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full text-sm text-txt-light bg-ink-card border border-ink-line rounded-input px-3 py-2 focus:outline-none focus:ring-2 focus:ring-marigold/50 placeholder:text-txt-faintDark"
        />

        {/* Table Selection */}
        <button
          onClick={() => setShowTableModal(true)}
          className={cn(
            'w-full p-3 rounded-input border transition-all text-left',
            selectedTable
              ? 'bg-success/[0.12] border-success/40 hover:bg-success/[0.18]'
              : 'bg-marigold/[0.12] border-marigold/40 hover:bg-marigold/[0.18]'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded-md', selectedTable ? 'bg-success/20' : 'bg-marigold/20')}>
                <MapPin className={cn('h-4 w-4', selectedTable ? 'text-success-bright' : 'text-marigold')} />
              </div>
              <div>
                <div className={cn('text-[11px] font-medium', selectedTable ? 'text-success-bright' : 'text-marigold')}>
                  {selectedTable ? 'Selected Table' : 'Select Table'}
                </div>
                <div className="text-sm font-bold text-txt-light">
                  {selectedTable ? `Table ${selectedTable.tableNumber || selectedTable.number}` : 'Click to choose'}
                </div>
              </div>
            </div>
            <Pill tone={selectedTable ? 'success' : 'marigold'}>
              {selectedTable ? selectedTable.status : 'Required'}
            </Pill>
          </div>
          {selectedTable?.sectionName && (
            <div className="mt-2 text-xs text-success-bright flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>Section: {selectedTable.sectionName}</span>
            </div>
          )}
        </button>

        <textarea
          placeholder="Order notes (e.g., allergies, preferences)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full text-xs text-txt-light bg-ink-card border border-ink-line rounded-input p-2 focus:outline-none focus:ring-2 focus:ring-marigold/50 focus:border-transparent resize-none placeholder:text-txt-faintDark"
          rows={2}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-txt-mutedDark py-10">
            <div className="bg-ink-card2 p-4 rounded-full mb-3">
              <ShoppingCart className="h-8 w-8 text-txt-faintDark" />
            </div>
            <p className="font-medium text-txt-light">Cart is empty</p>
            <p className="text-xs mt-1 text-txt-mutedDark">Add items to start an order</p>
          </div>
        ) : (
          <>
            {/* Warning for no table selected */}
            {!selectedTable && (
              <div className="bg-marigold/[0.12] border border-marigold/40 rounded-input p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-marigold flex-shrink-0 mt-0.5" />
                <p className="text-xs text-marigold-soft">
                  Please select a table before sending KOT or placing order
                </p>
              </div>
            )}

            {cart.map(item => {
              const price = item.variations?.[0]?.price || item.basePrice || 0;
              return (
                <div
                  key={`${item.productUuid}-${item.variationUuid || 'default'}`}
                  className="bg-ink-card border border-ink-line rounded-tile p-3 group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-txt-light text-sm truncate">{item.name}</p>
                      {item.variationName && (
                        <p className="text-xs text-txt-mutedDark">{item.variationName}</p>
                      )}
                      <p className="text-xs text-txt-faintDark font-mono mt-0.5">₹{price} each</p>
                    </div>
                    <p className="font-display font-bold text-marigold font-mono text-sm whitespace-nowrap">
                      ₹{(price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-2 bg-ink-card2 rounded-full p-1">
                      <button
                        onClick={() => handleUpdateQuantity(item.productUuid, item.variationUuid, -1)}
                        className="p-1 rounded-full hover:bg-ink-line transition-colors text-txt-light"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-sm font-display font-bold w-5 text-center text-txt-light">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productUuid, item.variationUuid, 1)}
                        className="p-1 rounded-full hover:bg-ink-line transition-colors text-txt-light"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.productUuid, item.variationUuid)}
                      className="p-1.5 rounded-md hover:bg-danger/15 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="p-4 bg-ink-card2 border-t border-ink-line space-y-3">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-txt-mutedDark">
            <span>Subtotal</span>
            <span className="font-mono">₹{totals.subtotal}</span>
          </div>
          <div className="flex justify-between text-txt-mutedDark">
            <span>GST (5%)</span>
            <span className="font-mono">₹{totals.tax}</span>
          </div>
          <div className="flex justify-between items-center pt-2.5 border-t border-ink-line">
            <span className="font-semibold text-txt-light">Total</span>
            <span className="font-display font-bold text-2xl text-marigold font-mono">₹{totals.total}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <BtnGhost
            className="w-full bg-ink-card border-ink-line text-txt-light hover:bg-ink-line disabled:opacity-40"
            onClick={handleSendKOT}
            disabled={cart.length === 0 || !selectedTable || actionLoading}
            title={!selectedTable ? 'Please select a table first' : cart.length === 0 ? 'Cart is empty' : 'Send to kitchen'}
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send KOT
          </BtnGhost>
          <BtnPrimary
            className="w-full"
            onClick={handlePlaceOrder}
            disabled={cart.length === 0 || !selectedTable || actionLoading}
            title={!selectedTable ? 'Please select a table first' : cart.length === 0 ? 'Cart is empty' : 'Proceed to payment'}
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Charge
          </BtnPrimary>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-8rem)] gap-4 lg:gap-6">
      {/* Notification Toast */}
      {(error || success) && (
        <div className={cn(
          'fixed top-4 right-4 left-4 sm:left-auto z-[60] p-3 sm:p-4 rounded-card shadow-float flex items-center gap-2 animate-slide-in sm:max-w-sm border',
          error ? 'bg-danger/10 text-danger-deep border-danger/30' : 'bg-success/10 text-success-deep border-success/30'
        )}>
          {error ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle className="h-5 w-5 shrink-0" />}
          <span className="font-medium text-xs sm:text-sm line-clamp-2">{error || success}</span>
        </div>
      )}

      {/* Left: Menu Area (light) */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Header: label + search */}
        <div className="flex flex-col gap-3 sm:gap-4 bg-paper-card p-3 sm:p-4 rounded-card border border-line-light">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-[10px] text-txt-faint">Point of Sale</p>
              <h1 className="font-display font-bold text-lg sm:text-xl text-ink-text leading-tight">
                {selectedTable ? `Table ${selectedTable.tableNumber || selectedTable.number} · New Order` : 'New Order'}
              </h1>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-txt-faint" />
            <input
              placeholder="Search items by name or code..."
              className="w-full pl-10 pr-3 py-2.5 text-sm bg-paper-2 border border-line-input rounded-input text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/50 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                activeCategory === 'all'
                  ? 'bg-marigold text-ink'
                  : 'bg-paper-3 text-txt-muted hover:bg-paper-2'
              )}
            >
              All Items
            </button>
            {categoriesLoading ? (
              <div className="flex items-center gap-2 px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-txt-faint" />
                <span className="text-sm text-txt-muted">Loading...</span>
              </div>
            ) : (
              categories.map(cat => (
                <button
                  key={cat.categoryUuid}
                  onClick={() => setActiveCategory(cat.name)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                    activeCategory === cat.name
                      ? 'bg-marigold text-ink'
                      : 'bg-paper-3 text-txt-muted hover:bg-paper-2'
                  )}
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-0">
          {productsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-marigold" />
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-txt-muted">
              <div className="bg-paper-3 p-4 rounded-full mb-3">
                <Search className="h-10 w-10 text-txt-faint" />
              </div>
              <p className="font-medium text-ink-text">No products found</p>
              <p className="text-xs mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {displayProducts.map(product => {
                const hasVariations = product.hasVariations;
                const price = hasVariations
                  ? product.variations?.[0]?.price // fallback
                  : product.basePrice || 0;

                const isAvailable = product.isActive !== false;
                const initials = (product.name || '?').trim().slice(0, 2).toUpperCase();
                const isVeg = ['VEG', 'VEGAN', 'JAIN'].includes(product.dietaryType);

                return (
                  <div
                    key={product.productUuid}
                    onClick={() => isAvailable && handleAddToCart(product)}
                    className={cn(
                      'bg-paper-card rounded-card border border-line-light flex flex-col overflow-hidden group transition-all',
                      isAvailable
                        ? 'hover:border-marigold hover:shadow-card cursor-pointer active:scale-[0.99]'
                        : 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {/* Image / initials block */}
                    <div className="relative h-24 bg-paper-3 flex items-center justify-center">
                      <span className="font-display font-bold text-2xl text-txt-faint">{initials}</span>
                      <div className={cn(
                        'absolute top-2 left-2 h-4 w-4 rounded-sm border flex items-center justify-center bg-paper-card',
                        isVeg ? 'border-success' : 'border-danger'
                      )}>
                        <div className={cn('h-2 w-2 rounded-full', isVeg ? 'bg-success' : 'bg-danger')} />
                      </div>
                      {product.sku && (
                        <span className="absolute top-2 right-2 text-[10px] text-txt-muted font-mono bg-paper-card/80 px-1.5 py-0.5 rounded">
                          {product.sku}
                        </span>
                      )}
                      {!isAvailable && (
                        <span className="absolute bottom-2 right-2 text-[10px] text-danger-deep font-semibold bg-danger/10 px-1.5 py-0.5 rounded">
                          Unavailable
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-3 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-ink-text line-clamp-2 text-sm leading-tight">{product.name}</h3>
                        {hasVariations ? (
                          <span className="text-[11px] font-medium text-marigold mt-1 inline-block">
                            Select variation
                          </span>
                        ) : (
                          <span className="font-display font-bold text-marigold font-mono text-base mt-1 inline-block">₹{price}</span>
                        )}
                      </div>
                      <div className="shrink-0 h-9 w-9 rounded-full bg-marigold text-ink flex items-center justify-center group-hover:brightness-105 transition">
                        <Plus className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart (dark, fixed width on lg) */}
      <aside className="hidden lg:flex flex-col w-[360px] shrink-0 bg-ink rounded-card border border-ink-line overflow-hidden lg:h-full">
        {cartBody}
      </aside>

      {/* Mobile sticky "View cart" bar */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-ink border-t border-ink-line">
          <button
            onClick={() => setShowCartSheet(true)}
            className="w-full flex items-center justify-between bg-marigold text-ink rounded-input px-4 py-3 font-semibold"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              View cart · {cartCount} item{cartCount === 1 ? '' : 's'}
            </span>
            <span className="font-display font-bold font-mono">₹{totals.total}</span>
          </button>
        </div>
      )}

      {/* Mobile cart Sheet */}
      <Sheet open={showCartSheet} onClose={() => setShowCartSheet(false)} side="bottom" className="bg-ink p-0">
        <div className="flex flex-col max-h-[85vh]">
          {cartBody}
        </div>
      </Sheet>

      {/* Table Selection Modal */}
      <Modal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        title="Select Table"
        size="lg"
      >
        <div className="space-y-4">
          {/* Table Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-success/[0.1] border border-success/30 rounded-card p-3 text-center">
              <div className="font-display text-2xl font-bold text-success-deep">
                {availableTables.length}
              </div>
              <div className="text-xs text-success-deep mt-1">Available</div>
            </div>
            <div className="bg-marigold/[0.12] border border-marigold/30 rounded-card p-3 text-center">
              <div className="font-display text-2xl font-bold text-[#9a6500]">
                {tables.filter(t => t.status === 'OCCUPIED').length}
              </div>
              <div className="text-xs text-[#9a6500] mt-1">Occupied</div>
            </div>
            <div className="bg-paper-3 border border-line-light rounded-card p-3 text-center">
              <div className="font-display text-2xl font-bold text-ink-text">
                {tables.length}
              </div>
              <div className="text-xs text-txt-muted mt-1">Total Active</div>
            </div>
          </div>

          {/* Tables Grid */}
          {tablesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-marigold" />
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-12 text-txt-muted">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-txt-faint" />
              <p className="font-medium text-ink-text">No tables found</p>
              <p className="text-sm mt-1">Please add tables in Table Management</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
                {tables.map((table) => {
                  const isAvailable = table.status === 'VACANT' || table.status === 'OCCUPIED';
                  const statusColor = getStatusColor(table.status);

                  return (
                    <button
                      key={table.tableUuid}
                      onClick={() => isAvailable && handleTableSelect(table)}
                      disabled={!isAvailable}
                      className={cn(
                        'relative p-4 rounded-tile border-2 text-left transition-all',
                        statusColor,
                        isAvailable
                          ? 'hover:shadow-card hover:scale-[1.03] cursor-pointer'
                          : 'opacity-60 cursor-not-allowed',
                        selectedTable?.tableUuid === table.tableUuid
                          ? 'ring-2 ring-marigold ring-offset-2'
                          : ''
                      )}
                    >
                      {/* Table Number */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display text-2xl font-bold">
                          {table.tableNumber || table.number}
                        </span>
                        <Pill tone={table.status === 'VACANT' ? 'success' : 'neutral'}>
                          {table.status}
                        </Pill>
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
                        <div className="absolute top-2 right-2 bg-marigold text-ink rounded-full p-1">
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
          <div className="flex gap-3 pt-4 border-t border-line-light">
            <BtnGhost
              onClick={() => setShowTableModal(false)}
              className="flex-1"
            >
              Cancel
            </BtnGhost>
            <BtnPrimary
              onClick={() => setShowTableModal(false)}
              disabled={!selectedTable}
              className="flex-1"
            >
              Confirm Table
            </BtnPrimary>
          </div>
        </div>
      </Modal>

      {/* Variation Selection Modal */}
      <Modal
        isOpen={!!variationSelectionProduct}
        onClose={() => setVariationSelectionProduct(null)}
        title={`Select Variation: ${variationSelectionProduct?.name}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {variationSelectionProduct?.variations?.map((v) => (
              <button
                key={v.variationUuid}
                onClick={() => handleVariationSelect(v)}
                className="flex justify-between items-center p-4 border border-line-light rounded-tile hover:border-marigold hover:bg-marigold/[0.08] transition-all text-left group"
              >
                <div>
                  <span className="font-semibold text-ink-text block">{v.name}</span>
                  {v.isDefault && <span className="text-xs text-txt-muted">(Default)</span>}
                </div>
                <span className="font-display font-bold text-marigold font-mono">
                  ₹{v.price?.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <BtnGhost onClick={() => setVariationSelectionProduct(null)}>
              Cancel
            </BtnGhost>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderEntry;
