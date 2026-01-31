import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { authAPI, restaurantAPI } from '../services/api';
import { logout } from '../store/authSlice';

const StatCard = ({ title, value, icon: Icon, trend, color, subtext }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
           {trend && (
             <p className={`text-xs font-medium mt-1 flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
               <TrendingUp className="h-3 w-3 mr-1" />
               {trend}% vs yesterday
             </p>
           )}
           {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);


const Dashboard = () => {
  const { user, activeRestaurantId, role, restaurantIds } = useSelector((state) => state.auth);
  const navigate = useNavigate();

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
    <div className="space-y-6">
      <div className="flex justify-between items-end">
         <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
            <p className="text-slate-500">Welcome back, {user}</p>
         </div>
         <div className="text-right flex flex-col items-end gap-2">
             <div className="text-sm text-slate-500 bg-white px-3 py-1 rounded border border-slate-200 inline-block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </div>

             {activeRestaurantId && restaurantIds && restaurantIds[0] === activeRestaurantId && (
                 <p className="text-xs text-slate-400">Restaurant ID: {activeRestaurantId}</p>
             )}
             
             {/* Create Outlet Button - Only for OWNER with existing restaurants */}
             {(role === 'OWNER' && restaurantIds && restaurantIds.length > 0 && restaurantIds && restaurantIds[0] === activeRestaurantId ) && (
                 <Button size="sm" onClick={() => navigate('/create-outlet')}>
                    Create Outlet
                 </Button>
             )}
         </div>
      </div>
      
      

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Sales" 
          value="₹24,500" 
          trend={12} 
          icon={DollarSign} 
          color="bg-blue-500"
        />
        <StatCard 
          title="Total Orders" 
          value="45" 
          trend={8} 
          icon={ShoppingBag} 
          color="bg-purple-500"
        />
        <StatCard 
          title="Active Tables" 
          value="8/12" 
          subtext="66% Occupancy"
          icon={Users} 
          color="bg-amber-500"
        />
        <StatCard 
          title="New Customers" 
          value="12" 
          trend={-2} 
          icon={Users} 
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="h-96">
            <CardContent>
               <CardTitle className="mb-4">Recent Activity</CardTitle>
               <div className="h-full flex items-center justify-center text-slate-400">
                  Chart Placeholder
               </div>
            </CardContent>
         </Card>
         <Card className="h-96">
            <CardContent>
               <CardTitle className="mb-4">Top Selling Items</CardTitle>
               <div className="space-y-4">
                  {[1,2,3,4,5].map(i => (
                     <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 bg-slate-100 rounded-lg"></div>
                           <div>
                              <p className="font-medium text-slate-800">Butter Chicken</p>
                              <p className="text-xs text-slate-500">24 orders</p>
                           </div>
                        </div>
                        <span className="font-semibold text-slate-700">₹12,400</span>
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
