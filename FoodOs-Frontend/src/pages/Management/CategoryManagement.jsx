import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import {
  PageHeader,
  Panel,
  Pill,
  Toggle,
  BtnPrimary,
  BtnGhost,
} from '../../components/ui/kit';
import { cn } from '../../utils/cn';
import {
  Edit2,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  GripVertical,
  X,
} from 'lucide-react';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchCategoryByUuid,
  toggleActiveStatus,
  clearError,
  clearSuccess,
  clearCurrentCategory,
} from '../../store/categorySlice';

const SUB_TABS = [
  { label: 'Items', path: '/app/menu' },
  { label: 'Categories', path: '/app/categories' },
  { label: 'Modifier groups', path: '/app/modifiers' },
];

const CategoryManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  // Form state
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

  // Redux state
  const { activeRestaurantId } = useSelector((state) => state.auth);
  const {
    categories,
    currentCategory,
    loading,
    actionLoading,
    error,
    success
  } = useSelector((state) => state.categories);

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

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
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
    } else {
      setEditingCategory(null);
      setFormData({
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
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
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
    dispatch(clearCurrentCategory());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const categoryData = {
      name: formData.name,
      description: formData.description || undefined,
      parentCategoryUuid: formData.parentCategoryUuid || undefined,
      sortOrder: parseInt(formData.sortOrder) || 0,
      imageUrl: formData.imageUrl || undefined,
      iconName: formData.iconName || undefined,
      colorCode: formData.colorCode || undefined,
      isActive: formData.isActive,
      isVisibleInMenu: formData.isVisibleInMenu,
      availableForDineIn: formData.availableForDineIn,
    };

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
      // Refresh categories list
      dispatch(fetchCategories(activeRestaurantId));
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDelete = async (categoryUuid) => {
    if (window.confirm('Are you sure you want to delete this category? All products in this category will be affected.')) {
      try {
        await dispatch(deleteCategory({
          restaurantUuid: activeRestaurantId,
          categoryUuid,
        })).unwrap();
        // Refresh categories list
        dispatch(fetchCategories(activeRestaurantId));
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  const handleToggleActive = async (categoryUuid, e) => {
    e?.stopPropagation();
    console.log('Toggle clicked for category:', categoryUuid);
    console.log('Restaurant UUID:', activeRestaurantId);
    try {
      await dispatch(toggleActiveStatus({
        restaurantUuid: activeRestaurantId,
        categoryUuid,
      })).unwrap();
      console.log('Toggle successful');
      // Refresh categories to show updated status
      dispatch(fetchCategories(activeRestaurantId));
    } catch (error) {
      console.error('Failed to toggle category status:', error);
    }
  };

  const handleToggleExpand = async (categoryUuid) => {
    // Toggle expansion state
    const isCurrentlyExpanded = expandedCategories[categoryUuid];

    if (!isCurrentlyExpanded) {
      // Fetch category details with subcategories
      try {
        await dispatch(fetchCategoryByUuid({
          restaurantUuid: activeRestaurantId,
          categoryUuid,
        })).unwrap();

        setExpandedCategories(prev => ({
          ...prev,
          [categoryUuid]: true
        }));
      } catch (error) {
        console.error('Failed to fetch category details:', error);
      }
    } else {
      // Collapse
      setExpandedCategories(prev => {
        const newState = { ...prev };
        delete newState[categoryUuid];
        return newState;
      });
    }
  };

  // Filter categories
  const filteredCategories = categories.filter(category => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const initials = (name) =>
    (name || '?')
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

  // A single category row (also reused for subcategories with a slight indent).
  const CategoryRow = ({ category, isSub = false, parent = null }) => {
    const isActive = category.isActive !== false;
    const categoryId = category.categoryUuid || category.uuid;
    const isExpanded = expandedCategories[categoryId];
    const hasSubcategories =
      currentCategory?.categoryUuid === categoryId &&
      currentCategory?.subCategories?.length > 0;
    const isVisible = category.isVisibleInMenu !== false;

    return (
      <div
        className={cn(
          'group flex items-center gap-3 px-3 sm:px-4 py-3 transition-colors hover:bg-paper-2',
          isSub && 'pl-10 sm:pl-14 bg-paper-2/40',
        )}
      >
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab text-txt-faint hover:text-txt-muted shrink-0 touch-none"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Expand toggle (top-level only) */}
        {!isSub ? (
          <button
            onClick={() => handleToggleExpand(categoryId)}
            className="p-1 -ml-1 rounded-input text-txt-muted hover:bg-paper-3 transition-colors shrink-0"
            title={isExpanded ? 'Collapse' : 'Expand'}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        {/* Thumbnail / initials block */}
        <div
          className={cn(
            'shrink-0 rounded-tile flex items-center justify-center overflow-hidden font-display font-bold text-white',
            isSub ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-xs',
          )}
          style={{ backgroundColor: category.colorCode || '#9a6500' }}
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
            <span
              className={cn(
                'font-medium text-ink-text truncate',
                isSub ? 'text-sm' : 'text-[15px]',
              )}
            >
              {category.name}
            </span>
            {isSub && <Pill tone="neutral">Child</Pill>}
            {!isVisible && <Pill tone="neutral">Hidden</Pill>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-txt-muted truncate">
              {category.description || 'No description'}
            </span>
            <span className="text-txt-faint">·</span>
            <span className="font-mono text-[11px] text-txt-faint">
              #{category.sortOrder || 0}
            </span>
          </div>
        </div>

        {/* Availability pill */}
        <button
          type="button"
          onClick={(e) => handleToggleActive(categoryId, e)}
          title="Click to toggle active status"
          className="shrink-0 hidden sm:inline-flex"
        >
          <Pill tone={isActive ? 'success' : 'danger'}>
            {isActive ? 'Available' : 'Unavailable'}
          </Pill>
        </button>

        {/* Visible toggle */}
        <div className="shrink-0 hidden sm:block">
          <Toggle
            size="sm"
            checked={isVisible}
            onChange={() => handleToggleActive(categoryId)}
            disabled={actionLoading}
          />
        </div>

        {/* Row actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() =>
              isSub
                ? handleOpenModal({
                    ...category,
                    parentCategoryUuid: parent?.id,
                    parentCategoryName: parent?.name,
                  })
                : handleOpenModal(category)
            }
            disabled={actionLoading}
            className="p-2 rounded-input text-txt-muted hover:text-marigold hover:bg-marigold/10 transition-colors disabled:opacity-50"
            title="Edit"
            aria-label="Edit category"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(categoryId)}
            disabled={actionLoading}
            className="p-2 rounded-input text-txt-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
            title="Delete"
            aria-label="Delete category"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Subcategories render outside this row, handled by parent map */}
        {!isSub && isExpanded && hasSubcategories && null}
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
        title="Categories"
        subtitle="Organize your menu items into categories"
        actions={
          <BtnPrimary onClick={() => handleOpenModal()} disabled={actionLoading}>
            <Plus className="h-4 w-4" />
            Add category
          </BtnPrimary>
        }
      />

      {/* Sub-tabs (underline / marigold) */}
      <nav className="flex items-center gap-6 border-b border-line-light">
        {SUB_TABS.map((tab) => {
          const active = tab.label === 'Categories';
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => !active && navigate(tab.path)}
              className={cn(
                'relative -mb-px pb-3 text-sm font-medium transition-colors',
                active
                  ? 'text-ink-text'
                  : 'text-txt-muted hover:text-ink-text',
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

      <Panel className="overflow-hidden">
        {/* Search bar */}
        <div className="p-3 sm:p-4 border-b border-line-light">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-faint" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold"
            />
          </div>
        </div>

        {/* List body */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-marigold" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-txt-muted">
              <div className="h-14 w-14 rounded-tile bg-paper-3 flex items-center justify-center mb-3">
                <FolderOpen className="h-7 w-7 text-txt-faint" />
              </div>
              <p className="text-sm font-medium text-ink-text">No categories found</p>
              <p className="text-xs text-txt-faint mt-1">
                Create a category to start organizing your menu
              </p>
              <BtnPrimary onClick={() => handleOpenModal()} className="mt-4">
                <Plus className="h-4 w-4" />
                Create your first category
              </BtnPrimary>
            </div>
          ) : (
            <div className="divide-y divide-line-light">
              {filteredCategories.map((category) => {
                const categoryId = category.categoryUuid || category.uuid;
                const isExpanded = expandedCategories[categoryId];
                const hasSubcategories =
                  currentCategory?.categoryUuid === categoryId &&
                  currentCategory?.subCategories?.length > 0;

                return (
                  <React.Fragment key={categoryId}>
                    <CategoryRow category={category} />
                    {isExpanded &&
                      hasSubcategories &&
                      currentCategory.subCategories.map((subCat) => (
                        <CategoryRow
                          key={subCat.categoryUuid}
                          category={subCat}
                          isSub
                          parent={{ id: categoryId, name: category.name }}
                        />
                      ))}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer count */}
        {!loading && filteredCategories.length > 0 && (
          <div className="px-4 py-3 border-t border-line-light bg-paper-2">
            <p className="text-xs text-txt-muted">
              Showing{' '}
              <span className="font-mono text-ink-text">{filteredCategories.length}</span>{' '}
              of{' '}
              <span className="font-mono text-ink-text">{categories.length}</span>{' '}
              categories
            </p>
          </div>
        )}
      </Panel>

      {/* Create/Edit Modal — re-skinned settings sheet */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit category' : 'New category'}
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
                    .filter(cat => (cat.categoryUuid || cat.uuid) !== (editingCategory?.categoryUuid || editingCategory?.uuid))
                    .map(cat => (
                      <option key={cat.categoryUuid || cat.uuid} value={cat.categoryUuid || cat.uuid}>
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
              ) : editingCategory ? (
                'Update category'
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
