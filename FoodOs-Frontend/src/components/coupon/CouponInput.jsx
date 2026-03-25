import React from 'react';
import { Loader2, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const statusTone = (error, warning, message) => {
  if (error) return 'text-red-700 bg-red-50 border-red-200';
  if (warning) return 'text-amber-700 bg-amber-50 border-amber-200';
  if (message) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  return '';
};

export const CouponInput = ({
  code,
  onCodeChange,
  onApply,
  onRemove,
  onApplyBest,
  loading,
  removing,
  isApplied,
  error,
  message,
  warning,
  bestCoupon,
  disabled,
  revalidating,
}) => {
  const handleChange = (e) => {
    onCodeChange(e.target.value.toUpperCase());
  };

  const showStatus = error || warning || message;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={code}
          onChange={handleChange}
          placeholder="Enter coupon code"
          className="uppercase tracking-[0.08em] text-base sm:text-sm h-12 sm:h-10"
          maxLength={24}
          disabled={loading || removing || disabled}
        />
        <div className="flex gap-2 sm:w-auto w-full">
          <Button
            onClick={onApply}
            disabled={!code || loading || removing || disabled}
            className="flex-1 sm:flex-none min-w-[110px] bg-slate-900 hover:bg-slate-800"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>{isApplied ? 'Re-apply' : 'Apply'}</span>}
          </Button>
          {isApplied && (
            <Button
              variant="outline"
              onClick={onRemove}
              disabled={removing}
              className="flex-1 sm:flex-none min-w-[96px] border-red-200 text-red-700 hover:bg-red-50"
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Remove</span>}
            </Button>
          )}
        </div>
      </div>

      {bestCoupon && (
        <button
          type="button"
          onClick={onApplyBest}
          disabled={loading || removing}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Apply Best Offer</span>
            <span className="text-xs text-emerald-700 bg-white/70 px-2 py-0.5 rounded-full border border-emerald-200">{bestCoupon.couponCode}</span>
          </div>
          <div className="text-emerald-800 text-sm font-semibold">
            Save ₹{Number(bestCoupon.computedDiscount || bestCoupon.discountValue || 0).toFixed(0)}
          </div>
        </button>
      )}

      {revalidating && (
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Revalidating coupon after cart changes…</span>
        </div>
      )}

      {showStatus && (
        <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-sm ${statusTone(error, warning, message)}`}>
          {error ? <AlertTriangle className="h-4 w-4 mt-0.5" /> : message ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600" />}
          <div className="flex-1">
            <p className="font-medium leading-tight">{error || warning || message}</p>
            {warning && <p className="text-xs text-slate-500">We will remove the coupon if it no longer matches the bill.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponInput;
