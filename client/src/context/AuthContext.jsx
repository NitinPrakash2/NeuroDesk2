import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const token = sessionStorage.getItem('token');
    const name = sessionStorage.getItem('name');
    const email = sessionStorage.getItem('email');
    const avatar = sessionStorage.getItem('avatar');
    const has_password = sessionStorage.getItem('has_password');
    return token ? { token, name, email, avatar, has_password: has_password === 'true' } : null;
  });

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      api.get('/user/profile').then(({ data }) => {
        const updated = { token, name: data.name, email: data.email, avatar: data.avatar, has_password: data.has_password };
        sessionStorage.setItem('name', data.name || '');
        sessionStorage.setItem('email', data.email || '');
        if (data.avatar) sessionStorage.setItem('avatar', data.avatar);
        sessionStorage.setItem('has_password', data.has_password ? 'true' : 'false');
        setUser(updated);
      }).catch(() => {});
    }
  }, []);

  const login = (data) => {
    sessionStorage.setItem('token', data.token);
    if (data.name) sessionStorage.setItem('name', data.name);
    if (data.email) sessionStorage.setItem('email', data.email);
    if (data.avatar) sessionStorage.setItem('avatar', data.avatar);
    if (data.has_password !== undefined) sessionStorage.setItem('has_password', data.has_password ? 'true' : 'false');
    setUser(data);
    // Fetch fresh profile to ensure has_password and other fields are synced
    api.get('/user/profile').then(({ data: profile }) => {
      const updated = { token: data.token, name: profile.name, email: profile.email, avatar: profile.avatar, has_password: profile.has_password };
      sessionStorage.setItem('name', profile.name || '');
      sessionStorage.setItem('email', profile.email || '');
      if (profile.avatar) sessionStorage.setItem('avatar', profile.avatar);
      sessionStorage.setItem('has_password', profile.has_password ? 'true' : 'false');
      setUser(updated);
    }).catch(() => {});
  };

  const logout = () => {
    sessionStorage.clear();
    setUser(null);
    setTimeout(() => navigate('/'), 0);
  };

  const refreshUser = () => {
    const token = sessionStorage.getItem('token');
    if (token) {
      api.get('/user/profile').then(({ data }) => {
        const updated = { token, name: data.name, email: data.email, avatar: data.avatar, has_password: data.has_password };
        sessionStorage.setItem('name', data.name || '');
        sessionStorage.setItem('email', data.email || '');
        if (data.avatar) sessionStorage.setItem('avatar', data.avatar);
        sessionStorage.setItem('has_password', data.has_password ? 'true' : 'false');
        setUser(updated);
      }).catch(() => {});
    }
  };

  return <AuthContext.Provider value={{ user, login, logout, refreshUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
