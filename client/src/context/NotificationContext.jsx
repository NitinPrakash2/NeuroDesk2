import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [shouldAutoInit, setShouldAutoInit] = useState(true);

  const addNotification = (notification) => {
    setNotifications(prev => [{ ...notification, time: new Date() }, ...prev].slice(0, 8));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShouldAutoInit(false);
    localStorage.setItem('notificationsCleared', 'true');
  };

  const initializeNotifications = (tasks, notes, goals, memories) => {
    const cleared = localStorage.getItem('notificationsCleared');
    if (cleared === 'true') return;
    
    const notifs = [];
    tasks.slice(0, 3).forEach(t => {
      notifs.push({ type: 'Task', icon: '✅', title: t.title, sub: `${t.priority} priority`, time: new Date(t.created_at), color: 'bg-indigo-50 text-indigo-600' });
    });
    notes.slice(0, 2).forEach(n => {
      notifs.push({ type: 'Note', icon: '📝', title: n.title, sub: 'Created', time: new Date(n.created_at), color: 'bg-orange-50 text-orange-600' });
    });
    goals.slice(0, 2).forEach(g => {
      notifs.push({ type: 'Goal', icon: '🎯', title: g.title, sub: `${g.progress}% complete`, time: new Date(g.created_at), color: 'bg-teal-50 text-teal-600' });
    });
    memories.slice(0, 2).forEach(m => {
      notifs.push({ type: 'Memory', icon: '🔐', title: m.label, sub: 'Saved', time: new Date(m.created_at), color: 'bg-blue-50 text-blue-600' });
    });
    setNotifications(notifs.sort((a, b) => b.time - a.time).slice(0, 8));
  };

  const resetNotificationFlag = () => {
    localStorage.removeItem('notificationsCleared');
    setShouldAutoInit(true);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, clearNotifications, initializeNotifications, resetNotificationFlag }}>
      {children}
    </NotificationContext.Provider>
  );
};
