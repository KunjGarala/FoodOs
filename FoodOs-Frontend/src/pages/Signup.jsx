import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { signup, clearError } from '../store/authSlice';
import { BtnPrimary, BtnGhost } from '../components/ui/kit';
import { cn } from '../utils/cn';
import logoUrl from '../assets/foodos-logo.svg';
import { User, Mail, Lock, Store, Check, AlertCircle, Upload } from 'lucide-react';

const TRIAL_BULLETS = [
    'Free 14-day trial — no card required',
    'Live floor, kitchen display & POS in one',
    'Real-time covers, revenue & shift insights',
    'Unlimited menu items and staff accounts',
];

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

    const fieldLabel = 'block text-[13px] font-medium text-txt-dark mb-1.5';
    const inputWrap = 'relative';
    const inputIcon = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-faint';
    const inputBase = cn(
        'w-full h-11 pl-10 pr-3 rounded-input bg-paper-2 border border-line-input',
        'text-sm text-txt-dark placeholder:text-txt-faint',
        'outline-none transition focus:border-marigold focus:ring-2 focus:ring-marigold/30'
    );

    return (
        <div className="min-h-screen flex bg-paper font-sans">
            {/* LEFT — ink brand panel (hidden below lg) */}
            <aside className="hidden lg:flex lg:w-[44%] flex-col justify-between bg-ink text-txt-light p-12">
                <div className="flex items-center gap-3">
                    <img src={logoUrl} alt="FoodOS" className="h-9 w-auto" />
                    <span className="font-display font-bold text-lg text-white tracking-tight">FoodOS</span>
                </div>

                <div className="max-w-md">
                    <p className="eyebrow text-[11px] text-marigold mb-3">Start free</p>
                    <h2 className="font-display font-bold text-[34px] leading-[1.1] tracking-[-0.02em] text-white">
                        Run your whole restaurant from one screen.
                    </h2>
                    <p className="text-txt-mutedDark text-sm mt-4 leading-relaxed">
                        Floor, kitchen, POS and team — unified. Create your account and bring service online today.
                    </p>

                    <ul className="mt-8 space-y-4">
                        {TRIAL_BULLETS.map((bullet) => (
                            <li key={bullet} className="flex items-start gap-3">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-marigold/15">
                                    <Check className="h-3.5 w-3.5 text-marigold" />
                                </span>
                                <span className="text-sm text-txt-light/90">{bullet}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="text-xs text-txt-faintDark">© {new Date().getFullYear()} FoodOS. All rights reserved.</p>
            </aside>

            {/* RIGHT — light form */}
            <main className="flex-1 flex items-center justify-center px-5 py-10 sm:px-8">
                <div className="w-full max-w-md">
                    {/* small logo — visible only when brand panel is hidden */}
                    <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
                        <img src={logoUrl} alt="FoodOS" className="h-8 w-auto" />
                        <span className="font-display font-bold text-lg text-ink-text tracking-tight">FoodOS</span>
                    </div>

                    <div className="mb-7">
                        <p className="eyebrow text-[11px] text-txt-faint mb-1">Sign up</p>
                        <h1 className="font-display font-bold text-[26px] tracking-[-0.01em] text-ink-text">
                            Create your account
                        </h1>
                        <p className="text-sm text-txt-muted mt-1.5">Join FoodOS and manage your restaurant.</p>
                    </div>

                    <div className="rounded-card bg-paper-card border border-line-light shadow-card p-6 sm:p-7">
                        {(error || validationError) && (
                            <div className="mb-5 p-3.5 rounded-input bg-danger/[0.08] border border-danger/30 flex gap-2.5 text-danger-deep text-sm">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p>{validationError || (typeof error === 'string' ? error : error?.message || 'Signup failed')}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className={fieldLabel}>Full Name</label>
                                <div className={inputWrap}>
                                    <User className={inputIcon} />
                                    <input
                                        name="fullName"
                                        placeholder="John Doe"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                        className={inputBase}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={fieldLabel}>Username</label>
                                <div className={inputWrap}>
                                    <Store className={inputIcon} />
                                    <input
                                        name="username"
                                        placeholder="johndoe"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        className={inputBase}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={fieldLabel}>Email Address</label>
                                <div className={inputWrap}>
                                    <Mail className={inputIcon} />
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className={inputBase}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={fieldLabel}>Password</label>
                                <div className={inputWrap}>
                                    <Lock className={inputIcon} />
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className={inputBase}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={fieldLabel}>Profile Picture</label>
                                <div className="relative rounded-tile border-2 border-dashed border-line-input bg-paper-2 p-6 text-center transition-colors hover:border-marigold cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-10 w-10 rounded-full bg-marigold/15 text-marigold flex items-center justify-center">
                                            <Upload size={20} />
                                        </div>
                                        <p className="text-sm font-medium text-txt-muted">
                                            {image ? image.name : 'Click to upload'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <BtnPrimary
                                type="submit"
                                className="w-full h-11 mt-1"
                                disabled={loading}
                            >
                                {loading ? 'Creating account...' : 'Sign up'}
                            </BtnPrimary>

                            <div className="relative my-1">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-line-light" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-2 bg-paper-card text-txt-faint">Or continue with</span>
                                </div>
                            </div>

                            <BtnGhost
                                type="button"
                                className="w-full h-11"
                                onClick={handleGoogleLogin}
                            >
                                <svg className="w-5 h-5" aria-hidden="true" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"></path>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                </svg>
                                <span className="text-txt-dark font-medium">Sign up with Google</span>
                            </BtnGhost>
                        </form>

                        <div className="mt-6 text-center text-sm text-txt-muted">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-marigold hover:brightness-95">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Signup;
