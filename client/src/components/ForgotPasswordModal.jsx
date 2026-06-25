import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import PasswordInput from './PasswordInput';

const STEPS = ['Email', 'Verify OTP', 'New Password'];

export default function ForgotPasswordModal({ onClose, initialEmail = '' }) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Enter your email'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email');
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Enter a valid 6-digit OTP'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      toast.success('OTP verified');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, password });
      toast.success('Password reset successfully!');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const ErrorAlert = () => error ? (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200">
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
      {error}
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Reset password</h2>
            <p className="text-sm text-slate-500 mt-0.5">Step {step + 1} of 3 — {STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-6 pt-4">
          {[0, 1, 2].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'bg-indigo-500' : 'bg-slate-200'}`} />
          ))}
        </div>

        {/* Step 1: Email */}
        {step === 0 && (
          <form onSubmit={handleSendOtp} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Email Address</label>
              <input
                type="email" required value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="name@company.com"
                autoFocus
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm font-medium transition-all bg-slate-50"
              />
            </div>
            <ErrorAlert />
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? 'Checking email...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 1 && (
          <form onSubmit={handleVerifyOtp} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">One-Time Password</label>
              <p className="text-xs text-slate-500 mb-3">A 6-digit code was sent to <strong className="text-slate-700">{email}</strong></p>
              <input
                type="text" required maxLength={6}
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                placeholder="000000"
                autoFocus
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center text-2xl font-bold tracking-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-slate-50"
              />
            </div>
            <ErrorAlert />
            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div className="text-center">
              <button type="button" onClick={() => { setStep(0); setOtp(''); setError(''); }} className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">New Password</label>
              <PasswordInput
                required value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Min. 6 characters"
                autoFocus
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm font-medium transition-all bg-slate-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Confirm Password</label>
              <PasswordInput
                required value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                placeholder="Re-enter new password"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm font-medium transition-all bg-slate-50"
              />
            </div>
            <ErrorAlert />
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
