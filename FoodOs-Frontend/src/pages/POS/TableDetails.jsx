import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Users, Clock, Plus, ChefHat, Receipt, CreditCard,
  CheckCircle, XCircle, Loader2, AlertCircle, X, Trash2, Ban,
  UtensilsCrossed, Hash, UserCircle, Phone, Mail, MapPin, Settings2,
  Split as ArrowResult, // Using Split icon for Demerge
  UserCheck, RefreshCw, Edit3, ChevronDown, ChevronUp, Tag
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { CouponInput } from '../../components/coupon/CouponInput';
import { CouponList } from '../../components/coupon/CouponList';
import { CouponSummary } from '../../components/coupon/CouponSummary';
import { DarkScreen, Pill, BtnPrimary, BtnGhost } from '../../components/ui/kit';
import { cn } from '../../utils/cn';

import {
  fetchTableDetails,
  demergeTable,
  selectTableDetails,
  selectTableDetailsLoading,
  selectTableActionLoading,
  selectTableError,
  clearTableDetails,
  occupyTable,
  clearError,
  handleTableWsEvent,
  assignWaiter,
  removeWaiter,
} from '../../store/tableSlice';
import { employeeAPI } from '../../services/api';
import {
  sendKot,
  generateBill,
  addPayment,
  completeOrder,
  cancelOrder,
  cancelOrderItem,
  updateOrder,
  clearError as clearOrderError,
  clearSuccess as clearOrderSuccess,
  handleOrderWsEvent,
} from '../../store/orderSlice';
import {
  applyCouponToOrder,
  removeCouponFromOrder,
  fetchCouponSuggestions,
  revalidateCoupon,
  setCouponCode,
  hydrateFromOrder,
  clearCouponFeedback,
} from '../../store/couponSlice';

import { selectActiveRestaurant, selectRole } from '../../store/authSlice';
import useWebSocket from '../../hooks/useWebSocket';

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
// Table status → redesign Pill tone + dot colour (dark surface)
const STATUS_PILL = {
  VACANT: { tone: 'success', dot: 'bg-success' },
  OCCUPIED: { tone: 'marigold', dot: 'bg-marigold' },
  RESERVED: { tone: 'gold', dot: 'bg-gold' },
  BILLED: { tone: 'success', dot: 'bg-success' },
  DIRTY: { tone: 'danger', dot: 'bg-danger' },
  MAINTENANCE: { tone: 'neutral', dot: 'bg-txt-faintDark' },
};

const KOT_STATUS_COLORS = {
  PENDING: 'warning',
  FIRED: 'primary',
  COOKING: 'warning',
  READY: 'success',
  SERVED: 'success',
  CANCELLED: 'danger',
};

const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'WALLET', 'OTHER'];

const formatCurrency = (amount) => `₹${(Number(amount) || 0).toFixed(2)}`;

const calculateSeatedTime = (seatedAt) => {
  if (!seatedAt) return null;
  try {
    const diff = Date.now() - new Date(seatedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '<1 min';
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  } catch { return null; }
};

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
const TableDetails = () => {
  const { tableUuid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const tableDetails = useSelector(selectTableDetails);
  const detailsLoading = useSelector(selectTableDetailsLoading);
  const actionLoading = useSelector(selectTableActionLoading);
  const tableError = useSelector(selectTableError);
  const activeRestaurantId = useSelector(selectActiveRestaurant);
  const userRole = useSelector(selectRole);
  const orderError = useSelector((s) => s.orders.error);
  const orderSuccess = useSelector((s) => s.orders.success);
  const orderActionLoading = useSelector((s) => s.orders.actionLoading);
  const couponState = useSelector((s) => s.coupon);

  // Modals
  const [showOccupyModal, setShowOccupyModal] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelItemModal, setShowCancelItemModal] = useState(false);
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [showAssignWaiterModal, setShowAssignWaiterModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerExpanded, setCustomerExpanded] = useState(false);
  const [waiterList, setWaiterList] = useState([]);
  const [waiterListLoading, setWaiterListLoading] = useState(false);
  const [customerForm, setCustomerForm] = useState({ customerName: '', customerPhone: '', customerEmail: '' });
  const [customerSaving, setCustomerSaving] = useState(false);

  // Forms
  const [occupyForm, setOccupyForm] = useState({
    orderType: 'DINE_IN', numberOfGuests: 1, customerName: '', customerPhone: '', customerEmail: '', waiterUuid: '',
  });
  const [paymentForm, setPaymentForm] = useState({ method: 'CASH', amount: '', transactionId: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelItemTarget, setCancelItemTarget] = useState(null);

  // Add items state


  // Time updater for seated time
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(c => c + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const hasManagerAccess = ['MANAGER', 'OWNER', 'ADMIN'].includes(userRole);
  const hasBillingAccess = ['CASHIER', 'MANAGER', 'OWNER', 'ADMIN'].includes(userRole);

  const table = tableDetails?.table;
  const activeOrder = tableDetails?.activeOrder;
  const isOccupied = table?.status === 'OCCUPIED';
  const isBilled = table?.status === 'BILLED';
  const isVacant = table?.status === 'VACANT';

  // ── Fetch Details ──────────────────────────────────────
  const refreshDetails = useCallback(() => {
    if (tableUuid) dispatch(fetchTableDetails(tableUuid));
  }, [dispatch, tableUuid]);

  useEffect(() => {
    refreshDetails();
    return () => { dispatch(clearTableDetails()); };
  }, [refreshDetails, dispatch]);

  // ─── WebSocket: live updates for this table & order ───
  useWebSocket(
    activeRestaurantId ? `/topic/tables/${activeRestaurantId}` : null,
    (data) => {
      dispatch(handleTableWsEvent(data));
      // If this table was updated, refresh details
      if (data.tableUuid === tableUuid) refreshDetails();
      // If this table is involved in a transfer, refresh details
      if (data.type === 'TABLE_TRANSFER' &&
          (data.fromTableUuid === tableUuid || data.toTableUuid === tableUuid)) {
        refreshDetails();
      }
    }
  );
  useWebSocket(
    activeRestaurantId ? `/topic/orders/${activeRestaurantId}` : null,
    (data) => {
      dispatch(handleOrderWsEvent(data));
      // If the active order on this table was updated, refresh
      if (activeOrder?.orderUuid && data.orderUuid === activeOrder.orderUuid) refreshDetails();
    }
  );

  // ── Fetch products/categories for Add Items ────────────


  // ── Toast auto-clear ───────────────────────────────────
  useEffect(() => {
    if (orderError) { const t = setTimeout(() => dispatch(clearOrderError()), 4000); return () => clearTimeout(t); }
  }, [orderError, dispatch]);
  useEffect(() => {
    if (orderSuccess) { const t = setTimeout(() => dispatch(clearOrderSuccess()), 4000); return () => clearTimeout(t); }
  }, [orderSuccess, dispatch]);
  useEffect(() => {
    if (tableError) { const t = setTimeout(() => dispatch(clearError()), 4000); return () => clearTimeout(t); }
  }, [tableError, dispatch]);

  // ── Actions ────────────────────────────────────────────
  // ── Waiter Actions ──────────────────────────────────
  const fetchWaiters = useCallback(async () => {
    if (!activeRestaurantId) return;
    setWaiterListLoading(true);
    try {
      const res = await employeeAPI.getAll({ role: 'WAITER', restaurantUuid: activeRestaurantId });
      setWaiterList(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch waiters:', err);
      setWaiterList([]);
    } finally {
      setWaiterListLoading(false);
    }
  }, [activeRestaurantId]);

  const handleOpenAssignWaiter = () => {
    fetchWaiters();
    setShowAssignWaiterModal(true);
  };

  const handleAssignWaiter = async (waiterUuid) => {
    try {
      await dispatch(assignWaiter({ tableUuid, waiterUuid })).unwrap();
      setShowAssignWaiterModal(false);
      refreshDetails();
    } catch (err) {
      console.error('Assign waiter failed:', err);
    }
  };

  const handleRemoveWaiter = async () => {
    if (!window.confirm('Remove the assigned waiter from this table?')) return;
    try {
      await dispatch(removeWaiter(tableUuid)).unwrap();
      refreshDetails();
    } catch (err) {
      console.error('Remove waiter failed:', err);
    }
  };

  const handleOccupy = async () => {
    try {
      const data = { ...occupyForm };
      // Remove empty optional fields to avoid backend validation errors
      if (!data.waiterUuid) delete data.waiterUuid;
      if (!data.customerName?.trim()) delete data.customerName;
      if (!data.customerPhone?.trim()) delete data.customerPhone;
      if (!data.customerEmail?.trim()) delete data.customerEmail;
      await dispatch(occupyTable({ tableUuid, data })).unwrap();
      setShowOccupyModal(false);
      setOccupyForm({ orderType: 'DINE_IN', numberOfGuests: 1, customerName: '', customerPhone: '', customerEmail: '', waiterUuid: '' });
      refreshDetails();
    } catch (err) { console.error('Occupy failed:', err); }
  };

  /* 
   * Handle demerge table
   */
  const handleDemergeTable = async () => {
    // Confirm demerge
    if (!window.confirm('Are you sure you want to demerge this table?')) {
      return;
    }

    try {
      const resultAction = await dispatch(demergeTable(tableUuid));
      if (demergeTable.fulfilled.match(resultAction)) {
        // alert('Table demerged successfully'); // Optional, navigation might be enough
        navigate('/app/tables');
      } else {
        alert(resultAction.payload || 'Failed to demerge table');
      }
    } catch (error) {
      console.error('Error demerging table:', error);
      alert('Error demerging table');
    }
  };

  const handleSendKot = async () => {
    if (!activeOrder) return;
    const orderItemUuids = (activeOrder.items || [])
      .filter((i) => i.kotStatus === 'PENDING' || !i.kotStatus)
      .map((i) => i.orderItemUuid);
    if (orderItemUuids.length === 0) return;
    console.log(orderItemUuids);
    console.log(activeOrder);
    
    try {
      await dispatch(sendKot({ orderUuid: activeOrder.orderUuid, orderItemUuids })).unwrap();
      refreshDetails();
    } catch (err) { console.error('Send KOT failed:', err); }
  };

  const handleGenerateBill = async () => {
    if (!activeOrder) return;
    try {
      await dispatch(generateBill(activeOrder.orderUuid)).unwrap();
      refreshDetails();
    } catch (err) { console.error('Generate bill failed:', err); }
  };

  const handleAddPayment = async () => {
    if (!activeOrder || !paymentForm.amount) return;
    try {
      await dispatch(addPayment({
        orderUuid: activeOrder.orderUuid,
        paymentData: {
          paymentMethod: paymentForm.method,
          amount: parseFloat(paymentForm.amount),
          transactionId: paymentForm.transactionId || undefined,
        },
      })).unwrap();
      setShowPaymentModal(false);
      setPaymentForm({ method: 'CASH', amount: '', transactionId: '' });
      refreshDetails();
    } catch (err) { console.error('Add payment failed:', err); }
  };

  const handleCompleteOrder = async () => {
    if (!activeOrder) return;
    try {
      await dispatch(completeOrder(activeOrder.orderUuid)).unwrap();
      navigate('/app/tables');
    } catch (err) { console.error('Complete order failed:', err); }
  };

  const handleCancelOrder = async () => {
    if (!activeOrder) return;
    try {
      await dispatch(cancelOrder({ orderUuid: activeOrder.orderUuid, cancellationReason: cancelReason })).unwrap();
      setShowCancelOrderModal(false);
      setCancelReason('');
      navigate('/app/tables');
    } catch (err) { console.error('Cancel order failed:', err); }
  };

  const handleCancelItem = async () => {
    if (!activeOrder || !cancelItemTarget) return;
    try {
      await dispatch(cancelOrderItem({
        orderUuid: activeOrder.orderUuid,
        itemUuid: cancelItemTarget.orderItemUuid,
        reason: cancelReason,
      })).unwrap();
      setShowCancelItemModal(false);
      setCancelItemTarget(null);
      setCancelReason('');
      refreshDetails();
    } catch (err) { console.error('Cancel item failed:', err); }
  };

  // ── Customer Details ───────────────────────────────────
  const handleOpenCustomerModal = () => {
    setCustomerForm({
      customerName: activeOrder?.customerName || '',
      customerPhone: activeOrder?.customerPhone || '',
      customerEmail: activeOrder?.customerEmail || '',
    });
    setShowCustomerModal(true);
  };

  const handleSaveCustomerDetails = async () => {
    if (!activeOrder) return;
    setCustomerSaving(true);
    try {
      await dispatch(updateOrder({
        orderUuid: activeOrder.orderUuid,
        orderData: {
          customerName: customerForm.customerName.trim() || null,
          customerPhone: customerForm.customerPhone.trim() || null,
          customerEmail: customerForm.customerEmail.trim() || null,
        },
      })).unwrap();
      setShowCustomerModal(false);
      refreshDetails();
    } catch (err) {
      console.error('Update customer details failed:', err);
    } finally {
      setCustomerSaving(false);
    }
  };



  // ── Derived data ───────────────────────────────────────
  const items = activeOrder?.items || [];
  const payments = activeOrder?.payments || [];
  const orderUuid = activeOrder?.orderUuid;
  const hasPendingItems = items.some((i) => i.kotStatus === 'PENDING' || !i.kotStatus);

  // Check if all non-cancelled items are SERVED
  const nonCancelledItems = items.filter((i) => i.kotStatus !== 'CANCELLED' && i.status !== 'CANCELLED');
  const allItemsServed = nonCancelledItems.length > 0 && nonCancelledItems.every((i) => i.kotStatus === 'SERVED');
  const hasUnservedItems = nonCancelledItems.some((i) => i.kotStatus !== 'SERVED');
  const couponRestaurantUuid = activeOrder?.restaurantUuid || table?.restaurantUuid || activeRestaurantId;
  const couponCartSignature = useMemo(() => {
    return JSON.stringify(
      nonCancelledItems.map((i) => ({
        id: i.orderItemUuid || i.itemUuid || i.productUuid || i.name,
        qty: i.quantity,
        price: i.unitPrice || i.price,
        mods: (i.modifiers || []).map((m) => `${m.modifierUuid || m.modifierId || m.name}:${m.quantity}:${m.priceAdd || m.unitPrice || 0}`).sort(),
      })).sort((a, b) => (a.id || '').localeCompare(b.id || ''))
    );
  }, [nonCancelledItems]);

  // ── Group identical items ──────────────────────────────
  // Items with same product, variation, modifiers, KOT status, and unit price are merged
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

  // Grouped non-cancelled items for bill summary breakdown
  const groupedNonCancelledItems = groupedItems.filter(
    (g) => g.kotStatus !== 'CANCELLED' && g.status !== 'CANCELLED'
  );

  // Calculate modifier total for all non-cancelled items
  const modifiersTotal = nonCancelledItems.reduce((sum, item) => {
    if (!item.modifiers || item.modifiers.length === 0) return sum;
    const itemModTotal = item.modifiers.reduce((ms, m) => ms + ((m.lineTotal || (m.priceAdd || m.unitPrice || 0) * (m.quantity || 1)) || 0), 0);
    return sum + itemModTotal;
  }, 0);

  // Base subtotal = items only (unitPrice * quantity), excluding modifiers, for display
  const baseSubtotal = nonCancelledItems.reduce((s, i) => s + ((Number(i.unitPrice) || 0) * (Number(i.quantity) || 0)), 0);

  // Full subtotal from backend (includes modifiers in item lineTotals) or fallback
  const subtotal = activeOrder?.subtotal ?? (baseSubtotal + modifiersTotal);
  const discount = activeOrder?.discountAmount ?? 0;
  const tax = activeOrder?.taxAmount ?? 0;
  const serviceCharge = activeOrder?.serviceCharge ?? 0;
  // Total = subtotal (which already includes modifiers) - discount + tax + serviceCharge
  const total = activeOrder?.totalAmount ?? (subtotal - discount + tax + serviceCharge);
  const paidAmount = activeOrder?.paidAmount ?? payments.reduce((s, p) => s + (p.amount || 0), 0);
  const balance = total - paidAmount;

  // ── Coupon Effects ────────────────────────────────────
  useEffect(() => {
    if (couponState.error || couponState.message || couponState.autoRemovedReason) {
      const t = setTimeout(() => dispatch(clearCouponFeedback()), 3500);
      return () => clearTimeout(t);
    }
  }, [couponState.error, couponState.message, couponState.autoRemovedReason, dispatch]);

  useEffect(() => {
    if (!activeOrder) return;
    dispatch(hydrateFromOrder({
      couponCode: activeOrder.couponCode,
      discountAmount: activeOrder.discountAmount,
      orderUuid: activeOrder.orderUuid,
      cartSignature: couponCartSignature,
      orderAmount: subtotal,
    }));
  }, [activeOrder, couponCartSignature, subtotal, dispatch]);

  useEffect(() => {
    if (!orderUuid || !couponRestaurantUuid || subtotal <= 0) return;
    dispatch(fetchCouponSuggestions({
      restaurantUuid: couponRestaurantUuid,
      orderAmount: subtotal,
      orderUuid,
      customerUuid: activeOrder?.customerUuid,
    }));
  }, [dispatch, orderUuid, couponRestaurantUuid, subtotal, activeOrder?.customerUuid]);

  useEffect(() => {
    if (!couponState.isApplied || !couponState.code) return;
    if (!orderUuid || !couponRestaurantUuid) return;
    const signatureChanged = couponState.lastCartSignature !== couponCartSignature || couponState.lastOrderAmount !== subtotal;
    if (!signatureChanged) return;
    dispatch(revalidateCoupon({
      couponCode: couponState.code,
      restaurantUuid: couponRestaurantUuid,
      orderAmount: subtotal,
      orderUuid,
      customerUuid: activeOrder?.customerUuid,
      cartSignature: couponCartSignature,
    }));
  }, [couponState.isApplied, couponState.code, couponState.lastCartSignature, couponState.lastOrderAmount, couponCartSignature, subtotal, orderUuid, couponRestaurantUuid, activeOrder?.customerUuid, dispatch]);

  // ── Coupon Actions ────────────────────────────────────
  const applyCouponCode = (code) => {
    if (!orderUuid || !code) return;
    dispatch(applyCouponToOrder({
      orderUuid,
      couponCode: code,
      customerUuid: activeOrder?.customerUuid,
      cartSignature: couponCartSignature,
      orderAmount: subtotal,
    }));
  };

  const handleCouponApply = () => applyCouponCode(couponState.code);

  const handleCouponRemove = () => {
    if (!orderUuid) return;
    dispatch(removeCouponFromOrder({
      orderUuid,
      cartSignature: couponCartSignature,
      orderAmount: subtotal,
    }));
  };

  const handleApplyFromList = (code) => {
    if (!code) return;
    dispatch(setCouponCode(code));
    applyCouponCode(code);
  };

  const handleApplyBest = () => {
    if (couponState.bestCoupon?.couponCode) {
      handleApplyFromList(couponState.bestCoupon.couponCode);
    }
  };



  // ── Loading / Error ────────────────────────────────────
  if (detailsLoading) {
    return (
      <DarkScreen className="p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-txt-faintDark" />
            <p className="text-txt-mutedDark font-medium">Loading table details…</p>
          </div>
        </div>
      </DarkScreen>
    );
  }

  if (!tableDetails || !table) {
    return (
      <DarkScreen className="p-4 sm:p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle className="h-16 w-16 text-txt-faintDark" />
          <p className="text-lg text-txt-mutedDark font-medium">Table not found</p>
          <BtnGhost onClick={() => navigate('/app/tables')}>
            <ArrowLeft className="h-4 w-4" /> Back to Floor Plan
          </BtnGhost>
        </div>
      </DarkScreen>
    );
  }

  const sc = STATUS_PILL[table.status] || STATUS_PILL.VACANT;

  // ── Render ─────────────────────────────────────────────
  const isError = !!(orderError || tableError || couponState.error || couponState.autoRemovedReason);

  return (
    <DarkScreen className="p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Toast */}
      {(orderError || orderSuccess || tableError || couponState.error || couponState.message || couponState.autoRemovedReason) && (
        <div className={cn(
          'fixed top-4 right-4 left-4 sm:left-auto z-50 p-3 sm:p-4 rounded-card shadow-float flex items-center gap-2 animate-slide-in sm:max-w-sm border',
          isError
            ? 'bg-danger/[0.14] text-danger-deep border-danger/30'
            : 'bg-success/[0.12] text-success-deep border-success/30',
        )}>
          {isError
            ? <AlertCircle className="h-5 w-5 flex-shrink-0" />
            : <CheckCircle className="h-5 w-5 flex-shrink-0" />}
          <span className="text-xs sm:text-sm font-medium line-clamp-2">
            {orderError || tableError || couponState.error || couponState.autoRemovedReason || orderSuccess || couponState.message}
          </span>
        </div>
      )}

      {/* ───── HEADER ───── */}
      <div className="flex flex-col gap-3 sm:gap-4 bg-ink-card rounded-card border border-ink-line p-3 sm:p-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/app/tables')}
            className="p-1.5 sm:p-2 rounded-input text-txt-mutedDark hover:text-white hover:bg-white/5 transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-[10px] text-txt-faintDark mb-0.5">Floor · Table Details</p>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="font-display text-lg sm:text-2xl font-bold text-white tracking-[-0.01em]">Table {table.tableNumber}</h1>
              <Pill tone={sc.tone}>
                <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} />
                {table.status}
              </Pill>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 mt-1 text-xs sm:text-sm text-txt-mutedDark">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {table.capacity} seats</span>
              {table.sectionName && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{table.sectionName}</span>}
            </div>
          </div>
        </div>

        {/* Session card — stat chips */}
        {activeOrder && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pl-0 sm:pl-12">
            <div className="rounded-tile bg-ink-card2 border border-ink-line p-3">
              <p className="eyebrow text-[9px] text-txt-faintDark mb-1 flex items-center gap-1"><Hash className="h-3 w-3" /> Order</p>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm text-white truncate">{activeOrder.orderNumber || activeOrder.orderUuid?.slice(0, 8)}</span>
                <Badge variant={activeOrder.status === 'OPEN' ? 'success' : activeOrder.status === 'BILLED' ? 'primary' : 'default'}>
                  {activeOrder.status}
                </Badge>
              </div>
            </div>
            {activeOrder.numberOfGuests > 0 && (
              <div className="rounded-tile bg-ink-card2 border border-ink-line p-3">
                <p className="eyebrow text-[9px] text-txt-faintDark mb-1 flex items-center gap-1"><Users className="h-3 w-3" /> Guests</p>
                <span className="font-display text-lg font-bold text-white leading-none">{activeOrder.numberOfGuests}</span>
              </div>
            )}
            {table.seatedAt && (
              <div className="rounded-tile bg-ink-card2 border border-ink-line p-3">
                <p className="eyebrow text-[9px] text-txt-faintDark mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Seated</p>
                <span className="font-mono text-sm text-txt-light">{calculateSeatedTime(table.seatedAt)}</span>
              </div>
            )}
            <div className="rounded-tile bg-marigold/[0.12] border border-marigold/25 p-3">
              <p className="eyebrow text-[9px] text-marigold/80 mb-1 flex items-center gap-1"><Receipt className="h-3 w-3" /> Running Total</p>
              <span className="font-mono text-lg font-bold text-marigold leading-none">{formatCurrency(total)}</span>
            </div>
          </div>
        )}

        {/* Waiter info (if assigned) */}
        {(isOccupied || isBilled) && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pl-0 sm:pl-12">
            {table.currentWaiterName ? (
              <div className="flex items-center gap-2 bg-ink-card2 border border-ink-line rounded-input px-3 py-1.5">
                <UserCheck className="h-4 w-4 text-marigold" />
                <span className="text-sm font-medium text-txt-light">{table.currentWaiterName}</span>
                {hasManagerAccess && (
                  <>
                    <button
                      onClick={handleOpenAssignWaiter}
                      className="ml-1 p-1 text-txt-mutedDark hover:text-white hover:bg-white/5 rounded transition-colors"
                      title="Change waiter"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleRemoveWaiter}
                      className="p-1 text-danger hover:bg-danger/10 rounded transition-colors"
                      title="Remove waiter"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ) : hasManagerAccess ? (
              <button
                onClick={handleOpenAssignWaiter}
                className="flex items-center gap-1.5 bg-marigold/[0.12] border border-marigold/25 rounded-input px-3 py-1.5 text-sm font-medium text-marigold hover:bg-marigold/20 transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                Assign Waiter
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* ───── VACANT STATE ───── */}
      {isVacant && (
        <div className="bg-ink-card border border-ink-line rounded-card text-center py-16 px-4">
          <UtensilsCrossed className="h-16 w-16 text-txt-faintDark mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-white mb-2">Table is Vacant</h2>
          <p className="text-txt-mutedDark mb-6">No active order. Occupy this table to create a new order.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <BtnPrimary onClick={() => setShowOccupyModal(true)}>
              <Plus className="h-4 w-4" /> Occupy Table
            </BtnPrimary>
            <BtnGhost onClick={() => navigate(`/app/tables/${tableUuid}/history`)}>
              <Receipt className="h-4 w-4" /> View Order History
            </BtnGhost>
          </div>

          {/* Demerge Button: Show if table is merged and vacant */}
          {(table?.isMerged === true || !!table?.mergedWithTableIds) && (
            <div className="mt-4">
              <BtnGhost onClick={handleDemergeTable}>
                <ArrowResult className="h-4 w-4" />
                Demerge Tables
              </BtnGhost>
            </div>
          )}
        </div>
      )}

      {/* ───── OCCUPIED / BILLED STATE ───── */}
      {(isOccupied || isBilled) && activeOrder && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* LEFT: Items + Customer */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">

            {/* Customer Info - Collapsible */}
            <div className="bg-ink-card border border-ink-line rounded-card overflow-hidden">
              <div
                className="p-3 sm:p-4 flex items-center justify-between cursor-pointer select-none hover:bg-white/5 transition-colors"
                onClick={() => setCustomerExpanded((v) => !v)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <UserCircle className="h-5 w-5 text-txt-mutedDark shrink-0" />
                  <h3 className="font-semibold text-txt-light text-sm sm:text-base">Customer</h3>
                  {/* Inline summary when collapsed */}
                  {!customerExpanded && (activeOrder.customerName || activeOrder.customerPhone) && (
                    <span className="hidden sm:inline-flex items-center gap-2 ml-2 text-xs text-txt-mutedDark truncate">
                      <span className="font-medium text-txt-light truncate">{activeOrder.customerName || '—'}</span>
                      {activeOrder.customerPhone && (
                        <><span className="text-txt-faintDark">|</span><span className="truncate">{activeOrder.customerPhone}</span></>
                      )}
                    </span>
                  )}
                  {!customerExpanded && !activeOrder.customerName && !activeOrder.customerPhone && !activeOrder.customerEmail && (
                    <span className="ml-2 text-xs text-txt-faintDark">No details</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenCustomerModal(); }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-marigold bg-marigold/[0.12] hover:bg-marigold/20 border border-marigold/25 rounded-input transition-colors"
                  >
                    <Edit3 className="h-3 w-3" />
                    {(activeOrder.customerName || activeOrder.customerPhone || activeOrder.customerEmail) ? 'Edit' : 'Add'}
                  </button>
                  {customerExpanded
                    ? <ChevronUp className="h-4 w-4 text-txt-faintDark" />
                    : <ChevronDown className="h-4 w-4 text-txt-faintDark" />}
                </div>
              </div>
              {/* Expanded content */}
              <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
                customerExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="border-t border-ink-line">
                  {(activeOrder.customerName || activeOrder.customerPhone || activeOrder.customerEmail) ? (
                    <div className="px-4 py-3 flex flex-wrap gap-5 text-sm">
                      {activeOrder.customerName && (
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-txt-faintDark" />
                          <span className="font-medium text-txt-light">{activeOrder.customerName}</span>
                        </div>
                      )}
                      {activeOrder.customerPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-txt-faintDark" />
                          <span className="text-txt-mutedDark">{activeOrder.customerPhone}</span>
                        </div>
                      )}
                      {activeOrder.customerEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-txt-faintDark" />
                          <span className="text-txt-mutedDark">{activeOrder.customerEmail}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-center">
                      <p className="text-sm text-txt-faintDark">No customer details added</p>
                      <button
                        onClick={handleOpenCustomerModal}
                        className="mt-1 text-sm font-medium text-marigold hover:brightness-110 hover:underline"
                      >
                        + Add customer details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="bg-ink-card border border-ink-line rounded-card overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-ink-line flex items-center justify-between">
                <h3 className="font-semibold text-txt-light text-sm sm:text-base">Order Items ({items.length})</h3>
                {hasPendingItems && (
                  <Badge variant="warning" className="text-[10px] sm:text-xs">{items.filter(i => i.kotStatus === 'PENDING' || !i.kotStatus).length} pending</Badge>
                )}
              </div>
              {items.length === 0 ? (
                <div className="p-8 text-center text-txt-faintDark">
                  <UtensilsCrossed className="h-10 w-10 mx-auto mb-2" />
                  <p className="font-medium">No items yet</p>
                  <p className="text-xs mt-1">Add items to this order</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink-line text-left text-txt-faintDark">
                        <th className="px-4 py-3 font-medium eyebrow text-[10px]">Item</th>
                        <th className="px-4 py-3 font-medium eyebrow text-[10px] text-center">Qty</th>
                        <th className="px-4 py-3 font-medium eyebrow text-[10px] text-right">Price</th>
                        <th className="px-4 py-3 font-medium eyebrow text-[10px] text-right">Total</th>
                        <th className="px-4 py-3 font-medium eyebrow text-[10px] text-center">KOT</th>
                        <th className="px-4 py-3 font-medium text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedItems.map((group, idx) => {
                        const isCancelled = group.kotStatus === 'CANCELLED' || group.status === 'CANCELLED';
                        const groupTotal = group.originalItems.reduce((sum, oi) => {
                          const oiBase = (oi.unitPrice || oi.price || 0) * (oi.quantity || 1);
                          const oiMod = (oi.modifiers || []).reduce((ms, m) => ms + ((m.lineTotal || (m.priceAdd || m.unitPrice || 0) * (m.quantity || 1)) || 0), 0);
                          return sum + (oi.lineTotal || (oiBase + oiMod));
                        }, 0);
                        return (
                          <tr key={group.itemUuid || group.orderItemUuid || idx} className={`border-b border-ink-line/60 ${isCancelled ? 'opacity-50 line-through' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-txt-light">{group.productName || group.name}</div>
                              {group.variationName && <div className="text-xs text-txt-faintDark">{group.variationName}</div>}
                              {group.modifiers?.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {group.modifiers.map((mod, mIdx) => {
                                    const modPrice = mod.lineTotal || (mod.priceAdd || mod.unitPrice || 0) * (mod.quantity || 1);
                                    return (
                                      <div key={mod.orderItemModifierUuid || mIdx} className="flex items-center gap-1 text-xs text-txt-mutedDark">
                                        <span className="text-marigold">+</span>
                                        <span>{mod.modifierName || mod.name}</span>
                                        {mod.quantity > 1 && <span className="text-txt-faintDark">x{mod.quantity}</span>}
                                        {modPrice > 0 && <span className="ml-auto text-marigold font-mono font-medium">₹{modPrice.toFixed(2)}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {group.originalItems.length > 1 && (
                                <div className="text-xs text-txt-faintDark mt-1">({group.originalItems.length} identical items)</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-display font-bold text-white">{group.groupedQty}</td>
                            <td className="px-4 py-3 text-right font-mono text-txt-mutedDark">{formatCurrency(group.unitPrice || group.price)}</td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-txt-light">
                              {formatCurrency(groupTotal)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant={KOT_STATUS_COLORS[group.kotStatus] || 'default'}>
                                {group.kotStatus || 'PENDING'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {!isCancelled && (group.kotStatus === 'PENDING' || !group.kotStatus) && (
                                <button
                                  onClick={() => { setCancelItemTarget(group.originalItems[0]); setCancelReason(''); setShowCancelItemModal(true); }}
                                  className="p-1 hover:bg-danger/10 rounded-md transition-colors"
                                  title="Cancel item"
                                >
                                  <Ban className="h-4 w-4 text-danger" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Bill + Payments + Actions */}
          <div className="space-y-4 sm:space-y-6">

            {/* Bill Summary */}
            <div className="bg-ink-card border border-ink-line rounded-card overflow-hidden">
              <div className="p-4 border-b border-ink-line">
                <h3 className="font-semibold text-txt-light flex items-center gap-2"><Receipt className="h-5 w-5 text-marigold" /> Bill Summary</h3>
              </div>
              <div className="p-4 text-sm">
                {/* Itemized breakdown */}
                {groupedNonCancelledItems.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between eyebrow text-[10px] text-txt-faintDark mb-2">
                      <span>Item</span>
                      <span>Amount</span>
                    </div>
                    <div className="space-y-0">
                      {groupedNonCancelledItems.map((group, idx) => {
                        const perItemTotal = (() => {
                          const basePrice = (group.unitPrice || group.price || 0) * (group.quantity || 1);
                          const itemModTotal = (group.modifiers || []).reduce((ms, m) => ms + ((m.lineTotal || (m.priceAdd || m.unitPrice || 0) * (m.quantity || 1)) || 0), 0);
                          return basePrice + itemModTotal;
                        })();
                        const groupTotal = perItemTotal * group.originalItems.length;
                        const productName = group.productName || group.name;
                        const hasModifiers = (group.modifiers || []).length > 0;
                        return (
                          <div key={idx} className="flex items-start justify-between py-1.5 group hover:bg-white/5 -mx-1 px-1 rounded transition-colors">
                            <div className="min-w-0 flex-1 mr-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-txt-light">{productName}</span>
                                {group.variationName && (
                                  <span className="text-[11px] text-txt-mutedDark bg-ink-card2 px-1.5 py-0.5 rounded font-medium">{group.variationName}</span>
                                )}
                                {group.groupedQty > 1 && (
                                  <span className="text-[11px] font-bold text-ink bg-marigold px-1.5 py-0.5 rounded-full leading-none font-mono">&times;{group.groupedQty}</span>
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
                                <div className="text-[11px] text-txt-faintDark mt-0.5 font-mono">
                                  {formatCurrency(perItemTotal)} each
                                </div>
                              )}
                            </div>
                            <span className="whitespace-nowrap font-mono font-semibold text-txt-light tabular-nums pt-0.5">{formatCurrency(groupTotal)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-b border-dashed border-ink-line mt-2 mb-3" />
                  </div>
                )}

                {/* Coupons */}
                <div className="mt-3 mb-4 p-3 rounded-tile border border-dashed border-ink-line bg-ink-card2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-txt-light">
                      <Tag className="h-4 w-4 text-marigold" />
                      <span>Coupons & Offers</span>
                    </div>
                    {couponState.autoRemovedReason && (
                      <span className="text-xs text-danger font-medium">{couponState.autoRemovedReason}</span>
                    )}
                  </div>

                  <CouponSummary
                    code={couponState.code}
                    discountAmount={discount}
                    onRemove={handleCouponRemove}
                  />

                  <CouponInput
                    code={couponState.code}
                    onCodeChange={(value) => dispatch(setCouponCode(value))}
                    onApply={handleCouponApply}
                    onRemove={handleCouponRemove}
                    onApplyBest={handleApplyBest}
                    loading={couponState.loading}
                    removing={couponState.removing}
                    isApplied={couponState.isApplied}
                    error={couponState.error}
                    message={couponState.message}
                    warning={couponState.warning}
                    bestCoupon={couponState.bestCoupon}
                    disabled={!orderUuid}
                    revalidating={couponState.revalidating}
                  />

                  <div className="flex items-center justify-between eyebrow text-[10px] text-txt-faintDark">
                    <span>Available Offers</span>
                    <span className="text-txt-faintDark">Auto picks best savings</span>
                  </div>
                  <CouponList coupons={couponState.suggestions} onApply={handleApplyFromList} />
                </div>

                {/* Totals */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-txt-mutedDark">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums text-txt-light">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-success-bright">
                      <span>Discount</span>
                      <span className="font-mono tabular-nums">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between text-txt-mutedDark">
                      <span>Tax</span>
                      <span className="font-mono tabular-nums text-txt-light">{formatCurrency(tax)}</span>
                    </div>
                  )}
                  {serviceCharge > 0 && (
                    <div className="flex justify-between text-txt-mutedDark">
                      <span>Service Charge</span>
                      <span className="font-mono tabular-nums text-txt-light">{formatCurrency(serviceCharge)}</span>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="border-t border-ink-line mt-3 pt-3 flex justify-between items-center">
                  <span className="font-display font-bold text-lg text-white">Total</span>
                  <span className="font-mono font-bold text-lg text-marigold tabular-nums">{formatCurrency(total)}</span>
                </div>

                {/* Payment Status */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-txt-mutedDark">Paid</span>
                    <span className={`font-mono font-semibold tabular-nums ${paidAmount > 0 ? 'text-success-bright' : 'text-txt-faintDark'}`}>{formatCurrency(paidAmount)}</span>
                  </div>
                  {balance > 0 && (
                    <div className="flex justify-between items-center bg-danger/[0.14] -mx-4 px-4 py-2">
                      <span className="font-semibold text-danger-deep">Balance Due</span>
                      <span className="font-mono font-bold text-danger-deep tabular-nums">{formatCurrency(balance)}</span>
                    </div>
                  )}
                  {balance <= 0 && paidAmount > 0 && (
                    <div className="flex justify-between items-center bg-success/[0.12] -mx-4 px-4 py-2">
                      <span className="font-semibold text-success-deep flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" /> Fully Paid
                      </span>
                      <span className="font-mono font-bold text-success-deep tabular-nums">{formatCurrency(paidAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payments */}
            <div className="bg-ink-card border border-ink-line rounded-card overflow-hidden">
              <div className="p-4 border-b border-ink-line">
                <h3 className="font-semibold text-txt-light flex items-center gap-2"><CreditCard className="h-5 w-5 text-marigold" /> Payments</h3>
              </div>
              <div className="p-4">
                {payments.length === 0 ? (
                  <p className="text-sm text-txt-faintDark text-center py-4">No payments yet</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map((p, idx) => (
                      <div key={p.paymentUuid || idx} className="flex items-center justify-between p-3 bg-ink-card2 border border-ink-line rounded-tile">
                        <div>
                          <div className="font-medium text-txt-light text-sm">{p.paymentMethod || p.method}</div>
                          {p.transactionId && <div className="text-xs text-txt-faintDark font-mono">{p.transactionId}</div>}
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-semibold text-txt-light">{formatCurrency(p.amount)}</div>
                          {p.status && <Badge variant={p.status === 'COMPLETED' ? 'success' : 'default'} className="text-xs">{p.status}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Grid */}
            <div className="bg-ink-card border border-ink-line rounded-card p-4">
              <p className="eyebrow text-[10px] text-txt-faintDark mb-3">Actions</p>
              <div className="grid grid-cols-2 gap-2.5">
                <BtnPrimary
                  className="w-full"
                  onClick={() => navigate(`/app/tables/${tableUuid}/add-items`)}
                  disabled={orderActionLoading || isBilled}
                >
                  <Plus className="h-4 w-4" /> Add Items
                </BtnPrimary>

                {hasPendingItems && (
                  <BtnGhost
                    className="w-full bg-ink-card2 border-ink-line text-marigold hover:bg-white/5"
                    onClick={handleSendKot}
                    disabled={orderActionLoading}
                  >
                    {orderActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChefHat className="h-4 w-4" />}
                    Send KOT
                  </BtnGhost>
                )}

                {hasBillingAccess && isOccupied && items.length > 0 && (
                  <BtnGhost
                    className="w-full bg-ink-card2 border-ink-line text-txt-light hover:bg-white/5"
                    onClick={handleGenerateBill}
                    disabled={orderActionLoading}
                  >
                    {orderActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                    Generate Bill
                  </BtnGhost>
                )}

                {hasBillingAccess && (
                  <BtnGhost
                    className="w-full bg-ink-card2 border-ink-line text-success-bright hover:bg-white/5"
                    onClick={() => {
                      setPaymentForm({ method: 'CASH', amount: balance > 0 ? balance.toFixed(2) : '', transactionId: '' });
                      setShowPaymentModal(true);
                    }}
                    disabled={orderActionLoading}
                  >
                    <CreditCard className="h-4 w-4" /> Add Payment
                  </BtnGhost>
                )}
              </div>

              {/* KOT Status Warning */}
              {hasUnservedItems && items.length > 0 && (
                <div className="mt-3 bg-marigold/[0.12] border border-marigold/25 rounded-tile p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-marigold">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Waiting for all items to be served</span>
                  </div>
                  <p className="text-xs text-txt-mutedDark mt-1 font-mono">
                    {nonCancelledItems.filter(i => i.kotStatus === 'SERVED').length}/{nonCancelledItems.length} items served
                  </p>
                </div>
              )}

              {/* Complete Order - only when ALL items served AND payment complete */}
              {allItemsServed && paidAmount >= total && total > 0 && (
                <button
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-input bg-success text-white font-semibold text-sm hover:brightness-105 transition disabled:opacity-50"
                  onClick={handleCompleteOrder}
                  disabled={orderActionLoading}
                >
                  {orderActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Complete Order
                </button>
              )}

              {/* Show info when items served but payment pending */}
              {allItemsServed && (paidAmount < total || total <= 0) && items.length > 0 && (
                <div className="mt-3 bg-ink-card2 border border-ink-line rounded-tile p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-txt-light">
                    <CreditCard className="h-4 w-4 text-marigold" />
                    <span className="text-sm font-medium">All items served — complete payment to finish</span>
                  </div>
                </div>
              )}

              {hasManagerAccess && (
                <button
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-input bg-danger/[0.14] border border-danger/30 text-danger-deep font-semibold text-sm hover:bg-danger/20 transition disabled:opacity-50"
                  onClick={() => { setCancelReason(''); setShowCancelOrderModal(true); }}
                  disabled={orderActionLoading}
                >
                  <XCircle className="h-4 w-4" /> Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODALS                                              */}
      {/* ═══════════════════════════════════════════════════ */}

      {/* ── Occupy Table Modal ──────────────────────────── */}
      <Modal isOpen={showOccupyModal} onClose={() => setShowOccupyModal(false)} title="Occupy Table">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Order Type</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={occupyForm.orderType}
              onChange={(e) => setOccupyForm({ ...occupyForm, orderType: e.target.value })}
            >
              <option value="DINE_IN">Dine In</option>
              <option value="TAKEAWAY">Takeaway</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Number of Guests</label>
            <Input
              type="number" min="1" value={occupyForm.numberOfGuests}
              onChange={(e) => setOccupyForm({ ...occupyForm, numberOfGuests: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name (optional)</label>
            <Input
              value={occupyForm.customerName}
              onChange={(e) => setOccupyForm({ ...occupyForm, customerName: e.target.value })}
              placeholder="Guest"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone (optional)</label>
            <Input
              value={occupyForm.customerPhone}
              onChange={(e) => setOccupyForm({ ...occupyForm, customerPhone: e.target.value })}
              placeholder="+91..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email (optional)</label>
            <Input
              type="email"
              value={occupyForm.customerEmail}
              onChange={(e) => setOccupyForm({ ...occupyForm, customerEmail: e.target.value })}
              placeholder="customer@example.com"
            />
          </div>
          {hasManagerAccess && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assign Waiter (optional)</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={occupyForm.waiterUuid}
                onChange={(e) => setOccupyForm({ ...occupyForm, waiterUuid: e.target.value })}
                onFocus={() => { if (waiterList.length === 0) fetchWaiters(); }}
              >
                <option value="">— No waiter —</option>
                {waiterListLoading && <option disabled>Loading...</option>}
                {waiterList.map(w => (
                  <option key={w.userUuid || w.id} value={w.userUuid || w.id}>
                    {w.fullName || w.username}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowOccupyModal(false)}>Cancel</Button>
            <Button onClick={handleOccupy} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {actionLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Occupying…</> : <><CheckCircle className="h-4 w-4 mr-2" />Occupy Table</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Items Modal ─────────────────────────────── */}


      {/* ── Payment Modal ───────────────────────────────── */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Add Payment">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
            >
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
            <Input
              type="number" min="0" step="0.01"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>
          {paymentForm.method !== 'CASH' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Transaction ID (optional)</label>
              <Input
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                placeholder="TXN-XXXXXX"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button onClick={handleAddPayment} disabled={!paymentForm.amount || orderActionLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {orderActionLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing…</> : <><CreditCard className="h-4 w-4 mr-2" />Record Payment</>}
            </Button>
          </div>
        </div>
      </Modal>



      {/* ── Cancel Item Modal ───────────────────────────── */}
      <Modal isOpen={showCancelItemModal} onClose={() => { setShowCancelItemModal(false); setCancelItemTarget(null); }} title="Cancel Item">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Cancel <span className="font-semibold">{cancelItemTarget?.productName || cancelItemTarget?.name}</span>?
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason…"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowCancelItemModal(false); setCancelItemTarget(null); }}>Keep Item</Button>
            <Button variant="danger" onClick={handleCancelItem} disabled={!cancelReason.trim() || orderActionLoading}>
              {orderActionLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cancelling…</> : <><Ban className="h-4 w-4 mr-2" />Cancel Item</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Cancel Order Modal ──────────────────────────── */}
      <Modal isOpen={showCancelOrderModal} onClose={() => setShowCancelOrderModal(false)} title="Cancel Order">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800 font-medium">This will cancel the entire order and free the table.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason…"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCancelOrderModal(false)}>Keep Order</Button>
            <Button variant="danger" onClick={handleCancelOrder} disabled={!cancelReason.trim() || orderActionLoading}>
              {orderActionLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cancelling…</> : <><XCircle className="h-4 w-4 mr-2" />Cancel Order</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Customer Details Modal ──────────────────────── */}
      <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Customer Details">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Add or update customer information for this order.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
            <Input
              value={customerForm.customerName}
              onChange={(e) => setCustomerForm({ ...customerForm, customerName: e.target.value })}
              placeholder="Enter customer name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <Input
              value={customerForm.customerPhone}
              onChange={(e) => setCustomerForm({ ...customerForm, customerPhone: e.target.value })}
              placeholder="+91XXXXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <Input
              type="email"
              value={customerForm.customerEmail}
              onChange={(e) => setCustomerForm({ ...customerForm, customerEmail: e.target.value })}
              placeholder="customer@example.com"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCustomerModal(false)}>Cancel</Button>
            <Button
              onClick={handleSaveCustomerDetails}
              disabled={customerSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {customerSaving
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                : <><CheckCircle className="h-4 w-4 mr-2" />Save Details</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Assign Waiter Modal ─────────────────────────── */}
      <Modal isOpen={showAssignWaiterModal} onClose={() => setShowAssignWaiterModal(false)} title="Assign Waiter">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Select a waiter to assign to <span className="font-semibold">Table {table?.tableNumber}</span>.
          </p>
          {waiterListLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Loading waiters...</span>
            </div>
          ) : waiterList.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No waiters found</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {waiterList.map(waiter => {
                const isCurrentWaiter = (waiter.userUuid || waiter.id) === table?.currentWaiterUuid;
                return (
                  <button
                    key={waiter.userUuid || waiter.id}
                    onClick={() => !isCurrentWaiter && handleAssignWaiter(waiter.userUuid || waiter.id)}
                    disabled={actionLoading || isCurrentWaiter}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                      isCurrentWaiter
                        ? 'border-blue-300 bg-blue-50 cursor-default'
                        : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{waiter.fullName || waiter.username}</div>
                        <div className="text-xs text-slate-500">{waiter.role || 'WAITER'}</div>
                      </div>
                    </div>
                    {isCurrentWaiter && (
                      <Badge variant="info" size="sm">Current</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAssignWaiterModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
      </div>
    </DarkScreen>
  );
};

export default TableDetails;
