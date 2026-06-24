import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BtnPrimary } from '../components/ui/kit';
import logoUrl from '../assets/foodos-logo.svg';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const AccountActivation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your account...');

    useEffect(() => {
        const verifyEmail = async () => {
            const code = searchParams.get('code');

            if (!code) {
                setStatus('error');
                setMessage('No verification code found.');
                return;
            }

            try {
                // Determine API URL based on environment or configuration
                const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

                await axios.post(`${API_URL}/api/auth/verify-email?code=${code}`);

                setStatus('success');
                setMessage('Account verified successfully! You can now login.');
            } catch (error) {
                console.error("Verification error:", error);
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
            }
        };

        verifyEmail();
    }, [searchParams]);

    return (
        <div className="min-h-screen grid place-items-center bg-paper px-4 py-12">
            <div className="w-full max-w-md">
                <img src={logoUrl} alt="FoodOS" className="h-12 w-12 mx-auto mb-6" />

                <div className="bg-paper-card border border-line-light rounded-card shadow-card p-7 sm:p-8 text-center">
                    {status === 'verifying' && (
                        <>
                            <div className="mx-auto mb-5 grid place-items-center h-14 w-14 rounded-full bg-marigold/15">
                                <Loader2 className="h-7 w-7 text-marigold animate-spin" />
                            </div>
                            <p className="eyebrow text-[11px] text-marigold mb-2">Verifying</p>
                            <h2 className="font-display font-bold text-2xl text-ink-text">Almost there...</h2>
                            <p className="text-sm text-txt-muted mt-2">{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="mx-auto mb-5 grid place-items-center h-16 w-16 rounded-full bg-success/[0.12]">
                                <CheckCircle2 className="h-9 w-9 text-success-deep" />
                            </div>
                            <p className="eyebrow text-[11px] text-marigold mb-2">Account activated</p>
                            <h2 className="font-display font-bold text-2xl text-ink-text">Verified!</h2>
                            <p className="text-sm text-txt-muted mt-2">{message}</p>
                            <div className="mt-6">
                                <BtnPrimary
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="w-full h-11"
                                >
                                    Go to login
                                </BtnPrimary>
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="mx-auto mb-5 grid place-items-center h-16 w-16 rounded-full bg-danger/[0.1]">
                                <XCircle className="h-9 w-9 text-danger-deep" />
                            </div>
                            <p className="eyebrow text-[11px] text-danger-deep mb-2">Verification failed</p>
                            <h2 className="font-display font-bold text-2xl text-ink-text">Something went wrong</h2>
                            <p className="text-sm text-txt-muted mt-2">{message}</p>
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="text-sm font-semibold text-marigold hover:brightness-90 transition"
                                >
                                    Back to login
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountActivation;
