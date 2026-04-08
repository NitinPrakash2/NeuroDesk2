import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Header = ({ onTaskAdded, onNoteAdded, onSearch }) => {
  const [taskModal, setTaskModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium' });
  const [noteForm, setNoteForm] = useState({ title: '', content: '', color: 'orange' });
  const [loading, setLoading] = useState(false);

  const submitTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/tasks', taskForm);
      toast.success('Task added!');
      onTaskAdded?.(data);
      setTaskForm({ title: '', priority: 'medium' });
      setTaskModal(false);
    } catch { toast.error('Failed to add task'); }
    finally { setLoading(false); }
  };

  const submitNote = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/notes', noteForm);
      toast.success('Note saved!');
      onNoteAdded?.(data);
      setNoteForm({ title: '', content: '', color: 'orange' });
      setNoteModal(false);
    } catch { toast.error('Failed to add note'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <header className="flex justify-between items-center py-4 px-8 bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-100">
        {/* Search */}
        <div className="relative w-96">
          <input
            type="text"
            placeholder="Search tasks, notes..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow shadow-sm"
          />
          <span className="absolute left-4 top-2.5 text-gray-400 text-sm">🔍</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setTaskModal(true)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors"
          >
            + Add Task
          </button>
          <button
            onClick={() => setNoteModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors"
          >
            + Add Note
          </button>
          <button className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">🔔</button>
        </div>
      </header>

      {/* Add Task Modal */}
      {taskModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setTaskModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Task</h3>
            <form onSubmit={submitTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  autoFocus required
                  value={taskForm.title}
                  onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setTaskModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
                  {loading ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setNoteModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Note</h3>
            <form onSubmit={submitNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  autoFocus required
                  value={noteForm.title}
                  onChange={e => setNoteForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Note title..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  rows={3}
                  value={noteForm.content}
                  onChange={e => setNoteForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="Write your note..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2">
                  {[
                    { value: 'orange', bg: 'bg-orange-400' },
                    { value: 'green',  bg: 'bg-emerald-400' },
                    { value: 'blue',   bg: 'bg-blue-400' },
                    { value: 'purple', bg: 'bg-purple-400' },
                    { value: 'pink',   bg: 'bg-pink-400' },
                  ].map(c => (
                    <button
                      key={c.value} type="button"
                      onClick={() => setNoteForm(p => ({ ...p, color: c.value }))}
                      className={`w-7 h-7 rounded-full ${c.bg} transition-transform ${noteForm.color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setNoteModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
                  {loading ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
