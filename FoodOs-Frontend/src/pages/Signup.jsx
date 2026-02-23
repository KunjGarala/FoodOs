import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { signup, clearError } from '../store/authSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ChefHat, AlertCircle, Upload } from 'lucide-react';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: ''
    });
    const [image, setImage] = useState(null);
    const [validationError, setValidationError] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/app');
        }
        return () => {
            dispatch(clearError());
        };
    }, [dispatch, isAuthenticated, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setValidationError('');
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/google/login`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.username || !formData.password || !formData.email || !formData.fullName) {
            setValidationError('Please fill in all required fields');
            return;
        }

        const data = new FormData();
        // Assuming backend expects 'data' or 'user'. Sticking to previous 'data' convention unless specified.
        data.append('data', new Blob([JSON.stringify(formData)], {
            type: 'application/json'
        }));

        if (image) {
            // Previous code used 'image'
            data.append('image', image);
        }

        dispatch(signup(data)).then((result) => {
            if (signup.fulfilled.match(result)) {
                navigate('/login');
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex h-12 w-12 bg-blue-600 rounded-xl items-center justify-center mb-4 shadow-lg shadow-blue-200">
                        <ChefHat className="text-white h-7 w-7" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
                    <p className="text-slate-500 mt-2">Join FoodOS and manage your restaurant</p>
                </div>

                <Card className="border-slate-200 shadow-xl">
                    <CardContent className="pt-6">
                        {(error || validationError) && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 text-red-700 text-sm">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p>{validationError || (typeof error === 'string' ? error : error?.message || 'Signup failed')}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">     
                                <label className="text-sm font-medium text-slate-700">Full Name</label>
                                <Input
                                    name="fullName"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    className="h-10"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Username</label>
                                <Input
                                    name="username"
                                    placeholder="johndoe"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    className="h-10"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Email Address</label>
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="h-10"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Password</label>
                                <Input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="h-10"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Profile Picture</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-slate-400 transition-colors cursor-pointer relative bg-slate-50">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                            <Upload size={20} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600">
                                            {image ? image.name : 'Click to upload'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white mt-2"
                                disabled={loading}
                            >
                                {loading ? 'Creating account...' : 'Create Account'}
                            </Button>

                             <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500">Or continue with</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11 border-slate-200 hover:bg-slate-50 relative flex items-center justify-center"
                                onClick={handleGoogleLogin}
                            >
                                <svg className="w-5 h-5 absolute left-4" aria-hidden="true" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"></path>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                </svg>
                                <span className="text-slate-700 font-medium">Sign up with Google</span>
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign in
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Signup;
