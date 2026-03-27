import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Wallet, Plus, TrendingDown, IndianRupee, Users, CheckCircle2, XCircle, Clock, Trash2, X, Filter, Calendar, Receipt, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  Travel: 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-indigo-100',
  Food: 'bg-orange-50 text-orange-700 border-orange-200 shadow-orange-100',
  Materials: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100',
  Equipment: 'bg-purple-50 text-purple-700 border-purple-200 shadow-purple-100',
  Communication: 'bg-cyan-50 text-cyan-700 border-cyan-200 shadow-cyan-100',
  Miscellaneous: 'bg-slate-100 text-slate-800 border-slate-300 shadow-slate-200',
};

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-300 font-black',
  APPROVED: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black',
  REJECTED: 'bg-red-100 text-red-900 border-red-300 font-black',
};

const Expenses = () => {
  const { user } = useSelector(state => state.auth);
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_admin';

  const { data: expenses, isLoading } = useQuery({ 
     queryKey: ['expenses'], 
     queryFn: async () => {
        try {
           const res = await api.get('/expenses');
           return res.data?.data || [];
        } catch (err) {
           toast.error('Ledger Restricted');
           throw err;
        }
     }
  });

  const { data: stats } = useQuery({ 
     queryKey: ['expenseStats'], 
     queryFn: async () => {
        const res = await api.get('/expenses/stats');
        return res.data?.data || { todayTotal: 0, overallTotal: 0 };
     }
  });

  const { data: branches } = useQuery({ 
     queryKey: ['branches'], 
     queryFn: async () => {
        const res = await api.get('/branches');
        return res.data?.data || [];
     },
     enabled: user?.role === 'super_admin'
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Travel',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    receiptNote: '',
    branchId: '',
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/expenses/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expenseStats']);
      setIsModalOpen(false);
      toast.success('Disbursement recorded');
      setFormData({ category: 'Travel', amount: '', description: '', date: new Date().toISOString().split('T')[0], receiptNote: '', branchId: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Access denied'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/expenses/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expenseStats']);
      toast.success('Audit status updated');
    },
    onError: (err) => toast.error('Veto failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expenseStats']);
      toast.success('Expense Ledger Entry Purged');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Purge Authorization Denied')
  });

  const handleDelete = (expense) => {
    if (window.confirm(`Protocol Alert: Are you sure you want to PURGE this expense entry?`)) {
      deleteMutation.mutate(expense._id);
    }
  };

  if (isLoading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Wallet size={32} className="text-brand-500 animate-pulse" />
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Auditing financial records...</p>
       </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-20">
      
      {/* Header Segment */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-slate-900 rounded-lg text-white"><TrendingDown size={18} /></div>
              <h1 className="text-xl md:text-2xl font-display font-black text-slate-900 tracking-tight uppercase">Expenditure Ledger</h1>
           </div>
           <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest ml-1 italic">Authorized Disbursement Monitoring</p>
        </div>
        
        <button 
           onClick={() => setIsModalOpen(true)}
           className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 border-b-4 border-slate-900 shadow-none"
        >
           <Plus size={16} className="inline mr-2" /> Disbursement Request
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="bg-white p-6 md:p-8 rounded-2xl border-2 border-slate-900 relative overflow-hidden group">
            <p className="text-slate-500 font-black uppercase tracking-wider text-[9px] mb-2 leading-none">Daily Outflow</p>
            <h3 className="text-2xl md:text-3xl font-display font-black text-slate-900">₹{(stats?.todayTotal || 0).toLocaleString('en-IN')}</h3>
         </div>
         <div className="bg-slate-900 p-6 md:p-8 rounded-2xl relative overflow-hidden group border-2 border-slate-900">
            <p className="text-slate-400 font-black uppercase tracking-wider text-[9px] mb-2 leading-none text-brand-400">Consolidated Expenditure</p>
            <h3 className="text-2xl md:text-3xl font-display font-black text-white">₹{(stats?.overallTotal || 0).toLocaleString('en-IN')}</h3>
         </div>
         <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 flex items-center justify-between">
            <div>
               <p className="text-[9px] font-black uppercase text-amber-600 tracking-tight">Pending Logs</p>
               <span className="text-lg font-black text-slate-900">{expenses?.filter(e => e.status === 'PENDING').length || 0}</span>
            </div>
            <div className="h-full w-px bg-slate-100"></div>
            <div>
               <p className="text-[9px] font-black uppercase text-emerald-600 tracking-tight">Authorized</p>
               <span className="text-lg font-black text-slate-900">{expenses?.filter(e => e.status === 'APPROVED').length || 0}</span>
            </div>
         </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden relative">
         <div className="p-6 border-b border-slate-50 bg-slate-50">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
               <Filter size={16} className="text-brand-600" /> Revenue Outflow Log
            </h3>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full">
                 <thead>
                   <tr className="bg-slate-900 text-white">
                      <th className="px-6 py-4 text-left text-[9px] uppercase tracking-widest font-black">Entity</th>
                      <th className="px-6 py-4 text-left text-[9px] uppercase tracking-widest font-black">Category</th>
                      <th className="px-6 py-4 text-left text-[9px] uppercase tracking-widest font-black">Amount (₹)</th>
                      <th className="px-6 py-4 text-left text-[9px] uppercase tracking-widest font-black">Status</th>
                      <th className="px-6 py-4 text-left text-[9px] uppercase tracking-widest font-black">Audit</th>
                      <th className="px-6 py-4 text-left text-[9px] uppercase tracking-widest font-black">Actions</th>
                   </tr>
                </thead>
               <tbody className="divide-y divide-slate-50">
                  {expenses?.map((expense) => (
                     <tr key={expense._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                           <p className="text-[11px] font-black text-slate-900 uppercase truncate max-w-[150px]">{expense.employeeId?.name}</p>
                           <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">{new Date(expense.date).toLocaleDateString()}</p>
                           <p className="mt-2 text-[9px] text-slate-500 font-bold leading-relaxed line-clamp-1 italic">"{expense.description}"</p>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tight border ${CATEGORY_COLORS[expense.category]}`}>
                              {expense.category}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-sm font-black text-slate-900 tracking-tight">₹{expense.amount.toLocaleString('en-IN')}</p>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded-md text-[8px] tracking-widest border uppercase ${STATUS_STYLES[expense.status]}`}>
                              {expense.status}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              {isAdmin && expense.status === 'PENDING' ? (
                                 <>
                                    <button 
                                       onClick={() => statusMutation.mutate({ id: expense._id, status: 'APPROVED' })}
                                       className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                                    >
                                       <CheckCircle2 size={14} />
                                    </button>
                                    <button 
                                       onClick={() => statusMutation.mutate({ id: expense._id, status: 'REJECTED' })}
                                       className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                                    >
                                       <XCircle size={14} />
                                    </button>
                                 </>
                              ) : (
                                 <div className="text-[7px] font-black uppercase text-slate-300 tracking-widest italic flex items-center gap-1">
                                    <Clock size={10} /> Locked
                                 </div>
                              )}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <button 
                              onClick={() => handleDelete(expense)}
                              className="p-2 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                              title="Purge Entry"
                           >
                              <Trash2 size={14} />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Disbursement Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-white rounded-[2rem] w-full max-w-lg border-2 border-slate-900 p-8 md:p-10 relative z-10 animate-in zoom-in-95 duration-200">
               <div className="flex justify-between items-start mb-8">
                  <div>
                     <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Logging Auth</h2>
                     <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Personnel Disbursement Registry</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"><X size={20} /></button>
               </div>

               <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Category</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-bold text-xs outline-none">
                           {Object.keys(CATEGORY_COLORS).map(cat => <option key={cat}>{cat}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Amount (₹)</label>
                        <input required type="number" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-bold text-xs outline-none" placeholder="0.00" />
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Justification</label>
                     <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-4 rounded-xl font-bold text-xs outline-none resize-none h-24 italic" placeholder="Activity details..." />
                  </div>

                  {user?.role === 'super_admin' && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2">
                       <label className="text-[9px] font-black text-brand-600 uppercase tracking-widest">Assign Disbursement to Branch *</label>
                       <select 
                         required 
                         value={formData.branchId} 
                         onChange={e => setFormData({...formData, branchId: e.target.value})} 
                         className="w-full bg-brand-50 border-2 border-brand-100 focus:border-brand-500 p-3 rounded-xl font-black text-[10px] outline-none uppercase"
                       >
                          <option value="">-- Select Target Branch --</option>
                          {branches?.map(b => (
                            <option key={b._id} value={b._id}>{b.branchName} ({b.branchCode})</option>
                          ))}
                       </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Transaction Date</label>
                        <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-bold text-xs outline-none" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Receipt ID</label>
                        <input value={formData.receiptNote} onChange={e => setFormData({...formData, receiptNote: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-bold text-xs outline-none uppercase" placeholder="Internal Ref..." />
                     </div>
                  </div>

                  <button 
                     disabled={createMutation.isLoading} 
                     type="submit" 
                     className="w-full py-4 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-black active:scale-95 transition-all border-b-6 border-brand-500"
                  >
                     {createMutation.isLoading ? 'SYNCHRONIZING...' : 'COMMIT DISBURSEMENT'}
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default Expenses;
