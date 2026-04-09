import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Task';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              {/* If you are using MainLayout for your sidebar, it usually wraps these Routes! */}
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} /> {/* 2. ADD THIS ROUTE */}
                <Route path="*" element={<Navigate to="/app/dashboard" />} />
              </Routes>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;