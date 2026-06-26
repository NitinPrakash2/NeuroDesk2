import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useLayout } from './layout/AppLayout';
import toast from 'react-hot-toast';

export default function PageHeader({
  title,
  searchQuery,
  setSearchQuery,
  searchOpen,
  setSearchOpen,
  searchFocused,
  setSearchFocused,
  searchResults,
  notificationOpen,
  setNotificationOpen,
}) {
  const { user } = useAuth();
  const { notifications, clearNotifications } = useNotifications();
  const { toggleSidebar } = useLayout();
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationOpen && !event.target.closest('.notification-container')) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationOpen, setNotificationOpen]);

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

  const handleClearNotifications = async () => {
    try {
      await clearNotifications();
      toast.success('Notifications cleared');
      setNotificationOpen(false);
    } catch (err) {
      toast.error('Failed to clear notifications');
    }
  };

  return (
    <>
      {/* Mobile Header - fixed top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-lg border-b border-slate-200 h-14 px-4">
        {/* Show these when search is closed */}
        {!searchOpen && (
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={toggleSidebar}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 flex-shrink-0 transition-colors"
                aria-label="Open menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {title && (
                <h1 className="text-base font-bold text-slate-800 truncate">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Search Toggle */}
              <button
                onClick={handleSearchToggle}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                title="Search"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              {/* Notification */}
              <div className="relative notification-container">
                <button
                  onClick={() => setNotificationOpen(o => !o)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-rose-400 to-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>
              {/* Settings */}
              <Link
                to="/app/account"
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                title="Settings"
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              {/* Profile */}
              <Link to="/app/account" className="relative">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                  alt="Profile"
                  className="w-8 h-8 rounded-lg border border-slate-200 object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
              </Link>
            </div>
          </div>
        )}

        {/* Search input overlay when open on mobile */}
        {searchOpen && (
          <div className="flex items-center gap-2 h-14 search-container">
            <button
              onClick={handleSearchClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 flex-shrink-0 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative flex-1">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                autoFocus
              />
            </div>
            {/* Search results dropdown */}
            {searchFocused && searchQuery.trim() && (
              <div className="fixed left-0 right-0 top-28 z-50 mx-4 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-[slideDown_0.2s_ease-out] max-h-[60vh] overflow-y-auto">
                <SearchResults
                  results={searchResults}
                  query={searchQuery}
                />
              </div>
            )}
          </div>
        )}
      </div>

        {/* Mobile notification dropdown (always accessible) */}
        {notificationOpen && (
          <div className="fixed inset-0 top-14 z-50 bg-white lg:hidden animate-[slideDown_0.2s_ease-out] overflow-y-auto">
            <NotificationDropdown
              notifications={notifications}
              onClear={handleClearNotifications}
            />
          </div>
        )}

      {/* Desktop Header */}
      <header className="hidden lg:flex justify-between items-center mb-6 md:mb-8 relative z-10">
        {/* Left: Search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 search-container">
          {searchOpen && (
            <div className="relative w-full sm:w-[380px] overflow-hidden" style={{
              animation: isClosing ? 'slideOutToLeft 0.25s ease-in forwards' : 'slideInFromLeft 0.3s ease-out'
            }}>
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-400 focus:bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300"
                autoFocus
              />
              {searchFocused && searchQuery.trim() && (
                <div className="absolute top-12 left-0 w-full bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-[slideDown_0.2s_ease-out]">
                  <SearchResults results={searchResults} query={searchQuery} />
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleSearchToggle}
            className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 ${
              searchOpen
                ? 'bg-[#5A67D8] border-[#5A67D8] text-white'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        </div>

        {/* Right: Notification + Settings + Profile */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative notification-container">
            <button
              onClick={() => setNotificationOpen(o => !o)}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-rose-400 to-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  {notifications.length}
                </span>
              )}
            </button>
            {notificationOpen && (
              <div className="absolute top-12 right-0 w-[calc(100vw-32px)] sm:w-[380px] bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-[slideDown_0.2s_ease-out]">
                <NotificationDropdown
                  notifications={notifications}
                  onClear={handleClearNotifications}
                />
              </div>
            )}
          </div>

          {/* Settings */}
          <Link
            to="/app/account"
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300"
            title="Settings"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>

          {/* Profile Avatar */}
          <Link to="/app/account" className="relative">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
              alt="Profile"
              className="w-10 h-10 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 cursor-pointer object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full shadow-sm" />
          </Link>
        </div>
      </header>

      <style jsx>{`
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-20px) scaleX(0.8); transform-origin: left; }
          to { opacity: 1; transform: translateX(0) scaleX(1); transform-origin: left; }
        }
        @keyframes slideOutToLeft {
          from { opacity: 1; transform: translateX(0) scaleX(1); transform-origin: left; }
          to { opacity: 0; transform: translateX(-20px) scaleX(0.8); transform-origin: left; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

/* Shared sub-components */

function SearchResults({ results, query }) {
  return results.length > 0 ? (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase px-4 pt-3 pb-2 tracking-wide">
        {results.length} result{results.length > 1 ? 's' : ''} found
      </p>
      {results.slice(0, 8).map((r, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 cursor-pointer transition-all duration-200 border-b border-slate-50 last:border-0 group">
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${r.color}`}>{r.type}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{r.title}</p>
            {r.sub && <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.sub}</p>}
          </div>
        </div>
      ))}
      {results.length > 8 && (
        <p className="text-[11px] text-slate-400 text-center py-3 bg-slate-50">+{results.length - 8} more results</p>
      )}
    </div>
  ) : (
    <div className="px-4 py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-600">No results for "{query}"</p>
      <p className="text-xs text-slate-400 mt-1">Try searching tasks, notes, goals or memories</p>
    </div>
  );
}

function NotificationDropdown({ notifications, onClear }) {
  return (
    <>
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Notifications
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
            {notifications.length} new
          </span>
          {notifications.length > 0 && (
            <button onClick={onClear} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg transition-all">
              Clear All
            </button>
          )}
        </div>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((n, i) => {
            const timeAgo = Math.floor((new Date() - n.time) / 60000);
            const timeStr = timeAgo < 1 ? 'Just now' : timeAgo < 60 ? `${timeAgo}m ago` : timeAgo < 1440 ? `${Math.floor(timeAgo / 60)}h ago` : `${Math.floor(timeAgo / 1440)}d ago`;
            return (
              <div key={i} className="px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 cursor-pointer transition-all group">
                <div className="flex items-start gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${n.color} flex-shrink-0`}>{n.type}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600">{n.title}</p>
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
          <div className="px-4 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-600">No notifications</p>
            <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
          </div>
        )}
      </div>
    </>
  );
}
