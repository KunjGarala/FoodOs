import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to a default authorized page based on their role
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (role === 'OWNER') return <Navigate to="/app" replace />;
    if (role === 'MANAGER') return <Navigate to="/app" replace />;
    
    // Or just a generic unauthorized page/root
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
