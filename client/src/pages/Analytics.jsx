import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import PageHeader from '../components/PageHeader';
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
    <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 border border-slate-100 animate-pulse">
      <div className="h-2 md:h-3 bg-slate-100 rounded w-1/2 mb-2 md:mb-4" />
      <div className="h-5 md:h-8 bg-slate-100 rounded w-1/3 mb-1 md:mb-2" />
      <div className="h-1.5 md:h-2 bg-slate-100 rounded w-2/3" />
    </div>
  );

  // Bar chart max value
  const maxBar = data ? Math.max(...data.weeklyData.map(d => Math.max(d.created, d.completed, d.notes, 1))) : 1;

  return (
    <>

          <PageHeader title="Analytics"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            searchFocused={searchFocused}
            setSearchFocused={setSearchFocused}
            searchResults={searchResults}
            notificationOpen={notificationOpen}
            setNotificationOpen={setNotificationOpen}
          />

          {/* WELCOME */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-lg md:text-[28px] font-bold text-slate-800 mb-1 md:mb-2 flex items-center gap-2">
              Analytics <span className="text-xl md:text-2xl">📊</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">Your productivity mirror — see how you're really performing</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : !data ? (
            <div className="text-center py-16 md:py-24 text-slate-400 text-sm">Failed to load analytics. Please refresh.</div>
          ) : (
            <>
              {/* ── OVERVIEW CARDS ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4 mb-6 md:mb-8">
                {[
                  { label: 'Completed', value: data.overview.completedTasks, icon: '✅', color: 'from-green-50 to-emerald-50 border-green-100 text-green-700', bar: null },
                  { label: 'Pending', value: data.overview.pendingTasks, icon: '⏳', color: 'from-orange-50 to-amber-50 border-orange-100 text-orange-700', bar: null },
                  { label: 'Productivity', value: `${data.overview.productivityPct}%`, icon: '⚡', color: 'from-indigo-50 to-blue-50 border-indigo-100 text-indigo-700', bar: data.overview.productivityPct },
                  { label: 'Active Goals', value: data.overview.activeGoals, icon: '🎯', color: 'from-teal-50 to-emerald-50 border-teal-100 text-teal-700', bar: null },
                  { label: 'Goals Done', value: data.overview.completedGoals, icon: '🏆', color: 'from-yellow-50 to-amber-50 border-yellow-100 text-yellow-700', bar: null },
                  { label: 'Notes', value: data.overview.totalNotes, icon: '📝', color: 'from-pink-50 to-rose-50 border-pink-100 text-pink-700', bar: null },
                  { label: 'Memories', value: data.overview.totalMemories, icon: '🧠', color: 'from-purple-50 to-violet-50 border-purple-100 text-purple-700', bar: null },
                ].map(card => (
                  <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col gap-1 md:gap-2 hover:shadow-lg hover:-translate-y-0.5 md:hover:-translate-y-1 transition-all duration-300 cursor-pointer border`}>
                    <span className="text-base md:text-2xl">{card.icon}</span>
                    <p className="text-base md:text-2xl font-bold">{card.value}</p>
                    <p className="text-[10px] md:text-xs font-semibold opacity-70">{card.label}</p>
                    {card.bar !== null && (
                      <div className="w-full h-1 md:h-1.5 bg-white/60 rounded-full mt-0.5 md:mt-1">
                        <div className="h-full rounded-full bg-current opacity-60 transition-all duration-700" style={{ width: `${card.bar}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ── STREAK + WEEKLY REPORT ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                {/* Streak */}
                <div className="bg-white rounded-xl md:rounded-2xl border border-slate-100 p-4 md:p-6 flex items-center gap-4 md:gap-6 hover:shadow-lg hover:-translate-y-0.5 md:hover:-translate-y-1 hover:border-orange-200 transition-all duration-300 cursor-pointer">
                  <div className="text-3xl md:text-5xl flex-shrink-0">🔥</div>
                  <div className="min-w-0">
                    <p className="text-2xl md:text-4xl font-bold text-slate-800">{data.streak.current}</p>
                    <p className="text-xs md:text-sm font-bold text-slate-500 mt-0.5 md:mt-1">Day Streak</p>
                    <p className="text-[10px] md:text-xs text-slate-400 mt-0.5 md:mt-1">Longest: {data.streak.longest} days</p>
                    {data.streak.current >= 3 && (
                      <span className="inline-block mt-1.5 md:mt-2 px-1.5 md:px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] md:text-xs font-bold rounded-full">🔥 On Fire!</span>
                    )}
                  </div>
                </div>

                {/* Weekly report */}
                <div className="bg-white rounded-xl md:rounded-2xl border border-slate-100 p-3.5 md:p-6 hover:shadow-lg hover:-translate-y-0.5 md:hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 cursor-pointer">
                  <p className="text-xs md:text-sm font-bold text-slate-700 mb-2 md:mb-4">This Week vs Last Week</p>
                  <div className="flex items-center gap-2 md:gap-6">
                    <div className="text-center flex-1 min-w-0">
                      <p className="text-lg md:text-3xl font-bold text-indigo-600 truncate">{data.weeklyReport.thisWeekCompleted}</p>
                      <p className="text-[10px] md:text-xs text-slate-400 font-semibold mt-0.5">This Week</p>
                    </div>
                    <div className="text-center flex-1 min-w-0">
                      <p className="text-lg md:text-3xl font-bold text-slate-400 truncate">{data.weeklyReport.lastWeekCompleted}</p>
                      <p className="text-[10px] md:text-xs text-slate-400 font-semibold mt-0.5">Last Week</p>
                    </div>
                    <div className={`px-1.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold whitespace-nowrap flex-shrink-0 ${data.weeklyReport.weeklyChange >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {data.weeklyReport.weeklyChange >= 0 ? '↑' : '↓'} {Math.abs(data.weeklyReport.weeklyChange)}%
                    </div>
                  </div>
                  <p className="text-[10px] md:text-xs text-slate-400 mt-1.5 md:mt-3 truncate">
                    {data.weeklyReport.weeklyChange > 0
                      ? `You completed ${data.weeklyReport.weeklyChange}% more tasks than last week! 🎉`
                      : data.weeklyReport.weeklyChange < 0
                      ? `Completed ${Math.abs(data.weeklyReport.weeklyChange)}% fewer tasks than last week. Let's improve!`
                      : 'Same performance as last week. Push a little harder!'}
                  </p>
                </div>
              </div>

              {/* ── WEEKLY PERFORMANCE GRAPH ── */}
              <div className="bg-white rounded-xl md:rounded-2xl border border-slate-100 p-3.5 md:p-6 mb-6 md:mb-8 hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 md:gap-0 justify-between mb-3 md:mb-6">
                  <p className="text-xs md:text-base font-bold text-slate-800">📈 Weekly Performance</p>
                  <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs font-semibold">
                    <span className="flex items-center gap-1"><span className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-indigo-400 inline-block flex-shrink-0" />Created</span>
                    <span className="flex items-center gap-1"><span className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-green-400 inline-block flex-shrink-0" />Done</span>
                    <span className="flex items-center gap-1"><span className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-pink-400 inline-block flex-shrink-0" />Notes</span>
                  </div>
                </div>
                <div className="flex items-end gap-1 md:gap-3 h-28 md:h-40">
                  {data.weeklyData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5 md:gap-1 min-w-0">
                      <div className="w-full flex items-end gap-px md:gap-0.5 h-20 md:h-32">
                        <div className="flex-1 bg-indigo-100 rounded-t-sm md:rounded-t-md transition-all duration-700 hover:bg-indigo-300 hover:scale-110 relative group"
                          style={{ height: `${Math.max(4, (d.created / maxBar) * 100)}%` }}>
                          <span className="absolute -top-3.5 md:-top-5 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100">{d.created}</span>
                        </div>
                        <div className="flex-1 bg-green-100 rounded-t-sm md:rounded-t-md transition-all duration-700 hover:bg-green-300 hover:scale-110 relative group"
                          style={{ height: `${Math.max(4, (d.completed / maxBar) * 100)}%` }}>
                          <span className="absolute -top-3.5 md:-top-5 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold text-green-600 opacity-0 group-hover:opacity-100">{d.completed}</span>
                        </div>
                        <div className="flex-1 bg-pink-100 rounded-t-sm md:rounded-t-md transition-all duration-700 hover:bg-pink-300 hover:scale-110 relative group"
                          style={{ height: `${Math.max(4, (d.notes / maxBar) * 100)}%` }}>
                          <span className="absolute -top-3.5 md:-top-5 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-bold text-pink-600 opacity-0 group-hover:opacity-100">{d.notes}</span>
                        </div>
                      </div>
                      <span className="text-[8px] md:text-[11px] font-bold text-slate-400">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── GOAL ANALYTICS ── */}
              {data.goalAnalytics.length > 0 && (
                <div className="bg-white rounded-xl md:rounded-2xl border border-slate-100 p-4 md:p-6 mb-6 md:mb-8 hover:shadow-lg hover:border-teal-200 transition-all duration-300">
                  <p className="text-sm md:text-base font-bold text-slate-800 mb-3 md:mb-5">🎯 Goal Analytics</p>
                  <div className="space-y-3 md:space-y-4">
                    {data.goalAnalytics.map(g => (
                      <div key={g.id} className="p-3 md:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 hover:shadow-md transition-all duration-300 cursor-pointer">
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap min-w-0">
                            <p className="text-xs md:text-sm font-bold text-slate-800 truncate">{g.title}</p>
                            <span className={`text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap ${g.status === 'completed' ? 'bg-green-100 text-green-700' : g.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'}`}>
                              {g.status}
                            </span>
                            {g.status === 'active' && (
                              <span className={`text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap ${g.isOnTrack ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                {g.isOnTrack ? 'On Track' : 'Behind'}
                              </span>
                            )}
                          </div>
                          <span className="text-xs md:text-sm font-bold text-slate-700 flex-shrink-0">{g.progress}%</span>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                          <span className="text-[9px] md:text-[10px] text-slate-400 font-semibold w-12 md:w-16 flex-shrink-0">Progress</span>
                          <div className="flex-1 h-1.5 md:h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${g.progress}%`, background: g.progress === 100 ? '#22c55e' : 'linear-gradient(90deg,#5A67D8,#818cf8)' }} />
                          </div>
                          <span className="text-[9px] md:text-[10px] font-bold text-slate-500 w-6 md:w-8 text-right">{g.progress}%</span>
                        </div>

                        {g.daysLeft !== null && (
                          <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                            <span className="text-[9px] md:text-[10px] text-slate-400 font-semibold w-12 md:w-16 flex-shrink-0">Time</span>
                            <div className="flex-1 h-1.5 md:h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${g.timeProgress}%`, background: g.daysLeft < 0 ? '#ef4444' : g.timeProgress > 80 ? '#f97316' : '#94a3b8' }} />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-bold text-slate-500 w-6 md:w-8 text-right">{g.timeProgress}%</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 md:gap-4 mt-1.5 md:mt-2 text-[10px] md:text-[11px] text-slate-500 font-semibold flex-wrap">
                          {g.stepsTotal > 0 && <span className="whitespace-nowrap">📌 {g.stepsCompleted}/{g.stepsTotal} steps</span>}
                          {g.daysLeft !== null && (
                            <span className={`whitespace-nowrap ${g.daysLeft < 0 ? 'text-red-500' : g.daysLeft <= 7 ? 'text-orange-500' : ''}`}>
                              {g.daysLeft < 0 ? `⏰ ${Math.abs(g.daysLeft)}d overdue` : g.daysLeft === 0 ? '⏰ Due today' : `📅 ${g.daysLeft}d left`}
                            </span>
                          )}
                          {!g.isOnTrack && g.status === 'active' && g.expectedProgress > 0 && (
                            <span className="text-red-400 whitespace-nowrap">Expected: ~{g.expectedProgress}%</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PRIORITY BREAKDOWN + AI INSIGHTS ── */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="bg-white rounded-xl md:rounded-2xl border border-slate-100 p-4 md:p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer">
                  <p className="text-sm md:text-base font-bold text-slate-800 mb-4 md:mb-5">📊 Task Priority</p>
                  <div className="space-y-3 md:space-y-4">
                    {[
                      { label: 'High', count: data.priorityBreakdown.high, color: 'bg-red-400', light: 'bg-red-50 text-red-600' },
                      { label: 'Medium', count: data.priorityBreakdown.medium, color: 'bg-orange-400', light: 'bg-orange-50 text-orange-600' },
                      { label: 'Low', count: data.priorityBreakdown.low, color: 'bg-green-400', light: 'bg-green-50 text-green-600' },
                    ].map(p => {
                      const pct = data.overview.totalTasks > 0 ? Math.round((p.count / data.overview.totalTasks) * 100) : 0;
                      return (
                        <div key={p.label}>
                          <div className="flex justify-between items-center mb-1 md:mb-1.5">
                            <span className={`text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded-full ${p.light} border`}>{p.label}</span>
                            <span className="text-[10px] md:text-xs font-bold text-slate-500">{p.count} tasks ({pct}%)</span>
                          </div>
                          <div className="w-full h-1.5 md:h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${p.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Insights */}
                <div className="bg-gradient-to-br from-[#F4F4FF] to-[#EEF2FF] rounded-xl md:rounded-2xl border border-indigo-100 p-4 md:p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 cursor-pointer">
                  <p className="text-sm md:text-base font-bold text-slate-800 mb-0.5 md:mb-1 flex items-center gap-1.5 md:gap-2">
                    🤖 AI Insights
                    <span className="text-[9px] md:text-xs font-semibold text-indigo-500 bg-indigo-100 px-1.5 md:px-2 py-0.5 rounded-full">AI</span>
                  </p>
                  <p className="text-[10px] md:text-xs text-slate-400 mb-3 md:mb-5">Personalized analysis based on your data</p>
                  <div className="space-y-2 md:space-y-3">
                    {data.aiInsights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2 md:gap-3 bg-white/70 rounded-lg md:rounded-xl p-2 md:p-3 hover:bg-white hover:shadow-md transition-all duration-200">
                        <span className="text-base md:text-lg flex-shrink-0">{['💡', '🔥', '🎯'][i] || '✨'}</span>
                        <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── PRODUCTIVITY SCORE BANNER ── */}
              <div className={`rounded-xl md:rounded-2xl p-3.5 md:p-6 flex items-center gap-3 md:gap-6 hover:shadow-lg hover:-translate-y-0.5 md:hover:-translate-y-1 transition-all duration-300 cursor-pointer border ${data.overview.productivityPct >= 70 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100 hover:border-green-300' : data.overview.productivityPct >= 40 ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-100 hover:border-orange-300' : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-100 hover:border-red-300'}`}>
                <div className="text-2xl md:text-5xl flex-shrink-0">
                  {data.overview.productivityPct >= 70 ? '🚀' : data.overview.productivityPct >= 40 ? '💪' : '📈'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-lg font-bold text-slate-800">
                    {data.overview.productivityPct >= 70
                      ? `You're crushing it, ${user?.name?.split(' ')[0] || 'there'}! 🎉`
                      : data.overview.productivityPct >= 40
                      ? `Good progress, ${user?.name?.split(' ')[0] || 'there'}! Keep going 💪`
                      : `Let's get moving, ${user?.name?.split(' ')[0] || 'there'}! 🚀`}
                  </p>
                  <p className="text-[10px] md:text-sm text-slate-500 mt-0.5 md:mt-1">
                    {`You completed ${data.overview.productivityPct}% of your tasks. `}
                    {data.overview.productivityPct >= 70
                      ? 'Excellent consistency — you\'re in the top performer zone!'
                      : data.overview.productivityPct >= 40
                      ? 'Try completing 2-3 more tasks today to push past 70%.'
                      : 'Start with your easiest task to build momentum.'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl md:text-4xl font-bold text-slate-800">{data.overview.productivityPct}%</p>
                  <p className="text-[9px] md:text-xs text-slate-400 font-semibold mt-0.5 md:mt-1">Score</p>
                </div>
              </div>
            </>
          )}
      </>
  );
}
