export const TABLES = [
  { id: 1, name: 'T1', capacity: 2, status: 'free', section: 'Indoor', elapsed: null, bill: 0 },
  { id: 2, name: 'T2', capacity: 4, status: 'occupied', section: 'Indoor', elapsed: '45m', bill: 1250 },
  { id: 3, name: 'T3', capacity: 4, status: 'free', section: 'Indoor', elapsed: null, bill: 0 },
  { id: 4, name: 'T4', capacity: 6, status: 'billing', section: 'Indoor', elapsed: '1h 10m', bill: 3400 },
  { id: 5, name: 'B1', capacity: 2, status: 'free', section: 'Bar', elapsed: null, bill: 0 },
  { id: 6, name: 'B2', capacity: 2, status: 'occupied', section: 'Bar', elapsed: '20m', bill: 800 },
  { id: 7, name: 'VIP1', capacity: 8, status: 'free', section: 'VIP', elapsed: null, bill: 0 },
  { id: 8, name: 'O1', capacity: 4, status: 'free', section: 'Outdoor', elapsed: null, bill: 0 },
];

export const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'starters', name: 'Starters' },
  { id: 'main', name: 'Main Course' },
  { id: 'beverages', name: 'Beverages' },
  { id: 'desserts', name: 'Desserts' },
];

export const MENU_ITEMS = [
  { id: 101, name: 'Paneer Tikka', category: 'starters', price: 250, type: 'veg', code: 'S001' },
  { id: 102, name: 'Chicken Wings', category: 'starters', price: 320, type: 'non-veg', code: 'S002' },
  { id: 103, name: 'Butter Chicken', category: 'main', price: 450, type: 'non-veg', code: 'M001' },
  { id: 104, name: 'Dal Makhani', category: 'main', price: 280, type: 'veg', code: 'M002' },
  { id: 105, name: 'Garlic Naan', category: 'main', price: 60, type: 'veg', code: 'M003' },
  { id: 106, name: 'Mojito', category: 'beverages', price: 180, type: 'veg', code: 'B001' },
  { id: 107, name: 'Coke', category: 'beverages', price: 60, type: 'veg', code: 'B002' },
  { id: 108, name: 'Brownie', category: 'desserts', price: 200, type: 'egg', code: 'D001' },
];

export const CUSTOMERS = [
  { id: 1, name: 'Rahul Sharma', phone: '9876543210', visits: 12, lastVisit: '2 days ago', favorite: 'Chicken Wings' },
  { id: 2, name: 'Priya Verma', phone: '9988776655', visits: 4, lastVisit: '10 days ago', favorite: 'Mojito' },
];

export const STAFF = [
  { id: 1, name: 'Amit Singh', role: 'Waiter', status: 'Active' },
  { id: 2, name: 'Suresh Kumar', role: 'Chef', status: 'Active' },
  { id: 3, name: 'Rajesh Gupta', role: 'Manager', status: 'Active' },
];

export const KOT_ITEMS = [
  { id: 1, table: 'T2', items: [{ name: 'Butter Chicken', qty: 1 }, { name: 'Garlic Naan', qty: 2 }], status: 'preparing', time: '12:30 PM' },
  { id: 2, table: 'B2', items: [{ name: 'Mojito', qty: 2 }], status: 'pending', time: '12:35 PM' },
];
