import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LayoutDashboard, Armchair, UtensilsCrossed, ChefHat, Receipt, Users, Settings, LogOut, Store, Layers } from 'lucide-react';
import { logout } from '../../store/authSlice';

export const Sidebar = () => {
  const { role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getNavItems = (userRole) => {
    switch (userRole) {
      case 'ADMIN':
        return [
          { icon: Store, label: 'Restaurants', path: '/admin/restaurants' },
          { icon: Users, label: 'Users', path: '/admin/users' },
          { icon: LayoutDashboard, label: 'Reports', path: '/admin/reports' },
        ];
      case 'OWNER':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
          { icon: Armchair, label: 'Tables', path: '/app/tables' },
          { icon: UtensilsCrossed, label: 'Orders', path: '/app/order' },
          { icon: ChefHat, label: 'Kitchen', path: '/app/kitchen' },
          { icon: Receipt, label: 'Menu', path: '/app/menu' },
          { icon: Layers, label: 'Categories', path: '/app/categories' },
          { icon: Users, label: 'Staff', path: '/app/staff' },
          { icon: Users, label: 'CRM', path: '/app/crm' },
        ];
      case 'MANAGER':
      case 'WAITER': // Assuming waiters exist too
        return [
          { icon: UtensilsCrossed, label: 'Orders', path: '/app/order' },
          { icon: Armchair, label: 'Tables', path: '/app/tables' },
          { icon: ChefHat, label: 'Kitchen', path: '/app/kitchen' },
          { icon: Users, label: 'CRM', path: '/app/crm' },
        ];
      case 'CHEF':
          return [
            { icon: ChefHat, label: 'Kitchen', path: '/app/kitchen' },
          ]
      default:
        // Default fallbacks for development or undefined roles
        return [
           { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
        ];
    }
  };

  const navItems = getNavItems(role);

  return (
    <aside className="fixed left-0 top-0 h-full w-20 lg:w-64 bg-white border-r border-slate-200 z-30 transition-all duration-300 flex flex-col">
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-100">
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
          <UtensilsCrossed className="text-white h-5 w-5" />
        </div>
        <span className="ml-3 font-bold text-xl text-slate-800 hidden lg:block">FoodOS</span>
      </div>

      <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/app'}
            className={({ isActive }) =>
              `flex items-center px-3 py-3 rounded-lg transition-colors group ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="h-5 w-5 lg:mr-3" />
            <span className="font-medium hidden lg:block">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5 lg:mr-3" />
          <span className="font-medium hidden lg:block">Logout</span>
        </button>
      </div>
    </aside>
  );
};
