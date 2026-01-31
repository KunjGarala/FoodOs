import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, Search, User, Menu, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { setActiveRestaurant } from '../../store/authSlice';

export const Topbar = ({ onMenuClick }) => {
  const { user, role, restaurantIds, activeRestaurantId } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleRestaurantChange = (e) => {
    dispatch(setActiveRestaurant(e.target.value));
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 right-0 left-0 lg:left-64 z-20 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-500">
          <Menu className="h-6 w-6" />
        </button>
        
        {role === 'OWNER' && restaurantIds.length > 1 ? (
            <div className="relative ml-2 lg:ml-0">
                <select 
                    value={activeRestaurantId || ''}
                    onChange={handleRestaurantChange}
                    className="appearance-none bg-transparent font-semibold text-slate-800 text-lg pr-8 focus:outline-none cursor-pointer"
                >
                    {restaurantIds.map((id) => (
                        <option key={id} value={id}>Restaurant {id}</option>
                    ))}
                </select>
                <ChevronDown className="h-4 w-4 text-slate-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
        ) : (
            <h2 className="text-lg font-semibold text-slate-800 ml-2 lg:ml-0">
              {activeRestaurantId ? `Restaurant ${activeRestaurantId}` : 'FoodOS Dashboard'}
            </h2>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex relative">
           {/* Placeholder for Search */}
        </div>
        
        <Button variant="ghost" size="icon" className="text-slate-500">
          <Bell className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-slate-700 capitalize">{user || 'Guest'}</p>
            <div className="flex justify-end">
                <span className="text-xs text-slate-400 font-semibold uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                    {role || 'USER'}
                </span>
            </div>
          </div>
          <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
            <User className="h-5 w-5 text-slate-500" />
          </div>
        </div>
      </div>
    </header>
  );
};
