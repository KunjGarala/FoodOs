import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { BtnPrimary, BtnGhost } from '../components/ui/kit';
import logoUrl from '../assets/foodos-logo.svg';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    // As per user instructions, the backend returns "If the email exists, a reset link has been sent."
    // regardless of whether the email exists or not (security practice),
    // but the backend code throws exception if not found:
    // .orElseThrow(() -> new IllegalArgumentException("User with email not found"));
    // So we should handle errors.

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) return;

        setStatus('loading');
        setMessage('');

        try {
            const response = await authAPI.requestPasswordReset(email);
            // Assuming response structure based on user provided ApiResponse class
            // { success: true, message: "...", data: null, timestamp: ... }

            if (response.data.success) {
                setStatus('success');
                setMessage(response.data.message || "If the email exists, a reset link has been sent.");
            } else {
                 setStatus('error');
                 setMessage(response.data.message || "Something went wrong.");
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
            // Check if backend sent specific error message
            if (error.response && error.response.data && error.response.data.message) {
                 setMessage(error.response.data.message);
            } else {
                 setMessage("Failed to send reset link. Please try again.");
            }
        }
    };

    const inputCls =
        'w-full h-11 pl-10 pr-3 bg-paper-2 border border-line-input rounded-input text-sm text-txt-dark placeholder:text-txt-faint focus:outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/30 transition';

    return (
        <div className="min-h-screen grid place-items-center bg-paper px-4 py-12">
            <div className="w-full max-w-md">
                {/* logo + heading */}
                <div className="flex flex-col items-center text-center mb-8">
                    <img src={logoUrl} alt="FoodOS" className="h-12 w-12 mb-5" />
                    <p className="eyebrow text-[11px] text-marigold mb-2">Account recovery</p>
                    <h2 className="font-display font-bold text-[26px] tracking-[-0.01em] text-ink-text">
                        Reset your password
                    </h2>
                    <p className="text-txt-muted text-sm mt-1.5 max-w-sm">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className="bg-paper-card border border-line-light rounded-card shadow-card p-6 sm:p-7">
                    {status === 'success' ? (
                        <div className="text-center">
                            <div className="mx-auto mb-4 grid place-items-center h-14 w-14 rounded-full bg-success/[0.12]">
                                <CheckCircle2 className="h-7 w-7 text-success-deep" />
                            </div>
                            <h3 className="font-display font-bold text-lg text-ink-text mb-2">Check your email</h3>
                            <p className="text-sm text-txt-muted mb-6">
                                {message}
                            </p>
                            <BtnGhost
                                type="button"
                                className="w-full h-11"
                                onClick={() => setStatus('idle')}
                            >
                                Try another email
                            </BtnGhost>
                            <div className="mt-4">
                                <Link to="/login" className="text-sm font-semibold text-marigold hover:brightness-90">
                                    Back to login
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {status === 'error' && (
                                <div className="p-3.5 bg-danger/[0.08] border border-danger/30 rounded-input text-danger-deep text-sm">
                                    {message}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label htmlFor="email" className="text-sm font-medium text-txt-dark">
                                    Email address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-txt-faint" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                {status === 'loading' ? 'Sending link...' : 'Send reset link'}
                            </BtnPrimary>
                        </form>
                    )}
                </div>

                {status !== 'success' && (
                    <div className="mt-6 text-center">
                        <Link to="/login" className="inline-flex items-center justify-center gap-2 text-sm font-medium text-txt-muted hover:text-ink-text transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            Back to login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
