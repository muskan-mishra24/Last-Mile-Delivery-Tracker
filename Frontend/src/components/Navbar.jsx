import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const styles = {
  nav: {
    background: '#1e40af',
    color: '#fff',
    padding: '0 24px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  navLinks: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  userInfo: {
    fontSize: '14px',
    color: '#bfdbfe',
  },
  roleBadge: {
    background: '#3b82f6',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginLeft: '8px',
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #93c5fd',
    color: '#bfdbfe',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  navLink: {
    color: '#bfdbfe',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  navLinkActive: {
    color: '#fff',
    background: '#3b82f6',
  },
};

const ROLE_LABELS = {
  customer: 'Customer',
  delivery_agent: 'Agent',
  admin: 'Admin',
};

const DASHBOARD_PATHS = {
  customer: '/home',
  delivery_agent: '/home',
  admin: '/home',
};

const SPECIFIC_DASHBOARDS = {
  customer: '/dashboard',
  delivery_agent: '/agent',
  admin: '/admin',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) {
    return (
      <nav style={styles.nav}>
        <Link to="/login" style={styles.brand}>
          Last-Mile Delivery
        </Link>
      </nav>
    );
  }

  return (
    <nav style={styles.nav}>
      <Link to={DASHBOARD_PATHS[user.role] || '/'} style={styles.brand}>
        Last-Mile Delivery
      </Link>
      <div style={styles.right}>
        <div style={styles.navLinks}>
          <Link to="/home" style={{ ...styles.navLink }}>
            📍 Features
          </Link>
          <Link to={SPECIFIC_DASHBOARDS[user.role]} style={{ ...styles.navLink }}>
            🎯 My Dashboard
          </Link>
        </div>
        <span style={styles.userInfo}>
          {user.name}
          <span style={styles.roleBadge}>{ROLE_LABELS[user.role] || user.role}</span>
        </span>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
