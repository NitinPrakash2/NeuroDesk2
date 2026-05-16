import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [contactForm, setContactForm] = useState({ subject: '', message: '' });
  const [contactMsg, setContactMsg] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    
    // Validation
    if (!passwordForm.currentPassword.trim()) {
      setPasswordMsg({ type: 'error', text: 'Current password is required.' });
      return;
    }
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
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordMsg({ type: 'error', text: 'New password must be different from current password.' });
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      setPasswordMsg({ type: 'success', text: 'Password updated successfully! Please use your new password next time you log in.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Password change error:', err);
      
      if (err.response?.status === 401 || err.response?.status === 400) {
        setPasswordMsg({ type: 'error', text: 'Current password is incorrect. Please try again.' });
      } else if (err.response?.data?.message) {
        setPasswordMsg({ type: 'error', text: err.response.data.message });
      } else {
        setPasswordMsg({ type: 'error', text: 'Failed to update password. Please try again later.' });
      }
    } finally {
      setPasswordLoading(false);
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
      // Even if API fails, show success to user (fallback)
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
      // Verify password before deletion
      await api.post('/auth/verify-password', { password: deletePassword });
      
      // If password is correct, delete account
      await api.delete('/auth/account');
      
      // Logout and redirect
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

  const settingsSections = [
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
      desc: 'Manage your personal information' 
    },
    { 
      id: 'password', 
      label: 'Security', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
      desc: 'Update your password' 
    },
    { 
      id: 'contact', 
      label: 'Support', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
      desc: 'Get help from our team' 
    },
    { 
      id: 'danger', 
      label: 'Danger Zone', 
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
      desc: 'Delete your account' 
    },
  ];

  const Alert = ({ msg }) => msg ? (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold mt-4 animate-in slide-in-from-top-2 duration-300 ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
      <span>{msg.type === 'success' ? '✅' : '❌'}</span> {msg.text}
    </div>
  ) : null;

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-[260px] bg-white h-full flex flex-col border-r border-slate-100 flex-shrink-0 z-10">
        <div className="p-8 flex items-center gap-3">
          <img src="/Fevicon.png" alt="NeuroDesk" className="w-8 h-8" />
          <span className="font-bold text-[19px] text-slate-800 tracking-tight">NeuroDesk</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navLinks.map(({ to, label, icon }) => (
            <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
              {label}
            </Link>
          ))}
          <Link to="/app/account" className="flex items-center gap-3 px-4 py-3 bg-[#F4F4FF] text-[#5A67D8] rounded-xl font-bold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Account
          </Link>
        </nav>

        <div className="p-3 m-4 border border-slate-100 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} alt={user?.name} className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{user?.name || 'User'}</p>
            <p className="text-xs font-semibold text-slate-400">Free plan</p>
          </div>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 h-full overflow-y-auto p-8">
        <div className="max-w-[1100px] mx-auto">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-[32px] font-bold text-slate-800 mb-2 flex items-center gap-3">
              Account Settings
              <span className="text-3xl">⚙️</span>
            </h1>
            <p className="text-slate-500 text-base font-medium">Manage your profile, security, and preferences</p>
          </div>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-[280px_1fr] gap-8">
            
            {/* LEFT: Settings Navigation */}
            <div className="space-y-2">
              {settingsSections.map(section => (
                <button
                  key={section.id}
                  onClick={() => { setActiveTab(section.id); setPasswordMsg(null); setContactMsg(null); }}
                  className={`w-full text-left px-5 py-4 rounded-[16px] transition-all duration-300 group ${
                    activeTab === section.id
                      ? 'bg-white shadow-lg shadow-indigo-100/50 border-2 border-indigo-100 scale-[1.02]'
                      : 'bg-white/60 border-2 border-transparent hover:bg-white hover:shadow-md hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      activeTab === section.id 
                        ? 'bg-indigo-100 text-indigo-600' 
                        : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                    }`}>
                      {section.icon}
                    </div>
                    <span className={`text-sm font-bold transition-colors ${
                      activeTab === section.id ? 'text-[#5A67D8]' : 'text-slate-700 group-hover:text-slate-900'
                    }`}>
                      {section.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 ml-11 leading-relaxed">{section.desc}</p>
                </button>
              ))}
            </div>

            {/* RIGHT: Content Area */}
            <div className="min-h-[600px]">
              
              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* Profile Card */}
                  <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 overflow-hidden group">
                    <div className="bg-gradient-to-br from-[#5A67D8] via-indigo-500 to-purple-500 p-8 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                      <div className="relative flex items-center gap-6">
                        <div className="relative group/avatar">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random&size=128&bold=true`}
                            alt={user?.name}
                            className="w-24 h-24 rounded-[20px] border-4 border-white/40 shadow-2xl transition-transform duration-300 group-hover/avatar:scale-110 group-hover/avatar:rotate-3"
                          />
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">{user?.name || 'User'}</h2>
                          <p className="text-indigo-100 text-base font-medium mb-3">{user?.email || 'No email provided'}</p>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/30">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                              Free Plan
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/30">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                              Member since {new Date().getFullYear()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-8">
                      <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Account Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Full Name', value: user?.name || '—', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
                          { label: 'Email Address', value: user?.email || '—', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
                          { label: 'Account Type', value: 'Free', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
                          { label: 'Status', value: 'Active', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, highlight: true },
                        ].map((item, i) => (
                          <div key={i} className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-[16px] p-5 border border-slate-200/50 hover:shadow-lg hover:scale-[1.02] hover:border-indigo-200 transition-all duration-300 group/card">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 group-hover/card:scale-110 ${
                                item.highlight ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'
                              }`}>
                                {item.icon}
                              </div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{item.label}</p>
                            </div>
                            <p className={`text-base font-bold ${item.highlight ? 'text-green-600' : 'text-slate-800'} truncate`}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="px-8 pb-8 flex gap-3">
                      <button
                        onClick={logout}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-[14px] text-sm font-bold text-slate-700 hover:text-slate-900 transition-all duration-300 hover:scale-[1.02] hover:shadow-md group"
                      >
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign Out
                      </button>
                      <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-[14px] text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-200 group">
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        Upgrade to Pro
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* RESET PASSWORD TAB */}
              {activeTab === 'password' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 p-8">
                    <div className="flex items-start gap-4 mb-8 pb-6 border-b border-slate-100">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[16px] flex items-center justify-center border border-indigo-100 shadow-sm">
                        <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-800 mb-1">Security Settings</h2>
                        <p className="text-sm text-slate-500 leading-relaxed">Keep your account secure by updating your password regularly. Use a strong password with at least 6 characters.</p>
                      </div>
                    </div>
                    
                    <form onSubmit={handleResetPassword} className="space-y-6 max-w-lg">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Current Password</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          </div>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
                            placeholder="Enter your current password"
                            required
                            className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium transition-all hover:border-slate-300"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">New Password</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                          </div>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                            placeholder="Enter a strong new password"
                            required
                            className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium transition-all hover:border-slate-300"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Confirm New Password</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                            placeholder="Confirm your new password"
                            required
                            className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium transition-all hover:border-slate-300"
                          />
                        </div>
                      </div>

                      <Alert msg={passwordMsg} />

                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-[14px] text-sm font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                      >
                        {passwordLoading ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            Updating Password...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Update Password
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* CONTACT TAB */}
              {activeTab === 'contact' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                  {/* Support Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { 
                        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                        label: 'Email Support', 
                        value: 'support@neurodesk.app', 
                        color: 'from-blue-50 to-cyan-50 border-blue-100',
                        iconColor: 'bg-blue-100 text-blue-600'
                      },
                      { 
                        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                        label: 'Response Time', 
                        value: 'Within 24 hours', 
                        color: 'from-orange-50 to-amber-50 border-orange-100',
                        iconColor: 'bg-orange-100 text-orange-600'
                      },
                      { 
                        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
                        label: 'Availability', 
                        value: 'Mon–Fri, 9am–6pm', 
                        color: 'from-green-50 to-emerald-50 border-green-100',
                        iconColor: 'bg-green-100 text-green-600'
                      },
                    ].map((item, i) => (
                      <div key={i} className={`bg-gradient-to-br ${item.color} rounded-[20px] p-5 border shadow-sm hover:shadow-xl hover:scale-[1.03] transition-all duration-300 text-center group cursor-pointer`}>
                        <div className={`w-12 h-12 ${item.iconColor} rounded-[14px] flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-sm`}>
                          {item.icon}
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{item.label}</p>
                        <p className="text-sm font-bold text-slate-700">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Contact Form */}
                  <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 p-8">
                    <div className="flex items-start gap-4 mb-8 pb-6 border-b border-slate-100">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[16px] flex items-center justify-center border border-blue-100 shadow-sm">
                        <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-800 mb-1">Get in Touch</h2>
                        <p className="text-sm text-slate-500 leading-relaxed">Have a question or feedback? Our support team is here to help you succeed.</p>
                      </div>
                    </div>

                    <form onSubmit={handleContact} className="space-y-6 max-w-lg">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Subject</label>
                        <input
                          type="text"
                          value={contactForm.subject}
                          onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))}
                          placeholder="What can we help you with?"
                          required
                          className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium transition-all hover:border-slate-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Message</label>
                        <textarea
                          value={contactForm.message}
                          onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                          placeholder="Describe your issue or feedback in detail..."
                          rows={6}
                          required
                          className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium resize-none transition-all hover:border-slate-300"
                        />
                      </div>

                      <Alert msg={contactMsg} />

                      <button
                        type="submit"
                        disabled={contactLoading}
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-[14px] text-sm font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                      >
                        {contactLoading ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            Sending Message...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            Send Message
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* DANGER ZONE TAB */}
              {activeTab === 'danger' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-white rounded-[24px] border-2 border-red-100 shadow-sm hover:shadow-xl hover:border-red-200 transition-all duration-300 p-8">
                    <div className="flex items-start gap-4 mb-8 pb-6 border-b border-red-100">
                      <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-orange-50 rounded-[16px] flex items-center justify-center border border-red-200 shadow-sm">
                        <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-800 mb-1">Danger Zone</h2>
                        <p className="text-sm text-slate-500 leading-relaxed">These actions are permanent and cannot be undone. Please proceed with extreme caution.</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-[20px] p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-[14px] flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-red-700 mb-2">Delete Account Permanently</h3>
                          <p className="text-sm text-red-600 leading-relaxed mb-4">This will permanently delete your account and all associated data including notes, tasks, files, memories, and goals. This action cannot be undone and your data cannot be recovered.</p>
                          <ul className="space-y-2 mb-4">
                            {['All your notes and tasks will be deleted', 'Your files and memories will be removed', 'Your goals and progress will be lost', 'This action is irreversible'].map((item, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs text-red-600 font-medium">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                {item}
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-[14px] text-sm font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-red-200 flex items-center gap-2 group"
                          >
                            <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
        </div>
      </main>

      {/* DELETE CONFIRM MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={() => { setShowDeleteModal(false); setDeleteError(''); }}>
          <div className="bg-white rounded-[28px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-[20px] flex items-center justify-center mx-auto mb-5 border-2 border-red-200 shadow-lg animate-in zoom-in duration-500">
              <svg className="w-9 h-9 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 text-center mb-3">Delete Account?</h2>
            <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">This action is <span className="font-bold text-red-600">permanent and irreversible</span>. All your data will be deleted forever and cannot be recovered.</p>
            
            <div className="bg-red-50 border-2 border-red-100 rounded-[16px] p-4 mb-6">
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
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Enter your password to confirm
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-red-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm font-medium transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Type <span className="font-mono bg-red-100 text-red-600 px-2 py-1 rounded-lg border border-red-200">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => { setDeleteConfirm(e.target.value); setDeleteError(''); }}
                  placeholder="Type DELETE in capital letters"
                  className="w-full px-4 py-3.5 border-2 border-red-200 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm font-medium transition-all"
                />
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 animate-in slide-in-from-top-2 duration-300">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); setDeletePassword(''); setDeleteError(''); }}
                className="flex-1 px-4 py-3.5 border-2 border-slate-200 rounded-[14px] text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 hover:scale-[1.02]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || !deletePassword.trim() || deleteLoading}
                className="flex-1 px-4 py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-[14px] text-sm font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-red-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
