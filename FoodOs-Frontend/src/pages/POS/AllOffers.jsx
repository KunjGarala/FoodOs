import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Tag, Sparkles, BadgeCheck, Loader2, AlertCircle,
  Percent, IndianRupee, Gift, Search, CheckCircle
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  applyCouponToOrder,
  setCouponCode,
  fetchAvailableCoupons,
} from '../../store/couponSlice';
import { selectActiveRestaurant } from '../../store/authSlice';
import { couponAPI } from '../../services/api';

const AllOffers = () => {
  const { tableUuid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const orderUuid = searchParams.get('orderUuid');
  const subtotal = parseFloat(searchParams.get('subtotal') || '0');
  const customerUuid = searchParams.get('customerUuid') || null;
  const activeRestaurantId = useSelector(selectActiveRestaurant);
  const couponState = useSelector((s) => s.coupon);

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [applying, setApplying] = useState(null); // couponCode being applied
  const [appliedCode, setAppliedCode] = useState(couponState.isApplied ? couponState.code : '');
  const [error, setError] = useState(null);

  // Fetch all coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      if (!activeRestaurantId) return;
      setLoading(true);
      try {
        const response = await couponAPI.getAll({ restaurantUuid: activeRestaurantId, size: 50, page: 0 });
        const data = response.data;
        const list = data?.content || data || [];
        setCoupons(list.filter(c => c.active !== false));
      } catch (err) {
        console.error('Failed to fetch coupons:', err);
        setError('Failed to load offers');
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, [activeRestaurantId]);

  // Apply coupon and go back
  const handleApply = useCallback(async (couponCode) => {
    if (!orderUuid || !couponCode) return;
    setApplying(couponCode);
    setError(null);
    try {
      const result = await dispatch(applyCouponToOrder({
        orderUuid,
        couponCode,
        customerUuid,
        orderAmount: subtotal,
      })).unwrap();
      dispatch(setCouponCode(couponCode));
      setAppliedCode(couponCode);
      // Navigate back after brief delay to show success
      setTimeout(() => {
        navigate(`/app/tables/${tableUuid}`, { replace: true });
      }, 600);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to apply coupon');
      setApplying(null);
    }
  }, [dispatch, orderUuid, customerUuid, subtotal, tableUuid, navigate]);

  // Filter coupons by search
  const filteredCoupons = coupons.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.code || '').toLowerCase().includes(term) ||
      (c.name || '').toLowerCase().includes(term) ||
      (c.description || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(`/app/tables/${tableUuid}`, { replace: true })}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Tag className="h-5 w-5 text-violet-600" />
              All Offers & Coupons
            </h1>
            <p className="text-xs text-slate-500">
              {subtotal > 0 ? `Order subtotal: ₹${subtotal.toFixed(2)}` : 'Select an offer to apply'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="max-w-3xl mx-auto px-4 mt-4">
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
          </div>
        </div>
      )}

      {/* Applied Success */}
      {applying && appliedCode === applying && (
        <div className="max-w-3xl mx-auto px-4 mt-4">
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>Coupon <strong>{appliedCode}</strong> applied! Returning to order…</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="max-w-3xl mx-auto px-4 mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
            placeholder="Search coupons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <p className="text-sm text-slate-500 mt-3">Loading offers…</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Gift className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-1">
              {searchTerm ? 'No matching offers' : 'No offers available'}
            </h3>
            <p className="text-sm text-slate-400">
              {searchTerm ? 'Try a different search term' : 'Check back later for new offers'}
            </p>
          </div>
        ) : (
          filteredCoupons.map((coupon, idx) => {
            const isPercentage = coupon.discountType === 'PERCENTAGE';
            const isApplying = applying === coupon.code;
            const isCurrentlyApplied = appliedCode === coupon.code;
            const meetsMin = subtotal >= (coupon.minOrderAmount || 0);

            return (
              <div
                key={coupon.couponUuid || coupon.code || idx}
                className={`
                  relative bg-white rounded-2xl border overflow-hidden transition-all duration-200
                  ${isCurrentlyApplied
                    ? 'border-emerald-300 ring-2 ring-emerald-100 shadow-lg shadow-emerald-100/50'
                    : meetsMin
                      ? 'border-slate-200 hover:border-violet-300 hover:shadow-md'
                      : 'border-slate-200 opacity-60'
                  }
                `}
              >
                {/* Coupon dashed border accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-violet-500 to-indigo-500 rounded-l-2xl" />

                <div className="flex items-stretch">
                  {/* Left: Discount badge */}
                  <div className="flex items-center justify-center w-24 sm:w-28 bg-gradient-to-br from-violet-50 to-indigo-50 border-r border-dashed border-slate-200 ml-1.5">
                    <div className="text-center px-2 py-4">
                      {isPercentage ? (
                        <>
                          <div className="text-2xl sm:text-3xl font-black text-violet-700 leading-none">{coupon.discountValue}%</div>
                          <div className="text-[10px] sm:text-xs font-bold text-violet-500 uppercase mt-1">OFF</div>
                        </>
                      ) : (
                        <>
                          <div className="text-xl sm:text-2xl font-black text-violet-700 leading-none">₹{coupon.discountValue}</div>
                          <div className="text-[10px] sm:text-xs font-bold text-violet-500 uppercase mt-1">OFF</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Details + Apply */}
                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm sm:text-base text-slate-900 uppercase tracking-wider">
                          {coupon.code}
                        </span>
                        {isCurrentlyApplied && (
                          <Badge variant="success" className="text-[10px]">Applied</Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-1">
                        {coupon.name || coupon.description || (isPercentage ? `${coupon.discountValue}% discount` : `₹${coupon.discountValue} off`)}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500">
                        {coupon.minOrderAmount > 0 && (
                          <span className={meetsMin ? 'text-emerald-600' : 'text-red-500'}>
                            Min: ₹{Number(coupon.minOrderAmount).toFixed(0)}
                            {!meetsMin && ' (not met)'}
                          </span>
                        )}
                        {isPercentage && coupon.maxDiscountAmount > 0 && (
                          <span>Max save: ₹{Number(coupon.maxDiscountAmount).toFixed(0)}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <Button
                        onClick={() => handleApply(coupon.code)}
                        disabled={isApplying || isCurrentlyApplied || !meetsMin || !orderUuid}
                        className={`w-full text-sm h-9 ${
                          isCurrentlyApplied
                            ? 'bg-emerald-600 cursor-default'
                            : meetsMin
                              ? 'bg-violet-600 hover:bg-violet-700'
                              : 'bg-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {isApplying ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Applying…</>
                        ) : isCurrentlyApplied ? (
                          <><CheckCircle className="h-4 w-4 mr-1.5" />Applied</>
                        ) : !meetsMin ? (
                          <span>Min ₹{Number(coupon.minOrderAmount).toFixed(0)} required</span>
                        ) : (
                          <><BadgeCheck className="h-4 w-4 mr-1.5" />Apply Coupon</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AllOffers;
