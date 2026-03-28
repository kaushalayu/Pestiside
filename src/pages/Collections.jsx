import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { IndianRupee, TrendingUp, Users as UsersIcon, Calendar, Filter, Database, Wallet, CreditCard, ChevronRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const Collections = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ summary: { totalOverall: 0, totalToday: 0 }, details: [] });

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/collections/stats');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Collection Ledger Unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-xl border-4 border-slate-900 border-t-emerald-500 animate-spin"></div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Auditing Revenue...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-black text-slate-900 tracking-tight uppercase">Revenue Ledger</h1>
          <p className="text-slate-500 mt-1 font-bold uppercase text-[8px] tracking-wider italic flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
             Aggregated Collection Index
          </p>
        </div>
        <button 
           onClick={fetchCollections}
           disabled={loading}
           className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 border-b-4 border-slate-700 hover:border-slate-800 disabled:opacity-50 flex items-center gap-2"
        >
           {loading ? <RefreshCw size={14} className="animate-spin" /> : null}
           Sync Registry
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 hover:border-slate-900 transition-colors group relative overflow-hidden">
          <p className="text-slate-500 font-black uppercase tracking-wider text-[9px] mb-2">Today's Settlement</p>
          <h3 className="text-2xl md:text-3xl font-display font-black text-slate-900">₹{data.summary.totalToday.toLocaleString('en-IN')}</h3>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-2xl border-2 border-slate-900 text-white group relative overflow-hidden">
           <p className="text-slate-400 font-black uppercase tracking-wider text-[9px] mb-2">Aggregate Collections</p>
           <h3 className="text-2xl md:text-3xl font-display font-black text-white">₹{data.summary.totalOverall.toLocaleString('en-IN')}</h3>
        </div>
      </div>

      {/* Staff Activity Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
           <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Technician Operations Audit</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {data.details.map((staff, idx) => (
             <div key={idx} className="bg-white p-5 rounded-xl border border-slate-100 hover:border-slate-400 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                   <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all">
                      <UsersIcon size={16} />
                   </div>
                   <div className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded text-[8px] font-black uppercase tracking-widest border border-slate-100 italic">
                      Staff ID: {idx + 1}
                   </div>
                </div>
                
                <h4 className="text-xs font-black text-slate-900 group-hover:text-brand-600 transition-colors uppercase truncate">{staff.employeeName}</h4>
                
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-50">
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Today</p>
                      <p className="text-sm font-black text-slate-900 tracking-tight">₹{staff.todayCollected.toLocaleString('en-IN')}</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime</p>
                      <p className="text-sm font-black text-slate-900 tracking-tight">₹{staff.totalCollected.toLocaleString('en-IN')}</p>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default Collections;
