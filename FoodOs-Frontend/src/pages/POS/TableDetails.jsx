import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Users, Clock, Plus, ChefHat, Receipt, CreditCard,
  CheckCircle, XCircle, Loader2, AlertCircle, X, Trash2, Ban,
  UtensilsCrossed, Hash, UserCircle, Phone, Mail, MapPin
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

import {
  fetchTableDetails,
  selectTableDetails,
  selectTableDetailsLoading,
  selectTableActionLoading,
  selectTableError,
  clearTableDetails,
  occupyTable,
  clearError,
} from '../../store/tableSlice';
import {
  addItemsToOrder,
  sendKot,
  generateBill,
  addPayment,
  completeOrder,
  cancelOrder,
  cancelOrderItem,
  clearError as clearOrderError,
  clearSuccess as clearOrderSuccess,
} from '../../store/orderSlice';
import {
  fetchProducts
} from '../../store/productSlice';
import {
  fetchCategories
} from '../../store/categorySlice';
import { selectActiveRestaurant, selectRole } from '../../store/authSlice';

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
  const products = useSelector((s) => s.products.products);
  const categories = useSelector((s) => s.categories.categories);
  const productsLoading = useSelector((s) => s.products.loading);

  // Modals
  const [showOccupyModal, setShowOccupyModal] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelItemModal, setShowCancelItemModal] = useState(false);
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);

  // Forms
  const [occupyForm, setOccupyForm] = useState({
    orderType: 'DINE_IN', numberOfGuests: 1, customerName: '', customerPhone: '',
  });
  const [paymentForm, setPaymentForm] = useState({ method: 'CASH', amount: '', transactionId: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelItemTarget, setCancelItemTarget] = useState(null);

  // Add items state
  const [itemSearch, setItemSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [itemCart, setItemCart] = useState([]);

  // Time updater for seated time
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(c => c + 1), 60000);
    return () => clearInterval(t);
  }, []);

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

  // ── Fetch products/categories for Add Items ────────────
  useEffect(() => {
    if (activeRestaurantId && showAddItemsModal) {
      dispatch(fetchProducts({ restaurantUuid: activeRestaurantId, includeInactive: false }));
      dispatch(fetchCategories(activeRestaurantId));
    }
  }, [activeRestaurantId, showAddItemsModal, dispatch]);

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
  const handleOccupy = async () => {
    try {
      await dispatch(occupyTable({ tableUuid, data: occupyForm })).unwrap();
      setShowOccupyModal(false);
      setOccupyForm({ orderType: 'DINE_IN', numberOfGuests: 1, customerName: '', customerPhone: '' });
      refreshDetails();
    } catch (err) { console.error('Occupy failed:', err); }
  };

  const handleAddItems = async () => {
    if (!activeOrder || itemCart.length === 0) return;
    console.log(activeOrder.orderUuid);
    

    const items = itemCart.map((i) => ({
      productUuid: i.productUuid,
      variationUuid: i.variationUuid || null,
      quantity: i.quantity,
      itemNotes: '',
      modifiers: [],
    }));
    try {
      await dispatch(addItemsToOrder({ orderUuid: activeOrder.orderUuid, items })).unwrap();
      setShowAddItemsModal(false);
      setItemCart([]);
      refreshDetails();
    } catch (err) { console.error('Add items failed:', err); }
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

  const addProductToCart = (product) => {
    setItemCart((prev) => {
      const existing = prev.find((i) => i.productUuid === product.productUuid);
      if (existing) {
        return prev.map((i) =>
          i.productUuid === product.productUuid ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        productUuid: product.productUuid,
        name: product.name,
        price: product.variations?.[0]?.price || product.basePrice || 0,
        variationUuid: product.variations?.[0]?.variationUuid || null,
        quantity: 1,
      }];
    });
  };

  // ── Derived data ───────────────────────────────────────
  const items = activeOrder?.items || [];
  const payments = activeOrder?.payments || [];
  const hasPendingItems = items.some((i) => i.kotStatus === 'PENDING' || !i.kotStatus);

  const subtotal = activeOrder?.subtotal ?? items.reduce((s, i) => s + (i.lineTotal || i.unitPrice * i.quantity || 0), 0);
  const discount = activeOrder?.discountAmount ?? 0;
  const tax = activeOrder?.taxAmount ?? 0;
  const serviceCharge = activeOrder?.serviceCharge ?? 0;
  const total = activeOrder?.totalAmount ?? (subtotal - discount + tax + serviceCharge);
  const paidAmount = activeOrder?.paidAmount ?? payments.reduce((s, p) => s + (p.amount || 0), 0);
  const balance = total - paidAmount;

  const displayProducts = itemSearch.trim()
    ? products.filter((p) => p.name?.toLowerCase().includes(itemSearch.toLowerCase()))
    : activeCategory !== 'all'
      ? products.filter((p) => p.categoryName === activeCategory)
      : products;

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
    <div className="space-y-6 pb-8">
      {/* Toast */}
      {(orderError || orderSuccess || tableError) && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in max-w-sm ${
          (orderError || tableError) ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {(orderError || tableError) ? <AlertCircle className="h-5 w-5 flex-shrink-0" /> : <CheckCircle className="h-5 w-5 flex-shrink-0" />}
          <span className="text-sm font-medium">{orderError || tableError || orderSuccess}</span>
        </div>
      )}

      {/* ───── HEADER ───── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/tables')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Table {table.tableNumber}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${sc.bg} ${sc.text}`}>
                <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
                {table.status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {table.capacity} seats</span>
              {table.sectionName && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{table.sectionName}</span>}
            </div>
          </div>
        </div>

        {/* Order info badge (if occupied/billed) */}
        {activeOrder && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <Hash className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-800">{activeOrder.orderNumber || activeOrder.orderUuid?.slice(0, 8)}</span>
                <Badge variant={activeOrder.status === 'OPEN' ? 'success' : activeOrder.status === 'BILLED' ? 'primary' : 'default'}>
                  {activeOrder.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                {activeOrder.numberOfGuests > 0 && (
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{activeOrder.numberOfGuests} guests</span>
                )}
                {table.seatedAt && (
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{calculateSeatedTime(table.seatedAt)}</span>
                )}
              </div>
            </div>
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
            <Button onClick={() => setShowOccupyModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Occupy Table
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ───── OCCUPIED / BILLED STATE ───── */}
      {(isOccupied || isBilled) && activeOrder && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT: Items + Customer */}
          <div className="xl:col-span-2 space-y-6">

            {/* Customer Info */}
            {(activeOrder.customerName || activeOrder.customerPhone || activeOrder.customerEmail) && (
              <Card>
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2"><UserCircle className="h-5 w-5" /> Customer</h3>
                </div>
                <div className="p-4 flex flex-wrap gap-6 text-sm">
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
              </Card>
            )}

            {/* Order Items Table */}
            <Card>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Order Items ({items.length})</h3>
                {hasPendingItems && (
                  <Badge variant="warning">{items.filter(i => i.kotStatus === 'PENDING' || !i.kotStatus).length} pending</Badge>
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
                      {items.map((item, idx) => {
                        const isCancelled = item.kotStatus === 'CANCELLED' || item.status === 'CANCELLED';
                        return (
                          <tr key={item.itemUuid || idx} className={`border-b border-slate-50 ${isCancelled ? 'opacity-50 line-through' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-800">{item.productName || item.name}</div>
                              {item.variationName && <div className="text-xs text-slate-400">{item.variationName}</div>}
                              {item.modifiers?.length > 0 && (
                                <div className="text-xs text-slate-400">+{item.modifiers.map(m => m.name).join(', ')}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.unitPrice || item.price)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(item.lineTotal || (item.unitPrice || item.price) * item.quantity)}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant={KOT_STATUS_COLORS[item.kotStatus] || 'default'}>
                                {item.kotStatus || 'PENDING'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {!isCancelled && (item.kotStatus === 'PENDING' || !item.kotStatus) && (
                                <button
                                  onClick={() => { setCancelItemTarget(item); setCancelReason(''); setShowCancelItemModal(true); }}
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
          <div className="space-y-6">

            {/* Bill Summary */}
            <Card>
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Receipt className="h-5 w-5" /> Bill Summary</h3>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>}
                <div className="flex justify-between text-slate-600"><span>Tax</span><span>{formatCurrency(tax)}</span></div>
                {serviceCharge > 0 && <div className="flex justify-between text-slate-600"><span>Service Charge</span><span>{formatCurrency(serviceCharge)}</span></div>}
                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-lg text-slate-900">
                  <span>Total</span><span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-slate-600"><span>Paid</span><span className="text-emerald-600 font-semibold">{formatCurrency(paidAmount)}</span></div>
                {balance > 0 && (
                  <div className="flex justify-between font-semibold text-red-600"><span>Balance Due</span><span>{formatCurrency(balance)}</span></div>
                )}
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
                  onClick={() => { setItemCart([]); setItemSearch(''); setActiveCategory('all'); setShowAddItemsModal(true); }}
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

                {isOccupied && items.length > 0 && (
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

                {paidAmount >= total && total > 0 && (
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

                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => { setCancelReason(''); setShowCancelOrderModal(true); }}
                  disabled={orderActionLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Cancel Order
                </Button>
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
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowOccupyModal(false)}>Cancel</Button>
            <Button onClick={handleOccupy} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {actionLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Occupying…</> : <><CheckCircle className="h-4 w-4 mr-2" />Occupy Table</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Items Modal ─────────────────────────────── */}
      <Modal isOpen={showAddItemsModal} onClose={() => setShowAddItemsModal(false)} title="Add Items to Order">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search items…"
              className="pl-9"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setActiveCategory('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${activeCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
            {categories.map((c) => (
              <button key={c.categoryUuid} onClick={() => setActiveCategory(c.name)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${activeCategory === c.name ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{c.name}</button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="max-h-64 overflow-y-auto">
            {productsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : displayProducts.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">No products found</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {displayProducts.map((p) => {
                  const price = p.variations?.[0]?.price || p.basePrice || 0;
                  const cartItem = itemCart.find((i) => i.productUuid === p.productUuid);
                  return (
                    <button
                      key={p.productUuid}
                      onClick={() => addProductToCart(p)}
                      className={`p-3 rounded-lg border text-left transition-all hover:border-blue-400 hover:shadow-sm ${
                        cartItem ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="text-sm font-medium text-slate-800 line-clamp-1">{p.name}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-bold text-slate-700">{formatCurrency(price)}</span>
                        {cartItem && (
                          <span className="bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{cartItem.quantity}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {itemCart.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Selected ({itemCart.reduce((s, i) => s + i.quantity, 0)} items)</h4>
              {itemCart.map((item) => (
                <div key={item.productUuid} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">{item.name} × {item.quantity}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                    <button onClick={() => setItemCart(prev => prev.filter(i => i.productUuid !== item.productUuid))} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAddItemsModal(false)}>Cancel</Button>
            <Button onClick={handleAddItems} disabled={itemCart.length === 0 || orderActionLoading}>
              {orderActionLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Adding…</> : <><Plus className="h-4 w-4 mr-2" />Add {itemCart.reduce((s, i) => s + i.quantity, 0)} Items</>}
            </Button>
          </div>
        </div>
      </Modal>

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
    </div>
  );
};

export default TableDetails;
