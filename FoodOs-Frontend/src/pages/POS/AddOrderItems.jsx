import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Search, Plus, Minus, Trash2, Loader2,
  ShoppingCart, Check, Settings2
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import {
  searchProducts as searchProductsAction,
  clearSearchResults,
} from '../../store/productSlice';
import {
  fetchMenu,
} from '../../store/menuSlice';
import {
  fetchTableDetails,
  selectTableDetails,
} from '../../store/tableSlice';
import {
  addItemsToOrder,
} from '../../store/orderSlice';
import { productModifierGroupAPI } from '../../services/api';
import { Pill, BtnPrimary, BtnGhost, Sheet } from '../../components/ui/kit';
import { cn } from '../../utils/cn';

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
  const [showCartSheet, setShowCartSheet] = useState(false);

  // Modifier selection state
  const [modifierSelectionProduct, setModifierSelectionProduct] = useState(null);
  const [modifierSelectionVariation, setModifierSelectionVariation] = useState(null);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [modifierGroupsLoading, setModifierGroupsLoading] = useState(false);
  const [selectedModifiers, setSelectedModifiers] = useState({}); // { [groupUuid]: [modifierUuid, ...] }

  // Redux State
  const { activeRestaurantId } = useSelector((state) => state.auth);
  const { searchResults } = useSelector((state) => state.products);
  const { categories: menuCategories, loading: menuLoading } = useSelector((state) => state.menu);
  const tableDetails = useSelector(selectTableDetails);

  const activeOrder = tableDetails?.activeOrder;

  // Transform menu data to flat arrays for existing UI
  const categories = menuCategories || [];
  const products = menuCategories?.flatMap(category =>
    category.products.map(product => ({
      ...product,
      categoryName: category.name,
      categoryUuid: category.categoryUuid
    }))
  ) || [];

  // Build hierarchical category structure for display
  const buildCategoryHierarchy = () => {
    const result = [];

    // First, add all parent categories (those without parentCategoryUuid)
    categories.forEach(category => {
      if (!category.parentCategoryUuid) {
        result.push({
          ...category,
          isParent: true,
          displayName: category.name
        });

        // Add its subcategories if any
        if (category.subCategories && category.subCategories.length > 0) {
          category.subCategories.forEach(subCat => {
            // Find the full category data for this subcategory
            const fullSubCat = categories.find(c => c.categoryUuid === subCat.categoryUuid);
            if (fullSubCat) {
              result.push({
                ...fullSubCat,
                isParent: false,
                parentName: category.name,
                displayName: `└─ ${fullSubCat.name}` // Indented with tree character
              });
            }
          });
        }
      }
    });

    return result;
  };

  const hierarchicalCategories = buildCategoryHierarchy();

  // 1. Fetch Menu Data
  useEffect(() => {
    if (activeRestaurantId) {
      dispatch(fetchMenu(activeRestaurantId));
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

  // 3. Filter products by active category
  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.categoryName === activeCategory);

  const displayProducts = searchQuery.trim() ? searchResults : filteredProducts;

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

  // --- Render helpers ---

  const cartCount = itemCart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = calculateCartTotal();

  const tableLabel = tableDetails?.tableNumber || tableDetails?.number;

  // ─── Dark cart content (shared between fixed panel + mobile sheet) ───
  const cartBody = (
    <>
      <div className="p-4 border-b border-ink-line flex items-center justify-between">
        <div className="min-w-0">
          <p className="eyebrow text-[10px] text-txt-faintDark">Add to Order</p>
          <h2 className="font-display font-bold text-lg text-txt-light leading-tight flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-marigold" />
            Current Selection
          </h2>
        </div>
        {itemCart.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-xs font-medium text-danger hover:brightness-110 transition"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {itemCart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-txt-mutedDark py-10">
            <div className="bg-ink-card2 p-4 rounded-full mb-3">
              <ShoppingCart className="h-8 w-8 text-txt-faintDark" />
            </div>
            <p className="font-medium text-txt-light">No items selected</p>
            <p className="text-xs mt-1 text-txt-mutedDark">Tap items on the left to add</p>
          </div>
        ) : (
          itemCart.map((item, idx) => {
            const lineTotal = (item.price + (item.modifiers || []).reduce((s, m) => s + (m.priceAdd || 0), 0)) * item.quantity;
            return (
              <div
                key={`cart-${idx}`}
                className="bg-ink-card border border-ink-line rounded-tile p-3 group"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-txt-light text-sm truncate">{item.name}</p>
                    {item.variationName && (
                      <p className="text-xs text-txt-mutedDark">{item.variationName}</p>
                    )}
                    {item.modifiers?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.modifiers.map((m, mi) => (
                          <span
                            key={mi}
                            className="inline-flex items-center text-[10px] text-marigold bg-marigold/[0.12] rounded px-1.5 py-0.5"
                          >
                            +{m.name} {m.priceAdd > 0 && <span className="font-mono ml-0.5">₹{m.priceAdd.toFixed(2)}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="font-display font-bold text-marigold font-mono text-sm whitespace-nowrap">
                    ₹{lineTotal.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-center gap-2 bg-ink-card2 rounded-full p-1">
                    <button
                      onClick={() => handleUpdateQuantity(idx, -1)}
                      className="p-1 rounded-full hover:bg-ink-line transition-colors text-txt-light"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-display font-bold w-5 text-center text-txt-light">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(idx, 1)}
                      className="p-1 rounded-full hover:bg-ink-line transition-colors text-txt-light"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 rounded-md hover:bg-danger/15 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 bg-ink-card2 border-t border-ink-line space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-txt-light">Total</span>
          <span className="font-display font-bold text-2xl text-marigold font-mono">₹{cartTotal.toFixed(2)}</span>
        </div>
        <BtnPrimary
          className="w-full h-11"
          onClick={handleSubmit}
          disabled={itemCart.length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
          ) : (
            <><Plus className="h-4 w-4" /> Add to Order</>
          )}
        </BtnPrimary>
      </div>
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-8rem)] gap-4 lg:gap-6">

      {/* Left: Menu Area (light) */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Header: back + search + categories */}
        <div className="flex flex-col gap-3 sm:gap-4 bg-paper-card p-3 sm:p-4 rounded-card border border-line-light">
          <div className="flex items-center gap-3">
            <BtnGhost
              onClick={() => navigate(-1)}
              className="h-10 w-10 px-0 shrink-0"
              title="Back to table"
            >
              <ArrowLeft className="h-5 w-5" />
            </BtnGhost>
            <div>
              <p className="eyebrow text-[10px] text-txt-faint">Point of Sale</p>
              <h1 className="font-display font-bold text-lg sm:text-xl text-ink-text leading-tight">
                {tableLabel ? `Table ${tableLabel} · Add Items` : 'Add Items'}
              </h1>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-txt-faint" />
            <input
              placeholder="Search items..."
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
              All Categories
            </button>
            {menuLoading ? (
              <div className="flex items-center gap-2 px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-txt-faint" />
                <span className="text-sm text-txt-muted">Loading...</span>
              </div>
            ) : (
              hierarchicalCategories.map(cat => (
                <button
                  key={cat.categoryUuid}
                  onClick={() => setActiveCategory(cat.name)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                    activeCategory === cat.name
                      ? 'bg-marigold text-ink'
                      : 'bg-paper-3 text-txt-muted hover:bg-paper-2',
                    !cat.isParent && 'pl-6'
                  )}
                >
                  {cat.isParent ? cat.name : cat.displayName}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-0">
          {menuLoading ? (
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
                  ? product.variations?.[0]?.price
                  : product.basePrice || 0;

                const isAvailable = product.isActive !== false;
                const initials = (product.name || '?').trim().slice(0, 2).toUpperCase();
                const isVeg = ['VEG', 'VEGAN', 'JAIN'].includes(product.dietaryType);

                // Check if in cart to show badge
                const cartQty = itemCart
                  .filter(i => i.productUuid === product.productUuid)
                  .reduce((s, i) => s + i.quantity, 0);

                return (
                  <div
                    key={product.productUuid}
                    onClick={() => isAvailable && (hasVariations ? setVariationSelectionProduct(product) : handleAddToCart(product))}
                    className={cn(
                      'bg-paper-card rounded-card border border-line-light flex flex-col overflow-hidden group transition-all relative',
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
                      {product.hasModifiers && (
                        <span className="absolute top-2 right-2 text-txt-muted bg-paper-card/80 p-1 rounded" title="Has modifiers">
                          <Settings2 className="h-3.5 w-3.5" />
                        </span>
                      )}
                      {cartQty > 0 && (
                        <div className="absolute bottom-2 right-2 flex items-center justify-center bg-marigold text-ink text-xs font-bold h-6 w-6 rounded-full shadow-card">
                          {cartQty}
                        </div>
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

      {/* Mobile sticky "View selection" bar */}
      {itemCart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-ink border-t border-ink-line">
          <button
            onClick={() => setShowCartSheet(true)}
            className="w-full flex items-center justify-between bg-marigold text-ink rounded-input px-4 py-3 font-semibold"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              View selection · {cartCount} item{cartCount === 1 ? '' : 's'}
            </span>
            <span className="font-display font-bold font-mono">₹{cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Mobile cart Sheet */}
      <Sheet open={showCartSheet} onClose={() => setShowCartSheet(false)} side="bottom" className="bg-ink p-0">
        <div className="flex flex-col max-h-[85vh]">
          {cartBody}
        </div>
      </Sheet>

      {/* Variation Selection Modal */}
      <Modal
        isOpen={!!variationSelectionProduct}
        onClose={() => setVariationSelectionProduct(null)}
        title={`Select Variation: ${variationSelectionProduct?.name}`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
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

      {/* Modifier Selection Modal */}
      <Modal
        isOpen={!!modifierSelectionProduct}
        onClose={() => { setModifierSelectionProduct(null); setModifierSelectionVariation(null); setModifierGroups([]); setSelectedModifiers({}); }}
        title={`Customize: ${modifierSelectionProduct?.name}${modifierSelectionVariation ? ` (${modifierSelectionVariation.name})` : ''}`}
      >
        <div className="space-y-5 max-h-[65vh] overflow-y-auto">
          {modifierGroupsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-marigold" />
              <span className="ml-2 text-sm text-txt-muted">Loading options...</span>
            </div>
          ) : modifierGroups.length === 0 ? (
            <div className="text-center py-6 text-txt-muted">
              <Settings2 className="h-10 w-10 mx-auto mb-2 text-txt-faint" />
              <p className="text-sm text-ink-text font-medium">No modifier options available</p>
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
                      <h4 className="font-semibold text-ink-text text-sm">{group.name}</h4>
                      <p className="text-xs text-txt-muted">
                        {isSingle ? 'Select one' : `Select ${minReq}–${maxReq || '∞'}`}
                        {group.isRequired && <span className="text-danger ml-1">*Required</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMaxReached && (
                        <Pill tone="marigold">Max reached</Pill>
                      )}
                      {!isMinMet && minReq > 0 && (
                        <Pill tone="danger">Pick {minReq - selected.length} more</Pill>
                      )}
                      {selected.length > 0 && (
                        <Pill tone={isMinMet ? 'success' : 'marigold'}>{selected.length}{maxReq ? `/${maxReq}` : ''}</Pill>
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
                          className={cn(
                            'w-full flex items-center justify-between p-2.5 rounded-tile border transition-all text-left',
                            isDisabled
                              ? 'border-line-light bg-paper-2 opacity-50 cursor-not-allowed'
                              : isSelected
                                ? 'border-marigold bg-marigold/[0.1]'
                                : 'border-line-light hover:border-line-input hover:bg-paper-2 cursor-pointer'
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              'h-5 w-5 border-2 flex items-center justify-center transition-colors',
                              isSingle ? 'rounded-full' : 'rounded-md',
                              isSelected ? 'border-marigold bg-marigold' : isDisabled ? 'border-line-light' : 'border-line-input'
                            )}>
                              {isSelected && <Check className="h-3 w-3 text-ink" />}
                            </div>
                            <span className={cn(
                              'text-sm',
                              isSelected ? 'font-semibold text-ink-text' : isDisabled ? 'text-txt-faint' : 'text-txt-muted'
                            )}>
                              {mod.name}
                            </span>
                          </div>
                          {mod.priceAdd > 0 && (
                            <span className={cn(
                              'text-sm font-medium font-mono',
                              isSelected ? 'text-marigold' : isDisabled ? 'text-txt-faint' : 'text-txt-muted'
                            )}>
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
        <div className="flex justify-between items-center pt-4 border-t border-line-light mt-4">
          <div className="text-sm text-txt-muted">
            {modifierGroups.length > 0 && (() => {
              const modTotal = Object.entries(selectedModifiers).reduce((sum, [groupUuid, modUuids]) => {
                const group = modifierGroups.find(g => g.modifierGroupUuid === groupUuid);
                return sum + (modUuids || []).reduce((gs, mUuid) => {
                  const mod = group?.modifiers?.find(m => m.modifierUuid === mUuid);
                  return gs + (mod?.priceAdd || 0);
                }, 0);
              }, 0);
              return modTotal > 0 ? <span className="font-medium font-mono">Extra: +₹{modTotal.toFixed(2)}</span> : null;
            })()}
          </div>
          <div className="flex gap-2">
            <BtnGhost onClick={() => { setModifierSelectionProduct(null); setModifierSelectionVariation(null); setModifierGroups([]); setSelectedModifiers({}); }}>
              Cancel
            </BtnGhost>
            <BtnPrimary onClick={handleConfirmModifiers} disabled={modifierGroupsLoading || (modifierGroups.length > 0 && !isModifierSelectionValid())}>
              <Plus className="h-4 w-4" /> Add to Cart
            </BtnPrimary>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default AddOrderItems;
