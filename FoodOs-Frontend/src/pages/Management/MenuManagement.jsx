import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import VariationManagerModal from '../../components/VariationManagerModal';
import ModifierGroupAssignmentModal from '../../components/ModifierGroupAssignmentModal';
import {
  Edit2, Trash2, Plus, Loader2, AlertCircle, CheckCircle,
  Star, ChevronDown, ChevronRight, Clock, Thermometer,
  Calendar, Info, Tag, Hash,
  DollarSign, Package, Search, TrendingUp, Grid,
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
import {
  PageHeader,
  Panel,
  Pill,
  Toggle,
  BtnPrimary,
} from '../../components/ui/kit';
import { cn } from '../../utils/cn';

const MENU_TABS = [
  { label: 'Items', path: '/app/menu' },
  { label: 'Categories', path: '/app/categories' },
  { label: 'Modifier groups', path: '/app/modifiers' },
];

// Deterministic accent color for initials thumbnails
const THUMB_COLORS = ['#0d1b2a', '#9a6500', '#7a5e1d', '#1f6f54', '#5b3a8a', '#8a3b3b'];
const thumbColor = (str = '') => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return THUMB_COLORS[h % THUMB_COLORS.length];
};
const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

const isVeg = (type) => type === 'VEG' || type === 'VEGAN';

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
  const { categories } = useSelector((state) => state.categories);

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

  const handleDelete = async (productUuid) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await dispatch(deleteProduct({
          restaurantUuid: activeRestaurantId,
          productUuid,
        })).unwrap();
      } catch (err) {
        console.error('Failed to delete product:', err);
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
  const flattenCategories = (cats) => {
    const flattened = [];
    cats.forEach((category) => {
      // Add parent category
      flattened.push({
        categoryUuid: category.categoryUuid || category.uuid,
        name: category.name,
        isParent: true,
      });

      // Add child categories if they exist
      if (category.subCategories && category.subCategories.length > 0) {
        category.subCategories.forEach((subCategory) => {
          flattened.push({
            categoryUuid: subCategory.categoryUuid,
            name: subCategory.name,
            isParent: false,
            parentName: category.name,
          });
        });
      }
    });
    return flattened;
  };

  const allCategories = flattenCategories(categories);

  // Map each parent category → its child category uuids, so selecting a parent
  // ("fast food") also surfaces items that live in its sub-categories ("pizzaa").
  const childCategoryMap = {};
  categories.forEach((cat) => {
    const pUuid = cat.categoryUuid || cat.uuid;
    if (cat.subCategories && cat.subCategories.length > 0) {
      childCategoryMap[pUuid] = cat.subCategories.map((sc) => sc.categoryUuid);
    }
  });

  const acceptableCategoryUuids =
    categoryFilter === 'all'
      ? null
      : new Set([categoryFilter, ...(childCategoryMap[categoryFilter] || [])]);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      !acceptableCategoryUuids || acceptableCategoryUuids.has(product.categoryUuid);

    return matchesSearch && matchesCategory;
  });

  // Helper to format dietary type
  const getDietaryLabel = (type) => {
    const map = {
      VEG: 'Veg',
      NON_VEG: 'Non-Veg',
      VEGAN: 'Vegan',
      GLUTEN_FREE: 'Gluten Free',
      DAIRY_FREE: 'Dairy Free',
    };
    return map[type] || type;
  };

  // Helper to render availability schedule
  const renderAvailability = (product) => {
    const days = product.availableDays ? product.availableDays.split(',') : [];
    const from = product.availableFrom;
    const to = product.availableTo;

    if (days.length === 0 && !from && !to) {
      return <span className="text-txt-faint italic">Always available</span>;
    }

    return (
      <div className="space-y-1">
        {days.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-txt-muted">
            <Calendar className="h-3 w-3 text-txt-faint" />
            <span>{days.map((d) => d.substring(0, 3)).join(', ')}</span>
          </div>
        )}
        {(from || to) && (
          <div className="flex items-center gap-1 text-xs text-txt-muted">
            <Clock className="h-3 w-3 text-txt-faint" />
            <span>{from || '00:00'} - {to || '23:59'}</span>
          </div>
        )}
      </div>
    );
  };

  // Veg / non-veg mark: green circle (veg) / red square (non-veg)
  const DietMark = ({ type }) => {
    const veg = isVeg(type);
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center h-4 w-4 border-[1.5px] shrink-0',
          veg ? 'border-success rounded-[3px]' : 'border-danger rounded-[3px]',
        )}
        title={getDietaryLabel(type)}
      >
        <span className={cn('h-2 w-2', veg ? 'bg-success rounded-full' : 'bg-danger')} />
      </span>
    );
  };

  const Thumb = ({ product, size = 'h-10 w-10' }) => (
    <div
      className={cn('flex items-center justify-center rounded-tile text-white font-display font-bold text-xs shrink-0', size)}
      style={{ backgroundColor: thumbColor(product.name) }}
    >
      {initials(product.name)}
    </div>
  );

  const renderExpandedDetails = (product) => (
    <div className="space-y-6">
      {/* Product Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Basic info */}
        <div className="space-y-3">
          <h4 className="eyebrow text-[11px] text-txt-faint flex items-center gap-1">
            <Info className="h-4 w-4" /> Product Details
          </h4>

          {product.description ? (
            <div className="text-sm text-txt-muted bg-paper-card p-3 rounded-input border border-line-light">
              {product.description}
            </div>
          ) : (
            <p className="text-sm text-txt-faint italic">No description</p>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            {product.foodCode && (
              <div className="flex items-center gap-1 text-txt-muted">
                <Hash className="h-3 w-3 text-txt-faint" />
                <span className="text-xs font-mono">Food Code: {product.foodCode}</span>
              </div>
            )}
            {product.costPrice && (
              <div className="flex items-center gap-1 text-txt-muted">
                <DollarSign className="h-3 w-3 text-txt-faint" />
                <span className="text-xs">Cost: ₹{product.costPrice}</span>
              </div>
            )}
            {product.sortOrder !== undefined && (
              <div className="flex items-center gap-1 text-txt-muted">
                <Tag className="h-3 w-3 text-txt-faint" />
                <span className="text-xs">Sort Order: {product.sortOrder}</span>
              </div>
            )}
          </div>
        </div>

        {/* Middle column: Time & Availability */}
        <div className="space-y-3">
          <h4 className="eyebrow text-[11px] text-txt-faint flex items-center gap-1">
            <Clock className="h-4 w-4" /> Time & Availability
          </h4>

          <div className="space-y-2 text-sm text-txt-muted">
            {product.preparationTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-txt-faint" />
                <span>Prep time: {product.preparationTime} min</span>
              </div>
            )}
            {product.spiceLevel && (
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-txt-faint" />
                <span>Spice level: {product.spiceLevel}/5</span>
              </div>
            )}
            <div className="border-t border-line-light my-2"></div>
            {renderAvailability(product)}
          </div>
        </div>

        {/* Right column: Status badges */}
        <div className="space-y-3">
          <h4 className="eyebrow text-[11px] text-txt-faint flex items-center gap-1">
            <CheckCircle className="h-4 w-4" /> Status
          </h4>

          <div className="flex flex-wrap gap-2">
            {product.isFeatured && (
              <Pill tone="gold"><Star className="h-3 w-3" /> Featured</Pill>
            )}
            {product.isBestseller && (
              <Pill tone="success"><TrendingUp className="h-3 w-3" /> Bestseller</Pill>
            )}
            {product.hasVariations && <Pill tone="neutral">Has Variations</Pill>}
            {product.hasModifiers && <Pill tone="neutral">Has Modifiers</Pill>}
            {product.isOpenPrice && <Pill tone="neutral">Open Price</Pill>}
            {product.trackInventory && <Pill tone="neutral">Track Inventory</Pill>}
          </div>
        </div>
      </div>

      {/* Variations and Modifiers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variations - Only show if has variations or can add them */}
        {(product.hasVariations || (product.variations && product.variations.length > 0)) && (
          <div>
            <h4 className="eyebrow text-[11px] text-txt-faint mb-2 flex items-center gap-1">
              <Package className="h-4 w-4" /> Variations
            </h4>
            {product.variations && product.variations.length > 0 ? (
              <div className="bg-paper-card rounded-input border border-line-light overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-paper-2 text-txt-faint text-xs">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      <th className="px-3 py-2 text-right font-medium">Price</th>
                      <th className="px-3 py-2 text-center font-medium">Default</th>
                      <th className="px-3 py-2 text-center font-medium">Active</th>
                      <th className="px-3 py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-light">
                    {product.variations.map((variation) => (
                      <tr key={variation.variationUuid}>
                        <td className="px-3 py-2 text-ink-text">{variation.name}</td>
                        <td className="px-3 py-2 text-right font-mono text-ink-text">₹{variation.price}</td>
                        <td className="px-3 py-2 text-center">
                          {variation.isDefault && <CheckCircle className="h-3 w-3 text-success inline" />}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={cn('inline-block w-2 h-2 rounded-full', variation.isActive ? 'bg-success' : 'bg-danger')}></span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => setVariationModalProduct(product)}
                            className="p-1 rounded-input hover:bg-paper-2 text-txt-faint hover:text-marigold transition-colors"
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
              <p className="text-sm text-txt-faint italic">No variations</p>
            )}
            <button
              onClick={() => setVariationModalProduct(product)}
              className="mt-2 text-xs text-marigold hover:brightness-90 font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="h-3 w-3" /> Manage Variations
            </button>
          </div>
        )}

        {/* Modifier Groups - Always show to allow adding/managing */}
        <div>
          <h4 className="eyebrow text-[11px] text-txt-faint mb-2 flex items-center gap-1">
            <Grid className="h-4 w-4" /> Modifier Groups
          </h4>
          {product.modifierGroups && product.modifierGroups.length > 0 ? (
            <div className="bg-paper-card rounded-input border border-line-light overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-paper-2 text-txt-faint text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Group Name</th>
                    <th className="px-3 py-2 text-center font-medium">Required</th>
                    <th className="px-3 py-2 text-center font-medium">Selection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-light">
                  {product.modifierGroups.map((group) => (
                    <tr key={group.modifierGroupUuid}>
                      <td className="px-3 py-2 text-ink-text">{group.name}</td>
                      <td className="px-3 py-2 text-center">
                        {group.isRequired ? (
                          <Pill tone="marigold">Required</Pill>
                        ) : (
                          <span className="text-txt-faint text-xs">Optional</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-txt-muted font-mono">
                        Min: {group.minSelection} / Max: {group.maxSelection}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-txt-faint italic">No modifier groups assigned</p>
          )}
          <button
            onClick={() => setModifierGroupModalProduct(product)}
            className="mt-2 text-xs text-marigold hover:brightness-90 font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="h-3 w-3" /> Manage Modifier Groups
          </button>
        </div>
      </div>
    </div>
  );

  const totalCount = filteredProducts.length;

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {(error || success) && (
        <div
          className={cn(
            'fixed top-4 right-4 left-4 sm:left-auto z-50 p-3 sm:p-4 rounded-card shadow-float flex items-center gap-2 animate-slide-in sm:max-w-sm border',
            error
              ? 'bg-danger/[0.10] text-danger-deep border-danger/30'
              : 'bg-success/[0.10] text-success-deep border-success/30',
          )}
        >
          {error ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle className="h-5 w-5 shrink-0" />}
          <span className="font-medium text-xs sm:text-sm line-clamp-2">{error || success}</span>
        </div>
      )}

      <PageHeader
        title="Menu"
        subtitle="Manage your items, categories and pricing"
        actions={(
          <BtnPrimary onClick={() => navigate('/app/menu/new')} disabled={actionLoading}>
            <Plus className="h-4 w-4" />
            Add Item
          </BtnPrimary>
        )}
      />

      {/* Menu sub-tabs */}
      <div className="border-b border-line-light">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {MENU_TABS.map((tab) => {
            const active = tab.path === '/app/menu';
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  active
                    ? 'border-marigold text-ink-text'
                    : 'border-transparent text-txt-muted hover:text-ink-text',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search + mobile category dropdown */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-faint" />
          <input
            placeholder="Search by name, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-input border border-line-input bg-paper-card text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold"
          />
        </div>
        {/* Mobile category dropdown */}
        <select
          className="lg:hidden h-10 px-3 rounded-input border border-line-input bg-paper-card text-sm text-ink-text focus:outline-none focus:ring-2 focus:ring-marigold/40"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {allCategories.map((cat) => (
            <option key={cat.categoryUuid} value={cat.categoryUuid}>
              {cat.isParent ? cat.name : `— ${cat.name}`}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        {/* Category sidebar (desktop) */}
        <aside className="hidden lg:block w-56 shrink-0">
          <Panel className="p-2 sticky top-4">
            <p className="eyebrow text-[10px] text-txt-faint px-2 py-1.5">Categories</p>
            <nav className="space-y-0.5">
              <button
                onClick={() => setCategoryFilter('all')}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-input text-sm transition-colors',
                  categoryFilter === 'all'
                    ? 'bg-ink text-white font-semibold'
                    : 'text-txt-muted hover:bg-paper-2 hover:text-ink-text',
                )}
              >
                All Categories
              </button>
              {allCategories.map((cat) => {
                const active = categoryFilter === cat.categoryUuid;
                return (
                  <button
                    key={cat.categoryUuid}
                    onClick={() => setCategoryFilter(cat.categoryUuid)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-input text-sm transition-colors truncate',
                      !cat.isParent && 'pl-6',
                      active
                        ? 'bg-ink text-white font-semibold'
                        : 'text-txt-muted hover:bg-paper-2 hover:text-ink-text',
                    )}
                  >
                    {!cat.isParent && <span className="text-txt-faint mr-1">—</span>}
                    {cat.name}
                  </button>
                );
              })}
            </nav>
          </Panel>
        </aside>

        {/* Item list */}
        <div className="flex-1 min-w-0">
          <Panel className="overflow-hidden">
            {loading ? (
              <div className="divide-y divide-line-light">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                    <div className="h-10 w-10 rounded-tile bg-paper-2" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-1/3 rounded-full bg-paper-2" />
                      <div className="h-3 w-1/4 rounded-full bg-paper-2" />
                    </div>
                    <div className="h-5 w-16 rounded-full bg-paper-2" />
                    <div className="h-6 w-11 rounded-full bg-paper-2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-txt-faint">
                <Package className="h-12 w-12 mb-3" />
                <p className="text-sm text-txt-muted">No items found</p>
                <p className="text-xs text-txt-faint mt-1">Try adjusting your search or category filter.</p>
              </div>
            ) : (
              <>
                {/* Table header (desktop) */}
                <div className="hidden md:flex items-center gap-4 px-5 py-3 bg-paper-2 border-b border-line-light eyebrow text-[10px] text-txt-faint">
                  <span className="w-6 shrink-0" />
                  <span className="flex-1 min-w-0">Item</span>
                  <span className="w-36 shrink-0">Category</span>
                  <span className="w-24 shrink-0 text-right">Price</span>
                  <span className="w-20 shrink-0 text-center">Mods</span>
                  <span className="w-16 shrink-0 text-center">Featured</span>
                  <span className="w-24 shrink-0 text-center">Available</span>
                  <span className="w-20 shrink-0 text-right">Actions</span>
                </div>

                <div className="divide-y divide-line-light">
                  {filteredProducts.map((product) => {
                    const price = product.basePrice || 0;
                    const isActive = product.isActive !== false;
                    const isExpanded = expandedProductIds.has(product.productUuid);
                    const modCount =
                      (product.modifierGroups && product.modifierGroups.length) || 0;

                    return (
                      <div
                        key={product.productUuid}
                        className={cn(
                          'transition-colors',
                          isExpanded && 'bg-paper-2/60',
                          !isActive && 'opacity-60',
                        )}
                      >
                        {/* Desktop row */}
                        <div className="hidden md:flex items-center gap-4 px-5 py-3 hover:bg-paper-2/50">
                          <button
                            onClick={() => toggleProductExpansion(product.productUuid)}
                            className="w-6 shrink-0 flex justify-center p-1 -m-1 rounded-input hover:bg-paper-3 text-txt-faint"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <DietMark type={product.dietaryType} />
                              <span className="font-medium text-ink-text truncate">{product.name}</span>
                              {!isActive && <Pill tone="danger">86&apos;d</Pill>}
                            </div>
                            {product.sku && (
                              <span className="text-xs text-txt-faint font-mono">{product.sku}</span>
                            )}
                          </div>
                          <span className="w-36 shrink-0 text-sm text-txt-muted truncate">
                            {product.categoryName || 'Uncategorized'}
                          </span>
                          <span className="w-24 shrink-0 text-right font-mono font-semibold text-ink-text">₹{price}</span>
                          <span className="w-20 shrink-0 text-center text-sm text-txt-muted font-mono">
                            {modCount > 0 ? `${modCount} grp` : '—'}
                          </span>
                          <div className="w-16 shrink-0 flex justify-center">
                            <button
                              onClick={() => handleToggleFeatured(product.productUuid)}
                              disabled={actionLoading}
                              className="p-1 rounded-input hover:bg-paper-3 transition-colors"
                            >
                              <Star
                                className={cn(
                                  'h-5 w-5',
                                  product.isFeatured ? 'fill-marigold text-marigold' : 'text-line-input',
                                )}
                              />
                            </button>
                          </div>
                          <div className="w-24 shrink-0 flex justify-center">
                            <Toggle
                              checked={isActive}
                              onChange={() => handleToggleAvailability(product.productUuid)}
                              disabled={actionLoading}
                              size="sm"
                            />
                          </div>
                          <div className="w-20 shrink-0 flex gap-1 justify-end">
                            <button
                              onClick={() => navigate(`/app/menu/${product.productUuid}/edit`)}
                              disabled={actionLoading}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-input text-txt-faint hover:text-marigold hover:bg-paper-3 transition-colors disabled:opacity-50"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.productUuid)}
                              disabled={actionLoading}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-input text-txt-faint hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Mobile card */}
                        <div className="md:hidden p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <DietMark type={product.dietaryType} />
                                <span className="font-medium text-ink-text truncate">{product.name}</span>
                              </div>
                              {product.sku && (
                                <span className="text-xs text-txt-faint font-mono">{product.sku}</span>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="font-mono font-semibold text-ink-text">₹{price}</span>
                                {product.categoryName && (
                                  <Pill tone="neutral">{product.categoryName}</Pill>
                                )}
                                {!isActive && <Pill tone="danger">86&apos;d</Pill>}
                              </div>
                            </div>
                            <button
                              onClick={() => toggleProductExpansion(product.productUuid)}
                              className="p-1 rounded-input hover:bg-paper-3 text-txt-faint shrink-0"
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-line-light">
                            <div className="flex items-center gap-2 text-xs text-txt-muted">
                              <span>Available</span>
                              <Toggle
                                checked={isActive}
                                onChange={() => handleToggleAvailability(product.productUuid)}
                                disabled={actionLoading}
                                size="sm"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleFeatured(product.productUuid)}
                                disabled={actionLoading}
                                className="p-1.5 rounded-input hover:bg-paper-3"
                              >
                                <Star className={cn('h-4 w-4', product.isFeatured ? 'fill-marigold text-marigold' : 'text-line-input')} />
                              </button>
                              <button
                                onClick={() => navigate(`/app/menu/${product.productUuid}/edit`)}
                                className="p-1.5 rounded-input text-txt-faint hover:text-marigold hover:bg-paper-3"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.productUuid)}
                                disabled={actionLoading}
                                className="p-1.5 rounded-input text-txt-faint hover:text-danger hover:bg-danger/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-1 border-t border-line-light bg-paper-2/40">
                            {renderExpandedDetails(product)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer count */}
                <div className="px-5 py-3 border-t border-line-light text-xs text-txt-faint font-mono">
                  {totalCount} {totalCount === 1 ? 'item' : 'items'}
                </div>
              </>
            )}
          </Panel>
        </div>
      </div>

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
