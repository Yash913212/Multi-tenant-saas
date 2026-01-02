import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from './StatusBadge.jsx';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hideNav = ['/login', '/register'].includes(location.pathname);
  const isAdmin = ['tenant_admin', 'super_admin'].includes(user?.role);
  const isSuper = user?.role === 'super_admin';
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const closeMenus = () => {
    setMenuOpen(false);
    setUserOpen(false);
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', show: true },
    { to: '/projects', label: 'Projects', show: true },
    { to: '/tasks', label: 'Tasks', show: isAdmin },
    { to: '/users', label: 'Users', show: isAdmin },
    { to: '/tenants', label: 'Tenants', show: isSuper }
  ].filter((l) => l.show);

  return (
    <>
      {!hideNav && (
        <header className="topbar" onMouseLeave={() => setUserOpen(false)}>
          <div className="brand" role="button" onClick={() => { navigate('/dashboard'); closeMenus(); }}>
            Multi-Tenant SaaS
          </div>

          <button className="ghost only-mobile" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle navigation">
            ☰
          </button>

          <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeMenus}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="user-chip" onClick={() => setUserOpen((v) => !v)}>
            <div>
              <div className="user-name">{user?.fullName || user?.full_name || user?.email}</div>
              <div className="user-meta">
                <StatusBadge value={user?.role || 'guest'} />
              </div>
            </div>
            <span className="chevron">▾</span>
            {userOpen && (
              <div className="dropdown">
                <button className="ghost" onClick={() => { closeMenus(); navigate('/dashboard'); }}>Profile</button>
                <button className="ghost" onClick={() => { closeMenus(); navigate('/dashboard'); }}>Settings</button>
                <button className="ghost danger" onClick={() => { closeMenus(); logout(); }}>Logout</button>
              </div>
            )}
          </div>
        </header>
      )}
      <main className="page-shell" onClick={closeMenus}>{children}</main>
    </>
  );
};

export default Layout;
