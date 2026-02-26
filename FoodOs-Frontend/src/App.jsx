import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AccountActivation from './pages/AccountActivation';
import Dashboard from './pages/Dashboard';
import CreateRestaurant from './pages/CreateRestaurant';
import CreateOutlet from './pages/CreateOutlet';
import RestaurantDetails from './pages/RestaurantDetails';
import GoogleCallback from './pages/GoogleCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';

// POS Components
import TableManagement from './pages/POS/TableManagement';
import TableDetails from './pages/POS/TableDetails';
import TableOrderHistory from './pages/POS/TableOrderHistory';
import OrderDetailPage from './pages/POS/OrderDetailPage';
import OrderEntry from './pages/POS/OrderEntry';
import AddOrderItems from './pages/POS/AddOrderItems';
import KitchenDisplay from './pages/Kitchen/KitchenDisplay';
import MenuManagement from './pages/Management/MenuManagement';
import ProductForm from './pages/Management/ProductForm';
import CategoryManagement from './pages/Management/CategoryManagement';
import ModifierManagement from './pages/Management/ModifierManagement';
import StaffManagement from './pages/Management/StaffManagement';
import CustomerCRM from './pages/CRM/CustomerCRM';
import { MainLayout } from './components/layout/MainLayout';

import './index.css';

// Admin placeholders (for this demo)
const AdminRestaurants = () => <div className="p-4"><h2>Admin All Restaurants Management</h2></div>;
const AdminUsers = () => <div className="p-4"><h2>Admin User Management</h2></div>;
const Unauthorized = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold text-red-600">Unauthorized Access</h1><p>You do not have permission to view this page.</p></div>;

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<AccountActivation />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<GoogleCallback />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* OWNER & MANAGER Routes (The functional App) */}
          <Route path="/app" element={
            <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'CHEF', 'WAITER']}>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            
            <Route path="tables" element={
                <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'WAITER']}>
                    <TableManagement />
                </ProtectedRoute>
            } />
            
            <Route path="tables/:tableUuid" element={
                <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'WAITER']}>
                    <TableDetails />
                </ProtectedRoute>
            } />
            
            <Route path="tables/:tableUuid/add-items" element={
                <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'WAITER']}>
                    <AddOrderItems />
                </ProtectedRoute>
            } />

            <Route path="tables/:tableUuid/history" element={
                <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'WAITER']}>
                    <TableOrderHistory />
                </ProtectedRoute>
            } />

            <Route path="orders/:orderUuid" element={
                <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'WAITER', 'CASHIER']}>
                    <OrderDetailPage />
                </ProtectedRoute>
            } />

            
            <Route path="order" element={
                <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'WAITER']}>
                    <OrderEntry />
                </ProtectedRoute>
            } />
            
            <Route path="kitchen" element={
                <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'CHEF', 'WAITER']}>
                    <KitchenDisplay />
                </ProtectedRoute>
            } />
            
            <Route path="menu" element={
                <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                    <MenuManagement />
                </ProtectedRoute>
            } />
            
            <Route path="menu/new" element={
                <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                    <ProductForm />
                </ProtectedRoute>
            } />
            
            <Route path="menu/:productUuid/edit" element={
                <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                    <ProductForm />
                </ProtectedRoute>
            } />
            
            <Route path="categories" element={
                <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                    <CategoryManagement />
                </ProtectedRoute>
            } />
            
            <Route path="modifiers" element={
                <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                    <ModifierManagement />
                </ProtectedRoute>
            } />
            
            <Route path="staff" element={
                <ProtectedRoute allowedRoles={['OWNER' , "MANAGER"]}>
                    <StaffManagement />
                </ProtectedRoute>
            } />
            
            <Route path="crm" element={
                <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                    <CustomerCRM />
                </ProtectedRoute>
            } />
            
            <Route path="restaurant/:restaurantUuid" element={
                <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
                    <RestaurantDetails />
                </ProtectedRoute>
            } />
          </Route>

          {/* ADMIN Routes */}
          <Route path="/admin" element={
             <ProtectedRoute allowedRoles={['ADMIN']}>
                <MainLayout /> 
             </ProtectedRoute>
          }>
             <Route path="restaurants" element={<AdminRestaurants />} />
             <Route path="users" element={<AdminUsers />} />
             <Route path="restaurant/:restaurantUuid" element={<RestaurantDetails />} />
             <Route path="reports" element={<div className="p-4">Admin Reports</div>} />
             {/* Redirect /admin to /admin/restaurants */}
             <Route index element={<Navigate to="restaurants" replace />} />
          </Route>

          {/* Legacy/Other Routes */}
          <Route path="/create-restaurant" element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <CreateRestaurant />
              </ProtectedRoute>
          } />
          
          <Route path="/create-outlet" element={
              <ProtectedRoute allowedRoles={['OWNER']}>
                <CreateOutlet />
              </ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
