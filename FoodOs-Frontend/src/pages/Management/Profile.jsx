import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Shield, Building, Globe, Clock, CheckCircle2,
  AlertCircle, KeyRound, ArrowRight, Loader2, Save, Send, RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { profileAPI, meAPI } from '../../services/api';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState('');
  const [detailsError, setDetailsError] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    preferredLanguage: 'en',
    timezone: 'Asia/Kolkata',
  });

  // Email Change State
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      let data = null;
      try {
        const res = await profileAPI.getProfile();
        data = res.data;
      } catch (err) {
        // Fallback to meAPI context if getProfile is unreachable
        const meRes = await meAPI.getContext();
        data = meRes.data;
      }

      if (data) {
        setProfile(data);
        setFormData({
          fullName: data.fullName || '',
          phoneNumber: data.phoneNumber || '',
          preferredLanguage: data.preferredLanguage || 'en',
          timezone: data.timezone || 'Asia/Kolkata',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setDetailsError('Unable to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setSavingDetails(true);
    setDetailsSuccess('');
    setDetailsError('');

    try {
      await profileAPI.updateProfile({
        ...formData,
        email: profile?.email || '',
      });
      setDetailsSuccess('Profile details saved successfully!');
      setTimeout(() => setDetailsSuccess(''), 4000);
      fetchProfileData();
    } catch (err) {
      const data = err.response?.data;
      let msg = data?.message || err.message || 'Failed to update profile';
      if (data?.errors && typeof data.errors === 'object') {
        const errList = Object.entries(data.errors).map(([k, v]) => `${k}: ${v}`).join(', ');
        msg = `Please fix: ${errList}`;
      }
      setDetailsError(msg);
    } finally {
      setSavingDetails(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Please enter a valid new email address.');
      return;
    }

    setSendingOtp(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      const res = await profileAPI.sendEmailOtp(newEmail.trim());
      setOtpSent(true);
      setEmailSuccess(res.data?.message || `Verification OTP has been sent to ${newEmail.trim()}. Check your inbox.`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP to this email.';
      setEmailError(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setEmailError('Please enter the verification OTP received in your email.');
      return;
    }

    setVerifyingOtp(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      const res = await profileAPI.verifyEmailOtp(newEmail.trim(), otp.trim());
      setEmailSuccess(res.data?.message || 'Email updated successfully!');
      setOtpSent(false);
      setNewEmail('');
      setOtp('');
      fetchProfileData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification failed. Please check the code.';
      setEmailError(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-sm text-slate-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-md border border-slate-700/60">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-2xl font-bold text-white shadow-inner">
              {(profile?.fullName || profile?.username || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  {profile?.fullName || profile?.username || 'My Profile'}
                </h1>
                <Badge variant="success" className="text-xs">Active</Badge>
              </div>
              <p className="text-sm text-slate-300 flex items-center gap-2 mt-1">
                <span>@{profile?.username}</span>
                <span>•</span>
                <span className="font-semibold text-amber-400">{profile?.role || 'USER'}</span>
              </p>
            </div>
          </div>
          {profile?.primaryRestaurant && (
            <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-xs text-slate-200 flex items-center gap-2">
              <Building className="h-4 w-4 text-amber-400" />
              <span>{profile.primaryRestaurant.name || 'Primary Restaurant'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information Form */}
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {detailsSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{detailsSuccess}</span>
              </div>
            )}
            {detailsError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{detailsError}</span>
              </div>
            )}

            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter full name"
                  className="h-10"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+91 9876543210"
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Language
                  </label>
                  <select
                    value={formData.preferredLanguage}
                    onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="en">English (en)</option>
                    <option value="hi">Hindi (hi)</option>
                    <option value="gu">Gujarati (gu)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={savingDetails}
                  className="w-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center gap-2 h-10"
                >
                  {savingDetails ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving Details...</>
                  ) : (
                    <><Save className="h-4 w-4" /> Save Details</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Email & OTP Verification Card */}
        <Card className="border border-slate-200 shadow-sm bg-white flex flex-col justify-between">
          <div>
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-violet-600" />
                Email Address & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Current Verified Email */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Current Verified Email
                    </div>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5">
                      {profile?.email || 'No email configured'}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                </div>
              </div>

              {emailSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{emailSuccess}</span>
                </div>
              )}
              {emailError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{emailError}</span>
                </div>
              )}

              {/* Step 1: Send OTP to New Email */}
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase">
                      Change Email Address
                    </label>
                    <p className="text-xs text-slate-500">
                      An OTP code will be sent to your new email for verification. The email is updated only after verifying this code.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email address"
                      className="h-10 flex-1"
                      required
                    />
                    <Button
                      type="submit"
                      disabled={sendingOtp || !newEmail}
                      className="bg-violet-600 hover:bg-violet-700 text-white h-10 px-4 shrink-0 flex items-center gap-1.5"
                    >
                      {sendingOtp ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                      ) : (
                        <><Send className="h-4 w-4" /> Send OTP</>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                /* Step 2: Verify OTP */
                <form onSubmit={handleVerifyOtp} className="space-y-4 p-4 rounded-xl border border-violet-200 bg-violet-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-violet-900 uppercase">Verify New Email</div>
                      <div className="text-xs text-violet-700">Sent code to: <strong>{newEmail}</strong></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(''); }}
                      className="text-xs text-violet-600 hover:underline"
                    >
                      Change Email
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Enter 6-Digit Verification Code
                    </label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="h-11 text-center font-mono text-lg tracking-[0.3em] font-bold"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={verifyingOtp || otp.length < 4}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10 flex items-center justify-center gap-2"
                    >
                      {verifyingOtp ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4" /> Verify & Update Email</>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendOtp}
                      disabled={sendingOtp}
                      className="h-10 px-3 border-slate-300 text-slate-700"
                      title="Resend OTP"
                    >
                      <RefreshCw className={`h-4 w-4 ${sendingOtp ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
