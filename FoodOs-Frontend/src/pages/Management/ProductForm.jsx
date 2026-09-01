import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Toggle,
  Segmented,
  BtnPrimary,
  BtnGhost,
  Pill,
} from '../../components/ui/kit';
import { cn } from '../../utils/cn';
import {
  Loader2, AlertCircle, CheckCircle,
  ImagePlus, GripVertical, Plus, ChevronRight,
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
import { fetchVariations } from '../../store/variationSlice';
import VariationManagerModal from '../../components/VariationManagerModal';
import ModifierGroupAssignmentModal from '../../components/ModifierGroupAssignmentModal';

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
  defaultKitchenStation: 'GRILL',
  // UI-only (not part of the submit payload)
  trackInventory: false,
};

const INPUT_CLS =
  'w-full h-10 px-3 rounded-input bg-paper-card border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold disabled:opacity-60 disabled:cursor-not-allowed';
const LABEL_CLS = 'eyebrow text-[11px] text-txt-faint block mb-1.5';

const RailCard = ({ title, action, children }) => (
  <div className="bg-paper-card border border-line-light rounded-card overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-line-light">
      <h3 className="font-display font-bold text-sm text-ink-text">{title}</h3>
      {action}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const ProductForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { productUuid } = useParams();
  const isEditMode = Boolean(productUuid);

  const { activeRestaurantId } = useSelector((state) => state.auth);
  const { currentProduct, actionLoading, error, success } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);
  const { variations } = useSelector((state) => state.variations);

  const [formData, setFormData] = useState(initialFormData);
  const [variationModalOpen, setVariationModalOpen] = useState(false);
  const [modifierModalOpen, setModifierModalOpen] = useState(false);

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
      dispatch(fetchVariations({ restaurantUuid: activeRestaurantId, productUuid }));
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
        defaultKitchenStation: currentProduct.defaultKitchenStation || 'GRILL',
        trackInventory: Boolean(currentProduct.trackInventory),
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
      defaultKitchenStation: formData.defaultKitchenStation || undefined,
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

  // Assigned modifier groups / variations for the right rail (edit mode only).
  const assignedGroups = currentProduct?.modifierGroups || [];
  const productVariations = isEditMode ? (variations || []) : [];

  const groupMeta = (g) => {
    const req = g.isRequired ? 'Required' : 'Optional';
    if (g.isRequired && g.minSelection) return `${req} · pick ${g.minSelection}`;
    if (!g.isRequired && g.maxSelection) return `${req} · max ${g.maxSelection}`;
    return req;
  };

  const stationOptions = [
    { value: 'GRILL', label: 'Grill' },
    { value: 'FRY', label: 'Fry' },
    { value: 'COLD', label: 'Cold' },
  ];

  const currentStock = currentProduct?.currentStock ?? 0;

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

      {/* ─── DARK ink top bar: breadcrumb + actions ─── */}
      <div className="rounded-t-card bg-ink text-txt-light px-5 py-4 sm:px-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-float">
        <div className="min-w-0">
          <p className="eyebrow text-[10px] text-txt-faintDark mb-1">Menu · Item editor</p>
          <nav className="flex items-center gap-1.5 text-sm font-mono text-txt-mutedDark min-w-0">
            <span>Menu</span>
            <span className="text-marigold">›</span>
            <span>Items</span>
            <span className="text-marigold">›</span>
            <span className="text-txt-light truncate">
              {isEditMode ? `Edit · ${formData.name || 'Item'}` : 'New item'}
            </span>
          </nav>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
              'Save item'
            ) : (
              'Save item'
            )}
          </BtnPrimary>
        </div>
      </div>

      {/* ─── Body — light paper, 2-col ─── */}
      <form
        id="product-form"
        onSubmit={handleSubmit}
        className="bg-paper-2 border border-t-0 border-line-light rounded-b-card p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6"
      >
        {/* ─── LEFT: core form ─── */}
        <div className="space-y-5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className={LABEL_CLS}>Base price (₹) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.basePrice}
                onChange={(e) => set('basePrice', e.target.value)}
                required
                className={cn(INPUT_CLS, 'font-mono')}
              />
            </div>
          </div>

          {/* Food type */}
          <div>
            <label className={LABEL_CLS}>Food type *</label>
            <Segmented
              options={[
                { value: 'VEG', label: 'Veg' },
                { value: 'NON_VEG', label: 'Non-veg' },
              ]}
              value={formData.dietaryType === 'NON_VEG' ? 'NON_VEG' : 'VEG'}
              onChange={(value) => set('dietaryType', value)}
            />
          </div>

          {/* Track stock */}
          <div className="flex items-center justify-between gap-4 rounded-tile border border-line-light bg-paper-card p-3.5">
            <div className="min-w-0">
              <span className="block text-sm font-medium text-ink-text">Track stock</span>
              <span className="block text-xs text-txt-muted mt-0.5 font-mono">
                {currentStock} left
              </span>
            </div>
            <Toggle
              checked={formData.trackInventory}
              onChange={(checked) => set('trackInventory', checked)}
            />
          </div>

          {/* Photo dropzone */}
          <div>
            <label className={LABEL_CLS}>Product photo</label>
            <div className="flex flex-col items-center justify-center gap-2 rounded-tile border-2 border-dashed border-line-input bg-paper-2 px-4 py-10 text-center">
              <ImagePlus className="h-7 w-7 text-txt-faint" />
              <p className="eyebrow text-[11px] text-txt-faint">Product photo · drag to upload</p>
              <p className="text-xs text-txt-faint">PNG or JPG, up to 5MB</p>
            </div>
          </div>

          {/* Secondary details — preserved fields */}
          <div className="border-t border-line-light pt-5 space-y-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>Cost price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costPrice}
                  onChange={(e) => set('costPrice', e.target.value)}
                  className={cn(INPUT_CLS, 'font-mono')}
                />
              </div>
              <div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          : 'bg-paper-card text-txt-muted border-line-input hover:bg-paper-2',
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'isActive', label: 'Active' },
                { id: 'isFeatured', label: 'Featured' },
                { id: 'isBestseller', label: 'Bestseller' },
              ].map(flag => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between gap-3 rounded-tile border border-line-light bg-paper-card p-3"
                >
                  <span className="text-sm font-medium text-ink-text">{flag.label}</span>
                  <Toggle
                    size="sm"
                    checked={formData[flag.id]}
                    onChange={(checked) => set(flag.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT rail ─── */}
        <div className="space-y-6">
          {/* Modifier groups */}
          <RailCard
            title="Modifier groups"
            action={
              <button
                type="button"
                onClick={() => {
                  if (isEditMode) setModifierModalOpen(true);
                }}
                disabled={!isEditMode}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#9a6500] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" /> Assign
              </button>
            }
          >
            {!isEditMode ? (
              <p className="text-xs text-txt-faint">Save the item first to assign modifier groups.</p>
            ) : assignedGroups.length === 0 ? (
              <p className="text-xs text-txt-faint">No modifier groups assigned yet.</p>
            ) : (
              <ul className="space-y-2">
                {assignedGroups.map(g => (
                  <li
                    key={g.modifierGroupUuid}
                    className="flex items-center gap-3 rounded-tile border border-line-light bg-paper-2 px-3 py-2.5"
                  >
                    <GripVertical className="h-4 w-4 text-txt-faint shrink-0 cursor-grab" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink-text truncate">{g.name}</span>
                      <span className="block text-[11px] text-txt-muted mt-0.5">{groupMeta(g)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </RailCard>

          {/* Variations */}
          <RailCard
            title="Variations"
            action={
              <button
                type="button"
                onClick={() => {
                  if (isEditMode) setVariationModalOpen(true);
                }}
                disabled={!isEditMode}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#9a6500] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            }
          >
            {!isEditMode ? (
              <p className="text-xs text-txt-faint">Save the item first to add variations.</p>
            ) : productVariations.length === 0 ? (
              <p className="text-xs text-txt-faint">No variations yet.</p>
            ) : (
              <ul className="space-y-2">
                {productVariations.map(v => (
                  <li
                    key={v.variationUuid}
                    className="flex items-center justify-between gap-3 rounded-tile border border-line-light bg-paper-2 px-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-ink-text truncate">{v.name}</span>
                    <span className="text-sm font-mono text-ink-text shrink-0">
                      ₹{Number(v.price ?? 0).toLocaleString('en-IN')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </RailCard>

          {/* Kitchen routing */}
          <RailCard title="Kitchen routing">
            <Segmented
              options={stationOptions}
              value={formData.defaultKitchenStation}
              onChange={(value) => set('defaultKitchenStation', value)}
              className="w-full [&>button]:flex-1"
            />
            <p className="text-[11px] text-txt-muted mt-3 flex items-center gap-1">
              <ChevronRight className="h-3 w-3 text-marigold" />
              Tickets route to the {stationOptions.find(s => s.value === formData.defaultKitchenStation)?.label} station.
            </p>
          </RailCard>

          {(formData.hasVariations || formData.hasModifiers) && (
            <div className="flex flex-wrap gap-2 px-1">
              {formData.hasVariations && <Pill tone="marigold">Has variations</Pill>}
              {formData.hasModifiers && <Pill tone="gold">Has modifiers</Pill>}
            </div>
          )}
        </div>
      </form>

      {/* Variation Management Modal (existing flow) */}
      <VariationManagerModal
        isOpen={variationModalOpen}
        onClose={() => {
          setVariationModalOpen(false);
          if (activeRestaurantId && productUuid) {
            dispatch(fetchVariations({ restaurantUuid: activeRestaurantId, productUuid }));
            dispatch(fetchProductByUuid({ restaurantUuid: activeRestaurantId, productUuid }));
          }
        }}
        restaurantUuid={activeRestaurantId}
        productUuid={productUuid}
        productName={formData.name}
      />

      {/* Modifier Group Assignment Modal (existing flow) */}
      <ModifierGroupAssignmentModal
        isOpen={modifierModalOpen}
        onClose={() => {
          setModifierModalOpen(false);
          if (activeRestaurantId && productUuid) {
            dispatch(fetchProductByUuid({ restaurantUuid: activeRestaurantId, productUuid }));
          }
        }}
        restaurantUuid={activeRestaurantId}
        productUuid={productUuid}
        productName={formData.name}
      />
    </div>
  );
};

export default ProductForm;
