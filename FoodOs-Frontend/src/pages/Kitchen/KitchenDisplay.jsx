import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle, Loader2, AlertCircle, RefreshCw, ChefHat, Flame } from 'lucide-react';
import {
  fetchKitchenOrders,
  changeOrderStatus,
  clearError,
  clearSuccess,
  handleKitchenWsEvent,
} from '../../store/orderSlice';
import useWebSocket from '../../hooks/useWebSocket';
import websocketService from '../../services/websocket';
import { Segmented, LivePill } from '../../components/ui/kit';
import { cn } from '../../utils/cn';

// KOT ticket status → board column
const COLUMN_OF = (status) => {
  switch ((status || '').toUpperCase()) {
    case 'SENT':
    case 'ACKNOWLEDGED':
    case 'PENDING':
    case 'CONFIRMED':
      return 'new';
    case 'IN_PROGRESS':
    case 'PREPARING':
      return 'preparing';
    case 'READY':
      return 'ready';
    default:
      return null;
  }
};

const elapsedMinutes = (t) => {
  if (!t) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(t).getTime()) / 60000));
};

const fmtElapsed = (m) => (m < 1 ? 'now' : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`);

const STATIONS = ['All', 'Grill', 'Fry', 'Cold'];

const KitchenDisplay = () => {
  const dispatch = useDispatch();
  const [station, setStation] = useState('All');
  const [wsConnected, setWsConnected] = useState(false);
  const [, forceTick] = useState(0);

  const { activeRestaurantId, role } = useSelector((s) => s.auth);
  const { kitchenOrders, loading, error, success } = useSelector((s) => s.orders);

  useEffect(() => {
    if (activeRestaurantId) dispatch(fetchKitchenOrders(activeRestaurantId));
  }, [dispatch, activeRestaurantId]);

  useWebSocket(activeRestaurantId ? `/topic/kitchen/${activeRestaurantId}` : null, (data) => {
    dispatch(handleKitchenWsEvent(data));
    setWsConnected(true);
  });

  useEffect(() => {
    const i = setInterval(() => setWsConnected(websocketService.isConnected()), 5000);
    return () => clearInterval(i);
  }, []);

  // Fallback polling when WS is down
  useEffect(() => {
    if (activeRestaurantId && !wsConnected) {
      const i = setInterval(() => dispatch(fetchKitchenOrders(activeRestaurantId)), 30000);
      return () => clearInterval(i);
    }
  }, [dispatch, activeRestaurantId, wsConnected]);

  // Re-render every 30s so timers tick
  useEffect(() => {
    const i = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (error) { const t = setTimeout(() => dispatch(clearError()), 3000); return () => clearTimeout(t); }
  }, [error, dispatch]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => dispatch(clearSuccess()), 3000); return () => clearTimeout(t); }
  }, [success, dispatch]);

  const advance = async (kotUuid, newStatus) => {
    try {
      await dispatch(changeOrderStatus({ kotUuid, newStatus })).unwrap();
      dispatch(fetchKitchenOrders(activeRestaurantId));
    } catch (e) {
      console.error('Failed to update KOT status:', e);
    }
  };

  const tickets = useMemo(() => {
    let list = kitchenOrders || [];
    if (station !== 'All') {
      list = list.filter((k) => (k.kitchenStation || '').toLowerCase() === station.toLowerCase());
    }
    return list;
  }, [kitchenOrders, station]);

  const columns = useMemo(() => {
    const acc = { new: [], preparing: [], ready: [] };
    tickets.forEach((k) => {
      const col = COLUMN_OF(k.status);
      if (col) acc[col].push(k);
    });
    return acc;
  }, [tickets]);

  const avgTicket = useMemo(() => {
    const active = tickets.filter((k) => COLUMN_OF(k.status) !== 'ready');
    if (!active.length) return 0;
    const sum = active.reduce((a, k) => a + elapsedMinutes(k.kotTime || k.createdAt), 0);
    return Math.round(sum / active.length);
  }, [tickets]);

  const COLS = [
    { key: 'new', label: 'New', next: 'IN_PROGRESS', cta: 'Start preparing' },
    { key: 'preparing', label: 'Preparing', next: 'READY', cta: 'Mark ready' },
    { key: 'ready', label: 'Ready', next: 'COMPLETED', cta: 'Bump · served' },
  ];

  const agingBorder = (mins, ready) => {
    if (ready) return 'border-l-success';
    if (mins >= 20) return 'border-l-danger';
    if (mins >= 10) return 'border-l-marigold';
    return 'border-l-line-light';
  };

  const canBump = (col) => {
    if (col === 'ready') return role === 'WAITER' || role === 'OWNER' || role === 'MANAGER';
    return role === 'CHEF' || role === 'OWNER' || role === 'MANAGER';
  };

  return (
    <div className="flex flex-col">
      {/* Toast */}
      {(error || success) && (
        <div className={cn('fixed top-4 right-4 left-4 sm:left-auto z-50 p-3 rounded-input shadow-float flex items-center gap-2 animate-slide-in sm:max-w-sm',
          error ? 'bg-danger/15 text-danger border border-danger/30' : 'bg-success/15 text-success-bright border border-success/30')}>
          {error ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle className="h-5 w-5 shrink-0" />}
          <span className="font-medium text-sm line-clamp-2">{error || success}</span>
        </div>
      )}

      {/* Header */}
      <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-line-light">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-tile bg-marigold/15 grid place-items-center">
              <Flame className="h-5 w-5 text-marigold" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-ink-text tracking-[-0.01em]">Kitchen Display</h1>
              <p className="text-xs text-txt-muted">Live KOT feed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-txt-muted">Avg ticket <b className="text-ink-text">{avgTicket}m</b></span>
            <LivePill />
            <button onClick={() => dispatch(fetchKitchenOrders(activeRestaurantId))} disabled={loading}
              className="p-2 rounded-lg text-txt-muted hover:text-ink-text hover:bg-paper-2">
              <RefreshCw className={cn('h-5 w-5', loading && 'animate-spin')} />
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto scrollbar-hide">
          <Segmented options={STATIONS.map((s) => ({ value: s, label: s }))} value={station} onChange={setStation} />
        </div>
      </div>

      {/* Body */}
      {loading && !kitchenOrders?.length ? (
        <div className="flex-1 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-txt-faint" /></div>
      ) : (
        <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLS.map((col) => (
            <section key={col.key} className="flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="eyebrow text-[11px] text-txt-muted">{col.label}</h2>
                <span className="text-[11px] font-mono text-txt-faint bg-paper-2 px-2 py-0.5 rounded-full">{columns[col.key].length}</span>
              </div>

              <div className="space-y-3">
                {columns[col.key].length === 0 && (
                  <div className="rounded-tile border border-dashed border-line-light py-10 text-center text-xs text-txt-faint">
                    No tickets
                  </div>
                )}
                {columns[col.key].map((k) => {
                  const mins = elapsedMinutes(k.kotTime || k.createdAt);
                  const ready = col.key === 'ready';
                  const late = mins >= 20 && !ready;
                  return (
                    <article key={k.kotUuid}
                      className={cn('rounded-tile border-l-[3px] p-3.5', agingBorder(mins, ready),
                        ready ? 'bg-success/[0.08] border border-success/20 border-l-success' : 'bg-paper-card border border-line-light')}>
                      {/* head */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-display font-bold text-ink-text text-[15px] truncate">
                            {k.tableNumber ? `Table ${k.tableNumber}` : 'Takeaway'}
                            <span className="ml-2 text-[11px] font-mono text-txt-faint">#{k.kotNumber || k.kotUuid?.slice(0, 6)}</span>
                          </p>
                          <p className="text-[11px] text-txt-muted truncate">{k.waiterName ? `Waiter · ${k.waiterName}` : 'Kitchen'}</p>
                        </div>
                        <span className={cn('shrink-0 text-[11px] font-mono px-2 py-0.5 rounded-full',
                          late ? 'bg-danger text-white' : 'bg-paper-3 text-txt-muted')}>
                          {fmtElapsed(mins)}
                        </span>
                      </div>

                      {/* items */}
                      <ul className="mt-3 space-y-2">
                        {(k.kotItems || []).map((item) => (
                          <li key={item.kotItemUuid} className="flex gap-2 text-sm">
                            <span className="font-mono font-bold text-marigold shrink-0">{item.quantity}×</span>
                            <div className="min-w-0">
                              <span className="text-ink-text">{item.productName || 'Item'}</span>
                              {item.variationName && <span className="text-txt-faint"> · {item.variationName}</span>}
                              {item.modifiersText && (
                                <div className="text-[11px] text-txt-muted mt-0.5">{item.modifiersText.split(',').map((m) => `+ ${m.trim()}`).join('  ')}</div>
                              )}
                              {item.specialInstructions && (
                                <div className="text-[11px] text-[#9a6500] mt-0.5">⚑ {item.specialInstructions}</div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>

                      {k.orderNotes && (
                        <p className="mt-2 text-[11px] text-[#9a6500] bg-marigold/[0.10] rounded px-2 py-1">Note: {k.orderNotes}</p>
                      )}

                      {/* action */}
                      {canBump(col.key) && (
                        <button onClick={() => advance(k.kotUuid, col.next)}
                          className={cn('mt-3 w-full h-10 rounded-input font-semibold text-sm inline-flex items-center justify-center gap-2 transition',
                            ready ? 'bg-success text-white hover:brightness-105' : 'bg-marigold text-ink hover:brightness-105')}>
                          <CheckCircle className="h-4 w-4" /> {col.cta}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
