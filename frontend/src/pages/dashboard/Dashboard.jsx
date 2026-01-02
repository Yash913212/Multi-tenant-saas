import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Briefcase, CheckSquare, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalUsers: 0
  });
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        if (user?.tenantId) {
          const tenantRes = await api.get(`/tenants/${user.tenantId}`);
          setTenantInfo(tenantRes.data.data);
        }

        const [projRes, taskRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks')
        ]);

        const projects = projRes.data.data || [];
        const tasks = taskRes.data.data || [];

        let userCount = 0;
        try {
          if (user?.tenantId) {
            const userRes = await api.get(`/tenants/${user.tenantId}/users`);
            userCount = userRes.data.data?.length || 0;
          }
        } catch (e) { console.warn('Could not fetch users'); }

        setStats({
          totalProjects: projects.length,
          activeTasks: tasks.filter(t => t.status !== 'completed').length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          totalUsers: userCount
        });

      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-vite-primary'></div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className='bg-vite-card p-6 rounded-xl border border-vite-border hover:border-vite-primary/50 transition-all duration-300 group relative overflow-hidden'>
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        <Icon size={64} />
      </div>

      <div className='flex items-start justify-between relative z-10'>
        <div>
          <p className='text-vite-muted text-sm font-medium mb-1'>{title}</p>
          <h3 className='text-3xl font-bold text-white'>{value}</h3>
        </div>
        <div className={`p-3 rounded-lg bg-white/5 ${color} text-white`}>
          <Icon size={24} />
        </div>
      </div>
      
      {trend && (
        <div className='mt-4 flex items-center text-sm text-green-400'>
          <ArrowUpRight size={16} className='mr-1' />
          <span>{trend}</span>
          <span className='text-vite-muted ml-1'>vs last month</span>
        </div>
      )}
    </div>
  );

  return (
    <div className='space-y-8'>
      {/* Welcome Section */}
      <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-vite-primary/20 to-vite-secondary/20 border border-vite-border p-8'>
        <div className='absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-vite-primary/30 rounded-full blur-3xl pointer-events-none'></div>
        
        <div className='relative z-10'>
          <h1 className='text-3xl font-bold text-white mb-2'>
            Welcome back, {user?.fullName?.split(' ')[0]}! 
          </h1>
          <p className='text-vite-muted max-w-2xl'>
            Here's what's happening with your projects today. You have {stats.activeTasks} active tasks pending.
          </p>
          
          {tenantInfo && (
            <div className='mt-6 inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm'>
              <Briefcase size={16} className='text-vite-primary mr-2' />
              <span className='text-sm text-white font-medium'>{tenantInfo?.name || 'Your Workspace'}</span>
              <span className='mx-2 text-vite-border'>|</span>
              <span className='text-xs text-vite-muted uppercase tracking-wider'>
                {(tenantInfo?.subscriptionPlan || tenantInfo?.plan || 'free')} Plan
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard 
          title='Total Projects' 
          value={stats.totalProjects} 
          icon={Briefcase} 
          color='bg-blue-500'
          trend='+12%'
        />
        <StatCard 
          title='Active Tasks' 
          value={stats.activeTasks} 
          icon={AlertCircle} 
          color='bg-orange-500'
          trend='+5%'
        />
        <StatCard 
          title='Completed Tasks' 
          value={stats.completedTasks} 
          icon={CheckSquare} 
          color='bg-green-500'
          trend='+18%'
        />
        <StatCard 
          title='Team Members' 
          value={stats.totalUsers} 
          icon={TrendingUp} 
          color='bg-purple-500'
          trend='+2%'
        />
      </div>

      {/* Recent Activity Placeholder */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2 bg-vite-card rounded-xl border border-vite-border p-6'>
          <h2 className='text-xl font-bold text-white mb-6'>Project Activity</h2>
          <div className='h-64 flex items-center justify-center border-2 border-dashed border-vite-border rounded-lg bg-white/5'>
            <p className='text-vite-muted'>Activity Chart Placeholder</p>
          </div>
        </div>

        <div className='bg-vite-card rounded-xl border border-vite-border p-6'>
          <h2 className='text-xl font-bold text-white mb-6'>Quick Actions</h2>
          <div className='space-y-3'>
            <button className='w-full py-3 px-4 bg-vite-primary hover:bg-vite-primary/90 text-white rounded-lg font-medium transition-colors flex items-center justify-center'>
              <Briefcase size={18} className='mr-2' /> New Project
            </button>
            <button className='w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white border border-vite-border rounded-lg font-medium transition-colors flex items-center justify-center'>
              <CheckSquare size={18} className='mr-2' /> Create Task
            </button>
            <button className='w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white border border-vite-border rounded-lg font-medium transition-colors flex items-center justify-center'>
              <TrendingUp size={18} className='mr-2' /> Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
