import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import VariationManagerModal from '../../components/VariationManagerModal';
import ModifierGroupAssignmentModal from '../../components/ModifierGroupAssignmentModal';
import { 
  Edit2, Trash2, Plus, Loader2, AlertCircle, CheckCircle, 
  Star, ChevronDown, ChevronRight, Clock, Thermometer, 
  Calendar, Info, Tag, Hash, 
  DollarSign, Package, Search, TrendingUp, Grid
} from 'lucide-react';
import {
  fetchProducts,
  deleteProduct,
  toggleProductAvailability,
  toggleFeaturedStatus,
  clearError,
  clearSuccess,
  optimisticToggleFeatured,
  optimisticToggleAvailability,
} from '../../store/productSlice';
import {
  fetchCategories,
} from '../../store/categorySlice';

const MenuManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedProductIds, setExpandedProductIds] = useState(new Set());
  const [variationModalProduct, setVariationModalProduct] = useState(null);
  const [modifierGroupModalProduct, setModifierGroupModalProduct] = useState(null);

  const toggleProductExpansion = (productUuid) => {
    const newExpanded = new Set(expandedProductIds);
    if (newExpanded.has(productUuid)) {
      newExpanded.delete(productUuid);
    } else {
      newExpanded.add(productUuid);
    }
    setExpandedProductIds(newExpanded);
  };

  // Redux state
  const { activeRestaurantId } = useSelector((state) => state.auth);
  const { products, loading, actionLoading, error, success } = useSelector((state) => state.products);
  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);

  // Fetch products and categories on mount
  useEffect(() => {
    if (activeRestaurantId) {
      dispatch(fetchProducts({ restaurantUuid: activeRestaurantId, includeInactive: true }));
      dispatch(fetchCategories(activeRestaurantId));
    }
  }, [dispatch, activeRestaurantId]);

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

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        sku: product.sku || '',
        foodCode: product.foodCode || '',
        basePrice: product.basePrice || '',
        costPrice: product.costPrice || '',
        categoryUuid: product.categoryUuid || '',
        dietaryType: product.dietaryType || 'VEG',
        preparationTime: product.preparationTime || '',
        spiceLevel: product.spiceLevel || '',
        isFeatured: product.isFeatured || false,
        isBestseller: product.isBestseller || false,
        isActive: product.isActive !== false,
        sortOrder: product.sortOrder || 0,
        availableFrom: product.availableFrom || '',
        availableTo: product.availableTo || '',
        availableDays: product.availableDays ? product.availableDays.split(',') : [],
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        sku: '',
        foodCode: '',
        basePrice: '',
        costPrice: '',
        categoryUuid: '',
        dietaryType: 'VEG',
        preparationTime: '',
        spiceLevel: '',
        isFeatured: false,
        isBestseller: false,
        isActive: true,
        sortOrder: 0,
        availableFrom: '',
        availableTo: '',
        availableDays: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      sku: '',
      foodCode: '',
      basePrice: '',
      costPrice: '',
      categoryUuid: '',
      dietaryType: 'VEG',
      preparationTime: '',
      spiceLevel: '',
      isFeatured: false,
      isBestseller: false,
      isActive: true,
      sortOrder: 0,
      availableFrom: '',
      availableTo: '',
      availableDays: [],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      description: formData.description || undefined,
      sku: formData.sku || undefined,
      foodCode: formData.foodCode || undefined,
      basePrice: parseFloat(formData.basePrice),
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
      categoryUuid: formData.categoryUuid,
      dietaryType: formData.dietaryType,
      preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : undefined,
      spiceLevel: formData.spiceLevel ? parseInt(formData.spiceLevel) : undefined,
      isFeatured: formData.isFeatured,
      isBestseller: formData.isBestseller,
      isActive: formData.isActive,
      sortOrder: formData.sortOrder ? parseInt(formData.sortOrder) : 0,
      availableFrom: formData.availableFrom || undefined,
      availableTo: formData.availableTo || undefined,
      availableDays: formData.availableDays.length > 0 ? formData.availableDays.join(',') : undefined,
    };

    try {
      if (editingProduct) {
        await dispatch(updateProduct({
          restaurantUuid: activeRestaurantId,
          productUuid: editingProduct.productUuid,
          productData,
        })).unwrap();
      } else {
        await dispatch(createProduct({
          restaurantUuid: activeRestaurantId,
          productData,
        })).unwrap();
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleDelete = async (productUuid) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await dispatch(deleteProduct({
          restaurantUuid: activeRestaurantId,
          productUuid,
        })).unwrap();
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handleToggleAvailability = (productUuid) => {
    // Optimistic update - instantly reflect in UI
    dispatch(optimisticToggleAvailability(productUuid));
    // Fire backend call - on success it syncs, on failure it reverts
    dispatch(toggleProductAvailability({
      restaurantUuid: activeRestaurantId,
      productUuid,
    }));
  };

  const handleToggleFeatured = (productUuid) => {
    // Optimistic update - instantly reflect in UI
    dispatch(optimisticToggleFeatured(productUuid));
    // Fire backend call - on success it syncs, on failure it reverts
    dispatch(toggleFeaturedStatus({
      restaurantUuid: activeRestaurantId,
      productUuid,
    }));
  };

  // Flatten categories to include both parent and child categories
  const flattenCategories = (categories) => {
    const flattened = [];
    categories.forEach(category => {
      // Add parent category
      flattened.push({
        categoryUuid: category.categoryUuid || category.uuid,
        name: category.name,
        isParent: true
      });
      
      // Add child categories if they exist
      if (category.subCategories && category.subCategories.length > 0) {
        category.subCategories.forEach(subCategory => {
          flattened.push({
            categoryUuid: subCategory.categoryUuid,
            name: `  └─ ${subCategory.name}`, // Indented to show hierarchy
            isParent: false,
            parentName: category.name
          });
        });
      }
    });
    return flattened;
  };

  const allCategories = flattenCategories(categories);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = 
      categoryFilter === 'all' || 
      product.categoryUuid === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Helper to format dietary type
  const getDietaryLabel = (type) => {
    const map = {
      'VEG': 'Veg',
      'NON_VEG': 'Non-Veg',
      'VEGAN': 'Vegan',
      'GLUTEN_FREE': 'Gluten Free',
      'DAIRY_FREE': 'Dairy Free'
    };
    return map[type] || type;
  };

  // Helper to render availability schedule
  const renderAvailability = (product) => {
    const days = product.availableDays ? product.availableDays.split(',') : [];
    const from = product.availableFrom;
    const to = product.availableTo;
    
    if (days.length === 0 && !from && !to) {
      return <span className="text-slate-400 italic">Always available</span>;
    }
    
    return (
      <div className="space-y-1">
        {days.length > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>{days.map(d => d.substring(0,3)).join(', ')}</span>
          </div>
        )}
        {(from || to) && (
          <div className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>{from || '00:00'} - {to || '23:59'}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Notification Toast */}
      {(error || success) && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in ${
          error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <span className="font-medium">{error || success}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Menu Management</h1>
          <p className="text-sm text-slate-500">Manage your items, categories and pricing</p>
        </div>
        <Button onClick={() => navigate('/app/menu/new')} disabled={actionLoading} className="self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Input 
              placeholder="Search by name, SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
          <select
            className="px-4 py-2 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {allCategories.map(cat => (
              <option key={cat.categoryUuid} value={cat.categoryUuid}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <AlertCircle className="h-12 w-12 mb-2" />
              <p>No products found</p>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredProducts.map(product => {
                  const price = product.basePrice || 0;
                  const isActive = product.isActive !== false;
                  const isExpanded = expandedProductIds.has(product.productUuid);

                  return (
                    <div key={product.productUuid} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <button
                            onClick={() => toggleProductExpansion(product.productUuid)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 mt-0.5 shrink-0"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          <div className="min-w-0">
                            <span className="font-medium text-slate-900 block truncate">{product.name}</span>
                            {product.sku && <span className="text-xs text-slate-400 font-mono">{product.sku}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggleFeatured(product.productUuid)}
                            disabled={actionLoading}
                            className="p-1.5 hover:bg-slate-100 rounded"
                          >
                            <Star className={`h-4 w-4 ${product.isFeatured ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                          </button>
                          <button
                            onClick={() => navigate(`/app/menu/${product.productUuid}/edit`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.productUuid)}
                            disabled={actionLoading}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2 ml-7">
                        <span className="font-semibold text-slate-900">₹{price}</span>
                        <span className="text-slate-300">·</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          product.dietaryType === 'VEG' || product.dietaryType === 'VEGAN'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {getDietaryLabel(product.dietaryType)}
                        </span>
                        <button onClick={() => handleToggleAvailability(product.productUuid)} disabled={actionLoading}>
                          <Badge variant={isActive ? 'success' : 'danger'} className="text-xs">
                            {isActive ? 'Available' : 'Unavailable'}
                          </Badge>
                        </button>
                        {product.categoryName && <Badge variant="outline" className="text-xs">{product.categoryName}</Badge>}
                      </div>

                      {/* Mobile expanded details */}
                      {isExpanded && (
                        <div className="mt-3 ml-7 space-y-3 bg-slate-50 rounded-lg p-3">
                          {product.description && <p className="text-sm text-slate-600">{product.description}</p>}
                          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                            {product.preparationTime && <span>Prep: {product.preparationTime}min</span>}
                            {product.spiceLevel && <span>Spice: {product.spiceLevel}/5</span>}
                            {product.costPrice && <span>Cost: ₹{product.costPrice}</span>}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {product.isBestseller && <Badge variant="success" className="text-xs">Bestseller</Badge>}
                            {product.hasVariations && <Badge variant="info" className="text-xs">Variations</Badge>}
                            {product.hasModifiers && <Badge variant="info" className="text-xs">Modifiers</Badge>}
                          </div>
                          {product.variations && product.variations.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-700 mb-1">Variations</p>
                              <div className="space-y-1">
                                {product.variations.map(v => (
                                  <div key={v.variationUuid} className="flex justify-between bg-white rounded px-2 py-1 text-xs">
                                    <span>{v.name}{v.isDefault && ' ★'}</span>
                                    <span className="font-medium">₹{v.price}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop table view */}
              <table className="hidden md:table w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                <tr>
                  <th className="px-6 py-3 w-10"></th>
                  <th className="px-6 py-3">Item Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Featured</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(product => {
                  const price = product.basePrice || 0;
                  const isActive = product.isActive !== false;
                  
                  return (
                    <React.Fragment key={product.productUuid}>
                      <tr className={`hover:bg-slate-50 transition-colors ${expandedProductIds.has(product.productUuid) ? 'bg-slate-50' : ''}`}>
                        <td className="px-6 py-3">
                          <button 
                            onClick={() => toggleProductExpansion(product.productUuid)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500"
                          >
                            {expandedProductIds.has(product.productUuid) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-900">
                          <div className="flex flex-col">
                            <span>{product.name}</span>
                            {product.sku && (
                              <span className="text-xs text-slate-400 font-mono">{product.sku}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          {product.categoryName || 'Uncategorized'}
                        </td>
                        <td className="px-6 py-3 font-semibold">₹{price}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            product.dietaryType === 'VEG' || product.dietaryType === 'VEGAN'
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {getDietaryLabel(product.dietaryType)}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => handleToggleAvailability(product.productUuid)}
                            disabled={actionLoading}
                          >
                            <Badge variant={isActive ? 'success' : 'danger'}>
                              {isActive ? 'Available' : 'Unavailable'}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={() => handleToggleFeatured(product.productUuid)}
                            disabled={actionLoading}
                            className="p-1 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Star 
                              className={`h-5 w-5 ${
                                product.isFeatured 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-slate-400 hover:text-blue-600"
                              onClick={() => navigate(`/app/menu/${product.productUuid}/edit`)}
                              disabled={actionLoading}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-slate-400 hover:text-red-600"
                              onClick={() => handleDelete(product.productUuid)}
                              disabled={actionLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedProductIds.has(product.productUuid) && (
                        <tr className="bg-slate-50/50">
                          <td colSpan="8" className="px-6 py-4 border-t border-slate-100">
                            <div className="space-y-6">
                              {/* Product Details Section */}
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left column: Basic info */}
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                                    <Info className="h-4 w-4" /> Product Details
                                  </h4>
                                  
                                  {product.description ? (
                                    <div className="text-sm text-slate-600 bg-white p-3 rounded border border-slate-200">
                                      {product.description}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-slate-400 italic">No description</p>
                                  )}

                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    {product.foodCode && (
                                      <div className="flex items-center gap-1 text-slate-600">
                                        <Hash className="h-3 w-3 text-slate-400" />
                                        <span className="text-xs">Food Code: {product.foodCode}</span>
                                      </div>
                                    )}
                                    {product.costPrice && (
                                      <div className="flex items-center gap-1 text-slate-600">
                                        <DollarSign className="h-3 w-3 text-slate-400" />
                                        <span className="text-xs">Cost: ₹{product.costPrice}</span>
                                      </div>
                                    )}
                                    {product.sortOrder !== undefined && (
                                      <div className="flex items-center gap-1 text-slate-600">
                                        <Tag className="h-3 w-3 text-slate-400" />
                                        <span className="text-xs">Sort Order: {product.sortOrder}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Middle column: Time & Availability */}
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                                    <Clock className="h-4 w-4" /> Time & Availability
                                  </h4>
                                  
                                  <div className="space-y-2 text-sm">
                                    {product.preparationTime && (
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        <span>Prep time: {product.preparationTime} min</span>
                                      </div>
                                    )}
                                    {product.spiceLevel && (
                                      <div className="flex items-center gap-2">
                                        <Thermometer className="h-4 w-4 text-slate-400" />
                                        <span>Spice level: {product.spiceLevel}/5</span>
                                      </div>
                                    )}
                                    <div className="border-t border-slate-200 my-2"></div>
                                    {renderAvailability(product)}
                                  </div>
                                </div>

                                {/* Right column: Status badges */}
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                                    <CheckCircle className="h-4 w-4" /> Status
                                  </h4>
                                  
                                  <div className="flex flex-wrap gap-2">
                                    {product.isFeatured && (
                                      <Badge variant="warning" className="flex items-center gap-1">
                                        <Star className="h-3 w-3" /> Featured
                                      </Badge>
                                    )}
                                    {product.isBestseller && (
                                      <Badge variant="success" className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" /> Bestseller
                                      </Badge>
                                    )}
                                    {product.hasVariations && (
                                      <Badge variant="info">Has Variations</Badge>
                                    )}
                                    {product.hasModifiers && (
                                      <Badge variant="info">Has Modifiers</Badge>
                                    )}
                                    {product.isOpenPrice && (
                                      <Badge variant="info">Open Price</Badge>
                                    )}
                                    {product.trackInventory && (
                                      <Badge variant="info">Track Inventory</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Variations and Modifiers Section */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Variations - Only show if has variations or can add them */}
                                {(product.hasVariations || (product.variations && product.variations.length > 0)) && (
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                                    <Package className="h-4 w-4" /> Variations
                                  </h4>
                                  {product.variations && product.variations.length > 0 ? (
                                    <div className="bg-white rounded border border-slate-200 overflow-hidden">
                                      <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500 text-xs">
                                          <tr>
                                            <th className="px-3 py-2 text-left">Name</th>
                                            <th className="px-3 py-2 text-right">Price</th>
                                            <th className="px-3 py-2 text-center">Default</th>
                                            <th className="px-3 py-2 text-center">Active</th>
                                            <th className="px-3 py-2 text-right">Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {product.variations.map((variation) => (
                                            <tr key={variation.variationUuid}>
                                              <td className="px-3 py-2">{variation.name}</td>
                                              <td className="px-3 py-2 text-right">₹{variation.price}</td>
                                              <td className="px-3 py-2 text-center">
                                                {variation.isDefault && <CheckCircle className="h-3 w-3 text-green-500 inline" />}
                                              </td>
                                              <td className="px-3 py-2 text-center">
                                                <span className={`inline-block w-2 h-2 rounded-full ${variation.isActive ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                              </td>
                                              <td className="px-3 py-2 text-right">
                                                <button
                                                  onClick={() => setVariationModalProduct(product)}
                                                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                                                  title="Edit variations"
                                                >
                                                  <Edit2 className="h-3 w-3" />
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-slate-400 italic">No variations</p>
                                  )}
                                  <button
                                    onClick={() => setVariationModalProduct(product)}
                                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                                  >
                                    <Plus className="h-3 w-3" /> Manage Variations
                                  </button>
                                </div>
                                )}

                                {/* Modifier Groups - Always show to allow adding/managing */}
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                                    <Grid className="h-4 w-4" /> Modifier Groups
                                  </h4>
                                  {product.modifierGroups && product.modifierGroups.length > 0 ? (
                                    <div className="bg-white rounded border border-slate-200 overflow-hidden">
                                      <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500 text-xs">
                                          <tr>
                                            <th className="px-3 py-2 text-left">Group Name</th>
                                            <th className="px-3 py-2 text-center">Required</th>
                                            <th className="px-3 py-2 text-center">Selection</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {product.modifierGroups.map((group) => (
                                            <tr key={group.modifierGroupUuid}>
                                              <td className="px-3 py-2">{group.name}</td>
                                              <td className="px-3 py-2 text-center">
                                                {group.isRequired ? (
                                                  <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Required</span>
                                                ) : (
                                                  <span className="text-slate-400 text-xs">Optional</span>
                                                )}
                                              </td>
                                              <td className="px-3 py-2 text-center text-xs text-slate-600">
                                                Min: {group.minSelection} / Max: {group.maxSelection}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-slate-400 italic">No modifier groups assigned</p>
                                  )}
                                  <button
                                    onClick={() => setModifierGroupModalProduct(product)}
                                    className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
                                  >
                                    <Plus className="h-3 w-3" /> Manage Modifier Groups
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            </>
          )}</div>
      </Card>

      {/* Variation Management Modal */}
      <VariationManagerModal
        isOpen={variationModalProduct !== null}
        onClose={() => {
          setVariationModalProduct(null);
          // Refresh products to show updated variations
          if (activeRestaurantId) {
            dispatch(fetchProducts({ restaurantUuid: activeRestaurantId, includeInactive: true }));
          }
        }}
        restaurantUuid={activeRestaurantId}
        productUuid={variationModalProduct?.productUuid}
        productName={variationModalProduct?.name}
      />

      {/* Modifier Group Assignment Modal */}
      <ModifierGroupAssignmentModal
        isOpen={modifierGroupModalProduct !== null}
        onClose={() => {
          setModifierGroupModalProduct(null);
          // Refresh products to show updated modifier groups
          if (activeRestaurantId) {
            dispatch(fetchProducts({ restaurantUuid: activeRestaurantId, includeInactive: true }));
          }
        }}
        restaurantUuid={activeRestaurantId}
        productUuid={modifierGroupModalProduct?.productUuid}
        productName={modifierGroupModalProduct?.name}
      />
    </div>
  );
};

export default MenuManagement;
