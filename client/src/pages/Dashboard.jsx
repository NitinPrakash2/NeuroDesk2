import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { notifications, addNotification, clearNotifications, initializeNotifications, resetNotificationFlag } = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [memories, setMemories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);



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
  const [taskModal, setTaskModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', description: '' });
  const [noteForm, setNoteForm] = useState({ title: '', content: '', color: 'orange' });
  const [formLoading, setFormLoading] = useState(false);

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClearNotifications = () => {
    clearNotifications();
    setNotificationOpen(false);
  };

  const handleAddNotification = (notification) => {
    resetNotificationFlag();
    addNotification(notification);
  };

  const submitTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    setFormLoading(true);
    try {
      const { data } = await api.post('/tasks', taskForm);
      setTasks(prev => [data, ...prev]);
      handleAddNotification({ type: 'Task', icon: '✅', title: data.title, sub: `${data.priority} priority`, color: 'bg-indigo-50 text-indigo-600' });
      setTaskForm({ title: '', priority: 'medium', description: '' });
      setTaskModal(false);
    } catch (err) { console.error(err); }
    finally { setFormLoading(false); }
  };

  const submitNote = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim()) return;
    setFormLoading(true);
    try {
      const { data } = await api.post('/notes', noteForm);
      setNotes(prev => [data, ...prev]);
      handleAddNotification({ type: 'Note', icon: '📝', title: data.title, sub: 'Created', color: 'bg-orange-50 text-orange-600' });
      setNoteForm({ title: '', content: '', color: 'orange' });
      setNoteModal(false);
    } catch (err) { console.error(err); }
    finally { setFormLoading(false); }
  };

  useEffect(() => {
    const fetchData = async () => {
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
        initializeNotifications(tasksRes.data, notesRes.data, goalsRes.data, memoriesRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }

      // Fetch AI suggestions separately so it doesn't break the dashboard
      try {
        const suggestionsRes = await api.get('/ai/suggestions');
        setSuggestions(suggestionsRes.data.suggestions || []);
      } catch (err) {
        console.error('Error fetching AI suggestions:', err);
      }
    };
    fetchData();
  }, []);

  return (
    // Outer Wrapper: Flexbox to place Sidebar and Main Content side-by-side
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[260px] bg-white h-full flex flex-col border-r border-slate-100 flex-shrink-0 z-10">
        {/* Logo */}
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            <img src="/Fevicon.png" alt="NeuroDesk" className="w-8 h-8 rounded-full" />
          </div>
          <span className="font-bold text-[19px] text-slate-800 tracking-tight">NeuroDesk</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <Link to="/app/dashboard" className="flex items-center gap-3 px-4 py-3 bg-[#F4F4FF] text-[#5A67D8] rounded-xl font-bold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Home
          </Link>
          <Link to="/app/tasks" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            Tasks
          </Link>
          <Link to="/app/notes" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Notes
          </Link>
          <Link to="/app/files" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            Files
          </Link>
          <Link to="/app/memory" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Memory
          </Link>
          <Link to="/app/goals" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            Goals
          </Link>
          <Link to="/app/analytics" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Analytics
          </Link>
        </nav>

        {/* Profile Bottom */}
        <div className="p-3 m-4 border border-slate-100 rounded-2xl flex items-center gap-3">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} alt={user?.name || 'User'} className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{user?.name || 'User'}</p>
            <p className="text-xs font-semibold text-slate-400">Free plan</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </aside>

      {/* ================= MAIN DASHBOARD CONTENT ================= */}
      <main className="flex-1 h-full overflow-y-auto p-8 relative">
        <div className="max-w-[1200px] mx-auto pb-24">
          
          {/* TOP BAR */}
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

                  {/* Dropdown */}
                  {searchFocused && searchQuery.trim() && (
                    <div className="absolute top-12 left-0 w-full bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">

                      {/* Search Results */}
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
              <button onClick={() => setTaskModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                Add Task
              </button>
              <button onClick={() => setNoteModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#5A67D8] text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Note
              </button>
              
              <div className="flex items-center gap-2 ml-2">
                <div className="relative">
                  <button
                    onClick={() => setNotificationOpen(o => !o)}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 shadow-sm relative"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {notifications.length > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>}
                  </button>

                  {/* Notification Dropdown */}
                  {notificationOpen && (
                    <div className="absolute top-12 right-0 w-[380px] bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400">{notifications.length} new</span>
                          {notifications.length > 0 && (
                            <button
                              onClick={handleClearNotifications}
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
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-100 text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Add Task Modal */}
          {taskModal && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setTaskModal(false)}>
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Add Task</h3>
                <form onSubmit={submitTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input autoFocus required value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="What needs to be done?" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                    <input value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} placeholder="Add details..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setTaskModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">{formLoading ? 'Adding...' : 'Add Task'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Note Modal */}
          {noteModal && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setNoteModal(false)}>
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Add Note</h3>
                <form onSubmit={submitNote} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input autoFocus required value={noteForm.title} onChange={e => setNoteForm(p => ({ ...p, title: e.target.value }))} placeholder="Note title..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                    <textarea rows={3} value={noteForm.content} onChange={e => setNoteForm(p => ({ ...p, content: e.target.value }))} placeholder="Write your note..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                    <div className="flex gap-2">
                      {[{value:'orange',bg:'bg-orange-400'},{value:'green',bg:'bg-emerald-400'},{value:'blue',bg:'bg-blue-400'},{value:'purple',bg:'bg-purple-400'},{value:'pink',bg:'bg-pink-400'}].map(c => (
                        <button key={c.value} type="button" onClick={() => setNoteForm(p => ({ ...p, color: c.value }))} className={`w-7 h-7 rounded-full ${c.bg} transition-transform ${noteForm.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setNoteModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={formLoading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">{formLoading ? 'Saving...' : 'Save Note'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* WELCOME */}
          <h1 className="text-[28px] font-bold text-slate-800 mb-8 flex items-center gap-2">
            Welcome back, {user?.name || 'User'} <span className="text-2xl">👋</span>
          </h1>

          {/* TOP 4 CARDS */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Card 1: Daily Focus */}
            <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 flex flex-col justify-between h-36 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Daily Focus</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">Complete Report <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 font-bold mb-2 px-1">
                  <span>{tasks.filter(t => t.status === 'completed').length}/{tasks.length} Tasks</span>
                  <span>{tasks.filter(t => t.status === 'completed').length}/{tasks.length} Tasks</span>
                </div>
                <div className="w-full bg-slate-100 h-[3px] rounded-full"><div className="bg-slate-800 h-[3px] rounded-full" style={{width: `${tasks.length ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0}%`}}></div></div>
              </div>
            </div>

            {/* Card 2: AI Suggestions */}
            <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 h-36 overflow-hidden hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="font-bold text-sm text-slate-800">AI Suggestions</h3>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1.5 font-medium ml-1">
                {suggestions.slice(0, 3).map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-3 h-3 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-2 h-2 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                    <span className="truncate">{suggestion}</span>
                  </li>
                ))}
                {suggestions.length === 0 && (
                  <li className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2 h-2 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                    Loading suggestions...
                  </li>
                )}
              </ul>
            </div>

            {/* Card 3: Personal Goals */}
            <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 flex flex-col justify-between h-36 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Personal Goals</h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1"><svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg> {goals[0]?.title || 'No goals yet'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded text-[10px] font-bold">{goals[0]?.status || 'On Track'}</span>
                <div className="flex-1 mx-3 bg-slate-100 h-[3px] rounded-full"><div className="bg-teal-400 h-[3px] rounded-full" style={{width: `${goals[0]?.progress || 0}%`}}></div></div>
                <span className="text-xs font-bold text-slate-700">{goals[0]?.progress || 0}%</span>
              </div>
            </div>

            {/* Card 4: Memory Vault */}
            <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 h-36 flex flex-col justify-between hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h3 className="font-bold text-sm text-slate-800">Memory Vault</h3>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex gap-3 items-center">
                <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center border border-slate-100">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{memories[0]?.label || 'No memories'}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{memories[0]?.type === 'password' ? '••••••••' : memories[0]?.value || 'Store your first memory'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION */}
          <div className="grid grid-cols-[1.2fr_1fr] gap-6 mb-8">
            
            {/* Today's Task List */}
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-slate-800">Today's Task List</h2>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-400 rounded-full hover:bg-slate-100">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Filter <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
              
              <div className="space-y-5">
                {(searchQuery ? filteredTasks : tasks).slice(0, 4).map((task, i) => (
                  <div key={task.id} className="flex items-center justify-between hover:bg-slate-50 p-3 -mx-3 rounded-xl transition-all duration-200 cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`w-[18px] h-[18px] rounded ${task.status === 'completed' ? 'bg-[#5A67D8] flex items-center justify-center text-white' : 'border-2 border-slate-200'}`}>
                        {task.status === 'completed' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className={`text-sm font-bold ${task.status === 'completed' ? 'text-slate-800' : 'text-slate-400'}`}>{task.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold">
                      <span>{new Date(task.created_at).toLocaleDateString()} {task.priority}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                ))}
                {(searchQuery ? filteredTasks : tasks).length === 0 && (
                  <div className="text-center text-slate-400 py-8">
                    <p className="text-sm font-medium">{searchQuery ? 'No tasks found' : 'No tasks yet'}</p>
                    <p className="text-xs mt-1">{searchQuery ? 'Try a different search' : 'Create your first task to get started'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Notes Grid Item */}
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-slate-800">Quick Notes</h2>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-400 rounded-full hover:bg-slate-100">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Done <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>

              <div className="flex gap-4">
                {(searchQuery ? filteredNotes : notes).slice(0, 2).map((note, i) => (
                  <div key={note.id} className={`flex-1 p-5 rounded-tl-xl rounded-tr-3xl rounded-bl-3xl rounded-br-xl ${note.color === 'orange' ? 'bg-[#FDF1EB]' : 'bg-[#E8F8F0]'} hover:shadow-lg hover:scale-[1.03] transition-all duration-300 cursor-pointer`}>
                    <h4 className="font-bold text-slate-800 text-[13px] mb-2">{note.title}</h4>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{note.content}</p>
                  </div>
                ))}
                {(searchQuery ? filteredNotes : notes).length === 0 && (
                  <div className="flex-1 bg-[#FDF1EB] p-5 rounded-tl-xl rounded-tr-3xl rounded-bl-3xl rounded-br-xl hover:shadow-lg hover:scale-[1.03] transition-all duration-300 cursor-pointer">
                    <h4 className="font-bold text-slate-800 text-[13px] mb-2">No Notes Yet</h4>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">Create your first note to get started.</p>
                  </div>
                )}
                {(searchQuery ? filteredNotes : notes).length === 1 && (
                  <div className="flex-1 bg-[#E8F8F0] p-5 rounded-tl-xl rounded-tr-3xl rounded-bl-3xl rounded-br-xl hover:shadow-lg hover:scale-[1.03] transition-all duration-300 cursor-pointer">
                    <h4 className="font-bold text-slate-800 text-[13px] mb-2">Add Another Note</h4>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">Click Add Note to create more.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION (Quick Notes Banner Placeholder) */}
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Quick Notes
            </h2>
            {/* Gradient background matching the bottom image map */}
            <div className="w-full h-32 rounded-[20px] bg-gradient-to-r from-[#FFF5E6] via-[#E6FFF0] to-[#E6F0FF] border border-slate-100 relative overflow-hidden flex items-center px-8 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer group">
               <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
               </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}