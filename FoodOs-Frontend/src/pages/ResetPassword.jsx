import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { ChefHat, CheckCircle, AlertCircle } from 'lucide-react';

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

    if (!token) {
         return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                 <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                    <div className="bg-red-50 p-4 rounded-xl inline-block mb-4">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h2>
                    <p className="text-slate-600 mb-6">The password reset link is invalid or missing.</p>
                    <Link to="/forgot-password">
                        <Button variant="outline">Request new link</Button>
                    </Link>
                 </div>
            </div>
         );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="bg-primary/10 p-3 rounded-xl">
                        <ChefHat className="h-10 w-10 text-primary" />
                    </div>
                </div>
                <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    Set new password
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Your new password must be different to previously used passwords.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="border-0 shadow-xl ring-1 ring-slate-200">
                    <CardContent className="p-8">
                        {status === 'success' ? (
                            <div className="text-center">
                                <div className="rounded-full bg-green-100 p-3 mx-auto w-fit mb-4">
                                     <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">Password reset successful</h3>
                                <p className="text-sm text-slate-600 mb-6">
                                    You can now log in with your new password. Redirecting to login...
                                </p>
                                <Link to="/login">
                                    <Button className="w-full">
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {status === 'error' && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                        {message}
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="newPassword" class="block text-sm font-medium text-slate-700 mb-1">
                                        New Password
                                    </label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        required
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                                        placeholder="Min 8 characters"
                                        minLength={8}
                                        disabled={status === 'loading'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" class="block text-sm font-medium text-slate-700 mb-1">
                                        Confirm Password
                                    </label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                        placeholder="Confirm new password"
                                        minLength={8}
                                        disabled={status === 'loading'}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full flex justify-center py-2.5"
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' ? 'Resetting Password...' : 'Reset Password'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ResetPassword;
