import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListTodo, NotebookPen, FolderOpen, BrainCircuit, Trophy, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { name: 'Home',      icon: LayoutDashboard, color: 'text-violet-500', bg: 'bg-violet-50',  activeBg: 'bg-violet-100', path: '/app/dashboard' },
  { name: 'Tasks',     icon: ListTodo,        color: 'text-blue-500',   bg: 'bg-blue-50',    activeBg: 'bg-blue-100',   path: '/app/tasks' },
  { name: 'Notes',     icon: NotebookPen,     color: 'text-orange-500', bg: 'bg-orange-50',  activeBg: 'bg-orange-100', path: '/app/notes' },
  { name: 'Files',     icon: FolderOpen,      color: 'text-yellow-500', bg: 'bg-yellow-50',  activeBg: 'bg-yellow-100', path: '/app/files' },
  { name: 'Memory',    icon: BrainCircuit,    color: 'text-red-500',    bg: 'bg-red-50',     activeBg: 'bg-red-100',    path: '/app/memory' },
  { name: 'Goals',     icon: Trophy,          color: 'text-teal-500',   bg: 'bg-teal-50',    activeBg: 'bg-teal-100',   path: '/app/goals' },
  { name: 'Analytics', icon: BarChart3,       color: 'text-pink-500',   bg: 'bg-pink-50',    activeBg: 'bg-pink-100',   path: '/app/analytics' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  return (
    <aside className="w-64 bg-white h-screen border-r border-gray-100 flex flex-col fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="p-6 flex items-center space-x-3">
        <img src="/Fevicon.png" alt="NeuroDesk" className="w-9 h-9 rounded-xl shadow-md" />
        <span className="text-xl font-bold text-gray-900">NeuroDesk</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 mt-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={index}
              to={item.path}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive ? `${item.activeBg} text-gray-900` : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                isActive ? item.bg : 'bg-gray-100 group-hover:' + item.bg
              }`}>
                <Icon className={`w-4 h-4 ${isActive ? item.color : 'text-gray-400 group-hover:' + item.color}`} />
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-gray-100 m-3 rounded-xl hover:bg-gray-50 cursor-pointer flex items-center space-x-3 transition-colors">
        <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
            alt="User avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
          <p className="text-xs text-gray-400">Free plan</p>
        </div>
        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </aside>
  );
};

export default Sidebar;
