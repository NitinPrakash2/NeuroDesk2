import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PRIORITIES = ['all', 'high', 'medium', 'low'];
const STATUSES = ['all', 'pending', 'in_progress', 'completed'];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditTask(null); setForm({ title: '', description: '', priority: 'medium', due_date: '' }); setShowModal(true); };
  const openEdit = (task) => { setEditTask(task); setForm({ title: task.title, description: task.description || '', priority: task.priority, due_date: task.due_date ? task.due_date.slice(0, 10) : '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      if (editTask) {
        const { data } = await api.put(`/tasks/${editTask.id}`, form);
        setTasks(prev => prev.map(t => t.id === editTask.id ? data : t));
        toast.success('Task updated!');
      } else {
        const { data } = await api.post('/tasks', form);
        setTasks(prev => [data, ...prev]);
        toast.success('Task created!');
      }
      setShowModal(false);
    } catch { toast.error('Failed to save task'); }
  };

  const toggleStatus = async (task) => {
    const next = task.status === 'completed' ? 'pending' : task.status === 'pending' ? 'in_progress' : 'completed';
    try {
      const { data } = await api.put(`/tasks/${task.id}`, { status: next });
      setTasks(prev => prev.map(t => t.id === task.id ? data : t));
    } catch { toast.error('Failed to update task'); }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted!');
    } catch { toast.error('Failed to delete task'); }
  };

  const filtered = tasks.filter(t => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const priorityColor = { high: 'bg-rose-50 text-rose-600 border-rose-100', medium: 'bg-orange-50 text-orange-600 border-orange-100', low: 'bg-slate-50 text-slate-500 border-slate-100' };
  const statusColor = { pending: 'bg-slate-100 text-slate-500', in_progress: 'bg-blue-50 text-blue-600', completed: 'bg-green-50 text-green-600' };
  const statusIcon = {
    pending: <span className="w-4 h-4 rounded border-2 border-slate-300 inline-block" />,
    in_progress: <span className="w-4 h-4 rounded border-2 border-blue-400 bg-blue-100 inline-block" />,
    completed: (
      <span className="w-4 h-4 rounded bg-indigo-600 flex items-center justify-center inline-flex">
        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
      </span>
    ),
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    high: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 bg-[#F8FAFC]">
      <div className="max-w-[900px] mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Tasks</h1>
            <p className="text-sm text-slate-400 mt-1">{stats.completed}/{stats.total} completed</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-800', bg: 'bg-white' },
            { label: 'Completed', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'High Priority', value: stats.high, color: 'text-rose-600', bg: 'bg-rose-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} p-4 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
              <p className="text-xs font-semibold text-slate-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-2">
            {PRIORITIES.map(p => (
              <button key={p} onClick={() => setFilterPriority(p)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors capitalize ${filterPriority === p ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>{p}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors capitalize ${filterStatus === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>{s.replace('_', ' ')}</button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100">
              <svg className="w-10 h-10 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              No tasks found
            </div>
          ) : filtered.map(task => (
            <div key={task.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <button onClick={() => toggleStatus(task)} className="flex-shrink-0">{statusIcon[task.status]}</button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
                {task.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{task.description}</p>}
                {task.due_date && <p className="text-[11px] text-slate-400 mt-1">Due: {new Date(task.due_date).toLocaleDateString()}</p>}
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border capitalize ${priorityColor[task.priority]}`}>{task.priority}</span>
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize ${statusColor[task.status]}`}>{task.status.replace('_', ' ')}</span>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(task)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => deleteTask(task.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-[480px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">{editTask ? 'Edit Task' : 'New Task'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional details..." rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">{editTask ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
