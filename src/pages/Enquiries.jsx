import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Plus, Search, CheckCircle2, Phone, Target, ArrowRight, DownloadCloud, User, MapPin, Tag, Activity, Clock, ShieldCheck, Database, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  NEW: { color: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Fresh Inquiry' },
  CONTACTED: { color: 'bg-blue-50 text-blue-800 border-blue-200', label: 'In Progress' },
  QUALIFIED: { color: 'bg-purple-50 text-purple-800 border-purple-200', label: 'Qualified' },
  CONVERTED: { color: 'bg-slate-900 text-white border-slate-900', label: 'Closed Win' },
  LOST: { color: 'bg-red-50 text-red-500 border-red-100', label: 'Declined' }
};

const Enquiries = () => {
  const queryClient = useQueryClient();
  const { data: rawEnquiries, isLoading } = useQuery({ 
     queryKey: ['enquiries'], 
     queryFn: async () => {
        try {
           const res = await api.get('/enquiries');
           return res.data?.data || [];
        } catch (err) {
           toast.error('Pipeline Fault Detected');
           throw err;
        }
     }
  });
  
  const { data: branches } = useQuery({ 
     queryKey: ['branches'], 
     queryFn: async () => {
        const res = await api.get('/branches');
        return res.data?.data || [];
     }
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBoard, setActiveBoard] = useState('ALL');

  const [formData, setFormData] = useState({
    customerName: '', mobile: '', city: '', requirement: '',
    serviceType: 'Residential', pestType: [], source: 'Walk-in', priority: 'MEDIUM', branchId: ''
  });

  const creationMutation = useMutation({
    mutationFn: (newEnq) => api.post('/enquiries', newEnq),
    onSuccess: () => {
      queryClient.invalidateQueries(['enquiries']);
      queryClient.invalidateQueries(['funnel']);
      setIsModalOpen(false);
      toast.success('Lead Registered');
      setFormData({
         customerName: '', mobile: '', city: '', requirement: '',
         serviceType: 'Residential', pestType: [], source: 'Walk-in', priority: 'MEDIUM', branchId: ''
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Access Denied');
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/enquiries/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['enquiries']);
      queryClient.invalidateQueries(['funnel']);
      toast.success('Status Migrated');
    }
  });

  if (isLoading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Target size={32} className="text-brand-500 animate-ping" />
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Harvesting Portfolio...</p>
       </div>
    );
  }

  const filteredEnquiries = activeBoard === 'ALL' 
    ? rawEnquiries 
    : rawEnquiries?.filter(e => e.status === activeBoard);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-20">
      
      {/* Header Segment */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-slate-900 rounded-lg text-white"><Target size={18} /></div>
              <h1 className="text-xl md:text-2xl font-display font-black text-slate-900 tracking-tight uppercase leading-none">Inquiries Ledger</h1>
           </div>
           <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest ml-1 italic">Customer Acquisition Engagement Cycle</p>
        </div>
        
        <button 
           onClick={() => setIsModalOpen(true)}
           className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 border-b-6 border-slate-900 shadow-none"
        >
           <Plus size={16} className="inline mr-2" /> Register Lead
        </button>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-2xl border border-slate-100">
         <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED'].map(board => (
              <button
                key={board}
                onClick={() => setActiveBoard(board)}
                className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeBoard === board ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'}`}
              >
                {board === 'ALL' ? 'Cumulative' : board.replace('_', ' ')}
              </button>
            ))}
         </div>
         <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest pr-4 border-l pl-4 border-slate-100 hidden md:block">
            {filteredEnquiries?.length || 0} active components identified
         </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredEnquiries?.map((enquiry) => (
            <div key={enquiry._id} className="bg-white rounded-[2rem] border border-slate-100 hover:border-slate-900 p-6 md:p-8 transition-all group relative overflow-hidden flex flex-col min-h-[400px]">
               <div className="flex justify-between items-start mb-6">
                  <span className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${STATUS_CONFIG[enquiry.status]?.color}`}>
                     {STATUS_CONFIG[enquiry.status]?.label}
                  </span>
                  <div className="text-[8px] font-black text-slate-400">
                     {new Date(enquiry.createdAt).toLocaleDateString()}
                  </div>
               </div>

               <div className="space-y-4 mb-8 flex-1">
                  <h3 className="text-lg font-black text-slate-900 leading-none uppercase truncate group-hover:text-brand-600 transition-colors">
                     {enquiry.customerName}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-800 font-bold bg-slate-50 p-2 rounded-lg border border-slate-100 w-fit text-[11px] tracking-wider">
                     <Phone size={12} className="text-brand-600" /> {enquiry.mobile}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 font-black uppercase text-[8px] tracking-widest">
                     <MapPin size={10} className="text-brand-500" /> {enquiry.city} • <span className="italic">{enquiry.serviceType}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-all">
                     <p className="text-[10px] font-bold text-slate-700 leading-relaxed min-h-[40px] italic">"{enquiry.requirement}"</p>
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100 group-hover:border-slate-900 transition-colors">
                  <p className="text-[7px] font-black text-slate-300 uppercase tracking-[.3em] mb-4">Pipeline Auth Migrate</p>
                  <div className="flex flex-wrap gap-2">
                     {Object.keys(STATUS_CONFIG).filter(s => s !== enquiry.status).map(status => (
                        <button 
                           key={status}
                           onClick={() => statusMutation.mutate({ id: enquiry._id, status })}
                           className="px-3 py-1.5 bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200 hover:border-slate-900 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                           {status.replace('_', ' ')}
                        </button>
                     ))}
                  </div>
               </div>
            </div>
         ))}
      </div>

      {/* Registration Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-xl border-2 border-slate-900 overflow-hidden animate-in zoom-in-95 duration-200 relative z-10 p-8 md:p-10">
               <div className="flex justify-between items-start mb-8">
                  <div>
                     <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest leading-none">Register Engagement</h2>
                     <p className="text-[9px] font-black text-slate-500 uppercase mt-2">Intelligence Stream Data Entry</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl transition-all"><X size={20} /></button>
               </div>

               <form onSubmit={(e) => { e.preventDefault(); creationMutation.mutate(formData); }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <div>
                           <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-1">Subject Name</label>
                           <input required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-black text-xs outline-none" />
                        </div>
                        <div>
                           <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-1">Authenticated Phone</label>
                           <input required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-black text-xs outline-none" />
                        </div>
                        <div>
                           <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-1">City Zone</label>
                           <input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-black text-xs outline-none" />
                        </div>
                     </div>
                     <div className="space-y-4">
                        <div>
                           <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-1">Sector Class</label>
                           <select value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-black text-xs outline-none">
                              <option>Residential</option><option>Commercial</option><option>Industrial</option><option>Agricultural</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-1">Regional Branch Hub</label>
                           <select required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-black text-xs outline-none">
                              <option value="">Select Command Center...</option>
                              {branches?.map(b => <option key={b._id} value={b._id}>{b.branchName} ({b.branchCode})</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-1">Priority Analysis</label>
                           <div className="grid grid-cols-3 gap-2">
                              {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                                 <button key={p} type="button" onClick={() => setFormData({...formData, priority: p})} className={`py-2 rounded-lg border-2 text-[8px] font-black transition-all ${formData.priority === p ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                    {p}
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest ml-1">Requirement Narrative</label>
                     <textarea required value={formData.requirement} onChange={e => setFormData({...formData, requirement: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-4 rounded-[1.5rem] font-black text-xs outline-none resize-none h-32 italic" placeholder="Details of the infestation vector..." />
                  </div>

                  <button 
                     disabled={creationMutation.isLoading} 
                     type="submit" 
                     className="w-full py-4 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-black active:scale-95 transition-all border-b-6 border-brand-500"
                  >
                     {creationMutation.isLoading ? 'SYNCHRONIZING...' : 'AUTHORIZE REGISTRATION'}
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default Enquiries;
