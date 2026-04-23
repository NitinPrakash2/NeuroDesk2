import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function PageHeader({ 
  searchQuery, 
  setSearchQuery, 
  searchOpen, 
  setSearchOpen,
  searchFocused,
  setSearchFocused,
  searchResults,
  actionButton,
  actionButtons,
  notificationOpen,
  setNotificationOpen,
  showLogout,
  onLogout
}) {
  const { user } = useAuth();
  const { notifications, clearNotifications } = useNotifications();
  const [isClosing, setIsClosing] = React.useState(false);

  // Close notification dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationOpen && !event.target.closest('.notification-container')) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationOpen, setNotificationOpen]);

  // Close search bar when clicking outside (only if search query is empty)
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchOpen && !searchQuery.trim() && !event.target.closest('.search-container')) {
        handleSearchClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen, searchQuery]);

  const handleSearchClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSearchOpen(false);
      setIsClosing(false);
    }, 250);
  };

  const handleSearchToggle = () => {
    if (searchOpen) {
      handleSearchClose();
      if (!searchQuery.trim()) {
        setSearchQuery('');
      }
    } else {
      setSearchOpen(true);
    }
  };

  return (
    <header className="flex justify-between items-center mb-10 relative z-10">
      {/* Left: Search Bar */}
      <div className="flex items-center gap-3 search-container">
        {searchOpen && (
          <div className="relative w-[420px] overflow-hidden" style={{
            animation: isClosing ? 'slideOutToLeft 0.25s ease-in forwards' : 'slideInFromLeft 0.3s ease-out'
          }}>
            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              className="w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-indigo-400 focus:bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300"
              autoFocus
            />

            {/* Search Dropdown */}
            {searchFocused && searchQuery.trim() && (
              <div className="absolute top-14 left-0 w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-[slideDown_0.2s_ease-out]">
                {searchResults.length > 0 ? (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase px-4 pt-3 pb-2 tracking-wide">
                      {searchResults.length} result{searchResults.length > 1 ? 's' : ''} found
                    </p>
                    {searchResults.slice(0, 8).map((r, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-all duration-200 border-b border-slate-50 last:border-0 group"
                      >
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${r.color} transition-transform group-hover:scale-105`}>
                          {r.type}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                            {r.title}
                          </p>
                          {r.sub && <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.sub}</p>}
                        </div>
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    ))}
                    {searchResults.length > 8 && (
                      <p className="text-[11px] text-slate-400 text-center py-3 bg-slate-50">
                        +{searchResults.length - 8} more results
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-600">No results for "{searchQuery}"</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching tasks, notes, goals or memories</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={handleSearchToggle}
          className={`w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full border-2 shadow-sm hover:shadow-lg transition-shadow duration-300 ${
            searchOpen 
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-500 text-white' 
              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Right: Action Buttons + Notification + Profile */}
      <div className="flex items-center gap-3">
        {/* Multiple Action Buttons */}
        {actionButtons && actionButtons.map((btn, idx) => (
          <button
            key={idx}
            onClick={btn.onClick}
            disabled={btn.disabled}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-lg transition-shadow duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              btn.variant === 'secondary'
                ? 'bg-white text-indigo-600 border-2 border-indigo-100 hover:bg-indigo-50'
                : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{btn.label}</span>
          </button>
        ))}

        {/* Single Action Button */}
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            disabled={actionButton.disabled}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-lg transition-shadow duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{actionButton.label}</span>
          </button>
        )}

        {/* Logout Button */}
        {showLogout && onLogout && (
          <button
            onClick={onLogout}
            title="Logout"
            className="w-11 h-11 flex items-center justify-center bg-white border-2 border-red-100 text-red-500 rounded-full shadow-sm hover:shadow-lg hover:bg-red-50 hover:border-red-200 transition-shadow duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative notification-container">
          <button
            onClick={() => setNotificationOpen(o => !o)}
            className="w-11 h-11 flex items-center justify-center bg-white border-2 border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow-lg transition-shadow duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-rose-400 to-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notificationOpen && (
            <div className="absolute top-14 right-0 w-[400px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-[slideDown_0.2s_ease-out]">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Notifications
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    {notifications.length} new
                  </span>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => { clearNotifications(); setNotificationOpen(false); }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-all duration-200"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n, i) => {
                    const timeAgo = Math.floor((new Date() - n.time) / 60000);
                    const timeStr = timeAgo < 1 ? 'Just now' : timeAgo < 60 ? `${timeAgo}m ago` : timeAgo < 1440 ? `${Math.floor(timeAgo / 60)}h ago` : `${Math.floor(timeAgo / 1440)}d ago`;
                    return (
                      <div key={i} className="px-5 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 cursor-pointer transition-all duration-200 group">
                        <div className="flex items-start gap-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${n.color} flex-shrink-0 transition-transform group-hover:scale-105`}>
                            {n.type}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.sub}</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {timeStr}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-5 py-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-600">No notifications</p>
                    <p className="text-xs text-slate-400 mt-1">You're all caught up! 🎉</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="relative">
          <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} 
            alt="Profile" 
            className="w-11 h-11 rounded-full border-2 border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-shadow duration-300 cursor-pointer" 
          />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-sm" />
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-20px) scaleX(0.8);
            transform-origin: left;
          }
          to {
            opacity: 1;
            transform: translateX(0) scaleX(1);
            transform-origin: left;
          }
        }
        @keyframes slideOutToLeft {
          from {
            opacity: 1;
            transform: translateX(0) scaleX(1);
            transform-origin: left;
          }
          to {
            opacity: 0;
            transform: translateX(-20px) scaleX(0.8);
            transform-origin: left;
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}
