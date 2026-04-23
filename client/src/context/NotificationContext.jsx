import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const pollingIntervalRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      if (user) {
        const { data } = await api.get('/notifications');
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Polling every 2 seconds for real-time updates
    pollingIntervalRef.current = setInterval(() => {
      if (user) {
        fetchNotifications();
      }
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [user]);

  const addNotification = async (notification) => {
    try {
      const { data } = await api.post('/notifications', notification);
      setNotifications(prev => [data, ...prev].slice(0, 8));
      return data;
    } catch (err) {
      console.error('Failed to add notification:', err);
      throw err;
    }
  };

  const clearNotifications = async () => {
    try {
      await api.post('/user/clear-notifications');
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      throw err;
    }
  };

  const initializeNotifications = (tasks, notes, goals, memories) => {
    // Notifications are now fetched from database, not generated here
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, clearNotifications, initializeNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
