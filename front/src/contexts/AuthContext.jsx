import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Lazy initializer: avoids JSON.parse on every re-render
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Mark loading as done after initial hydration
  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const result = await apiService.login(email, password);

      if (!result.success) {
        throw new Error(result.message || 'Error al iniciar sesión');
      }

      const { token: jwtToken, email: userEmail, name: userName } = result.data;

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify({ email: userEmail, name: userName }));

      setToken(jwtToken);
      setUser({ email: userEmail, name: userName });

      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const result = await apiService.register(name, email, password);

      if (!result.success) {
        throw new Error(result.message || 'Error al registrarse');
      }

      const { token: jwtToken, email: userEmail, name: userName } = result.data;

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify({ email: userEmail, name: userName }));

      setToken(jwtToken);
      setUser({ email: userEmail, name: userName });

      return result;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
