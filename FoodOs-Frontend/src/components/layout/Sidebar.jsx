import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LayoutDashboard, Armchair, UtensilsCrossed, ChefHat, Receipt, Users, Settings, LogOut, Store, Layers } from 'lucide-react';
import { logout } from '../../store/authSlice';

export const Sidebar = ({ isOpen, onClose }) => {
  const { role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
    { icon: Armchair, label: 'Tables', path: '/app/tables' },
    { icon: UtensilsCrossed, label: 'Orders', path: '/app/order' },
    { icon: ChefHat, label: 'Kitchen', path: '/app/kitchen' },
    { icon: Layers, label: 'Categories', path: '/app/categories' },
    { icon: Receipt, label: 'Menu', path: '/app/menu' },
    { icon: Users, label: 'Staff', path: '/app/staff' },
    { icon: Users, label: 'CRM', path: '/app/crm' },
  ];

  const filteredItems = navItems.filter(item => {
    if (role === 'CHEF') return ['Dashboard', 'Kitchen'].includes(item.label);
    if (role === 'WAITER') return ['Dashboard', 'Tables', 'Orders'].includes(item.label);
    if (role === 'CASHIER') return ['Dashboard', 'Tables', 'Orders', 'Menu'].includes(item.label);
    return true;
  });

  const handleNavClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose) onClose();
  };

  return (
    <aside
      className={`
        fixed top-0 left-0 z-40 h-screen bg-white border-r border-slate-200 flex flex-col
        transition-transform duration-300 ease-in-out
        w-64
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-100 shrink-0">
        <div className="p-1.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg">
          <Store className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-slate-800">FoodOS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/app'}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-100 shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
