import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';

export default function Analytics() {
  const { user, logout } = useAuth();
  const { notifications, clearNotifications } = useNotifications();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [memories, setMemories] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    api.get('/analytics').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [tasksRes, notesRes, goalsRes, memoriesRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/notes'),
        api.get('/goals'),
        api.get('/memories'),
      ]);
      setTasks(tasksRes.data);
      setNotes(notesRes.data);
      setGoals(goalsRes.data);
      setMemories(memoriesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    const results = [];
    tasks.forEach(t => {
      if (t.title?.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))
        results.push({ type: 'Task', icon: '✅', title: t.title, sub: t.priority + ' priority', color: 'text-indigo-600 bg-indigo-50' });
    });
    notes.forEach(n => {
      if (n.title?.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q))
        results.push({ type: 'Note', icon: '📝', title: n.title, sub: n.content?.substring(0, 40) || '', color: 'text-orange-600 bg-orange-50' });
    });
    goals.forEach(g => {
      if (g.title?.toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q))
        results.push({ type: 'Goal', icon: '🎯', title: g.title, sub: g.progress + '% complete', color: 'text-teal-600 bg-teal-50' });
    });
    memories.forEach(m => {
      if (m.label?.toLowerCase().includes(q) || m.value?.toLowerCase().includes(q))
        results.push({ type: 'Memory', icon: '🔐', title: m.label, sub: m.type === 'password' ? '••••••••' : m.value?.substring(0, 40), color: 'text-blue-600 bg-blue-50' });
    });
    setSearchResults(results);
  }, [searchQuery, tasks, notes, goals, memories]);

  const navLinks = [
    { to: '/app/dashboard', label: 'Home', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
    { to: '/app/tasks', label: 'Tasks', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> },
    { to: '/app/notes', label: 'Notes', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
    { to: '/app/files', label: 'Files', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /> },
    { to: '/app/memory', label: 'Memory', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
    { to: '/app/goals', label: 'Goals', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /> },
  ];

  const SkeletonCard = () => (
    <div className="bg-white rounded-[20px] p-6 border border-slate-100 animate-pulse">
      <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
      <div className="h-8 bg-slate-100 rounded w-1/3 mb-2" />
      <div className="h-2 bg-slate-100 rounded w-2/3" />
    </div>
  );

  // Bar chart max value
  const maxBar = data ? Math.max(...data.weeklyData.map(d => Math.max(d.created, d.completed, d.notes, 1))) : 1;

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-[260px] bg-white h-full flex flex-col border-r border-slate-100 flex-shrink-0 z-10">
        <div className="p-8 flex items-center gap-3">
          <svg className="w-8 h-8 text-[#5A67D8]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
          <span className="font-bold text-[19px] text-slate-800 tracking-tight">NeuroDesk</span>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navLinks.map(({ to, label, icon }) => (
            <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
              {label}
            </Link>
          ))}
          <Link to="/app/analytics" className="flex items-center gap-3 px-4 py-3 bg-[#F4F4FF] text-[#5A67D8] rounded-xl font-bold text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Analytics
          </Link>
        </nav>
        <div className="p-3 m-4 border border-slate-100 rounded-2xl flex items-center gap-3">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} alt="" className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{user?.name || 'User'}</p>
            <p className="text-xs font-semibold text-slate-400">Free plan</p>
          </div>
          <button onClick={logout} title="Logout" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 h-full overflow-y-auto p-8">
        <div className="max-w-[1200px] mx-auto pb-24">

          {/* HEADER */}
          <header className="flex justify-between items-center mb-10">
            {/* Search */}
            <div className="flex items-center gap-2">
              {searchOpen && (
                <div className="relative w-[380px] animate-[slideIn_0.3s_ease-out]">
                  <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    type="text"
                    placeholder="Search anything..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:border-indigo-500 shadow-sm"
                    autoFocus
                  />

                  {searchFocused && searchQuery.trim() && (
                    <div className="absolute top-12 left-0 w-full bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                      {searchResults.length > 0 ? (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase px-4 pt-3 pb-1">{searchResults.length} result{searchResults.length > 1 ? 's' : ''} found</p>
                          {searchResults.slice(0, 8).map((r, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.color}`}>{r.type}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
                                {r.sub && <p className="text-[11px] text-slate-400 truncate">{r.sub}</p>}
                              </div>
                            </div>
                          ))}
                          {searchResults.length > 8 && (
                            <p className="text-[11px] text-slate-400 text-center py-2">+{searchResults.length - 8} more results</p>
                          )}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <p className="text-sm font-medium text-slate-500">No results for "{searchQuery}"</p>
                          <p className="text-xs text-slate-400 mt-1">Try searching tasks, notes, goals or memories</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => { setSearchOpen(o => !o); if (searchOpen) { setSearchQuery(''); setSearchResults([]); } }}
                className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border shadow-sm transition-colors ${searchOpen ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>
            
            {/* Actions & Profile */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 ml-2">
                <div className="relative">
                  <button
                    onClick={() => setNotificationOpen(o => !o)}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 shadow-sm relative"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {notifications.length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>}
                  </button>

                  {notificationOpen && (
                    <div className="absolute top-12 right-0 w-[380px] bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400">{notifications.length} new</span>
                          {notifications.length > 0 && (
                            <button
                              onClick={() => { clearNotifications(); setNotificationOpen(false); }}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((n, i) => {
                            const timeAgo = Math.floor((new Date() - n.time) / 60000);
                            const timeStr = timeAgo < 1 ? 'Just now' : timeAgo < 60 ? `${timeAgo}m ago` : timeAgo < 1440 ? `${Math.floor(timeAgo / 60)}h ago` : `${Math.floor(timeAgo / 1440)}d ago`;
                            return (
                              <div key={i} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer">
                                <div className="flex items-start gap-3">
                                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${n.color} flex-shrink-0`}>{n.type}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{n.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{n.sub}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-medium">{timeStr}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-4 py-8 text-center">
                            <p className="text-sm font-medium text-slate-500">No notifications</p>
                            <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} alt="Profile" className="w-10 h-10 rounded-full ml-1" />
              </div>
            </div>
          </header>

          {/* WELCOME */}
          <div className="mb-10">
            <h1 className="text-[28px] font-bold text-slate-800 mb-2 flex items-center gap-2">
              Analytics <span className="text-2xl">📊</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Your productivity mirror — see how you're really performing</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : !data ? (
            <div className="text-center py-24 text-slate-400">Failed to load analytics. Please refresh.</div>
          ) : (
            <>
              {/* ── OVERVIEW CARDS ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Tasks', value: data.overview.totalTasks, icon: '📋', color: 'bg-blue-50 text-blue-700', bar: null },
                  { label: 'Completed', value: data.overview.completedTasks, icon: '✅', color: 'bg-green-50 text-green-700', bar: null },
                  { label: 'Pending', value: data.overview.pendingTasks, icon: '⏳', color: 'bg-orange-50 text-orange-700', bar: null },
                  { label: 'Productivity', value: `${data.overview.productivityPct}%`, icon: '⚡', color: 'bg-indigo-50 text-indigo-700', bar: data.overview.productivityPct },
                  { label: 'Active Goals', value: data.overview.activeGoals, icon: '🎯', color: 'bg-teal-50 text-teal-700', bar: null },
                  { label: 'Goals Done', value: data.overview.completedGoals, icon: '🏆', color: 'bg-yellow-50 text-yellow-700', bar: null },
                  { label: 'Notes', value: data.overview.totalNotes, icon: '📝', color: 'bg-pink-50 text-pink-700', bar: null },
                  { label: 'Memories', value: data.overview.totalMemories, icon: '🧠', color: 'bg-purple-50 text-purple-700', bar: null },
                ].map(card => (
                  <div key={card.label} className={`${card.color} rounded-[20px] p-5 flex flex-col gap-2 hover:shadow-xl hover:scale-[1.05] hover:-translate-y-1 transition-all duration-300 cursor-pointer`}>
                    <span className="text-2xl">{card.icon}</span>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs font-semibold opacity-70">{card.label}</p>
                    {card.bar !== null && (
                      <div className="w-full h-1.5 bg-white/50 rounded-full mt-1">
                        <div className="h-full rounded-full bg-current opacity-60 transition-all duration-700" style={{ width: `${card.bar}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ── STREAK + WEEKLY REPORT ── */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Streak */}
                <div className="bg-white rounded-[20px] border border-slate-100 p-6 flex items-center gap-6 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 hover:border-orange-200 transition-all duration-300 cursor-pointer">
                  <div className="text-5xl">🔥</div>
                  <div>
                    <p className="text-4xl font-bold text-slate-800">{data.streak.current}</p>
                    <p className="text-sm font-bold text-slate-500 mt-1">Day Streak</p>
                    <p className="text-xs text-slate-400 mt-1">Longest: {data.streak.longest} days</p>
                    {data.streak.current >= 3 && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-bold rounded-full">🔥 On Fire!</span>
                    )}
                  </div>
                </div>

                {/* Weekly report */}
                <div className="bg-white rounded-[20px] border border-slate-100 p-6 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 cursor-pointer">
                  <p className="text-sm font-bold text-slate-700 mb-4">This Week vs Last Week</p>
                  <div className="flex items-end gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-indigo-600">{data.weeklyReport.thisWeekCompleted}</p>
                      <p className="text-xs text-slate-400 font-semibold mt-1">This Week</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-slate-400">{data.weeklyReport.lastWeekCompleted}</p>
                      <p className="text-xs text-slate-400 font-semibold mt-1">Last Week</p>
                    </div>
                    <div className={`ml-auto px-3 py-1.5 rounded-xl text-sm font-bold ${data.weeklyReport.weeklyChange >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {data.weeklyReport.weeklyChange >= 0 ? '↑' : '↓'} {Math.abs(data.weeklyReport.weeklyChange)}%
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    {data.weeklyReport.weeklyChange > 0
                      ? `You completed ${data.weeklyReport.weeklyChange}% more tasks than last week! 🎉`
                      : data.weeklyReport.weeklyChange < 0
                      ? `Completed ${Math.abs(data.weeklyReport.weeklyChange)}% fewer tasks than last week. Let's improve!`
                      : 'Same performance as last week. Push a little harder!'}
                  </p>
                </div>
              </div>

              {/* ── WEEKLY PERFORMANCE GRAPH ── */}
              <div className="bg-white rounded-[20px] border border-slate-100 p-6 mb-8 hover:shadow-xl hover:border-indigo-200 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-base font-bold text-slate-800">📈 Weekly Performance</p>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-400 inline-block" />Tasks Created</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" />Completed</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-pink-400 inline-block" />Notes</span>
                  </div>
                </div>
                <div className="flex items-end gap-3 h-40">
                  {data.weeklyData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end gap-0.5 h-32">
                        {/* Tasks created */}
                        <div className="flex-1 bg-indigo-100 rounded-t-md transition-all duration-700 hover:bg-indigo-300 hover:scale-110 relative group"
                          style={{ height: `${Math.max(4, (d.created / maxBar) * 100)}%` }}>
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100">{d.created}</span>
                        </div>
                        {/* Completed */}
                        <div className="flex-1 bg-green-100 rounded-t-md transition-all duration-700 hover:bg-green-300 hover:scale-110 relative group"
                          style={{ height: `${Math.max(4, (d.completed / maxBar) * 100)}%` }}>
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-green-600 opacity-0 group-hover:opacity-100">{d.completed}</span>
                        </div>
                        {/* Notes */}
                        <div className="flex-1 bg-pink-100 rounded-t-md transition-all duration-700 hover:bg-pink-300 hover:scale-110 relative group"
                          style={{ height: `${Math.max(4, (d.notes / maxBar) * 100)}%` }}>
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-pink-600 opacity-0 group-hover:opacity-100">{d.notes}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── GOAL ANALYTICS ── */}
              {data.goalAnalytics.length > 0 && (
                <div className="bg-white rounded-[20px] border border-slate-100 p-6 mb-8 hover:shadow-xl hover:border-teal-200 transition-all duration-300">
                  <p className="text-base font-bold text-slate-800 mb-5">🎯 Goal Analytics</p>
                  <div className="space-y-5">
                    {data.goalAnalytics.map(g => (
                      <div key={g.id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-800">{g.title}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${g.status === 'completed' ? 'bg-green-100 text-green-700' : g.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'}`}>
                              {g.status}
                            </span>
                            {g.status === 'active' && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${g.isOnTrack ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                {g.isOnTrack ? '✅ On Track' : '⚠️ Behind'}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-slate-700">{g.progress}%</span>
                        </div>

                        {/* Task progress bar */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] text-slate-400 font-semibold w-16">Progress</span>
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${g.progress}%`, background: g.progress === 100 ? '#22c55e' : 'linear-gradient(90deg,#5A67D8,#818cf8)' }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 w-8">{g.progress}%</span>
                        </div>

                        {/* Time progress bar */}
                        {g.daysLeft !== null && (
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] text-slate-400 font-semibold w-16">Time</span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${g.timeProgress}%`, background: g.daysLeft < 0 ? '#ef4444' : g.timeProgress > 80 ? '#f97316' : '#94a3b8' }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 w-8">{g.timeProgress}%</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 font-semibold">
                          {g.stepsTotal > 0 && <span>📌 {g.stepsCompleted}/{g.stepsTotal} steps</span>}
                          {g.daysLeft !== null && (
                            <span className={g.daysLeft < 0 ? 'text-red-500' : g.daysLeft <= 7 ? 'text-orange-500' : ''}>
                              {g.daysLeft < 0 ? `⏰ ${Math.abs(g.daysLeft)}d overdue` : g.daysLeft === 0 ? '⏰ Due today' : `📅 ${g.daysLeft}d left`}
                            </span>
                          )}
                          {!g.isOnTrack && g.status === 'active' && g.expectedProgress > 0 && (
                            <span className="text-red-400">Expected: ~{g.expectedProgress}%</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PRIORITY BREAKDOWN + AI INSIGHTS ── */}
              <div className="grid grid-cols-[1fr_1.4fr] gap-4 mb-8">
                {/* Priority breakdown */}
                <div className="bg-white rounded-[20px] border border-slate-100 p-6 hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-300 cursor-pointer">
                  <p className="text-base font-bold text-slate-800 mb-5">📊 Task Priority</p>
                  <div className="space-y-4">
                    {[
                      { label: 'High', count: data.priorityBreakdown.high, color: 'bg-red-400', light: 'bg-red-50 text-red-600' },
                      { label: 'Medium', count: data.priorityBreakdown.medium, color: 'bg-orange-400', light: 'bg-orange-50 text-orange-600' },
                      { label: 'Low', count: data.priorityBreakdown.low, color: 'bg-green-400', light: 'bg-green-50 text-green-600' },
                    ].map(p => {
                      const pct = data.overview.totalTasks > 0 ? Math.round((p.count / data.overview.totalTasks) * 100) : 0;
                      return (
                        <div key={p.label} className="hover:scale-[1.02] transition-transform duration-200">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.light} border`}>{p.label}</span>
                            <span className="text-xs font-bold text-slate-500">{p.count} tasks ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${p.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Insights */}
                <div className="bg-gradient-to-br from-[#F4F4FF] to-[#EEF2FF] rounded-[20px] border border-indigo-100 p-6 hover:shadow-xl hover:border-indigo-300 hover:scale-[1.01] transition-all duration-300 cursor-pointer">
                  <p className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                    🤖 AI Insights
                    <span className="text-xs font-semibold text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">Powered by AI</span>
                  </p>
                  <p className="text-xs text-slate-400 mb-5">Personalized analysis based on your data</p>
                  <div className="space-y-3">
                    {data.aiInsights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/70 rounded-xl p-3 hover:bg-white hover:shadow-md hover:scale-[1.02] transition-all duration-200">
                        <span className="text-lg flex-shrink-0">{['💡', '🔥', '🎯'][i] || '✨'}</span>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── PRODUCTIVITY SCORE BANNER ── */}
              <div className={`rounded-[20px] p-6 flex items-center gap-6 hover:shadow-xl hover:scale-[1.01] hover:-translate-y-1 transition-all duration-300 cursor-pointer ${data.overview.productivityPct >= 70 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 hover:border-green-300' : data.overview.productivityPct >= 40 ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-100 hover:border-orange-300' : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 hover:border-red-300'}`}>
                <div className="text-5xl">
                  {data.overview.productivityPct >= 70 ? '🚀' : data.overview.productivityPct >= 40 ? '💪' : '📈'}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-slate-800">
                    {data.overview.productivityPct >= 70
                      ? `You're crushing it, ${user?.name?.split(' ')[0] || 'there'}! 🎉`
                      : data.overview.productivityPct >= 40
                      ? `Good progress, ${user?.name?.split(' ')[0] || 'there'}! Keep going 💪`
                      : `Let's get moving, ${user?.name?.split(' ')[0] || 'there'}! 🚀`}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {`You completed ${data.overview.productivityPct}% of your tasks. `}
                    {data.overview.productivityPct >= 70
                      ? 'Excellent consistency — you\'re in the top performer zone!'
                      : data.overview.productivityPct >= 40
                      ? 'Try completing 2-3 more tasks today to push past 70%.'
                      : 'Start with your easiest task to build momentum.'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-4xl font-bold text-slate-800">{data.overview.productivityPct}%</p>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Productivity Score</p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
