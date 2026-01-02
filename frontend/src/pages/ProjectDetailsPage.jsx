import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Spinner from '../components/Spinner.jsx';
import Modal from '../components/Modal.jsx';
import EmptyState from '../components/EmptyState.jsx';

const defaultTask = { title: '', description: '', priority: 'medium', status: 'todo', assignedTo: '', dueDate: '' };

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', assignedTo: '' });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [taskForm, setTaskForm] = useState(defaultTask);
  const [editingTask, setEditingTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, in_progress: 0, todo: 0, overdue: 0 });

  const canEdit = useMemo(() => ['super_admin', 'tenant_admin', 'user'].includes(user?.role), [user]);
  const tenantId = useMemo(() => user?.tenant?.id || user?.tenantId || user?.tenant_id, [user]);

  const loadProject = async() => {
    const projectRes = await api.get(`/projects/${projectId}`);
    setProject(projectRes.data.data);
  };

  const loadUsers = async() => {
    if (!tenantId) return;
    const { data } = await api.get(`/tenants/${tenantId}/users`, { params: { limit: 100 } });
    const list = data.data?.users || data.data || [];
    setUsers(list);
  };

  const loadTasks = async(page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/projects/${projectId}/tasks`, { params: { ...filters, page, limit: 15 } });
      const payload = data.data || {};
      setTasks(payload.tasks || []);
      setPagination(payload.pagination || { currentPage: 1, totalPages: 1 });

      const stats = (payload.tasks || []).reduce((acc, task) => {
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
      }, { total: 0, completed: 0, in_progress: 0, todo: 0, overdue: 0 });
      setTaskStats(stats);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
    loadTasks();
  }, [projectId]);

  useEffect(() => {
    if (tenantId) loadUsers();
  }, [tenantId]);

  const openTaskModal = (task) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        assignedTo: task.assigned_to || task.assignedTo?.id || '',
        dueDate: task.due_date ? task.due_date.split('T')[0] : ''
      });
    } else {
      setEditingTask(null);
      setTaskForm(defaultTask);
    }
    setModalOpen(true);
  };

  const submitTask = async(e) => {
    e.preventDefault();
    setMessage('');
    try {
      const payload = { ...taskForm, assignedTo: taskForm.assignedTo || null, dueDate: taskForm.dueDate || null };
      if (editingTask) {
        await api.patch(`/projects/${projectId}/tasks/${editingTask.id}`, payload);
        setMessage('Task updated');
      } else {
        await api.post(`/projects/${projectId}/tasks`, payload);
        setMessage('Task created');
      }
      setModalOpen(false);
      setTaskForm(defaultTask);
      setEditingTask(null);
      await loadTasks(pagination.currentPage);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save task');
    }
  };

  const updateStatus = async(taskId, status) => {
    try {
      await api.patch(`/projects/${projectId}/tasks/${taskId}`, { status });
      await loadTasks(pagination.currentPage);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update status');
    }
  };

  const removeTask = async(taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      await loadTasks(pagination.currentPage);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const applyFilters = (e) => {
    e.preventDefault();
    loadTasks(1);
  };

  const quickFilter = (status) => {
    setFilters((prev) => ({ ...prev, status }));
    loadTasks(1);
  };

  const completion = taskStats.total ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

  if (!project) return <div className="container"><Spinner label="Loading project..." /></div>;

  return (
    <div className="container space-lg">
      <div className="card">
        <div className="card-header">
          <div>
            <p className="muted">Project</p>
            <h2>{project.name}</h2>
            <p className="muted">{project.description || 'No description yet.'}</p>
          </div>
          <div>
            <StatusBadge value={project.status || 'active'} />
          </div>
        </div>

        <div className="card-subheader">
          <h3>Tasks</h3>
          {canEdit && <button className="primary" onClick={() => openTaskModal(null)}>New Task</button>}
        </div>

        <div className="grid four-cols compact">
          <div className="stat-card">
            <p className="muted">Total</p>
            <h2>{taskStats.total}</h2>
          </div>
          <div className="stat-card">
            <p className="muted">In progress</p>
            <h2>{taskStats.in_progress}</h2>
          </div>
          <div className="stat-card">
            <p className="muted">Completed</p>
            <h2>{taskStats.completed}</h2>
            <p className="muted">{completion}% complete</p>
          </div>
          <div className="stat-card">
            <p className="muted">Overdue</p>
            <h2>{taskStats.overdue}</h2>
            <div className="progress" aria-label="Task completion">
              <div className="progress-bar" style={{ width: `${completion}%` }}></div>
            </div>
          </div>
        </div>

        <form className="grid four-cols compact" onSubmit={applyFilters}>
          <label>
            <span>Search</span>
            <input placeholder="Search tasks" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </label>
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
            <span>Priority</span>
            <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label>
            <span>Assigned</span>
            <select value={filters.assignedTo} onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}>
              <option value="">Anyone</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.fullName || u.email}</option>)}
            </select>
          </label>
          <div className="actions-row">
            <button className="ghost" type="submit">Apply</button>
          </div>
        </form>

        <div className="chip-row">
          <button className={`chip ${filters.status === '' ? 'chip-active' : ''}`} onClick={() => quickFilter('')}>All</button>
          <button className={`chip ${filters.status === 'todo' ? 'chip-active' : ''}`} onClick={() => quickFilter('todo')}>To Do</button>
          <button className={`chip ${filters.status === 'in_progress' ? 'chip-active' : ''}`} onClick={() => quickFilter('in_progress')}>In Progress</button>
          <button className={`chip ${filters.status === 'completed' ? 'chip-active' : ''}`} onClick={() => quickFilter('completed')}>Completed</button>
        </div>

        {message && <div className="alert alert-info">{message}</div>}

        {loading ? (
          <Spinner label="Loading tasks..." />
        ) : tasks.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>
                    <StatusBadge value={t.status} />
                    {canEdit && (
                      <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    )}
                  </td>
                  <td><StatusBadge value={t.priority} /></td>
                  <td>{t.assignedTo?.fullName || t.assigned_full_name || 'Unassigned'}</td>
                  <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</td>
                  <td className="table-actions">
                    {canEdit && (
                      <>
                        <button className="ghost" onClick={() => openTaskModal(t)}>Edit</button>
                        <button className="ghost danger" onClick={() => removeTask(t.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No tasks yet" subtitle="Add a task to kick things off." />
        )}

        <div className="pagination">
          <button disabled={pagination.currentPage <= 1} onClick={() => loadTasks(pagination.currentPage - 1)}>Prev</button>
          <span>Page {pagination.currentPage} of {pagination.totalPages || 1}</span>
          <button disabled={pagination.currentPage >= (pagination.totalPages || 1)} onClick={() => loadTasks(pagination.currentPage + 1)}>Next</button>
        </div>
      </div>

      {modalOpen && (
        <Modal title={editingTask ? 'Edit task' : 'New task'} onClose={() => setModalOpen(false)}>
          <form className="stack" onSubmit={submitTask}>
            <label>
              <span>Title</span>
              <input name="title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
            </label>
            <label>
              <span>Description</span>
              <textarea name="description" rows="3" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
            </label>
            <label>
              <span>Priority</span>
              <select name="priority" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select name="status" value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label>
              <span>Assigned to</span>
              <select name="assignedTo" value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.fullName || u.email}</option>)}
              </select>
            </label>
            <label>
              <span>Due date</span>
              <input type="date" name="dueDate" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </label>
            <div className="actions-row">
              <button type="button" className="ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="primary">{editingTask ? 'Save changes' : 'Create task'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ProjectDetailsPage;
