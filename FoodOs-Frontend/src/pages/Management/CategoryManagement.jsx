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
  FolderOpen 
} from 'lucide-react';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchCategoryByUuid,
  clearError,
  clearSuccess,
  clearCurrentCategory,
} from '../../store/categorySlice';

const CategoryManagement = () => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    displayOrder: 0,
    isActive: true,
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
        displayOrder: category.displayOrder || 0,
        isActive: category.isActive !== false,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        displayOrder: 0,
        isActive: true,
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
      displayOrder: 0,
      isActive: true,
    });
    dispatch(clearCurrentCategory());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const categoryData = {
      name: formData.name,
      description: formData.description,
      displayOrder: parseInt(formData.displayOrder) || 0,
      isActive: formData.isActive,
    };

    try {
      if (editingCategory) {
        await dispatch(updateCategory({
          restaurantUuid: activeRestaurantId,
          categoryUuid: editingCategory.uuid,
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

  const handleViewDetails = async (categoryUuid) => {
    try {
      await dispatch(fetchCategoryByUuid({
        restaurantUuid: activeRestaurantId,
        categoryUuid,
      })).unwrap();
    } catch (error) {
      console.error('Failed to fetch category details:', error);
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

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Category Management</h1>
          <p className="text-slate-500">Organize your menu items into categories</p>
        </div>
        <Button onClick={() => handleOpenModal()} disabled={actionLoading}>
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
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                <tr>
                  <th className="px-6 py-3">Category Name</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Display Order</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map(category => {
                  const isActive = category.isActive !== false;
                  
                  return (
                    <tr key={category.uuid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-900">{category.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {category.description || 'No description'}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        <Badge variant="secondary">{category.displayOrder || 0}</Badge>
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={isActive ? 'success' : 'danger'}>
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
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
                            onClick={() => handleDelete(category.uuid)}
                            disabled={actionLoading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Delete Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category Name *
              </label>
              <Input
                type="text"
                placeholder="e.g., Appetizers, Main Course, Desserts"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of this category"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Display Order
              </label>
              <Input
                type="number"
                placeholder="0"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                min="0"
              />
              <p className="text-xs text-slate-500 mt-1">
                Lower numbers appear first in the menu
              </p>
            </div>

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
