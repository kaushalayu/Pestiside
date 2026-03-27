import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, FileText, Building2, TrendingUp, Activity, 
  IndianRupee, PieChart as PieIcon, ArrowRight, Truck,
  ArrowUpRight, Sparkles
} from 'lucide-react';
import api from '../lib/api';

const fetchStats   = async () => (await api.get('/dashboard/stats')).data.data;
const fetchRevenue = async () => (await api.get('/dashboard/revenue')).data.data;
const fetchFunnel  = async () => (await api.get('/dashboard/enquiry-funnel')).data.data;
const fetchActivity= async () => (await api.get('/dashboard/activity')).data.data;

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

// Month names helper
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
  <div className="bg-white rounded-2xl p-6 border-2 border-slate-900 group overflow-hidden relative transition-all hover:bg-slate-50">
    <div className="absolute top-0 right-0 p-3 opacity-[0.04] group-hover:rotate-12 transition-transform duration-500">
       <Icon size={70} />
    </div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <h4 className="text-slate-500 font-bold uppercase text-[9px] tracking-wider mb-2">{title}</h4>
        <h2 className="text-2xl md:text-3xl font-display font-black text-slate-900 tracking-tight">{value}</h2>
        {subtitle && (
           <div className="mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse"></span>
              <p className="text-[9px] text-slate-700 font-bold uppercase tracking-wider">{subtitle}</p>
           </div>
        )}
      </div>
      <div className={`p-3 rounded-xl transition-all group-hover:scale-110 duration-300 ${trend ? 'bg-emerald-600 text-white' : 'bg-brand-600 text-white'}`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);

// Custom Tooltip for Revenue chart
const RevenueTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-white/10">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-base font-black text-emerald-400">₹{(payload[0].value || 0).toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: stats,    isLoading: statsLoading }  = useQuery({ queryKey: ['stats'],    queryFn: fetchStats });
  const { data: revenue,  isLoading: revLoading }    = useQuery({ queryKey: ['revenue'],  queryFn: fetchRevenue });
  const { data: funnel,   isLoading: funnelLoading } = useQuery({ queryKey: ['funnel'],   queryFn: fetchFunnel });
  const { data: activity, isLoading: actLoading }    = useQuery({ queryKey: ['activity'], queryFn: fetchActivity });

  const isLoading = statsLoading || revLoading || funnelLoading || actLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 min-h-[400px] gap-4">
        <div className="w-10 h-10 rounded-2xl border-4 border-slate-900 border-t-brand-500 animate-spin"></div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] animate-pulse">Synchronizing metrics...</p>
      </div>
    );
  }

  const revenueTrendData = revenue?.sixMonthTrend?.map(item => ({
    name: `${MONTHS[(item._id?.month || 1) - 1]} '${String(item._id?.year || '').slice(-2)}`,
    Revenue: item.revenue || 0,
  })) || [];

  // Compute MoM change for display
  const latestRev  = revenueTrendData[revenueTrendData.length - 1]?.Revenue || 0;
  const prevRev    = revenueTrendData[revenueTrendData.length - 2]?.Revenue || 0;
  const momChange  = prevRev > 0 ? (((latestRev - prevRev) / prevRev) * 100).toFixed(1) : null;
  const momUp      = momChange >= 0;

  const funnelData = funnel?.map(item => ({ name: item._id, value: item.count })) || [];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-xl md:text-2xl font-display font-black text-slate-900 tracking-tight uppercase leading-none">Management Dashboard</h1>
            <div className="flex items-center gap-3 mt-2">
               <span className="px-2 py-0.5 bg-slate-100 text-slate-900 rounded-md text-[8px] font-black uppercase tracking-widest border border-slate-200">System v4.2</span>
               <span className="text-slate-600 font-bold uppercase text-[9px] tracking-wider italic flex items-center gap-2">
                  <Activity size={12} className="text-emerald-500" /> Integrity Verified
               </span>
            </div>
         </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Revenue (Lifetime)" value={`₹${(stats?.overallCollection || 0).toLocaleString('en-IN')}`} subtitle="Total Collections" icon={IndianRupee} />
        <StatCard title="Branches"           value={stats?.branches || 0}                                            subtitle="Regional Command"  icon={Building2} />
        <StatCard title="Employees"          value={stats?.employees || 0}                                           subtitle="Field Force"       icon={Users} />
        <StatCard title="Jobs (Month)"       value={stats?.forms?.month || 0}                                        subtitle="Recent Activity"   icon={FileText} trend={true} />
        <StatCard title="Transit Log"        value={`${stats?.totalDistance || 0} KM`}                              subtitle="Total Deployment"  icon={Truck}    trend={true} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Revenue Trajectory — PREMIUM ── */}
        <div className="lg:col-span-2 rounded-3xl relative overflow-hidden border-2 border-slate-900 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 shadow-2xl">
          
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between mb-6 relative z-10">
             <div>
                <div className="flex items-center gap-2 mb-1">
                   <Sparkles size={14} className="text-brand-400" />
                   <p className="text-[9px] font-black uppercase tracking-widest text-brand-400">Revenue Trajectory</p>
                </div>
                <h3 className="text-2xl font-display font-black text-white tracking-tight">
                  ₹{latestRev.toLocaleString('en-IN')}
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">This Month's Collection</p>
             </div>
             {momChange !== null && (
               <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${momUp ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-red-500/15 border-red-500/30 text-red-400'}`}>
                  <ArrowUpRight size={14} className={momUp ? '' : 'rotate-90'} />
                  <span className="text-[10px] font-black">{momUp ? '+' : ''}{momChange}%</span>
                  <span className="text-[8px] font-bold opacity-70">MoM</span>
               </div>
             )}
          </div>

          {/* Monthly mini stats */}
          {revenueTrendData.length > 0 && (
            <div className="flex gap-4 mb-6 relative z-10 overflow-x-auto pb-1 scrollbar-hide">
              {revenueTrendData.map((d, i) => (
                <div key={i} className="shrink-0 text-center">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{d.name}</p>
                  <p className="text-xs font-black text-white mt-0.5">₹{(d.Revenue/1000).toFixed(0)}k</p>
                </div>
              ))}
            </div>
          )}

          {/* Chart */}
          <div className="h-[220px] w-full relative z-10">
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="revGradientGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} 
                  tickFormatter={(v) => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} 
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
          <div className="flex gap-6 mt-4 pt-4 border-t border-white/10 relative z-10">
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">6-Month Total</p>
              <p className="text-sm font-black text-white">₹{revenueTrendData.reduce((s,d) => s + d.Revenue, 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Avg / Month</p>
              <p className="text-sm font-black text-white">
                ₹{revenueTrendData.length ? Math.round(revenueTrendData.reduce((s,d)=>s+d.Revenue,0)/revenueTrendData.length).toLocaleString('en-IN') : 0}
              </p>
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Peak Month</p>
              <p className="text-sm font-black text-white">
                {revenueTrendData.length ? revenueTrendData.reduce((a,b)=>a.Revenue>b.Revenue?a:b).name : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-gradient-to-br from-amber-50/50 to-white rounded-3xl p-6 md:p-8 border-2 border-amber-100/50 group flex flex-col relative overflow-hidden hover:border-amber-200 transition-all shadow-lg shadow-amber-500/5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-start mb-4 relative z-10">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><PieIcon size={16} /></div>
                Lead Funnel
             </h3>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic mt-2 text-right">Conversion Rates</p>
          </div>
          
          <div className="flex-1 flex flex-col justify-center relative z-10 h-[220px]">
            <ResponsiveContainer width="99%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie 
                  data={funnelData} 
                  cx="50%" cy="50%" 
                  innerRadius={65} outerRadius={85} 
                  paddingAngle={5} dataKey="value"
                  stroke="none"
                >
                  {funnelData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-xl border border-white/10 flex items-center gap-3">
                           <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].payload.fill || payload[0].color }}></div>
                           <div>
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{payload[0].name}</p>
                              <p className="text-xs font-black text-amber-400">{payload[0].value} <span className="text-[8px] text-slate-300 font-bold ml-1">Leads</span></p>
                           </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{fill: 'transparent'}}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <p className="text-3xl font-display font-black text-slate-900 leading-none">{funnelData.reduce((a, b) => a + b.value, 0)}</p>
               <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-1">Total Leads</p>
            </div>
          </div>
          
          <div className="space-y-2 mt-4 relative z-10">
             {funnelData.map((entry, index) => {
                const totalFunnelCount = funnelData.reduce((a, b) => a + b.value, 0);
                const percentage = totalFunnelCount > 0 ? ((entry.value / totalFunnelCount) * 100).toFixed(1) : 0;
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-amber-200 hover:shadow-md hover:shadow-amber-500/5 transition-all group-hover:-translate-y-0.5">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${COLORS[index % COLORS.length]}15`, color: COLORS[index % COLORS.length] }}>
                           <PieIcon size={14} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-800 block leading-tight">{entry.name}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{percentage}% of total</span>
                        </div>
                     </div>
                     <span className="text-xs font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{entry.value}</span>
                  </div>
                )
             })}
          </div>
        </div>
      </div>

      {/* Activity Stream */}
      <div className="bg-slate-900 text-white rounded-[2rem] p-8 md:p-10 relative overflow-hidden border-2 border-slate-900">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_60%)] pointer-events-none" />

         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 mb-10">
            <div>
               <h3 className="text-lg font-black tracking-tight uppercase">Activity Stream</h3>
               <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-1">Live updates across branches</p>
            </div>
            {/* ✅ Audit History navigates to /forms */}
            <button
              onClick={() => navigate('/forms')}
              className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all active:scale-95 flex items-center gap-3 border-2 border-white hover:bg-slate-700 hover:text-white hover:border-slate-700 shadow-none"
            >
               Audit History <ArrowRight size={16} />
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {activity && activity.length > 0 ? activity.slice(0, 4).map((act, idx) => {
               const typeColor = {
                 FORM_CREATED:      'text-brand-400',
                 ENQUIRY_ADDED:     'text-amber-400',
                 RECEIPT_GENERATED: 'text-emerald-400',
               }[act.type] || 'text-slate-400';

               const typeBg = {
                 FORM_CREATED:      'bg-brand-500/20',
                 ENQUIRY_ADDED:     'bg-amber-500/20',
                 RECEIPT_GENERATED: 'bg-emerald-500/20',
               }[act.type] || 'bg-white/10';

               const typeLabel = {
                 FORM_CREATED:      'Job Form',
                 ENQUIRY_ADDED:     'New Lead',
                 RECEIPT_GENERATED: 'Receipt',
               }[act.type] || 'Event';

               return (
                 <div key={idx} className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-white/25 hover:bg-white/8 transition-all group cursor-default">
                    <div className="flex items-start justify-between mb-4">
                       <div className={`w-10 h-10 rounded-xl ${typeBg} flex items-center justify-center`}>
                          <Activity size={18} className={typeColor} />
                       </div>
                       <div className="text-right">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${typeColor}`}>{typeLabel}</span>
                          <p className="text-[8px] text-slate-600 font-bold mt-0.5">
                            {act.timestamp ? new Date(act.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </p>
                       </div>
                    </div>
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-tight leading-relaxed line-clamp-2 min-h-8">
                       {act.description || 'Activity logged'}
                    </h4>
                    <div className="mt-4 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-[8px] font-black text-white">
                          {(act.user || 'U').charAt(0).toUpperCase()}
                       </div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{act.user || 'System'}</p>
                    </div>
                 </div>
               );
            }) : (
               <div className="lg:col-span-4 text-center py-12">
                  <Activity size={32} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">No recent activity yet</p>
               </div>
            )}
         </div>
      </div>

    </div>
  );
};

export default Dashboard;
