import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { 
  LogOut, LayoutDashboard, ShieldCheck, Mail, Users, Building2, 
  FileText, IndianRupee, Wallet, Package, Receipt, Menu, X, ChevronRight, Bell, Activity, BarChart3, Settings
} from 'lucide-react';

const DashboardLayout = () => {
  const { user } = useSelector(state => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  const navLinks = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard', roles: ['super_admin', 'branch_admin', 'technician', 'sales', 'office'] },
    { to: '/branches', icon: <Building2 size={18} />, label: 'Branches', roles: ['super_admin'] },
    { to: '/customers', icon: <ShieldCheck size={18} />, label: 'Customers', roles: ['super_admin', 'branch_admin', 'technician', 'sales', 'office'] },
    { to: '/amc', icon: <FileText size={18} />, label: 'AMC Contracts', roles: ['super_admin', 'branch_admin', 'office'] },
    { to: '/forms', icon: <FileText size={18} />, label: 'Booking Form', roles: ['super_admin', 'branch_admin', 'technician', 'sales', 'office'] },
    { to: '/employees', icon: <Users size={18} />, label: 'Employees', roles: ['super_admin', 'branch_admin', 'office'] },
    { to: '/enquiries', icon: <Mail size={18} />, label: 'Enquiries', roles: ['super_admin', 'branch_admin', 'office'] },
    { to: '/receipts', icon: <IndianRupee size={18} />, label: 'Receipts', roles: ['super_admin', 'branch_admin', 'technician', 'sales', 'office'] },
    { to: '/collections', icon: <Wallet size={18} />, label: 'Collections', roles: ['super_admin', 'branch_admin', 'office'] },
    { to: '/inventory', icon: <Package size={18} />, label: 'Inventory', roles: ['super_admin', 'branch_admin', 'technician', 'office'] },
    { to: '/expenses', icon: <Receipt size={18} />, label: 'Expenses', roles: ['super_admin', 'branch_admin', 'technician', 'sales', 'office'] },
    { to: '/reports', icon: <BarChart3 size={18} />, label: 'Reports', roles: ['super_admin', 'branch_admin', 'office'] },
    { to: '/settings', icon: <ShieldCheck size={18} />, label: 'Settings', roles: ['super_admin', 'branch_admin'] },
  ];

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans selection:bg-brand-500 selection:text-white">
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-400 flex flex-col justify-between shrink-0
        transition-all duration-300 transform lg:translate-x-0 lg:static lg:inset-0
        shadow-2xl shadow-slate-900/50
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
          <div className="p-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="SafeHome Ops" className="h-9 w-auto object-contain rounded-lg" />
              <div>
                <span className="text-white font-bold text-sm block">SafeHome</span>
                <span className="text-brand-500 text-xs font-semibold">Pest Control</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-white">
               <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {navLinks.map((link) => (
              (link.roles.includes(user?.role)) && (
                <Link 
                  key={link.to}
                  to={link.to} 
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all group ${location.pathname === link.to ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${location.pathname === link.to ? 'text-white' : 'text-slate-500 group-hover:text-brand-400'}`}>{link.icon}</span>
                    {link.label}
                  </div>
                  {location.pathname === link.to && <span className="w-2 h-2 bg-white rounded-full shadow-lg shadow-white/50"></span>}
                </Link>
              )
            ))}
          </nav>
          
          <div className="p-6 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-600/30">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate tracking-wider mt-0.5">{user?.role?.replace('_', ' ')}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-semibold tracking-wider"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2">
               <Activity size={14} className="text-brand-500" />
               <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registry / <span className="text-slate-900 font-bold">{location.pathname === '/' ? 'System Overview' : location.pathname.split('/')[1]?.toUpperCase()}</span></h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
               <Bell size={18} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full"></span>
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 tracking-tight leading-none">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-brand-500 font-medium tracking-wider mt-1">{user?.branchName || 'HQ Terminal'}</p>
               </div>
               <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-inner">
                  <Users size={18} />
               </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto bg-slate-50">
          <div className="animate-in fade-in duration-700">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
