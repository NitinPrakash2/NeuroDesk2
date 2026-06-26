import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Tasks() {
  const { user } = useAuth();
  const { notifications, addNotification } = useNotifications();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: ''
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [memories, setMemories] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [notesRes, goalsRes, memoriesRes] = await Promise.all([
        api.get('/notes'),
        api.get('/goals'),
        api.get('/memories'),
      ]);
      setNotes(notesRes.data);
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

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', priority: 'medium', due_date: '' });
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      if (editingTask) {
        const response = await api.put(`/tasks/${editingTask.id}`, form);
        setTasks(prev => prev.map(t => t.id === editingTask.id ? response.data : t));
      } else {
        const response = await api.post('/tasks', form);
        setTasks(prev => [response.data, ...prev]);
        try {
          await addNotification({
            type: 'Task',
            title: response.data.title,
            sub: `${response.data.priority} priority`,
            icon: '✅',
            color: 'bg-indigo-50 text-indigo-600'
          });
          toast.success('Task created!');
        } catch (notifErr) {
          console.error('Notification error:', notifErr);
          toast.success('Task created!');
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      const response = await api.put(`/tasks/${task.id}`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? response.data : t));
    } catch (error) {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await api.delete(`/tasks/${taskId}`);
    } catch (error) {
      console.error('Error deleting task:', error);
      fetchTasks();
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                     (activeTab === 'today' && new Date(task.created_at).toDateString() === new Date().toDateString()) ||
                     (activeTab === 'completed' && task.status === 'completed') ||
                     (activeTab === 'pending' && task.status === 'pending');
    return matchesSearch && matchesTab;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-600 border-red-100';
      case 'medium': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'low': return 'bg-green-50 text-green-600 border-green-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    today: tasks.filter(t => new Date(t.created_at).toDateString() === new Date().toDateString()).length
  };

  const SkeletonRow = () => (
    <div className="flex items-center justify-between p-6 border-b border-slate-50">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-5 h-5 rounded-lg bg-slate-100 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-slate-100 rounded-full w-2/5 animate-pulse" />
          <div className="h-2.5 bg-slate-100 rounded-full w-1/4 animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-7 w-16 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-7 w-16 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );

  return (
    <>
          
          {/* TOP BAR */}
          <PageHeader title="My Tasks"
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

          {/* WELCOME & STATS */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-2">
              <h1 className="text-xl md:text-[28px] font-bold text-slate-800 flex items-center gap-2">
                My Tasks <span className="text-2xl">📋</span>
              </h1>
              <button onClick={handleCreateTask} className="flex items-center gap-2 px-4 py-2.5 bg-[#5A67D8] text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-sm hover:shadow-md flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Task
              </button>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-6">Manage and track your daily tasks efficiently</p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <div className="bg-white p-3 md:p-5 rounded-[20px] shadow-sm border border-slate-100 flex flex-col justify-between h-24 md:h-28 hover:shadow-xl hover:scale-[1.03] transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[11px] md:text-sm text-slate-800 truncate">Total Tasks</h3>
                    <p className="text-lg md:text-2xl font-bold text-slate-800 mt-0.5">{stats.total}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 md:p-5 rounded-[20px] shadow-sm border border-slate-100 flex flex-col justify-between h-24 md:h-28 hover:shadow-xl hover:scale-[1.03] transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[11px] md:text-sm text-slate-800 truncate">Completed</h3>
                    <p className="text-lg md:text-2xl font-bold text-green-600 mt-0.5">{stats.completed}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 md:p-5 rounded-[20px] shadow-sm border border-slate-100 flex flex-col justify-between h-24 md:h-28 hover:shadow-xl hover:scale-[1.03] transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[11px] md:text-sm text-slate-800 truncate">Pending</h3>
                    <p className="text-lg md:text-2xl font-bold text-orange-600 mt-0.5">{stats.pending}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 md:p-5 rounded-[20px] shadow-sm border border-slate-100 flex flex-col justify-between h-24 md:h-28 hover:shadow-xl hover:scale-[1.03] transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[11px] md:text-sm text-slate-800 truncate">Today</h3>
                    <p className="text-lg md:text-2xl font-bold text-indigo-600 mt-0.5">{stats.today}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="overflow-x-auto -mx-4 px-4 mb-8 scrollbar-hide">
          <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200 shadow-sm w-fit mx-auto sm:mx-0">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'today', label: 'Today', count: stats.today },
              { key: 'pending', label: 'Pending', count: stats.pending },
              { key: 'completed', label: 'Completed', count: stats.completed }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 md:px-5 py-2 rounded-full text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.key 
                    ? 'bg-[#5A67D8] text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full ${
                  activeTab === tab.key 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          </div>

          {/* TASKS LIST */}
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:border-indigo-100 transition-all duration-300">
            {loading ? (
              <div className="divide-y divide-slate-50">
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {filteredTasks.map((task, index) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3 md:p-6 hover:bg-slate-50 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                      <button 
                        onClick={() => toggleTaskStatus(task)}
                        className={`w-4 h-4 md:w-5 md:h-5 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                          task.status === 'completed'
                            ? 'bg-[#5A67D8] border-[#5A67D8] shadow-sm' 
                            : 'border-2 border-slate-300 hover:border-[#5A67D8] hover:bg-indigo-50'
                        }`}
                      >
                        {task.status === 'completed' && (
                          <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-xs md:text-sm font-bold truncate transition-all ${
                          task.status === 'completed' 
                            ? 'text-slate-400 line-through' 
                            : 'text-slate-800'
                        }`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 md:mt-1 truncate">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 md:gap-3 mt-1 md:mt-2 flex-wrap">
                          {task.due_date && (
                            <span className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1">
                              <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Due {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                          <span className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1">
                            <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(task.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-4 flex-shrink-0 ml-2">
                      <span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold border capitalize whitespace-nowrap ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      
                      <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditTask(task)}
                          className="w-7 md:w-8 h-7 md:h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit task"
                        >
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => deleteTask(task.id)}
                          className="w-7 md:w-8 h-7 md:h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete task"
                        >
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex md:hidden items-center gap-1.5">
                        <button 
                          onClick={() => handleEditTask(task)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-indigo-500 transition-colors"
                          title="Edit task"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => deleteTask(task.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                          title="Delete task"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 md:p-16 text-center">
                <div className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-3 md:mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 md:w-8 h-6 md:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">No tasks found</h3>
                <p className="text-slate-500 text-xs md:text-sm mb-4 md:mb-6">Get started by creating your first task</p>
                <button 
                  onClick={handleCreateTask}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5A67D8] text-white rounded-xl text-xs md:text-sm font-bold hover:bg-indigo-600 transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Task
                </button>
              </div>
            )}
          </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setShowModal(false)}>
          <div 
            className="bg-white rounded-t-[24px] sm:rounded-[24px] p-5 md:p-8 w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-base md:text-xl font-bold text-slate-800">
                {editingTask ? 'Edit Task' : 'New Task'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="w-7 md:w-8 h-7 md:h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-xs md:text-sm font-bold text-slate-700 mb-1.5 md:mb-2">
                  Task Title *
                </label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title..."
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs md:text-sm transition-all"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold text-slate-700 mb-1.5 md:mb-2">
                  Description
                </label>
                <textarea 
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add task description (optional)..."
                  rows={3}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs md:text-sm resize-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-slate-700 mb-1.5 md:mb-2">
                    Priority
                  </label>
                  <select 
                    value={form.priority}
                    onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs md:text-sm transition-all"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs md:text-sm font-bold text-slate-700 mb-1.5 md:mb-2">
                    Due Date
                  </label>
                  <input 
                    type="date" 
                    value={form.due_date}
                    onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs md:text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2 md:gap-3 pt-2 md:pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 md:px-6 py-2.5 md:py-3 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-[#5A67D8] text-white rounded-xl text-xs md:text-sm font-bold hover:bg-indigo-600 transition-colors shadow-sm"
                >
                  {editingTask ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}