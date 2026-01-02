import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const TenantsPage = () => {
  const { user } = useAuth();
  const isSuper = useMemo(() => user?.role === 'super_admin', [user]);
  const [tenants, setTenants] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ status: '', subscriptionPlan: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async(page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/tenants', { params: { ...filters, page, limit: 20 } });
      const payload = data.data || {};
      setTenants(payload.tenants || []);
      setPagination(payload.pagination || { currentPage: 1, totalPages: 1 });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuper) load();
  }, [isSuper]);

  const applyFilters = (e) => {
    e.preventDefault();
    load(1);
  };

  if (!isSuper) {
    return <div className="container"><div className="alert alert-error">Forbidden: super admin only.</div></div>;
  }

  return (
    <div className="container space-lg">
      <div className="card">
        <div className="card-header">
          <h2>Tenants</h2>
          <p className="muted">Super admin overview</p>
        </div>

        <form className="grid three-cols compact" onSubmit={applyFilters}>
          <label>
            <span>Status</span>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trial</option>
            </select>
          </label>
          <label>
            <span>Plan</span>
            <select value={filters.subscriptionPlan} onChange={(e) => setFilters({ ...filters, subscriptionPlan: e.target.value })}>
              <option value="">All</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>
          <div className="actions-row">
            <button className="ghost" type="submit">Apply</button>
          </div>
        </form>

        {message && <div className="alert alert-info">{message}</div>}

        {loading ? (
          <Spinner label="Loading tenants..." />
        ) : tenants.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Subdomain</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Users</th>
                <th>Projects</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.subdomain}</td>
                  <td><StatusBadge value={t.status} /></td>
                  <td><StatusBadge value={t.subscription_plan || t.subscriptionPlan} /></td>
                  <td>{t.totalUsers ?? '—'}</td>
                  <td>{t.totalProjects ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No tenants" subtitle="Try adjusting filters." />
        )}

        <div className="pagination">
          <button disabled={pagination.currentPage <= 1} onClick={() => load(pagination.currentPage - 1)}>Prev</button>
          <span>Page {pagination.currentPage} of {pagination.totalPages || 1}</span>
          <button disabled={pagination.currentPage >= (pagination.totalPages || 1)} onClick={() => load(pagination.currentPage + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default TenantsPage;
