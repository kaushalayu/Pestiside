import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { FileText, Plus, Search, Calendar, IndianRupee, AlertTriangle, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const fetchAMCs = async () => (await api.get('/amc')).data.data;

const AMC = () => {
  const { user } = useSelector(state => state.auth);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg"><FileText size={20} /></div>
            AMC Contracts
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Annual Maintenance Contracts</p>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-brand-500 active:scale-95 flex items-center justify-center gap-2 border-b-4 border-slate-900">
          <Plus size={16} /> New AMC
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Active</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{amcs?.filter(a => a.status === 'ACTIVE').length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Expiring Soon</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{amcs?.filter(a => a.status === 'ACTIVE' && new Date(a.endDate) <= new Date(Date.now() + 30*24*60*60*1000)).length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={16} className="text-brand-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Value</span>
          </div>
          <p className="text-2xl font-black text-slate-900">₹{amcs?.reduce((sum, a) => sum + (a.totalAmount || 0), 0).toLocaleString() || 0}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH BY NAME, CONTRACT NO OR PHONE..." 
          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand-500 transition-all"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Contract</th>
              <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Customer</th>
              <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Service</th>
              <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Period</th>
              <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Amount</th>
              <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Valid Till</th>
              <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [1,2,3].map(i => <tr key={i}><td colSpan={7} className="px-4 py-6 animate-pulse bg-slate-50"></td></tr>)
            ) : filteredAMCs.length > 0 ? filteredAMCs.map(amc => (
              <tr key={amc._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="text-xs font-black text-slate-900">{amc.contractNo}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-slate-900">{amc.customerName}</p>
                  <p className="text-[9px] text-slate-500">{amc.customerPhone}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{amc.serviceType}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{amc.period} Months</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-900">₹{amc.totalAmount?.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{new Date(amc.endDate).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">{getStatusBadge(amc.status)}</td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">No AMC contracts found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-slate-900 uppercase mb-4">New AMC Contract</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase">Customer Name *</label>
                <input required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase">Phone *</label>
                  <input required value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase">Premises</label>
                  <input value={formData.premisesType} onChange={e => setFormData({...formData, premisesType: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase">Address</label>
                <input value={formData.customerAddress} onChange={e => setFormData({...formData, customerAddress: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase">Service Type *</label>
                  <select required value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs">
                    <option value="">Select</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase">Period (Months)</label>
                  <select value={formData.period} onChange={e => setFormData({...formData, period: parseInt(e.target.value)})} className="w-full border border-slate-200 rounded-lg p-2 text-xs">
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                    <option value={24}>24 Months</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase">Start Date *</label>
                <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase">Total Amount *</label>
                <input required type="number" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase">Services Included</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {pestServices.map(service => (
                    <button key={service} type="button" onClick={() => handleServiceToggle(service)}
                      className={`px-2 py-1 text-[9px] rounded border ${formData.servicesIncluded.includes(service) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>
                      {service}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-xs font-medium">Create Contract</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AMC;
