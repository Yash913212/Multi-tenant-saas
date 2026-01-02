import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';

const DashboardPage = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [tenantStats, setTenantStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [taskSummary, setTaskSummary] = useState({ total: 0, todo: 0, in_progress: 0, completed: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tenantId = useMemo(() => user?.tenant?.id || user?.tenantId || user?.tenant_id, [user]);

  useEffect(() => {
    const fetchAll = async() => {
      setError('');
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

        if (projects.length) {
          const taskResults = await Promise.all(projects.map((p) => api.get(`/projects/${p.id}/tasks`, { params: { limit: 100 } }).catch(() => ({ data: { data: { tasks: [] } } }))));
          const allTasks = taskResults.flatMap((r) => r.data.data?.tasks || r.data.data || []);

          const summary = allTasks.reduce((acc, task) => {
            acc.total += 1;
            if (task.status === 'completed') acc.completed += 1;
            else if (task.status === 'in_progress') acc.in_progress += 1;
            else acc.todo += 1;

            if (task.due_date) {
              const today = new Date();
              const due = new Date(task.due_date);
              if (due < new Date(today.toDateString()) && task.status !== 'completed') acc.overdue += 1;
            }
            return acc;
          }, { total: 0, todo: 0, in_progress: 0, completed: 0, overdue: 0 });
          setTaskSummary(summary);

          if (user) {
            const mine = allTasks
              .filter((t) => t.assigned_to === user.id || t.assignedTo?.id === user.id)
              .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
              .slice(0, 5);
            setMyTasks(mine);
          }
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
      <div className="grid four-cols">
        <div className="card stat-card">
          <p className="muted">Workspace</p>
          <h2>{tenantId ? (user?.tenant?.name || 'Your workspace') : 'Super Admin'}</h2>
          <p><StatusBadge value={user?.role} /></p>
        </div>
        <div className="card stat-card">
          <p className="muted">Health</p>
          <h2>{health?.api || 'unknown'}</h2>
          <p className="muted">Database: {health?.database || 'unknown'}</p>
        </div>
        <div className="card stat-card">
          <p className="muted">Task snapshot</p>
          <h2>{taskSummary.total || 0} tasks</h2>
          <p className="muted">{taskSummary.in_progress} in progress • {taskSummary.todo} todo • {taskSummary.overdue} overdue</p>
        </div>
        <div className="card stat-card">
          <p className="muted">My queue</p>
          <h2>{myTasks.length} tasks</h2>
          <p className="muted">Assigned to you</p>
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
