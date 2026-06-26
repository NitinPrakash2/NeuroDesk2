import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import PasswordInput from '../components/PasswordInput';
import PageHeader from '../components/PageHeader';

export default function Account() {
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [createPasswordForm, setCreatePasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [createPasswordMsg, setCreatePasswordMsg] = useState(null);
  const [createPasswordLoading, setCreatePasswordLoading] = useState(false);

  const [contactForm, setContactForm] = useState({ subject: '', message: '' });
  const [contactMsg, setContactMsg] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { notifications } = useNotifications();
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleCreatePassword = async (e) => {
    e.preventDefault();
    setCreatePasswordMsg(null);
    if (!createPasswordForm.newPassword.trim()) {
      setCreatePasswordMsg({ type: 'error', text: 'Password is required.' });
      return;
    }
    if (createPasswordForm.newPassword !== createPasswordForm.confirmPassword) {
      setCreatePasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (createPasswordForm.newPassword.length < 6) {
      setCreatePasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setCreatePasswordLoading(true);
    try {
      await api.post('/user/set-password', { password: createPasswordForm.newPassword });
      setCreatePasswordMsg({ type: 'success', text: 'Password created successfully!' });
      localStorage.setItem('has_password', 'true');
      refreshUser();
      setCreatePasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      setCreatePasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create password.' });
    } finally {
      setCreatePasswordLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!passwordForm.newPassword.trim()) {
      setPasswordMsg({ type: 'error', text: 'New password is required.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (otpStep !== 2) {
      if (!passwordForm.currentPassword.trim()) {
        setPasswordMsg({ type: 'error', text: 'Current password is required.' });
        return;
      }
      if (passwordForm.currentPassword === passwordForm.newPassword) {
        setPasswordMsg({ type: 'error', text: 'New password must be different from current password.' });
        return;
      }
    }

    setPasswordLoading(true);

    try {
      if (otpStep === 2) {
        await api.post('/auth/change-password-verified', {
          otp: otpCode,
          newPassword: passwordForm.newPassword,
        });
      } else {
        await api.post('/auth/change-password', {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        });
      }

      setPasswordMsg({ type: 'success', text: 'Password updated successfully! Please use your new password next time you log in.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setOtpStep(0);
      setOtpCode('');
    } catch (err) {
      console.error('Password change error:', err);

      if (err.response?.status === 401 || err.response?.status === 400) {
        setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Current password is incorrect. Please try again.' });
      } else if (err.response?.data?.message) {
        setPasswordMsg({ type: 'error', text: err.response.data.message });
      } else {
        setPasswordMsg({ type: 'error', text: 'Failed to update password. Please try again later.' });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendPasswordOtp = async () => {
    setPasswordMsg(null);
    setOtpLoading(true);
    try {
      await api.post('/auth/send-otp');
      setPasswordMsg({ type: 'success', text: 'OTP sent to your email!' });
      setOtpStep(1);
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to send OTP' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyPasswordOtp = async () => {
    setPasswordMsg(null);
    if (otpCode.length !== 6) { setPasswordMsg({ type: 'error', text: 'Enter a valid 6-digit OTP' }); return; }
    setOtpLoading(true);
    try {
      await api.post('/auth/verify-otp', { email: user?.email, otp: otpCode });
      setPasswordMsg({ type: 'success', text: 'Identity verified! You can now set a new password.' });
      setOtpStep(2);
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Invalid OTP' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleContact = async (e) => {
    e.preventDefault();
    setContactMsg(null);

    if (!contactForm.subject.trim()) {
      setContactMsg({ type: 'error', text: 'Subject is required.' });
      return;
    }
    if (!contactForm.message.trim()) {
      setContactMsg({ type: 'error', text: 'Message is required.' });
      return;
    }

    setContactLoading(true);

    try {
      await api.post('/auth/contact', contactForm);
      setContactMsg({ type: 'success', text: 'Message sent successfully! Our team will get back to you within 24 hours.' });
      setContactForm({ subject: '', message: '' });
    } catch (err) {
      console.error('Contact error:', err);
      setContactMsg({ type: 'success', text: 'Message sent! We\'ll get back to you soon.' });
      setContactForm({ subject: '', message: '' });
    } finally {
      setContactLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }
    if (!deletePassword.trim()) {
      setDeleteError('Password is required to delete your account');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await api.post('/auth/verify-password', { password: deletePassword });
      await api.delete('/auth/account');
      logout();
    } catch (err) {
      setDeleteLoading(false);
      if (err.response?.status === 401 || err.response?.status === 400) {
        setDeleteError('Incorrect password. Please try again.');
      } else {
        setDeleteError(err.response?.data?.message || 'Failed to delete account. Please try again.');
      }
    }
  };

  const navLinks = [
    { to: '/app/dashboard', label: 'Home', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
    { to: '/app/tasks', label: 'Tasks', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> },
    { to: '/app/notes', label: 'Notes', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
    { to: '/app/files', label: 'Files', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /> },
    { to: '/app/memory', label: 'Memory', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
    { to: '/app/goals', label: 'Goals', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /> },
    { to: '/app/analytics', label: 'Analytics', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
  ];

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
      desc: 'Personal information & account details',
    },
    {
      id: 'password',
      label: 'Security',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
      desc: 'Password & authentication settings',
    },
    {
      id: 'contact',
      label: 'Support',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
      desc: 'Get help from our support team',
    },
    {
      id: 'danger',
      label: 'Danger Zone',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
      desc: 'Irreversible account actions',
    },
  ];

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Account Settings" notificationOpen={notificationOpen} setNotificationOpen={setNotificationOpen} />

      {/* TWO-COLUMN LAYOUT - stack on mobile */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

        {/* LEFT: TABS NAVIGATION */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setPasswordMsg(null); setContactMsg(null); }}
                  className={`flex-shrink-0 w-full text-left p-4 rounded-2xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-white shadow-lg shadow-indigo-100/50 border border-indigo-100'
                      : 'bg-transparent border border-transparent hover:bg-white hover:shadow-md hover:border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                    }`}>
                      {tab.icon}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${
                        isActive ? 'text-indigo-600' : 'text-slate-700 group-hover:text-slate-900'
                      }`}>{tab.label}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{tab.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: CONTENT */}
        <div className="flex-1 min-h-[400px] md:min-h-[600px]">

          {/* ===== PROFILE TAB ===== */}
              {activeTab === 'profile' && (
                <div className="space-y-5 animate-fadeIn">

                  {/* PROFILE CARD */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    {/* AVATAR + NAME */}
                    <div className="p-6 flex items-center gap-5">
                      <div className="relative">
                        <img
                          src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random&size=128&bold=true`}
                          alt={user?.name}
                          className="w-20 h-20 rounded-xl border-2 border-slate-100 object-cover"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900">{user?.name || 'User'}</h2>
                        <p className="text-sm text-slate-500 mt-0.5 truncate">{user?.email || 'No email provided'}</p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">Joined {new Date().getFullYear()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACCOUNT INFO */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">Account Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Full Name', value: user?.name || '\u2014' },
                        { label: 'Email Address', value: user?.email || '\u2014' },

                        { label: 'Status', value: 'Active', highlight: true },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.highlight ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                          <div className="min-w-0">
                            <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                            <p className={`text-sm font-semibold truncate ${item.highlight ? 'text-emerald-600' : 'text-slate-800'}`}>{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SIGN OUT */}
                  <button
                    onClick={logout}
                    className="text-sm font-medium text-slate-500 hover:text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign Out
                  </button>
                </div>
              )}

              {/* ===== SECURITY TAB ===== */}
              {activeTab === 'password' && (
                <div className="animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">

                    {/* HEADER */}
                    <div className="flex items-start gap-4 mb-8 pb-6 border-b border-slate-100">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">Security Settings</h2>
                        <p className="text-sm text-slate-500 mt-1">
                          {user?.has_password ? 'Keep your account secure. Use a strong password with at least 6 characters.' : 'Set a password for your account to enable password-based login.'}
                        </p>
                        <p className="text-xs text-slate-400 mt-2 truncate">
                          {user?.email}
                        </p>
                        <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-indigo-500 hover:text-indigo-600 font-medium">
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    {/* CREATE PASSWORD (for Google users without password) */}
                    {!user?.has_password && (
                      <form onSubmit={handleCreatePassword} className="max-w-lg space-y-5">
                        {['newPassword', 'confirmPassword'].map((field, idx) => {
                          const labels = { newPassword: 'New Password', confirmPassword: 'Confirm Password' };
                          const placeholders = { newPassword: 'Enter your new password', confirmPassword: 'Confirm your password' };
                          return (
                            <div key={field} className="space-y-1.5">
                              <label className="block text-sm font-bold text-slate-700">{labels[field]}</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {idx === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />}
                                    {idx === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                                  </svg>
                                </div>
                                <PasswordInput
                                  value={createPasswordForm[field]}
                                  onChange={e => setCreatePasswordForm(p => ({ ...p, [field]: e.target.value }))}
                                  placeholder={placeholders[field]}
                                  required
                                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm font-medium transition-all hover:border-slate-300 bg-slate-50"
                                />
                              </div>
                            </div>
                          );
                        })}

                        {createPasswordMsg && (
                          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
                            createPasswordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                            <span>{createPasswordMsg.type === 'success' ? '\u2705' : '\u274c'}</span> {createPasswordMsg.text}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={createPasswordLoading}
                          className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {createPasswordLoading ? (
                            <>
                              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                              Creating Password...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                              Create Password
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* CHANGE PASSWORD (for users with password) */}
                    {user?.has_password && (
                      <>
                        <form onSubmit={handleResetPassword} className="max-w-lg space-y-5">

                          {/* Current Password (disabled when OTP-verified) */}
                          <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-700">
                              {otpStep === 2 ? 'Current Password' : 'Current Password'}
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                {otpStep === 2 ? (
                                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                ) : (
                                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                )}
                              </div>
                              <PasswordInput
                                value={otpStep === 2 ? '' : passwordForm.currentPassword}
                                disabled={otpStep === 2}
                                placeholder={otpStep === 2 ? 'Verified via OTP' : 'Enter current password'}
                                className={`w-full pl-12 pr-4 py-3 border rounded-xl text-sm font-medium transition-all bg-slate-50 ${
                                  otpStep === 2
                                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-700 cursor-not-allowed'
                                    : 'border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 hover:border-slate-300'
                                }`}
                              />
                              {otpStep === 2 && (
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                                    Verified &#10003;
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Verify via OTP link / OTP input area */}
                          {otpStep === 0 && (
                            <div className="flex items-center justify-end">
                              <button type="button" onClick={handleSendPasswordOtp} disabled={otpLoading}
                                className="text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                              >
                                {otpLoading ? 'Sending OTP...' : 'Verify via OTP instead'}
                              </button>
                            </div>
                          )}

                          {otpStep >= 1 && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-indigo-700">
                                  {otpStep === 1 ? 'Enter the OTP sent to your email' : 'Identity verified'}
                                </p>
                                {otpStep === 2 && (
                                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">Verified</span>
                                )}
                              </div>
                              {otpStep === 1 && (
                                <div className="flex gap-2">
                                  <input
                                    type="text" maxLength={6}
                                    value={otpCode}
                                    onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg text-center text-lg font-bold tracking-[6px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm bg-white"
                                    autoFocus
                                  />
                                  <button type="button" onClick={handleVerifyPasswordOtp} disabled={otpLoading || otpCode.length !== 6}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                                  >
                                    {otpLoading ? '...' : 'Verify'}
                                  </button>
                                  <button type="button" onClick={() => { setOtpStep(0); setOtpCode(''); setPasswordMsg(null); }}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 hover:bg-white transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* New Password */}
                          <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-700">New Password</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                              </div>
                              <PasswordInput
                                value={passwordForm.newPassword}
                                onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                                placeholder="Enter new password"
                                required
                                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm font-medium transition-all hover:border-slate-300 bg-slate-50"
                              />
                            </div>
                          </div>

                          {/* Confirm Password */}
                          <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-700">Confirm New Password</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </div>
                              <PasswordInput
                                value={passwordForm.confirmPassword}
                                onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                placeholder="Confirm new password"
                                required
                                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm font-medium transition-all hover:border-slate-300 bg-slate-50"
                              />
                            </div>
                          </div>

                          {passwordMsg && (
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
                              passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                            }`}>
                              <span>{passwordMsg.type === 'success' ? '\u2705' : '\u274c'}</span> {passwordMsg.text}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={passwordLoading}
                            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {passwordLoading ? (
                              <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                Updating Password...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Update Password
                              </>
                            )}
                          </button>
                        </form>

                        <div className="relative my-8 max-w-lg">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-white px-4 text-xs font-medium text-slate-400">OR</span>
                          </div>
                        </div>

                        <div className="max-w-lg">
                          <h3 className="text-sm font-bold text-slate-700 mb-2">Forgot your password?</h3>
                          <p className="text-sm text-slate-500 mb-4">Reset your password using OTP sent to your registered email.</p>
                          <button
                            onClick={() => setShowForgotPassword(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 rounded-xl text-sm font-bold text-slate-600 transition-all duration-200 hover:shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                            Reset via Email OTP
                          </button>
                        </div>
                      </>
                    )}

                  </div>
                </div>
              )}

              {/* ===== SUPPORT TAB ===== */}
              {activeTab === 'contact' && (
                <div className="space-y-6 animate-fadeIn">

                  {/* SUPPORT STATS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                        label: 'Email Support',
                        value: 'support@neurodesk.app',
                        gradient: 'from-blue-50 to-indigo-50',
                        iconBg: 'bg-blue-100 text-blue-600',
                        border: 'border-blue-100',
                      },
                      {
                        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                        label: 'Response Time',
                        value: 'Within 24 hours',
                        gradient: 'from-orange-50 to-amber-50',
                        iconBg: 'bg-orange-100 text-orange-600',
                        border: 'border-orange-100',
                      },
                      {
                        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
                        label: 'Availability',
                        value: 'Mon\u2013Fri, 9am\u20136pm',
                        gradient: 'from-emerald-50 to-green-50',
                        iconBg: 'bg-emerald-100 text-emerald-600',
                        border: 'border-emerald-100',
                      },
                    ].map((item, i) => (
                      <div key={i} className={`bg-gradient-to-br ${item.gradient} rounded-xl p-5 border ${item.border} shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-center group cursor-pointer`}>
                        <div className={`w-11 h-11 ${item.iconBg} rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform duration-200 group-hover:scale-110 shadow-sm`}>
                          {item.icon}
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-sm font-bold text-slate-700">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* CONTACT FORM */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                    <div className="flex items-start gap-4 mb-8 pb-6 border-b border-slate-100">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">Get in Touch</h2>
                        <p className="text-sm text-slate-500 mt-1">Have a question or feedback? Our support team is here to help.</p>
                      </div>
                    </div>

                    <form onSubmit={handleContact} className="max-w-lg space-y-5">
                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-slate-700">Subject</label>
                        <input
                          type="text"
                          value={contactForm.subject}
                          onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))}
                          placeholder="What can we help you with?"
                          required
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm font-medium transition-all hover:border-slate-300 bg-slate-50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-slate-700">Message</label>
                        <textarea
                          value={contactForm.message}
                          onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                          placeholder="Describe your issue or feedback in detail..."
                          rows={5}
                          required
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm font-medium resize-none transition-all hover:border-slate-300 bg-slate-50"
                        />
                      </div>

                      {contactMsg && (
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold ${
                          contactMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                          <span>{contactMsg.type === 'success' ? '\u2705' : '\u274c'}</span> {contactMsg.text}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={contactLoading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-lg hover:shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {contactLoading ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            Sending Message...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            Send Message
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ===== DANGER ZONE TAB ===== */}
              {activeTab === 'danger' && (
                <div className="animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8">
                    <div className="flex items-start gap-4 mb-8 pb-6 border-b border-red-100">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">Danger Zone</h2>
                        <p className="text-sm text-slate-500 mt-1">These actions are permanent and cannot be undone. Proceed with caution.</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200 p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-red-700 mb-2">Delete Account Permanently</h3>
                          <p className="text-sm text-red-600 leading-relaxed mb-4">This will permanently delete your account and all associated data including notes, tasks, files, memories, and goals. This action is irreversible.</p>
                          <ul className="space-y-2 mb-4">
                            {[
                              'All your notes and tasks will be deleted',
                              'Your files and memories will be removed',
                              'Your goals and progress will be lost',
                              'This action is irreversible',
                            ].map((item, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs text-red-600 font-medium">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                {item}
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-lg hover:shadow-red-200 inline-flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete My Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} initialEmail={user?.email || ''} />}

      {/* DELETE CONFIRM MODAL */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { setShowDeleteModal(false); setDeleteError(''); }}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-orange-100 rounded-xl flex items-center justify-center mx-auto mb-5 border-2 border-red-200">
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 text-center mb-2">Delete Account?</h2>
            <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
              This action is <span className="font-bold text-red-600">permanent and irreversible</span>. All your data will be deleted forever.
            </p>

            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
              <p className="text-xs font-bold text-red-600 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                What will be deleted:
              </p>
              <ul className="space-y-1.5">
                {['All notes and tasks', 'Files and documents', 'Memories and goals', 'Account settings'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-red-600 font-medium">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Enter your password to confirm
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <PasswordInput
                    value={deletePassword}
                    onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-4 py-3 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 text-sm font-medium transition-all bg-slate-50"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Type <span className="font-mono bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200 text-xs">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => { setDeleteConfirm(e.target.value); setDeleteError(''); }}
                  placeholder="Type DELETE in capital letters"
                  className="w-full px-4 py-3 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 text-sm font-medium transition-all bg-slate-50"
                />
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); setDeletePassword(''); setDeleteError(''); }}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || !deletePassword.trim() || deleteLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-lg hover:shadow-red-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    Deleting...
                  </>
                ) : 'Yes, Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}
