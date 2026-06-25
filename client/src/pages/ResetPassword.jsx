import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import PasswordInput from '../components/PasswordInput';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const otp = location.state?.otp || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  if (!email || !otp) {
    navigate('/forgot-password');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, password });
      toast.success('Password reset successfully! Please login with your new password.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white text-slate-900 antialiased animate-fadeInUp">
      <div className="relative hidden w-1/2 flex-col overflow-hidden border-r border-slate-200 bg-slate-50 p-12 lg:flex">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-300/40 mix-blend-multiply blur-[100px]"></div>
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-300/40 mix-blend-multiply blur-[100px]"></div>
        <div className="relative z-10 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900">
          <img src="/Fevicon.png" alt="NeuroDesk" className="h-10 w-10 rounded-xl shadow-lg" />
          NeuroDesk
        </div>
        <div className="relative z-10 flex h-full flex-col justify-center pr-8">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 xl:text-5xl animate-slideInLeft">
            Set a new password
          </h1>
          <p className="mb-10 text-lg leading-relaxed text-slate-600 animate-slideInLeft" style={{ animationDelay: '0.1s' }}>
            Choose a strong password that you haven't used before. Minimum 6 characters.
          </p>
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center bg-white p-8 sm:p-12 lg:w-1/2">
        <div className="absolute left-8 top-8 flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 lg:hidden">
          <img src="/Fevicon.png" alt="NeuroDesk" className="h-8 w-8 rounded-lg shadow-sm" />
          NeuroDesk
        </div>
        <div className="w-full max-w-md space-y-8 mt-12 lg:mt-0 animate-scaleIn">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">New password</h2>
            <p className="mt-2 text-sm text-slate-500">Enter your new password for <strong className="text-slate-700">{email}</strong></p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">New Password</label>
              <div className="mt-2">
                <PasswordInput
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Min. 6 characters"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
              <div className="mt-2">
                <PasswordInput
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-60">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
