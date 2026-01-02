import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [tenantStats, setTenantStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tenantId = useMemo(() => user?.tenant?.id || user?.tenantId || user?.tenant_id, [user]);

  useEffect(() => {
    const fetchAll = async() => {
      try {
        const [healthRes, projectsRes] = await Promise.all([
          api.get('/health'),
          api.get('/projects', { params: { limit: 5 } })
        ]);
        setHealth(healthRes.data.data);
        const projects = projectsRes.data.data?.projects || projectsRes.data.data || [];
        setRecentProjects(projects);

        if (tenantId) {
          const tenantRes = await api.get(`/tenants/${tenantId}`);
          setTenantStats(tenantRes.data.data?.stats || null);
        }

        if (user && projects.length) {
          const taskResults = await Promise.all(projects.map((p) => api.get(`/projects/${p.id}/tasks`, { params: { assignedTo: user.id, limit: 5 } }).catch(() => ({ data: { data: { tasks: [] } } }))));
          const collected = taskResults.flatMap((r) => r.data.data?.tasks || r.data.data || []);
          setMyTasks(collected.slice(0, 5));
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [tenantId, user]);

  if (loading) return <div className="container"><Spinner label="Loading your workspace..." /></div>;

  return (
    <div className="container space-lg">
      <div className="grid three-cols">
        <div className="card stat-card">
          <p className="muted">Tenant</p>
          <h2>{tenantId ? (user?.tenant?.name || 'Your workspace') : 'Super Admin'}</h2>
          <p><StatusBadge value={user?.role} /></p>
        </div>
        <div className="card stat-card">
          <p className="muted">API</p>
          <h2>{health?.api || 'unknown'}</h2>
          <p className="muted">Database: {health?.database || 'unknown'}</p>
        </div>
        <div className="card stat-card">
          <p className="muted">Plan Limits</p>
          {user?.tenant?.subscriptionPlan ? (
            <>
              <h2>{user.tenant.subscriptionPlan}</h2>
              <p className="muted">Users: {user.tenant.maxUsers || '—'} • Projects: {user.tenant.maxProjects || '—'}</p>
            </>
          ) : (
            <p className="muted">Not linked to a tenant</p>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid two-cols">
        <div className="card">
          <div className="card-header">
            <h3>Tenant stats</h3>
          </div>
          {tenantStats ? (
            <div className="grid three-cols compact">
              <div>
                <p className="muted">Users</p>
                <h2>{tenantStats.totalUsers ?? '—'}</h2>
              </div>
              <div>
                <p className="muted">Projects</p>
                <h2>{tenantStats.totalProjects ?? '—'}</h2>
              </div>
              <div>
                <p className="muted">Tasks</p>
                <h2>{tenantStats.totalTasks ?? '—'}</h2>
              </div>
            </div>
          ) : (
            <EmptyState title="No tenant stats" subtitle={tenantId ? 'No activity yet.' : 'Tenant stats unavailable for super admins.'} />
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>My tasks</h3>
            <Link to="/projects" className="ghost">View all projects</Link>
          </div>
          {myTasks.length ? (
            <ul className="list">
              {myTasks.map((task) => (
                <li key={task.id}>
                  <div>
                    <div className="list-title">{task.title}</div>
                    <div className="muted">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <StatusBadge value={task.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No assigned tasks" subtitle="Tasks assigned to you will show up here." />
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent projects</h3>
          <Link to="/projects" className="ghost">Manage</Link>
        </div>
        {recentProjects.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Tasks</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.map((p) => (
                <tr key={p.id}>
                  <td><Link to={`/projects/${p.id}`}>{p.name}</Link></td>
                  <td><StatusBadge value={p.status} /></td>
                  <td>{p.completedTaskCount ? `${p.completedTaskCount}/${p.taskCount || 0}` : p.taskCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No projects yet" subtitle="Create your first project to get started." />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
