import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '../store/slices/authSlice';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Building2, ShieldCheck, FileText, Users, IndianRupee, Wallet, Package, Receipt, Menu, X, ChevronRight, Bell, Activity, BarChart3, Settings, Check, Trash2, Truck, UserCheck, ListTodo, Target, AlertTriangle, LogOut, Search, MoreHorizontal
} from 'lucide-react';

const DashboardLayout = () => {
  const { user } = useSelector(state => state.auth);
  const location = useLocation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All notifications marked as read');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'EXPENSE_APPROVED':
      case 'RECEIPT_APPROVED':
        return <Check size={16} className="text-emerald-500" />;
      case 'EXPENSE_REJECTED':
      case 'RECEIPT_REJECTED':
        return <X size={16} className="text-red-500" />;
      default:
        return <Bell size={16} className="text-brand-500" />;
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const navLinks = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard', roles: ['super_admin', 'branch_admin', 'technician', 'sales', 'office'] },
    { to: '/branches', icon: <Building2 size={18} />, label: 'Branches', roles: ['super_admin'] },
    { to: '/customers', icon: <ShieldCheck size={18} />, label: 'Customers', roles: ['super_admin', 'branch_admin', 'technician', 'sales', 'office'] },
    // AMC Contracts tab removed - using Booking Form directly
    { to: '/forms', icon: <FileText size={18} />, label: 'Booking Form', roles: ['super_admin', 'branch_admin', 'technician', 'sales', 'office'] },
    { to: '/employees', icon: <Users size={18} />, label: 'Employees', roles: ['super_admin', 'branch_admin', 'office'] },
    { to: '/leads', icon: <Target size={18} />, label: 'Leads', roles: ['super_admin', 'branch_admin', 'office', 'sales', 'technician'] },
    { to: '/followups', icon: <ListTodo size={18} />, label: 'Follow-ups', roles: ['super_admin', 'branch_admin', 'office', 'sales', 'technician'] },
    { to: '/receipts', icon: <IndianRupee size={18} />, label: 'Receipts', roles: ['super_admin', 'branch_admin', 'technician', 'sales', 'office'] },
    { to: '/collections', icon: <Wallet size={18} />, label: 'Collections', roles: ['super_admin', 'branch_admin', 'office'] },
    { to: '/inventory', icon: <Package size={18} />, label: 'Inventory', roles: ['super_admin', 'branch_admin', 'technician'] },
    { to: '/logistics', icon: <Truck size={18} />, label: 'Logistics', roles: ['technician', 'sales', 'super_admin', 'branch_admin'] },
    { to: '/expenses', icon: <Receipt size={18} />, label: 'Expenses', roles: ['super_admin', 'branch_admin', 'technician', 'office'] },
    { to: '/ledger', icon: <Receipt size={18} />, label: 'Ledger', roles: ['super_admin', 'branch_admin', 'technician', 'sales', 'office'] },
    { to: '/reports', icon: <BarChart3 size={18} />, label: 'Reports', roles: ['super_admin', 'branch_admin'] },
    { to: '/settings', icon: <ShieldCheck size={18} />, label: 'Settings', roles: ['super_admin', 'branch_admin'] },
    { to: '/task-assignment', icon: <UserCheck size={18} />, label: 'Task Assignment', roles: ['super_admin', 'branch_admin'] },
    { to: '/my-tasks', icon: <ListTodo size={18} />, label: 'My Tasks', roles: ['technician', 'sales'] },
    { to: '/complains', icon: <AlertTriangle size={18} />, label: 'Complains', roles: ['super_admin', 'branch_admin', 'technician', 'sales', 'office'] },
  ];

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans selection:bg-brand-500 selection:text-white overscroll-none">
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 sm:w-64 bg-slate-900 text-slate-400 flex flex-col justify-between shrink-0
        transition-all duration-300 transform lg:translate-x-0 lg:static lg:inset-0
        shadow-2xl shadow-slate-900/50
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src="/logo.jpg" alt="SafeHome" className="h-8 w-auto object-contain rounded-lg" />
              <div>
                <span className="text-white font-bold text-sm block">SafeHome</span>
                <span className="text-brand-500 text-[10px] sm:text-xs font-semibold">Pest Control</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-white p-2">
               <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1 overflow-y-auto overscroll-none">
            {navLinks.map((link) => (
              (link.roles.includes(user?.role)) && (
                <Link 
                  key={link.to}
                  to={link.to} 
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all group ${location.pathname === link.to ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className={`${location.pathname === link.to ? 'text-white' : 'text-slate-500 group-hover:text-brand-400'}`}>{link.icon}</span>
                    <span className="hidden sm:inline">{link.label}</span>
                    <span className="sm:hidden">{link.label.split(' ')[0]}</span>
                  </div>
                  {location.pathname === link.to && <span className="w-2 h-2 bg-white rounded-full shadow-lg shadow-white/50"></span>}
                </Link>
              )
            ))}
          </nav>
          
          <div className="p-4 sm:p-6 border-t border-slate-800 shrink-0">
            <div className="bg-slate-800/50 rounded-2xl p-3 sm:p-4">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-600/30">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 truncate tracking-wider mt-0.5">
                    {user?.role === 'super_admin' ? 'Super Admin' : 
                     user?.role === 'branch_admin' && user?.branchId?.branchName ? user.branchId.branchName : 
                     user?.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-[10px] sm:text-xs font-semibold tracking-wider"
              >
                <LogOut size={12} className="sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Sign Out</span><span className="sm:hidden">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 z-10 sticky top-0 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="SafeHome" className="h-7 sm:h-8 w-auto object-contain" />
              <span className="text-sm sm:text-base font-bold text-slate-800 hidden sm:block">SafeHome</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[9px] sm:text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={() => markAllReadMutation.mutate()}
                        className="text-[10px] sm:text-xs text-brand-600 hover:text-brand-700 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-64 sm:max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 sm:py-8 text-center text-slate-400 text-xs sm:text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => (
                          <div 
                          key={notification._id}
                          onClick={() => {
                            if (!notification.isRead) {
                              markAsReadMutation.mutate(notification._id);
                            }
                            if (notification.link) {
                              navigate(notification.link);
                              setShowNotifications(false);
                            }
                          }}
                          className={`px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-brand-50/50' : ''}`}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm text-slate-800 font-medium leading-tight truncate">{notification.title}</p>
                              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 line-clamp-2">{notification.message}</p>
                              <p className="text-[9px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">{new Date(notification.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              {!notification.isRead && (
                                <button 
                                  onClick={() => markAsReadMutation.mutate(notification._id)}
                                  className="p-1 text-slate-400 hover:text-brand-500 rounded"
                                  title="Mark as read"
                                >
                                  <Check size={12} className="sm:w-3.5 sm:h-3.5" />
                                </button>
                              )}
                              <button 
                                onClick={() => deleteNotificationMutation.mutate(notification._id)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded"
                                title="Delete"
                              >
                                <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {notifications.length > 10 && (
                    <div className="px-3 sm:px-4 py-2 border-t border-slate-100 bg-slate-50 text-center">
                      <Link 
                        to="/notifications" 
                        onClick={() => setShowNotifications(false)}
                        className="text-[10px] sm:text-xs text-brand-600 hover:text-brand-700 font-medium"
                      >
                        View all {notifications.length} notifications
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="h-4 sm:h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2 sm:gap-3">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 tracking-tight leading-none">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-brand-500 font-medium tracking-wider mt-0.5 sm:mt-1">{user?.role === 'super_admin' ? 'Super Admin' : user?.branchId?.branchName || user?.role?.replace('_', ' ') || 'Admin'}</p>
               </div>
               <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-inner shrink-0">
                  <Users size={16} className="sm:w-4.5 sm:h-4.5" />
               </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto bg-slate-50 overscroll-none">
          <div className="animate-in fade-in duration-700">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
