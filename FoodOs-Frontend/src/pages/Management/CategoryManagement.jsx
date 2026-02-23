import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
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
  ChevronDown
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

const CategoryManagement = () => {
  const dispatch = useDispatch();
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Category Management</h1>
          <p className="text-sm text-slate-500">Organize your menu items into categories</p>
        </div>
        <Button onClick={() => handleOpenModal()} disabled={actionLoading} className="self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search categories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <FolderOpen className="h-12 w-12 mb-2" />
              <p>No categories found</p>
              <Button onClick={() => handleOpenModal()} variant="secondary" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Category
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredCategories.map(category => {
                  const isActive = category.isActive !== false;
                  const categoryId = category.categoryUuid || category.uuid;
                  const isExpanded = expandedCategories[categoryId];
                  const hasSubcategories = currentCategory?.categoryUuid === categoryId && currentCategory?.subCategories?.length > 0;

                  return (
                    <div key={categoryId} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <button
                            onClick={() => handleToggleExpand(categoryId)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors shrink-0"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-600" /> : <ChevronRight className="h-4 w-4 text-slate-600" />}
                          </button>
                          {category.colorCode ? (
                            <div className="h-4 w-4 rounded shrink-0" style={{ backgroundColor: category.colorCode }} />
                          ) : (
                            <FolderOpen className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                          <span className="font-medium text-slate-900 truncate">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => handleOpenModal(category)} disabled={actionLoading} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(categoryId)} disabled={actionLoading} className="p-2 text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {category.description && <p className="text-sm text-slate-500 mt-1 ml-7">{category.description}</p>}
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-7">
                        <Badge 
                          variant={isActive ? 'success' : 'danger'} 
                          className="text-xs cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => handleToggleActive(categoryId, e)}
                          title="Click to toggle active status"
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {category.isVisibleInMenu !== false && <Badge variant="info" className="text-xs">Menu</Badge>}
                        {category.parentCategoryName && <Badge variant="outline" className="text-xs">{category.parentCategoryName}</Badge>}
                      </div>

                      {/* Mobile subcategories */}
                      {isExpanded && hasSubcategories && (
                        <div className="mt-3 ml-7 space-y-2">
                          {currentCategory.subCategories.map(subCat => (
                            <div key={subCat.categoryUuid} className="bg-slate-50 rounded-lg p-3 flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {subCat.colorCode ? <div className="h-3 w-3 rounded shrink-0" style={{ backgroundColor: subCat.colorCode }} /> : <FolderOpen className="h-3 w-3 text-slate-400 shrink-0" />}
                                  <span className="text-sm text-slate-700 truncate">{subCat.name}</span>
                                  <Badge variant="outline" className="text-xs">Child</Badge>
                                </div>
                                {subCat.description && <p className="text-xs text-slate-500 mt-1">{subCat.description}</p>}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => handleOpenModal({ ...subCat, parentCategoryUuid: categoryId, parentCategoryName: category.name })} disabled={actionLoading} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded">
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button onClick={() => handleDelete(subCat.categoryUuid)} disabled={actionLoading} className="p-1.5 text-red-600 hover:bg-red-100 rounded">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
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
                  <th className="px-6 py-3">Category Name</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Parent</th>
                  <th className="px-6 py-3">Sort Order</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map(category => {
                  const isActive = category.isActive !== false;
                  const categoryId = category.categoryUuid || category.uuid;
                  const isExpanded = expandedCategories[categoryId];
                  const hasSubcategories = currentCategory?.categoryUuid === categoryId && currentCategory?.subCategories?.length > 0;
                  
                  return (
                    <React.Fragment key={categoryId}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleExpand(categoryId)}
                              className="p-1 hover:bg-slate-200 rounded transition-colors"
                              title={isExpanded ? "Collapse" : "Expand"}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-600" />
                              )}
                            </button>
                            {category.colorCode && (
                              <div 
                                className="h-4 w-4 rounded" 
                                style={{ backgroundColor: category.colorCode }}
                              />
                            )}
                            {!category.colorCode && <FolderOpen className="h-4 w-4 text-slate-400" />}
                            <span className="font-medium text-slate-900">{category.name}</span>
                          </div>
                        </td>
                      <td className="px-6 py-3 text-slate-600">
                        {category.description || 'No description'}
                      </td>
                      <td className="px-6 py-3 text-slate-600 text-sm">
                        {category.parentCategoryName || '-'}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        <Badge variant="secondary">{category.sortOrder || 0}</Badge>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-1">
                          <Badge 
                            variant={isActive ? 'success' : 'danger'} 
                            className="text-xs cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => handleToggleActive(categoryId, e)}
                            title="Click to toggle active status"
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {category.isVisibleInMenu !== false && (
                            <Badge variant="info" className="text-xs">Menu</Badge>
                          )}
                        </div>
                      </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(category)}
                              disabled={actionLoading}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                              title="Edit Category"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(categoryId)}
                              disabled={actionLoading}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Delete Category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Subcategories */}
                      {isExpanded && hasSubcategories && currentCategory.subCategories.map(subCat => (
                        <tr key={subCat.categoryUuid} className="bg-slate-50/50 hover:bg-slate-100 transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2 pl-8">
                              {subCat.colorCode && (
                                <div 
                                  className="h-3 w-3 rounded" 
                                  style={{ backgroundColor: subCat.colorCode }}
                                />
                              )}
                              {!subCat.colorCode && <FolderOpen className="h-3 w-3 text-slate-400" />}
                              <span className="text-sm text-slate-700">{subCat.name}</span>
                              <Badge variant="outline" className="text-xs">Child</Badge>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-slate-600 text-sm">
                            {subCat.description || 'No description'}
                          </td>
                          <td className="px-6 py-3 text-slate-600 text-sm">
                            {category.name}
                          </td>
                          <td className="px-6 py-3 text-slate-600">
                            <Badge variant="secondary" className="text-xs">{subCat.sortOrder || 0}</Badge>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex gap-1">
                              <Badge 
                                variant={subCat.isActive !== false ? 'success' : 'danger'} 
                                className="text-xs cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={(e) => handleToggleActive(subCat.categoryUuid, e)}
                                title="Click to toggle active status"
                              >
                                {subCat.isActive !== false ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  const fullSubCat = {
                                    ...subCat,
                                    parentCategoryUuid: categoryId,
                                    parentCategoryName: category.name
                                  };
                                  handleOpenModal(fullSubCat);
                                }}
                                disabled={actionLoading}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                                title="Edit Subcategory"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(subCat.categoryUuid)}
                                disabled={actionLoading}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Delete Subcategory"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            </>
          )}
        </div>

        {/* Category Count Footer */}
        {!loading && filteredCategories.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <p className="text-sm text-slate-600">
              Showing {filteredCategories.length} of {categories.length} categories
            </p>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Appetizers, Main Course, Desserts"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={100}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this category"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Parent Category
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sort Order
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  min="0"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Lower numbers appear first
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Image URL
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Icon Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g., pizza, burger, coffee"
                  value={formData.iconName}
                  onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                  maxLength={50}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Color Code
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={formData.colorCode}
                    onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                    className="h-10 w-20 rounded border border-slate-300 cursor-pointer"
                  />
                  <Input
                    type="text"
                    placeholder="#3B82F6"
                    value={formData.colorCode}
                    onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    maxLength={7}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Hex color for category identification
                </p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                  Active
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isVisibleInMenu"
                  checked={formData.isVisibleInMenu}
                  onChange={(e) => setFormData({ ...formData, isVisibleInMenu: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isVisibleInMenu" className="text-sm font-medium text-slate-700">
                  Visible in Menu
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="availableForDineIn"
                  checked={formData.availableForDineIn}
                  onChange={(e) => setFormData({ ...formData, availableForDineIn: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="availableForDineIn" className="text-sm font-medium text-slate-700">
                  Available for Dine-In
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleCloseModal}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingCategory ? 'Update Category' : 'Create Category'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
