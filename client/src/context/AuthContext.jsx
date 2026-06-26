import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    const avatar = localStorage.getItem('avatar');
    const has_password = localStorage.getItem('has_password');
    return token ? { token, name, email, avatar, has_password: has_password === 'true' } : null;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/user/profile').then(({ data }) => {
        const updated = { token, name: data.name, email: data.email, avatar: data.avatar, has_password: data.has_password };
        localStorage.setItem('name', data.name || '');
        localStorage.setItem('email', data.email || '');
        if (data.avatar) localStorage.setItem('avatar', data.avatar);
        localStorage.setItem('has_password', data.has_password ? 'true' : 'false');
        setUser(updated);
      }).catch(() => {});
    }
  }, []);

  const login = (data) => {
    localStorage.setItem('token', data.token);
    if (data.name) localStorage.setItem('name', data.name);
    if (data.email) localStorage.setItem('email', data.email);
    if (data.avatar) localStorage.setItem('avatar', data.avatar);
    if (data.has_password !== undefined) localStorage.setItem('has_password', data.has_password ? 'true' : 'false');
    setUser(data);
    api.get('/user/profile').then(({ data: profile }) => {
      const updated = { token: data.token, name: profile.name, email: profile.email, avatar: profile.avatar, has_password: profile.has_password };
      localStorage.setItem('name', profile.name || '');
      localStorage.setItem('email', profile.email || '');
      if (profile.avatar) localStorage.setItem('avatar', profile.avatar);
      localStorage.setItem('has_password', profile.has_password ? 'true' : 'false');
      setUser(updated);
    }).catch(() => {});
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('avatar');
    localStorage.removeItem('has_password');
    setUser(null);
    setTimeout(() => navigate('/'), 0);
  };

  const refreshUser = () => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/user/profile').then(({ data }) => {
        const updated = { token, name: data.name, email: data.email, avatar: data.avatar, has_password: data.has_password };
        localStorage.setItem('name', data.name || '');
        localStorage.setItem('email', data.email || '');
        if (data.avatar) localStorage.setItem('avatar', data.avatar);
        localStorage.setItem('has_password', data.has_password ? 'true' : 'false');
        setUser(updated);
      }).catch(() => {});
    }
  };

  return <AuthContext.Provider value={{ user, login, logout, refreshUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
