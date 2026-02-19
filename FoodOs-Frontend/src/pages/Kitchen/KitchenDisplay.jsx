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
  
  const { activeRestaurantId, role } = useSelector((state) => state.auth);
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

  const handleMarkPrepared = async (kotUuid) => {
    try {
      await dispatch(changeOrderStatus({ 
        kotUuid: kotUuid, 
        newStatus: 'READY' 
      })).unwrap();
      dispatch(fetchKitchenOrders(activeRestaurantId));
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleMarkServed = async (kotUuid) => {
    try {
      await dispatch(changeOrderStatus({ 
        kotUuid: kotUuid, 
        newStatus: 'COMPLETED' 
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
        <div className={`fixed top-4 right-4 left-4 sm:left-auto z-50 p-3 sm:p-4 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in sm:max-w-sm ${
          error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          {error ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle className="h-5 w-5 shrink-0" />}
          <span className="font-medium text-xs sm:text-sm line-clamp-2">{error || success}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Kitchen Display System</h1>
          <p className="text-sm text-slate-500">Live feed of incoming orders</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
{/*           
          <Badge variant="primary" className="text-sm sm:text-lg px-3 sm:px-4 py-1">
            Avg Time: {calculateAverageTime()}
          </Badge> */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {kitchenOrders.map(order => (
            <Card key={order.kotUuid} className={`border-t-4 ${getStatusBorderColor(order.status)}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}
                    </h3>
                    {}
                    <span className="text-xs text-slate-400 font-mono">
                      #{order.kotNumber || order.kotUuid?.slice(0, 8)}
                    </span>
                  </div>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-slate-500">
                  <Clock className="h-3 w-3" />
                  {formatTime(order.kotTime || order.createdAt)}
                </div>
                {order.waiterName && (
                  <p className="text-sm text-slate-600 mt-1">Waiter: {order.waiterName}</p>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {order.kotItems && order.kotItems.map((item) => (
                    <li 
                      key={item.kotItemUuid} 
                      className="flex justify-between items-start pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-800 text-lg">
                            {item.productName || 'Unknown Item'}
                          </span>
                          {item.variationName && (
                            <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
                              {item.variationName}
                            </Badge>
                          )}
                          {item.spicyLevel && item.spicyLevel !== 'NONE' && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                              {item.spicyLevel}
                            </Badge>
                          )}
                        </div>

                        {/* Modifiers Display */}
                        {item.modifiersText && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.modifiersText.split(',').map((mod, idx) => (
                              <span 
                                key={idx} 
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                              >
                                + {mod.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Special Instructions & Notes */}
                        {item.specialInstructions && (
                          <div className="flex items-start gap-1 mt-1 text-xs text-orange-600 bg-orange-50 p-1 rounded">
                            <span className="font-bold">Instr:</span> {item.specialInstructions}
                          </div>
                        )}
                        {item.kitchenNotes && (
                         <div className="flex items-start gap-1 mt-1 text-xs text-purple-600 bg-purple-50 p-1 rounded">
                            <span className="font-bold">Note:</span> {item.kitchenNotes}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-3 flex flex-col items-center">
                        <span className="bg-slate-900 text-white font-bold px-3 py-1 rounded-lg text-lg shadow-sm">
                          x{item.quantity}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                {order.orderNotes && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <strong>Note:</strong> {order.orderNotes}
                  </div>
                )}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  
                  <div className="flex gap-2">
                    {/* Chef Action: Mark Prepared */}
                    {(role === 'CHEF' || role === 'OWNER' || role === 'MANAGER') && (
                      <button 
                        onClick={() => handleMarkPrepared(order.kotUuid)}
                        className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                          order.status === 'READY' 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                        disabled={order.status === 'READY'}
                      >
                        <CheckCircle className="h-4 w-4" />
                        {order.status === 'READY' ? 'Ready' : 'Mark Prepared'}
                      </button>
                    )}

                    {/* Waiter Action: Mark Served */}
                    {(role === 'WAITER' || role === 'OWNER' || role === 'MANAGER') && order.status === 'READY' && (
                      <button 
                        onClick={() => handleMarkServed(order.kotUuid)}
                        className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Served
                      </button>
                    )}
                  </div>
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
