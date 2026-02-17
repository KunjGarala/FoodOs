import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle,
  Package, DollarSign, Calendar,
} from 'lucide-react';
import VariationManager from '../../components/VariationManager';
import {
  createProduct,
  updateProduct,
  fetchProductByUuid,
  clearError,
  clearSuccess,
  clearCurrentProduct,
} from '../../store/productSlice';
import { fetchCategories } from '../../store/categorySlice';

const daysOfWeek = [
  { id: 'MON', label: 'Mon' },
  { id: 'TUE', label: 'Tue' },
  { id: 'WED', label: 'Wed' },
  { id: 'THU', label: 'Thu' },
  { id: 'FRI', label: 'Fri' },
  { id: 'SAT', label: 'Sat' },
  { id: 'SUN', label: 'Sun' },
];

const initialFormData = {
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
};

const ProductForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { productUuid } = useParams();
  const isEditMode = Boolean(productUuid);

  const { activeRestaurantId } = useSelector((state) => state.auth);
  const { currentProduct, actionLoading, error, success } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);

  const [formData, setFormData] = useState(initialFormData);

  // Fetch categories on mount
  useEffect(() => {
    if (activeRestaurantId) {
      dispatch(fetchCategories(activeRestaurantId));
    }
  }, [dispatch, activeRestaurantId]);

  // If editing, fetch the product
  useEffect(() => {
    if (isEditMode && activeRestaurantId) {
      dispatch(fetchProductByUuid({ restaurantUuid: activeRestaurantId, productUuid }));
    }
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, isEditMode, activeRestaurantId, productUuid]);

  // Populate form when product is loaded
  useEffect(() => {
    if (isEditMode && currentProduct) {
      setFormData({
        name: currentProduct.name || '',
        description: currentProduct.description || '',
        sku: currentProduct.sku || '',
        foodCode: currentProduct.foodCode || '',
        basePrice: currentProduct.basePrice || '',
        costPrice: currentProduct.costPrice || '',
        categoryUuid: currentProduct.categoryUuid || '',
        dietaryType: currentProduct.dietaryType || 'VEG',
        preparationTime: currentProduct.preparationTime || '',
        spiceLevel: currentProduct.spiceLevel || '',
        isFeatured: currentProduct.isFeatured || false,
        isBestseller: currentProduct.isBestseller || false,
        isActive: currentProduct.isActive !== false,
        sortOrder: currentProduct.sortOrder || 0,
        availableFrom: currentProduct.availableFrom || '',
        availableTo: currentProduct.availableTo || '',
        availableDays: currentProduct.availableDays ? currentProduct.availableDays.split(',') : [],
      });
    }
  }, [isEditMode, currentProduct]);

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

  const handleDayChange = (day) => {
    setFormData(prev => {
      const days = [...prev.availableDays];
      if (days.includes(day)) {
        return { ...prev, availableDays: days.filter(d => d !== day) };
      } else {
        return { ...prev, availableDays: [...days, day] };
      }
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
      if (isEditMode) {
        await dispatch(updateProduct({
          restaurantUuid: activeRestaurantId,
          productUuid,
          productData,
        })).unwrap();
      } else {
        await dispatch(createProduct({
          restaurantUuid: activeRestaurantId,
          productData,
        })).unwrap();
      }
      navigate('/app/menu');
    } catch (err) {
      console.error('Failed to save product:', err);
    }
  };

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  // Shared input class for selects to look consistent with Input component
  const selectClass = 'flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

  return (
    <div className="flex flex-col min-h-[calc(100vh-5.5rem)] overflow-y-auto">
      {/* Notification Toast */}
      {(error || success) && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in ${
          error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <span className="font-medium">{error || success}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/menu')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              {isEditMode ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h1>
            <p className="text-slate-500 text-sm">
              {isEditMode ? 'Update the product details below' : 'Fill in the details to create a new item'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Button variant="ghost" onClick={() => navigate('/app/menu')} disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={actionLoading}>
            {actionLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              isEditMode ? 'Update Item' : 'Save Item'
            )}
          </Button>
        </div>
      </div>

      {/* Form — 3-column card grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">

        {/* ─── Left Card: Basic Info ─── */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-blue-500" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Item Name <span className="text-red-400">*</span></label>
              <Input
                placeholder="e.g. Butter Chicken"
                value={formData.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">SKU</label>
                <Input
                  placeholder="e.g. M001"
                  value={formData.sku}
                  onChange={(e) => set('sku', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Food Code</label>
                <Input
                  placeholder="e.g. FC001"
                  value={formData.foodCode}
                  onChange={(e) => set('foodCode', e.target.value)}
                  maxLength={20}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Category <span className="text-red-400">*</span></label>
              <select
                className={selectClass}
                value={formData.categoryUuid}
                onChange={(e) => set('categoryUuid', e.target.value)}
                required
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.categoryUuid || cat.uuid} value={cat.categoryUuid || cat.uuid}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none transition-all"
                placeholder="Short item description..."
                value={formData.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ─── Center Card: Pricing & Details ─── */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Pricing & Details
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Base Price (₹) <span className="text-red-400">*</span></label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.basePrice}
                  onChange={(e) => set('basePrice', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Cost Price (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costPrice}
                  onChange={(e) => set('costPrice', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Dietary Type <span className="text-red-400">*</span></label>
              <select
                className={selectClass}
                value={formData.dietaryType}
                onChange={(e) => set('dietaryType', e.target.value)}
                required
              >
                <option value="VEG">Vegetarian</option>
                <option value="NON_VEG">Non-Vegetarian</option>
                <option value="VEGAN">Vegan</option>
                <option value="GLUTEN_FREE">Gluten Free</option>
                <option value="DAIRY_FREE">Dairy Free</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Prep Time (min)</label>
                <Input
                  type="number"
                  placeholder="15"
                  value={formData.preparationTime}
                  onChange={(e) => set('preparationTime', e.target.value)}
                  min="0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Spice Level (1-5)</label>
                <Input
                  type="number"
                  placeholder="1"
                  value={formData.spiceLevel}
                  onChange={(e) => set('spiceLevel', e.target.value)}
                  min="1"
                  max="5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Sort Order</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.sortOrder}
                onChange={(e) => set('sortOrder', e.target.value)}
                min="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* ─── Right Card: Availability & Flags ─── */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-violet-500" />
              Availability & Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Available From</label>
                <Input
                  type="time"
                  value={formData.availableFrom}
                  onChange={(e) => set('availableFrom', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Available To</label>
                <Input
                  type="time"
                  value={formData.availableTo}
                  onChange={(e) => set('availableTo', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Available Days</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => handleDayChange(day.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      formData.availableDays.includes(day.id)
                        ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className="text-sm font-medium text-slate-700 mb-3 block">Status Flags</label>
              <div className="space-y-3">
                {[
                  { id: 'isActive', label: 'Active', desc: 'Item is available for ordering', color: 'text-emerald-600' },
                  { id: 'isFeatured', label: 'Featured', desc: 'Show in featured section', color: 'text-yellow-600' },
                  { id: 'isBestseller', label: 'Bestseller', desc: 'Display bestseller badge', color: 'text-blue-600' },
                ].map(flag => (
                  <label key={flag.id} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData[flag.id]}
                      onChange={(e) => set(flag.id, e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className={`text-sm font-medium ${flag.color} group-hover:underline`}>{flag.label}</span>
                      <p className="text-xs text-slate-400">{flag.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Variations — only visible when editing an existing product */}
      {isEditMode && (
        <div className="mt-5 pb-6">
          <VariationManager restaurantUuid={activeRestaurantId} productUuid={productUuid} />
        </div>
      )}
    </div>
  );
};

export default ProductForm;
