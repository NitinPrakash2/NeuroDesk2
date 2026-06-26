import React, { useState, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LayoutContext = createContext();
export const useLayout = () => useContext(LayoutContext);

const navLinks = [
  { to: '/app/dashboard', label: 'Home', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
  { to: '/app/tasks', label: 'Tasks', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> },
  { to: '/app/notes', label: 'Notes', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
  { to: '/app/goals', label: 'Goals', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /> },
  { to: '/app/analytics', label: 'Analytics', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
  { to: '/app/account', label: 'Account', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
];

const bottomNavLinks = [
  { to: '/app/dashboard', label: 'Home', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
  { to: '/app/tasks', label: 'Tasks', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> },
  { to: '/app/notes', label: 'Notes', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
  { to: '/app/goals', label: 'Goals', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /> },
  { to: '/app/analytics', label: 'Analytics', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
  { to: '/app/account', label: 'Account', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
];

const SidebarContent = ({ onLinkClick }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const currentPath = location.pathname;

  return (
    <div className="flex flex-col h-full bg-white">
      <Link to="/" className="p-6 md:p-8 flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={onLinkClick}>
        <img src="/Fevicon.png" alt="NeuroDesk" className="w-8 h-8" />
        <span className="font-bold text-[19px] text-slate-800 tracking-tight">NeuroDesk</span>
      </Link>
      <nav className="flex-1 px-3 md:px-4 space-y-1 overflow-y-auto">
        {navLinks.map(({ to, label, icon }) => {
          const isActive = currentPath === to || (to !== '/app/account' && currentPath.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-[#F4F4FF] text-[#5A67D8] font-bold'
                  : 'text-slate-500 hover:bg-slate-50 font-semibold'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 m-3 md:m-4 border border-slate-100 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors">
        <img
          src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
          alt={user?.name || 'User'}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{user?.name || 'User'}</p>
          <p className="text-xs font-semibold text-slate-400">Free plan</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); logout(); }}
          title="Logout"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const toggleSidebar = () => setSidebarOpen(o => !o);

  return (
    <LayoutContext.Provider value={{ toggleSidebar }}>
      <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar (slide-in) */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-[280px] shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-[260px] h-full flex-col border-r border-slate-100 flex-shrink-0 z-10 bg-white">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-full overflow-y-auto pb-16 lg:pb-0 pt-14 lg:pt-0">
          <div className="max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 lg:hidden safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {bottomNavLinks.map(({ to, label, icon }) => {
              const isActive = currentPath === to || (to !== '/app/account' && currentPath.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-0 ${
                    isActive
                      ? 'text-[#5A67D8]'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <svg className={`w-5 h-5 ${isActive ? 'drop-shadow-sm' : ''}`} fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    {icon}
                  </svg>
                  <span className={`text-[10px] font-semibold leading-none ${isActive ? 'font-bold' : ''}`}>
                    {label}
                  </span>
                  {isActive && <div className="w-4 h-0.5 bg-[#5A67D8] rounded-full mt-0.5" />}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </LayoutContext.Provider>
  );
}
