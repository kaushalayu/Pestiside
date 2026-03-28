import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Users, FileText, Building2, TrendingUp, Activity,
  IndianRupee, PieChart as PieIcon, ArrowRight, Truck,
  ArrowUpRight, Sparkles, ShieldCheck, Calendar, Clock,
  CheckCircle, AlertCircle, Mail, FileCheck, Receipt, Plus
} from 'lucide-react';
import api from '../lib/api';

const fetchStats = async () => (await api.get('/dashboard/stats')).data.data;
const fetchRevenue = async () => (await api.get('/dashboard/revenue')).data.data;
const fetchFunnel = async () => (await api.get('/dashboard/enquiry-funnel')).data.data;
const fetchActivity = async () => (await api.get('/dashboard/activity')).data.data;
const fetchExpenses = async () => (await api.get('/expenses/stats')).data.data;
const fetchCollections = async () => (await api.get('/collections/stats')).data.data;
const fetchEmployeePerformance = async () => (await api.get('/dashboard/employee-performance')).data.data;

const fetchMyForms = async () => (await api.get('/forms?limit=5')).data.data;
const fetchMyEnquiries = async () => (await api.get('/enquiries?limit=5')).data.data;
const fetchMyReceipts = async () => (await api.get('/receipts?limit=5')).data.data;

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

// Month names helper
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 group overflow-hidden relative transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1">
    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:rotate-12 transition-transform duration-500">
      <Icon size={70} />
    </div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <h4 className="text-slate-500 font-semibold uppercase text-xs tracking-wider mb-2">{title}</h4>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 tracking-tight">{value}</h2>
        {subtitle && (
          <div className="mt-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></span>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">{subtitle}</p>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl transition-all group-hover:scale-110 duration-300 shadow-lg ${trend ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-brand-600 text-white shadow-brand-200'}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

// Custom Tooltip for Revenue chart
const RevenueTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-white/10">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-base font-bold text-emerald-400">₹{(payload[0].value || 0).toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_admin';

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['stats'], queryFn: fetchStats, enabled: isAdmin
  });
  const { data: revenue, isLoading: revLoading, error: revError } = useQuery({
    queryKey: ['revenue'], queryFn: fetchRevenue, enabled: isAdmin
  });
  const { data: funnel, isLoading: funnelLoading, error: funnelError } = useQuery({
    queryKey: ['funnel'], queryFn: fetchFunnel, enabled: isAdmin
  });
  const { data: activity, isLoading: actLoading, error: actError } = useQuery({
    queryKey: ['activity'], queryFn: fetchActivity, enabled: isAdmin
  });

  const { data: expenseStats, isLoading: expLoading } = useQuery({
    queryKey: ['expenseStats'], queryFn: fetchExpenses, enabled: isAdmin
  });

  const { data: collectionStats, isLoading: collLoading } = useQuery({
    queryKey: ['collectionStats'], queryFn: fetchCollections, enabled: isAdmin
  });

  const { data: employeePerformance } = useQuery({
    queryKey: ['employeePerformance'], queryFn: fetchEmployeePerformance, enabled: isAdmin
  });

  const isLoading = statsLoading || revLoading || funnelLoading || actLoading || expLoading || collLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 min-h-400px gap-5">
        <div className="w-14 h-14 rounded-2xl border-4 border-slate-200 border-t-brand-500 animate-spin shadow-lg"></div>
        <p className="text-slate-400 font-semibold uppercase tracking-widest text-sm animate-pulse">Synchronizing metrics...</p>
      </div>
    );
  }

  if (!isAdmin) {
    const { data: myForms } = useQuery({ queryKey: ['myForms'], queryFn: fetchMyForms });
    const { data: myEnquiries } = useQuery({ queryKey: ['myEnquiries'], queryFn: fetchMyEnquiries });
    const { data: myReceipts } = useQuery({ queryKey: ['myReceipts'], queryFn: fetchMyReceipts });
    
    const completedJobs = myForms?.filter(f => f.status === 'COMPLETED').length || 0;
    const pendingJobs = myForms?.filter(f => f.status !== 'COMPLETED' && f.status !== 'CANCELLED').length || 0;
    const totalRevenue = myReceipts?.reduce((sum, r) => sum + (r.advancePaid || 0), 0) || 0;
    
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight uppercase leading-none">My Dashboard</h1>
            <div className="flex items-center gap-3 mt-3">
               <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Welcome back, {user?.name}</span>
               </div>
               <span className="text-xs font-medium text-slate-500 uppercase">{user?.branchId?.branchName || 'Branch'}</span>
            </div>
         </div>
         <Link to="/forms/create" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-500 transition-all">
            <Plus size={16} /> New Booking
         </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg"><FileText size={18} className="text-blue-600" /></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Jobs</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{myForms?.length || 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 rounded-lg"><Clock size={18} className="text-amber-600" /></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Pending</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{pendingJobs}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle size={18} className="text-emerald-600" /></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Completed</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{completedJobs}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-50 rounded-lg"><IndianRupee size={18} className="text-brand-600" /></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Collections</span>
            </div>
            <p className="text-3xl font-black text-slate-900">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Jobs */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase">Recent Jobs</h3>
              <Link to="/forms" className="text-[10px] font-bold text-brand-600 uppercase hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {myForms?.slice(0, 5).map(job => (
                <Link key={job._id} to={`/forms/${job._id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{job.orderNo || 'DRAFT'}</p>
                    <p className="text-[10px] text-slate-500">{job.customer?.name} • {job.customer?.phone}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[8px] font-bold uppercase ${
                    job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                    job.status === 'SCHEDULED' ? 'bg-amber-100 text-amber-700' :
                    job.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{job.status}</span>
                </Link>
              ))}
              {(!myForms || myForms.length === 0) && (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-slate-400">No jobs yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Enquiries */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase">My Enquiries</h3>
              <Link to="/enquiries" className="text-[10px] font-bold text-brand-600 uppercase hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {myEnquiries?.slice(0, 5).map(enq => (
                <div key={enq._id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{enq.customerName}</p>
                    <p className="text-[10px] text-slate-500">{enq.mobile} • {enq.city}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[8px] font-bold uppercase ${
                    enq.status === 'CONVERTED' ? 'bg-emerald-100 text-emerald-700' :
                    enq.status === 'LOST' ? 'bg-red-100 text-red-700' :
                    enq.status === 'QUALIFIED' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{enq.status}</span>
                </div>
              ))}
              {(!myEnquiries || myEnquiries.length === 0) && (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-slate-400">No enquiries yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/forms/create" className="bg-white rounded-xl p-4 border border-slate-200 hover:border-brand-500 hover:shadow-lg transition-all group">
            <div className="p-3 bg-brand-50 rounded-xl w-fit mb-3 group-hover:bg-brand-600 transition-colors">
              <FileText size={20} className="text-brand-600 group-hover:text-white" />
            </div>
            <p className="text-xs font-bold text-slate-900 uppercase">New Booking</p>
          </Link>
          <Link to="/enquiries" className="bg-white rounded-xl p-4 border border-slate-200 hover:border-brand-500 hover:shadow-lg transition-all group">
            <div className="p-3 bg-blue-50 rounded-xl w-fit mb-3 group-hover:bg-blue-600 transition-colors">
              <Mail size={20} className="text-blue-600 group-hover:text-white" />
            </div>
            <p className="text-xs font-bold text-slate-900 uppercase">Add Enquiry</p>
          </Link>
          <Link to="/receipts" className="bg-white rounded-xl p-4 border border-slate-200 hover:border-brand-500 hover:shadow-lg transition-all group">
            <div className="p-3 bg-emerald-50 rounded-xl w-fit mb-3 group-hover:bg-emerald-600 transition-colors">
              <Receipt size={20} className="text-emerald-600 group-hover:text-white" />
            </div>
            <p className="text-xs font-bold text-slate-900 uppercase">Generate Receipt</p>
          </Link>
          <Link to="/expenses" className="bg-white rounded-xl p-4 border border-slate-200 hover:border-brand-500 hover:shadow-lg transition-all group">
            <div className="p-3 bg-amber-50 rounded-xl w-fit mb-3 group-hover:bg-amber-600 transition-colors">
              <IndianRupee size={20} className="text-amber-600 group-hover:text-white" />
            </div>
            <p className="text-xs font-bold text-slate-900 uppercase">Add Expense</p>
          </Link>
        </div>
      </div>
    );
  }

  const revenueTrendData = revenue?.sixMonthTrend?.map(item => ({
    name: `${MONTHS[(item._id?.month || 1) - 1]} '${String(item._id?.year || '').slice(-2)}`,
    Revenue: item.revenue || 0,
  })) || [];

  // Compute MoM change for display
  const latestRev = revenueTrendData[revenueTrendData.length - 1]?.Revenue || 0;
  const prevRev = revenueTrendData[revenueTrendData.length - 2]?.Revenue || 0;
  const momChange = prevRev > 0 ? (((latestRev - prevRev) / prevRev) * 100).toFixed(1) : null;
  const momUp = momChange >= 0;

  const funnelData = funnel?.map(item => ({ name: item._id, value: item.count })) || [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight uppercase leading-none">Management Dashboard</h1>
          <div className="flex items-center gap-3 mt-3">
            <span className="px-3 py-1 bg-slate-100 text-slate-900 rounded-lg text-xs font-semibold uppercase tracking-wider border border-slate-200">System v4.2</span>
            <span className="text-slate-500 font-semibold uppercase text-xs tracking-wider flex items-center gap-2">
              <Activity size={14} className="text-emerald-500" /> Integrity Verified
            </span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard title="Revenue (Lifetime)" value={`₹${(stats?.overallCollection || 0).toLocaleString('en-IN')}`} subtitle="Total Collections" icon={IndianRupee} />
        <StatCard title="Branches" value={stats?.branches || 0} subtitle="Regional Command" icon={Building2} />
        <StatCard title="Employees" value={stats?.employees || 0} subtitle="Field Force" icon={Users} />
        <StatCard title="Booking (Month)" value={stats?.forms?.month || 0} subtitle="Recent Activity" icon={FileText} trend={true} />
        <StatCard title="Transit Log" value={`${stats?.totalDistance || 0} KM`} subtitle="Total Deployment" icon={Truck} trend={true} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Revenue Trajectory — PREMIUM ── */}
        <div className="lg:col-span-2 rounded-3xl relative overflow-hidden border border-slate-800 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 shadow-2xl shadow-slate-900/20">

          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between mb-8 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-brand-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Revenue Trajectory</p>
              </div>
              <h3 className="text-3xl font-display font-bold text-white tracking-tight">
                ₹{latestRev.toLocaleString('en-IN')}
              </h3>
              <p className="text-xs font-semibold text-slate-400 uppercase mt-1 tracking-wider">This Month's Collection</p>
            </div>
            {momChange !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${momUp ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
                <ArrowUpRight size={16} className={momUp ? '' : 'rotate-90'} />
                <span className="text-sm font-bold">{momUp ? '+' : ''}{momChange}%</span>
                <span className="text-xs font-medium opacity-70">MoM</span>
              </div>
            )}
          </div>

          {/* Monthly mini stats */}
          {revenueTrendData.length > 0 && (
            <div className="flex gap-6 mb-6 relative z-10 overflow-x-auto pb-2 scrollbar-hide">
              {revenueTrendData.map((d, i) => (
                <div key={i} className="shrink-0 text-center">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{d.name}</p>
                  <p className="text-sm font-bold text-white mt-1">₹{(d.Revenue / 1000).toFixed(0)}k</p>
                </div>
              ))}
            </div>
          )}

          {/* Chart */}
          <div className="h-60 w-full relative z-10">
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revGradientGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  axisLine={false} tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revGradient)"
                  dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#10b981', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom stat row */}
          <div className="flex gap-8 mt-6 pt-6 border-t border-white/10 relative z-10">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">6-Month Total</p>
              <p className="text-base font-bold text-white mt-1">₹{revenueTrendData.reduce((s, d) => s + d.Revenue, 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Avg / Month</p>
              <p className="text-base font-bold text-white mt-1">
                ₹{revenueTrendData.length ? Math.round(revenueTrendData.reduce((s, d) => s + d.Revenue, 0) / revenueTrendData.length).toLocaleString('en-IN') : 0}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Peak Month</p>
              <p className="text-base font-bold text-white mt-1">
                {revenueTrendData.length ? revenueTrendData.reduce((a, b) => a.Revenue > b.Revenue ? a : b).name : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-linear-to-br from-amber-50/50 to-white rounded-3xl p-6 md:p-8 border border-amber-100/50 group flex flex-col relative overflow-hidden hover:shadow-xl hover:shadow-amber-500/10 transition-all">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-between items-start mb-6 relative z-10">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600 shadow-lg shadow-amber-100"><PieIcon size={18} /></div>
              Lead Funnel
            </h3>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest italic mt-2 text-right">Conversion Rates</p>
          </div>

          <div className="flex-1 flex flex-col justify-center relative z-10 h-60">
            <ResponsiveContainer width="99%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={funnelData}
                  cx="50%" cy="50%"
                  innerRadius={70} outerRadius={90}
                  paddingAngle={5} dataKey="value"
                  stroke="none"
                >
                  {funnelData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-white/10 flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.fill || payload[0].color }}></div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">{payload[0].name}</p>
                            <p className="text-sm font-bold text-amber-400">{payload[0].value} <span className="text-xs text-slate-300 font-semibold ml-1">Leads</span></p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: 'transparent' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-4xl font-display font-bold text-slate-900 leading-none">{funnelData.reduce((a, b) => a + b.value, 0)}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-2">Total Leads</p>
            </div>
          </div>

          <div className="space-y-3 mt-6 relative z-10">
            {funnelData.map((entry, index) => {
              const totalFunnelCount = funnelData.reduce((a, b) => a + b.value, 0);
              const percentage = totalFunnelCount > 0 ? ((entry.value / totalFunnelCount) * 100).toFixed(1) : 0;
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md" style={{ backgroundColor: `${COLORS[index % COLORS.length]}15`, color: COLORS[index % COLORS.length] }}>
                      <PieIcon size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-bold uppercase text-slate-800 block leading-tight">{entry.name}</span>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{percentage}% of total</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">{entry.value}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Activity Stream */}
      <div className="bg-slate-900 text-white rounded-4xl p-8 md:p-10 relative overflow-hidden border border-slate-800 shadow-2xl shadow-slate-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_60%)] pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 mb-8">
          <div>
            <h3 className="text-xl font-bold tracking-tight uppercase">Activity Stream</h3>
            <p className="text-slate-400 font-semibold uppercase text-xs tracking-widest mt-1">Live updates across branches</p>
          </div>
          {/* ✅ Audit History navigates to /forms */}
          <button
            onClick={() => navigate('/forms')}
            className="px-6 py-3.5 bg-white text-slate-900 rounded-xl font-bold uppercase text-xs tracking-wider transition-all active:scale-95 flex items-center gap-3 border-2 border-white hover:bg-emerald-500 hover:text-white hover:border-emerald-500 shadow-lg"
          >
            Audit History <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
          {activity && activity.length > 0 ? activity.slice(0, 4).map((act, idx) => {
            const typeColor = {
              FORM_CREATED: 'text-brand-400',
              ENQUIRY_ADDED: 'text-amber-400',
              RECEIPT_GENERATED: 'text-emerald-400',
            }[act.type] || 'text-slate-400';

            const typeBg = {
              FORM_CREATED: 'bg-brand-500/20',
              ENQUIRY_ADDED: 'bg-amber-500/20',
              RECEIPT_GENERATED: 'bg-emerald-500/20',
            }[act.type] || 'bg-white/10';

            const typeLabel = {
              FORM_CREATED: 'Job Form',
              ENQUIRY_ADDED: 'New Lead',
              RECEIPT_GENERATED: 'Receipt',
            }[act.type] || 'Event';

            return (
              <div key={idx} className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-white/25 hover:bg-white/10 transition-all cursor-default">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${typeBg} flex items-center justify-center shadow-lg`}>
                    <Activity size={20} className={typeColor} />
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold uppercase tracking-widest ${typeColor}`}>{typeLabel}</span>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {act.timestamp ? new Date(act.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-white tracking-tight leading-relaxed line-clamp-2 min-h-12">
                  {act.description || 'Activity logged'}
                </h4>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                    {(act.user || 'U').charAt(0).toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase truncate">{act.user || 'System'}</p>
                </div>
              </div>
            );
          }) : (
            <div className="lg:col-span-4 text-center py-16">
              <Activity size={40} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest">No recent activity yet</p>
            </div>
          )}
        </div>

        {/* Employee Performance Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight uppercase">Employee Performance</h3>
              <p className="text-slate-400 font-semibold uppercase text-xs tracking-widest mt-1">Target vs Achievement</p>
            </div>
            <button onClick={() => navigate('/employees')} className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold uppercase hover:bg-slate-100 transition-all">
              Manage Team
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-left">Employee</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-left">Role</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-center">Jobs Done</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-center">Completed</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-center">Enquiries</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-center">Converted</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-right">Collection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeePerformance?.map(emp => (
                  <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900">{emp.name}</p>
                      <p className="text-[10px] text-slate-500">{emp.employeeId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${
                        emp.role === 'technician' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-slate-900">{emp.totalJobs || 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">{emp.completedJobs || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-slate-900">{emp.totalEnquiries || 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">{emp.convertedEnquiries || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-brand-600">₹{(emp.totalCollections || 0).toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
                {(!employeePerformance || employeePerformance.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">
                      No employee data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
