import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PageHeader,
  Panel,
  Toggle,
  Segmented,
  BtnPrimary,
  BtnGhost,
} from '../../components/ui/kit';
import { cn } from '../../utils/cn';
import {
  Loader2, AlertCircle, CheckCircle,
  Package, IndianRupee, CalendarClock,
} from 'lucide-react';
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
  hasVariations: false,
  hasModifiers: false,
  sortOrder: 0,
  availableFrom: '',
  availableTo: '',
  availableDays: [],
};

const INPUT_CLS =
  'w-full h-10 px-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold disabled:opacity-60 disabled:cursor-not-allowed';
const LABEL_CLS = 'eyebrow text-[11px] text-txt-faint block mb-1.5';

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
        isFeatured: Boolean(currentProduct.isFeatured),
        isBestseller: Boolean(currentProduct.isBestseller),
        isActive: currentProduct.isActive !== false,
        hasVariations: Boolean(currentProduct.hasVariations),
        hasModifiers: Boolean(currentProduct.hasModifiers),
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
      hasVariations: formData.hasVariations,
      hasModifiers: formData.hasModifiers,
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

  const statusFlags = [
    { id: 'isActive', label: 'Active', desc: 'Item is available for ordering' },
    { id: 'isFeatured', label: 'Featured', desc: 'Show in featured section' },
    { id: 'isBestseller', label: 'Bestseller', desc: 'Display bestseller badge' },
    { id: 'hasVariations', label: 'Has variations', desc: 'Item has size / variation options' },
    { id: 'hasModifiers', label: 'Has modifiers', desc: 'Item has add-ons / modifiers' },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Notification Toast */}
      {(error || success) && (
        <div
          className={cn(
            'fixed top-4 right-4 left-4 sm:left-auto z-50 p-3 sm:p-4 rounded-card shadow-float flex items-center gap-2 animate-slide-in sm:max-w-sm border',
            error
              ? 'bg-danger/[0.08] text-danger-deep border-danger/30'
              : 'bg-success/[0.10] text-success-deep border-success/30',
          )}
        >
          {error ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle className="h-5 w-5 shrink-0" />}
          <span className="font-medium text-xs sm:text-sm line-clamp-2">{error || success}</span>
        </div>
      )}

      {/* Ink breadcrumb / action bar */}
      <div className="mb-6 rounded-card bg-ink text-txt-light px-5 py-4 sm:px-6 sm:py-5 shadow-float">
        <PageHeader
          eyebrow="Menu · Item editor"
          title={isEditMode ? 'Edit menu item' : 'Add new menu item'}
          subtitle={isEditMode ? 'Update the product details below.' : 'Fill in the details to create a new item.'}
          className="[&_h1]:text-white [&_.eyebrow]:text-txt-faintDark [&_p]:text-txt-mutedDark"
          actions={
            <>
              <BtnGhost
                type="button"
                onClick={() => navigate('/app/menu')}
                disabled={actionLoading}
                className="bg-transparent text-txt-light border-ink-line hover:bg-ink-card"
              >
                Cancel
              </BtnGhost>
              <BtnPrimary type="submit" form="product-form" disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : isEditMode ? (
                  'Update item'
                ) : (
                  'Save item'
                )}
              </BtnPrimary>
            </>
          }
        />
      </div>

      {/* Body — 2-col, stacks on mobile */}
      <form
        id="product-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6"
      >
        {/* ─── LEFT: core form ─── */}
        <Panel className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-marigold" />
            <h2 className="font-display font-bold text-base text-ink-text">Basic information</h2>
          </div>

          <div>
            <label className={LABEL_CLS}>Item name *</label>
            <input
              type="text"
              placeholder="e.g. Butter Chicken"
              value={formData.name}
              onChange={(e) => set('name', e.target.value)}
              required
              className={INPUT_CLS}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>SKU</label>
              <input
                type="text"
                placeholder="e.g. M001"
                value={formData.sku}
                onChange={(e) => set('sku', e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Food code</label>
              <input
                type="text"
                placeholder="e.g. FC001"
                value={formData.foodCode}
                onChange={(e) => set('foodCode', e.target.value)}
                maxLength={20}
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Category *</label>
            <select
              className={INPUT_CLS}
              value={formData.categoryUuid}
              onChange={(e) => set('categoryUuid', e.target.value)}
              required
            >
              <option value="">Select category</option>
              {allCategories.map(cat => (
                <option key={cat.categoryUuid} value={cat.categoryUuid}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLS}>Description</label>
            <textarea
              className={cn(INPUT_CLS, 'h-auto py-2 resize-none')}
              placeholder="Short item description..."
              value={formData.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Pricing */}
          <div className="border-t border-line-light pt-5">
            <div className="flex items-center gap-2 mb-4">
              <IndianRupee className="h-4 w-4 text-success" />
              <h2 className="font-display font-bold text-base text-ink-text">Pricing &amp; details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>Base price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.basePrice}
                  onChange={(e) => set('basePrice', e.target.value)}
                  required
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Cost price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costPrice}
                  onChange={(e) => set('costPrice', e.target.value)}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className={LABEL_CLS}>Food type *</label>
              <Segmented
                options={[
                  { value: 'VEG', label: 'Veg' },
                  { value: 'NON_VEG', label: 'Non-veg' },
                  { value: 'VEGAN', label: 'Vegan' },
                  { value: 'GLUTEN_FREE', label: 'Gluten-free' },
                  { value: 'DAIRY_FREE', label: 'Dairy-free' },
                ]}
                value={formData.dietaryType}
                onChange={(value) => set('dietaryType', value)}
                className="flex-wrap"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className={LABEL_CLS}>Prep time (min)</label>
                <input
                  type="number"
                  placeholder="15"
                  value={formData.preparationTime}
                  onChange={(e) => set('preparationTime', e.target.value)}
                  min="0"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Spice level (1-5)</label>
                <input
                  type="number"
                  placeholder="1"
                  value={formData.spiceLevel}
                  onChange={(e) => set('spiceLevel', e.target.value)}
                  min="1"
                  max="5"
                  className={INPUT_CLS}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className={LABEL_CLS}>Sort order</label>
              <input
                type="number"
                placeholder="0"
                value={formData.sortOrder}
                onChange={(e) => set('sortOrder', e.target.value)}
                min="0"
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Photo dropzone (presentation placeholder) */}
          <div className="border-t border-line-light pt-5">
            <label className={LABEL_CLS}>Item photo</label>
            <div className="flex flex-col items-center justify-center gap-2 rounded-tile border-2 border-dashed border-line-input bg-paper-2 px-4 py-8 text-center">
              <Package className="h-7 w-7 text-txt-faint" />
              <p className="text-sm font-medium text-txt-muted">Drag &amp; drop an image here</p>
              <p className="text-xs text-txt-faint">PNG or JPG, up to 5MB</p>
            </div>
          </div>
        </Panel>

        {/* ─── RIGHT rail ─── */}
        <div className="space-y-6">
          {/* Availability */}
          <Panel className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-marigold" />
              <h2 className="font-display font-bold text-base text-ink-text">Availability</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>Available from</label>
                <input
                  type="time"
                  value={formData.availableFrom}
                  onChange={(e) => set('availableFrom', e.target.value)}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Available to</label>
                <input
                  type="time"
                  value={formData.availableTo}
                  onChange={(e) => set('availableTo', e.target.value)}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLS}>Available days</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => {
                  const active = formData.availableDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => handleDayChange(day.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                        active
                          ? 'bg-marigold text-ink border-marigold'
                          : 'bg-paper-2 text-txt-muted border-line-input hover:bg-paper-3',
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>

          {/* Status flags */}
          <Panel className="p-5 sm:p-6 space-y-4">
            <h2 className="font-display font-bold text-base text-ink-text">Status flags</h2>
            <div className="space-y-3">
              {statusFlags.map(flag => (
                <div
                  key={flag.id}
                  className="flex items-start justify-between gap-4 rounded-tile border border-line-light bg-paper-2 p-3.5"
                >
                  <div className="min-w-0">
                    <span className="block text-sm font-medium text-ink-text">{flag.label}</span>
                    <span className="block text-xs text-txt-muted mt-0.5">{flag.desc}</span>
                  </div>
                  <Toggle
                    checked={formData[flag.id]}
                    onChange={(checked) => set(flag.id, checked)}
                  />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
