import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, Search, User, Menu, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { setActiveRestaurant } from '../../store/authSlice';
import { restaurantAPI } from '../../services/api';

export const Topbar = ({ onMenuClick }) => {
  const { user, role, restaurantIds, activeRestaurantId } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleRestaurantChange = (e) => {
    dispatch(setActiveRestaurant(e.target.value));
  };

  const [restaurantNames, setRestaurantNames] = React.useState({});

  React.useEffect(() => {
    const fetchRestaurantNames = async () => {
      if (!restaurantIds || restaurantIds.length === 0) return;

      const names = {};
      await Promise.all(restaurantIds.map(async (id) => {
        try {
          const response = await restaurantAPI.getRestaurantDetail(id);
          names[id] = response.data.name;
        } catch (error) {
          console.error(`Failed to fetch details for restaurant ${id}`, error);
          names[id] = `Restaurant ${id}`; // Fallback
        }
      }));
      setRestaurantNames(names);
    };

    fetchRestaurantNames();
  }, [restaurantIds]);

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {/* Hamburger – only visible on mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Restaurant selector */}
          {restaurantIds && restaurantIds.length > 1 && (
            <div className="relative">
              <select
                value={activeRestaurantId || ''}
                onChange={handleRestaurantChange}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[180px] sm:max-w-none"
              >
                {restaurantIds.map(id => (
                  <option key={id} value={id}>
                    {restaurantNames[id] || `Restaurant ...`}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative">
            <Bell className="h-5 w-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-slate-700 leading-tight">{user || 'User'}</p>
              <p className="text-xs text-slate-500 leading-tight">{role || 'Role'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
