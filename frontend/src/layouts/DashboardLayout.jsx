import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { LogOut, LayoutDashboard, FolderKanban, Users, Building, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
        isActive(to)
          ? 'bg-vite-primary/10 text-vite-primary'
          : 'text-vite-muted hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon
        className={`w-5 h-5 mr-3 transition-colors ${
          isActive(to) ? 'text-vite-primary' : 'text-gray-500 group-hover:text-white'
        }`}
      />
      <span className='font-medium'>{label}</span>
      {isActive(to) && (
        <div className='ml-auto w-1.5 h-1.5 rounded-full bg-vite-primary shadow-[0_0_8px_rgba(100,108,255,0.8)]' />
      )}
    </Link>
  );

  return (
    <div className='flex h-screen bg-vite-dark text-vite-text overflow-hidden'>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className='fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden'
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-vite-card border-r border-vite-border transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className='h-16 flex items-center px-6 border-b border-vite-border'>
          <div className='w-8 h-8 bg-gradient-to-br from-[#41d1ff] to-[#bd34fe] rounded-lg mr-3 flex items-center justify-center'>
            <span className='text-white font-bold text-lg'>V</span>
          </div>
          <h1 className='text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400'>
            SaaS Platform
          </h1>
        </div>

        <nav className='mt-6 px-4 space-y-1'>
          <NavItem to='/dashboard' icon={LayoutDashboard} label='Dashboard' />
          <NavItem to='/projects' icon={FolderKanban} label='Projects' />

          {(user?.role === 'tenant_admin' || user?.role === 'super_admin') && (
            <NavItem to='/users' icon={Users} label='Users' />
          )}

          {user?.role === 'super_admin' && (
            <NavItem to='/tenants' icon={Building} label='Tenants' />
          )}
        </nav>

        <div className='absolute bottom-0 w-64 p-4 border-t border-vite-border bg-vite-card'>
          <button
            onClick={logout}
            className='flex items-center w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors group'
          >
            <LogOut className='w-5 h-5 mr-3 group-hover:text-red-400' />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col overflow-hidden relative'>
        {/* Top Header */}
        <header className='h-16 bg-vite-dark/80 backdrop-blur-md border-b border-vite-border flex items-center justify-between px-6 sticky top-0 z-10'>
          <button className='md:hidden text-vite-muted hover:text-white' onClick={() => setIsSidebarOpen(true)}>
            <Menu className='w-6 h-6' />
          </button>

          <div className='ml-auto flex items-center space-x-6'>
            <div className='hidden md:block text-right'>
              <div className='text-sm font-medium text-white'>{user?.fullName}</div>
              <div className='text-xs text-vite-muted capitalize'>{user?.role?.replace('_', ' ')}</div>
            </div>

            <div className='h-8 w-[1px] bg-vite-border hidden md:block'></div>

            <ThemeToggle />

            <div className='w-9 h-9 rounded-full bg-gradient-to-tr from-vite-primary to-vite-secondary p-[2px]'>
              <div className='w-full h-full rounded-full bg-vite-card flex items-center justify-center text-sm font-bold text-white'>
                {user?.fullName?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className='flex-1 overflow-x-hidden overflow-y-auto bg-vite-dark p-6 relative'>
          {/* Ambient Background Glow */}
          <div className='absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-vite-primary/5 to-transparent pointer-events-none' />

          <div className='relative z-10 max-w-7xl mx-auto'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
