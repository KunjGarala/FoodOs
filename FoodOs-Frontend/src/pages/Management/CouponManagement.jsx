import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Edit2,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Ticket,
  Search,
} from 'lucide-react';
import { PageHeader, Panel, Kpi, Pill, Toggle, BtnPrimary, BtnGhost } from '../../components/ui/kit';
import { cn } from '../../utils/cn';
import { couponAPI } from '../../services/api';

const CouponManagement = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);

  const { activeRestaurantId } = useSelector((state) => state.auth);

  const fetchStats = async () => {
    try {
      const res = await couponAPI.getStats(activeRestaurantId);
      setStats(res.data);
    } catch {
      setStats(null); // header falls back to derived/active count
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponAPI.getAll({ restaurantUuid: activeRestaurantId, size: 100 });
      setCoupons(response.data.content || []);
      fetchStats();
    } catch {
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
      } catch {
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
    } catch {
      setError('Failed to update coupon status');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Derived stats ──────────────────────────────────────────────
  // No backend stats endpoint exists yet on couponAPI; derive the active
  // count from the loaded list and show '—' for the rest (non-breaking).
  const isExpired = (coupon) => {
    if (!coupon.endDate) return false;
    const end = new Date(coupon.endDate);
    end.setHours(23, 59, 59, 999);
    return end.getTime() < Date.now();
  };

  const activeCount = coupons.filter((c) => c.active && !isExpired(c)).length;

  const fmtINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
  const fmtDiscount = (c) =>
    c.discountType === 'PERCENTAGE' ? `${c.discountValue}% off` : `₹${c.discountValue} off`;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {(error || success) && (
        <div
          className={cn(
            'fixed top-4 right-4 z-50 flex items-center gap-2 rounded-input border px-4 py-3 shadow-float animate-slide-in',
            error
              ? 'border-danger/30 bg-danger/[0.08] text-danger-deep'
              : 'border-success/30 bg-success/[0.10] text-success-deep',
          )}
        >
          {error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <span className="text-sm font-medium">{error || success}</span>
        </div>
      )}

      <PageHeader
        eyebrow="Offers"
        title="Coupons"
        subtitle="Create and manage discount codes for your restaurant."
        actions={
          <BtnPrimary onClick={() => navigate('/app/coupons/new')} disabled={actionLoading}>
            <Plus className="h-4 w-4" />
            New coupon
          </BtnPrimary>
        }
      />

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi tone="ink" label="Active coupons" value={loading ? '—' : (stats?.activeCoupons ?? activeCount)} sub="Currently live" />
        <Kpi
          label="Redemptions this month"
          value={stats ? Number(stats.redemptionsThisMonth || 0).toLocaleString('en-IN') : '—'}
          sub={stats ? 'This month' : 'Awaiting analytics'}
        />
        <Kpi
          label="Avg discount"
          value={stats ? fmtINR(stats.avgDiscount) : '—'}
          sub={stats ? 'Per redemption' : 'Awaiting analytics'}
        />
        <Kpi
          label="Revenue influenced"
          value={stats ? fmtINR(stats.revenueInfluenced) : '—'}
          sub={stats ? 'This month' : 'Awaiting analytics'}
        />
      </div>

      <Panel className="overflow-hidden">
        {/* Search */}
        <div className="border-b border-line-light p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-faint" />
            <input
              type="text"
              placeholder="Search by code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-input border border-line-input bg-paper-2 pl-10 pr-3 text-sm text-ink-text placeholder:text-txt-faint focus:border-marigold focus:outline-none focus:ring-1 focus:ring-marigold"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-txt-faint" />
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <Ticket className="mb-3 h-12 w-12 text-txt-faint" />
            <p className="text-sm text-txt-muted">No coupons found</p>
            <BtnGhost onClick={() => navigate('/app/coupons/new')} className="mt-4">
              <Plus className="h-4 w-4" />
              Create coupon
            </BtnGhost>
          </div>
        ) : (
          <>
            {/* ── Desktop / tablet table (md and up) ── */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line-light text-txt-faint">
                    <th className="eyebrow px-6 py-3 text-[10px]">Code</th>
                    <th className="eyebrow px-6 py-3 text-[10px]">Discount</th>
                    <th className="eyebrow px-6 py-3 text-[10px]">Min order</th>
                    <th className="eyebrow px-6 py-3 text-[10px]">Valid till</th>
                    <th className="eyebrow px-6 py-3 text-[10px]">Used / limit</th>
                    <th className="eyebrow px-6 py-3 text-[10px]">Status</th>
                    <th className="eyebrow px-6 py-3 text-right text-[10px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-light">
                  {filteredCoupons.map((coupon) => {
                    const expired = isExpired(coupon);
                    return (
                      <tr
                        key={coupon.couponUuid}
                        className={cn('transition-colors hover:bg-paper-2', expired && 'opacity-60')}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-block rounded border border-dashed border-line-input bg-paper-2 px-2 py-0.5 font-mono text-xs font-semibold text-ink-text">
                              {coupon.code}
                            </span>
                            {expired && <Pill tone="danger">Expired</Pill>}
                          </div>
                          <div className="mt-1 max-w-[180px] truncate text-xs text-txt-muted" title={coupon.name}>
                            {coupon.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-ink-text">{fmtDiscount(coupon)}</div>
                          {coupon.maxDiscountAmount ? (
                            <div className="text-xs text-txt-muted">Max ₹{coupon.maxDiscountAmount}</div>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 text-txt-muted">₹{coupon.minOrderAmount}</td>
                        <td className="px-6 py-4 font-mono text-xs text-txt-muted">{fmtDate(coupon.endDate)}</td>
                        <td className="px-6 py-4 text-txt-muted">
                          {coupon.usageLimitGlobal ? (
                            <span className="font-mono text-xs">
                              {coupon.usageCount ?? 0} / {coupon.usageLimitGlobal}
                            </span>
                          ) : (
                            <span className="font-mono text-xs">{coupon.usageCount ?? 0} / ∞</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Toggle
                            checked={coupon.active}
                            onChange={() => handleToggleStatus(coupon)}
                            disabled={actionLoading}
                            size="sm"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/app/coupons/${coupon.couponUuid}/edit`)}
                              disabled={actionLoading}
                              className="rounded-input p-2 text-txt-muted transition-colors hover:bg-paper-3 hover:text-ink-text disabled:opacity-50"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(coupon.couponUuid)}
                              disabled={actionLoading}
                              className="rounded-input p-2 text-txt-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile stacked cards (below md) ── */}
            <div className="divide-y divide-line-light md:hidden">
              {filteredCoupons.map((coupon) => {
                const expired = isExpired(coupon);
                return (
                  <div key={coupon.couponUuid} className={cn('p-4', expired && 'opacity-60')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-block rounded border border-dashed border-line-input bg-paper-2 px-2 py-0.5 font-mono text-xs font-semibold text-ink-text">
                            {coupon.code}
                          </span>
                          {expired && <Pill tone="danger">Expired</Pill>}
                        </div>
                        <div className="mt-1 truncate text-xs text-txt-muted" title={coupon.name}>
                          {coupon.name}
                        </div>
                      </div>
                      <Toggle
                        checked={coupon.active}
                        onChange={() => handleToggleStatus(coupon)}
                        disabled={actionLoading}
                        size="sm"
                      />
                    </div>

                    <div className="mt-3 text-base font-semibold text-ink-text">{fmtDiscount(coupon)}</div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <dt className="text-txt-faint">Min order</dt>
                        <dd className="text-txt-muted">₹{coupon.minOrderAmount}</dd>
                      </div>
                      <div>
                        <dt className="text-txt-faint">Valid till</dt>
                        <dd className="font-mono text-txt-muted">{fmtDate(coupon.endDate)}</dd>
                      </div>
                      <div>
                        <dt className="text-txt-faint">Used / limit</dt>
                        <dd className="font-mono text-txt-muted">
                          {coupon.usageCount ?? 0} / {coupon.usageLimitGlobal || '∞'}
                        </dd>
                      </div>
                      {coupon.maxDiscountAmount ? (
                        <div>
                          <dt className="text-txt-faint">Max discount</dt>
                          <dd className="text-txt-muted">₹{coupon.maxDiscountAmount}</dd>
                        </div>
                      ) : null}
                    </dl>

                    <div className="mt-3 flex items-center gap-2">
                      <BtnGhost
                        onClick={() => navigate(`/app/coupons/${coupon.couponUuid}/edit`)}
                        disabled={actionLoading}
                        className="h-9 flex-1 px-3 text-xs"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </BtnGhost>
                      <BtnGhost
                        onClick={() => handleDelete(coupon.couponUuid)}
                        disabled={actionLoading}
                        className="h-9 px-3 text-xs text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </BtnGhost>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
};

export default CouponManagement;
