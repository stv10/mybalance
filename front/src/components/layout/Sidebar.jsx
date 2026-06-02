import React from 'react';
import {
  Wallet,
  LayoutGrid,
  ListOrdered,
  CreditCard,
  TrendingDown,
  PiggyBank,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  { key: 'overview',      label: 'Resumen',       Icon: LayoutGrid },
  { key: 'transactions',  label: 'Transacciones', Icon: ListOrdered },
  { key: 'accounts',      label: 'Cuentas',       Icon: CreditCard },
  { key: 'budgets',       label: 'Presupuestos',  Icon: TrendingDown },
  { key: 'goals',         label: 'Metas',         Icon: PiggyBank },
  { key: 'settings',      label: 'Ajustes',       Icon: Settings },
];

/**
 * Sidebar — navegación lateral del dashboard.
 *
 * @param {string} activeTab
 * @param {(tab: string) => void} onTabChange
 */
const Sidebar = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  const avatarLetter = user?.name?.trim().charAt(0).toUpperCase() ?? 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-header hide-on-mobile">
        <Wallet size={24} style={{ color: 'var(--primary)' }} />
        <span className="gradient-text">MyBalance</span>
      </div>

      <nav className="sidebar-nav" role="navigation" aria-label="Navegación principal">
        {NAV_ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`sidebar-nav-item ${activeTab === key ? 'active' : ''}`}
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
            aria-current={activeTab === key ? 'page' : undefined}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer hide-on-mobile">
        {user && (
          <div className="user-profile-summary">
            <div className="user-avatar">{avatarLetter}</div>
            <div className="user-info-text">
              <span className="user-name-label">{user.name}</span>
              <span className="user-email-label">{user.email}</span>
            </div>
          </div>
        )}
        <button className="btn-logout" onClick={logout} aria-label="Cerrar sesión">
          <LogOut size={16} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
