import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AiChat from '../components/dashboard/AiChat';
import { Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    // We removed the surrounding flex container and the <aside> sidebar.
    // This <main> tag will now seamlessly drop into your existing layout.
    <main className="flex-1 h-screen overflow-y-auto bg-slate-50/50 relative pb-24 w-full text-slate-900 font-sans antialiased">
      <div className="max-w-[1400px] mx-auto p-6 md:p-10">
        
        {/* Top Navigation Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200/60 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm" 
            />
          </div>
          
          {/* Action Buttons & Profile (Top Right) */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/60 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              Add Task
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Note
            </button>
            
            {/* Divider */}
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            
            {/* Top Right Icons & Profile */}
            <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-colors">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
            <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
            <img src="https://ui-avatars.com/api/?name=Nitin&background=random" alt="Profile" className="w-10 h-10 rounded-full border-2 border-white shadow-sm ml-1" />
          </div>
        </header>

        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Welcome back, {user?.name?.split(' ')[0] || 'there'} <span className="text-3xl">👋</span>
          </h1>
        </div>

        {/* Top 4 Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Daily Focus */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Daily Focus</h3>
                <p className="text-sm text-slate-500 font-medium mt-0.5">Complete Report ⌵</p>
              </div>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
              <span>2/5 Tasks</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-indigo-600 h-2 rounded-full" style={{ width: '40%' }}></div></div>
          </div>

          {/* Card 2: AI Suggestions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="font-bold text-slate-900 text-lg">AI Suggestions</h3>
            </div>
            <ul className="text-sm text-slate-600 space-y-3 font-medium">
              <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Schedule meeting at 3 PM</li>
              <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Review monthly budget</li>
            </ul>
          </div>

          {/* Card 3: Personal Goals */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Personal Goals</h3>
                <p className="text-sm text-slate-500 font-medium mt-0.5">Build a Portfolio</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
               <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold tracking-wide">ON TRACK</span>
               <span className="font-bold text-slate-700">86%</span>
            </div>
          </div>

          {/* Card 4: Memory Vault */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Memory Vault</h3>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 items-center">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Next meeting</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">April 30 at 10:00 AM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid: Tasks and Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Tasks Section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-900">Today's Task List</h2>
              <button className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filter
              </button>
            </div>
            
            <div className="space-y-5">
              {/* Task Item */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 accent-indigo-600" />
                  <span className="text-[15px] font-semibold text-slate-800 line-through opacity-50">Finish client report</span>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md hidden group-hover:block transition-all">12/20/23 2M 3 ⌵</span>
              </div>

              {/* Task Item */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 accent-indigo-600" />
                  <span className="text-[15px] font-semibold text-slate-800">Workout for 30 mins</span>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md hidden group-hover:block transition-all">12/20/23 2M 3 ⌵</span>
              </div>

              {/* Task Item */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 accent-indigo-600" />
                  <span className="text-[15px] font-semibold text-slate-800">Call with mentor</span>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md hidden group-hover:block transition-all">20/20/23 3M 3 ⌵</span>
              </div>

              {/* Task Item */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 accent-indigo-600" />
                  <span className="text-[15px] font-semibold text-slate-800">Start React course</span>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md hidden group-hover:block transition-all">10/30/23 3M 3 ⌵</span>
              </div>
            </div>
          </div>

          {/* Quick Notes Section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-900">Quick Notes</h2>
              <button className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Search
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
              {/* Note 1 (Pink) */}
              <div className="bg-[#FFF0F0] p-5 rounded-2xl min-w-[200px] flex-1 relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-rose-200/30 absolute -top-4 -right-4 blur-xl"></div>
                <h4 className="font-bold text-rose-900 text-sm mb-2">Meeting Notes</h4>
                <p className="text-xs text-rose-800/80 leading-relaxed font-medium">Contact design team to adjust the landing page layout.</p>
              </div>

              {/* Note 2 (Green) */}
              <div className="bg-[#EFFFF6] p-5 rounded-2xl min-w-[200px] flex-1 relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-emerald-200/30 absolute -bottom-4 -right-4 blur-xl"></div>
                <h4 className="font-bold text-emerald-900 text-sm mb-2">UI Ideas</h4>
                <p className="text-xs text-emerald-800/80 leading-relaxed font-medium">Use softer shadows and rounded corners for the cards.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING AI CHAT */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-8 w-[380px] z-50 shadow-2xl rounded-3xl">
          <AiChat onDataChange={() => {}} />
        </div>
      )}

      {/* FLOATING AI TOGGLE BUTTON */}
      <button
        onClick={() => setIsChatOpen(prev => !prev)}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        {isChatOpen
          ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          : <Sparkles className="w-5 h-5" />
        }
      </button>
    </main>
  );
}