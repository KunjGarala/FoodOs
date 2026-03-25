import React from 'react';
import { BadgeCheck, XCircle } from 'lucide-react';

export const CouponSummary = ({ code, discountAmount, onRemove }) => {
  if (!code) return null;
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 text-emerald-700" />
        <div>
          <p className="text-xs text-emerald-800 uppercase tracking-wide font-semibold">{code}</p>
          <p className="text-[11px] text-emerald-700">Discount applied</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-emerald-800">-₹{Number(discountAmount || 0).toFixed(2)}</span>
        <button onClick={onRemove} className="text-emerald-700 hover:text-emerald-900" title="Remove coupon">
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CouponSummary;
