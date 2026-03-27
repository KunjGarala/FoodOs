import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import {
   fetchDashboardAnalytics,
   selectDashboardAnalytics,
   selectDashboardAnalyticsDays,
   selectDashboardAnalyticsError,
   selectDashboardAnalyticsLastUpdated,
   selectDashboardAnalyticsLoading,
   setAnalyticsDays,
} from '../store/analyticsSlice';

const StatCard = ({ title, value, icon: Icon, trend, color, subtext }) => (
  <Card>
    <CardContent className="p-3 sm:p-4 lg:p-6">
      <div className="flex items-start sm:items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{title}</p>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mt-0.5 sm:mt-1">{value}</h3>
           {trend && (
             <p className={`text-[10px] sm:text-xs font-medium mt-0.5 sm:mt-1 flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
               <TrendingUp className="h-3 w-3 mr-0.5 sm:mr-1 shrink-0" />
               {trend}% vs yesterday
             </p>
           )}
           {subtext && <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">{subtext}</p>}
        </div>
        <div className={`h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-full flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);


const Dashboard = () => {
   const dispatch = useDispatch();
  const { user, activeRestaurantId, role, restaurantIds } = useSelector((state) => state.auth);
   const analytics = useSelector(selectDashboardAnalytics);
   const loading = useSelector(selectDashboardAnalyticsLoading);
   const error = useSelector(selectDashboardAnalyticsError);
   const days = useSelector(selectDashboardAnalyticsDays);
   const lastUpdated = useSelector(selectDashboardAnalyticsLastUpdated);
  const navigate = useNavigate();

   const canViewAnalytics = useMemo(() => {
      return ['OWNER', 'MANAGER', 'ADMIN'].includes((role || '').toUpperCase());
   }, [role]);

   useEffect(() => {
      if (!activeRestaurantId || !canViewAnalytics) return;

      dispatch(fetchDashboardAnalytics({ restaurantUuid: activeRestaurantId, days }));

      // Poll every 30 seconds so the dashboard stays close to real-time.
      const intervalId = setInterval(() => {
         dispatch(fetchDashboardAnalytics({ restaurantUuid: activeRestaurantId, days }));
      }, 30000);

      return () => clearInterval(intervalId);
   }, [dispatch, activeRestaurantId, days, canViewAnalytics]);

   const formatCurrency = (value) => {
      const num = Number(value || 0);
      return new Intl.NumberFormat('en-IN', {
         style: 'currency',
         currency: 'INR',
         maximumFractionDigits: 2,
      }).format(num);
   };

   const trendPercent = (todayVal, yesterdayVal) => {
      const todayNum = Number(todayVal || 0);
      const yNum = Number(yesterdayVal || 0);
      if (yNum === 0) {
         return todayNum > 0 ? 100 : 0;
      }
      return Number((((todayNum - yNum) / yNum) * 100).toFixed(1));
   };

   const today = analytics?.today;
   const yesterday = analytics?.yesterday;
   const topItems = analytics?.topItems || [];
   const revenueChart = analytics?.revenueChart || [];
   const hourlyOrders = analytics?.hourlyOrders || [];
   const ordersByStatus = analytics?.ordersByStatus || {};

   const topItem = topItems[0];
   const maxRevenue = Math.max(...revenueChart.map((d) => Number(d.revenue || 0)), 1);

  // No Restaurant Logic
  if (role !== 'GUEST' && (!restaurantIds || restaurantIds.length === 0)) {
       return (
         <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)]">
             <div className="text-center">
                 <h2 className="text-2xl font-bold text-slate-800 mb-2">No Restaurants Found</h2>
                 <p className="mb-6 text-slate-500">You don't have any restaurants associated with your account yet.</p>
                 <Button onClick={() => navigate('/create-restaurant')} className="bg-blue-600">Create Your First Restaurant</Button>
             </div>
         </div>
       );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-4">
         <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Dashboard Overview</h1>
            <p className="text-sm text-slate-500">Welcome back, {user}</p>
         </div>
         <div className="flex flex-col items-start sm:items-end gap-2">
             <div className="text-xs sm:text-sm text-slate-500 bg-white px-3 py-1 rounded border border-slate-200 inline-block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </div>

             {activeRestaurantId && restaurantIds && restaurantIds[0] === activeRestaurantId && (
                 <p className="text-xs text-slate-400">Restaurant ID: {activeRestaurantId}</p>
             )}

             <div className="flex items-center gap-2 mt-1">
                 {/* Restaurant Details Button */}
                 {activeRestaurantId && (
                     <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/app/restaurant/${activeRestaurantId}`)}
                     >
                        View Details
                     </Button>
                 )}
                 
                 {/* Create Outlet Button - Only for OWNER with existing restaurants */}
                 {(role === 'OWNER' && restaurantIds && restaurantIds.length > 0 && restaurantIds && restaurantIds[0] === activeRestaurantId ) && (
                     <Button size="sm" onClick={() => navigate('/create-outlet')}>
                        Create Outlet
                     </Button>
                 )}
             </div>
         </div>
      </div>
      
      

         <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="text-xs text-slate-500">
               {lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}` : 'Waiting for first refresh...'}
            </div>
            <div className="flex items-center gap-2">
               <select
                  value={days}
                  onChange={(e) => dispatch(setAnalyticsDays(Number(e.target.value)))}
                  className="h-9 rounded-md border border-slate-300 px-2 text-sm bg-white"
               >
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
               </select>
               <Button
                  size="sm"
                  variant="outline"
                  disabled={loading || !activeRestaurantId || !canViewAnalytics}
                  onClick={() => dispatch(fetchDashboardAnalytics({ restaurantUuid: activeRestaurantId, days }))}
               >
                  {loading ? 'Refreshing...' : 'Refresh'}
               </Button>
            </div>
         </div>

         {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
               {error}
            </div>
         )}

         {!canViewAnalytics && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
               Live analytics is available for Manager/Owner/Admin roles.
            </div>
         )}

         <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard 
               title="Today's Sales" 
               value={formatCurrency(today?.revenue)} 
               trend={trendPercent(today?.revenue, yesterday?.revenue)} 
          icon={DollarSign} 
          color="bg-blue-500"
        />
        <StatCard 
               title="Today's Orders" 
               value={today?.orderCount ?? 0} 
               trend={trendPercent(today?.orderCount, yesterday?.orderCount)} 
          icon={ShoppingBag} 
          color="bg-purple-500"
        />
        <StatCard 
               title="Average Order Value" 
               value={formatCurrency(today?.avgOrderValue)} 
               trend={trendPercent(today?.avgOrderValue, yesterday?.avgOrderValue)}
          icon={Users} 
          color="bg-amber-500"
        />
        <StatCard 
               title="Top Item" 
               value={topItem?.productName || 'N/A'} 
               subtext={topItem ? `${topItem.quantity} sold • ${formatCurrency(topItem.revenue)}` : 'No item sales in selected range'}
          icon={Users} 
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
         <Card className="h-64 sm:h-80 lg:h-96">
            <CardContent>
                      <CardTitle className="mb-4">Revenue Trend</CardTitle>
                      <div className="h-full flex items-end gap-2 overflow-x-auto pb-2">
                           {revenueChart.length === 0 && (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                 No revenue data available.
                              </div>
                           )}
                           {revenueChart.map((entry) => {
                              const revenue = Number(entry.revenue || 0);
                              const barHeight = Math.max(6, Math.round((revenue / maxRevenue) * 180));
                              return (
                                 <div key={entry.date} className="min-w-[52px] flex flex-col items-center">
                                    <div
                                       className="w-8 rounded-t bg-blue-500"
                                       style={{ height: `${barHeight}px` }}
                                       title={`${entry.date}: ${formatCurrency(revenue)}`}
                                    />
                                    <span className="text-[10px] text-slate-500 mt-1">{entry.date?.slice(5)}</span>
                                 </div>
                              );
                           })}
               </div>
            </CardContent>
         </Card>
         <Card className="h-auto lg:h-96">
            <CardContent>
               <CardTitle className="mb-4">Top Selling Items</CardTitle>
               <div className="space-y-3 sm:space-y-4">
                           {topItems.length === 0 && (
                              <p className="text-sm text-slate-500">No item sales for selected range.</p>
                           )}
                           {topItems.map((item) => (
                              <div key={item.productName} className="flex items-center justify-between">
                                 <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 text-xs font-semibold">
                                       #{item.quantity}
                                    </div>
                                    <div className="min-w-0">
                                       <p className="font-medium text-slate-800 truncate">{item.productName}</p>
                                       <p className="text-xs text-slate-500">{item.quantity} sold</p>
                                    </div>
                                 </div>
                                 <span className="font-semibold text-slate-700">{formatCurrency(item.revenue)}</span>
                              </div>
                           ))}
               </div>
            </CardContent>
         </Card>
      </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
               <CardContent>
                  <CardTitle className="mb-4">Today's Hourly Orders</CardTitle>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                     {hourlyOrders.map((entry) => (
                        <div key={entry.hour} className="text-center rounded border border-slate-200 px-1 py-2">
                           <p className="text-xs text-slate-500">{String(entry.hour).padStart(2, '0')}</p>
                           <p className="text-sm font-semibold text-slate-800">{entry.orderCount}</p>
                        </div>
                     ))}
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardContent>
                  <CardTitle className="mb-4">Order Status Breakdown (Today)</CardTitle>
                  <div className="space-y-3">
                     {Object.keys(ordersByStatus).length === 0 && (
                        <p className="text-sm text-slate-500">No orders found for today.</p>
                     )}
                     {Object.entries(ordersByStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
                           <span className="text-sm font-medium text-slate-700">{status.replaceAll('_', ' ')}</span>
                           <span className="text-sm font-semibold text-slate-900">{count}</span>
                        </div>
                     ))}
                  </div>
               </CardContent>
            </Card>
         </div>
    </div>
  );
};

export default Dashboard;
