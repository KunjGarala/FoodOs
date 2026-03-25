import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Search, Phone, Mail, MapPin, Calendar, Users, UserCheck,
  Percent, Star, ShoppingBag, Tag, StickyNote,
  ChevronLeft, ChevronRight, Eye, Edit2, X, Save,
} from 'lucide-react';
import {
  fetchCustomers,
  searchCustomers,
  fetchCustomerDetail,
  updateCustomer,
  fetchCrmStats,
  clearCustomerDetail,
  setSearchQuery,
} from '../../store/customerSlice';

const CustomerCRM = () => {
  const dispatch = useDispatch();
  const { activeRestaurantId } = useSelector((state) => state.auth);
  const {
    customers, totalElements, totalPages, currentPage,
    selectedCustomer, stats,
    loading, detailLoading, searchQuery,
  } = useSelector((state) => state.customers);

  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [detailOpen, setDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ notes: '', tags: '' });
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Load customers and stats on mount
  useEffect(() => {
    if (activeRestaurantId) {
      dispatch(fetchCustomers({ restaurantUuid: activeRestaurantId, page: 0, size: 20 }));
      dispatch(fetchCrmStats(activeRestaurantId));
    }
  }, [dispatch, activeRestaurantId]);

  // Debounced search
  const handleSearchChange = useCallback((value) => {
    setLocalSearch(value);
    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(() => {
      dispatch(setSearchQuery(value));
      if (value.trim()) {
        dispatch(searchCustomers({ restaurantUuid: activeRestaurantId, query: value, page: 0, size: 20 }));
      } else {
        dispatch(fetchCustomers({ restaurantUuid: activeRestaurantId, page: 0, size: 20 }));
      }
    }, 400);
    setDebounceTimer(timer);
  }, [dispatch, activeRestaurantId, debounceTimer]);

  // Pagination
  const handlePageChange = (newPage) => {
    if (localSearch.trim()) {
      dispatch(searchCustomers({ restaurantUuid: activeRestaurantId, query: localSearch, page: newPage, size: 20 }));
    } else {
      dispatch(fetchCustomers({ restaurantUuid: activeRestaurantId, page: newPage, size: 20 }));
    }
  };

  // View customer detail
  const handleViewCustomer = (customerUuid) => {
    dispatch(fetchCustomerDetail(customerUuid));
    setDetailOpen(true);
    setEditMode(false);
  };

  // Close detail modal
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setEditMode(false);
    dispatch(clearCustomerDetail());
  };

  // Start editing
  const handleStartEdit = () => {
    if (selectedCustomer) {
      setEditForm({
        notes: selectedCustomer.notes || '',
        tags: selectedCustomer.tags || '',
        name: selectedCustomer.name || '',
        email: selectedCustomer.email || '',
        address: selectedCustomer.address || '',
      });
      setEditMode(true);
    }
  };

  // Save edits
  const handleSaveEdit = () => {
    if (selectedCustomer) {
      dispatch(updateCustomer({
        customerUuid: selectedCustomer.customerUuid,
        data: editForm,
      })).then(() => {
        dispatch(fetchCustomerDetail(selectedCustomer.customerUuid));
        setEditMode(false);
      });
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Relative time
  const relativeTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Customer CRM</h1>
          <p className="text-sm text-slate-500">Customer insights from order data</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalCustomers || 0}</p>
                <p className="text-xs text-slate-500">Total Customers</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.returningCustomers || 0}</p>
                <p className="text-xs text-slate-500">Returning</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.newCustomers || 0}</p>
                <p className="text-xs text-slate-500">New Customers</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Percent className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.returnRate || 0}%</p>
                <p className="text-xs text-slate-500">Return Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer List */}
      <Card className="flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <Input
                className="pl-10"
                placeholder="Search by name, phone, or email..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <span className="text-sm text-slate-500 hidden sm:inline">
              {totalElements} customer{totalElements !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Empty State */}
        {!loading && customers.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
            <Users className="h-12 w-12 mb-3" />
            <p className="text-lg font-medium">No customers found</p>
            <p className="text-sm mt-1">
              {localSearch ? 'Try a different search term' : 'Customers will appear here as orders come in'}
            </p>
          </div>
        )}

        {/* Customer List */}
        {!loading && customers.length > 0 && (
          <div className="flex-1 overflow-auto">
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-slate-100">
              {customers.map((customer) => (
                <div key={customer.customerUuid} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{customer.name}</p>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-0.5">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="truncate">{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-xs"
                      onClick={() => handleViewCustomer(customer.customerUuid)}
                    >
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {customer.totalOrders || 0} visit{customer.totalOrders !== 1 ? 's' : ''}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-sm text-slate-700 font-medium">
                      {formatCurrency(customer.totalSpent)}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">{relativeTime(customer.lastOrderDate)}</span>
                    {customer.tags && customer.tags.split(',').slice(0, 2).map((tag, i) => (
                      <Badge key={i} variant="primary">{tag.trim()}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <table className="hidden md:table w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3 text-center">Visits</th>
                  <th className="px-6 py-3 text-right">Total Spent</th>
                  <th className="px-6 py-3 text-right">Avg Order</th>
                  <th className="px-6 py-3">Last Visit</th>
                  <th className="px-6 py-3">Tags</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr key={customer.customerUuid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{customer.name}</p>
                        {customer.email && (
                          <p className="text-xs text-slate-500 mt-0.5">{customer.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="font-semibold text-slate-900">{customer.totalOrders || 0}</span>
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-600">
                      {formatCurrency(customer.averageOrderValue)}
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      <span title={formatDate(customer.lastOrderDate)}>
                        {relativeTime(customer.lastOrderDate)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {customer.tags ? customer.tags.split(',').slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="primary">{tag.trim()}</Badge>
                        )) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCustomer(customer.customerUuid)}
                      >
                        View Profile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 shrink-0">
            <p className="text-sm text-slate-500">
              Page {currentPage + 1} of {totalPages} ({totalElements} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages - 1}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={detailOpen}
        onClose={handleCloseDetail}
        title={selectedCustomer ? `${selectedCustomer.name}` : 'Customer Profile'}
        size="xl"
        footer={
          editMode ? (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditMode(false)}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save className="h-4 w-4 mr-1" /> Save Changes
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCloseDetail}>Close</Button>
              <Button onClick={handleStartEdit}>
                <Edit2 className="h-4 w-4 mr-1" /> Edit
              </Button>
            </div>
          )
        }
      >
        {detailLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {!detailLoading && selectedCustomer && (
          <div className="space-y-6">
            {/* Contact Info & Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Contact</h4>
                {editMode ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <Input
                      placeholder="Email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                    <Input
                      placeholder="Address"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-700">{selectedCustomer.phone}</span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700">{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                        <span className="text-slate-700">{selectedCustomer.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">Customer since {formatDate(selectedCustomer.firstOrderDate)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Statistics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-lg font-bold text-slate-900">{selectedCustomer.totalOrders || 0}</p>
                    <p className="text-xs text-slate-500">Total Orders</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedCustomer.totalSpent)}</p>
                    <p className="text-xs text-slate-500">Total Spent</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(selectedCustomer.averageOrderValue)}</p>
                    <p className="text-xs text-slate-500">Avg Order</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-lg font-bold text-slate-900">{relativeTime(selectedCustomer.lastOrderDate)}</p>
                    <p className="text-xs text-slate-500">Last Visit</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Tags
                </h4>
                {editMode ? (
                  <Input
                    placeholder="Comma-separated tags (e.g., VIP, Regular)"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCustomer.tags ? selectedCustomer.tags.split(',').map((tag, i) => (
                      <Badge key={i} variant="primary">{tag.trim()}</Badge>
                    )) : (
                      <span className="text-sm text-slate-400">No tags</span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <StickyNote className="h-3.5 w-3.5" /> Notes
                </h4>
                {editMode ? (
                  <textarea
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Add notes about this customer..."
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  />
                ) : (
                  <p className="text-sm text-slate-600">
                    {selectedCustomer.notes || <span className="text-slate-400">No notes</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Favorite Items */}
            {selectedCustomer.favoriteItems && selectedCustomer.favoriteItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" /> Favorite Items
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.favoriteItems.map((item, i) => (
                    <div key={i} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-100 flex items-center gap-1.5">
                      <span>{item.productName}</span>
                      <span className="bg-blue-200 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">{item.timesOrdered}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order History */}
            {selectedCustomer.recentOrders && selectedCustomer.recentOrders.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <ShoppingBag className="h-3.5 w-3.5" /> Order History
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-2 text-left">Order #</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-center">Items</th>
                        <th className="px-4 py-2 text-right">Total</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedCustomer.recentOrders.map((order) => (
                        <tr key={order.orderUuid} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium text-slate-900">{order.orderNumber}</td>
                          <td className="px-4 py-2 text-slate-600">{formatDate(order.orderDate)}</td>
                          <td className="px-4 py-2">
                            <Badge variant={order.orderType === 'DINE_IN' ? 'primary' : order.orderType === 'DELIVERY' ? 'warning' : 'default'}>
                              {order.orderType?.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-center text-slate-600">{order.itemCount || '—'}</td>
                          <td className="px-4 py-2 text-right font-medium text-slate-900">{formatCurrency(order.totalAmount)}</td>
                          <td className="px-4 py-2 text-center">
                            <Badge variant={
                              order.status === 'COMPLETED' ? 'success' :
                              order.status === 'CANCELLED' ? 'danger' :
                              order.status === 'PAID' ? 'success' : 'default'
                            }>
                              {order.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerCRM;
