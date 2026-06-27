import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Loader2, AlertCircle, Receipt, User, Phone, Mail, MapPin,
  Calendar, Clock, Hash, CreditCard, ChefHat, FileText, UtensilsCrossed,
  Users, Tag, Percent, Banknote, Wallet, CheckCircle2
} from 'lucide-react';
import { Panel, Pill, BtnPrimary, BtnGhost } from '../../components/ui/kit';
import { cn } from '../../utils/cn';
import { fetchOrderByUuid, clearCurrentOrder } from '../../store/orderSlice';

const STATUS_CONFIG = {
  DRAFT:       { tone: 'neutral',  label: 'Draft' },
  OPEN:        { tone: 'neutral',  label: 'Open' },
  KOT_SENT:    { tone: 'gold',     label: 'KOT Sent' },
  IN_PROGRESS: { tone: 'marigold', label: 'In Progress' },
  READY:       { tone: 'success',  label: 'Ready' },
  SERVED:      { tone: 'success',  label: 'Served' },
  BILLED:      { tone: 'gold',     label: 'Billed' },
  PAID:        { tone: 'success',  label: 'Paid' },
  COMPLETED:   { tone: 'success',  label: 'Completed' },
  CANCELLED:   { tone: 'danger',   label: 'Cancelled' },
  VOID:        { tone: 'neutral',  label: 'Void' },
};

const KOT_STATUS_CONFIG = {
  PENDING:      { tone: 'neutral' },
  SENT:         { tone: 'gold' },
  ACKNOWLEDGED: { tone: 'gold' },
  IN_PROGRESS:  { tone: 'marigold' },
  READY:        { tone: 'success' },
  SERVED:       { tone: 'success' },
  CANCELLED:    { tone: 'danger' },
};

const PAYMENT_METHOD_ICONS = {
  CASH:   Banknote,
  CARD:   CreditCard,
  UPI:    Wallet,
  WALLET: Wallet,
  OTHER:  CreditCard,
};

const PAYMENT_STATUS_CONFIG = {
  PENDING:   { tone: 'gold' },
  SUCCESS:   { tone: 'success' },
  COMPLETED: { tone: 'success' },
  FAILED:    { tone: 'danger' },
  REFUNDED:  { tone: 'danger' },
};

const formatCurrency = (amount) => `₹${(Number(amount) || 0).toFixed(2)}`;

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return dateStr; }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return dateStr; }
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    return new Date(timeStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch { return ''; }
};

// Section wrapper — light paper card
const Section = ({ title, icon: Icon, children, className = '' }) => (
  <Panel className={cn('overflow-hidden', className)}>
    <div className="px-4 py-3 border-b border-line-light flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-txt-faint" />}
      <h3 className="font-display font-semibold text-ink-text text-sm">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </Panel>
);

// Dark section wrapper — used for bill / payment ink panel
const DarkSection = ({ title, icon: Icon, children, className = '' }) => (
  <div className={cn('bg-ink border border-ink-line rounded-card overflow-hidden', className)}>
    {title && (
      <div className="px-4 py-3 border-b border-ink-line flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-txt-mutedDark" />}
        <h3 className="font-display font-semibold text-txt-light text-sm">{title}</h3>
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

// Info row
const InfoRow = ({ label, value, icon: Icon }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      {Icon && <Icon className="h-4 w-4 text-txt-faint mt-0.5 flex-shrink-0" />}
      <span className="text-xs text-txt-muted w-28 flex-shrink-0">{label}</span>
      <span className="text-sm text-ink-text font-medium">{value}</span>
    </div>
  );
};

const OrderDetailPage = () => {
  const { orderUuid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const order = useSelector(s => s.orders.currentOrder);
  const loading = useSelector(s => s.orders.loading);
  const error = useSelector(s => s.orders.error);

  useEffect(() => {
    if (orderUuid) dispatch(fetchOrderByUuid(orderUuid));
    return () => dispatch(clearCurrentOrder());
  }, [dispatch, orderUuid]);

  const statusCfg = STATUS_CONFIG[order?.status] || STATUS_CONFIG.DRAFT;

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-marigold" />
        <span className="ml-3 text-txt-muted">Loading order details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="h-12 w-12 text-danger" />
        <p className="text-danger-deep font-semibold">Failed to load order</p>
        <p className="text-sm text-txt-muted">{typeof error === 'string' ? error : error?.message || 'Unknown error'}</p>
        <BtnPrimary className="mt-2" onClick={() => navigate(-1)}>
          Go Back
        </BtnPrimary>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4">
        <Receipt className="h-12 w-12 text-txt-faint" />
        <p className="text-txt-muted">No order data</p>
        <BtnPrimary className="mt-2" onClick={() => navigate(-1)}>
          Go Back
        </BtnPrimary>
      </div>
    );
  }

  const items = order.items || [];
  const payments = order.payments || [];

  // ── Group identical items ──────────────────────────────
  const groupedItems = (() => {
    const getModifierKey = (modifiers) => {
      if (!modifiers || modifiers.length === 0) return '';
      return [...modifiers]
        .map(m => `${m.modifierName || m.name}|${m.priceAdd || m.unitPrice || 0}|${m.quantity || 1}`)
        .sort()
        .join(';;');
    };
    const groups = new Map();
    items.forEach((item) => {
      const key = [
        item.productName || item.name || '',
        item.variationName || '',
        getModifierKey(item.modifiers),
        item.kotStatus || 'PENDING',
        item.unitPrice || item.price || 0,
        item.isCancelled ? 'C' : '',
        item.isComplimentary ? 'COMP' : '',
        item.isHalfPortion ? 'HALF' : '',
        item.itemNotes || '',
      ].join('|||');

      if (groups.has(key)) {
        const group = groups.get(key);
        group.groupedQty += (item.quantity || 1);
        group.originalItems.push(item);
      } else {
        groups.set(key, {
          ...item,
          groupedQty: item.quantity || 1,
          originalItems: [item],
        });
      }
    });
    return Array.from(groups.values());
  })();

  const nonCancelledGrouped = groupedItems.filter(
    g => !g.isCancelled && g.kotStatus !== 'CANCELLED' && g.status !== 'CANCELLED'
  );

  // KOT timeline events (kotTime / readyAt / status) per grouped item
  const kotEvents = groupedItems.filter(g => g.kotStatus || g.kotTime || g.readyAt);

  // Payment status badge
  const isPaid = (order.balanceAmount <= 0 || !order.balanceAmount) && order.paidAmount > 0;
  const hasBalance = order.balanceAmount > 0;

  return (
    <div className="min-h-screen bg-paper pb-24 lg:pb-0">
      {/* Header */}
      <div className="bg-paper-card border-b border-line-light sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-paper-2 rounded-input transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5 text-txt-muted" />
              <span className="text-sm font-medium text-txt-muted hidden sm:inline">Go Back</span>
            </button>
            <div className="flex-1 min-w-0">
              <p className="eyebrow text-[11px] text-txt-faint">Orders · Order Detail & Bill</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-lg sm:text-xl font-bold text-ink-text tracking-[-0.01em]">
                  Order #{order.orderNumber || '—'}
                </h1>
                <Pill tone={statusCfg.tone}>{statusCfg.label}</Pill>
                {isPaid && <Pill tone="success"><CheckCircle2 className="h-3 w-3" /> Paid</Pill>}
                {hasBalance && <Pill tone="danger">Partial</Pill>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">

          {/* ── LEFT COLUMN: order info, items, KOT timeline ── */}
          <div className="space-y-4">

            {/* Order Overview */}
            <Section title="Order Information" icon={Receipt}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <InfoRow label="Order Number" value={order.orderNumber} icon={Hash} />
                <InfoRow label="Order Type" value={order.orderType?.replace('_', ' ')} icon={UtensilsCrossed} />
                <InfoRow label="Date" value={formatDate(order.orderDate)} icon={Calendar} />
                <InfoRow label="Time" value={formatTime(order.orderTime)} icon={Clock} />
                <InfoRow label="Table" value={order.tableNumber} icon={UtensilsCrossed} />
                <InfoRow label="Guests" value={order.numberOfGuests} icon={Users} />
                <InfoRow label="Waiter" value={order.waiterName} icon={User} />
                <InfoRow label="Restaurant" value={order.restaurantName} icon={MapPin} />
              </div>
              {order.orderNotes && (
                <div className="mt-3 pt-3 border-t border-line-light">
                  <p className="text-xs text-txt-muted mb-1">Order Notes</p>
                  <p className="text-sm text-ink-text bg-marigold/10 rounded-tile p-2">{order.orderNotes}</p>
                </div>
              )}
              {order.kitchenNotes && (
                <div className="mt-2">
                  <p className="text-xs text-txt-muted mb-1">Kitchen Notes</p>
                  <p className="text-sm text-ink-text bg-marigold/10 rounded-tile p-2">{order.kitchenNotes}</p>
                </div>
              )}
            </Section>

            {/* Customer Info */}
            {(order.customerName || order.customerPhone || order.customerEmail || order.deliveryAddress) && (
              <Section title="Customer Details" icon={User}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  <InfoRow label="Name" value={order.customerName} icon={User} />
                  <InfoRow label="Phone" value={order.customerPhone} icon={Phone} />
                  <InfoRow label="Email" value={order.customerEmail} icon={Mail} />
                </div>
                {order.deliveryAddress && (
                  <InfoRow label="Address" value={order.deliveryAddress} icon={MapPin} />
                )}
              </Section>
            )}

            {/* Items */}
            <Section title={`Items (${items.length})`} icon={UtensilsCrossed}>
              {items.length === 0 ? (
                <p className="text-sm text-txt-faint text-center py-4">No items in this order</p>
              ) : (
                <div className="divide-y divide-line-light">
                  {groupedItems.map((group, idx) => {
                    const kotCfg = KOT_STATUS_CONFIG[group.kotStatus] || KOT_STATUS_CONFIG.PENDING;
                    const groupTotal = group.originalItems.reduce((sum, oi) => {
                      const oiBase = (oi.unitPrice || oi.price || 0) * (oi.quantity || 1);
                      const oiMod = (oi.modifiers || []).reduce((ms, m) => ms + ((m.lineTotal || (m.priceAdd || m.unitPrice || 0) * (m.quantity || 1)) || 0), 0);
                      return sum + (oi.lineTotal || (oiBase + oiMod));
                    }, 0);
                    const perUnitTotal = (() => {
                      const base = (group.unitPrice || group.price || 0) * (group.quantity || 1);
                      const modT = (group.modifiers || []).reduce((ms, m) => ms + ((m.lineTotal || (m.priceAdd || m.unitPrice || 0) * (m.quantity || 1)) || 0), 0);
                      return base + modT;
                    })();
                    return (
                      <div key={group.orderItemUuid || idx} className={`py-3 ${group.isCancelled ? 'opacity-50' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-ink-text text-sm">
                                {group.productName || 'Unknown Item'}
                              </span>
                              {group.groupedQty > 1 && (
                                <span className="text-[11px] font-bold font-mono text-ink bg-marigold px-1.5 py-0.5 rounded-full leading-none">&times;{group.groupedQty}</span>
                              )}
                              {group.groupedQty === 1 && group.quantity > 1 && (
                                <span className="text-[11px] font-bold font-mono text-ink bg-marigold px-1.5 py-0.5 rounded-full leading-none">&times;{group.quantity}</span>
                              )}
                              {group.variationName && (
                                <Pill tone="neutral">{group.variationName}</Pill>
                              )}
                              {group.kotStatus && (
                                <Pill tone={kotCfg.tone}>{group.kotStatus}</Pill>
                              )}
                              {group.isCancelled && (
                                <Pill tone="danger">CANCELLED</Pill>
                              )}
                              {group.isComplimentary && (
                                <Pill tone="gold">COMP</Pill>
                              )}
                              {group.isHalfPortion && (
                                <Pill tone="marigold">HALF</Pill>
                              )}
                            </div>
                            {group.sku && <p className="text-[11px] text-txt-faint mt-0.5 font-mono">SKU: {group.sku}</p>}

                            {/* Modifiers */}
                            {group.modifiers && group.modifiers.length > 0 && (
                              <div className="mt-1.5 space-y-0.5">
                                {group.modifiers.map((mod, mIdx) => (
                                  <div key={mod.orderItemModifierUuid || mIdx} className="flex items-center justify-between text-xs text-txt-muted">
                                    <span className="flex items-center gap-1">
                                      <span className="text-marigold">+</span>
                                      <span>{mod.modifierName}</span>
                                      {mod.modifierGroupName && <span className="text-txt-faint">({mod.modifierGroupName})</span>}
                                      {mod.quantity > 1 && <span className="text-txt-faint font-mono">x{mod.quantity}</span>}
                                    </span>
                                    {(mod.lineTotal > 0 || (mod.priceAdd || mod.unitPrice || 0) > 0) && (
                                      <span className="text-[#9a6500] font-medium font-mono">{formatCurrency(mod.lineTotal || (mod.priceAdd || mod.unitPrice || 0) * (mod.quantity || 1))}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {group.modifiersText && !group.modifiers?.length && (
                              <p className="text-xs text-txt-faint mt-0.5">{group.modifiersText}</p>
                            )}

                            {group.originalItems.length > 1 && (
                              <p className="text-[11px] text-txt-faint mt-1">{group.originalItems.length} identical items &middot; {formatCurrency(perUnitTotal)} each</p>
                            )}

                            {/* Notes */}
                            {group.itemNotes && (
                              <p className="text-xs text-[#9a6500] mt-1 bg-marigold/10 rounded px-1.5 py-0.5 inline-block">{group.itemNotes}</p>
                            )}
                            {group.specialInstructions && (
                              <p className="text-xs text-txt-muted mt-0.5">{group.specialInstructions}</p>
                            )}
                            {group.cancellationReason && (
                              <p className="text-xs text-danger-deep mt-0.5">Reason: {group.cancellationReason}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-ink-text text-sm font-mono">{formatCurrency(groupTotal)}</p>
                            {group.originalItems.length === 1 && (
                              <p className="text-[11px] text-txt-faint font-mono">{formatCurrency(group.unitPrice)} each</p>
                            )}
                            {group.discountAmount > 0 && (
                              <p className="text-[11px] text-success-deep font-mono">-{formatCurrency(group.discountAmount * group.originalItems.length)}</p>
                            )}
                            {group.taxAmount > 0 && (
                              <p className="text-[11px] text-txt-faint font-mono">Tax: {formatCurrency(group.taxAmount * group.originalItems.length)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>

            {/* Kitchen Timeline (KOT events) */}
            {kotEvents.length > 0 && (
              <Section title="Kitchen Timeline" icon={ChefHat}>
                <div className="relative pl-5">
                  {/* vertical line */}
                  <span className="absolute left-[5px] top-1 bottom-1 w-px bg-line-light" />
                  <div className="space-y-4">
                    {kotEvents.map((ev, idx) => {
                      const kotCfg = KOT_STATUS_CONFIG[ev.kotStatus] || KOT_STATUS_CONFIG.PENDING;
                      const dotTone = {
                        neutral: 'bg-txt-faint',
                        gold: 'bg-gold',
                        marigold: 'bg-marigold',
                        success: 'bg-success',
                        danger: 'bg-danger',
                      }[kotCfg.tone] || 'bg-txt-faint';
                      return (
                        <div key={ev.orderItemUuid || idx} className="relative">
                          <span className={cn('absolute -left-5 top-1 h-2.5 w-2.5 rounded-full ring-2 ring-paper-card', dotTone)} />
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-ink-text">{ev.productName || ev.name || 'Item'}</span>
                                {ev.kotStatus && <Pill tone={kotCfg.tone}>{ev.kotStatus}</Pill>}
                              </div>
                              <div className="text-[11px] text-txt-faint mt-0.5 space-x-2 font-mono">
                                {ev.kotTime && <span>Sent: {formatTime(ev.kotTime)}</span>}
                                {ev.readyAt && <span>Ready: {formatTime(ev.readyAt)}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Section>
            )}

            {/* Cancellation Info */}
            {order.status === 'CANCELLED' && (
              <Section title="Cancellation Details" icon={AlertCircle} className="border-danger/40">
                <div className="space-y-1">
                  {order.cancellationReason && (
                    <InfoRow label="Reason" value={order.cancellationReason} />
                  )}
                  {order.cancelledBy && (
                    <InfoRow label="Cancelled By" value={order.cancelledBy} icon={User} />
                  )}
                  {order.cancelledAt && (
                    <InfoRow label="Cancelled At" value={formatDateTime(order.cancelledAt)} icon={Clock} />
                  )}
                </div>
              </Section>
            )}

            {/* Timestamps */}
            <Section title="Timeline" icon={Clock}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <InfoRow label="Created" value={formatDateTime(order.createdAt)} icon={Calendar} />
                <InfoRow label="Updated" value={formatDateTime(order.updatedAt)} icon={Calendar} />
                {order.billedAt && <InfoRow label="Billed" value={formatDateTime(order.billedAt)} icon={Receipt} />}
                {order.paidAt && <InfoRow label="Paid" value={formatDateTime(order.paidAt)} icon={CreditCard} />}
                {order.completedAt && <InfoRow label="Completed" value={formatDateTime(order.completedAt)} icon={FileText} />}
              </div>
            </Section>

            {/* KOT info */}
            {(order.kotSent || order.kotCount > 0) && (
              <Section title="Kitchen Order Tickets" icon={ChefHat}>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-txt-muted">KOT Count: <span className="font-medium text-ink-text font-mono">{order.kotCount || 0}</span></span>
                  <span className="text-txt-muted">KOT Sent: <span className="font-medium text-ink-text">{order.kotSent ? 'Yes' : 'No'}</span></span>
                </div>
              </Section>
            )}
          </div>

          {/* ── RIGHT COLUMN: bill breakdown + dark payment panel ── */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">

            {/* Bill Summary (light) */}
            <Section title="Bill Summary" icon={Receipt}>
              <div className="text-sm">
                {/* Itemized breakdown */}
                {nonCancelledGrouped.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between eyebrow text-[10px] text-txt-faint mb-2">
                      <span>Item</span>
                      <span>Amount</span>
                    </div>
                    <div className="space-y-0">
                      {nonCancelledGrouped.map((group, idx) => {
                        const perItemTotal = (() => {
                          const basePrice = (group.unitPrice || group.price || 0) * (group.quantity || 1);
                          const itemModTotal = (group.modifiers || []).reduce((ms, m) => ms + ((m.lineTotal || (m.priceAdd || m.unitPrice || 0) * (m.quantity || 1)) || 0), 0);
                          return basePrice + itemModTotal;
                        })();
                        const groupTotal = perItemTotal * group.originalItems.length;
                        const productName = group.productName || group.name;
                        const hasModifiers = (group.modifiers || []).length > 0;
                        return (
                          <div key={idx} className="flex items-start justify-between py-1.5 hover:bg-paper-2 -mx-1 px-1 rounded transition-colors">
                            <div className="min-w-0 flex-1 mr-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-ink-text">{productName}</span>
                                {group.variationName && (
                                  <span className="text-[11px] text-txt-muted bg-paper-3 px-1.5 py-0.5 rounded font-medium">{group.variationName}</span>
                                )}
                                {group.groupedQty > 1 && (
                                  <span className="text-[11px] font-bold font-mono text-ink bg-marigold px-1.5 py-0.5 rounded-full leading-none">&times;{group.groupedQty}</span>
                                )}
                              </div>
                              {hasModifiers && (
                                <div className="flex flex-wrap gap-x-2 mt-0.5">
                                  {(group.modifiers || []).map((m, mIdx) => (
                                    <span key={mIdx} className="text-[11px] text-marigold">
                                      + {m.modifierName || m.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {group.groupedQty > 1 && (
                                <div className="text-[11px] text-txt-faint mt-0.5 font-mono">
                                  {formatCurrency(perItemTotal)} each
                                </div>
                              )}
                            </div>
                            <span className="whitespace-nowrap font-semibold text-ink-text font-mono pt-0.5">{formatCurrency(groupTotal)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-b border-dashed border-line-light mt-2 mb-3" />
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-txt-muted">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-success-deep">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        Discount {order.discountPercentage > 0 && `(${order.discountPercentage}%)`}
                      </span>
                      <span className="font-mono">-{formatCurrency(order.discountAmount)}</span>
                    </div>
                  )}
                  {order.taxAmount > 0 && (
                    <div className="flex justify-between text-txt-muted">
                      <span className="flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5" />
                        Tax {order.taxPercentage > 0 && `(${order.taxPercentage}%)`}
                      </span>
                      <span className="font-mono">{formatCurrency(order.taxAmount)}</span>
                    </div>
                  )}
                  {order.serviceCharge > 0 && (
                    <div className="flex justify-between text-txt-muted">
                      <span>Service Charge {order.serviceChargePercentage > 0 && `(${order.serviceChargePercentage}%)`}</span>
                      <span className="font-mono">{formatCurrency(order.serviceCharge)}</span>
                    </div>
                  )}
                  {order.deliveryCharge > 0 && (
                    <div className="flex justify-between text-txt-muted">
                      <span>Delivery Charge</span>
                      <span className="font-mono">{formatCurrency(order.deliveryCharge)}</span>
                    </div>
                  )}
                  {order.packingCharge > 0 && (
                    <div className="flex justify-between text-txt-muted">
                      <span>Packing Charge</span>
                      <span className="font-mono">{formatCurrency(order.packingCharge)}</span>
                    </div>
                  )}
                  {order.tipAmount > 0 && (
                    <div className="flex justify-between text-txt-muted">
                      <span>Tip</span>
                      <span className="font-mono">{formatCurrency(order.tipAmount)}</span>
                    </div>
                  )}
                  {order.roundOff !== 0 && order.roundOff != null && (
                    <div className="flex justify-between text-txt-muted">
                      <span>Round Off</span>
                      <span className="font-mono">{formatCurrency(order.roundOff)}</span>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="border-t-2 border-ink mt-3 pt-3 flex justify-between items-center">
                  <span className="font-display font-bold text-lg text-ink-text">Total</span>
                  <span className="font-display font-bold text-lg text-[#9a6500] font-mono">{formatCurrency(order.totalAmount)}</span>
                </div>

                {/* Discount details */}
                {(order.couponCode || order.discountReason) && (
                  <div className="mt-3 pt-2 border-t border-line-light space-y-1">
                    {order.couponCode && (
                      <p className="text-xs text-txt-muted">Coupon: <span className="font-medium text-ink-text font-mono">{order.couponCode}</span></p>
                    )}
                    {order.discountReason && (
                      <p className="text-xs text-txt-muted">Discount Reason: <span className="font-medium text-ink-text">{order.discountReason}</span></p>
                    )}
                  </div>
                )}
              </div>
            </Section>

            {/* DARK Split-Payment panel */}
            <DarkSection title="Payment" icon={CreditCard}>
              {/* Paid / Balance summary with badge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-txt-mutedDark">Total</span>
                  <span className="font-mono font-semibold text-txt-light">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-txt-mutedDark">Paid</span>
                  <span className={cn('font-mono font-semibold', order.paidAmount > 0 ? 'text-success-bright' : 'text-txt-mutedDark')}>
                    {formatCurrency(order.paidAmount)}
                  </span>
                </div>

                {hasBalance && (
                  <div className="flex items-center justify-between bg-danger/15 -mx-4 px-4 py-2.5 rounded-tile">
                    <span className="font-semibold text-danger flex items-center gap-2">
                      Balance Due
                      <Pill tone="danger">Partial</Pill>
                    </span>
                    <span className="font-mono font-bold text-danger">{formatCurrency(order.balanceAmount)}</span>
                  </div>
                )}
                {isPaid && (
                  <div className="flex items-center justify-between bg-success/[0.16] -mx-4 px-4 py-2.5 rounded-tile">
                    <span className="font-semibold text-success-bright flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Fully Paid
                    </span>
                    <span className="font-mono font-bold text-success-bright">{formatCurrency(order.paidAmount)}</span>
                  </div>
                )}
              </div>

              {/* Split payments list */}
              {payments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-ink-line">
                  <p className="eyebrow text-[10px] text-txt-faintDark mb-2">Payments ({payments.length})</p>
                  <div className="divide-y divide-ink-line">
                    {payments.map((payment, idx) => {
                      const MethodIcon = PAYMENT_METHOD_ICONS[payment.paymentMethod] || CreditCard;
                      const statusTone = PAYMENT_STATUS_CONFIG[payment.status]?.tone || 'neutral';
                      return (
                        <div key={payment.paymentUuid || idx} className="py-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-ink-card flex items-center justify-center flex-shrink-0">
                            <MethodIcon className="h-4 w-4 text-txt-mutedDark" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-txt-light">{payment.paymentMethod}</span>
                              <Pill tone={statusTone}>{payment.status || 'PENDING'}</Pill>
                            </div>
                            <div className="text-[11px] text-txt-faintDark mt-0.5 space-x-2 font-mono">
                              {payment.transactionId && <span>Txn: {payment.transactionId}</span>}
                              {payment.referenceNumber && <span>Ref: {payment.referenceNumber}</span>}
                              {payment.cardLastFour && <span>****{payment.cardLastFour}</span>}
                              {payment.upiId && <span>UPI: {payment.upiId}</span>}
                              {payment.paymentDate && <span>{formatDateTime(payment.paymentDate)}</span>}
                            </div>
                            {payment.notes && <p className="text-[11px] text-txt-faintDark mt-0.5">{payment.notes}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-txt-light text-sm font-mono">{formatCurrency(payment.amount)}</p>
                            {payment.isRefunded && (
                              <p className="text-[11px] text-danger font-mono">Refund: {formatCurrency(payment.refundAmount)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </DarkSection>
          </div>
        </div>

        {/* Bottom Go Back button (desktop) */}
        <div className="hidden lg:flex justify-center py-6">
          <BtnGhost onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </BtnGhost>
        </div>
      </div>

      {/* Mobile sticky-bottom balance bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-ink border-t border-ink-line px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-txt-faintDark">{hasBalance ? 'Balance Due' : 'Total Paid'}</p>
          <p className={cn('font-mono font-bold text-lg', hasBalance ? 'text-danger' : 'text-success-bright')}>
            {formatCurrency(hasBalance ? order.balanceAmount : order.paidAmount)}
          </p>
        </div>
        {isPaid
          ? <Pill tone="success"><CheckCircle2 className="h-3 w-3" /> Paid</Pill>
          : hasBalance ? <Pill tone="danger">Partial</Pill> : null}
      </div>
    </div>
  );
};

export default OrderDetailPage;
