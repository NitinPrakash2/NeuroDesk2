import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Tasks() {
  const [activeTab, setActiveTab] = useState('Today');
  
  // Mock data based on your design
  const [tasks, setTasks] = useState([
    { id: 1, title: "Finish client report", time: "5:00 PM", priority: "High", completed: true },
    { id: 2, title: "Workout for 30 mins", time: "7:00 PM", priority: "Medium", completed: false },
    { id: 3, title: "Call with mentor", time: "9:00 PM", priority: "Medium", completed: false },
    { id: 4, title: "Start React course", time: "11:00 PM", priority: "Low", completed: false },
  ]);

  // Toggle task completion
  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  // Delete a task
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'Completed') return task.completed;
    if (activeTab === 'Today') return true; // Assuming all mock tasks are for today
    return true; // 'All'
  });

  // Helper for priority badge styling
  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-50 text-red-500';
      case 'Medium': return 'bg-orange-50 text-orange-500';
      case 'Low': return 'bg-green-50 text-green-500';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[260px] bg-[#F8FAFC] h-full flex flex-col flex-shrink-0 z-10 border-r border-slate-100/50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#5A67D8]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </div>
          <span className="font-bold text-[19px] text-slate-800 tracking-tight">NeuroDesk</span>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <Link to="/app/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-500 font-medium text-sm transition-colors hover:bg-slate-50 rounded-xl">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Home
          </Link>
          <Link to="/app/tasks" className="flex items-center gap-3 px-4 py-3 bg-[#F4F4FF] text-[#5A67D8] rounded-xl font-bold text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            Tasks
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 font-medium text-sm transition-colors hover:bg-slate-50 rounded-xl">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Notes
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 font-medium text-sm transition-colors hover:bg-slate-50 rounded-xl">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            Files
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 font-medium text-sm transition-colors hover:bg-slate-50 rounded-xl">
            <svg className="w-4 h-4 text-[#5A67D8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Memory
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 font-medium text-sm transition-colors hover:bg-slate-50 rounded-xl">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Goals
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 font-medium text-sm transition-colors hover:bg-slate-50 rounded-xl">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
            Analytics
          </Link>
        </nav>

        <div className="p-3 m-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-2xl transition-colors">
          <img src="https://ui-avatars.com/api/?name=Priya+Sharma&background=random" alt="Profile" className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">Priya Sharma</p>
            <p className="text-[11px] font-medium text-slate-400">Free plan</p>
          </div>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 h-full overflow-y-auto p-8 relative bg-white/50 rounded-tl-[40px] shadow-[-10px_0_30px_rgba(0,0,0,0.02)] border-l border-slate-100">
        <div className="max-w-[900px] mx-auto pb-24">
          
          {/* Header */}
          <header className="flex justify-between items-center mb-10 pt-2">
            <div className="relative w-[300px]">
              <svg className="w-4 h-4 absolute left-4 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm" />
            </div>
            
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-[#5A67D8] text-white rounded-full text-sm font-bold hover:bg-indigo-600 transition-colors shadow-sm">
                + Add Task
              </button>
              <button className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
              <img src="https://ui-avatars.com/api/?name=Priya+Sharma&background=random" alt="Profile" className="w-10 h-10 rounded-full" />
            </div>
          </header>

          {/* Page Title */}
          <h1 className="text-[26px] font-bold text-slate-800 mb-6">
            My Tasks
          </h1>

          {/* Filters / Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200 inline-flex shadow-sm mb-6">
            {['All', 'Today', 'Completed'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab 
                    ? 'bg-[#5A67D8] text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {tab} {tab === 'Today' && <span className="ml-1 opacity-80">{tasks.length}</span>}
              </button>
            ))}
          </div>

          {/* Tasks List Container */}
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-2">
            {filteredTasks.length > 0 ? (
              <div className="flex flex-col">
                {filteredTasks.map((task, index) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-4 px-6 hover:bg-slate-50 transition-colors rounded-xl group ${
                      index !== filteredTasks.length - 1 ? 'border-b border-slate-50' : ''
                    }`}
                  >
                    {/* Left: Checkbox & Title */}
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className={`w-[20px] h-[20px] rounded-[6px] flex items-center justify-center transition-all ${
                          task.completed 
                            ? 'bg-[#5A67D8] border-[#5A67D8]' 
                            : 'border-2 border-slate-300 hover:border-[#5A67D8]'
                        }`}
                      >
                        {task.completed && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                      <span className={`text-[15px] font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {task.title}
                      </span>
                    </div>

                    {/* Right: Time, Badge, Delete */}
                    <div className="flex items-center gap-6">
                      <span className="text-[13px] font-semibold text-slate-400 w-16 text-right">
                        {task.time}
                      </span>
                      <span className={`px-3 py-1.5 rounded-md text-[11px] font-bold w-16 text-center ${getPriorityStyles(task.priority)}`}>
                        {task.priority}
                      </span>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="text-red-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 font-medium">
                No tasks found in this view.
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}