import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from './StatusBadge.jsx';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hideNav = ['/login', '/register'].includes(location.pathname);
  const isAdmin = ['tenant_admin', 'super_admin'].includes(user?.role);

  return (
    <>
      {!hideNav && (
        <header className="topbar">
          <div className="brand" role="button" onClick={() => navigate('/dashboard')}>
            Multi-Tenant SaaS
          </div>
          <nav className="nav-links">
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>Dashboard</NavLink>
            <NavLink to="/projects" className={({ isActive }) => (isActive ? 'active' : '')}>Projects</NavLink>
            {isAdmin && <NavLink to="/users" className={({ isActive }) => (isActive ? 'active' : '')}>Users</NavLink>}
          </nav>
          <div className="user-chip">
            <div>
              <div className="user-name">{user?.fullName || user?.full_name || user?.email}</div>
              <div className="user-meta">
                <StatusBadge value={user?.role || 'guest'} />
              </div>
            </div>
            <button className="ghost" onClick={() => logout()}>Logout</button>
          </div>
        </header>
      )}
      <main className="page-shell">{children}</main>
    </>
  );
};

export default Layout;
