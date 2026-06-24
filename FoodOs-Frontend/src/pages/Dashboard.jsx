import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, Plus, ArrowUpRight } from 'lucide-react';
import {
  PageHeader, Kpi, Panel, LivePill, BtnPrimary, BtnGhost, Pill,
} from '../components/ui/kit';
import {
  fetchDashboardAnalytics,
  selectDashboardAnalytics,
  selectDashboardAnalyticsDays,
  selectDashboardAnalyticsError,
  selectDashboardAnalyticsLoading,
  setAnalyticsDays,
} from '../store/analyticsSlice';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));

const trendPercent = (todayVal, yesterdayVal) => {
  const t = Number(todayVal || 0);
  const y = Number(yesterdayVal || 0);
  if (y === 0) return t > 0 ? 100 : 0;
  return Number((((t - y) / y) * 100).toFixed(1));
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user, activeRestaurantId, role, restaurantIds } = useSelector((s) => s.auth);
  const analytics = useSelector(selectDashboardAnalytics);
  const loading = useSelector(selectDashboardAnalyticsLoading);
  const error = useSelector(selectDashboardAnalyticsError);
  const days = useSelector(selectDashboardAnalyticsDays);
  const navigate = useNavigate();

  const canViewAnalytics = useMemo(
    () => ['OWNER', 'MANAGER', 'ADMIN'].includes((role || '').toUpperCase()),
    [role],
  );

  useEffect(() => {
    if (!activeRestaurantId || !canViewAnalytics) return;
    dispatch(fetchDashboardAnalytics({ restaurantUuid: activeRestaurantId, days }));
    const id = setInterval(() => {
      dispatch(fetchDashboardAnalytics({ restaurantUuid: activeRestaurantId, days }));
    }, 30000);
    return () => clearInterval(id);
  }, [dispatch, activeRestaurantId, days, canViewAnalytics]);

  const today = analytics?.today;
  const yesterday = analytics?.yesterday;
  const topItems = analytics?.topItems || [];
  const hourlyOrders = analytics?.hourlyOrders || [];

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // No-restaurant state
  if (role !== 'GUEST' && (!restaurantIds || restaurantIds.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="font-display text-2xl font-bold text-ink-text mb-2">No Restaurants Found</h2>
        <p className="mb-6 text-txt-muted">You don't have any restaurants associated with your account yet.</p>
        <BtnPrimary onClick={() => navigate('/create-restaurant')}>Create Your First Restaurant</BtnPrimary>
      </div>
    );
  }

  // Sales-by-hour bars (revenue per hour). Color by relative magnitude.
  const maxHourRev = Math.max(...hourlyOrders.map((h) => Number(h.revenue || 0)), 1);
  const barColor = (rev) => {
    const r = Number(rev || 0) / maxHourRev;
    if (r >= 0.66) return 'bg-marigold';
    if (r >= 0.33) return 'bg-marigold-soft';
    return 'bg-line-light';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Good day, ${user || 'there'}`}
        title="Today at a glance"
        subtitle={dateLabel}
        actions={
          <>
            <LivePill />
            <div className="hidden sm:flex items-center gap-2 h-10 px-3 rounded-input bg-paper-card border border-line-input text-txt-muted">
              <Search className="h-4 w-4" />
              <span className="text-sm">Search</span>
            </div>
            <select
              value={days}
              onChange={(e) => dispatch(setAnalyticsDays(Number(e.target.value)))}
              className="h-10 rounded-input border border-line-input bg-paper-card px-3 text-sm text-txt-dark"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
            <BtnGhost
              onClick={() => dispatch(fetchDashboardAnalytics({ restaurantUuid: activeRestaurantId, days }))}
              disabled={loading || !activeRestaurantId || !canViewAnalytics}
              className="px-3"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </BtnGhost>
          </>
        }
      />

      {error && (
        <div className="rounded-input border border-danger/30 bg-danger/[0.06] px-3 py-2 text-sm text-danger-deep">{error}</div>
      )}
      {!canViewAnalytics && (
        <div className="rounded-input border border-marigold/30 bg-marigold/[0.08] px-3 py-2 text-sm text-[#9a6500]">
          Live analytics is available for Manager / Owner / Admin roles.
        </div>
      )}

      {/* KPI row — 3 light + 1 ink */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Net Sales" value={formatCurrency(today?.revenue)} delta={trendPercent(today?.revenue, yesterday?.revenue)} sub="vs yesterday" />
        <Kpi label="Avg Check" value={formatCurrency(today?.avgOrderValue)} delta={trendPercent(today?.avgOrderValue, yesterday?.avgOrderValue)} sub="per order" />
        <Kpi label="Covers" value={today?.covers ?? 0} delta={trendPercent(today?.covers, yesterday?.covers)} sub="guests served" />
        <Kpi tone="ink" label="Tables Turned" value={Number(today?.tablesTurned || 0).toFixed(1)} delta={trendPercent(today?.tablesTurned, yesterday?.tablesTurned)} sub="avg turns / table" />
      </div>

      {/* Sales-by-hour + Top sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <Panel className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="eyebrow text-[10px] text-txt-faint">Revenue</p>
              <h3 className="font-display font-semibold text-base text-ink-text">Sales by hour</h3>
            </div>
            <Pill tone="marigold">Peak {(() => {
              const peak = hourlyOrders.reduce((a, b) => (Number(b.revenue || 0) > Number(a?.revenue || 0) ? b : a), null);
              return peak ? `${String(peak.hour).padStart(2, '0')}:00` : '—';
            })()}</Pill>
          </div>
          <div className="h-56 flex items-end gap-1">
            {hourlyOrders.length === 0 && (
              <div className="w-full h-full grid place-items-center text-txt-faint text-sm">No revenue data yet today.</div>
            )}
            {hourlyOrders.map((h) => {
              const height = Math.max(4, Math.round((Number(h.revenue || 0) / maxHourRev) * 100));
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full group" title={`${String(h.hour).padStart(2, '0')}:00 · ${formatCurrency(h.revenue)}`}>
                  <div className={`w-full rounded-t ${barColor(h.revenue)} transition-all`} style={{ height: `${height}%` }} />
                  {h.hour % 3 === 0 && <span className="mt-1 text-[9px] font-mono text-txt-faint">{String(h.hour).padStart(2, '0')}</span>}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="eyebrow text-[10px] text-txt-faint">Best performers</p>
              <h3 className="font-display font-semibold text-base text-ink-text">Top sellers</h3>
            </div>
          </div>
          <div className="space-y-3">
            {topItems.length === 0 && <p className="text-sm text-txt-muted">No item sales in this range.</p>}
            {topItems.map((item, i) => (
              <div key={item.productName} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-tile bg-paper-3 grid place-items-center font-display font-bold text-sm text-marigold shrink-0">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-text truncate">{item.productName}</p>
                  <p className="text-xs text-txt-muted font-mono">{item.quantity} sold</p>
                </div>
                <span className="font-display font-semibold text-ink-text">{formatCurrency(item.revenue)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        {activeRestaurantId && (
          <BtnGhost onClick={() => navigate(`/app/restaurant/${activeRestaurantId}`)}>
            <ArrowUpRight className="h-4 w-4" /> View outlet details
          </BtnGhost>
        )}
        {role === 'OWNER' && restaurantIds?.[0] === activeRestaurantId && (
          <BtnPrimary onClick={() => navigate('/create-outlet')}>
            <Plus className="h-4 w-4" /> Create outlet
          </BtnPrimary>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
