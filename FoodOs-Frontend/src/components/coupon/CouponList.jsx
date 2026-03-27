import React from 'react';
import { Gift } from 'lucide-react';
import { CouponItem } from './CouponItem';

export const CouponList = ({ coupons = [], onApply }) => {
  if (!coupons || coupons.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <Gift className="h-4 w-4" />
        No offers available for this cart right now.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {coupons.map((coupon, idx) => (
        <CouponItem
          key={coupon.couponCode || idx}
          coupon={coupon}
          onApply={onApply}
          isBest={idx === 0}
        />
      ))}
    </div>
  );
};

export default CouponList;
