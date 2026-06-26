import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useRealtimeData } from '../hooks/useRealtimeData';
import PageHeader from '../components/PageHeader';
import FilterDropdown from '../components/FilterDropdown';
import api from '../services/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { notifications, addNotification, clearNotifications, initializeNotifications } = useNotifications();
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
  const [taskFilter, setTaskFilter] = useState('all');
  const [quickNotesExpanded, setQuickNotesExpanded] = useState(false);

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

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (taskFilter === 'all') return true;
    if (taskFilter === 'completed') return t.status === 'completed';
    if (taskFilter === 'pending') return t.status !== 'completed';
    if (taskFilter === 'high') return t.priority === 'high';
    if (taskFilter === 'medium') return t.priority === 'medium';
    if (taskFilter === 'low') return t.priority === 'low';
    return true;
  });

  const handleClearNotifications = () => {
    clearNotifications();
    setNotificationOpen(false);
  };

  const handleAddNotification = async (notification) => {
    await addNotification(notification);
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

  const handleDataUpdate = (data) => {
    setTasks(data.tasks);
    setNotes(data.notes);
    setGoals(data.goals);
    setMemories(data.memories);
  };

  useRealtimeData(handleDataUpdate);

  useEffect(() => {
    setLoading(false);
    const fetchSuggestions = async () => {
      try {
        const suggestionsRes = await api.get('/ai/suggestions');
        setSuggestions(suggestionsRes.data.suggestions || []);
      } catch (err) {
        console.error('Error fetching AI suggestions:', err);
      }
    };
    fetchSuggestions();
  }, []);

  return (
    <>
      <PageHeader title="Dashboard"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-xl md:text-[28px] font-bold text-slate-800 flex items-center gap-2">
          Welcome back, {user?.name || 'User'} <span className="text-2xl">👋</span>
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setTaskModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Task
          </button>
          <button onClick={() => setNoteModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#5A67D8] text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-sm hover:shadow-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Note
          </button>
        </div>
      </div>

      {/* TOP 4 CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6 mb-8">
            
            {/* Today's Task List */}
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-slate-800">Today's Task List</h2>
                <FilterDropdown
                  value={taskFilter}
                  onChange={setTaskFilter}
                  label="Filter Tasks"
                  options={[
                    { value: 'all', label: 'All Tasks' },
                    { value: 'completed', label: '✓ Completed' },
                    { value: 'pending', label: '○ Pending' },
                    { value: 'high', label: '🔴 High Priority' },
                    { value: 'medium', label: '🟡 Medium Priority' },
                    { value: 'low', label: '🟢 Low Priority' }
                  ]}
                />
              </div>
              
              <div className="space-y-5">
                {filteredTasks.slice(0, 4).map((task, i) => (
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
                {filteredTasks.length === 0 && (
                  <div className="text-center text-slate-400 py-8">
                    <p className="text-sm font-medium">{searchQuery ? 'No tasks found' : 'No tasks yet'}</p>
                    <p className="text-xs mt-1">{searchQuery ? 'Try a different search' : 'Create your first task to get started'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Notes - compact inline list */}
            <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-800">Quick Notes</h2>
                {notes.length > 0 && (
                  <button
                    onClick={() => setQuickNotesExpanded(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    View All ({notes.length})
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {notes.slice(0, 3).map((note, i) => (
                  <div key={note.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer"
                    onClick={() => { setQuickNotesExpanded(true); }}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${note.color === 'orange' ? 'bg-orange-400' : note.color === 'green' ? 'bg-emerald-400' : note.color === 'blue' ? 'bg-blue-400' : note.color === 'purple' ? 'bg-purple-400' : 'bg-orange-400'}`} />
                    <span className="text-xs font-semibold text-slate-700 truncate flex-1">{note.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{note.content?.substring(0, 20)}</span>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-400 font-medium">No notes yet</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">Click Add Note to create one</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Notes - compact chip that opens modal */}
          {notes.length > 0 && (
            <>
              <button
                onClick={() => setQuickNotesExpanded(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-sm font-semibold text-slate-700 hover:text-indigo-600"
              >
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Quick Notes
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{notes.length}</span>
              </button>

              {/* Quick Notes Modal */}
              {quickNotesExpanded && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setQuickNotesExpanded(false)}>
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Quick Notes
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{notes.length}</span>
                      </h3>
                      <button onClick={() => setQuickNotesExpanded(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {notes.map(note => (
                        <div key={note.id} className={`p-5 rounded-xl ${note.color === 'orange' ? 'bg-[#FDF1EB]' : note.color === 'green' ? 'bg-[#E8F8F0]' : note.color === 'blue' ? 'bg-[#EBF5FF]' : note.color === 'purple' ? 'bg-[#F3E8FF]' : 'bg-[#FDF1EB]'}`}>
                          <h4 className="text-sm font-bold text-slate-800 mb-2">{note.title}</h4>
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

    </>
  );
}