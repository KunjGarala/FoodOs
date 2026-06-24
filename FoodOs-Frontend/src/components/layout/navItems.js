import {
  LayoutGrid, Armchair, ChefHat, UtensilsCrossed,
  User, Users, BarChart3, Ticket, Layers, Sparkles,
} from 'lucide-react';

/**
 * Single source of truth for the nav rail + bottom tabs.
 * `roles` = which roles may see the item (undefined = everyone).
 * `outlet` = path is resolved against the active restaurant uuid at render time.
 */
export const NAV_ITEMS = [
  { key: 'home', icon: LayoutGrid, label: 'Home', path: '/app' },
  { key: 'floor', icon: Armchair, label: 'Floor', path: '/app/tables', roles: ['OWNER', 'MANAGER', 'WAITER', 'ADMIN'] },
  { key: 'kitchen', icon: ChefHat, label: 'Kitchen', path: '/app/kitchen', roles: ['OWNER', 'MANAGER', 'CHEF', 'WAITER', 'ADMIN'] },
  { key: 'menu', icon: UtensilsCrossed, label: 'Menu', path: '/app/menu', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { key: 'categories', icon: Layers, label: 'Categories', path: '/app/categories', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { key: 'modifiers', icon: Sparkles, label: 'Modifiers', path: '/app/modifiers', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { key: 'guests', icon: User, label: 'Guests', path: '/app/crm', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { key: 'team', icon: Users, label: 'Team', path: '/app/staff', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
  { key: 'outlets', icon: BarChart3, label: 'Outlets', outlet: true, roles: ['OWNER', 'MANAGER', 'ADMIN'] },
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
