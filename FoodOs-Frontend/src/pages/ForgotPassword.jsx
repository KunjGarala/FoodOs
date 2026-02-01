import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { ChefHat, ArrowLeft, Mail } from 'lucide-react';

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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="bg-primary/10 p-3 rounded-xl">
                        <ChefHat className="h-10 w-10 text-primary" />
                    </div>
                </div>
                <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    Reset your password
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="border-0 shadow-xl ring-1 ring-slate-200">
                    <CardContent className="p-8">
                        {status === 'success' ? (
                            <div className="text-center">
                                <div className="rounded-full bg-green-100 p-3 mx-auto w-fit mb-4">
                                     <Mail className="h-6 w-6 text-green-600" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-2">Check your email</h3>
                                <p className="text-sm text-slate-600 mb-6">
                                    {message}
                                </p>
                                <Button 
                                    className="w-full" 
                                    variant="outline"
                                    onClick={() => setStatus('idle')}
                                >
                                    Try another email
                                </Button>
                                <div className="mt-4">
                                    <Link to="/login" className="text-sm font-medium text-primary hover:text-blue-700">
                                        Back to login
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {status === 'error' && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                        {message}
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                                        Email address
                                    </label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={status === 'loading'}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full flex justify-center py-2.5"
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Sending Link...
                                        </span>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
                
                {status !== 'success' && (
                    <div className="mt-6 text-center">
                        <Link to="/login" className="font-medium text-slate-600 hover:text-primary flex items-center justify-center gap-2 transition-colors">
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
