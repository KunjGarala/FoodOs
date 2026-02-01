import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Wraps a route and ensures the user is authenticated.
 *
 * @param {string[]} allowedRoles  – If supplied, only users whose `role`
 *                                   matches one of these strings may render
 *                                   the children.  An empty array means
 *                                   "any authenticated user".
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const location                  = useLocation();

  // Not authenticated → send to login, remembering where they came from.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check (only when the caller actually specified allowed roles).
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to the best default page for the user's actual role.
    const fallback =
      role === 'ADMIN'   ? '/admin'  :
      role === 'OWNER'   ? '/app'    :
      role === 'MANAGER' ? '/app'    :
                           '/unauthorized';

    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;