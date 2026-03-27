import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Loader2, AlertCircle, Receipt, User, Phone, Mail, MapPin,
  Calendar, Clock, Hash, CreditCard, ChefHat, FileText, UtensilsCrossed,
  Users, Tag, Percent, Banknote, Wallet
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { fetchOrderByUuid, clearCurrentOrder } from '../../store/orderSlice';

const STATUS_CONFIG = {
  DRAFT:       { bg: 'bg-slate-100',   text: 'text-slate-700',   label: 'Draft' },
  OPEN:        { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Open' },
  KOT_SENT:    { bg: 'bg-indigo-100',  text: 'text-indigo-700',  label: 'KOT Sent' },
  IN_PROGRESS: { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'In Progress' },
  READY:       { bg: 'bg-teal-100',    text: 'text-teal-700',    label: 'Ready' },
  SERVED:      { bg: 'bg-cyan-100',    text: 'text-cyan-700',    label: 'Served' },
  BILLED:      { bg: 'bg-violet-100',  text: 'text-violet-700',  label: 'Billed' },
  PAID:        { bg: 'bg-green-100',   text: 'text-green-700',   label: 'Paid' },
  COMPLETED:   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
  CANCELLED:   { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Cancelled' },
  VOID:        { bg: 'bg-gray-100',    text: 'text-gray-700',    label: 'Void' },
};

const KOT_STATUS_CONFIG = {
  PENDING:      { bg: 'bg-slate-100',  text: 'text-slate-700' },
  SENT:         { bg: 'bg-blue-100',   text: 'text-blue-700' },
  ACKNOWLEDGED: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  IN_PROGRESS:  { bg: 'bg-amber-100',  text: 'text-amber-700' },
  READY:        { bg: 'bg-teal-100',   text: 'text-teal-700' },
  SERVED:       { bg: 'bg-emerald-100',text: 'text-emerald-700' },
  CANCELLED:    { bg: 'bg-red-100',    text: 'text-red-700' },
};

const PAYMENT_METHOD_ICONS = {
  CASH:   Banknote,
  CARD:   CreditCard,
  UPI:    Wallet,
  WALLET: Wallet,
  OTHER:  CreditCard,
};

const PAYMENT_STATUS_CONFIG = {
  PENDING:   { variant: 'warning' },
  SUCCESS:   { variant: 'success' },
  COMPLETED: { variant: 'success' },
  FAILED:    { variant: 'danger' },
  REFUNDED:  { variant: 'danger' },
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

// Section wrapper
const Section = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-slate-500" />}
      <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

// Info row
const InfoRow = ({ label, value, icon: Icon }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      {Icon && <Icon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />}
      <span className="text-xs text-slate-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-800 font-medium">{value}</span>
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-500">Loading order details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-600 font-medium">Failed to load order</p>
        <p className="text-sm text-slate-500">{typeof error === 'string' ? error : error?.message || 'Unknown error'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Receipt className="h-12 w-12 text-slate-300" />
        <p className="text-slate-500">No order data</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Go Back
        </button>
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-600 hidden sm:inline">Go Back</span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  Order #{order.orderNumber || '—'}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                  {statusCfg.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">

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
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">Order Notes</p>
              <p className="text-sm text-slate-700 bg-amber-50 rounded-lg p-2">{order.orderNotes}</p>
            </div>
          )}
          {order.kitchenNotes && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1">Kitchen Notes</p>
              <p className="text-sm text-slate-700 bg-orange-50 rounded-lg p-2">{order.kitchenNotes}</p>
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
            <p className="text-sm text-slate-400 text-center py-4">No items in this order</p>
          ) : (
            <div className="divide-y divide-slate-100">
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
                          <span className="font-semibold text-slate-900 text-sm">
                            {group.productName || 'Unknown Item'}
                          </span>
                          {group.groupedQty > 1 && (
                            <span className="text-[11px] font-bold text-white bg-slate-500 px-1.5 py-0.5 rounded-full leading-none">&times;{group.groupedQty}</span>
                          )}
                          {group.groupedQty === 1 && group.quantity > 1 && (
                            <span className="text-[11px] font-bold text-white bg-slate-500 px-1.5 py-0.5 rounded-full leading-none">&times;{group.quantity}</span>
                          )}
                          {group.variationName && (
                            <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{group.variationName}</span>
                          )}
                          {group.kotStatus && (
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${kotCfg.bg} ${kotCfg.text}`}>
                              {group.kotStatus}
                            </span>
                          )}
                          {group.isCancelled && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-700">CANCELLED</span>
                          )}
                          {group.isComplimentary && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">COMP</span>
                          )}
                          {group.isHalfPortion && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">HALF</span>
                          )}
                        </div>
                        {group.sku && <p className="text-[11px] text-slate-400 mt-0.5">SKU: {group.sku}</p>}

                        {/* Modifiers */}
                        {group.modifiers && group.modifiers.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {group.modifiers.map((mod, mIdx) => (
                              <div key={mod.orderItemModifierUuid || mIdx} className="flex items-center justify-between text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <span className="text-blue-400">+</span>
                                  <span>{mod.modifierName}</span>
                                  {mod.modifierGroupName && <span className="text-slate-300">({mod.modifierGroupName})</span>}
                                  {mod.quantity > 1 && <span className="text-slate-400">x{mod.quantity}</span>}
                                </span>
                                {(mod.lineTotal > 0 || (mod.priceAdd || mod.unitPrice || 0) > 0) && (
                                  <span className="text-blue-600 font-medium">{formatCurrency(mod.lineTotal || (mod.priceAdd || mod.unitPrice || 0) * (mod.quantity || 1))}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {group.modifiersText && !group.modifiers?.length && (
                          <p className="text-xs text-slate-400 mt-0.5">{group.modifiersText}</p>
                        )}

                        {group.originalItems.length > 1 && (
                          <p className="text-[11px] text-slate-400 mt-1">{group.originalItems.length} identical items &middot; {formatCurrency(perUnitTotal)} each</p>
                        )}

                        {/* Notes */}
                        {group.itemNotes && (
                          <p className="text-xs text-amber-600 mt-1 bg-amber-50 rounded px-1.5 py-0.5 inline-block">{group.itemNotes}</p>
                        )}
                        {group.specialInstructions && (
                          <p className="text-xs text-purple-600 mt-0.5">{group.specialInstructions}</p>
                        )}
                        {group.cancellationReason && (
                          <p className="text-xs text-red-500 mt-0.5">Reason: {group.cancellationReason}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-slate-900 text-sm">{formatCurrency(groupTotal)}</p>
                        {group.originalItems.length === 1 && (
                          <p className="text-[11px] text-slate-400">{formatCurrency(group.unitPrice)} each</p>
                        )}
                        {group.discountAmount > 0 && (
                          <p className="text-[11px] text-green-600">-{formatCurrency(group.discountAmount * group.originalItems.length)}</p>
                        )}
                        {group.taxAmount > 0 && (
                          <p className="text-[11px] text-slate-400">Tax: {formatCurrency(group.taxAmount * group.originalItems.length)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Financial Summary */}
        <Section title="Bill Summary" icon={Receipt}>
          <div className="text-sm">
            {/* Itemized breakdown */}
            {nonCancelledGrouped.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
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
                      <div key={idx} className="flex items-start justify-between py-1.5 group hover:bg-slate-50 -mx-1 px-1 rounded transition-colors">
                        <div className="min-w-0 flex-1 mr-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-slate-700">{productName}</span>
                            {group.variationName && (
                              <span className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-medium">{group.variationName}</span>
                            )}
                            {group.groupedQty > 1 && (
                              <span className="text-[11px] font-bold text-white bg-slate-500 px-1.5 py-0.5 rounded-full leading-none">&times;{group.groupedQty}</span>
                            )}
                          </div>
                          {hasModifiers && (
                            <div className="flex flex-wrap gap-x-2 mt-0.5">
                              {(group.modifiers || []).map((m, mIdx) => (
                                <span key={mIdx} className="text-[11px] text-blue-500">
                                  + {m.modifierName || m.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {group.groupedQty > 1 && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {formatCurrency(perItemTotal)} each
                            </div>
                          )}
                        </div>
                        <span className="whitespace-nowrap font-semibold text-slate-800 tabular-nums pt-0.5">{formatCurrency(groupTotal)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-b border-dashed border-slate-200 mt-2 mb-3" />
              </div>
            )}

            {/* Totals */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    Discount {order.discountPercentage > 0 && `(${order.discountPercentage}%)`}
                  </span>
                  <span className="tabular-nums">-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span className="flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5" />
                    Tax {order.taxPercentage > 0 && `(${order.taxPercentage}%)`}
                  </span>
                  <span className="tabular-nums">{formatCurrency(order.taxAmount)}</span>
                </div>
              )}
              {order.serviceCharge > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Service Charge {order.serviceChargePercentage > 0 && `(${order.serviceChargePercentage}%)`}</span>
                  <span className="tabular-nums">{formatCurrency(order.serviceCharge)}</span>
                </div>
              )}
              {order.deliveryCharge > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Charge</span>
                  <span className="tabular-nums">{formatCurrency(order.deliveryCharge)}</span>
                </div>
              )}
              {order.packingCharge > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Packing Charge</span>
                  <span className="tabular-nums">{formatCurrency(order.packingCharge)}</span>
                </div>
              )}
              {order.tipAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Tip</span>
                  <span className="tabular-nums">{formatCurrency(order.tipAmount)}</span>
                </div>
              )}
              {order.roundOff !== 0 && order.roundOff != null && (
                <div className="flex justify-between text-slate-500">
                  <span>Round Off</span>
                  <span className="tabular-nums">{formatCurrency(order.roundOff)}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="border-t-2 border-slate-800 mt-3 pt-3 flex justify-between items-center">
              <span className="font-bold text-lg text-slate-900">Total</span>
              <span className="font-bold text-lg text-slate-900 tabular-nums">{formatCurrency(order.totalAmount)}</span>
            </div>

            {/* Payment Status */}
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Paid</span>
                <span className={`font-semibold tabular-nums ${order.paidAmount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{formatCurrency(order.paidAmount)}</span>
              </div>
              {order.balanceAmount > 0 && (
                <div className="flex justify-between items-center bg-red-50 -mx-4 px-4 py-2 rounded-b-xl">
                  <span className="font-semibold text-red-700">Balance Due</span>
                  <span className="font-bold text-red-700 tabular-nums">{formatCurrency(order.balanceAmount)}</span>
                </div>
              )}
              {(order.balanceAmount <= 0 || !order.balanceAmount) && order.paidAmount > 0 && (
                <div className="flex justify-between items-center bg-emerald-50 -mx-4 px-4 py-2 rounded-b-xl">
                  <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                    Fully Paid
                  </span>
                  <span className="font-bold text-emerald-700 tabular-nums">{formatCurrency(order.paidAmount)}</span>
                </div>
              )}
            </div>

            {/* Discount details */}
            {(order.couponCode || order.discountReason) && (
              <div className="mt-3 pt-2 border-t border-slate-100 space-y-1">
                {order.couponCode && (
                  <p className="text-xs text-slate-500">Coupon: <span className="font-medium text-slate-700">{order.couponCode}</span></p>
                )}
                {order.discountReason && (
                  <p className="text-xs text-slate-500">Discount Reason: <span className="font-medium text-slate-700">{order.discountReason}</span></p>
                )}
              </div>
            )}
          </div>
        </Section>

        {/* Payments */}
        {payments.length > 0 && (
          <Section title={`Payments (${payments.length})`} icon={CreditCard}>
            <div className="divide-y divide-slate-100">
              {payments.map((payment, idx) => {
                const MethodIcon = PAYMENT_METHOD_ICONS[payment.paymentMethod] || CreditCard;
                const statusVar = PAYMENT_STATUS_CONFIG[payment.status]?.variant || 'default';
                return (
                  <div key={payment.paymentUuid || idx} className="py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <MethodIcon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-800">{payment.paymentMethod}</span>
                        <Badge variant={statusVar}>{payment.status || 'PENDING'}</Badge>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 space-x-2">
                        {payment.transactionId && <span>Txn: {payment.transactionId}</span>}
                        {payment.referenceNumber && <span>Ref: {payment.referenceNumber}</span>}
                        {payment.cardLastFour && <span>****{payment.cardLastFour}</span>}
                        {payment.upiId && <span>UPI: {payment.upiId}</span>}
                        {payment.paymentDate && <span>{formatDateTime(payment.paymentDate)}</span>}
                      </div>
                      {payment.notes && <p className="text-xs text-slate-400 mt-0.5">{payment.notes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-slate-900 text-sm">{formatCurrency(payment.amount)}</p>
                      {payment.isRefunded && (
                        <p className="text-[11px] text-red-500">Refund: {formatCurrency(payment.refundAmount)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Cancellation Info */}
        {order.status === 'CANCELLED' && (
          <Section title="Cancellation Details" icon={AlertCircle} className="border-red-200">
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
              <span className="text-slate-500">KOT Count: <span className="font-medium text-slate-800">{order.kotCount || 0}</span></span>
              <span className="text-slate-500">KOT Sent: <span className="font-medium text-slate-800">{order.kotSent ? 'Yes' : 'No'}</span></span>
            </div>
          </Section>
        )}

        {/* Bottom Go Back button */}
        <div className="flex justify-center py-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
