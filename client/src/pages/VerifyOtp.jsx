import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  if (!email) {
    navigate('/forgot-password');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter a valid 6-digit OTP');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      toast.success('OTP verified');
      navigate('/reset-password', { state: { email, otp } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
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
            Verify your identity
          </h1>
          <p className="mb-10 text-lg leading-relaxed text-slate-600 animate-slideInLeft" style={{ animationDelay: '0.1s' }}>
            Enter the 6-digit code sent to your email to proceed with the password reset.
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
            <Link to="/forgot-password" className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 transition-transform group-hover:-translate-x-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Enter OTP</h2>
            <p className="mt-2 text-sm text-slate-500">A 6-digit code was sent to <strong className="text-slate-700">{email}</strong></p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">One-Time Password</label>
              <div className="mt-2">
                <input
                  type="text" required maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 text-center text-2xl font-bold tracking-[12px] placeholder-slate-300 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-2xl"
                  placeholder="000000"
                  autoFocus
                />
              </div>
            </div>
            <button type="submit" disabled={loading || otp.length !== 6}
              className="flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-60">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div className="text-center">
              <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                Resend OTP
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
