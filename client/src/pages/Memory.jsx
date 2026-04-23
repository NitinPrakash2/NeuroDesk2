import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';

export default function Memory() {
  const { user } = useAuth();
  const { notifications, clearNotifications } = useNotifications();
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewingMemory, setViewingMemory] = useState(null);
  const [editingMemory, setEditingMemory] = useState(null);
  const [form, setForm] = useState({
    type: 'password',
    label: '',
    value: ''
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const types = [
    { value: 'password', label: 'Password', icon: '🔐', color: 'bg-red-50 text-red-600 border-red-200' },
    { value: 'contact', label: 'Contact', icon: '📱', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { value: 'fact', label: 'Fact', icon: '💡', color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
    { value: 'reminder', label: 'Reminder', icon: '⏰', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { value: 'date', label: 'Date', icon: '📅', color: 'bg-green-50 text-green-600 border-green-200' },
    { value: 'other', label: 'Other', icon: '📝', color: 'bg-slate-50 text-slate-600 border-slate-200' }
  ];

  useEffect(() => {
    fetchMemories();
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [tasksRes, notesRes, goalsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/notes'),
        api.get('/goals'),
      ]);
      setTasks(tasksRes.data);
      setNotes(notesRes.data);
      setGoals(goalsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const fetchMemories = async () => {
    try {
      const response = await api.get('/memories');
      setMemories(response.data);
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMemory = () => {
    setEditingMemory(null);
    setForm({ type: 'password', label: '', value: '' });
    setShowModal(true);
  };

  const handleEditMemory = (memory) => {
    setEditingMemory(memory);
    setForm({
      type: memory.type,
      label: memory.label,
      value: memory.value
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.label.trim() || !form.value.trim()) return;

    try {
      if (editingMemory) {
        const response = await api.put(`/memories/${editingMemory.id}`, form);
        setMemories(prev => prev.map(m => m.id === editingMemory.id ? response.data : m));
      } else {
        const response = await api.post('/memories', form);
        setMemories(prev => [response.data, ...prev]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  };

  const deleteMemory = async (memoryId) => {
    setMemories(prev => prev.filter(m => m.id !== memoryId));
    try {
      await api.delete(`/memories/${memoryId}`);
    } catch (error) {
      console.error('Error deleting memory:', error);
      fetchMemories();
    }
  };

  const filteredMemories = memories.filter(memory =>
    memory.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    memory.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    memory.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeInfo = (type) => {
    return types.find(t => t.value === type) || types[types.length - 1];
  };

  const SkeletonCard = () => (
    <div className="bg-white rounded-[20px] p-6 border border-slate-100 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100"></div>
          <div>
            <div className="h-4 bg-slate-100 rounded w-24 mb-2"></div>
            <div className="h-3 bg-slate-100 rounded w-16"></div>
          </div>
        </div>
      </div>
      <div className="h-3 bg-slate-100 rounded w-full"></div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[260px] bg-white h-full flex flex-col border-r border-slate-100 flex-shrink-0 z-10">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#5A67D8]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </div>
          <span className="font-bold text-[19px] text-slate-800 tracking-tight">NeuroDesk</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <Link to="/app/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
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
          <Link to="/app/memory" className="flex items-center gap-3 px-4 py-3 bg-[#F4F4FF] text-[#5A67D8] rounded-xl font-bold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Memory
          </Link>
          <Link to="/app/goals" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            Goals
          </Link>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Analytics
          </a>
        </nav>

        <div className="p-3 m-4 border border-slate-100 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} alt={user?.name || 'User'} className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">{user?.name || 'User'}</p>
            <p className="text-xs font-semibold text-slate-400">Free plan</p>
          </div>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
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
                    onChange={(e) => setSearchQuery(e.target.value)}
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
              <button 
                onClick={handleCreateMemory}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#5A67D8] text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Memory
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
          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-slate-800 mb-2 flex items-center gap-2">
              Memory Vault <span className="text-2xl">🧠</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Store and manage your important information securely</p>
          </div>

          {/* MEMORIES GRID */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredMemories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMemories.map((memory) => {
                const typeInfo = getTypeInfo(memory.type);
                const lines = memory.value.split('\n').filter(Boolean);
                const isMulti = lines.length > 1;
                const latestLine = isMulti ? lines[lines.length - 1] : null;
                return (
                  <div
                    key={memory.id}
                    onClick={() => setViewingMemory(memory)}
                    className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-200 hover:scale-[1.02] transition-all duration-300 group relative cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${typeInfo.color} flex items-center justify-center text-lg border`}>
                          {typeInfo.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">{memory.label}</h3>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeInfo.color} border capitalize`}>
                            {memory.type}
                          </span>
                        </div>
                      </div>
                      {isMulti && (
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-100">
                          {lines.length} items
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      {memory.type === 'password' ? (
                        <p className="text-sm text-slate-600 font-mono bg-slate-50 p-3 rounded-lg">••••••••</p>
                      ) : isMulti ? (
                        <div className="bg-slate-50 p-3 rounded-lg space-y-1.5">
                          {lines.slice(0, 3).map((line, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${idx === lines.length - 1 ? 'bg-indigo-400' : 'bg-slate-300'}`} />
                              <span className="text-slate-700 font-medium break-all">{line}</span>
                            </div>
                          ))}
                          {lines.length > 3 && (
                            <p className="text-[10px] text-indigo-400 font-bold pl-3">+{lines.length - 3} more — click to view all</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600 font-mono bg-slate-50 p-3 rounded-lg break-all">{memory.value}</p>
                      )}
                    </div>

                    {isMulti && latestLine && (
                      <div className="mb-3 flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                        <span className="text-[10px] font-bold text-indigo-500">Latest:</span>
                        <span className="text-[10px] text-indigo-700 truncate">{latestLine}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(memory.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditMemory(memory)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          onClick={() => deleteMemory(memory.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 hover:bg-slate-50 rounded-2xl transition-all duration-300">
              <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No memories yet</h3>
              <p className="text-slate-500 text-sm mb-6">Start storing your important information securely</p>
              <button 
                onClick={handleCreateMemory}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5A67D8] text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Memory
              </button>
            </div>
          )}

        </div>
      </main>

      {/* ================= VIEW DETAIL MODAL ================= */}
      {viewingMemory && (() => {
        const typeInfo = getTypeInfo(viewingMemory.type);
        const lines = viewingMemory.value.split('\n').filter(Boolean);
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewingMemory(null)}>
            <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className={`p-6 rounded-t-[24px] ${typeInfo.color} border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center text-2xl border border-white/40">
                      {typeInfo.icon}
                    </div>
                    <div>
                      <h2 className="text-base font-bold">{viewingMemory.label}</h2>
                      <span className="text-xs font-semibold capitalize opacity-70">{viewingMemory.type} • {new Date(viewingMemory.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={() => setViewingMemory(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/60 hover:bg-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                {lines.length > 1 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">All Stored Info ({lines.length} items)</p>
                    {lines.map((line, idx) => (
                      <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border ${
                        idx === lines.length - 1
                          ? 'bg-indigo-50 border-indigo-200'
                          : 'bg-slate-50 border-slate-100'
                      }`}>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${
                          idx === lines.length - 1 ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-500'
                        }`}>{idx + 1}</span>
                        <span className="text-sm text-slate-700 font-medium break-all">
                          {viewingMemory.type === 'password' ? '••••••••' : line}
                        </span>
                        {idx === lines.length - 1 && (
                          <span className="ml-auto text-[10px] font-bold bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full flex-shrink-0">Latest</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-700 font-mono break-all">
                      {viewingMemory.type === 'password' ? '••••••••' : viewingMemory.value}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => { setViewingMemory(null); handleEditMemory(viewingMemory); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit
                </button>
                <button
                  onClick={() => { deleteMemory(viewingMemory.id); setViewingMemory(null); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm font-bold text-red-500 hover:bg-red-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div 
            className="bg-white rounded-[24px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {editingMemory ? 'Edit Memory' : 'Create New Memory'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Type *
                </label>
                <select 
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                >
                  {types.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Label *
                </label>
                <input 
                  type="text" 
                  value={form.label}
                  onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Gmail Password, Mom's Phone"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Value *
                </label>
                <input 
                  type={form.type === 'password' ? 'password' : 'text'}
                  value={form.value}
                  onChange={(e) => setForm(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Enter the value..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#5A67D8] text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors shadow-sm"
                >
                  {editingMemory ? 'Update Memory' : 'Create Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
