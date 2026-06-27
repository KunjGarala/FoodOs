import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Download, Loader2, ClipboardList } from 'lucide-react';
import { fetchOrdersByRestaurant } from '../../store/orderSlice';
import { PageHeader, Panel, Pill, BtnGhost } from '../../components/ui/kit';
import { cn } from '../../utils/cn';

const TYPE_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'DINE_IN', label: 'Dine-in' },
  { value: 'TAKEAWAY', label: 'Takeaway' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'UNPAID', label: 'Unpaid' },
];

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v || 0));

const formatTime = (t) => {
  if (!t) return '—';
  try {
    return new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch { return '—'; }
};

const isToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

// Bill-status pill from order payment/status.
const statusPill = (o) => {
  const status = (o.status || '').toUpperCase();
  if (status === 'CANCELLED' || status === 'VOID') return { tone: 'danger', label: status === 'VOID' ? 'Void' : 'Cancelled' };
  const balance = Number(o.balanceAmount ?? 0);
  const paid = Number(o.paidAmount ?? 0);
  if (status === 'PAID' || status === 'COMPLETED' || (balance <= 0 && paid > 0)) return { tone: 'success', label: 'Paid' };
  if (paid > 0 && balance > 0) return { tone: 'marigold', label: 'Partial' };
  return { tone: 'neutral', label: 'Unpaid' };
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeRestaurantId, role, userId } = useSelector((s) => s.auth);
  const { orders, loading } = useSelector((s) => s.orders);

  const isWaiter = role === 'WAITER';
  const canExport = ['OWNER', 'MANAGER', 'ADMIN'].includes(role);

  const [typeFilter, setTypeFilter] = useState('ALL');
  // Waiters are scoped to today's shift; managers can widen to all.
  const [dateScope, setDateScope] = useState('TODAY');
  const scope = isWaiter ? 'TODAY' : dateScope;

  useEffect(() => {
    if (activeRestaurantId) {
      dispatch(fetchOrdersByRestaurant({ restaurantUuid: activeRestaurantId, params: { page: 0, size: 100 } }));
    }
  }, [dispatch, activeRestaurantId]);

  const list = useMemo(() => orders || [], [orders]);

  // Does the payload expose a waiter identity we can scope by?
  const hasWaiterField = list.some((o) => o.waiterUuid || o.waiter?.userUuid);

  const filtered = useMemo(() => {
    return list.filter((o) => {
      // date scope
      if (scope === 'TODAY' && !isToday(o.orderDate || o.orderTime)) return false;
      // waiter ownership (only when the field is available)
      if (isWaiter && hasWaiterField) {
        const owner = o.waiterUuid || o.waiter?.userUuid;
        if (owner && owner !== userId) return false;
      }
      // type / unpaid
      if (typeFilter === 'UNPAID') return Number(o.balanceAmount ?? 0) > 0;
      if (typeFilter !== 'ALL' && (o.orderType || '').toUpperCase() !== typeFilter) return false;
      return true;
    });
  }, [list, scope, typeFilter, isWaiter, hasWaiterField, userId]);

  const dateLabel = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  const handleExport = () => {
    const rows = [['Order', 'Time', 'Table/Type', 'Guest', 'Items', 'Total', 'Status']];
    filtered.forEach((o) => {
      const s = statusPill(o);
      rows.push([
        o.orderNumber || o.orderUuid?.slice(0, 8),
        formatTime(o.orderTime),
        o.table?.tableNumber ? `Table ${o.table.tableNumber} · ${o.orderType}` : (o.orderType || '—'),
        o.customerName || 'Walk-in',
        o.itemCount ?? (o.items?.length || 0),
        Number(o.totalAmount || 0),
        s.label,
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${dateLabel.replace(' ', '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Orders · History"
        title="Orders"
        subtitle={`${isWaiter ? 'My orders' : (scope === 'TODAY' ? 'Today' : 'All')} · ${dateLabel} · ${filtered.length} order${filtered.length === 1 ? '' : 's'}`}
        actions={
          <>
            {!isWaiter && (
              <select
                value={dateScope}
                onChange={(e) => setDateScope(e.target.value)}
                className="h-10 rounded-input border border-line-input bg-paper-card px-3 text-sm text-txt-dark"
              >
                <option value="TODAY">Today</option>
                <option value="ALL">All time</option>
              </select>
            )}
            {canExport && (
              <BtnGhost onClick={handleExport} disabled={!filtered.length}>
                <Download className="h-4 w-4" /> Export
              </BtnGhost>
            )}
          </>
        }
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => {
          const active = typeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                'h-8 px-3.5 rounded-full text-sm font-medium transition-colors',
                active ? 'bg-ink text-white' : 'bg-paper-card border border-line-light text-txt-muted hover:text-ink-text',
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <Panel className="overflow-hidden">
        {loading && !list.length ? (
          <div className="h-64 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-txt-faint" /></div>
        ) : filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <ClipboardList className="h-12 w-12 text-txt-faint mb-3" />
            <p className="text-sm text-txt-muted">No orders found</p>
            <p className="text-xs text-txt-faint mt-1">Try a different filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-line-light text-txt-faint">
                  <th className="eyebrow px-5 py-3 text-[10px]">Order</th>
                  <th className="eyebrow px-5 py-3 text-[10px]">Time</th>
                  <th className="eyebrow px-5 py-3 text-[10px]">Table / Type</th>
                  <th className="eyebrow px-5 py-3 text-[10px]">Guest</th>
                  <th className="eyebrow px-5 py-3 text-[10px]">Items</th>
                  <th className="eyebrow px-5 py-3 text-[10px] text-right">Total</th>
                  <th className="eyebrow px-5 py-3 text-[10px] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-light">
                {filtered.map((o) => {
                  const s = statusPill(o);
                  const typeLabel = (o.orderType || '').replace('_', '-').toLowerCase();
                  return (
                    <tr
                      key={o.orderUuid}
                      onClick={() => navigate(`/app/orders/${o.orderUuid}`)}
                      className="cursor-pointer hover:bg-paper-2/60 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono text-marigold">#{o.orderNumber || o.orderUuid?.slice(0, 6)}</td>
                      <td className="px-5 py-4 font-mono text-txt-muted">{formatTime(o.orderTime)}</td>
                      <td className="px-5 py-4 text-txt-muted">
                        {o.table?.tableNumber ? (
                          <span className="text-ink-text">Table {o.table.tableNumber} · <span className="capitalize text-txt-muted">{typeLabel}</span></span>
                        ) : (
                          <span className="capitalize">— {typeLabel}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-txt-muted">{o.customerName || 'Walk-in'}</td>
                      <td className="px-5 py-4 font-mono text-txt-muted">{o.itemCount ?? (o.items?.length || 0)}</td>
                      <td className="px-5 py-4 text-right font-mono font-semibold text-ink-text">{formatCurrency(o.totalAmount)}</td>
                      <td className="px-5 py-4 text-right"><Pill tone={s.tone}>{s.label}</Pill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default OrderHistory;
