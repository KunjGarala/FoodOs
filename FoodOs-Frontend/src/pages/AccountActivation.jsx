import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
                
                {status === 'verifying' && (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verifying...</h2>
                        <p className="mt-2 text-sm text-gray-600">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verified!</h2>
                        <p className="mt-2 text-sm text-gray-600">{message}</p>
                        <div className="mt-6">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Go to Login
                            </button>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verification Failed</h2>
                        <p className="mt-2 text-sm text-gray-600">{message}</p>
                        <div className="mt-6">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-indigo-600 hover:text-indigo-500 font-medium"
                            >
                                Back to Login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AccountActivation;
