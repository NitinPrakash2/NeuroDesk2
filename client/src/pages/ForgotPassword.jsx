import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Enter your email');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email');
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
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
            Forgot your password?
          </h1>
          <p className="mb-10 text-lg leading-relaxed text-slate-600 animate-slideInLeft" style={{ animationDelay: '0.1s' }}>
            No worries! Enter your email and we'll send you a one-time password to reset it.
          </p>
          <div className="space-y-5 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {['OTP sent to your registered email', 'Secure verification process', 'Reset in under 2 minutes'].map((text) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-slate-700 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center bg-white p-8 sm:p-12 lg:w-1/2">
        <div className="absolute left-8 top-8 flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 lg:hidden">
          <img src="/Fevicon.png" alt="NeuroDesk" className="h-8 w-8 rounded-lg shadow-sm" />
          NeuroDesk
        </div>
        <div className="w-full max-w-md space-y-8 mt-12 lg:mt-0 animate-scaleIn">
          <div>
            <Link to="/login" className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 transition-transform group-hover:-translate-x-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Login
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Reset password</h2>
            <p className="mt-2 text-sm text-slate-500">Enter your registered email to receive an OTP.</p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <div className="mt-2">
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-60">
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
