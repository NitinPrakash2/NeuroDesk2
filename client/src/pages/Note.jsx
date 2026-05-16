import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import PageHeader from '../components/PageHeader';
import api from '../services/api';

export default function Notes() {
  const { user } = useAuth();
  const { notifications, clearNotifications } = useNotifications();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    color: 'orange'
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [memories, setMemories] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const colors = [
    { name: 'orange', bg: 'bg-[#FDF1EB]', border: 'border-orange-200', text: 'text-orange-600' },
    { name: 'green', bg: 'bg-[#E8F8F0]', border: 'border-green-200', text: 'text-green-600' },
    { name: 'blue', bg: 'bg-[#E6F0FF]', border: 'border-blue-200', text: 'text-blue-600' },
    { name: 'purple', bg: 'bg-[#F3E8FF]', border: 'border-purple-200', text: 'text-purple-600' },
    { name: 'pink', bg: 'bg-[#FFE8F0]', border: 'border-pink-200', text: 'text-pink-600' },
    { name: 'yellow', bg: 'bg-[#FFF9E6]', border: 'border-yellow-200', text: 'text-yellow-600' }
  ];

  useEffect(() => {
    fetchNotes();
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [tasksRes, goalsRes, memoriesRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/goals'),
        api.get('/memories'),
      ]);
      setTasks(tasksRes.data);
      setGoals(goalsRes.data);
      setMemories(memoriesRes.data);
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

  const fetchNotes = async () => {
    try {
      const response = await api.get('/notes');
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = () => {
    setEditingNote(null);
    setForm({ title: '', content: '', color: 'orange' });
    setShowModal(true);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setForm({
      title: note.title,
      content: note.content || '',
      color: note.color || 'orange'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      if (editingNote) {
        const response = await api.put(`/notes/${editingNote.id}`, form);
        setNotes(prev => prev.map(n => n.id === editingNote.id ? response.data : n));
      } else {
        const response = await api.post('/notes', form);
        setNotes(prev => [response.data, ...prev]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const deleteNote = async (noteId) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    try {
      await api.delete(`/notes/${noteId}`);
    } catch (error) {
      console.error('Error deleting note:', error);
      fetchNotes();
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getColorClasses = (colorName) => {
    const color = colors.find(c => c.name === colorName) || colors[0];
    return color;
  };

  const SkeletonCard = () => (
    <div className="bg-slate-100 rounded-[20px] p-6 animate-pulse h-64">
      <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
      <div className="h-3 bg-slate-200 rounded w-5/6"></div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[260px] bg-white h-full flex flex-col border-r border-slate-100 flex-shrink-0 z-10">
        {/* Logo */}
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#5A67D8]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </div>
          <span className="font-bold text-[19px] text-slate-800 tracking-tight">NeuroDesk</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <Link to="/app/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Home
          </Link>
          <Link to="/app/tasks" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            Tasks
          </Link>
          <Link to="/app/notes" className="flex items-center gap-3 px-4 py-3 bg-[#F4F4FF] text-[#5A67D8] rounded-xl font-bold text-sm transition-colors">
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
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Analytics
          </a>
          <Link to="/app/account" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            My Account
          </Link>
        </nav>

        {/* Profile Bottom */}
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
          
          <PageHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            searchFocused={searchFocused}
            setSearchFocused={setSearchFocused}
            searchResults={searchResults}
            actionButton={{ label: 'Add Note', onClick: handleCreateNote }}
            notificationOpen={notificationOpen}
            setNotificationOpen={setNotificationOpen}
          />

          {/* WELCOME */}
          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-slate-800 mb-2 flex items-center gap-2">
              My Notes <span className="text-2xl">📝</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Capture your thoughts and ideas</p>
          </div>

          {/* NOTES GRID */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map((note) => {
                const colorClass = getColorClasses(note.color);
                return (
                  <div 
                    key={note.id} 
                    onClick={() => setViewingNote(note)}
                    className={`${colorClass.bg} p-6 rounded-[20px] shadow-sm border ${colorClass.border} hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group relative min-h-[200px] flex flex-col cursor-pointer`}
                  >
                    <h3 className="text-base font-bold text-slate-800 mb-3 pr-8">{note.title}</h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed flex-1 line-clamp-6">
                      {note.content || 'No content'}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/50">
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditNote(note)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/80 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit note"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => deleteNote(note.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/80 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete note"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No notes yet</h3>
              <p className="text-slate-500 text-sm mb-6">Start capturing your thoughts and ideas</p>
              <button 
                onClick={handleCreateNote}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#5A67D8] text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Note
              </button>
            </div>
          )}

        </div>
      </main>

      {/* ================= VIEW NOTE MODAL ================= */}
      {viewingNote && (() => {
        const colorClass = getColorClasses(viewingNote.color);
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewingNote(null)}>
            <div className="bg-white rounded-[24px] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
              <div className={`${colorClass.bg} border-b ${colorClass.border} p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{viewingNote.title}</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{new Date(viewingNote.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => setViewingNote(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/60 transition-colors">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(80vh - 160px)'}}>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{viewingNote.content || 'No content'}</p>
              </div>
              <div className="px-6 py-4 flex gap-3 border-t border-slate-100 flex-shrink-0">
                <button
                  onClick={() => { setViewingNote(null); handleEditNote(viewingNote); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit
                </button>
                <button
                  onClick={() => { deleteNote(viewingNote.id); setViewingNote(null); }}
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
            className="bg-white rounded-[24px] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300" 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {editingNote ? 'Edit Note' : 'Create New Note'}
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

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Field */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Note Title *
                </label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                  required
                  autoFocus
                />
              </div>

              {/* Content Field */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Content
                </label>
                <textarea 
                  value={form.content}
                  onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your note here..."
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none transition-all"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Note Color
                </label>
                <div className="flex gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, color: color.name }))}
                      className={`w-10 h-10 rounded-xl ${color.bg} border-2 ${
                        form.color === color.name ? color.border : 'border-transparent'
                      } hover:scale-110 transition-transform`}
                      title={color.name}
                    >
                      {form.color === color.name && (
                        <svg className={`w-5 h-5 mx-auto ${color.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
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
                  {editingNote ? 'Update Note' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
