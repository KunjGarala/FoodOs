import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Search, Plus, Minus, Trash2, ChefHat, Loader2,
  AlertCircle, ShoppingCart, UtensilsCrossed
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
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

  // Helper to calculate totals
  const calculateCartTotal = () => {
    return itemCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // --- Actions ---

  const handleAddToCart = (product, variation = null) => {
    const variationUuid = variation ? variation.variationUuid : (product.variations?.[0]?.variationUuid || null);
    const price = variation ? variation.price : (product.basePrice || 0);
    const variationName = variation ? variation.name : null;

    setItemCart((prev) => {
      const existingMsg = prev.find((i) => 
        i.productUuid === product.productUuid && 
        i.variationUuid === variationUuid
      );

      if (existingMsg) {
        return prev.map((i) =>
          (i.productUuid === product.productUuid && i.variationUuid === variationUuid)
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
      }];
    });
  };

  const handleVariationSelect = (variation) => {
    if (variationSelectionProduct) {
      handleAddToCart(variationSelectionProduct, variation);
      setVariationSelectionProduct(null);
    }
  };

  const handleUpdateQuantity = (productUuid, variationUuid, delta) => {
    setItemCart(prev => prev.map(item => {
        if (item.productUuid === productUuid && item.variationUuid === variationUuid) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
    }).filter(Boolean));
  };

  const handleRemoveItem = (productUuid, variationUuid) => {
    setItemCart(prev => prev.filter(item => 
        !(item.productUuid === productUuid && item.variationUuid === variationUuid)
    ));
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
      modifiers: [],
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
            
            {/* Categories Dropdown */}
            <div className="relative">
                <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="w-full md:w-64 pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer shadow-sm"
                >
                    <option value="all">All Categories</option>
                    {hierarchicalCategories.map(cat => (
                        <option 
                            key={cat.categoryUuid} 
                            value={cat.name}
                            style={{
                                fontWeight: cat.isParent ? '600' : '400',
                                paddingLeft: cat.isParent ? '0.5rem' : '1.5rem'
                            }}
                        >
                            {cat.displayName}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
             {menuLoading ? (
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
                    <div key={`${item.productUuid}-${item.variationUuid}-${idx}`} className="flex flex-col gap-1 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                             <div>
                                <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                                {item.variationName && (
                                    <p className="text-xs text-slate-500">{item.variationName}</p>
                                )}
                            </div>
                            <p className="font-semibold text-slate-900 text-sm">
                                ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                             <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                                <button 
                                    onClick={() => handleUpdateQuantity(item.productUuid, item.variationUuid, -1)} 
                                    className="p-1 hover:bg-white rounded-md shadow-sm transition-all"
                                >
                                    <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                                <button 
                                    onClick={() => handleUpdateQuantity(item.productUuid, item.variationUuid, 1)} 
                                    className="p-1 hover:bg-white rounded-md shadow-sm transition-all"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                            </div>
                            <button
                                onClick={() => handleRemoveItem(item.productUuid, item.variationUuid)}
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

    </div>
  );
};

export default AddOrderItems;
