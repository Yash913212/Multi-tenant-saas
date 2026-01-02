import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    tenantSubdomain: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password, formData.tenantSubdomain);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login Error:', err);
      const msg = err.response?.data?.message || 'Invalid credentials or server error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#f9f9f9] to-[#eef2ff] relative overflow-hidden'>
      {/* Background Glow Effects */}
      <div className='absolute top-[-20%] left-[-10%] w-[520px] h-[520px] bg-[#646cff]/15 rounded-full blur-[120px] pointer-events-none' />
      <div className='absolute bottom-[-20%] right-[-10%] w-[520px] h-[520px] bg-[#f97316]/12 rounded-full blur-[120px] pointer-events-none' />

      <div className='max-w-md w-full bg-vite-card p-8 rounded-2xl shadow-xl border border-vite-border relative z-10 backdrop-blur-sm'>
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#646cff] via-[#535bf2] to-[#f97316]'>
            TaskNest
          </h1>
          <p className='text-vite-muted'>Sign in to your workspace</p>
        </div>
        
        {error && (
          <div className='bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm border border-red-200 flex items-center'>
            <span className='mr-2'></span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-5'>
          <div className='group'>
            <label className='block text-sm font-medium text-vite-text mb-1.5 group-focus-within:text-vite-primary transition-colors'>
              Tenant Subdomain <span className='text-vite-muted'>(optional)</span>
            </label>
            <input
              type='text'
              placeholder='e.g. acme'
              className='w-full px-4 py-3 bg-white border border-vite-border rounded-lg focus:outline-none focus:border-vite-primary focus:ring-1 focus:ring-vite-primary text-vite-text placeholder-gray-400 transition-all'
              value={formData.tenantSubdomain}
              onChange={(e) => setFormData({...formData, tenantSubdomain: e.target.value})}
            />
          </div>

          <div className='group'>
            <label className='block text-sm font-medium text-vite-text mb-1.5 group-focus-within:text-vite-primary transition-colors'>
              Email Address
            </label>
            <input
              type='email'
              placeholder='you@example.com'
              className='w-full px-4 py-3 bg-white border border-vite-border rounded-lg focus:outline-none focus:border-vite-primary focus:ring-1 focus:ring-vite-primary text-vite-text placeholder-gray-400 transition-all'
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className='group'>
            <label className='block text-sm font-medium text-vite-text mb-1.5 group-focus-within:text-vite-primary transition-colors'>
              Password
            </label>
            <input
              type='password'
              placeholder=''
              className='w-full px-4 py-3 bg-white border border-vite-border rounded-lg focus:outline-none focus:border-vite-primary focus:ring-1 focus:ring-vite-primary text-vite-text placeholder-gray-400 transition-all'
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-gradient-to-r from-[#646cff] via-[#535bf2] to-[#f97316] hover:brightness-110 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#646cff] focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]'
          >
            {loading ? (
              <span className='flex items-center justify-center'>
                <svg className='animate-spin -ml-1 mr-3 h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <div className='mt-8 text-center'>
          <p className='text-sm text-vite-muted'>
            Don\'t have an account?{' '}
            <Link to='/register' className='text-vite-primary hover:text-vite-secondary hover:underline transition-colors'>
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;