import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  // State for form fields
  const [formData, setFormData] = useState({
    tenantName: '',
    subdomain: '',
    adminFullName: '',
    adminEmail: '',
    adminPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const onChange = (e) => {
    // If typing in subdomain, force lowercase
    if (e.target.name === 'subdomain') {
      setFormData({ ...formData, subdomain: e.target.value.toLowerCase() });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // Submit Form
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use env variable or default to localhost:5000
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      const res = await axios.post(`${apiUrl}/auth/register-tenant`, formData);
      
      if (res.data.success) {
        alert('Registration Successful! Please login.');
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: '#f4f6f8' 
    }}>
      <div style={{ 
        width: '400px', 
        padding: '30px', 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Register Organization</h2>
        
        {error && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Organization Name</label>
            <input 
              type="text" 
              name="tenantName" 
              required 
              placeholder="e.g. Acme Corp"
              value={formData.tenantName} 
              onChange={onChange}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} 
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Subdomain</label>
            <input 
              type="text" 
              name="subdomain" 
              required 
              placeholder="acme"
              value={formData.subdomain} 
              onChange={onChange}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} 
            />
            <small style={{ color: '#666' }}>URL: http://{formData.subdomain || 'your-subdomain'}.saas.com</small>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Admin Full Name</label>
            <input 
              type="text" 
              name="adminFullName" 
              required 
              placeholder="John Doe"
              value={formData.adminFullName} 
              onChange={onChange}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} 
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Admin Email</label>
            <input 
              type="email" 
              name="adminEmail" 
              required 
              placeholder="admin@acme.com"
              value={formData.adminEmail} 
              onChange={onChange}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} 
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
            <input 
              type="password" 
              name="adminPassword" 
              required 
              value={formData.adminPassword} 
              onChange={onChange}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '15px' }}>
          Already have an account? <Link to="/login" style={{ color: '#007bff' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;