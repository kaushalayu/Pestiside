import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { FileText, Plus, Search, Calendar, IndianRupee, AlertTriangle, RefreshCw, CheckCircle, XCircle, Clock, Trash2, Eye } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const fetchAMCs = async () => (await api.get('/amc')).data.data;

const AMC = () => {
  const { user } = useSelector(state => state.auth);
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_admin';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedAMC, setSelectedAMC] = useState(null);
  const [renewData, setRenewData] = useState({ period: 12, totalAmount: '', paidAmount: 0 });
  const { data: amcs, isLoading } = useQuery({ queryKey: ['amcs'], queryFn: fetchAMCs });

  const [formData, setFormData] = useState({
    customerName: '', customerPhone: '', customerAddress: '', serviceType: '', premisesType: '',
    startDate: '', period: 12, totalAmount: '', servicesIncluded: []
  });

  const pestServices = ['Cockroaches', 'Ants', 'Spider', 'Mosquito', 'Flies', 'Lizard', 'Rodent', 'Vector', 'Bed Bugs', 'Wood Borer', 'Fumigation'];

  const mutation = useMutation({
    mutationFn: (data) => api.post('/amc', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['amcs']);
      setIsModalOpen(false);
      setFormData({ customerName: '', customerPhone: '', customerAddress: '', serviceType: '', premisesType: '', startDate: '', period: 12, totalAmount: '', servicesIncluded: [] });
      toast.success('AMC Contract Created');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create AMC')
  });

  const renewMutation = useMutation({
    mutationFn: ({ id, data }) => api.post(`/amc/${id}/renew`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['amcs']);
      setIsRenewModalOpen(false);
      setSelectedAMC(null);
      setRenewData({ period: 12, totalAmount: '', paidAmount: 0 });
      toast.success('AMC Contract Renewed Successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to renew AMC')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/amc/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['amcs']);
      toast.success('AMC Contract Deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete AMC')
  });

  const handleRenewClick = (amc) => {
    setSelectedAMC(amc);
    setRenewData({
      period: amc.period || 12,
      totalAmount: amc.totalAmount || '',
      paidAmount: 0
    });
    setIsRenewModalOpen(true);
  };

  const handleRenewSubmit = (e) => {
    e.preventDefault();
    renewMutation.mutate({ id: selectedAMC._id, data: renewData });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded uppercase">Active</span>;
      case 'EXPIRED': return <span className="px-2 py-1 bg-red-100 text-red-700 text-[9px] font-bold rounded uppercase">Expired</span>;
      case 'RENEWED': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[9px] font-bold rounded uppercase">Renewed</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[9px] font-bold rounded uppercase">{status}</span>;
    }
  };

  const filteredAMCs = amcs?.filter(a => 
    a.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    a.contractNo?.toLowerCase().includes(search.toLowerCase()) ||
    a.customerPhone?.includes(search)
  ) || [];

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      servicesIncluded: prev.servicesIncluded.includes(service)
        ? prev.servicesIncluded.filter(s => s !== service)
        : [...prev.servicesIncluded, service]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const endDate = new Date(formData.startDate);
    endDate.setMonth(endDate.getMonth() + parseInt(formData.period));
    mutation.mutate({ ...formData, endDate: endDate.toISOString() });
  };

  const activeCount = amcs?.filter(a => a.status === 'ACTIVE').length || 0;
  const expiringCount = amcs?.filter(a => a.status === 'ACTIVE' && new Date(a.endDate) <= new Date(Date.now() + 30*24*60*60*1000)).length || 0;
  const totalValue = amcs?.reduce((sum, a) => sum + (a.totalAmount || 0), 0) || 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg"><FileText size={20} /></div>
            AMC Contracts
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Annual Maintenance Contract Management</p>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-brand-500 active:scale-95 flex items-center justify-center gap-2 border-b-4 border-slate-900 shadow-lg shadow-brand-500/30">
          <Plus size={16} /> Create AMC
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-white/80" />
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Active Contracts</span>
          </div>
          <p className="text-4xl font-black">{activeCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expiring Soon</span>
          </div>
          <p className="text-4xl font-black text-slate-900">{expiringCount}</p>
          <p className="text-[9px] text-slate-500 mt-1">Within 30 days</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={18} className="text-brand-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Value</span>
          </div>
          <p className="text-3xl font-black text-slate-900">₹{(totalValue / 1000).toFixed(1)}K</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl text-white">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Contracts</span>
          </div>
          <p className="text-4xl font-black">{amcs?.length || 0}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH BY CUSTOMER NAME, CONTRACT NUMBER OR PHONE..." 
          className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Contract No</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Customer</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Type</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Period</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Amount</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Start Date</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">End Date</th>
                <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Status</th>
                {isSuperAdmin && <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [1,2,3].map(i => <tr key={i}><td colSpan={isSuperAdmin ? 8 : 7} className="px-4 py-6 animate-pulse bg-slate-50"></td></tr>)
              ) : filteredAMCs.length > 0 ? filteredAMCs.map(amc => (
                <tr key={amc._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-black text-brand-600">{amc.contractNo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-slate-900">{amc.customerName}</p>
                    <p className="text-[9px] text-slate-500">{amc.customerPhone}</p>
                    <p className="text-[9px] text-slate-400">{amc.customerAddress}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-700">{amc.serviceType}</p>
                    <p className="text-[9px] text-slate-500">{amc.premisesType}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{amc.period} Months</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-900">₹{amc.totalAmount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{new Date(amc.startDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{new Date(amc.endDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">{getStatusBadge(amc.status)}</td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {amc.status === 'ACTIVE' && (
                        <button onClick={() => handleRenewClick(amc)} className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors" title="Renew Contract">
                          <RefreshCw size={14} />
                        </button>
                      )}
                      {isSuperAdmin && (
                        <button onClick={() => { if(window.confirm('Delete this AMC contract?')) deleteMutation.mutate(amc._id); }} className="p-1.5 bg-slate-50 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
                </tr>
              )) : (
                <tr><td colSpan={isSuperAdmin ? 8 : 7} className="px-4 py-12 text-center text-slate-400 text-sm">No AMC contracts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-slate-900 px-8 py-5 flex items-center justify-between">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">AMC Contract Registration</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-2xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Customer Name *</label>
                  <input required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all" placeholder="Enter customer name" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Phone Number *</label>
                  <input required value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all" placeholder="+91 9876543210" />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Address</label>
                <textarea value={formData.customerAddress} onChange={e => setFormData({...formData, customerAddress: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all resize-none" rows={2} placeholder="Full address" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Service Type *</label>
                  <select required value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all">
                    <option value="">Select Type</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Premises Type</label>
                  <input value={formData.premisesType} onChange={e => setFormData({...formData, premisesType: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all" placeholder="Flat/Bunglow/Office" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Contract Period</label>
                  <select value={formData.period} onChange={e => setFormData({...formData, period: parseInt(e.target.value)})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all">
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months (Annual)</option>
                    <option value={24}>24 Months</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Start Date *</label>
                  <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Total Amount (₹) *</label>
                  <input required type="number" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all" placeholder="0.00" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-3">Services Included (Select Multiple)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {pestServices.map(service => (
                    <button key={service} type="button" onClick={() => handleServiceToggle(service)}
                      className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2 ${
                        formData.servicesIncluded.includes(service) 
                          ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/30' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}>
                      {formData.servicesIncluded.includes(service) && <CheckCircle size={12} className="inline mr-1" />}
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase text-xs tracking-widest rounded-xl transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-brand-600 hover:bg-brand-500 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg shadow-brand-500/30 border-b-4 border-slate-900">Create Contract</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {isRenewModalOpen && selectedAMC && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-emerald-600 px-8 py-5 flex items-center justify-between">
              <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <RefreshCw size={20} /> Renew Contract
              </h2>
              <button onClick={() => { setIsRenewModalOpen(false); setSelectedAMC(null); }} className="text-white/80 hover:text-white text-2xl">×</button>
            </div>
            <form onSubmit={handleRenewSubmit} className="p-8 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Renewing Contract</p>
                <p className="text-sm font-black text-slate-900">{selectedAMC.contractNo}</p>
                <p className="text-xs text-slate-500">{selectedAMC.customerName} - {selectedAMC.customerPhone}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">New Period</label>
                  <select value={renewData.period} onChange={e => setRenewData({...renewData, period: parseInt(e.target.value)})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all">
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months (Annual)</option>
                    <option value={24}>24 Months</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Total Amount (₹)</label>
                  <input required type="number" value={renewData.totalAmount} onChange={e => setRenewData({...renewData, totalAmount: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all" placeholder="0.00" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Advance Payment (₹)</label>
                <input type="number" value={renewData.paidAmount} onChange={e => setRenewData({...renewData, paidAmount: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all" placeholder="0" />
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> New contract will start from <strong>{selectedAMC.endDate ? new Date(new Date(selectedAMC.endDate).getTime() + 24*60*60*1000).toLocaleDateString('en-IN') : 'today'}</strong>
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => { setIsRenewModalOpen(false); setSelectedAMC(null); }} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase text-xs tracking-widest rounded-xl transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/30 border-b-4 border-slate-900">Renew Contract</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AMC;
