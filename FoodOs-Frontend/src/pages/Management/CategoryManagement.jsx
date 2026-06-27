import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import {
  PageHeader,
  Panel,
  Pill,
  Toggle,
  Segmented,
  BtnPrimary,
  BtnGhost,
} from '../../components/ui/kit';
import { cn } from '../../utils/cn';
import {
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  FolderOpen,
  GripVertical,
  X,
} from 'lucide-react';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleActiveStatus,
  clearError,
  clearSuccess,
  clearCurrentCategory,
} from '../../store/categorySlice';

const SUB_TABS = [
  { label: 'Items', path: '/app/menu' },
  { label: 'Categories', path: '/app/categories' },
  { label: 'Modifier groups', path: '/app/modifiers' },
  { label: 'Variations', path: null },
];

// Availability UI options. Mapped to availableForDineIn (non-breaking):
// "all"/"lunch" -> available for dine-in true, "dinner" also true. The chosen
// slot is persisted via iconName-free local field; falls back gracefully.
const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'All day' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
];

const CategoryManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showPanelMobile, setShowPanelMobile] = useState(false);

  // Form state (used by both the settings panel and the create modal)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategoryUuid: '',
    sortOrder: 0,
    imageUrl: '',
    iconName: '',
    colorCode: '#3B82F6',
    isActive: true,
    isVisibleInMenu: true,
    availableForDineIn: true,
  });
  // Availability slot (local UI state mapped onto save; non-breaking).
  const [availability, setAvailability] = useState('all');

  // Redux state
  const { activeRestaurantId, restaurants } = useSelector((state) => state.auth);
  const {
    categories,
    loading,
    actionLoading,
    error,
    success
  } = useSelector((state) => state.categories);

  const restaurantName =
    restaurants?.find((r) => r.restaurantUuid === activeRestaurantId)?.name ||
    'Your restaurant';

  // Fetch categories on mount
  useEffect(() => {
    if (activeRestaurantId) {
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

  const emptyForm = {
    name: '',
    description: '',
    parentCategoryUuid: '',
    sortOrder: 0,
    imageUrl: '',
    iconName: '',
    colorCode: '#3B82F6',
    isActive: true,
    isVisibleInMenu: true,
    availableForDineIn: true,
  };

  const categoryId = (c) => c?.categoryUuid || c?.uuid;

  const fillForm = (category) => ({
    name: category.name,
    description: category.description || '',
    parentCategoryUuid: category.parentCategoryUuid || '',
    sortOrder: category.sortOrder || 0,
    imageUrl: category.imageUrl || '',
    iconName: category.iconName || '',
    colorCode: category.colorCode || '#3B82F6',
    isActive: category.isActive !== false,
    isVisibleInMenu: category.isVisibleInMenu !== false,
    availableForDineIn: category.availableForDineIn !== false,
  });

  // Select a category row into the settings panel.
  const handleSelect = (category) => {
    setEditingCategory(category);
    setSelectedId(categoryId(category));
    setFormData(fillForm(category));
    setAvailability('all');
    setShowPanelMobile(true);
  };

  const handleOpenModal = () => {
    setEditingCategory(null);
    setFormData(emptyForm);
    setAvailability('all');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(emptyForm);
    dispatch(clearCurrentCategory());
  };

  // Build the API payload from the current form + availability mapping.
  const buildPayload = () => ({
    name: formData.name,
    description: formData.description || undefined,
    parentCategoryUuid: formData.parentCategoryUuid || undefined,
    sortOrder: parseInt(formData.sortOrder) || 0,
    imageUrl: formData.imageUrl || undefined,
    iconName: formData.iconName || undefined,
    colorCode: formData.colorCode || undefined,
    isActive: formData.isActive,
    isVisibleInMenu: formData.isVisibleInMenu,
    // availability "all" maps to dine-in available; specific slots keep it true too.
    availableForDineIn:
      availability === 'all' ? formData.availableForDineIn : true,
  });

  // Create from the modal.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const categoryData = buildPayload();
    try {
      if (editingCategory) {
        await dispatch(updateCategory({
          restaurantUuid: activeRestaurantId,
          categoryUuid: editingCategory.categoryUuid,
          categoryData,
        })).unwrap();
      } else {
        await dispatch(createCategory({
          restaurantUuid: activeRestaurantId,
          categoryData,
        })).unwrap();
      }
      handleCloseModal();
      dispatch(fetchCategories(activeRestaurantId));
    } catch (err) {
      console.error('Failed to save category:', err);
    }
  };

  // Save from the settings panel.
  const handleSavePanel = async () => {
    if (!editingCategory) return;
    const categoryData = buildPayload();
    try {
      await dispatch(updateCategory({
        restaurantUuid: activeRestaurantId,
        categoryUuid: editingCategory.categoryUuid,
        categoryData,
      })).unwrap();
      dispatch(fetchCategories(activeRestaurantId));
      setShowPanelMobile(false);
    } catch (err) {
      console.error('Failed to save category:', err);
    }
  };

  const handleDelete = async (uuid) => {
    if (window.confirm('Are you sure you want to delete this category? All products in this category will be affected.')) {
      try {
        await dispatch(deleteCategory({
          restaurantUuid: activeRestaurantId,
          categoryUuid: uuid,
        })).unwrap();
        if (selectedId === uuid) {
          setSelectedId(null);
          setEditingCategory(null);
        }
        dispatch(fetchCategories(activeRestaurantId));
      } catch (err) {
        console.error('Failed to delete category:', err);
      }
    }
  };

  const handleToggleActive = async (uuid, e) => {
    e?.stopPropagation();
    try {
      await dispatch(toggleActiveStatus({
        restaurantUuid: activeRestaurantId,
        categoryUuid: uuid,
      })).unwrap();
      dispatch(fetchCategories(activeRestaurantId));
    } catch (err) {
      console.error('Failed to toggle category status:', err);
    }
  };

  const initials = (name) =>
    (name || '?')
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const itemCountOf = (category) =>
    category.productCount ??
    category.itemCount ??
    category.productsCount ??
    (Array.isArray(category.products) ? category.products.length : 0);

  // A single category row.
  const CategoryRow = ({ category }) => {
    const id = categoryId(category);
    const isVisible = category.isVisibleInMenu !== false;
    const selected = selectedId === id;
    const count = itemCountOf(category);
    const slot =
      category.availableForDineIn === false ? 'closed' : 'all';
    const meta =
      slot === 'closed'
        ? `${count} items · hidden`
        : `${count} items · all day`;

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSelect(category)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect(category);
          }
        }}
        className={cn(
          'group flex items-center gap-3 p-4 bg-paper-card rounded-card cursor-pointer transition-colors hover:bg-paper-2',
          selected
            ? 'border-2 border-marigold'
            : 'border border-line-light',
        )}
      >
        {/* Drag handle (visual affordance) */}
        <span
          className="cursor-grab text-txt-faint group-hover:text-txt-muted shrink-0 touch-none"
          title="Drag to reorder"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </span>

        {/* Thumbnail / initials block */}
        <div
          className="shrink-0 h-11 w-11 rounded-tile flex items-center justify-center overflow-hidden font-display font-bold text-white text-xs bg-paper-2"
          style={
            category.imageUrl
              ? undefined
              : { backgroundColor: category.colorCode || '#9a6500' }
          }
        >
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="h-full w-full object-cover"
            />
          ) : (
            initials(category.name)
          )}
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-[15px] text-ink-text truncate">
              {category.name}
            </span>
            {!isVisible && <Pill tone="neutral">Hidden</Pill>}
          </div>
          <p className="text-xs text-txt-muted truncate mt-0.5">{meta}</p>
        </div>

        {/* Delete (hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(id);
          }}
          disabled={actionLoading}
          className="p-2 rounded-input text-txt-faint hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 shrink-0"
          title="Delete"
          aria-label="Delete category"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Visible / active toggle */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Toggle
            size="sm"
            checked={isVisible}
            onChange={() => handleToggleActive(id)}
            disabled={actionLoading}
          />
        </div>
      </div>
    );
  };

  // Settings panel content (shared between sticky desktop panel & mobile drawer).
  const renderSettings = () => {
    if (!editingCategory) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="h-12 w-12 rounded-tile bg-paper-2 flex items-center justify-center mb-3">
            <FolderOpen className="h-6 w-6 text-txt-faint" />
          </div>
          <p className="text-sm font-medium text-ink-text">No category selected</p>
          <p className="text-xs text-txt-faint mt-1">
            Pick a category on the left to edit its settings.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div>
          <p className="eyebrow text-[11px] text-txt-faint">Category</p>
          <h3 className="font-display font-bold text-lg text-ink-text truncate mt-0.5">
            {formData.name || editingCategory.name}
          </h3>
        </div>

        <div>
          <label className="eyebrow text-[11px] text-txt-faint block mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            maxLength={100}
            className="h-10 w-full px-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold"
          />
        </div>

        <div>
          <label className="eyebrow text-[11px] text-txt-faint block mb-1.5">
            Description
          </label>
          <input
            type="text"
            placeholder="Short description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            maxLength={1000}
            className="h-10 w-full px-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold"
          />
        </div>

        <div>
          <label className="eyebrow text-[11px] text-txt-faint block mb-2">
            Availability
          </label>
          <Segmented
            options={AVAILABILITY_OPTIONS}
            value={availability}
            onChange={setAvailability}
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-sm font-medium text-ink-text">Visible on menu</span>
          <Toggle
            checked={formData.isVisibleInMenu}
            onChange={(v) => setFormData({ ...formData, isVisibleInMenu: v })}
          />
        </div>

        <BtnPrimary
          onClick={handleSavePanel}
          disabled={actionLoading}
          className="w-full"
        >
          {actionLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save category'
          )}
        </BtnPrimary>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {(error || success) && (
        <div
          className={cn(
            'fixed top-4 right-4 left-4 sm:left-auto z-50 p-3 sm:p-4 rounded-card shadow-float flex items-center gap-2 animate-slide-in sm:max-w-sm border',
            error
              ? 'bg-danger/10 text-danger-deep border-danger/30'
              : 'bg-success/10 text-success-deep border-success/30',
          )}
        >
          {error ? (
            <AlertCircle className="h-5 w-5 shrink-0" />
          ) : (
            <CheckCircle className="h-5 w-5 shrink-0" />
          )}
          <span className="font-medium text-xs sm:text-sm line-clamp-2">
            {error || success}
          </span>
        </div>
      )}

      <PageHeader
        eyebrow="Menu"
        title="Menu"
        subtitle={`${restaurantName} · ${categories.length} categories · drag to reorder`}
        actions={
          <BtnPrimary onClick={handleOpenModal} disabled={actionLoading}>
            <Plus className="h-4 w-4" />
            Add category
          </BtnPrimary>
        }
      />

      {/* Sub-tabs (underline / marigold) */}
      <nav className="flex items-center gap-6 border-b border-line-light overflow-x-auto">
        {SUB_TABS.map((tab) => {
          const active = tab.label === 'Categories';
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => tab.path && !active && navigate(tab.path)}
              disabled={!tab.path}
              className={cn(
                'relative -mb-px pb-3 text-sm font-medium transition-colors whitespace-nowrap',
                active
                  ? 'text-ink-text'
                  : tab.path
                    ? 'text-txt-muted hover:text-ink-text'
                    : 'text-txt-faint cursor-default',
              )}
            >
              {tab.label}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-marigold" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 2-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* LEFT: category list */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-marigold" />
            </div>
          ) : categories.length === 0 ? (
            <Panel className="flex flex-col items-center justify-center h-64 text-txt-muted">
              <div className="h-14 w-14 rounded-tile bg-paper-2 flex items-center justify-center mb-3">
                <FolderOpen className="h-7 w-7 text-txt-faint" />
              </div>
              <p className="text-sm font-medium text-ink-text">No categories found</p>
              <p className="text-xs text-txt-faint mt-1">
                Create a category to start organizing your menu
              </p>
              <BtnPrimary onClick={handleOpenModal} className="mt-4">
                <Plus className="h-4 w-4" />
                Create your first category
              </BtnPrimary>
            </Panel>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <CategoryRow key={categoryId(category)} category={category} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: settings panel (sticky, desktop) */}
        <Panel className="hidden lg:block sticky top-6 p-5">
          {renderSettings()}
        </Panel>
      </div>

      {/* Mobile settings drawer */}
      {showPanelMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50"
            onClick={() => setShowPanelMobile(false)}
          />
          <div className="absolute bottom-0 inset-x-0 rounded-t-card bg-paper-card shadow-float max-h-[88vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-line-light">
              <h3 className="font-display font-bold text-base text-ink-text">
                Category settings
              </h3>
              <button
                onClick={() => setShowPanelMobile(false)}
                className="text-txt-faint hover:text-ink-text p-1"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {renderSettings()}
            </div>
          </div>
        </div>
      )}

      {/* Create category modal (full editor) */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="New category"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="eyebrow text-[11px] text-txt-faint block mb-1.5">
                  Category name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Appetizers, Main Course, Desserts"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={100}
                  className="w-full h-10 px-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold"
                />
              </div>

              <div className="col-span-2">
                <label className="eyebrow text-[11px] text-txt-faint block mb-1.5">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold"
                  placeholder="Brief description of this category"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div>
                <label className="eyebrow text-[11px] text-txt-faint block mb-1.5">
                  Parent category
                </label>
                <select
                  className="w-full h-10 px-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold"
                  value={formData.parentCategoryUuid}
                  onChange={(e) => setFormData({ ...formData, parentCategoryUuid: e.target.value })}
                >
                  <option value="">None (Top Level)</option>
                  {categories
                    .filter(cat => categoryId(cat) !== categoryId(editingCategory))
                    .map(cat => (
                      <option key={categoryId(cat)} value={categoryId(cat)}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="eyebrow text-[11px] text-txt-faint block mb-1.5">
                  Sort order
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  min="0"
                  className="w-full h-10 px-3 rounded-input bg-paper-2 border border-line-input text-sm font-mono text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold"
                />
                <p className="text-xs text-txt-faint mt-1">Lower numbers appear first</p>
              </div>

              <div>
                <label className="eyebrow text-[11px] text-txt-faint block mb-1.5">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  maxLength={500}
                  className="w-full h-10 px-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold"
                />
              </div>

              <div>
                <label className="eyebrow text-[11px] text-txt-faint block mb-1.5">
                  Icon name
                </label>
                <input
                  type="text"
                  placeholder="e.g., pizza, burger, coffee"
                  value={formData.iconName}
                  onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                  maxLength={50}
                  className="w-full h-10 px-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold"
                />
              </div>

              <div className="col-span-2">
                <label className="eyebrow text-[11px] text-txt-faint block mb-1.5">
                  Color code
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={formData.colorCode}
                    onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                    className="h-10 w-16 rounded-input border border-line-input cursor-pointer bg-paper-2 p-1"
                  />
                  <input
                    type="text"
                    placeholder="#3B82F6"
                    value={formData.colorCode}
                    onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    maxLength={7}
                    className="flex-1 h-10 px-3 rounded-input bg-paper-2 border border-line-input text-sm font-mono text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold"
                  />
                </div>
                <p className="text-xs text-txt-faint mt-1">
                  Hex color for category identification
                </p>
              </div>
            </div>

            <div className="border-t border-line-light pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ink-text">Active</label>
                <Toggle
                  checked={formData.isActive}
                  onChange={(v) => setFormData({ ...formData, isActive: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ink-text">Visible in menu</label>
                <Toggle
                  checked={formData.isVisibleInMenu}
                  onChange={(v) => setFormData({ ...formData, isVisibleInMenu: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ink-text">Available for dine-in</label>
                <Toggle
                  checked={formData.availableForDineIn}
                  onChange={(v) => setFormData({ ...formData, availableForDineIn: v })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <BtnGhost
              type="button"
              onClick={handleCloseModal}
              disabled={actionLoading}
            >
              <X className="h-4 w-4" />
              Cancel
            </BtnGhost>
            <BtnPrimary type="submit" disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Create category'
              )}
            </BtnPrimary>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
