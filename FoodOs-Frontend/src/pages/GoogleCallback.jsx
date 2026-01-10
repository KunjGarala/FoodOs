import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setGoogleAuthTokens } from '../store/authSlice';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const accessToken = searchParams.get('access_token');
    const errorParam = searchParams.get('error');
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setTimeout(() => navigate('/login?error=' + errorParam), 3000);
      return;
    }
    
    if (success === 'true' && accessToken) {
      // Store access token in localStorage
      // Refresh token is automatically stored in HttpOnly cookie by backend
      localStorage.setItem('token', accessToken);

      // Decode JWT to get username
      try {
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
        const username = tokenPayload.sub || 'User';
        
        // Update Redux state
        dispatch(setGoogleAuthTokens({ 
          token: accessToken, 
          username: username 
        }));
        
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError('Failed to process authentication tokens');
        setTimeout(() => navigate('/login'), 3000);
      }
    } else {
      setError('Authentication failed. Missing access token.');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, dispatch, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-600 text-xl font-semibold mb-4">❌</div>
            <p className="text-red-600 font-medium">{error}</p>
            <p className="mt-2 text-gray-600 text-sm">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
            <p className="mt-4 text-black font-medium">Authenticating with Google...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
