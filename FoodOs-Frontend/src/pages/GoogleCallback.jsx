import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setGoogleAuthTokens, fetchMeContext } from '../store/authSlice';
import logoUrl from '../assets/foodos-logo.svg';
import { Loader2, XCircle } from 'lucide-react';

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
        const roles = tokenPayload.roles || [];

        // Update Redux state with identity (outlets are NOT in the token).
        dispatch(setGoogleAuthTokens({
          token: accessToken,
          user: {
            username,
            roles,
          }
        }));

        // Load the outlet list from /api/me/context, then redirect.
        dispatch(fetchMeContext());

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch {
        setError('Failed to process authentication tokens');
        setTimeout(() => navigate('/login'), 3000);
      }
    } else {
      setError('Authentication failed. Missing access token.');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, dispatch, navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-paper px-4 py-12">
      <div className="w-full max-w-md">
        <img src={logoUrl} alt="FoodOS" className="h-12 w-12 mx-auto mb-6" />

        <div className="bg-paper-card border border-line-light rounded-card shadow-card p-8 text-center">
          {error ? (
            <>
              <div className="mx-auto mb-5 grid place-items-center h-14 w-14 rounded-full bg-danger/[0.1]">
                <XCircle className="h-7 w-7 text-danger-deep" />
              </div>
              <p className="text-danger-deep font-semibold text-sm">{error}</p>
              <p className="mt-2 text-txt-muted text-sm">Redirecting to login...</p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-5 grid place-items-center h-14 w-14 rounded-full bg-marigold/15">
                <Loader2 className="h-7 w-7 text-marigold animate-spin" />
              </div>
              <p className="eyebrow text-[11px] text-marigold mb-2">Google sign-in</p>
              <p className="font-display font-bold text-lg text-ink-text">Signing you in...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;
