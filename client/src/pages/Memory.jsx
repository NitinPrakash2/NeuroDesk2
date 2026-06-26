import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import PageHeader from '../components/PageHeader';
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
    <>
          
          <PageHeader title="Memory Vault"
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
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h1 className="text-xl md:text-[28px] font-bold text-slate-800 flex items-center gap-2">
                Memory Vault <span className="text-2xl">🧠</span>
              </h1>
              <button onClick={handleCreateMemory} className="flex items-center gap-2 px-4 py-2.5 bg-[#5A67D8] text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-sm hover:shadow-md flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Memory
              </button>
            </div>
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
    </>
  );
}
