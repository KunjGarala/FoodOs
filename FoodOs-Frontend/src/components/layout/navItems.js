import {
  LayoutGrid, Armchair, ClipboardList, ChefHat, UtensilsCrossed,
  User, Users, BarChart3, Ticket,
} from 'lucide-react';

/**
 * Single source of truth for the nav rail + bottom tabs.
 * `roles` = which roles may see the item (undefined = everyone).
 * `outlet` = path is resolved against the active restaurant uuid at render time.
 */
export const NAV_ITEMS = [
  { key: 'home', icon: LayoutGrid, label: 'Home', path: '/app' },
  { key: 'floor', icon: Armchair, label: 'Floor', path: '/app/tables', roles: ['OWNER', 'MANAGER', 'WAITER', 'ADMIN'] },
  { key: 'orders', icon: ClipboardList, label: 'Orders', path: '/app/orders', roles: ['OWNER', 'MANAGER', 'WAITER', 'CASHIER', 'ADMIN'] },
  { key: 'kitchen', icon: ChefHat, label: 'Kitchen', path: '/app/kitchen', roles: ['OWNER', 'MANAGER', 'CHEF', 'WAITER', 'ADMIN'] },
  // Menu also covers its sub-pages (Categories, Modifier groups) for active state.
  { key: 'menu', icon: UtensilsCrossed, label: 'Menu', path: '/app/menu', match: ['/app/menu', '/app/categories', '/app/modifiers'], roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { key: 'guests', icon: User, label: 'Guests', path: '/app/crm', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { key: 'team', icon: Users, label: 'Team', path: '/app/staff', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { key: 'outlets', icon: BarChart3, label: 'Outlets', outlet: true, match: ['/app/restaurant'], roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { key: 'offers', icon: Ticket, label: 'Offers', path: '/app/coupons', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
];

/** Resolve an item to a concrete path given the active restaurant uuid. */
export const resolvePath = (item, activeRestaurantId) =>
  item.outlet
    ? (activeRestaurantId ? `/app/restaurant/${activeRestaurantId}` : '/app')
    : item.path;

/** Filter nav items the given role may access. */
export const navForRole = (role) => {
  const r = (role || '').toUpperCase();
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(r));
};

/** Whether a nav item should render as active for the current pathname. */
export const isNavActive = (item, pathname) => {
  const paths = item.match || (item.path ? [item.path] : []);
  return paths.some((p) => {
    if (!p) return false;
    if (p === '/app') return pathname === '/app';
    return pathname === p || pathname.startsWith(p + '/');
  });
};
