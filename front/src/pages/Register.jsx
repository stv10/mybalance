import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Lock, Wallet, AlertTriangle, ArrowRight } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated, loading } = useAuth();
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

    // Basic Validation
    if (!name.trim()) {
      setError('Por favor, ingresa tu nombre.');
      return;
    }

    if (name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    if (!email) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }

    if (!password) {
      setError('Por favor, ingresa una contraseña.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name.trim(), email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Ocurrió un error al registrar la cuenta.');
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
            Empieza a ahorrar <span className="gradient-text">desde hoy mismo</span>
          </h1>
          <p className="auth-sidebar-text">
            Crea tu cuenta de forma 100% gratuita y únete a miles de personas que ya planifican su libertad financiera con precisión y tranquilidad.
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
            <h2 className="auth-title">Crea tu cuenta</h2>
            <p className="auth-subtitle">
              Gestiona tus finanzas de forma simple y automatizada.
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
              <label className="form-label" htmlFor="name">
                Nombre Completo
              </label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="Tu Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

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
              <label className="form-label" htmlFor="password">
                Contraseña (Mínimo 8 caracteres)
              </label>
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
              {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="auth-link">
              Inicia sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
