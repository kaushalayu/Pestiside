import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Users, FileText, Building2, TrendingUp, Activity,
  IndianRupee, ArrowUpRight, Calendar, Clock,
  CheckCircle, AlertCircle, Mail, Receipt, Plus, Building, Wallet
} from 'lucide-react';
import api from '../lib/api';

const fetchDashboardData = async () => {
  const res = await api.get('/dashboard/combined');
  return res.data.data;
};

const fetchHQSummary = async () => {
  const res = await api.get('/payments/hq-summary');
  return res.data.data;
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'emerald' }) => (
  <div className={`bg-white rounded-2xl p-6 border border-${color}-100 group overflow-hidden relative transition-all hover:shadow-xl hover:-translate-y-1`}>
    <div className={`absolute top-0 right-0 p-3 opacity-[0.03] group-hover:rotate-12 transition-transform duration-500`}>
      <Icon size={70} />
    </div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <h4 className="text-slate-500 font-semibold uppercase text-xs tracking-wider mb-2">{title}</h4>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 tracking-tight">{value}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl bg-${color}-600 text-white shadow-lg`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_admin';
  const isTechnician = user?.role === 'technician' || user?.role === 'sales';
  const isOffice = user?.role === 'office';

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: hqSummary } = useQuery({
    queryKey: ['hqSummary'],
    queryFn: fetchHQSummary,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isAdmin,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 min-h-[400px] gap-5">
        <div className="w-14 h-14 rounded-2xl border-4 border-slate-200 border-t-emerald-500 animate-spin shadow-lg"></div>
        <p className="text-slate-400 font-semibold uppercase tracking-widest text-sm animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 gap-5">
        <AlertCircle size={48} className="text-red-400" />
        <p className="text-slate-500">Failed to load dashboard</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const revenue = data?.revenue || [];
  const funnel = data?.funnel || [];
  const activity = data?.activity || [];
  const pendingApprovals = data?.pendingApprovals || [];
  const pendingExpenses = data?.pendingExpenses || [];

  const totalEnquiries = funnel.reduce((sum, f) => sum + f.count, 0);
  const funnelData = funnel.map(f => ({
    name: f._id,
    value: f.count,
    percent: totalEnquiries > 0 ? Math.round((f.count / totalEnquiries) * 100) : 0
  }));

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight uppercase flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg"><Activity size={20} /></div>
            Dashboard
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Real-time metrics
          </p>
        </div>
        <Link to="/forms/create" className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg">
          <Plus size={16} /> New Booking
        </Link>
      </div>

      {/* Super Admin & Branch Admin: All Stats */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Forms Today" value={stats.forms?.today || 0} subtitle={`${stats.forms?.week || 0} this week`} icon={FileText} color="blue" />
          <StatCard title="Pending Revenue" value={`₹${(stats.pendingRevenue || 0).toLocaleString('en-IN')}`} subtitle="Outstanding" icon={IndianRupee} color="amber" />
          <StatCard title="Today's Collection" value={`₹${(stats.todayCollection || 0).toLocaleString('en-IN')}`} subtitle="Collected" icon={Receipt} color="emerald" />
          <StatCard title="Total Collection" value={`₹${(stats.overallCollection || 0).toLocaleString('en-IN')}`} subtitle="All time" icon={TrendingUp} color="purple" />
        </div>
      )}

      {/* HQ Summary for All Admins */}
      {isAdmin && hqSummary && (hqSummary.totals || hqSummary.totalReceivedFromHQ) && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Building className="text-emerald-400" size={20} />
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">
              {isSuperAdmin ? 'All Branches - HQ Financial Summary' : 'HQ Financial Summary'}
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider mb-1">Stock Given</p>
              <p className="text-xl md:text-2xl font-display font-black text-purple-400">₹{((hqSummary.totals?.totalInventoryValue) || hqSummary.totalInventoryValue || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider mb-1">Paid to HQ</p>
              <p className="text-xl md:text-2xl font-display font-black text-blue-400">₹{((hqSummary.totals?.totalPaidToHQ) || hqSummary.totalPaidToHQ || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider mb-1">Pending to HQ</p>
              <p className="text-xl md:text-2xl font-display font-black text-amber-400">₹{((hqSummary.totals?.pendingBalance) || hqSummary.pendingBalance || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider mb-1">Pending from Customers</p>
              <p className="text-xl md:text-2xl font-display font-black text-red-400">₹{((hqSummary.totals?.pendingFromCustomers) || hqSummary.pendingFromCustomers || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider mb-1">HQ Received</p>
              <p className="text-xl md:text-2xl font-display font-black text-emerald-400">₹{((hqSummary.totals?.totalReceivedFromHQ) || hqSummary.totalReceivedFromHQ || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Technician/Sales: My Stats */}
      {isTechnician && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="My Forms Today" value={stats.forms?.today || 0} subtitle={`${stats.forms?.week || 0} this week`} icon={FileText} color="blue" />
          <StatCard title="My Pending Revenue" value={`₹${(stats.pendingRevenue || 0).toLocaleString('en-IN')}`} subtitle="Outstanding" icon={IndianRupee} color="amber" />
          <StatCard title="My Collection Today" value={`₹${(stats.todayCollection || 0).toLocaleString('en-IN')}`} subtitle="Collected" icon={Receipt} color="emerald" />
          <StatCard title="My Total Collection" value={`₹${(stats.overallCollection || 0).toLocaleString('en-IN')}`} subtitle="All time" icon={TrendingUp} color="purple" />
        </div>
      )}

      {/* Office: Branch Stats */}
      {isOffice && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Branch Forms Today" value={stats.forms?.today || 0} subtitle={`${stats.forms?.week || 0} this week`} icon={FileText} color="blue" />
          <StatCard title="Pending Revenue" value={`₹${(stats.pendingRevenue || 0).toLocaleString('en-IN')}`} subtitle="Outstanding" icon={IndianRupee} color="amber" />
          <StatCard title="Today's Collection" value={`₹${(stats.todayCollection || 0).toLocaleString('en-IN')}`} subtitle="Collected" icon={Receipt} color="emerald" />
          <StatCard title="Total Collection" value={`₹${(stats.overallCollection || 0).toLocaleString('en-IN')}`} subtitle="All time" icon={TrendingUp} color="purple" />
        </div>
      )}

      {/* Admin & Office: Revenue & Enquiry (Branch/Overall level) */}
      {(isAdmin || isOffice) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
              {isSuperAdmin ? 'Revenue by Branch' : 'Branch Revenue'}
            </h3>
            {revenue.length > 0 ? (
              <div className="space-y-3">
                {revenue.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">{r.branchName || 'Unknown'}</span>
                        <span className="text-emerald-600 font-bold">₹{(r.totalCollected || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all" 
                          style={{ width: `${Math.min(100, (r.totalCollected / (revenue[0]?.totalCollected || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No revenue data</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Enquiry Status</h3>
            {funnelData.length > 0 ? (
              <div className="flex flex-col items-center">
                <PieChart width={180} height={180}>
                  <Pie
                    data={funnelData}
                    cx={90}
                    cy={90}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
                <div className="mt-4 space-y-2 w-full">
                  {funnelData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No enquiries</p>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity - For Everyone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              {isTechnician ? 'My Recent Activity' : 'Recent Activity'}
            </h3>
            <button onClick={() => navigate('/forms')} className="text-xs text-emerald-600 hover:text-emerald-700 font-bold">View all</button>
          </div>
          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className={`p-1.5 rounded-lg ${
                    item.type === 'FORM' ? 'bg-blue-100 text-blue-600' :
                    item.type === 'ENQUIRY' ? 'bg-amber-100 text-amber-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {item.type === 'FORM' ? <FileText size={12} /> :
                     item.type === 'ENQUIRY' ? <Users size={12} /> :
                     <Receipt size={12} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-700">{item.description}</p>
                    <p className="text-slate-400 text-[10px]">
                      {new Date(item.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No recent activity</p>
          )}
        </div>

        {/* Pending Approvals - Admin Only */}
        {isAdmin && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-500" />
                Pending Approvals
              </h3>
              <div className="flex gap-2">
                <button onClick={() => navigate('/receipts')} className="text-xs text-emerald-600 hover:text-emerald-700 font-bold">Receipts</button>
                <button onClick={() => navigate('/expenses')} className="text-xs text-emerald-600 hover:text-emerald-700 font-bold">Expenses</button>
              </div>
            </div>
            
            {pendingApprovals.length > 0 || pendingExpenses.length > 0 ? (
              <div className="space-y-4">
                {pendingApprovals.slice(0, 3).map((r, idx) => (
                  <div key={`receipt-${idx}`} className="flex items-center justify-between text-xs p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div>
                      <p className="font-semibold text-emerald-800">Receipt</p>
                      <p className="text-emerald-600">{r.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">₹{(r.totalAmount || 0).toLocaleString('en-IN')}</p>
                      <p className="text-emerald-400 text-[10px]">{r.paymentMode}</p>
                    </div>
                  </div>
                ))}
                {pendingExpenses.slice(0, 3).map((e, idx) => (
                  <div key={`expense-${idx}`} className="flex items-center justify-between text-xs p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div>
                      <p className="font-semibold text-amber-800">{e.category}</p>
                      <p className="text-amber-600">{e.employeeId?.name}</p>
                      <p className="text-amber-400 text-[10px] line-clamp-1">{e.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">₹{(e.amount || 0).toLocaleString('en-IN')}</p>
                      <p className="text-amber-400 text-[10px]">{e.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-slate-400">All caught up!</p>
              </div>
            )}
          </div>
        )}

        {/* Technician: Quick Actions */}
        {isTechnician && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/forms/create')}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <Plus size={18} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Create New Booking</span>
              </button>
              <button 
                onClick={() => navigate('/receipts')}
                className="w-full flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
              >
                <Receipt size={18} className="text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">Generate Receipt</span>
              </button>
              <button 
                onClick={() => navigate('/customers')}
                className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
              >
                <Users size={18} className="text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">View Customers</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
