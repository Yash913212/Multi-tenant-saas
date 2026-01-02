import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';

const defaultForm = { fullName: '', email: '', password: '', role: 'user', isActive: true };

const UsersPage = () => {
  const { user } = useAuth();
  const canManage = ['super_admin', 'tenant_admin'].includes(user?.role);
  const tenantId = useMemo(() => user?.tenant?.id || user?.tenantId || user?.tenant_id, [user]);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', role: '', isActive: '' });
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const path = tenantId ? `/tenants/${tenantId}/users` : '/users';

  const load = async(page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(path, { params: { ...filters, page, limit: 10 } });
      const payload = data.data || {};
      setUsers(payload.users || []);
      setPagination(payload.pagination || { currentPage: 1, totalPages: 1 });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [path]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ fullName: u.full_name || u.fullName || '', email: u.email, password: '', role: u.role, isActive: u.is_active ?? true });
    setModalOpen(true);
  };

  const submit = async(e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, { fullName: form.fullName, role: form.role, isActive: form.isActive, password: form.password || undefined });
        setMessage('User updated');
      } else {
        await api.post(path, { email: form.email, password: form.password, fullName: form.fullName, role: form.role });
        setMessage('User created');
      }
      setModalOpen(false);
      setForm(defaultForm);
      setEditing(null);
      await load(pagination.currentPage);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save user');
    }
  };

  const remove = async(userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      await load(pagination.currentPage);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const applyFilters = (e) => {
    e.preventDefault();
    load(1);
  };

  return (
    <div className="container space-lg">
      <div className="card">
        <div className="card-header">
          <h2>Users</h2>
          {canManage && <button className="primary" onClick={openCreate}>Invite user</button>}
        </div>

        <form className="grid four-cols compact" onSubmit={applyFilters}>
          <label>
            <span>Search</span>
            <input placeholder="Search name or email" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </label>
          <label>
            <span>Role</span>
            <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
              <option value="">All</option>
              <option value="user">User</option>
              <option value="tenant_admin">Tenant Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={filters.isActive} onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}>
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <div className="actions-row">
            <button type="submit" className="ghost">Apply</button>
          </div>
        </form>

        {message && <div className="alert alert-info">{message}</div>}

        {loading ? (
          <Spinner label="Loading users..." />
        ) : users.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name || u.fullName || '—'}</td>
                  <td>{u.email}</td>
                  <td><StatusBadge value={u.role} /></td>
                  <td><StatusBadge value={u.is_active ? 'active' : 'inactive'} tone={u.is_active ? 'success' : 'muted'} /></td>
                  <td className="table-actions">
                    {canManage && (
                      <>
                        <button className="ghost" onClick={() => openEdit(u)}>Edit</button>
                        <button className="ghost danger" onClick={() => remove(u.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No users found" subtitle="Invite your team to collaborate." />
        )}

        <div className="pagination">
          <button disabled={pagination.currentPage <= 1} onClick={() => load(pagination.currentPage - 1)}>Prev</button>
          <span>Page {pagination.currentPage} of {pagination.totalPages || 1}</span>
          <button disabled={pagination.currentPage >= (pagination.totalPages || 1)} onClick={() => load(pagination.currentPage + 1)}>Next</button>
        </div>
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit user' : 'Invite user'} onClose={() => setModalOpen(false)}>
          <form className="stack" onSubmit={submit}>
            <label>
              <span>Full name</span>
              <input name="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </label>
            {!editing && (
              <label>
                <span>Email</span>
                <input name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </label>
            )}
            <label>
              <span>Password {editing ? '(leave blank to keep)' : ''}</span>
              <input name="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? '••••••••' : ''} {...(!editing ? { required: true } : {})} />
            </label>
            <label>
              <span>Role</span>
              <select name="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="user">User</option>
                <option value="tenant_admin">Tenant Admin</option>
                {user?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
              </select>
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <span>Active</span>
            </label>
            <div className="actions-row">
              <button type="button" className="ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="primary">{editing ? 'Save changes' : 'Invite user'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UsersPage;
