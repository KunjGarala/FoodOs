import React from 'react';
import { Sparkles, BadgeCheck } from 'lucide-react';
import { Button } from '../ui/Button';

export const CouponItem = ({ coupon, onApply, isBest }) => {
  const savings = Number(coupon.computedDiscount || coupon.discountValue || 0).toFixed(0);
  const discountLabel = coupon.discountType === 'PERCENTAGE'
    ? `${coupon.discountValue}% off`
    : `₹${savings} off`;
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
          {coupon.couponCode?.slice(0, 3) || 'OFF'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800 uppercase tracking-wide text-sm">{coupon.couponCode}</p>
            {isBest && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                <Sparkles className="h-3.5 w-3.5" /> Best
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{discountLabel} · Save ₹{savings}</p>
          {coupon.minOrderAmount > 0 && (
            <p className="text-[11px] text-slate-400 mt-0.5">Min order: ₹{Number(coupon.minOrderAmount).toFixed(0)}</p>
          )}
          {coupon.reason && !coupon.valid && (
            <p className="text-[11px] text-red-600 mt-0.5">{coupon.reason}</p>
          )}
        </div>
      </div>
      <Button
        variant={isBest ? 'success' : 'outline'}
        onClick={() => onApply(coupon.couponCode)}
        className={isBest ? 'bg-emerald-600 hover:bg-emerald-500' : 'border-slate-200'}
      >
        <BadgeCheck className="h-4 w-4 mr-1.5" /> Apply
      </Button>
    </div>
  );
};

export default CouponItem;
