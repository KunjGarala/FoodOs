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
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { CouponInput } from '../../components/coupon/CouponInput';
import { CouponList } from '../../components/coupon/CouponList';
import { CouponSummary } from '../../components/coupon/CouponSummary';

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
  addItemsToOrder,
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
const STATUS_COLORS = {
  VACANT: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  OCCUPIED: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  RESERVED: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  BILLED: { bg: 'bg-violet-100', text: 'text-violet-800', dot: 'bg-violet-500' },
  DIRTY: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  MAINTENANCE: { bg: 'bg-slate-100', text: 'text-slate-800', dot: 'bg-slate-500' },
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
  const currentUserUuid = useSelector((s) => s.auth.userId);
  const products = useSelector((s) => s.products.products);
  const categories = useSelector((s) => s.categories.categories);
  const productsLoading = useSelector((s) => s.products.loading);
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
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
          <p className="text-slate-500 font-medium">Loading table details…</p>
        </div>
      </div>
    );
  }

  if (!tableDetails || !table) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-4">
        <AlertCircle className="h-16 w-16 text-slate-300" />
        <p className="text-lg text-slate-500 font-medium">Table not found</p>
        <Button variant="outline" onClick={() => navigate('/app/tables')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Floor Plan
        </Button>
      </div>
    );
  }

  const sc = STATUS_COLORS[table.status] || STATUS_COLORS.VACANT;

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Toast */}
      {(orderError || orderSuccess || tableError || couponState.error || couponState.message || couponState.autoRemovedReason) && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto z-50 p-3 sm:p-4 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in sm:max-w-sm ${
          (orderError || tableError || couponState.error || couponState.autoRemovedReason)
            ? 'bg-red-50 text-red-800 border border-red-200'
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {(orderError || tableError || couponState.error || couponState.autoRemovedReason)
            ? <AlertCircle className="h-5 w-5 flex-shrink-0" />
            : <CheckCircle className="h-5 w-5 flex-shrink-0" />}
          <span className="text-xs sm:text-sm font-medium line-clamp-2">
            {orderError || tableError || couponState.error || couponState.autoRemovedReason || orderSuccess || couponState.message}
          </span>
        </div>
      )}

      {/* ───── HEADER ───── */}
      <div className="flex flex-col gap-3 sm:gap-4 bg-white rounded-xl border border-slate-200 p-3 sm:p-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/app/tables')}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900">Table {table.tableNumber}</h1>
              <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold ${sc.bg} ${sc.text}`}>
                <span className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${sc.dot}`} />
                {table.status}
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 mt-1 text-xs sm:text-sm text-slate-500">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {table.capacity} seats</span>
              {table.sectionName && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{table.sectionName}</span>}
            </div>
          </div>
        </div>

        {/* Order info badge (if occupied/billed) */}
        {activeOrder && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 pl-0 sm:pl-12">
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Hash className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                <span className="font-semibold text-sm text-slate-800">{activeOrder.orderNumber || activeOrder.orderUuid?.slice(0, 8)}</span>
                <Badge variant={activeOrder.status === 'OPEN' ? 'success' : activeOrder.status === 'BILLED' ? 'primary' : 'default'}>
                  {activeOrder.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 mt-0.5">
                {activeOrder.numberOfGuests > 0 && (
                  <span className="flex items-center gap-1"><Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{activeOrder.numberOfGuests} guests</span>
                )}
                {table.seatedAt && (
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{calculateSeatedTime(table.seatedAt)}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Waiter info (if assigned) */}
        {(isOccupied || isBilled) && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pl-0 sm:pl-12">
            {table.currentWaiterName ? (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">{table.currentWaiterName}</span>
                {hasManagerAccess && (
                  <>
                    <button
                      onClick={handleOpenAssignWaiter}
                      className="ml-1 p-1 hover:bg-blue-100 rounded transition-colors"
                      title="Change waiter"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
                    </button>
                    <button
                      onClick={handleRemoveWaiter}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                      title="Remove waiter"
                    >
                      <X className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </>
                )}
              </div>
            ) : hasManagerAccess ? (
              <button
                onClick={handleOpenAssignWaiter}
                className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
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
        <Card className="text-center py-16">
          <CardContent>
            <UtensilsCrossed className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Table is Vacant</h2>
            <p className="text-slate-500 mb-6">No active order. Occupy this table to create a new order.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button onClick={() => setShowOccupyModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" /> Occupy Table
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/app/tables/${tableUuid}/history`)}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Receipt className="h-4 w-4 mr-2" /> View Order History
              </Button>
            </div>
            
            {/* Demerge Button: Show if table is merged and vacant */}
            {(table?.isMerged === true || !!table?.mergedWithTableIds) && (
              <div className="mt-4">
                 <Button 
                   variant="outline"
                   className="border-orange-200 text-orange-700 hover:bg-orange-50"
                   onClick={handleDemergeTable}
                 >
                   <ArrowResult className="h-4 w-4 mr-2" />
                   Demerge Tables
                 </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ───── OCCUPIED / BILLED STATE ───── */}
      {(isOccupied || isBilled) && activeOrder && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* LEFT: Items + Customer */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">

            {/* Customer Info - Collapsible */}
            <Card>
              <div
                className="p-3 sm:p-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50 transition-colors rounded-t-xl"
                onClick={() => setCustomerExpanded((v) => !v)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <UserCircle className="h-5 w-5 text-slate-600 shrink-0" />
                  <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Customer</h3>
                  {/* Inline summary when collapsed */}
                  {!customerExpanded && (activeOrder.customerName || activeOrder.customerPhone) && (
                    <span className="hidden sm:inline-flex items-center gap-2 ml-2 text-xs text-slate-500 truncate">
                      <span className="font-medium text-slate-600 truncate">{activeOrder.customerName || '—'}</span>
                      {activeOrder.customerPhone && (
                        <><span className="text-slate-300">|</span><span className="truncate">{activeOrder.customerPhone}</span></>
                      )}
                    </span>
                  )}
                  {!customerExpanded && !activeOrder.customerName && !activeOrder.customerPhone && !activeOrder.customerEmail && (
                    <span className="ml-2 text-xs text-slate-400">No details</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenCustomerModal(); }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-3 w-3" />
                    {(activeOrder.customerName || activeOrder.customerPhone || activeOrder.customerEmail) ? 'Edit' : 'Add'}
                  </button>
                  {customerExpanded
                    ? <ChevronUp className="h-4 w-4 text-slate-400" />
                    : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </div>
              {/* Expanded content */}
              <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
                customerExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="border-t border-slate-100">
                  {(activeOrder.customerName || activeOrder.customerPhone || activeOrder.customerEmail) ? (
                    <div className="px-4 py-3 flex flex-wrap gap-5 text-sm">
                      {activeOrder.customerName && (
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-700">{activeOrder.customerName}</span>
                        </div>
                      )}
                      {activeOrder.customerPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">{activeOrder.customerPhone}</span>
                        </div>
                      )}
                      {activeOrder.customerEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-600">{activeOrder.customerEmail}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-center">
                      <p className="text-sm text-slate-400">No customer details added</p>
                      <button
                        onClick={handleOpenCustomerModal}
                        className="mt-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        + Add customer details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Order Items Table */}
            <Card>
              <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Order Items ({items.length})</h3>
                {hasPendingItems && (
                  <Badge variant="warning" className="text-[10px] sm:text-xs">{items.filter(i => i.kotStatus === 'PENDING' || !i.kotStatus).length} pending</Badge>
                )}
              </div>
              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <UtensilsCrossed className="h-10 w-10 mx-auto mb-2" />
                  <p className="font-medium">No items yet</p>
                  <p className="text-xs mt-1">Add items to this order</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-slate-500">
                        <th className="px-4 py-3 font-medium">Item</th>
                        <th className="px-4 py-3 font-medium text-center">Qty</th>
                        <th className="px-4 py-3 font-medium text-right">Price</th>
                        <th className="px-4 py-3 font-medium text-right">Total</th>
                        <th className="px-4 py-3 font-medium text-center">KOT</th>
                        <th className="px-4 py-3 font-medium text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedItems.map((group, idx) => {
                        const isCancelled = group.kotStatus === 'CANCELLED' || group.status === 'CANCELLED';
                        const singleItemLineTotal = (() => {
                          const basePrice = (group.unitPrice || group.price || 0) * (group.quantity || 1);
                          const itemModTotal = (group.modifiers || []).reduce((ms, m) => ms + ((m.lineTotal || (m.priceAdd || m.unitPrice || 0) * (m.quantity || 1)) || 0), 0);
                          return basePrice + itemModTotal;
                        })();
                        const groupTotal = group.originalItems.reduce((sum, oi) => {
                          const oiBase = (oi.unitPrice || oi.price || 0) * (oi.quantity || 1);
                          const oiMod = (oi.modifiers || []).reduce((ms, m) => ms + ((m.lineTotal || (m.priceAdd || m.unitPrice || 0) * (m.quantity || 1)) || 0), 0);
                          return sum + (oi.lineTotal || (oiBase + oiMod));
                        }, 0);
                        return (
                          <tr key={group.itemUuid || group.orderItemUuid || idx} className={`border-b border-slate-50 ${isCancelled ? 'opacity-50 line-through' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-800">{group.productName || group.name}</div>
                              {group.variationName && <div className="text-xs text-slate-400">{group.variationName}</div>}
                              {group.modifiers?.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {group.modifiers.map((mod, mIdx) => {
                                    const modPrice = mod.lineTotal || (mod.priceAdd || mod.unitPrice || 0) * (mod.quantity || 1);
                                    return (
                                      <div key={mod.orderItemModifierUuid || mIdx} className="flex items-center gap-1 text-xs text-slate-500">
                                        <span className="text-blue-400">+</span>
                                        <span>{mod.modifierName || mod.name}</span>
                                        {mod.quantity > 1 && <span className="text-slate-400">x{mod.quantity}</span>}
                                        {modPrice > 0 && <span className="ml-auto text-blue-600 font-medium">₹{modPrice.toFixed(2)}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {group.originalItems.length > 1 && (
                                <div className="text-xs text-slate-400 mt-1">({group.originalItems.length} identical items)</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold">{group.groupedQty}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(group.unitPrice || group.price)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-800">
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
                                  className="p-1 hover:bg-red-50 rounded-md transition-colors"
                                  title="Cancel item"
                                >
                                  <Ban className="h-4 w-4 text-red-500" />
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
            </Card>
          </div>

          {/* RIGHT: Bill + Payments + Actions */}
          <div className="space-y-4 sm:space-y-6">

            {/* Bill Summary */}
            <Card>
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Receipt className="h-5 w-5" /> Bill Summary</h3>
              </div>
              <div className="p-4 text-sm">
                {/* Itemized breakdown */}
                {groupedNonCancelledItems.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
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

                {/* Coupons */}
                <div className="mt-3 mb-4 p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Tag className="h-4 w-4 text-slate-500" />
                      <span>Coupons & Offers</span>
                    </div>
                    {couponState.autoRemovedReason && (
                      <span className="text-xs text-red-600 font-medium">{couponState.autoRemovedReason}</span>
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

                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <span>Available Offers</span>
                    <span className="text-slate-400">Auto picks best savings</span>
                  </div>
                  <CouponList coupons={couponState.suggestions} onApply={handleApplyFromList} />
                </div>

                {/* Totals */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span className="tabular-nums">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Tax</span>
                      <span className="tabular-nums">{formatCurrency(tax)}</span>
                    </div>
                  )}
                  {serviceCharge > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Service Charge</span>
                      <span className="tabular-nums">{formatCurrency(serviceCharge)}</span>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="border-t-2 border-slate-800 mt-3 pt-3 flex justify-between items-center">
                  <span className="font-bold text-lg text-slate-900">Total</span>
                  <span className="font-bold text-lg text-slate-900 tabular-nums">{formatCurrency(total)}</span>
                </div>

                {/* Payment Status */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Paid</span>
                    <span className={`font-semibold tabular-nums ${paidAmount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{formatCurrency(paidAmount)}</span>
                  </div>
                  {balance > 0 && (
                    <div className="flex justify-between items-center bg-red-50 -mx-4 px-4 py-2 rounded-b-xl">
                      <span className="font-semibold text-red-700">Balance Due</span>
                      <span className="font-bold text-red-700 tabular-nums">{formatCurrency(balance)}</span>
                    </div>
                  )}
                  {balance <= 0 && paidAmount > 0 && (
                    <div className="flex justify-between items-center bg-emerald-50 -mx-4 px-4 py-2 rounded-b-xl">
                      <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" /> Fully Paid
                      </span>
                      <span className="font-bold text-emerald-700 tabular-nums">{formatCurrency(paidAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Payments */}
            <Card>
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payments</h3>
              </div>
              <div className="p-4">
                {payments.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No payments yet</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map((p, idx) => (
                      <div key={p.paymentUuid || idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium text-slate-700 text-sm">{p.paymentMethod || p.method}</div>
                          {p.transactionId && <div className="text-xs text-slate-400">{p.transactionId}</div>}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-slate-800">{formatCurrency(p.amount)}</div>
                          {p.status && <Badge variant={p.status === 'COMPLETED' ? 'success' : 'default'} className="text-xs">{p.status}</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Action Buttons */}
            <Card>
              <div className="p-4 space-y-3">
                <Button
                  className="w-full"
                  onClick={() => navigate(`/app/tables/${tableUuid}/add-items`)}
                  disabled={orderActionLoading || isBilled}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Items
                </Button>


                {hasPendingItems && (
                  <Button
                    variant="outline"
                    className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                    onClick={handleSendKot}
                    disabled={orderActionLoading}
                  >
                    {orderActionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ChefHat className="h-4 w-4 mr-2" />}
                    Send KOT
                  </Button>
                )}

                {hasBillingAccess && isOccupied && items.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full border-violet-200 text-violet-700 hover:bg-violet-50"
                    onClick={handleGenerateBill}
                    disabled={orderActionLoading}
                  >
                    {orderActionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Receipt className="h-4 w-4 mr-2" />}
                    Generate Bill
                  </Button>
                )}

                {hasBillingAccess && (
                  <Button
                    variant="outline"
                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => {
                      setPaymentForm({ method: 'CASH', amount: balance > 0 ? balance.toFixed(2) : '', transactionId: '' });
                      setShowPaymentModal(true);
                    }}
                    disabled={orderActionLoading}
                  >
                    <CreditCard className="h-4 w-4 mr-2" /> Add Payment
                  </Button>
                )}

                {/* KOT Status Warning */}
                {hasUnservedItems && items.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Waiting for all items to be served</span>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      {nonCancelledItems.filter(i => i.kotStatus === 'SERVED').length}/{nonCancelledItems.length} items served
                    </p>
                  </div>
                )}

                {/* Complete Order - only when ALL items served AND payment complete */}
                {allItemsServed && paidAmount >= total && total > 0 && (
                  <Button
                    variant="success"
                    className="w-full"
                    onClick={handleCompleteOrder}
                    disabled={orderActionLoading}
                  >
                    {orderActionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Complete Order
                  </Button>
                )}

                {/* Show info when items served but payment pending */}
                {allItemsServed && (paidAmount < total || total <= 0) && items.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-blue-700">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm font-medium">All items served — complete payment to finish</span>
                    </div>
                  </div>
                )}

                {hasManagerAccess && (
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => { setCancelReason(''); setShowCancelOrderModal(true); }}
                    disabled={orderActionLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Cancel Order
                  </Button>
                )}
              </div>
            </Card>
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
  );
};

export default TableDetails;
