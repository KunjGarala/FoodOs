import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LogOut, Check, User as UserIcon } from 'lucide-react';
import { logout, setActiveRestaurant } from '../../store/authSlice';
import websocketService from '../../services/websocket';
import { navForRole, resolvePath, isNavActive } from './navItems';
import logoUrl from '../../assets/small-logo.png';

/**
 * Fixed 80px icon rail for lg+ screens. Dark ink surface.
 * Logo top · nav tiles middle · user avatar (with outlet/logout popover) bottom.
 */
export const Rail = () => {
  const { user, role, restaurants, restaurantIds, activeRestaurantId } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const popRef = useRef(null);

  const items = navForRole(role);
  const initial = (user || 'U').trim().charAt(0).toUpperCase();
  const homePath = ['OWNER', 'MANAGER', 'ADMIN'].includes(role)
    ? '/app'
    : (role === 'CHEF' ? '/app/kitchen' : (role === 'WAITER' ? '/app/tables' : (role === 'CASHIER' ? '/app/orders' : '/app')));

  useEffect(() => {
    const onDoc = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleLogout = () => {
    websocketService.disconnect();
    dispatch(logout());
    navigate('/login');
  };

  const restaurantName = (id) => {
    const r = (restaurants || []).find((x) => x?.restaurantUuid === id);
    return r ? (r.businessName || r.name) : 'Outlet';
  };

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 z-40 h-screen w-20 bg-ink-700 flex-col items-center py-4">
      {/* Logo */}
      <NavLink to={homePath} end className="shrink-0">
        <img src={logoUrl} alt="FoodOS" className="w-14 h-auto" />
      </NavLink>

      {/* Nav tiles */}
      <nav className="flex-1 mt-6 flex flex-col items-center gap-1.5 overflow-y-auto scrollbar-hide w-full">
        {items.map((item) => {
          const to = resolvePath(item, activeRestaurantId);
          const active = isNavActive(item, pathname);
          return (
            <NavLink
              key={item.key}
              to={to}
              className={`group flex flex-col items-center justify-center w-[50px] h-[50px] rounded-[15px] transition-colors ${
                active
                  ? 'bg-marigold/[0.16] text-marigold'
                  : 'text-txt-faintDark hover:text-txt-mutedDark hover:bg-white/5'
              }`}
            >
              <item.icon strokeWidth={1.8} className="h-[18px] w-[18px]" />
              <span className="mt-0.5 text-[9px] font-medium tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User avatar + popover */}
      <div className="relative shrink-0 mt-2" ref={popRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="h-[42px] w-[42px] rounded-full bg-gold text-ink font-display font-bold grid place-items-center hover:ring-2 hover:ring-marigold/40 transition"
          aria-label="Account menu"
        >
          {initial}
        </button>

        {menuOpen && (
          <div className="absolute bottom-0 left-[52px] w-64 rounded-2xl bg-[#1F2B37] border border-slate-700/80 shadow-2xl p-2.5 z-50 text-white">
            <div className="px-3 py-2.5 bg-slate-800/60 rounded-xl mb-1.5 border border-slate-750">
              <p className="text-sm font-bold text-white truncate">{user || 'User'}</p>
              <p className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold mt-0.5">{role || 'Role'}</p>
            </div>

            {restaurantIds && restaurantIds.length > 1 && (
              <div className="mt-1 border-t border-slate-700/60 pt-2">
                <p className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Switch Outlet</p>
                <div className="max-h-44 overflow-y-auto space-y-0.5">
                  {restaurantIds.map((id) => (
                    <button
                      key={id}
                      onClick={() => { dispatch(setActiveRestaurant(id)); setMenuOpen(false); }}
                      className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left text-sm text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <span className="truncate">{restaurantName(id)}</span>
                      {id === activeRestaurantId && <Check className="h-4 w-4 text-amber-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-1.5 border-t border-slate-700/60 pt-1.5 space-y-0.5">
              <NavLink
                to="/app/profile"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <UserIcon className="h-4 w-4 text-amber-400" /> My Profile
              </NavLink>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
