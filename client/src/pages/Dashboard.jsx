import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatClosing, setIsChatClosing] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [goals, setGoals] = useState([]);
  const [memories, setMemories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);

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

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    const userMsg = { role: 'user', content: userMessage };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    
    // Add loading message
    const loadingMsg = { role: 'assistant', content: 'Thinking...' };
    setChatMessages(prev => [...prev, loadingMsg]);
    
    try {
      const res = await api.post('/ai/chat', { message: userMessage });
      
      // Create response message with special formatting for saved data
      let responseContent = res.data.response || res.data.message;
      
      // Add visual indicator if something was saved
      if (res.data.record) {
        const recordType = res.data.intent;
        const emoji = recordType === 'memory' ? '🧠' : recordType === 'task' ? '✅' : recordType === 'note' ? '📝' : recordType === 'goal' ? '🎯' : '💾';
        responseContent += `\n\n${emoji} Saved to ${recordType}s!`;
      }
      
      // Remove loading message and add real response
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { 
          role: 'assistant', 
          content: responseContent,
          saved: !!res.data.record,
          recordType: res.data.intent
        };
        return newMessages;
      });
      
      // If AI created something, refresh the data with visual feedback
      if (res.data.record) {
        // Show success notification
        const recordType = res.data.intent;
        
        // Refresh relevant data based on what was created
        if (recordType === 'task') {
          const tasksRes = await api.get('/tasks');
          setTasks(tasksRes.data);
        } else if (recordType === 'note') {
          const notesRes = await api.get('/notes');
          setNotes(notesRes.data);
        } else if (recordType === 'goal') {
          const goalsRes = await api.get('/goals');
          setGoals(goalsRes.data);
        } else if (recordType === 'memory') {
          const memoriesRes = await api.get('/memories');
          setMemories(memoriesRes.data);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      // Replace loading message with error
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again.' 
        };
        return newMessages;
      });
    }
  };

  const handleCloseChat = () => {
    setIsChatClosing(true);
    setTimeout(() => {
      setIsChatOpen(false);
      setIsChatClosing(false);
    }, 300);
  };

  return (
    // Outer Wrapper: Flexbox to place Sidebar and Main Content side-by-side
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-[260px] bg-white h-full flex flex-col border-r border-slate-100 flex-shrink-0 z-10">
        {/* Logo */}
        <div className="p-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            {/* Brain Logo Placeholder (replace with your actual image if needed) */}
            <svg className="w-8 h-8 text-[#5A67D8]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
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
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Notes
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            Files
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Memory
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            Goals
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Analytics
          </a>
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

      {/* ================= MAIN DASHBOARD CONTENT ================= */}
      <main className="flex-1 h-full overflow-y-auto p-8 relative">
        <div className="max-w-[1200px] mx-auto pb-24">
          
          {/* TOP BAR */}
          <header className="flex justify-between items-center mb-10">
            {/* Search */}
            <div className="relative w-[350px]">
              <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:border-indigo-500 shadow-sm" 
              />
            </div>
            
            {/* Actions & Profile */}
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                Add Task
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#5A67D8] text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Note
              </button>
              
              <div className="flex items-center gap-2 ml-2">
                <button className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
                <button className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 shadow-sm relative">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                </button>
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} alt="Profile" className="w-10 h-10 rounded-full ml-1" />
              </div>
            </div>
          </header>

          {/* WELCOME */}
          <h1 className="text-[28px] font-bold text-slate-800 mb-8 flex items-center gap-2">
            Welcome back, {user?.name || 'User'} <span className="text-2xl">👋</span>
          </h1>

          {/* TOP 4 CARDS */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Card 1: Daily Focus */}
            <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 flex flex-col justify-between h-36">
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
            <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 h-36">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="font-bold text-sm text-slate-800">AI Suggestions</h3>
              </div>
              <ul className="text-[11px] text-slate-600 space-y-2 font-medium ml-1">
                {suggestions.slice(0, 3).map((suggestion, i) => (
                  <li key={i} className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-100 flex items-center justify-center"><svg className="w-2 h-2 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div> {suggestion}</li>
                ))}
                {suggestions.length === 0 && (
                  <li className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-100 flex items-center justify-center"><svg className="w-2 h-2 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div> Loading suggestions...</li>
                )}
              </ul>
            </div>

            {/* Card 3: Personal Goals */}
            <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 flex flex-col justify-between h-36">
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
            <div className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 h-36 flex flex-col justify-between">
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
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{memories[0]?.value || 'Store your first memory'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION */}
          <div className="grid grid-cols-[1.2fr_1fr] gap-6 mb-8">
            
            {/* Today's Task List */}
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-slate-800">Today's Task List</h2>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-400 rounded-full hover:bg-slate-100">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Filter <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
              
              <div className="space-y-5">
                {tasks.slice(0, 4).map((task, i) => (
                  <div key={task.id} className="flex items-center justify-between">
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
                {tasks.length === 0 && (
                  <div className="text-center text-slate-400 py-8">
                    <p className="text-sm font-medium">No tasks yet</p>
                    <p className="text-xs mt-1">Create your first task to get started</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Notes Grid Item */}
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-slate-800">Quick Notes</h2>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-400 rounded-full hover:bg-slate-100">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Done <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>

              <div className="flex gap-4">
                {notes.slice(0, 2).map((note, i) => (
                  <div key={note.id} className={`flex-1 p-5 rounded-tl-xl rounded-tr-3xl rounded-bl-3xl rounded-br-xl ${note.color === 'orange' ? 'bg-[#FDF1EB]' : 'bg-[#E8F8F0]'}`}>
                    <h4 className="font-bold text-slate-800 text-[13px] mb-2">{note.title}</h4>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{note.content}</p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="flex-1 bg-[#FDF1EB] p-5 rounded-tl-xl rounded-tr-3xl rounded-bl-3xl rounded-br-xl">
                    <h4 className="font-bold text-slate-800 text-[13px] mb-2">No Notes Yet</h4>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">Create your first note to get started.</p>
                  </div>
                )}
                {notes.length === 1 && (
                  <div className="flex-1 bg-[#E8F8F0] p-5 rounded-tl-xl rounded-tr-3xl rounded-bl-3xl rounded-br-xl">
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
            <div className="w-full h-32 rounded-[20px] bg-gradient-to-r from-[#FFF5E6] via-[#E6FFF0] to-[#E6F0FF] border border-slate-100 relative overflow-hidden flex items-center px-8">
               <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white shadow-lg">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
               </div>
            </div>
          </div>

        </div>

        {/* ================= FLOATING AI CHAT ICON ================= */}
        {!isChatOpen && (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-[#5A67D8] text-white rounded-full shadow-lg hover:bg-indigo-600 transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        )}

        {/* ================= FLOATING AI ASSISTANT ================= */}
        {(isChatOpen || isChatClosing) && (
          <div className={`fixed bottom-10 right-10 w-[380px] bg-white rounded-[24px] shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden z-50 flex flex-col ${
            isChatClosing ? 'animate-chatSlideOut' : 'animate-chatSlideIn'
          }`}>
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-50 bg-gradient-to-r from-indigo-50 to-purple-50">
              <span className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                AI Assistant
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setChatMessages([])}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-slate-200 text-[11px] font-bold text-slate-400 rounded-full hover:bg-white hover:text-slate-600 transition-all duration-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Clear
                </button>
                <button 
                  onClick={handleCloseChat}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/80 backdrop-blur-sm transition-all duration-200 hover:rotate-90"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6 bg-gradient-to-br from-[#FAFBFF] to-[#F8FAFC] h-[240px] flex flex-col">
              {chatMessages.length === 0 ? (
                <>
                  <div className="flex gap-3 mb-6 animate-in fade-in duration-700">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-lg animate-pulse">{user?.name?.charAt(0) || 'U'}</div>
                    <div>
                      <div className="text-[13px] font-bold text-slate-800 mb-0.5">Hello {user?.name || 'User'}! How can I assist you today?</div>
                      <div className="text-[10px] text-slate-400 font-bold">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 mt-auto animate-in slide-in-from-bottom-4 duration-500 delay-300">
                    <button 
                      onClick={() => setChatInput('My WiFi password is MySecurePass123')}
                      className="text-[11px] px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-slate-600 font-bold shadow-sm flex items-center gap-1.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 hover:scale-105"
                    >
                      💾 Save my WiFi password <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setChatInput('What is my WiFi password?')}
                        className="text-[11px] px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-slate-600 font-bold shadow-sm flex items-center gap-1.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 hover:scale-105"
                      >
                        🔍 What's my WiFi password? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                    <button 
                      onClick={() => setChatInput('Remind me to call mom tomorrow at 3 PM')}
                      className="text-[11px] px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-slate-600 font-bold shadow-sm flex items-center gap-1.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 hover:scale-105"
                    >
                      ✅ Create a reminder task <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 animate-in fade-in duration-300">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-in slide-in-from-bottom-2 duration-300`} style={{animationDelay: `${i * 100}ms`}}>
                      {msg.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-md">
                          {msg.content === 'Thinking...' ? (
                            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                          ) : (
                            'AI'
                          )}
                        </div>
                      )}
                      <div className={`text-[11px] p-3 rounded-lg max-w-xs transition-all duration-200 ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-800 ml-auto shadow-md' : msg.saved ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-slate-700 border border-green-200 shadow-sm' : 'bg-white/90 backdrop-blur-sm text-slate-700 border border-slate-100 shadow-sm'}`}>
                        {msg.content.split('\n').map((line, idx) => (
                          <div key={idx} className={line.includes('Saved to') ? 'text-green-600 font-semibold mt-2 flex items-center gap-1' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-md">{user?.name?.charAt(0) || 'U'}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="px-5 py-4 bg-white border-t border-slate-50 flex items-center gap-3">
              <div className="flex-1 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl flex items-center px-4 py-2.5 border border-slate-200 focus-within:border-indigo-300 focus-within:bg-white transition-all duration-200">
                <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="bg-transparent w-full text-xs font-medium outline-none text-slate-800 placeholder-slate-500" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button className="text-slate-400 hover:text-indigo-500 ml-2 transition-colors duration-200 hover:scale-110"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg></button>
                <button className="text-slate-400 hover:text-indigo-500 ml-2 transition-colors duration-200 hover:scale-110"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
              </div>
              <button 
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5A67D8] to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}