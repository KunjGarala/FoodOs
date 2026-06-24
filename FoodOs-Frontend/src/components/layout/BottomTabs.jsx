import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { MoreHorizontal, LogOut, Check, X } from 'lucide-react';
import { logout, setActiveRestaurant } from '../../store/authSlice';
import websocketService from '../../services/websocket';
import { navForRole, resolvePath, isNavActive } from './navItems';

const PRIMARY_KEYS = ['home', 'floor', 'kitchen', 'menu'];

/** Mobile bottom tab bar (< lg) + a "More" sheet for the rest of the nav. */
export const BottomTabs = () => {
  const { user, role, restaurants, restaurantIds, activeRestaurantId } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const all = navForRole(role);
  const primary = PRIMARY_KEYS.map((k) => all.find((i) => i.key === k)).filter(Boolean).slice(0, 4);
  const rest = all.filter((i) => !primary.includes(i));

  const handleLogout = () => {
    websocketService.disconnect();
    dispatch(logout());
    navigate('/login');
  };

  const restaurantName = (id) => {
    const r = (restaurants || []).find((x) => x?.restaurantUuid === id);
    return r ? (r.businessName || r.name) : 'Outlet';
  };

  const tabClass = (active) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 h-full ${
      active ? 'text-marigold' : 'text-txt-faintDark'
    }`;

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-ink-700 border-t border-ink-line flex items-stretch px-1 pb-safe">
        {primary.map((item) => (
          <NavLink key={item.key} to={resolvePath(item, activeRestaurantId)} className={tabClass(isNavActive(item, pathname))}>
            <item.icon strokeWidth={1.8} className="h-[20px] w-[20px]" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
        <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-txt-faintDark">
          <MoreHorizontal strokeWidth={1.8} className="h-[20px] w-[20px]" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-ink-700 rounded-t-card p-4 pb-8 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-txt-light">{user || 'User'}</p>
                <p className="text-[11px] font-mono uppercase tracking-wider text-txt-faintDark">{role || 'Role'}</p>
              </div>
              <button onClick={() => setMoreOpen(false)} className="p-2 text-txt-mutedDark hover:text-txt-light">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {rest.map((item) => (
                <NavLink
                  key={item.key}
                  to={resolvePath(item, activeRestaurantId)}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center justify-center gap-1 py-3 rounded-tile bg-ink-card text-txt-mutedDark"
                >
                  <item.icon strokeWidth={1.8} className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>

            {restaurantIds && restaurantIds.length > 1 && (
              <div className="mt-4 border-t border-ink-line pt-3">
                <p className="px-1 pb-1 text-[10px] font-mono uppercase tracking-wider text-txt-faintDark">Outlet</p>
                {restaurantIds.map((id) => (
                  <button
                    key={id}
                    onClick={() => { dispatch(setActiveRestaurant(id)); setMoreOpen(false); }}
                    className="w-full flex items-center justify-between gap-2 px-1 py-2.5 text-left text-sm text-txt-mutedDark"
                  >
                    <span className="truncate">{restaurantName(id)}</span>
                    {id === activeRestaurantId && <Check className="h-4 w-4 text-marigold shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-input bg-danger/10 text-danger font-medium"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
};
