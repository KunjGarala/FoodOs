import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { login, clearError, logout, updateTokenAndRole } from '../store/authSlice';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { ChefHat, AlertCircle, X } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [searchParams] = useSearchParams();
    const [oauthError, setOauthError] = useState(null);
    const [showGuestModal, setShowGuestModal] = useState(false);

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
                if (restaurantIds && restaurantIds.length > 0) {
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
            console.error("Failed to upgrade user", err);
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

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(login(formData));
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/google/login`;
    };

        return (
        <>
            {/* Guest Modal */}
            <Modal
                isOpen={showGuestModal}
                onClose={() => setShowGuestModal(false)}
                title="Welcome to FoodOS"
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        Your ID is not registered with any restaurant. Would you like to create a new restaurant?
                    </p>
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button variant="outline" onClick={handleLogout}>
                            Logout
                        </Button>
                        <Button onClick={handleCreateRestaurant}>
                            Yes, Create Restaurant
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Login Form */}
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="inline-flex h-12 w-12 bg-blue-600 rounded-xl items-center justify-center mb-4 shadow-lg shadow-blue-200">
                            <ChefHat className="text-white h-7 w-7" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
                        <p className="text-slate-500 mt-2">Sign in to your FoodOS account</p>
                    </div>

                    <Card className="border-slate-200 shadow-xl">
                        {/* Removed the entire CardHeader section */}
                        <CardContent className="p-6"> {/* Removed pt-6, use p-6 for consistent padding */}
                            {(error || oauthError) && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-700 text-sm">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <p>{oauthError || (typeof error === 'string' ? error : 'Invalid credentials')}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* ... rest of your form remains the same ... */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Username</label>
                                    <Input
                                        name="username"
                                        placeholder="Enter your username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-medium text-slate-700">Password</label>
                                        <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <Input
                                        name="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="h-11"
                                    />
                                </div>

                                <Button 
                                    type="submit" 
                                    className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-base"
                                    disabled={loading}
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </Button>
                            </form>

                            <div className="mt-6">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-slate-200" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-slate-500">Or continue with</span>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full mt-6 h-11"
                                    onClick={handleGoogleLogin}
                                >
                                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
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
                                </Button>
                            </div>

                            <div className="mt-6 text-center text-sm text-slate-500">
                                Don't have an account?{' '}
                                <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-500">
                                    Create an account
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );

};

export default Login;