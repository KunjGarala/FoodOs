import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { 
  Edit2, 
  Trash2, 
  Plus, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Tag,
  Search,
  Power
} from 'lucide-react';
import { couponAPI } from '../../services/api';

const CouponManagement = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { activeRestaurantId } = useSelector((state) => state.auth);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponAPI.getAll({ restaurantUuid: activeRestaurantId, size: 100 });
      setCoupons(response.data.content || []);
    } catch (err) {
      setError('Failed to load coupons. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRestaurantId) {
      fetchCoupons();
    }
  }, [activeRestaurantId]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleDelete = async (couponUuid) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      setActionLoading(true);
      try {
        await couponAPI.delete(couponUuid);
        setSuccess('Coupon deleted successfully');
        fetchCoupons();
      } catch (err) {
        setError('Failed to delete coupon');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleToggleStatus = async (coupon) => {
    setActionLoading(true);
    try {
      await couponAPI.toggleStatus(coupon.couponUuid, !coupon.active);
      setSuccess(`Coupon ${!coupon.active ? 'activated' : 'deactivated'} successfully`);
      fetchCoupons();
    } catch (err) {
      setError('Failed to update coupon status');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toast */}
      {(error || success) && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in ${
          error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <span className="font-medium text-sm">{error || success}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Coupon Management</h1>
          <p className="text-sm text-slate-500">Create and manage discount codes for your restaurant</p>
        </div>
        <Button onClick={() => navigate('/app/coupons/new')} disabled={actionLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by code or name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50/30">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Tag className="h-12 w-12 mb-2 opacity-50" />
              <p>No coupons found</p>
              <Button onClick={() => navigate('/app/coupons/new')} variant="secondary" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Discount</th>
                  <th className="px-6 py-3">Scope</th>
                  <th className="px-6 py-3">Validity</th>
                  <th className="px-6 py-3">Limits</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.couponUuid} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{coupon.code}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]" title={coupon.name}>{coupon.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {coupon.discountType === 'PERCENTAGE' 
                          ? `${coupon.discountValue}% off` 
                          : `$${coupon.discountValue} off`}
                      </div>
                      <div className="text-xs text-slate-500">
                        Min: ${coupon.minOrderAmount}
                        {coupon.maxDiscountAmount ? ` | Max: $${coupon.maxDiscountAmount}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={coupon.scopeType === 'GLOBAL_CHAIN' ? 'primary' : 'outline'} className="text-xs">
                        {coupon.scopeType === 'GLOBAL_CHAIN' ? 'Chain-wide' : 'Single restaurant'}
                      </Badge>
                      <div className="text-xs text-slate-500 mt-1">
                        {coupon.scopeType === 'GLOBAL_CHAIN' ? 'Applies across the restaurant group' : 'Limited to this outlet'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{new Date(coupon.startDate).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-500">to {new Date(coupon.endDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">Global: {coupon.usageLimitGlobal || 'Unlimited'}</div>
                      <div className="text-xs text-slate-500">Per User: {coupon.usageLimitPerUser || 'Unlimited'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={coupon.active ? 'success' : 'danger'} className="text-xs">
                        {coupon.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(coupon)}
                          disabled={actionLoading}
                          className={`p-2 rounded transition-colors ${coupon.active ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={coupon.active ? "Deactivate" : "Activate"}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/app/coupons/${coupon.couponUuid}/edit`)}
                          disabled={actionLoading}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.couponUuid)}
                          disabled={actionLoading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CouponManagement;
