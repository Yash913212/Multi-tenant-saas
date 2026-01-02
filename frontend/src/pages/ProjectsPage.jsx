import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';

const defaultForm = { name: '', description: '', status: 'active' };

const ProjectsPage = () => {
  const { user } = useAuth();
  const canManage = ['super_admin', 'tenant_admin'].includes(user?.role);
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/projects', { params: { ...filters, page, limit: 10 } });
      const result = data.data || {};
      setProjects(result.projects || []);
      setPagination(result.pagination || { currentPage: 1, totalPages: 1 });
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(defaultForm);
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setForm({ name: project.name, description: project.description || '', status: project.status || 'active' });
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (editing) {
        await api.patch(`/projects/${editing.id}`, form);
        setMessage('Project updated');
      } else {
        await api.post('/projects', form);
        setMessage('Project created');
      }
      setModalOpen(false);
      setForm(defaultForm);
      await load(pagination.currentPage);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save project');
    }
  };

  const remove = async (projectId) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      await load(pagination.currentPage);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete project');
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
          <h2>Projects</h2>
          {canManage && <button className="primary" onClick={openCreate}>New Project</button>}
        </div>

        <form className="grid three-cols compact" onSubmit={applyFilters}>
          <label>
            <span>Search</span>
            <input placeholder="Search by name" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </label>
          <label>
            <span>Status</span>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <div className="actions-row">
            <button type="submit" className="ghost">Apply</button>
          </div>
        </form>

        {message && <div className="alert alert-info">{message}</div>}

        {loading ? (
          <Spinner label="Loading projects..." />
        ) : projects.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Tasks</th>
                <th>Owner</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td><Link to={`/projects/${p.id}`}>{p.name}</Link></td>
                  <td><StatusBadge value={p.status} /></td>
                  <td>{p.completedTaskCount ? `${p.completedTaskCount}/${p.taskCount || 0}` : p.taskCount || 0}</td>
                  <td>{p.createdBy?.fullName || '—'}</td>
                  <td className="table-actions">
                    <Link to={`/projects/${p.id}`} className="ghost">Open</Link>
                    {canManage && (
                      <>
                        <button className="ghost" onClick={() => openEdit(p)}>Edit</button>
                        <button className="ghost danger" onClick={() => remove(p.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No projects found" subtitle="Try different filters or create a new project." />
        )}

        <div className="pagination">
          <button disabled={pagination.currentPage <= 1} onClick={() => load(pagination.currentPage - 1)}>Prev</button>
          <span>Page {pagination.currentPage} of {pagination.totalPages || 1}</span>
          <button disabled={pagination.currentPage >= (pagination.totalPages || 1)} onClick={() => load(pagination.currentPage + 1)}>Next</button>
        </div>
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Edit project' : 'New project'} onClose={() => setModalOpen(false)}>
          <form className="stack" onSubmit={submit}>
            <label>
              <span>Name</span>
              <input name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              <span>Description</span>
              <textarea name="description" rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label>
              <span>Status</span>
              <select name="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <div className="actions-row">
              <button type="button" className="ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="primary">{editing ? 'Save changes' : 'Create project'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ProjectsPage;
