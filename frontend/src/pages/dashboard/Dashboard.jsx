import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Briefcase, CheckSquare, TrendingUp, AlertCircle, ArrowUpRight, Users } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

        const statsRes = await api.get('/dashboard/stats');
        const data = statsRes.data.data;

        setStats({
          totalProjects: data.totalProjects || 0,
          activeTasks: data.activeTasks || 0,
          completedTasks: data.completedTasks || 0,
          totalUsers: data.totalUsers || 0,
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

  const StatCard = ({ title, value, icon: Icon, accent, trend }) => (
    <div className='bg-vite-card p-6 rounded-xl border border-vite-border hover:shadow-lg transition-all duration-300 group relative overflow-hidden'>
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${accent.faint}`}>
        <Icon size={64} />
      </div>

      <div className='flex items-start justify-between relative z-10'>
        <div>
          <p className='text-vite-muted text-sm font-medium mb-1'>{title}</p>
          <h3 className='text-3xl font-bold text-vite-text'>{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${accent.bg} ${accent.text}`}>
          <Icon size={24} />
        </div>
      </div>
      
      {trend && (
        <div className='mt-4 flex items-center text-sm text-green-600'>
          <ArrowUpRight size={16} className='mr-1' />
          <span>{trend}</span>
          <span className='text-vite-muted ml-1'>vs last month</span>
        </div>
      )}
    </div>
  );

  const handleNewProject = () => navigate('/projects', { state: { openCreate: true } });
  const handleCreateTask = () => navigate('/projects'); // placeholder until tasks UI is added
  const handleGenerateReport = () => navigate('/projects');

  return (
    <div className='space-y-8'>
      {/* Welcome Section */}
      <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#646cff]/10 via-[#535bf2]/10 to-[#f97316]/10 border border-vite-border p-8'>
        <div className='absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#646cff]/20 rounded-full blur-3xl pointer-events-none'></div>
        
        <div className='relative z-10'>
          <h1 className='text-3xl font-bold text-vite-text mb-2'>
            Welcome back, {user?.fullName?.split(' ')[0]}! 
          </h1>
          <p className='text-vite-muted max-w-2xl'>
            Here's what's happening with your projects today. You have {stats.activeTasks} active tasks pending.
          </p>
          
          {tenantInfo && (
            <div className='mt-6 inline-flex items-center px-4 py-2 rounded-full bg-white border border-vite-border shadow-sm'>
              <Briefcase size={16} className='text-vite-primary mr-2' />
              <span className='text-sm text-vite-text font-medium'>{tenantInfo?.name || 'Your Workspace'}</span>
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
          accent={{ bg: 'bg-blue-50', text: 'text-blue-600', faint: 'text-blue-200' }}
          trend='+12%'
        />
        <StatCard 
          title='Active Tasks' 
          value={stats.activeTasks} 
          icon={AlertCircle} 
          accent={{ bg: 'bg-orange-50', text: 'text-orange-600', faint: 'text-orange-200' }}
          trend='+5%'
        />
        <StatCard 
          title='Completed Tasks' 
          value={stats.completedTasks} 
          icon={CheckSquare} 
          accent={{ bg: 'bg-emerald-50', text: 'text-emerald-600', faint: 'text-emerald-200' }}
          trend='+18%'
        />
        <StatCard 
          title='Team Members' 
          value={stats.totalUsers} 
          icon={Users} 
          accent={{ bg: 'bg-purple-50', text: 'text-purple-600', faint: 'text-purple-200' }}
          trend='+2%'
        />
      </div>

      {/* Recent Activity Placeholder */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        <div className='lg:col-span-2 bg-vite-card rounded-xl border border-vite-border p-6'>
          <h2 className='text-xl font-bold text-vite-text mb-6'>Project Activity</h2>
          <div className='h-64 flex items-center justify-center border-2 border-dashed border-vite-border rounded-lg bg-vite-bg'>
            <p className='text-vite-muted'>Activity Chart Placeholder</p>
          </div>
        </div>

        <div className='bg-vite-card rounded-xl border border-vite-border p-6'>
          <h2 className='text-xl font-bold text-vite-text mb-6'>Quick Actions</h2>
          <div className='space-y-3'>
            <button onClick={handleNewProject} className='w-full py-3 px-4 bg-gradient-to-r from-[#646cff] via-[#535bf2] to-[#f97316] hover:brightness-110 text-white rounded-lg font-medium transition-all flex items-center justify-center shadow-sm'>
              <Briefcase size={18} className='mr-2' /> New Project
            </button>
            <button onClick={handleCreateTask} className='w-full py-3 px-4 bg-vite-card hover:bg-vite-primary/5 text-vite-text border border-vite-border rounded-lg font-medium transition-colors flex items-center justify-center'>
              <CheckSquare size={18} className='mr-2 text-vite-primary' /> Create Task
            </button>
            <button onClick={handleGenerateReport} className='w-full py-3 px-4 bg-vite-card hover:bg-vite-primary/5 text-vite-text border border-vite-border rounded-lg font-medium transition-colors flex items-center justify-center'>
              <TrendingUp size={18} className='mr-2 text-[#f97316]' /> Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
