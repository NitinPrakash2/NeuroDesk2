import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Analytics() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatClosing, setIsChatClosing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.get('/analytics').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setChatLoading(true);
    setChatMessages(prev => [...prev, { role: 'assistant', content: 'Thinking...' }]);
    try {
      const res = await api.post('/ai/chat', { message: userMessage });
      const reply = res.data.response || res.data.message;
      setChatMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: 'assistant', content: reply };
        return msgs;
      });
    } catch {
      setChatMessages(prev => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' };
        return msgs;
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleCloseChat = () => {
    setIsChatClosing(true);
    setTimeout(() => { setIsChatOpen(false); setIsChatClosing(false); }, 300);
  };

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
        <div className="max-w-[960px] mx-auto pb-16">

          {/* HEADER */}
          <div className="mb-10">
            <h1 className="text-[28px] font-bold text-slate-800 flex items-center gap-2">
              Analytics <span className="text-2xl">📊</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Your productivity mirror — see how you're really performing</p>
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
                  <div key={card.label} className={`${card.color} rounded-[20px] p-5 flex flex-col gap-2`}>
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
                <div className="bg-white rounded-[20px] border border-slate-100 p-6 flex items-center gap-6">
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
                <div className="bg-white rounded-[20px] border border-slate-100 p-6">
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
              <div className="bg-white rounded-[20px] border border-slate-100 p-6 mb-8">
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
                        <div className="flex-1 bg-indigo-100 rounded-t-md transition-all duration-700 hover:bg-indigo-300 relative group"
                          style={{ height: `${Math.max(4, (d.created / maxBar) * 100)}%` }}>
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100">{d.created}</span>
                        </div>
                        {/* Completed */}
                        <div className="flex-1 bg-green-100 rounded-t-md transition-all duration-700 hover:bg-green-300 relative group"
                          style={{ height: `${Math.max(4, (d.completed / maxBar) * 100)}%` }}>
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-green-600 opacity-0 group-hover:opacity-100">{d.completed}</span>
                        </div>
                        {/* Notes */}
                        <div className="flex-1 bg-pink-100 rounded-t-md transition-all duration-700 hover:bg-pink-300 relative group"
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
                <div className="bg-white rounded-[20px] border border-slate-100 p-6 mb-8">
                  <p className="text-base font-bold text-slate-800 mb-5">🎯 Goal Analytics</p>
                  <div className="space-y-5">
                    {data.goalAnalytics.map(g => (
                      <div key={g.id} className="p-4 bg-slate-50 rounded-xl">
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
                <div className="bg-white rounded-[20px] border border-slate-100 p-6">
                  <p className="text-base font-bold text-slate-800 mb-5">📊 Task Priority</p>
                  <div className="space-y-4">
                    {[
                      { label: 'High', count: data.priorityBreakdown.high, color: 'bg-red-400', light: 'bg-red-50 text-red-600' },
                      { label: 'Medium', count: data.priorityBreakdown.medium, color: 'bg-orange-400', light: 'bg-orange-50 text-orange-600' },
                      { label: 'Low', count: data.priorityBreakdown.low, color: 'bg-green-400', light: 'bg-green-50 text-green-600' },
                    ].map(p => {
                      const pct = data.overview.totalTasks > 0 ? Math.round((p.count / data.overview.totalTasks) * 100) : 0;
                      return (
                        <div key={p.label}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.light}`}>{p.label}</span>
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
                <div className="bg-gradient-to-br from-[#F4F4FF] to-[#EEF2FF] rounded-[20px] border border-indigo-100 p-6">
                  <p className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                    🤖 AI Insights
                    <span className="text-xs font-semibold text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">Powered by AI</span>
                  </p>
                  <p className="text-xs text-slate-400 mb-5">Personalized analysis based on your data</p>
                  <div className="space-y-3">
                    {data.aiInsights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-3 bg-white/70 rounded-xl p-3">
                        <span className="text-lg flex-shrink-0">{['💡', '🔥', '🎯'][i] || '✨'}</span>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── PRODUCTIVITY SCORE BANNER ── */}
              <div className={`rounded-[20px] p-6 flex items-center gap-6 ${data.overview.productivityPct >= 70 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100' : data.overview.productivityPct >= 40 ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-100' : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-100'}`}>
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
      {/* FLOATING CHAT BUTTON */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#5A67D8] text-white rounded-full shadow-lg hover:bg-indigo-600 transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* FLOATING AI CHAT PANEL */}
      {(isChatOpen || isChatClosing) && (
        <div className={`fixed bottom-10 right-10 w-[380px] bg-white rounded-[24px] shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden z-50 flex flex-col ${
          isChatClosing ? 'animate-chatSlideOut' : 'animate-chatSlideIn'
        }`}>
          {/* Header */}
          <div className="px-6 py-4 flex justify-between items-center border-b border-slate-50 bg-gradient-to-r from-indigo-50 to-purple-50">
            <span className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              AI Assistant
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setChatMessages([])}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-slate-200 text-[11px] font-bold text-slate-400 rounded-full hover:bg-white hover:text-slate-600 transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Clear
              </button>
              <button
                onClick={handleCloseChat}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/80 transition-all hover:rotate-90"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="px-5 py-4 h-[260px] overflow-y-auto flex flex-col gap-3 bg-gradient-to-br from-[#FAFBFF] to-[#F8FAFC]">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col h-full">
                <div className="flex gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">AI</div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">Hey {user?.name?.split(' ')[0] || 'there'}! 👋</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Ask me anything about your analytics!</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-auto">
                  {[
                    { emoji: '📊', text: 'What is my productivity this week?' },
                    { emoji: '🎯', text: 'Am I on track with my goals?' },
                    { emoji: '🔥', text: 'How is my streak going?' },
                    { emoji: '💡', text: 'Give me productivity tips' },
                  ].map(q => (
                    <button
                      key={q.text}
                      onClick={() => setChatInput(q.text)}
                      className="text-[11px] px-3 py-2 bg-white border border-slate-200 rounded-full text-slate-600 font-semibold text-left hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    >
                      {q.emoji} {q.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {msg.content === 'Thinking...' ? <div className="w-2 h-2 bg-white rounded-full animate-ping" /> : 'AI'}
                      </div>
                    )}
                    <div className={`text-[11px] p-3 rounded-xl max-w-[80%] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-800 shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-100 shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="px-5 py-4 bg-white border-t border-slate-50 flex items-center gap-3">
            <div className="flex-1 bg-slate-50 rounded-2xl flex items-center px-4 py-2.5 border border-slate-200 focus-within:border-indigo-300 focus-within:bg-white transition-all">
              <input
                type="text"
                placeholder="Ask about your analytics..."
                className="bg-transparent w-full text-xs font-medium outline-none text-slate-800 placeholder-slate-400"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || chatLoading}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5A67D8] to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
