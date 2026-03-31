import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  ArrowLeft,
  Loader2, 
  AlertCircle, 
  Tag,
  Calendar,
  DollarSign,
  TrendingDown,
  Percent,
  Settings,
  ShieldAlert
} from 'lucide-react';
import { couponAPI } from '../../services/api';

const CouponEditor = () => {
  const { couponUuid } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!couponUuid;
  
  const { activeRestaurantId } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(isEditMode);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxDiscountAmount: '',
    minOrderAmount: '0.00',
    startDate: '',
    endDate: '',
    usageLimitGlobal: '',
    usageLimitPerUser: '',
    isActive: true,
    allowStacking: false,
    scopeType: 'RESTAURANT_SPECIFIC',
  });

  // Format datetime correctly for <input type="datetime-local"> 
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
  };

  useEffect(() => {
    if (isEditMode && activeRestaurantId) {
      const fetchCouponDetails = async () => {
        try {
          // Fetch existing coupon details
          const response = await couponAPI.getById(couponUuid);
          const coupon = response.data;
          
          setFormData({
            code: coupon.code || '',
            name: coupon.name || '',
            description: coupon.description || '',
            discountType: coupon.discountType || 'PERCENTAGE',
            discountValue: coupon.discountValue !== null ? String(coupon.discountValue) : '',
            maxDiscountAmount: coupon.maxDiscountAmount !== null ? String(coupon.maxDiscountAmount) : '',
            minOrderAmount: coupon.minOrderAmount !== null ? String(coupon.minOrderAmount) : '0.00',
            startDate: formatDateForInput(coupon.startDate),
            endDate: formatDateForInput(coupon.endDate),
            usageLimitGlobal: coupon.usageLimitGlobal || '',
            usageLimitPerUser: coupon.usageLimitPerUser || '',
            isActive: coupon.active !== false,
            allowStacking: coupon.allowStacking === true,
            scopeType: coupon.scopeType || 'RESTAURANT_SPECIFIC',
          });
        } catch (err) {
          setError('Failed to load coupon details.');
          navigate('/app/coupons');
        } finally {
          setLoading(false);
        }
      };
      
      fetchCouponDetails();
    }
  }, [isEditMode, couponUuid, activeRestaurantId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    if (!activeRestaurantId) {
      setError('Select an active restaurant before saving a coupon.');
      setActionLoading(false);
      return;
    }

    // Format dates to append :00 for backend LocalDateTime strict parsing
    let finalStartDate = formData.startDate;
    if (finalStartDate && finalStartDate.length === 16) {
      finalStartDate += ':00';
    }
    
    let finalEndDate = formData.endDate;
    if (finalEndDate && finalEndDate.length === 16) {
      finalEndDate += ':00';
    }

    try {
      const isChainScope = formData.scopeType === 'GLOBAL_CHAIN';

      const payload = {
        ...formData,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        maxDiscountAmount: formData.discountType === 'FIXED' ? null : (formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
        startDate: finalStartDate,
        endDate: finalEndDate,
        usageLimitGlobal: formData.usageLimitGlobal ? parseInt(formData.usageLimitGlobal) : null,
        usageLimitPerUser: formData.usageLimitPerUser ? parseInt(formData.usageLimitPerUser) : null,
        restaurantUuids: isChainScope ? [] : [activeRestaurantId],
        ownerRestaurantUuid: isChainScope ? activeRestaurantId : null,
      };

      // CreateCouponRequest uses 'active', UpdateCouponRequest uses 'isActive'
      if (!isEditMode) {
        payload.active = formData.isActive;
        delete payload.isActive;
      }

      if (isEditMode) {
        // Exclude code on update, backend UpdateCouponRequest might not need it, or it ignores it
        await couponAPI.update(couponUuid, payload);
      } else {
        await couponAPI.create(payload);
      }
      
      // Redirect back to list
      navigate('/app/coupons');
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed. Please check the fields and try again.');
      // Scroll to top to see error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/app/coupons')}
          className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? 'Edit Coupon' : 'Create New Coupon'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isEditMode 
              ? 'Modify the details of an existing promotional code.'
              : 'Configure a new promotional discount code for your customers.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="font-medium text-sm">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Basic Information */}
        <Card className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">Basic Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Coupon Code <span className="text-red-500">*</span></label>
              <Input
                type="text"
                placeholder="e.g. SUMMER20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                disabled={isEditMode}
                required
                className="font-mono uppercase tracking-wider bg-slate-50"
              />
              <p className="text-xs text-slate-500 mt-1.5">Unique code applied at checkout. No spaces allowed.</p>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Display Name <span className="text-red-500">*</span></label>
              <Input
                type="text"
                placeholder="Summer Flash Sale"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
                placeholder="Internal or customer-facing details about this promotion..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Discount Configuration */}
        <Card className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-800">Discount Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Discount Type <span className="text-red-500">*</span></label>
              <div className="relative">
                <select
                  className="w-full pl-10 pr-4 py-2.5 text-sm appearance-none border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-shadow"
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  {formData.discountType === 'PERCENTAGE' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                </div>
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={formData.discountType === 'PERCENTAGE' ? "20" : "150.00"}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  required
                  className="pl-9"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {formData.discountType === 'PERCENTAGE' ? '%' : '₹'}
                </div>
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Minimum Order Amount <span className="text-red-500">*</span></label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  required
                  className="pl-9"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">₹</div>
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Cap Amount</label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional max cap"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  disabled={formData.discountType === 'FIXED'}
                  className={`pl-9 ${formData.discountType === 'FIXED' ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">₹</div>
              </div>
              {formData.discountType === 'PERCENTAGE' && (
                <p className="text-xs text-slate-500 mt-1.5">Maximum discount a customer can receive.</p>
              )}
            </div>

          </div>
        </Card>

        {/* Section 3: Validity and Limits */}
        <Card className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-800">Validity & Limits</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date & Time <span className="text-red-500">*</span></label>
              <Input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date & Time <span className="text-red-500">*</span></label>
              <Input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Total Usage Limit (Global)</label>
              <Input
                type="number"
                min="1"
                placeholder="Leave blank for infinite"
                value={formData.usageLimitGlobal}
                onChange={(e) => setFormData({ ...formData, usageLimitGlobal: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1.5">Total times this coupon can be used by anyone.</p>
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Per-Customer Limit</label>
              <Input
                type="number"
                min="1"
                placeholder="Leave blank for infinite"
                value={formData.usageLimitPerUser}
                onChange={(e) => setFormData({ ...formData, usageLimitPerUser: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1.5">Max times a single customer can redeem this code.</p>
            </div>
            
          </div>
        </Card>

        {/* Section 4: Settings */}
        <Card className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-800">Advanced Settings</h2>
          </div>
          <div className="p-6 space-y-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60">
                <p className="text-sm font-semibold text-slate-800 mb-2">Scope</p>
                <p className="text-xs text-slate-500 mb-3">Choose whether this coupon is limited to the active restaurant or applies across the full chain.</p>

                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      value="RESTAURANT_SPECIFIC"
                      checked={formData.scopeType === 'RESTAURANT_SPECIFIC'}
                      onChange={(e) => setFormData({ ...formData, scopeType: e.target.value })}
                      disabled={isEditMode}
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div>
                      <span className="block text-sm font-medium text-slate-800">Single restaurant</span>
                      <span className="block text-xs text-slate-500">Only usable at the currently active restaurant.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      value="GLOBAL_CHAIN"
                      checked={formData.scopeType === 'GLOBAL_CHAIN'}
                      onChange={(e) => setFormData({ ...formData, scopeType: e.target.value })}
                      disabled={isEditMode}
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div>
                      <span className="block text-sm font-medium text-slate-800">Entire chain</span>
                      <span className="block text-xs text-slate-500">Applies to all outlets under this restaurant group.</span>
                    </div>
                  </label>

                  {isEditMode && (
                    <p className="text-[11px] text-slate-500 mt-1">Scope is fixed after creation to avoid breaking existing mappings.</p>
                  )}
                </div>
              </div>
            </div>
            
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 transition-shadow"
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors">
                  Active Status
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  If disabled, customers cannot apply this code even if it's within the validity period.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={formData.allowStacking}
                  onChange={(e) => setFormData({ ...formData, allowStacking: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 transition-shadow"
                />
              </div>
              <div>
                <span className="block text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors">
                  Allow Stacking
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Allows customers to combine this coupon with other applicable promotions.
                </span>
              </div>
            </label>

          </div>
        </Card>

        {/* Form Actions */}
        <div className="pt-4 flex items-center justify-end gap-3 sticky bottom-4">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={() => navigate('/app/coupons')} 
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="w-full sm:w-auto px-8 shadow-md"
            disabled={actionLoading}
          >
            {actionLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              isEditMode ? 'Save Changes' : 'Create Coupon'
            )}
          </Button>
        </div>

      </form>
    </div>
  );
};

export default CouponEditor;
