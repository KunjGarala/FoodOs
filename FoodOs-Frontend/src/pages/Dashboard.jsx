import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Verify token validity on dashboard load
    api.get('/').catch(() => {
      // If validation/refresh fails, the interceptor will handle redirect to login
      // But we can also handle specific UI feedback here if needed
      console.log("Session validation failed");
    });
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-black">FoodOS</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="px-4 py-2 border-2 border-black bg-black text-white font-medium hover:bg-white hover:text-black transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white border-2 border-black p-8">
          <h2 className="text-3xl font-bold text-black mb-4">Welcome to Dashboard</h2>
          <p className="text-gray-600 mb-4">
            You are successfully logged in as <span className="font-medium text-black">{user}</span>
          </p>
          <div className="mt-8 p-6 border border-black">
            <h3 className="text-xl font-semibold text-black mb-2">Dashboard Content</h3>
            <p className="text-gray-600">This is your main dashboard. Add your content here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
