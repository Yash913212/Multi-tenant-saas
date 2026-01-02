import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ tenantName: '', subdomain: '', adminFullName: '', adminEmail: '', adminPassword: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tenantName || !form.subdomain || !form.adminEmail || !form.adminPassword) {
      return setMessage('Please fill in all required fields');
    }
    setLoading(true);
    setMessage('');
    try {
      await api.post('/auth/register-tenant', form);
      setMessage('Tenant registered! You can now login.');
      navigate('/login');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h2>Create your tenant</h2>
        <p className="muted">Spin up a workspace and a first admin user in one step.</p>
        <form onSubmit={handleSubmit} className="grid two-cols">
          <label>
            <span>Company / Tenant Name</span>
            <input name="tenantName" placeholder="Acme Inc." value={form.tenantName} onChange={handleChange} required />
          </label>
          <label>
            <span>Subdomain</span>
            <input name="subdomain" placeholder="acme" value={form.subdomain} onChange={handleChange} required />
          </label>
          <label>
            <span>Admin Full Name</span>
            <input name="adminFullName" placeholder="Jane Doe" value={form.adminFullName} onChange={handleChange} required />
          </label>
          <label>
            <span>Admin Email</span>
            <input name="adminEmail" placeholder="jane@acme.com" type="email" value={form.adminEmail} onChange={handleChange} required />
          </label>
          <label>
            <span>Admin Password</span>
            <input name="adminPassword" placeholder="••••••••" type="password" value={form.adminPassword} onChange={handleChange} required />
          </label>
        </form>
        {message && <div className="alert alert-info">{message}</div>}
        <button disabled={loading} className="primary" onClick={handleSubmit}>{loading ? 'Creating...' : 'Register Tenant'}</button>
        <p className="muted">Already registered? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
};

export default RegistrationPage;
