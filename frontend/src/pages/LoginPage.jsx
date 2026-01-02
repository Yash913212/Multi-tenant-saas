import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', tenantSubdomain: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      return setMessage('Email and password are required');
    }
    setLoading(true);
    setMessage('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.data.token, data.data.user, data.data.expiresIn);
      navigate('/dashboard');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h2>Welcome back</h2>
        <p className="muted">Access your workspace with your tenant email.</p>
        <form onSubmit={handleSubmit} className="stack">
          <label>
            <span>Email</span>
            <input name="email" placeholder="you@company.com" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            <span>Password</span>
            <input name="password" placeholder="••••••••" type="password" value={form.password} onChange={handleChange} required />
          </label>
          <label>
            <span>Tenant Subdomain (optional)</span>
            <input name="tenantSubdomain" placeholder="acme" value={form.tenantSubdomain} onChange={handleChange} />
          </label>
          {message && <div className="alert alert-error">{message}</div>}
          <button disabled={loading} className="primary">{loading ? 'Signing in...' : 'Login'}</button>
        </form>
        <p className="muted">Need an account? <Link to="/register">Register your tenant</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;
