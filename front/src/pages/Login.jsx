import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Wallet, AlertTriangle, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading || isAuthenticated) {
    return (
      <div className="spinner-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p className="loading-text">Cargando...</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Credenciales inválidas o error de conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper animate-fade-in">
      {/* Sidebar - Brand Presentation */}
      <div className="auth-sidebar">
        <div className="auth-brand-logo">
          <Wallet size={28} className="gradient-text" style={{ stroke: 'var(--primary)' }} />
          <span className="gradient-text">MyBalance</span>
        </div>
        <div className="auth-sidebar-content">
          <h1 className="auth-sidebar-title">
            Toma el control de tu <span className="gradient-text">futuro financiero</span>
          </h1>
          <p className="auth-sidebar-text">
            Monitorea tus ingresos, optimiza tus presupuestos y alcanza tus metas de ahorro con nuestra plataforma de gestión inteligente.
          </p>
        </div>
        <div className="auth-sidebar-footer">
          &copy; 2026 MyBalance Inc. Todos los derechos reservados.
        </div>
      </div>

      {/* Main Content - Form */}
      <div className="auth-form-container">
        <div className="auth-form-card glass-container">
          <div className="auth-header">
            <h2 className="auth-title">Bienvenido de nuevo</h2>
            <p className="auth-subtitle">
              Ingresa tus credenciales para acceder a tu panel.
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertTriangle className="alert-icon" size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Correo Electrónico
              </label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>
                  Contraseña
                </label>
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '1.5rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="auth-link">
              Regístrate gratis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
