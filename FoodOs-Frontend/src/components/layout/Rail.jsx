import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LogOut, ChevronDown, Check } from 'lucide-react';
import { logout, setActiveRestaurant } from '../../store/authSlice';
import websocketService from '../../services/websocket';
import { navForRole, resolvePath } from './navItems';
import logoUrl from '../../assets/foodos-logo.svg';

/**
 * Fixed 80px icon rail for lg+ screens. Dark ink surface.
 * Logo top · nav tiles middle · user avatar (with outlet/logout popover) bottom.
 */
export const Rail = () => {
  const { user, role, restaurants, restaurantIds, activeRestaurantId } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const popRef = useRef(null);

  const items = navForRole(role);
  const initial = (user || 'U').trim().charAt(0).toUpperCase();

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
      <NavLink to="/app" end className="shrink-0">
        <img src={logoUrl} alt="FoodOS" className="h-11 w-11 rounded-xl" />
      </NavLink>

      {/* Nav tiles */}
      <nav className="flex-1 mt-6 flex flex-col items-center gap-1.5 overflow-y-auto scrollbar-hide w-full">
        {items.map((item) => {
          const to = resolvePath(item, activeRestaurantId);
          return (
            <NavLink
              key={item.key}
              to={to}
              end={item.path === '/app'}
              className={({ isActive }) =>
                `group flex flex-col items-center justify-center w-[50px] h-[50px] rounded-[15px] transition-colors ${
                  isActive
                    ? 'bg-marigold/[0.16] text-marigold'
                    : 'text-txt-faintDark hover:text-txt-mutedDark hover:bg-white/5'
                }`
              }
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
          <div className="absolute bottom-0 left-[52px] w-60 rounded-card bg-ink-card border border-ink-line shadow-float p-2 z-50">
            <div className="px-2 py-2">
              <p className="text-sm font-semibold text-txt-light truncate">{user || 'User'}</p>
              <p className="text-[11px] font-mono uppercase tracking-wider text-txt-faintDark">{role || 'Role'}</p>
            </div>

            {restaurantIds && restaurantIds.length > 1 && (
              <div className="mt-1 border-t border-ink-line pt-2">
                <p className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-txt-faintDark">Outlet</p>
                <div className="max-h-44 overflow-y-auto">
                  {restaurantIds.map((id) => (
                    <button
                      key={id}
                      onClick={() => { dispatch(setActiveRestaurant(id)); setMenuOpen(false); }}
                      className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left text-sm text-txt-mutedDark hover:bg-white/5"
                    >
                      <span className="truncate">{restaurantName(id)}</span>
                      {id === activeRestaurantId && <Check className="h-4 w-4 text-marigold shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-1 border-t border-ink-line pt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger/10"
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
