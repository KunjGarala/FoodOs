import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { BtnPrimary, BtnGhost } from '../components/ui/kit';
import logoUrl from '../assets/foodos-logo.svg';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('code');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid or missing reset token.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            setMessage('Missing reset token.');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match.');
            return;
        }

        if (formData.newPassword.length < 8) {
             setStatus('error');
             setMessage('Password must be at least 8 characters.');
             return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const response = await authAPI.resetPassword({
                token: token,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            });

            if (response.data.success) {
                setStatus('success');
                setMessage(response.data.message || 'Password has been reset successfully.');
                // Redirect to login after a few seconds or show button
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                 setStatus('error');
                 setMessage(response.data.message || "Failed to reset password.");
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
             if (error.response && error.response.data && error.response.data.message) {
                 setMessage(error.response.data.message);
            } else {
                 setMessage("Failed to reset password. The link may have expired.");
            }
        }
    };

    const inputCls =
        'w-full h-11 pl-10 pr-3 bg-paper-2 border border-line-input rounded-input text-sm text-txt-dark placeholder:text-txt-faint focus:outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30 transition';

    if (!token) {
         return (
            <div className="min-h-screen grid place-items-center bg-paper px-4 py-12">
                <div className="w-full max-w-md text-center">
                    <img src={logoUrl} alt="FoodOS" className="h-12 w-12 mx-auto mb-6" />
                    <div className="bg-paper-card border border-line-light rounded-card shadow-card p-7">
                        <div className="mx-auto mb-4 grid place-items-center h-14 w-14 rounded-full bg-danger/[0.1]">
                            <AlertCircle className="h-7 w-7 text-danger-deep" />
                        </div>
                        <h2 className="font-display font-bold text-xl text-ink-text mb-2">Invalid link</h2>
                        <p className="text-sm text-txt-muted mb-6">The password reset link is invalid or missing.</p>
                        <Link to="/forgot-password" className="block">
                            <BtnGhost type="button" className="w-full h-11">Request new link</BtnGhost>
                        </Link>
                    </div>
                </div>
            </div>
         );
    }

    return (
        <div className="min-h-screen grid place-items-center bg-paper px-4 py-12">
            <div className="w-full max-w-md">
                {/* logo + heading */}
                <div className="flex flex-col items-center text-center mb-8">
                    <img src={logoUrl} alt="FoodOS" className="h-12 w-12 mb-5" />
                    <p className="eyebrow text-[11px] text-marigold mb-2">Account recovery</p>
                    <h2 className="font-display font-bold text-[26px] tracking-[-0.01em] text-ink-text">
                        Set new password
                    </h2>
                    <p className="text-txt-muted text-sm mt-1.5 max-w-sm">
                        Your new password must be different to previously used passwords.
                    </p>
                </div>

                <div className="bg-paper-card border border-line-light rounded-card shadow-card p-6 sm:p-7">
                    {status === 'success' ? (
                        <div className="text-center">
                            <div className="mx-auto mb-4 grid place-items-center h-14 w-14 rounded-full bg-success/[0.12]">
                                <CheckCircle2 className="h-7 w-7 text-success-deep" />
                            </div>
                            <h3 className="font-display font-bold text-lg text-ink-text mb-2">Password reset successful</h3>
                            <p className="text-sm text-txt-muted mb-6">
                                You can now log in with your new password. Redirecting to login...
                            </p>
                            <Link to="/login" className="block">
                                <BtnPrimary type="button" className="w-full h-11">
                                    Back to login
                                </BtnPrimary>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {status === 'error' && (
                                <div className="p-3.5 bg-danger/[0.08] border border-danger/30 rounded-input text-danger-deep text-sm">
                                    {message}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label htmlFor="newPassword" className="text-sm font-medium text-txt-dark">
                                    New password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-faint" />
                                    <input
                                        id="newPassword"
                                        type="password"
                                        required
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                                        placeholder="Min 8 characters"
                                        minLength={8}
                                        disabled={status === 'loading'}
                                        className={inputCls}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="confirmPassword" className="text-sm font-medium text-txt-dark">
                                    Confirm password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-faint" />
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                        placeholder="Confirm new password"
                                        minLength={8}
                                        disabled={status === 'loading'}
                                        className={inputCls}
                                    />
                                </div>
                            </div>

                            <BtnPrimary
                                type="submit"
                                className="w-full h-11"
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? 'Resetting password...' : 'Reset password'}
                            </BtnPrimary>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
