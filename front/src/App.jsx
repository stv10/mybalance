import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Route-based code splitting — each page loads its own chunk using retry logic on chunk loading failures
const Login = lazyWithRetry(() => import('./pages/Login'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));

const LoadingScreen = () => (
  <div className="spinner-container" style={{ minHeight: '100vh' }}>
    <div className="spinner"></div>
    <p className="loading-text">Cargando...</p>
  </div>
);

function App() {
  useEffect(() => {
    // Clear the reload flag once the app has successfully loaded/mounted
    window.sessionStorage.removeItem('page-has-been-reloaded');
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* Everything else redirects to dashboard, which redirects to /login if unauthenticated */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
