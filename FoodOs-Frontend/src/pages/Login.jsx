import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { login, clearError, logout, updateTokenAndRole } from '../store/authSlice';
import { authAPI } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { BtnPrimary, BtnGhost } from '../components/ui/kit';
import { cn } from '../utils/cn';
import logoUrl from '../assets/foodos-logo.svg';
import { AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [searchParams] = useSearchParams();
    const [oauthError, setOauthError] = useState(null);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated, role, restaurantIds } = useSelector((state) => state.auth);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

    useEffect(() => {
        if (isAuthenticated) {
            if (role === 'GUEST') {
                setShowGuestModal(true);
            } else if (role === 'ADMIN') {
                navigate('/admin');
            } else {
                // ✅ FIX: Check if restaurantIds exists AND has length > 0
                // If restaurantIds is null, undefined, or empty array, redirect to create restaurant
                if (restaurantIds && Array.isArray(restaurantIds) && restaurantIds.length > 0) {
                    navigate('/app');
                } else {
                    navigate('/create-restaurant');
                }
            }
        }
    }, [isAuthenticated, role, navigate, restaurantIds]);

    const handleCreateRestaurant = async () => {
        try {
            const response = await authAPI.userWantCreateRestaurant(true);
            let token = response.headers['authorization'];
            if (token && token.startsWith('Bearer ')) {
                token = token.substring(7);
            }

            if (token) {
                dispatch(updateTokenAndRole(token));
                setShowGuestModal(false);
                navigate('/create-restaurant');
            } else {
                const storedToken = localStorage.getItem('token');
                if (storedToken) {
                    dispatch(updateTokenAndRole(storedToken));
                    setShowGuestModal(false);
                    navigate('/create-restaurant');
                }
            }
        } catch (err) {
            console.error("Failed to upgrade user", err.response?.data?.message || err.message || err);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        setShowGuestModal(false);
    };

    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setOauthError(decodeURIComponent(errorParam));
        }
    }, [searchParams]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // ✅ Use .unwrap() to get the actual result or throw on rejection
            const result = await dispatch(login(formData)).unwrap();

            console.log('Login successful', result);

            // ✅ Explicitly redirect after successful login
            const { role: userRole, restaurantIds: userRestaurantIds } = result;

            if (userRole === 'GUEST') {
                setShowGuestModal(true);
            } else if (userRole === 'ADMIN') {
                navigate('/admin', { replace: true });
            } else {
                // For OWNER, MANAGER, CHEF, WAITER roles
                if (userRestaurantIds && Array.isArray(userRestaurantIds) && userRestaurantIds.length > 0) {
                    navigate('/app', { replace: true });
                } else {
                    navigate('/create-restaurant', { replace: true });
                }
            }

        } catch (error) {
            // ✅ Error is already set in Redux state by login.rejected
            console.error('Login failed:', error.response?.data?.message || error.message || error);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/google/login`;
    };

    const inputCls =
        'w-full h-11 pl-10 pr-3 bg-paper-2 border border-line-input rounded-input text-sm text-txt-dark placeholder:text-txt-faint focus:outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30 transition';

    return (
        <>
            {/* Guest Modal */}
            <Modal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
                title="Welcome to FoodOS"
            >
                <div className="space-y-4">
                    <p className="text-txt-muted text-sm">
                        Your ID is not registered with any restaurant. Would you like to create a new restaurant?
                    </p>
                    <div className="flex justify-end gap-3 pt-4">
                        <BtnGhost type="button" onClick={handleLogout}>
                            Logout
                        </BtnGhost>
                        <BtnPrimary type="button" onClick={handleCreateRestaurant}>
                            Yes, Create Restaurant
                        </BtnPrimary>
                    </div>
                </div>
            </Modal>

            {/* Login — split screen */}
            <div className="min-h-screen flex bg-paper">
                {/* LEFT — ink brand panel */}
                <aside className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-ink text-txt-light">
                    {/* subtle marigold accents */}
                    <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-marigold/20 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
                    <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center">
                        <img src={logoUrl} alt="FoodOS" className="h-16 w-16 mb-6" />
                        <h1 className="font-display font-bold text-4xl tracking-[-0.02em] text-white">
                            FoodOS
                        </h1>
                        <p className="eyebrow text-[11px] text-marigold mt-3">
                            Restaurant Operating System
                        </p>
                        <p className="text-txt-mutedDark text-base mt-6 max-w-xs leading-relaxed">
                            Run your floor, kitchen, and counter from one calm, connected workspace.
                        </p>
                    </div>
                </aside>

                {/* RIGHT — light form area */}
                <main className="flex-1 flex items-center justify-center px-4 py-12 bg-paper">
                    <div className="w-full max-w-md">
                        {/* mobile logo (brand panel hidden below lg) */}
                        <div className="flex flex-col items-center lg:items-start mb-8">
                            <img src={logoUrl} alt="FoodOS" className="h-12 w-12 mb-5 lg:hidden" />
                            <h2 className="font-display font-bold text-[26px] tracking-[-0.01em] text-ink-text">
                                Welcome back
                            </h2>
                            <p className="text-txt-muted text-sm mt-1.5">
                                Sign in to your FoodOS account
                            </p>
                        </div>

                        <div className="bg-paper-card border border-line-light rounded-card shadow-card p-6 sm:p-7">
                            {(error || oauthError) && (
                                <div className="mb-6 p-3.5 bg-danger/[0.08] border border-danger/30 rounded-input flex gap-2.5 text-danger-deep text-sm">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <p>{oauthError || (typeof error === 'string' ? error : 'Invalid credentials')}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-txt-dark">Username</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-faint" />
                                        <input
                                            name="username"
                                            placeholder="Enter your username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            required
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-medium text-txt-dark">Password</label>
                                        <Link to="/forgot-password" className="text-xs font-medium text-marigold hover:brightness-90">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-faint" />
                                        <input
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter your password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            className={cn(inputCls, 'pr-10')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-faint hover:text-txt-dark transition"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <BtnPrimary
                                    type="submit"
                                    className="w-full h-11"
                                    disabled={loading}
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </BtnPrimary>
                            </form>

                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-line-light" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="eyebrow text-[10px] bg-paper-card px-3 text-txt-faint">Or continue with</span>
                                    </div>
                                </div>

                                <BtnGhost
                                    type="button"
                                    className="w-full mt-6 h-11"
                                    onClick={handleGoogleLogin}
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    Sign in with Google
                                </BtnGhost>
                            </div>

                            <div className="mt-6 text-center text-sm text-txt-muted">
                                Don't have an account?{' '}
                                <Link to="/signup" className="font-semibold text-marigold hover:brightness-90">
                                    Create an account
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default Login;
