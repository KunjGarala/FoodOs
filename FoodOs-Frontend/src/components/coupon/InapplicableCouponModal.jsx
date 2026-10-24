import React from 'react';
import { AlertCircle, Tag, CheckCircle2, XCircle, Calendar, IndianRupee, Percent, ShoppingBag, ShieldAlert } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export const InapplicableCouponModal = ({ isOpen, onClose, coupon, currentAmount = 0 }) => {
  if (!coupon) return null;

  const minOrder = Number(coupon.minOrderAmount || 0);
  const currentBill = Number(currentAmount || 0);
  const shortfall = Math.max(0, minOrder - currentBill);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No expiry';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isMinOrderIssue = coupon.reason && coupon.reason.toLowerCase().includes('below minimum');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Coupon Not Applicable"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="primary" onClick={onClose} className="px-6">
            Understood
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Why it is not applicable callout */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-amber-900 uppercase tracking-wide">
                Why this coupon cannot be applied
              </h4>
              <p className="text-sm font-medium text-amber-800">
                {isMinOrderIssue
                  ? `Order total (₹${currentBill.toFixed(2)}) is below the required minimum bill of ₹${minOrder.toFixed(2)}. Add ₹${shortfall.toFixed(2)} more to qualify!`
                  : coupon.reason || 'This coupon does not meet the eligibility conditions for the current order.'}
              </p>
            </div>
          </div>
        </div>

        {/* Coupon Header Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-mono font-bold tracking-wider text-amber-300 mb-1.5">
                <Tag className="h-3.5 w-3.5" />
                {coupon.couponCode || coupon.code}
              </div>
              <h3 className="text-base font-bold text-white">
                {coupon.couponName || coupon.name || 'Special Discount'}
              </h3>
              {coupon.description && (
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {coupon.description}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-black text-amber-400">
                {coupon.discountType === 'PERCENTAGE'
                  ? `${coupon.discountValue}%`
                  : `₹${coupon.discountValue}`}
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-300">
                DISCOUNT
              </div>
            </div>
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Coupon Requirements & Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Minimum Bill Requirement */}
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${
              currentBill >= minOrder && minOrder > 0
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-200'
            }`}>
              {currentBill >= minOrder && minOrder > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Min. Order Bill</div>
                <div className="text-sm font-bold text-slate-800">
                  ₹{minOrder.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">
                  Current: ₹{currentBill.toFixed(2)} {shortfall > 0 ? `(Short by ₹${shortfall.toFixed(2)})` : '✓'}
                </div>
              </div>
            </div>

            {/* Discount Value */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
                {coupon.discountType === 'PERCENTAGE' ? <Percent className="h-4 w-4" /> : <IndianRupee className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Benefit</div>
                <div className="text-sm font-bold text-slate-800">
                  {coupon.discountType === 'PERCENTAGE'
                    ? `${coupon.discountValue}% off`
                    : `₹${coupon.discountValue} flat discount`}
                </div>
                {coupon.maxDiscountAmount && Number(coupon.maxDiscountAmount) > 0 && (
                  <div className="text-[10px] text-slate-500">
                    Max discount: ₹{Number(coupon.maxDiscountAmount).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* Validity Dates */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Valid Period</div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {formatDate(coupon.startDate)} – {formatDate(coupon.endDate)}
                </div>
                <div className="text-[10px] text-slate-500">
                  Active within promotional window
                </div>
              </div>
            </div>

            {/* Usage Limits */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Redemption Scope</div>
                <div className="text-xs font-bold text-slate-800">
                  {coupon.usageLimitPerUser ? `Max ${coupon.usageLimitPerUser} per guest` : 'Unlimited per guest'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {coupon.usageLimitGlobal ? `Global limit: ${coupon.usageLimitGlobal}` : 'Standard terms apply'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InapplicableCouponModal;
