import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Edit2, Trash2, Plus, Filter, MoreHorizontal, Loader2, AlertCircle, CheckCircle, Star, Eye, EyeOff } from 'lucide-react';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
  toggleFeaturedStatus,
  clearError,
  clearSuccess,
} from '../../store/productSlice';
import {
  fetchCategories,
} from '../../store/categorySlice';

const MenuManagement = () => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    basePrice: '',
    categoryId: '',
    isVeg: true,
    isFeatured: false,
    isAvailable: true,
  });

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
        basePrice: product.basePrice || '',
        categoryId: product.category?.uuid || '',
        isVeg: product.isVeg,
        isFeatured: product.isFeatured || false,
        isAvailable: product.isAvailable !== false,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        sku: '',
        basePrice: '',
        categoryId: '',
        isVeg: true,
        isFeatured: false,
        isAvailable: true,
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
      basePrice: '',
      categoryId: '',
      isVeg: true,
      isFeatured: false,
      isAvailable: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      description: formData.description,
      sku: formData.sku,
      basePrice: parseFloat(formData.basePrice),
      categoryId: formData.categoryId,
      isVeg: formData.isVeg,
      isFeatured: formData.isFeatured,
      isAvailable: formData.isAvailable,
    };

    try {
      if (editingProduct) {
        await dispatch(updateProduct({
          restaurantUuid: activeRestaurantId,
          productUuid: editingProduct.uuid,
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

  const handleToggleAvailability = async (productUuid) => {
    try {
      await dispatch(toggleProductAvailability({
        restaurantUuid: activeRestaurantId,
        productUuid,
      })).unwrap();
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    }
  };

  const handleToggleFeatured = async (productUuid) => {
    try {
      await dispatch(toggleFeaturedStatus({
        restaurantUuid: activeRestaurantId,
        productUuid,
      })).unwrap();
    } catch (error) {
      console.error('Failed to toggle featured:', error);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = 
      categoryFilter === 'all' || 
      product.category?.uuid === categoryFilter;
    
    return matchesSearch && matchesCategory;
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
          <h1 className="text-2xl font-bold text-slate-800">Menu Management</h1>
          <p className="text-slate-500">Manage your items, categories and pricing</p>
        </div>
        <Button onClick={() => handleOpenModal()} disabled={actionLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Input 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.uuid} value={cat.uuid}>{cat.name}</option>
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
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                <tr>
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
                  const price = product.variations?.[0]?.price || product.basePrice || 0;
                  const isAvailable = product.isAvailable !== false;
                  
                  return (
                    <tr key={product.uuid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          {product.sku && (
                            <span className="text-xs text-slate-400 font-mono">{product.sku}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {product.category?.name || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-3 font-semibold">₹{price}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          product.isVeg 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {product.isVeg ? 'Veg' : 'Non-Veg'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleToggleAvailability(product.uuid)}
                          disabled={actionLoading}
                        >
                          <Badge variant={isAvailable ? 'success' : 'danger'}>
                            {isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleToggleFeatured(product.uuid)}
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
                            onClick={() => handleOpenModal(product)}
                            disabled={actionLoading}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                            onClick={() => handleDelete(product.uuid)}
                            disabled={actionLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingProduct ? 'Edit Menu Item' : 'Add New Menu Item'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={handleCloseModal} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                editingProduct ? 'Update Item' : 'Save Item'
              )}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Item Name *</label>
              <Input 
                placeholder="e.g. Butter Chicken" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Item Code (SKU)</label>
              <Input 
                placeholder="e.g. M001" 
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Category *</label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.uuid} value={cat.uuid}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Base Price (₹) *</label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.00" 
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea 
              className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none" 
              placeholder="Item description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVeg"
                checked={formData.isVeg}
                onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                className="rounded border-slate-300"
              />
              <label htmlFor="isVeg" className="text-sm text-slate-700">Vegetarian</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="rounded border-slate-300"
              />
              <label htmlFor="isFeatured" className="text-sm text-slate-700">Featured</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="rounded border-slate-300"
              />
              <label htmlFor="isAvailable" className="text-sm text-slate-700">Available</label>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MenuManagement;
