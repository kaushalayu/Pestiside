import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Search, MapPin, Mail, Phone, ShieldCheck, Edit3, Trash2 } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const fetchBranches = async () => (await api.get('/branches')).data.data;

const Branches = () => {
  const queryClient = useQueryClient();
  const { data: branches, isLoading } = useQuery({ queryKey: ['branches'], queryFn: fetchBranches });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    branchName: '',
    city: '',
    cityPrefix: '', // e.g. LKO
    address: '',
    phone: '',
    email: ''
  });

  const mutation = useMutation({
    mutationFn: (branch) => branch._id ? api.put(`/branches/${branch._id}`, branch) : api.post('/branches', branch),
    onSuccess: () => {
      queryClient.invalidateQueries(['branches']);
      queryClient.invalidateQueries(['stats']);
      setIsModalOpen(false);
      setFormData({ branchName: '', city: '', cityPrefix: '', address: '', phone: '', email: '' });
      toast.success('Branch Registry Updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update branch');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/branches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['branches']);
      queryClient.invalidateQueries(['stats']);
      toast.success('Branch Franchise Purged');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Purge Authorization Denied')
  });

  const handleDelete = (branch) => {
    if (window.confirm(`Protocol Alert: Are you sure you want to PURGE franchise ${branch.branchName}?`)) {
      deleteMutation.mutate(branch._id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in relative z-10 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-500" /> Branch Network
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Manage franchise locations and city specific configurations.</p>
        </div>
        
        <button onClick={() => { setFormData({ branchName: '', city: '', cityPrefix: '', address: '', phone: '', email: '' }); setIsModalOpen(true); }} className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
          <Plus size={18} /> Add New Branch
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {isLoading ? (
           [1, 2, 3].map(i => (
             <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse h-48"></div>
           ))
         ) : branches?.length > 0 ? (
           branches.map(branch => (
             <div key={branch._id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                   <div>
                     <h3 className="text-lg font-bold text-slate-800 font-display">{branch.branchName}</h3>
                     <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-md mt-1.5 border border-brand-100">
                       <ShieldCheck size={14} /> {branch.branchCode}
                     </span>
                   </div>
                   <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                     {branch.isActive ? 'Active' : 'Inactive'}
                   </div>
                </div>

                <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                    <button onClick={() => { setFormData({ ...branch }); setIsModalOpen(true); }} className="p-2 bg-slate-50 hover:bg-brand-50 rounded-lg text-slate-400 hover:text-brand-600 border border-slate-100 transition-colors shadow-sm" title="Edit Master Records">
                       <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(branch)} className="p-2 bg-slate-50 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 border border-slate-100 transition-colors shadow-sm" title="Purge Branch">
                       <Trash2 size={16} />
                    </button>
                 </div>
                
                <div className="space-y-3 relative z-10 mt-6">
                   <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                     <MapPin className="text-slate-400 w-4 h-4 shrink-0" />
                     <span className="truncate">{branch.city} • {branch.address}</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                     <Phone className="text-slate-400 w-4 h-4 shrink-0" />
                     {branch.phone}
                   </div>
                   <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                     <Mail className="text-slate-400 w-4 h-4 shrink-0" />
                     <span className="truncate">{branch.email || 'No email assigned'}</span>
                   </div>
                </div>
             </div>
           ))
         ) : (
           <div className="col-span-full py-16 text-center text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-200">
              No branch franchises have been registered yet.
           </div>
         )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           
           {/* Modal Body */}
           <div className="bg-white rounded-3xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl animate-fade-in">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                 <h3 className="text-lg font-display font-bold text-slate-800">{formData._id ? 'Update Branch Config' : 'Register New Branch'}</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Branch Name</label>
                    <input required value={formData.branchName} onChange={e => setFormData({...formData, branchName: e.target.value})} className="premium-input" placeholder="e.g. Lucknow East HQ" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 ml-1">City</label>
                      <input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="premium-input" placeholder="Lucknow" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 ml-1">City Prefix (Max 4 chars)</label>
                      <input required maxLength={4} value={formData.cityPrefix} onChange={e => setFormData({...formData, cityPrefix: e.target.value.toUpperCase()})} className="premium-input uppercase" placeholder="LKO" />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Full Address</label>
                    <textarea required rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="premium-input resize-none" placeholder="Enter branch physical address..." />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Support Phone</label>
                      <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="premium-input" placeholder="+91 0000000000" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Official Email</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="premium-input" placeholder="lko@safehome.com" />
                    </div>
                 </div>

                 <div className="pt-6 flex justify-end gap-3">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors">Cancel</button>
                   <button disabled={mutation.isPending} type="submit" className="premium-btn">{mutation.isPending ? 'Registering...' : 'Complete Registry'}</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
