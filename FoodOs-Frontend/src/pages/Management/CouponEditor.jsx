import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  PageHeader,
  Panel,
  Toggle,
  Segmented,
  BtnPrimary,
  BtnGhost,
} from '../../components/ui/kit';
import { cn } from '../../utils/cn';
import {
  Loader2,
  AlertCircle,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { couponAPI } from '../../services/api';

const INPUT_CLS =
  'w-full h-10 px-3 rounded-input bg-paper-2 border border-line-input text-sm text-ink-text placeholder:text-txt-faint focus:outline-none focus:ring-2 focus:ring-marigold/40 focus:border-marigold disabled:opacity-60 disabled:cursor-not-allowed';
const LABEL_CLS = 'eyebrow text-[11px] text-txt-faint block mb-1.5';

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
            // Map FIXED back to FLAT_AMOUNT for frontend UI state if the backend returned FIXED
            discountType: coupon.discountType === 'FIXED' ? 'FLAT_AMOUNT' : (coupon.discountType || 'PERCENTAGE'),
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
        } catch {
          setError('Failed to load coupon details.');
          navigate('/app/coupons');
        } finally {
          setLoading(false);
        }
      };

      fetchCouponDetails();
    }
  }, [isEditMode, couponUuid, activeRestaurantId, navigate]);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, code: result }));
  };

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
        // Send FIXED instead of FLAT_AMOUNT to backend
        discountType: formData.discountType === 'FLAT_AMOUNT' ? 'FIXED' : formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
        startDate: finalStartDate,
        endDate: finalEndDate,
        usageLimitGlobal: formData.usageLimitGlobal ? parseInt(formData.usageLimitGlobal) : null,
        usageLimitPerUser: formData.usageLimitPerUser ? parseInt(formData.usageLimitPerUser) : null,
        restaurantUuids: isChainScope ? [] : [activeRestaurantId],
        ownerRestaurantUuid: isChainScope ? activeRestaurantId : null,
      };

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
        <Loader2 className="w-10 h-10 animate-spin text-marigold" />
      </div>
    );
  }

  // ── Live preview helpers (presentation only) ──────────────────────────────
  const isPercent = formData.discountType === 'PERCENTAGE';
  const discountLabel = formData.discountValue
    ? isPercent
      ? `${formData.discountValue}% OFF`
      : `₹${formData.discountValue} OFF`
    : '—';
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <PageHeader
        eyebrow="Offers"
        title={isEditMode ? 'Edit coupon' : 'Coupon editor'}
        subtitle={
          isEditMode
            ? 'Modify the details of an existing promotional code.'
            : 'Configure a new promotional discount code for your customers.'
        }
        className="mb-6"
        actions={
          <>
            <BtnGhost type="button" onClick={() => navigate('/app/coupons')} disabled={actionLoading}>
              Cancel
            </BtnGhost>
            <BtnPrimary type="submit" form="coupon-form" disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : isEditMode ? (
                'Save changes'
              ) : (
                'Create coupon'
              )}
            </BtnPrimary>
          </>
        }
      />

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-input border border-danger/30 bg-danger/[0.08] px-4 py-3 text-danger-deep">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT: form ──────────────────────────────────────────────── */}
        <form id="coupon-form" onSubmit={handleSubmit}>
          <Panel className="p-5 sm:p-6 space-y-5">
            {/* Code + generate */}
            <div>
              <label className={LABEL_CLS}>Coupon code *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SUMMER20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  disabled={isEditMode}
                  required
                  className={cn(INPUT_CLS, 'font-mono uppercase tracking-wider')}
                />
                <BtnGhost type="button" onClick={generateCode} disabled={isEditMode} className="shrink-0">
                  <Sparkles className="h-4 w-4" /> Generate
                </BtnGhost>
              </div>
              <p className="text-xs text-txt-faint mt-1.5">Unique code applied at checkout. No spaces allowed.</p>
            </div>

            {/* Display name */}
            <div>
              <label className={LABEL_CLS}>Display name *</label>
              <input
                type="text"
                placeholder="Summer Flash Sale"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className={INPUT_CLS}
              />
            </div>

            {/* Description */}
            <div>
              <label className={LABEL_CLS}>Description</label>
              <textarea
                className={cn(INPUT_CLS, 'h-auto py-2 resize-none')}
                placeholder="Internal or customer-facing details about this promotion..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Discount type */}
            <div>
              <label className={LABEL_CLS}>Discount type *</label>
              <Segmented
                options={[
                  { value: 'PERCENTAGE', label: '%' },
                  { value: 'FLAT_AMOUNT', label: '₹' },
                ]}
                value={formData.discountType}
                onChange={(value) => setFormData({ ...formData, discountType: value })}
              />
            </div>

            {/* Value + cap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>Discount value *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder={isPercent ? '20' : '15.00'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  required
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Max cap amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Optional max cap"
                  value={formData.maxDiscountAmount}
                  onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  disabled={formData.discountType === 'FLAT_AMOUNT'}
                  className={INPUT_CLS}
                />
                {isPercent && (
                  <p className="text-xs text-txt-faint mt-1.5">Maximum discount a customer can receive.</p>
                )}
              </div>
            </div>

            {/* Min order */}
            <div>
              <label className={LABEL_CLS}>Minimum order amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                required
                className={INPUT_CLS}
              />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>Start date &amp; time *</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>End date &amp; time *</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* Usage limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>Total usage limit (global)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Leave blank for infinite"
                  value={formData.usageLimitGlobal}
                  onChange={(e) => setFormData({ ...formData, usageLimitGlobal: e.target.value })}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Per-customer limit</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Leave blank for infinite"
                  value={formData.usageLimitPerUser}
                  onChange={(e) => setFormData({ ...formData, usageLimitPerUser: e.target.value })}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* Scope */}
            <div className="rounded-tile border border-line-light bg-paper-2 p-4">
              <p className="text-sm font-semibold text-ink-text mb-1">Scope</p>
              <p className="text-xs text-txt-muted mb-3">
                Choose whether this coupon is limited to the active restaurant or applies across the full chain.
              </p>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    value="RESTAURANT_SPECIFIC"
                    checked={formData.scopeType === 'RESTAURANT_SPECIFIC'}
                    onChange={(e) => setFormData({ ...formData, scopeType: e.target.value })}
                    disabled={isEditMode}
                    className="mt-1 h-4 w-4 accent-marigold"
                  />
                  <div>
                    <span className="block text-sm font-medium text-ink-text">Single restaurant</span>
                    <span className="block text-xs text-txt-muted">Only usable at the currently active restaurant.</span>
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
                    className="mt-1 h-4 w-4 accent-marigold"
                  />
                  <div>
                    <span className="block text-sm font-medium text-ink-text">Entire chain</span>
                    <span className="block text-xs text-txt-muted">Applies to all outlets under this restaurant group.</span>
                  </div>
                </label>
                {isEditMode && (
                  <p className="text-[11px] text-txt-faint mt-1">Scope is fixed after creation to avoid breaking existing mappings.</p>
                )}
              </div>
            </div>

            {/* Activate toggle */}
            <div className="flex items-start justify-between gap-4 rounded-tile border border-line-light bg-paper-2 p-4">
              <div>
                <span className="block text-sm font-medium text-ink-text">Activate</span>
                <span className="block text-xs text-txt-muted mt-0.5">
                  If disabled, customers cannot apply this code even within the validity period.
                </span>
              </div>
              <Toggle
                checked={formData.isActive}
                onChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            {/* Allow stacking toggle */}
            <div className="flex items-start justify-between gap-4 rounded-tile border border-line-light bg-paper-2 p-4">
              <div>
                <span className="block text-sm font-medium text-ink-text">Allow stacking</span>
                <span className="block text-xs text-txt-muted mt-0.5">
                  Allows customers to combine this coupon with other applicable promotions.
                </span>
              </div>
              <Toggle
                checked={formData.allowStacking}
                onChange={(checked) => setFormData({ ...formData, allowStacking: checked })}
              />
            </div>
          </Panel>
        </form>

        {/* ── RIGHT: live preview ─────────────────────────────────────── */}
        <div className="space-y-4">
          <p className="eyebrow text-[11px] text-txt-faint">Live preview</p>

          {/* Ink ticket */}
          <div className="relative overflow-hidden rounded-card bg-ink text-txt-light p-6 shadow-float">
            {/* punched notches */}
            <span className="pointer-events-none absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-paper" />
            <span className="pointer-events-none absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-paper" />

            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-marigold" />
              <span className="eyebrow text-[10px] text-txt-mutedDark">
                {formData.scopeType === 'GLOBAL_CHAIN' ? 'Chain-wide offer' : 'Restaurant offer'}
              </span>
            </div>

            <p className="font-display font-bold text-[28px] leading-tight mt-3">{discountLabel}</p>
            <p className="text-sm text-txt-mutedDark mt-0.5 truncate">{formData.name || 'Promotion name'}</p>

            <div className="my-5 border-t border-dashed border-ink-line" />

            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow text-[10px] text-txt-mutedDark mb-1">Code</p>
                <p className="font-mono text-lg font-bold text-marigold tracking-wider truncate">
                  {formData.code || 'CODE0000'}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                  formData.isActive ? 'bg-success/[0.16] text-success-bright' : 'bg-danger/[0.16] text-danger',
                )}
              >
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <p className="text-xs text-txt-mutedDark mt-4">
              Valid {fmtDate(formData.startDate)} – {fmtDate(formData.endDate)}
            </p>
          </div>

          {/* Summary card */}
          <Panel className="p-5">
            <p className="eyebrow text-[11px] text-txt-faint mb-3">Summary</p>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-txt-muted">Discount type</dt>
                <dd className="font-medium text-ink-text">{isPercent ? 'Percentage' : 'Flat amount'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-txt-muted">Min. order</dt>
                <dd className="font-medium text-ink-text font-mono">₹{formData.minOrderAmount || '0.00'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-txt-muted">Max cap</dt>
                <dd className="font-medium text-ink-text font-mono">
                  {formData.maxDiscountAmount ? `₹${formData.maxDiscountAmount}` : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-txt-muted">Global limit</dt>
                <dd className="font-medium text-ink-text font-mono">{formData.usageLimitGlobal || 'Unlimited'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-txt-muted">Per-customer limit</dt>
                <dd className="font-medium text-ink-text font-mono">{formData.usageLimitPerUser || 'Unlimited'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-txt-muted">Stacking</dt>
                <dd className="font-medium text-ink-text">{formData.allowStacking ? 'Allowed' : 'Not allowed'}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default CouponEditor;
