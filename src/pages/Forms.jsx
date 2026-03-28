import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, FileText, Download, Filter, Eye, 
  ChevronRight, Calendar, User, IndianRupee, MapPin, Receipt, ArrowRight, ShieldCheck, Phone, Database, Activity, Edit3
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const fetchForms = async () => (await api.get('/forms')).data.data;

const Forms = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_admin' || user?.role === 'office';
  const { data: forms, isLoading } = useQuery({ queryKey: ['forms'], queryFn: fetchForms });

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'SUBMITTED': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'SCHEDULED': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const handleDownloadPdf = async (formId, orderNo) => {
    try {
      const response = await api.get(`/forms/${formId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `JobCard_${orderNo || formId}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('PDF Generated');
    } catch (err) {
      console.error('PDF Error:', err);
      toast.error('PDF Generation Failed');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/forms/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ServiceForms_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      toast.success('Excel/CSV Exported');
    } catch (err) {
      toast.error('Export Failed');
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-20 font-sans">
      
      {/* Refined Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
             <div className="p-2 bg-slate-900 text-white rounded-lg"><FileText size={20} /></div>
             Booking Form
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Service Request Registry</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {isAdmin && (
            <button onClick={handleExportCSV} className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-emerald-500 active:scale-95 flex items-center justify-center gap-2 border-b-4 border-slate-900 shadow-none">
              <Download size={14} /> Export CSV
            </button>
          )}
          <Link to="/forms/create" className="flex-1 md:flex-none px-6 py-3 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-brand-500 active:scale-95 flex items-center justify-center gap-2 border-b-4 border-slate-900 shadow-none">
            <Plus size={16} /> New Booking
          </Link>
        </div>
      </div>

      {/* Modern Data Grid */}
      <div className="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden">
        
        {/* Search & Intelligence */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full md:max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="IDENTIFY BY ORDER, SUBJECT OR VECTOR..." 
               className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand-500 transition-all placeholder:text-slate-300 shadow-none"
             />
           </div>
           <button className="flex items-center gap-2 px-4 py-2 border-2 border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-slate-900 hover:text-slate-900 transition-all">
              <Filter size={14} /> Filter Logic
           </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Ref</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personnel Subject</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Vector</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Asset Value</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-slate-100 border-t-brand-500 rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Registry...</p>
                     </div>
                  </td>
                </tr>
              ) : forms?.length > 0 ? (
                forms.map((form) => (
                  <tr key={form._id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                    <td className="px-6 py-5">
                       <span className="text-xs font-black text-slate-900 tracking-tighter uppercase">{form.orderNo || 'UNASSIGNED'}</span>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2 text-slate-500 italic">
                          <Calendar size={12} className="text-brand-500" />
                          <span className="text-[11px] font-bold">
                             {new Date(form.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1">{form.customer?.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-1">
                             <Phone size={10} /> {form.customer?.phone}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{form.serviceCategory}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-1">
                             <ShieldCheck size={10} className="text-emerald-500" /> 
                             {form.amcServices?.length > 0 ? form.amcServices.join(', ') : 'General Control'}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-slate-900">₹{form.billing?.total?.toLocaleString('en-IN')}</span>
                          {form.billing?.due > 0 ? (
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1">₹{form.billing.due} Dues</span>
                          ) : (
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">Settled</span>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${getStatusColor(form.status)}`}>
                          {form.status}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                           {form.status !== 'COMPLETED' && form.status !== 'CANCELLED' && (
                             <button 
                                onClick={() => navigate(`/forms/create?edit=${form._id}`)}
                                className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-none"
                                title="Edit Form"
                             >
                                <Edit3 size={16} />
                             </button>
                           )}
                           <button 
                              onClick={() => handleDownloadPdf(form._id, form.orderNo)}
                              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-none"
                              title="Download PDF Log"
                           >
                              <Download size={16} />
                           </button>
                           <button 
                              onClick={() => navigate(`/forms/${form._id}`)}
                              className="p-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-600 hover:text-white transition-all shadow-none"
                              title="Audit Review"
                           >
                              <Eye size={16} />
                           </button>
                        </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                         <div className="p-4 bg-slate-50 text-slate-200 rounded-full"><Database size={40} /></div>
                         <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Registry is Empty</p>
                         <Link to="/forms/create" className="text-[10px] font-black text-brand-600 hover:text-brand-500 uppercase tracking-widest bg-brand-50 px-4 py-2 rounded-lg transition-all">Begin First Job Card Record</Link>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Forms;
