import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { FileText, Plus, Search, Calendar, IndianRupee, Edit2, Trash2, Eye, X, Save, Check } from 'lucide-react';
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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAMC, setSelectedAMC] = useState(null);
  const [viewAMC, setViewAMC] = useState(null);
  
  const [formData, setFormData] = useState({
    customerName: '', customerPhone: '', customerAddress: '', serviceType: 'Residential', premisesType: '',
    startDate: '', period: 12, servicesPerMonth: 1, totalServices: 12, interval: 30, totalAmount: '', paidAmount: 0, servicesIncluded: []
  });
  
  const [editData, setEditData] = useState({
    customerName: '', customerPhone: '', customerAddress: '', serviceType: '',
    premisesType: '', startDate: '', endDate: '', period: 12, servicesPerMonth: 1, totalServices: 12, interval: 30, totalAmount: '', paidAmount: 0, servicesIncluded: []
  });

  const pestServices = ['Cockroaches', 'Ants', 'Spider', 'Mosquito', 'Flies', 'Lizard', 'Rodent', 'Vector', 'Bed Bugs', 'Wood Borer', 'Fumigation', 'Others'];

  const calculateAMCFields = (period, servicesPerMonth) => {
    const totalServices = period * servicesPerMonth;
    const interval = servicesPerMonth > 0 ? Math.round(30 / servicesPerMonth) : 30;
    return { totalServices, interval };
  };

  const handleFormChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    if (field === 'period' || field === 'servicesPerMonth') {
      const period = field === 'period' ? parseInt(value) || 0 : newData.period;
      const servicesPerMonth = field === 'servicesPerMonth' ? parseInt(value) || 0 : newData.servicesPerMonth;
      const { totalServices, interval } = calculateAMCFields(period, servicesPerMonth);
      newData.totalServices = totalServices;
      newData.interval = interval;
    }
    setFormData(newData);
  };

  const handleEditFormChange = (field, value) => {
    const newData = { ...editData, [field]: value };
    if (field === 'period' || field === 'servicesPerMonth') {
      const period = field === 'period' ? parseInt(value) || 0 : newData.period;
      const servicesPerMonth = field === 'servicesPerMonth' ? parseInt(value) || 0 : newData.servicesPerMonth;
      const { totalServices, interval } = calculateAMCFields(period, servicesPerMonth);
      newData.totalServices = totalServices;
      newData.interval = interval;
    }
    setEditData(newData);
  };

  const { data: amcs, isLoading } = useQuery({ 
    queryKey: ['amcs', search], 
    queryFn: async () => {
      const res = await api.get(`/amc${search ? `?search=${search}` : ''}`);
      return res.data.data;
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/amc', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['amcs']);
      setIsModalOpen(false);
      setFormData({ customerName: '', customerPhone: '', customerAddress: '', serviceType: 'Residential', premisesType: '', startDate: '', period: 12, servicesPerMonth: 1, totalServices: 12, interval: 30, totalAmount: '', paidAmount: 0, servicesIncluded: [] });
      toast.success('AMC Contract Created');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create AMC')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/amc/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['amcs']);
      setIsEditModalOpen(false);
      setSelectedAMC(null);
      toast.success('AMC Contract Updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update AMC')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/amc/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['amcs']);
      toast.success('AMC Contract Deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete AMC')
  });

  const handleEditClick = (amc) => {
    setSelectedAMC(amc);
    setEditData({
      customerName: amc.customerName || '',
      customerPhone: amc.customerPhone || '',
      customerAddress: amc.customerAddress || '',
      serviceType: amc.serviceType || '',
      premisesType: amc.premisesType || '',
      startDate: amc.startDate ? new Date(amc.startDate).toISOString().split('T')[0] : '',
      endDate: amc.endDate ? new Date(amc.endDate).toISOString().split('T')[0] : '',
      period: amc.period || 12,
      servicesPerMonth: amc.servicesPerMonth || 1,
      totalServices: amc.totalServices || 12,
      interval: amc.interval || 30,
      totalAmount: amc.totalAmount || '',
      paidAmount: amc.paidAmount || 0,
      servicesIncluded: amc.servicesIncluded || []
    });
    setIsEditModalOpen(true);
  };

  const handleViewClick = (amc) => {
    setViewAMC(amc);
    setIsViewModalOpen(true);
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: selectedAMC._id, data: editData });
  };

  const toggleService = (service) => {
    setEditData(prev => ({
      ...prev,
      servicesIncluded: prev.servicesIncluded.includes(service)
        ? prev.servicesIncluded.filter(s => s !== service)
        : [...prev.servicesIncluded, service]
    }));
  };

  // Helper function to calculate contract progress
  const calculateProgress = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const totalDays = (end - start) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now - start) / (1000 * 60 * 60 * 24);
    
    return Math.round((elapsedDays / totalDays) * 100);
  };

  // Helper function to calculate remaining days
  const calculateRemaining = (endDate) => {
    if (!endDate) return '';
    const end = new Date(endDate);
    const now = new Date();
    const remaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    if (remaining < 0) return 'Expired';
    if (remaining === 0) return 'Expires today';
    if (remaining === 1) return '1 day left';
    if (remaining <= 30) return `${remaining} days left`;
    if (remaining <= 365) return `${Math.ceil(remaining / 30)} months left`;
    return `${Math.ceil(remaining / 365)} years left`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded uppercase">Active</span>;
      case 'EXPIRED': return <span className="px-2 py-1 bg-red-100 text-red-700 text-[9px] font-bold rounded uppercase">Expired</span>;
      case 'RENEWED': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[9px] font-bold rounded uppercase">Renewed</span>;
      case 'CANCELLED': return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[9px] font-bold rounded uppercase">Cancelled</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-[9px] font-bold rounded uppercase">{status}</span>;
    }
  };

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg"><FileText size={20} /></div>
            AMC Contracts
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Annual Maintenance Contracts</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contracts..." 
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs w-48"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-700"
          >
            <Plus size={14} /> New AMC
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : !amcs || amcs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText size={48} className="mx-auto mb-3 opacity-50" />
          <p>No AMC contracts found</p>
          <p className="text-xs mt-1">Create one from the booking form</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left p-3 font-bold text-slate-600">Contract No</th>
                  <th className="text-left p-3 font-bold text-slate-600">Customer</th>
                  <th className="text-left p-3 font-bold text-slate-600">Phone</th>
                  <th className="text-left p-3 font-bold text-slate-600">Services</th>
                  <th className="text-left p-3 font-bold text-slate-600">Period</th>
                  <th className="text-right p-3 font-bold text-slate-600">Amount</th>
                  <th className="text-center p-3 font-bold text-slate-600">Status</th>
                  <th className="text-center p-3 font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {amcs.map((amc) => (
                  <tr key={amc._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900">{amc.contractNo || 'N/A'}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900">{amc.customerName}</div>
                      <div className="text-[10px] text-slate-400">{amc.customerAddress}</div>
                    </td>
                    <td className="p-3 text-slate-600">{amc.customerPhone}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {amc.servicesIncluded?.slice(0, 3).map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px]">{s}</span>
                        ))}
                        {amc.servicesIncluded?.length > 3 && (
                          <span className="text-[9px] text-slate-400">+{amc.servicesIncluded.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">{amc.period}mo | {amc.servicesPerMonth}/mo | {amc.interval}d</td>
                    <td className="p-3 text-right font-bold text-slate-900">₹{(amc.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center">{getStatusBadge(amc.status)}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleViewClick(amc)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="View">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleEditClick(amc)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        {isSuperAdmin && (
                          <button onClick={() => { if(confirm('Delete this AMC?')) deleteMutation.mutate(amc._id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-emerald-600 px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h3 className="text-white font-bold">Create AMC Contract</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Customer Name</label>
                  <input value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} required className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Phone</label>
                  <input value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} required className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Service Type</label>
                  <select value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs">
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Address</label>
                  <input value={formData.customerAddress} onChange={e => setFormData({...formData, customerAddress: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Total Months</label>
                  <input type="number" value={formData.period} onChange={e => handleFormChange('period', parseInt(e.target.value) || 1)} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Services Per Month</label>
                  <input type="number" value={formData.servicesPerMonth} onChange={e => handleFormChange('servicesPerMonth', parseInt(e.target.value) || 1)} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Interval (Days)</label>
                  <input type="number" value={formData.interval} disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Total Services</label>
                  <input type="number" value={formData.totalServices} disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Total Amount</label>
                  <input type="number" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Paid Amount</label>
                  <input type="number" value={formData.paidAmount} onChange={e => setFormData({...formData, paidAmount: parseInt(e.target.value) || 0})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">Cancel</button>
                <button type="submit" disabled={mutation.isPending} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">
                  {mutation.isPending ? 'Creating...' : 'Create AMC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal - Enhanced with all details */}
      {isViewModalOpen && viewAMC && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs uppercase font-bold">AMC Contract</p>
                  <h3 className="text-white font-bold text-lg">{viewAMC.contractNo || 'N/A'}</h3>
                </div>
                {getStatusBadge(viewAMC.status)}
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Customer Info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Customer Information</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">Name</p>
                    <p className="font-bold text-slate-900">{viewAMC.customerName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Phone</p>
                    <p className="font-bold text-slate-900">{viewAMC.customerPhone}</p>
                  </div>
                  {viewAMC.customerAddress && (
                    <div className="col-span-2">
                      <p className="text-slate-400 text-xs">Address</p>
                      <p className="font-medium text-slate-700">{viewAMC.customerAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contract Period - Timeline Style */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-600 uppercase mb-3">Contract Period</p>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-slate-400 text-xs">Start Date</p>
                    <p className="font-bold text-slate-900 text-sm">
                      {viewAMC.startDate ? new Date(viewAMC.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-2 bg-blue-200 rounded-full relative">
                      {/* Progress indicator */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.max(0, Math.min(100, calculateProgress(viewAMC.startDate, viewAMC.endDate)))}%` }}
                      />
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-1">{calculateRemaining(viewAMC.endDate)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-xs">End Date</p>
                    <p className="font-bold text-slate-900 text-sm">
                      {viewAMC.endDate ? new Date(viewAMC.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-center gap-6 mt-3">
                  <span className="text-xs"><span className="font-bold">{viewAMC.period}</span> months | <span className="font-bold">{viewAMC.servicesPerMonth}</span> services/month | <span className="font-bold">{viewAMC.interval}</span> days interval</span>
                  <span className="text-xs"><span className="font-bold">{viewAMC.totalServices}</span> total services | <span className="font-bold">{viewAMC.serviceType}</span></span>
                </div>
              </div>

              {/* Services Included */}
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-xs font-bold text-emerald-600 uppercase mb-3">Services Included</p>
                <div className="flex flex-wrap gap-2">
                  {viewAMC.servicesIncluded?.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-1">
                      <Check size={14} /> {s}
                    </span>
                  )) || <span className="text-slate-400">No services listed</span>}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-600 uppercase mb-3">Payment Summary</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Total</p>
                    <p className="font-bold text-xl text-slate-900">₹{(viewAMC.totalAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Paid</p>
                    <p className="font-bold text-xl text-emerald-600">₹{(viewAMC.paidAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-slate-400 text-xs">Balance</p>
                    <p className="font-bold text-xl text-red-600">₹{((viewAMC.balanceAmount) || (viewAMC.totalAmount - viewAMC.paidAmount)).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              {/* Branch & Employee */}
              {(viewAMC.branchId || viewAMC.employeeId) && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-3">Assignment</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {viewAMC.branchId && (
                      <div>
                        <p className="text-slate-400 text-xs">Branch</p>
                        <p className="font-medium text-slate-900">{viewAMC.branchId.branchName || 'N/A'}</p>
                      </div>
                    )}
                    {viewAMC.employeeId && (
                      <div>
                        <p className="text-slate-400 text-xs">Assigned To</p>
                        <p className="font-medium text-slate-900">{viewAMC.employeeId.name || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {viewAMC.notes && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Notes</p>
                  <p className="text-sm text-slate-700">{viewAMC.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsViewModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200">
                  Close
                </button>
                {viewAMC.status === 'ACTIVE' && (
                  <button 
                    onClick={() => { setIsViewModalOpen(false); setIsEditModalOpen(true); setSelectedAMC(viewAMC); setEditData({
                      customerName: viewAMC.customerName,
                      customerPhone: viewAMC.customerPhone,
                      customerAddress: viewAMC.customerAddress,
                      serviceType: viewAMC.serviceType,
                      premisesType: viewAMC.premisesType,
                      startDate: viewAMC.startDate?.split('T')[0],
                      endDate: viewAMC.endDate?.split('T')[0],
                      period: viewAMC.period || 12,
                      servicesPerMonth: viewAMC.servicesPerMonth || 1,
                      totalServices: viewAMC.totalServices || 12,
                      interval: viewAMC.interval || 30,
                      totalAmount: viewAMC.totalAmount,
                      paidAmount: viewAMC.paidAmount,
                      servicesIncluded: viewAMC.servicesIncluded || []
                    }); }}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700"
                  >
                    Edit Contract
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedAMC && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-emerald-600 px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h3 className="text-white font-bold">Edit AMC Contract</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/60 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Customer Name</label>
                  <input value={editData.customerName} onChange={e => setEditData({...editData, customerName: e.target.value})} required className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Phone</label>
                  <input value={editData.customerPhone} onChange={e => setEditData({...editData, customerPhone: e.target.value})} required className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Service Type</label>
                  <select value={editData.serviceType} onChange={e => setEditData({...editData, serviceType: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs">
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Address</label>
                  <input value={editData.customerAddress} onChange={e => setEditData({...editData, customerAddress: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Start Date</label>
                  <input type="date" value={editData.startDate} onChange={e => setEditData({...editData, startDate: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">End Date</label>
                  <input type="date" value={editData.endDate} onChange={e => setEditData({...editData, endDate: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Total Months</label>
                  <input type="number" value={editData.period} onChange={e => handleEditFormChange('period', parseInt(e.target.value) || 1)} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Services Per Month</label>
                  <input type="number" value={editData.servicesPerMonth} onChange={e => handleEditFormChange('servicesPerMonth', parseInt(e.target.value) || 1)} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Interval (Days)</label>
                  <input type="number" value={editData.interval} disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Total Services</label>
                  <input type="number" value={editData.totalServices} disabled className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-slate-50" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Paid Amount</label>
                  <input type="number" value={editData.paidAmount} onChange={e => setEditData({...editData, paidAmount: parseInt(e.target.value) || 0})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-2">Services</label>
                <div className="grid grid-cols-3 gap-2">
                  {pestServices.map(s => (
                    <label key={s} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editData.servicesIncluded.includes(s)}
                        onChange={() => toggleService(s)}
                        className="rounded"
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50">
                  {updateMutation.isPending ? 'Updating...' : 'Update AMC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AMC;
