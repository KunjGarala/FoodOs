import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Clock, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import {
  fetchKitchenOrders,
  changeOrderStatus,
  clearError,
  clearSuccess,
} from '../../store/orderSlice';

const KitchenDisplay = () => {
  const dispatch = useDispatch();
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { activeRestaurantId } = useSelector((state) => state.auth);
  const { kitchenOrders, loading, error, success } = useSelector((state) => state.orders);

  // Fetch kitchen orders on mount and auto-refresh every 30 seconds
  useEffect(() => {
    if (activeRestaurantId) {
      dispatch(fetchKitchenOrders(activeRestaurantId));
    }
  }, [dispatch, activeRestaurantId]);

  useEffect(() => {
    if (autoRefresh && activeRestaurantId) {
      const interval = setInterval(() => {
        dispatch(fetchKitchenOrders(activeRestaurantId));
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, dispatch, activeRestaurantId]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearError()), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => dispatch(clearSuccess()), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const handleMarkPrepared = async (orderUuid) => {
    try {
      await dispatch(changeOrderStatus({ 
        orderUuid, 
        newStatus: 'READY' 
      })).unwrap();
      // Refresh kitchen orders after status change
      dispatch(fetchKitchenOrders(activeRestaurantId));
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleRefresh = () => {
    if (activeRestaurantId) {
      dispatch(fetchKitchenOrders(activeRestaurantId));
    }
  };

  const calculateAverageTime = () => {
    if (!kitchenOrders || kitchenOrders.length === 0) return '0m';
    // This would need actual time tracking logic from backend
    return '12m';
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return 'warning';
      case 'PREPARING':
        return 'info';
      case 'READY':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusBorderColor = (status) => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return 'border-t-orange-500';
      case 'PREPARING':
        return 'border-t-blue-500';
      case 'READY':
        return 'border-t-green-500';
      default:
        return 'border-t-slate-500';
    }
  };

  const formatTime = (createdAt) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMinutes = Math.floor((now - orderTime) / 1000 / 60);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const hours = Math.floor(diffMinutes / 60);
    return `${hours}h ${diffMinutes % 60}m ago`;
  };

  return (
    <div className="h-full">
      {/* Notification Toast */}
      {(error || success) && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in ${
          error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <span className="font-medium">{error || success}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Kitchen Display System</h1>
          <p className="text-sm text-slate-500">Live feed of incoming orders</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Badge variant="primary" className="text-sm sm:text-lg px-3 sm:px-4 py-1">
            Avg Time: {calculateAverageTime()}
          </Badge>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
        </div>
      </div>

      {loading && !kitchenOrders?.length ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : !kitchenOrders || kitchenOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <AlertCircle className="h-12 w-12 mb-2" />
          <p>No orders in the kitchen</p>
          <p className="text-sm mt-1">Orders will appear here when they're sent to kitchen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {kitchenOrders.map(order => (
            <Card key={order.uuid} className={`border-t-4 ${getStatusBorderColor(order.status)}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {order.table ? `Table ${order.table.tableNumber}` : 'Takeaway'}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      #{order.orderNumber || order.uuid.slice(0, 8)}
                    </span>
                  </div>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-slate-500">
                  <Clock className="h-3 w-3" />
                  {formatTime(order.createdAt)}
                </div>
                {order.customerName && (
                  <p className="text-sm text-slate-600 mt-1">{order.customerName}</p>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {order.items && order.items.map((item) => (
                    <li 
                      key={item.uuid} 
                      className="flex justify-between items-center pb-2 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-slate-700">{item.product?.name || 'Unknown Item'}</span>
                        {item.specialInstructions && (
                          <p className="text-xs text-slate-500 mt-1">{item.specialInstructions}</p>
                        )}
                      </div>
                      <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-sm ml-2">
                        x{item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
                {order.notes && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <strong>Note:</strong> {order.notes}
                  </div>
                )}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => handleMarkPrepared(order.uuid)}
                    className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={order.status === 'READY'}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {order.status === 'READY' ? 'Ready' : 'Mark Prepared'}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
