import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { toast } from 'react-toastify'; // We will add this to App.jsx later

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tenantName: '',
    subdomain: '',
    adminEmail: '',
    adminFullName: '',
    adminPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // API 1: Register Tenant
      await api.post('/auth/register-tenant', formData);
      alert('Registration successful! Please login.'); // Simple alert for now
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Register your Organization
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">sign in to existing account</Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Input 
            label="Organization Name" 
            name="tenantName" 
            value={formData.tenantName} 
            onChange={handleChange} 
            required 
            placeholder="e.g. Acme Corp"
          />
          
          <div>
            <Input 
              label="Subdomain" 
              name="subdomain" 
              value={formData.subdomain} 
              onChange={handleChange} 
              required 
              placeholder="acme"
            />
            <p className="text-xs text-gray-500 mt-[-10px] mb-2">
              Your URL will be: {formData.subdomain || 'company'}.yourapp.com
            </p>
          </div>

          <div className="border-t border-gray-200 my-4"></div>

          <Input 
            label="Admin Full Name" 
            name="adminFullName" 
            value={formData.adminFullName} 
            onChange={handleChange} 
            required 
          />

          <Input 
            label="Admin Email" 
            type="email"
            name="adminEmail" 
            value={formData.adminEmail} 
            onChange={handleChange} 
            required 
          />

          <Input 
            label="Password" 
            type="password"
            name="adminPassword" 
            value={formData.adminPassword} 
            onChange={handleChange} 
            required 
          />

          <Button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Tenant'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Register;