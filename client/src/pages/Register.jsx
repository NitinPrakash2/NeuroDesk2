import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data);
      toast.success(`Welcome to NeuroDesk, ${data.name}!`);
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { data } = await api.post('/auth/google', { credential: credentialResponse.credential });
      login(data);
      toast.success(`Welcome to NeuroDesk, ${data.name}!`);
      navigate('/app/dashboard');
    } catch (err) {
      toast.error('Google sign-in failed. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white text-slate-900 antialiased selection:bg-indigo-500 selection:text-white animate-fadeInUp">

      {/* Left Section — hidden on mobile */}
      <div className="relative hidden w-1/2 flex-col overflow-hidden border-r border-slate-200 bg-slate-50 p-12 lg:flex">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-300/40 mix-blend-multiply blur-[100px]"></div>
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-300/40 mix-blend-multiply blur-[100px]"></div>

        <div className="relative z-10 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900">
          <img src="/Fevicon.png" alt="NeuroDesk" className="h-10 w-10 rounded-xl shadow-lg" />
          NeuroDesk
        </div>

        <div className="relative z-10 flex h-full flex-col justify-center pr-8">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 xl:text-5xl animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
            Your second brain, powered by AI.
          </h1>
          <p className="mb-10 text-lg leading-relaxed text-slate-600 animate-slideInLeft" style={{ animationDelay: '0.3s' }}>
            Capture tasks, notes, goals, and memories in one place. Let NeuroDesk's AI keep you organized and focused every day.
          </p>

          <div className="space-y-5 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            {['AI-powered task & goal suggestions', 'Smart memory vault for anything', 'Beautiful, distraction-free dashboard'].map((text) => (
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

      {/* Right Section — form */}
      <div className="relative flex w-full items-center justify-center bg-white p-8 sm:p-12 lg:w-1/2">

        {/* Mobile Logo */}
        <div className="absolute left-8 top-8 flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 lg:hidden">
          <img src="/Fevicon.png" alt="NeuroDesk" className="h-8 w-8 rounded-lg shadow-sm" />
          NeuroDesk
        </div>

        <div className="w-full max-w-md space-y-8 mt-12 lg:mt-0 animate-scaleIn" style={{ animationDelay: '0.1s' }}>

          <div className="text-center lg:text-left">
            <Link to="/" className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 transition-transform group-hover:-translate-x-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Home
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create your account</h2>
            <p className="mt-2 text-sm text-slate-500">Start organizing your life with AI — free forever.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
              <div className="mt-2">
                <input
                  id="name" name="name" type="text" autoComplete="name" required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
              <div className="mt-2">
                <input
                  id="email" name="email" type="email" autoComplete="email" required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-2">
                <PasswordInput
                  id="password" name="password" autoComplete="new-password" required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Min. 6 characters"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 px-4 text-xs font-medium uppercase tracking-wider text-slate-400">Or continue with</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google sign-in failed')}
              shape="pill"
              size="large"
              text="signup_with"
              theme="outline"
            />
          </div>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 transition-colors hover:text-indigo-500">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
