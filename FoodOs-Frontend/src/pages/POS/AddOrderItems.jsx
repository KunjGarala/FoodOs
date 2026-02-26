import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Search, Plus, Minus, Trash2, ChefHat, Loader2,
  AlertCircle, ShoppingCart, UtensilsCrossed, Check, Settings2
} from 'lucide-react';
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
} from '../../store/productSlice';
import {
  fetchCategories,
} from '../../store/categorySlice';
import {
  fetchTableDetails,
  selectTableDetails,
} from '../../store/tableSlice';
import {
  addItemsToOrder,
} from '../../store/orderSlice';
import { productModifierGroupAPI } from '../../services/api';

const AddOrderItems = () => {
  const { tableUuid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Local State
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemCart, setItemCart] = useState([]); // Local cart for this session
  const [variationSelectionProduct, setVariationSelectionProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modifier selection state
  const [modifierSelectionProduct, setModifierSelectionProduct] = useState(null);
  const [modifierSelectionVariation, setModifierSelectionVariation] = useState(null);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [modifierGroupsLoading, setModifierGroupsLoading] = useState(false);
  const [selectedModifiers, setSelectedModifiers] = useState({}); // { [groupUuid]: [modifierUuid, ...] }

  // Redux State
  const { activeRestaurantId } = useSelector((state) => state.auth);
  const { products, loading: productsLoading, searchResults } = useSelector((state) => state.products);
  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);
  const tableDetails = useSelector(selectTableDetails);
  
  const activeOrder = tableDetails?.activeOrder;

  // 1. Fetch Initial Data
  useEffect(() => {
    if (activeRestaurantId) {
      dispatch(fetchProducts({ restaurantUuid: activeRestaurantId, includeInactive: false }));
      dispatch(fetchCategories(activeRestaurantId));
    }
    if (tableUuid) {
        dispatch(fetchTableDetails(tableUuid));
    }
  }, [dispatch, activeRestaurantId, tableUuid]);

  // 2. Handle Search
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

  // 3. Handle Category Filter
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

  // Helper to calculate totals (including modifier prices)
  const calculateCartTotal = () => {
    return itemCart.reduce((sum, item) => {
      const modifierTotal = (item.modifiers || []).reduce((ms, m) => ms + (m.priceAdd || 0) * (m.quantity || 1), 0);
      return sum + ((item.price + modifierTotal) * item.quantity);
    }, 0);
  };

  // --- Modifier Logic ---

  const fetchModifierGroups = async (productUuid) => {
    if (!activeRestaurantId) return;
    setModifierGroupsLoading(true);
    try {
      const res = await productModifierGroupAPI.getAll(activeRestaurantId, productUuid);
      const groups = res.data?.data || res.data || [];
      // Only show active groups with active modifiers
      const activeGroups = groups
        .filter(g => g.isActive !== false)
        .map(g => ({ ...g, modifiers: (g.modifiers || []).filter(m => m.isActive !== false) }))
        .filter(g => g.modifiers.length > 0);
      setModifierGroups(activeGroups);
      // Pre-select default modifiers
      const defaults = {};
      activeGroups.forEach(group => {
        const defaultMods = group.modifiers.filter(m => m.isDefault);
        if (defaultMods.length > 0) {
          defaults[group.modifierGroupUuid] = defaultMods.map(m => m.modifierUuid);
        }
      });
      setSelectedModifiers(defaults);
    } catch (err) {
      console.error('Failed to fetch modifier groups:', err);
      setModifierGroups([]);
    } finally {
      setModifierGroupsLoading(false);
    }
  };

  const openModifierSelection = (product, variation = null) => {
    setModifierSelectionProduct(product);
    setModifierSelectionVariation(variation);
    setSelectedModifiers({});
    fetchModifierGroups(product.productUuid);
  };

  const handleModifierToggle = (group, modifierUuid) => {
    setSelectedModifiers(prev => {
      const current = prev[group.modifierGroupUuid] || [];
      const isAlreadySelected = current.includes(modifierUuid);

      if (group.selectionType === 'SINGLE') {
        // Single select: click again to deselect (if not required, or if required allow swap)
        if (isAlreadySelected) {
          // Deselect only if group is not required or has no minSelection requirement
          if (!group.isRequired && (!group.minSelection || group.minSelection === 0)) {
            return { ...prev, [group.modifierGroupUuid]: [] };
          }
          return prev; // Can't deselect required single-select
        }
        return { ...prev, [group.modifierGroupUuid]: [modifierUuid] };
      }

      // Multiple select: toggle
      if (isAlreadySelected) {
        return { ...prev, [group.modifierGroupUuid]: current.filter(id => id !== modifierUuid) };
      }
      // Block if max selection reached
      if (group.maxSelection && current.length >= group.maxSelection) return prev;
      return { ...prev, [group.modifierGroupUuid]: [...current, modifierUuid] };
    });
  };

  // Check if all modifier group requirements are satisfied
  const isModifierSelectionValid = () => {
    for (const group of modifierGroups) {
      const selected = selectedModifiers[group.modifierGroupUuid] || [];
      if (group.isRequired && selected.length < (group.minSelection || 1)) {
        return false;
      }
      if (group.minSelection && selected.length < group.minSelection) {
        return false;
      }
    }
    return true;
  };

  const validateModifierSelection = () => {
    for (const group of modifierGroups) {
      const selected = selectedModifiers[group.modifierGroupUuid] || [];
      if (group.isRequired && selected.length < (group.minSelection || 1)) {
        return `Please select at least ${group.minSelection || 1} option(s) for "${group.name}"`;
      }
      if (group.minSelection && selected.length < group.minSelection) {
        return `Please select at least ${group.minSelection} option(s) for "${group.name}"`;
      }
    }
    return null;
  };

  const handleConfirmModifiers = () => {
    const error = validateModifierSelection();
    if (error) {
      alert(error);
      return;
    }

    // Build modifiers array for cart item
    const modifiers = [];
    modifierGroups.forEach(group => {
      const selected = selectedModifiers[group.modifierGroupUuid] || [];
      selected.forEach(modUuid => {
        const mod = group.modifiers.find(m => m.modifierUuid === modUuid);
        if (mod) {
          modifiers.push({
            modifierUuid: mod.modifierUuid,
            name: mod.name,
            priceAdd: mod.priceAdd || 0,
            groupName: group.name,
            quantity: 1,
          });
        }
      });
    });

    addToCartWithModifiers(modifierSelectionProduct, modifierSelectionVariation, modifiers);
    setModifierSelectionProduct(null);
    setModifierSelectionVariation(null);
    setModifierGroups([]);
    setSelectedModifiers({});
  };

  // --- Actions ---

  const addToCartWithModifiers = (product, variation = null, modifiers = []) => {
    const variationUuid = variation ? variation.variationUuid : (product.variations?.[0]?.variationUuid || null);
    const price = variation ? variation.price : (product.basePrice || 0);
    const variationName = variation ? variation.name : null;

    // Generate a unique key for this combo (product + variation + modifiers)
    const modKey = modifiers.map(m => m.modifierUuid).sort().join(',');

    setItemCart((prev) => {
      const existing = prev.find((i) =>
        i.productUuid === product.productUuid &&
        i.variationUuid === variationUuid &&
        (i.modifiers || []).map(m => m.modifierUuid).sort().join(',') === modKey
      );

      if (existing) {
        return prev.map((i) =>
          (i.productUuid === product.productUuid &&
           i.variationUuid === variationUuid &&
           (i.modifiers || []).map(m => m.modifierUuid).sort().join(',') === modKey)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [...prev, {
        productUuid: product.productUuid,
        name: product.name,
        price: price,
        variationUuid: variationUuid,
        variationName: variationName,
        quantity: 1,
        modifiers: modifiers,
      }];
    });
  };

  const handleAddToCart = async (product, variation = null) => {
    // Always try to fetch modifier groups for the product
    // This handles cases where hasModifiers flag might not be set correctly
    if (product.hasModifiers || product.modifierGroups?.length > 0) {
      openModifierSelection(product, variation);
      return;
    }

    // Try dynamically checking for modifier groups
    try {
      if (activeRestaurantId && product.productUuid) {
        const res = await productModifierGroupAPI.getAll(activeRestaurantId, product.productUuid);
        const groups = res.data?.data || res.data || [];
        const activeGroups = groups
          .filter(g => g.isActive !== false)
          .map(g => ({ ...g, modifiers: (g.modifiers || []).filter(m => m.isActive !== false) }))
          .filter(g => g.modifiers.length > 0);
        if (activeGroups.length > 0) {
          openModifierSelection(product, variation);
          return;
        }
      }
    } catch (err) {
      // If fetch fails, proceed without modifiers
      console.warn('Could not check modifier groups:', err);
    }

    // No modifiers - add directly
    addToCartWithModifiers(product, variation, []);
  };

  const handleVariationSelect = async (variation) => {
    if (variationSelectionProduct) {
      const product = variationSelectionProduct;
      setVariationSelectionProduct(null);

      // Check for modifiers - first by flag, then dynamically
      if (product.hasModifiers || product.modifierGroups?.length > 0) {
        openModifierSelection(product, variation);
        return;
      }

      // Try dynamically checking for modifier groups
      try {
        if (activeRestaurantId && product.productUuid) {
          const res = await productModifierGroupAPI.getAll(activeRestaurantId, product.productUuid);
          const groups = res.data?.data || res.data || [];
          const activeGroups = groups
            .filter(g => g.isActive !== false)
            .map(g => ({ ...g, modifiers: (g.modifiers || []).filter(m => m.isActive !== false) }))
            .filter(g => g.modifiers.length > 0);
          if (activeGroups.length > 0) {
            openModifierSelection(product, variation);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not check modifier groups:', err);
      }

      addToCartWithModifiers(product, variation, []);
    }
  };

  const handleUpdateQuantity = (index, delta) => {
    setItemCart(prev => prev.map((item, idx) => {
        if (idx === index) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
    }).filter(Boolean));
  };

  const handleRemoveItem = (index) => {
    setItemCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleClearCart = () => setItemCart([]);

  const handleSubmit = async () => {
    if (!activeOrder || itemCart.length === 0) return;
    
    setIsSubmitting(true);
    const items = itemCart.map((i) => ({
      productUuid: i.productUuid,
      variationUuid: i.variationUuid || null,
      quantity: i.quantity,
      itemNotes: '',
      modifiers: (i.modifiers || []).map(m => ({
        modifierUuid: m.modifierUuid,
        quantity: m.quantity || 1,
      })),
    }));

    try {
      await dispatch(addItemsToOrder({ orderUuid: activeOrder.orderUuid, items })).unwrap();
      navigate(-1); // Go back to Table Details
    } catch (err) {
      console.error('Failed to add items:', err);
      // Optional: Show error toast here
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- Render ---

  const displayProducts = searchQuery.trim() ? searchResults : products;

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col lg:flex-row gap-3 sm:gap-4 overflow-hidden">
      
      {/* LEFT PANEL: Product Selection */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
        
        {/* Header: Back, Search, Categories */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 z-10 flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2 mr-2">
                    <ArrowLeft className="h-5 w-5 text-slate-600" />
                </Button>
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <Input 
                        placeholder="Search items..." 
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        activeCategory === 'all' 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    All Items
                </button>
                {!categoriesLoading && categories.map(cat => (
                    <button
                        key={cat.categoryUuid}
                        onClick={() => setActiveCategory(cat.name)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            activeCategory === cat.name 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50">
             {productsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <UtensilsCrossed className="h-12 w-12 mb-2" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
              {displayProducts.map(product => {
                const hasVariations = product.hasVariations;
                const price = hasVariations
                  ? product.variations?.[0]?.price 
                  : product.basePrice || 0;
                
                const isAvailable = product.isActive !== false;
                
                // Check if in cart to show badge
                const cartQty = itemCart
                    .filter(i => i.productUuid === product.productUuid)
                    .reduce((s, i) => s + i.quantity, 0);

                return (
                  <button 
                    key={product.productUuid}
                    onClick={() => isAvailable && (hasVariations ? setVariationSelectionProduct(product) : handleAddToCart(product))}
                    disabled={!isAvailable}
                    className={`bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 flex flex-col justify-between group h-28 sm:h-32 transition-all text-left relative overflow-hidden ${
                      isAvailable 
                        ? 'hover:border-blue-500 hover:shadow-md cursor-pointer active:scale-[0.98]' 
                        : 'opacity-60 cursor-not-allowed bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm leading-tight">{product.name}</h3>
                      <div className={`h-3 w-3 rounded-sm border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        ['VEG', 'VEGAN', 'JAIN'].includes(product.dietaryType) ? 'border-green-600' : 'border-red-600'
                      }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${
                          ['VEG', 'VEGAN', 'JAIN'].includes(product.dietaryType) ? 'bg-green-600' : 'bg-red-600'
                        }`} />
                      </div>
                    </div>
                    
                    <div className="mt-auto flex justify-between items-end w-full">
                      {hasVariations ? (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          Select Var.
                        </span>
                      ) : (
                        <span className="font-bold text-slate-900">₹{price}</span>
                      )}
                      {product.hasModifiers && (
                        <Settings2 className="h-3.5 w-3.5 text-slate-400" title="Has modifiers" />
                      )}
                    </div>
                    
                    {cartQty > 0 && (
                        <div className="absolute top-2 right-2 flex items-center justify-center bg-blue-600 text-white text-xs font-bold h-6 w-6 rounded-full shadow-sm">
                            {cartQty}
                        </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Cart Summary */}
      <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm h-[35vh] sm:h-[40vh] lg:h-full">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Current Selection
            </h2>
            {itemCart.length > 0 && (
                <button onClick={handleClearCart} className="text-xs text-red-500 hover:text-red-700 font-medium">
                    Clear All
                </button>
            )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {itemCart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <p className="font-medium text-sm">No items selected</p>
                    <p className="text-xs mt-1">Tap items on the left to add</p>
                </div>
            ) : (
                itemCart.map((item, idx) => (
                    <div key={`cart-${idx}`} className="flex flex-col gap-1 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                             <div>
                                <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                                {item.variationName && (
                                    <p className="text-xs text-slate-500">{item.variationName}</p>
                                )}
                                {item.modifiers?.length > 0 && (
                                    <div className="mt-0.5">
                                      {item.modifiers.map((m, mi) => (
                                        <span key={mi} className="inline-flex items-center text-[10px] text-blue-700 bg-blue-50 rounded px-1.5 py-0.5 mr-1 mb-0.5">
                                          +{m.name} {m.priceAdd > 0 && `₹${m.priceAdd.toFixed(2)}`}
                                        </span>
                                      ))}
                                    </div>
                                )}
                            </div>
                            <p className="font-semibold text-slate-900 text-sm">
                                ₹{((item.price + (item.modifiers || []).reduce((s, m) => s + (m.priceAdd || 0), 0)) * item.quantity).toFixed(2)}
                            </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                             <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                                <button 
                                    onClick={() => handleUpdateQuantity(idx, -1)} 
                                    className="p-1 hover:bg-white rounded-md shadow-sm transition-all"
                                >
                                    <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                                <button 
                                    onClick={() => handleUpdateQuantity(idx, 1)} 
                                    className="p-1 hover:bg-white rounded-md shadow-sm transition-all"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                            </div>
                            <button
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1.5 hover:bg-red-50 rounded-md text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl space-y-3">
            <div className="flex justify-between items-center text-slate-900 font-bold text-lg">
                <span>Total</span>
                <span>₹{calculateCartTotal().toFixed(2)}</span>
            </div>
            <Button
                className="w-full py-3 text-base"
                onClick={handleSubmit}
                disabled={itemCart.length === 0 || isSubmitting}
            >
                {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...</>
                ) : (
                    <><Plus className="h-4 w-4 mr-2" /> Add to Order</>
                )}
            </Button>
        </div>
      </div>

       {/* Variation Selection Modal */}
      <Modal 
        isOpen={!!variationSelectionProduct} 
        onClose={() => setVariationSelectionProduct(null)} 
        title={`Select Variation: ${variationSelectionProduct?.name}`}
      >
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {variationSelectionProduct?.variations?.map((v) => (
              <button
                key={v.variationUuid}
                onClick={() => handleVariationSelect(v)}
                className="w-full flex justify-between items-center p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div>
                  <span className="font-semibold text-slate-800 block text-sm">{v.name}</span>
                  {v.isDefault && <span className="text-xs text-slate-500">(Default)</span>}
                </div>
                <span className="font-bold text-slate-900 group-hover:text-blue-700 text-sm">
                  ₹{v.price?.toFixed(2)}
                </span>
              </button>
            ))}
        </div>
        <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setVariationSelectionProduct(null)}>
              Cancel
            </Button>
        </div>
      </Modal>

      {/* Modifier Selection Modal */}
      <Modal
        isOpen={!!modifierSelectionProduct}
        onClose={() => { setModifierSelectionProduct(null); setModifierSelectionVariation(null); setModifierGroups([]); setSelectedModifiers({}); }}
        title={`Customize: ${modifierSelectionProduct?.name}${modifierSelectionVariation ? ` (${modifierSelectionVariation.name})` : ''}`}
      >
        <div className="space-y-5 max-h-[65vh] overflow-y-auto">
          {modifierGroupsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Loading options...</span>
            </div>
          ) : modifierGroups.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Settings2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No modifier options available</p>
              <p className="text-xs mt-1">This item will be added without customization</p>
            </div>
          ) : (
            modifierGroups.map(group => {
              const selected = selectedModifiers[group.modifierGroupUuid] || [];
              const isSingle = group.selectionType === 'SINGLE';
              const minReq = group.minSelection || (group.isRequired ? 1 : 0);
              const maxReq = group.maxSelection || null;
              const isMaxReached = maxReq && selected.length >= maxReq;
              const isMinMet = selected.length >= minReq;

              return (
                <div key={group.modifierGroupUuid} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{group.name}</h4>
                      <p className="text-xs text-slate-500">
                        {isSingle ? 'Select one' : `Select ${minReq}–${maxReq || '∞'}`}
                        {group.isRequired && <span className="text-red-500 ml-1">*Required</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMaxReached && (
                        <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Max reached</span>
                      )}
                      {!isMinMet && minReq > 0 && (
                        <span className="text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">Pick {minReq - selected.length} more</span>
                      )}
                      {selected.length > 0 && (
                        <Badge variant={isMinMet ? 'success' : 'warning'} size="sm">{selected.length}{maxReq ? `/${maxReq}` : ''}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {group.modifiers.map(mod => {
                      const isSelected = selected.includes(mod.modifierUuid);
                      // Disable if max reached and not already selected
                      const isDisabled = !isSelected && isMaxReached;
                      return (
                        <button
                          key={mod.modifierUuid}
                          onClick={() => !isDisabled && handleModifierToggle(group, mod.modifierUuid)}
                          disabled={isDisabled}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left ${
                            isDisabled
                              ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                              : isSelected
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`h-5 w-5 rounded-${isSingle ? 'full' : 'md'} border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'border-blue-500 bg-blue-500' : isDisabled ? 'border-slate-200' : 'border-slate-300'
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className={`text-sm ${isSelected ? 'font-semibold text-blue-800' : isDisabled ? 'text-slate-400' : 'text-slate-700'}`}>
                              {mod.name}
                            </span>
                          </div>
                          {mod.priceAdd > 0 && (
                            <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : isDisabled ? 'text-slate-300' : 'text-slate-500'}`}>
                              +₹{mod.priceAdd.toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
          <div className="text-sm text-slate-600">
            {modifierGroups.length > 0 && (() => {
              const modTotal = Object.entries(selectedModifiers).reduce((sum, [groupUuid, modUuids]) => {
                const group = modifierGroups.find(g => g.modifierGroupUuid === groupUuid);
                return sum + (modUuids || []).reduce((gs, mUuid) => {
                  const mod = group?.modifiers?.find(m => m.modifierUuid === mUuid);
                  return gs + (mod?.priceAdd || 0);
                }, 0);
              }, 0);
              return modTotal > 0 ? <span className="font-medium">Extra: +₹{modTotal.toFixed(2)}</span> : null;
            })()}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setModifierSelectionProduct(null); setModifierSelectionVariation(null); setModifierGroups([]); setSelectedModifiers({}); }}>
              Cancel
            </Button>
            <Button onClick={handleConfirmModifiers} disabled={modifierGroupsLoading || (modifierGroups.length > 0 && !isModifierSelectionValid())}>
              <Plus className="h-4 w-4 mr-1" /> Add to Cart
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default AddOrderItems;
