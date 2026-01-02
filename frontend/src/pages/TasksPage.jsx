import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';

const TasksPage = () => {
  const { user } = useAuth();
  const isAdmin = useMemo(() => ['tenant_admin', 'super_admin'].includes(user?.role), [user]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({ status: '', search: '' });

  useEffect(() => {
    const load = async() => {
      setLoading(true);
      try {
        // Fetch projects, then aggregate tasks per project
        const projectsRes = await api.get('/projects', { params: { limit: 20 } });
        const projects = projectsRes.data.data?.projects || [];
        const taskCalls = projects.map((p) => api.get(`/projects/${p.id}/tasks`, { params: { limit: 20 } }).catch(() => ({ data: { data: { tasks: [] } } })));
        const results = await Promise.all(taskCalls);
        const all = results.flatMap((r, idx) => {
          const list = r.data.data?.tasks || r.data.data || [];
          return list.map((t) => ({ ...t, projectName: projects[idx]?.name }));
        });
        setTasks(all);
      } catch (err) {
        setMessage(err.response?.data?.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    if (isAdmin) load();
  }, [isAdmin]);

  const filtered = tasks.filter((t) => {
    const statusOk = filters.status ? t.status === filters.status : true;
    const searchOk = filters.search ? t.title.toLowerCase().includes(filters.search.toLowerCase()) : true;
    return statusOk && searchOk;
  });

  if (!isAdmin) {
    return <div className="container"><div className="alert alert-error">Forbidden: admin only.</div></div>;
  }

  return (
    <div className="container space-lg">
      <div className="card">
        <div className="card-header">
          <h2>Tasks</h2>
          <p className="muted">Cross-project view (showing up to 20 projects × 20 tasks each)</p>
        </div>

        <form className="grid three-cols compact" onSubmit={(e) => e.preventDefault()}>
          <label>
            <span>Status</span>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label>
            <span>Search</span>
            <input placeholder="Search by title" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </label>
        </form>

        {message && <div className="alert alert-info">{message}</div>}

        {loading ? (
          <Spinner label="Loading tasks..." />
        ) : filtered.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.projectName || '—'}</td>
                  <td><StatusBadge value={t.status} /></td>
                  <td><StatusBadge value={t.priority} /></td>
                  <td>{t.assignedTo?.fullName || t.assigned_full_name || 'Unassigned'}</td>
                  <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No tasks" subtitle="Try changing filters or add tasks within a project." />
        )}
      </div>
    </div>
  );
};

export default TasksPage;
