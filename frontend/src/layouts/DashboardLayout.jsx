import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { LogOut, LayoutDashboard, FolderKanban, Users, Building, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const role = user?.role;

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/users', icon: Users, label: 'Users', allowedRoles: ['super_admin', 'tenant_admin'] },
    { to: '/tenants', icon: Building, label: 'Tenants', allowedRoles: ['super_admin'] },
  ];

  const visibleNavItems = navItems.filter((item) => !item.allowedRoles || item.allowedRoles.includes(role));

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group ${
        isActive(to)
          ? 'bg-vite-primary/10 text-vite-primary'
          : 'text-vite-muted hover:bg-vite-primary/5 hover:text-vite-text'
      }`}
      onClick={() => setIsMobileNavOpen(false)}
    >
      <Icon
        className={`w-5 h-5 transition-colors ${
          isActive(to) ? 'text-vite-primary' : 'text-gray-500 group-hover:text-vite-primary'
        }`}
      />
      <span className='font-medium leading-none'>{label}</span>
      {isActive(to) && (
        <div className='ml-auto w-1.5 h-1.5 rounded-full bg-vite-primary shadow-[0_0_8px_rgba(100,108,255,0.8)]' />
      )}
    </Link>
  );

  return (
    <div className='flex flex-col min-h-screen bg-vite-bg text-vite-text'>
      {/* Top Bar */}
      <header className='h-18 md:h-20 bg-white/95 backdrop-blur-md border-b border-vite-border flex items-center px-4 md:px-6 sticky top-0 z-20'>
        <div className='flex items-center gap-3 flex-none'>
          <div className='w-9 h-9 bg-gradient-to-br from-[#646cff] via-[#535bf2] to-[#f97316] rounded-lg flex items-center justify-center'>
            <span className='text-white font-bold text-lg'>T</span>
          </div>
          <h1 className='text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#646cff] via-[#535bf2] to-[#f97316]'>
            TaskNest
          </h1>
        </div>

        {/* Desktop Nav centered */}
        <nav className='hidden md:flex items-center gap-3 flex-1 justify-center px-4'>
          {visibleNavItems.map((item) => (
            <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
          ))}
        </nav>

        <div className='ml-auto flex items-center gap-4 flex-none'>
          {/* User info */}
          <div className='hidden md:block text-right'>
            <div className='text-sm font-medium text-vite-text'>{user?.fullName}</div>
            <div className='text-xs text-vite-muted capitalize'>{user?.role?.replace('_', ' ')}</div>
          </div>

          <div className='h-8 w-[1px] bg-vite-border hidden md:block'></div>

          <div className='w-9 h-9 rounded-full bg-gradient-to-tr from-[#646cff] via-[#535bf2] to-[#f97316] p-[2px]'>
            <div className='w-full h-full rounded-full bg-vite-card flex items-center justify-center text-sm font-bold text-vite-text'>
              {user?.fullName?.charAt(0)}
            </div>
          </div>

          <button
            onClick={logout}
            className='hidden md:flex items-center px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
          >
            <LogOut className='w-4 h-4 mr-2' />
            Sign Out
          </button>

          {/* Mobile menu toggle */}
          <button
            className='md:hidden text-vite-muted hover:text-vite-text'
            onClick={() => setIsMobileNavOpen((v) => !v)}
            aria-label='Toggle navigation'
          >
            {isMobileNavOpen ? <X className='w-6 h-6' /> : <Menu className='w-6 h-6' />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      {isMobileNavOpen && (
        <div className='md:hidden border-b border-vite-border bg-white shadow-sm z-10'>
          <div className='px-4 py-3 flex flex-col gap-2'>
            {visibleNavItems.map((item) => (
              <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
            ))}
            <button
              onClick={logout}
              className='flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors'
            >
              <LogOut className='w-4 h-4' /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className='flex-1 overflow-x-hidden overflow-y-auto bg-vite-bg p-6 relative'>
        <div className='absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-vite-primary/10 via-transparent to-transparent pointer-events-none' />
        <div className='relative z-10 w-full max-w-none'>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
