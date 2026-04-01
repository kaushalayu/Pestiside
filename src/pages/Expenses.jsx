import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { 
  Wallet, Plus, TrendingDown, IndianRupee, Users, CheckCircle2, XCircle, 
  Clock, Trash2, X, Filter, Calendar, Receipt, ChevronRight, Edit3, 
  Upload, Camera, Bell, AlertTriangle, Check, Image
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  Travel: 'bg-indigo-100 text-indigo-700',
  Food: 'bg-orange-100 text-orange-700',
  Materials: 'bg-emerald-100 text-emerald-700',
  Equipment: 'bg-purple-100 text-purple-700',
  Communication: 'bg-cyan-100 text-cyan-700',
  Miscellaneous: 'bg-slate-200 text-slate-700',
};

const STATUS_STYLES = {
  PENDING_BRANCH: 'bg-orange-100 text-orange-800 border-orange-200',
  PENDING_HQ: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_LABELS = {
  PENDING_BRANCH: 'Pending Branch',
  PENDING_HQ: 'Pending HQ',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${styles[variant]}`}>
      {children}
    </span>
  );
};

const SectionCard = ({ title, icon: Icon, children, className = '', headerBg = 'bg-gradient-to-r from-slate-800 to-slate-700' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
    <div className={`${headerBg} px-5 py-3 flex items-center gap-3`}>
      {Icon && <Icon size={18} className="text-white/90" />}
      <h3 className="text-white font-bold text-sm uppercase tracking-wide">{title}</h3>
    </div>
    <div className="p-5">
      {children}
    </div>
  </div>
);

const Expenses = () => {
  const { user } = useSelector(state => state.auth);
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_admin';
  const fileInputRef = useRef(null);
  const [uploadingBill, setUploadingBill] = useState(false);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const { data: expensesData, isLoading } = useQuery({ 
    queryKey: ['expenses', filterStatus, filterCategory], 
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      const res = await api.get(`/expenses?${params.toString()}`);
      return res.data;
    }
  });

  const { data: stats } = useQuery({ 
    queryKey: ['expenseStats'], 
    queryFn: async () => {
      const res = await api.get('/expenses/stats');
      return res.data?.data || { todayTotal: 0, overallTotal: 0, pendingCount: 0 };
    },
    enabled: isAdmin
  });

  const { data: branches } = useQuery({ 
    queryKey: ['branches'], 
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data?.data || [];
    },
    enabled: user?.role === 'super_admin'
  });

  const getDefaultBranchId = () => {
    if (user?.role !== 'super_admin' && user?.branchId) {
      return typeof user.branchId === 'object' ? user.branchId._id : user.branchId;
    }
    return '';
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewExpense, setViewExpense] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [formData, setFormData] = useState({
    category: 'Travel',
    amount: '',
    description: '',
    billDate: new Date().toISOString().split('T')[0],
    billPhoto: null,
    notes: '',
    branchId: getDefaultBranchId(),
  });

  const expenses = expensesData?.data || [];
  const pendingCount = expenses.filter(e => e.status === 'PENDING_HQ').length;
  const branchPendingCount = expenses.filter(e => e.status === 'PENDING_BRANCH').length;

  const resetForm = () => setFormData({
    category: 'Travel',
    amount: '',
    description: '',
    billDate: new Date().toISOString().split('T')[0],
    billPhoto: null,
    notes: '',
    branchId: getDefaultBranchId(),
  });

  const handleBillUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingBill(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxSize = 1200;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        
        try {
          const res = await api.post('/upload', { file: compressed });
          setFormData(prev => ({ ...prev, billPhoto: res.data.data }));
          toast.success('Bill photo uploaded');
        } catch (_err) {
          toast.error('Upload failed');
        } finally {
          setUploadingBill(false);
        }
      };
      img.onerror = () => {
        toast.error('Failed to process image');
        setUploadingBill(false);
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setUploadingBill(false);
    };
    reader.readAsDataURL(file);
  };

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/expenses/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expenseStats']);
      setIsModalOpen(false);
      resetForm();
      toast.success(user?.role === 'super_admin' ? 'Expense submitted successfully' : 'Expense submitted for branch admin approval');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit expense'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, rejectionReason }) => 
      api.patch(`/expenses/${id}/status`, { status, rejectionReason }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expenseStats']);
      setRejectModal(null);
      setRejectionReason('');
      if (res.data?.data?.status === 'PENDING_HQ') {
        toast.success('Expense approved by branch. Sent to HQ for final approval.');
      } else {
        toast.success('Expense status updated');
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expenseStats']);
      toast.success('Expense deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const handleApprove = (expense, customStatus = 'APPROVED') => {
    let confirmMsg = `Approve expense of ₹${expense.amount} for ${expense.employeeId?.name}?`;
    if (customStatus === 'BRANCH_APPROVED') {
      confirmMsg = `Branch Approve this expense of ₹${expense.amount} for ${expense.employeeId?.name}? It will then go to HQ for final approval.`;
    }
    if (window.confirm(confirmMsg)) {
      statusMutation.mutate({ id: expense._id, status: customStatus });
    }
  };

  const handleReject = (expense) => {
    setRejectModal(expense);
    setRejectionReason('');
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    statusMutation.mutate({ 
      id: rejectModal._id, 
      status: 'REJECTED',
      rejectionReason 
    });
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num || 0);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Wallet size={32} className="text-brand-500 animate-pulse" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 rounded-xl text-white shadow-lg">
                <Wallet size={22} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900">Expense Management</h1>
                <p className="text-xs text-slate-500 font-medium">
                  {user?.role === 'super_admin' ? 'Submit, track & approve expenses' : 'Submit expenses for HQ approval'}
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all font-bold text-sm flex items-center gap-2 shadow-lg shadow-brand-500/30"
          >
            <Plus size={18} /> Submit Expense
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase mb-1 md:mb-2">Today</p>
            <p className="text-xl md:text-2xl font-black text-slate-900 truncate">{formatCurrency(stats?.todayTotal || 0)}</p>
            <p className="text-[9px] md:text-xs text-slate-400 mt-1">{stats?.todayCount || 0} entries</p>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 md:p-5 rounded-2xl text-white shadow-lg">
            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase mb-1 md:mb-2">Total</p>
            <p className="text-xl md:text-2xl font-black truncate">{formatCurrency(stats?.overallTotal || 0)}</p>
            <p className="text-[9px] md:text-xs text-slate-400 mt-1">{stats?.overallCount || 0} entries</p>
          </div>
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] md:text-xs font-semibold text-amber-600 uppercase mb-1 md:mb-2">
              {isSuperAdmin ? 'Pend. HQ' : 'Pend. Branch'}
            </p>
            <p className="text-xl md:text-2xl font-black text-amber-600">{isSuperAdmin ? pendingCount : branchPendingCount}</p>
            <p className="text-[9px] md:text-xs text-slate-400 mt-1">Need review</p>
          </div>
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] md:text-xs font-semibold text-emerald-600 uppercase mb-1 md:mb-2">Approved</p>
            <p className="text-xl md:text-2xl font-black text-emerald-600">
              {expenses.filter(e => e.status === 'APPROVED').length}
            </p>
            <p className="text-[9px] md:text-xs text-slate-400 mt-1">This month</p>
          </div>
        </div>

        {isSuperAdmin && pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Bell size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-800">Pending HQ Approval</p>
              <p className="text-sm text-amber-600">{pendingCount} expense(s) approved by branch, waiting for your final approval</p>
            </div>
          </div>
        )}
        
        {user?.role === 'branch_admin' && (
          <div className="space-y-3 mb-6">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Bell size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="font-bold text-orange-800">Branch Approval Required</p>
                <p className="text-sm text-orange-600">{expenses.filter(e => e.status === 'PENDING_BRANCH').length} expense(s) waiting for your approval</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Clock size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-blue-800">Awaiting HQ Approval</p>
                <p className="text-sm text-blue-600">{expenses.filter(e => e.status === 'PENDING_HQ').length} expense(s) approved by you, waiting for Super Admin</p>
              </div>
            </div>
          </div>
        )}

        <SectionCard title="Expense List" icon={Filter}>
          <div className="flex flex-wrap gap-2 md:gap-3 mb-5">
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-2 sm:px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex-1 min-w-[120px]"
            >
              <option value="all">All Status</option>
              <option value="PENDING_BRANCH">Pending Branch</option>
              <option value="PENDING_HQ">Pending HQ</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select 
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-2 sm:px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex-1 min-w-[120px]"
            >
              <option value="all">All Categories</option>
              <option value="Travel">Travel</option>
              <option value="Food">Food</option>
              <option value="Materials">Materials</option>
              <option value="Equipment">Equipment</option>
              <option value="Communication">Communication</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense._id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${CATEGORY_COLORS[expense.category]}`}>
                        {expense.category}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${STATUS_STYLES[expense.status]}`}>
                        {STATUS_LABELS[expense.status] || expense.status}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800">{expense.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>{expense.employeeId?.name}</span>
                      <span>•</span>
                      <span>{new Date(expense.billDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    {expense.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-xs text-red-700">
                          <span className="font-bold">Rejection Reason:</span> {expense.rejectionReason}
                        </p>
                      </div>
                    )}
                    {expense.billPhoto && (
                      <div className="mt-2">
                        <img 
                          src={`${api.defaults.baseURL.replace('/api', '')}${expense.billPhoto}`}
                          alt="Bill"
                          className="w-24 h-24 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80"
                          onClick={() => setViewExpense(expense)}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">{formatCurrency(expense.amount)}</p>
                    
                    {/* Branch Admin: Can approve PENDING_BRANCH */}
                    {(user?.role === 'branch_admin' || user?.role === 'office') && expense.status === 'PENDING_BRANCH' && (
                      <div className="flex items-center gap-2 mt-3">
                        <button 
                          onClick={() => handleApprove(expense, 'BRANCH_APPROVED')}
                          className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                          title="Branch Approve"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleReject(expense)}
                          className="p-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                    
                    {/* Super Admin: Can approve PENDING_HQ */}
                    {isSuperAdmin && expense.status === 'PENDING_HQ' && (
                      <div className="flex items-center gap-2 mt-3">
                        <button 
                          onClick={() => handleApprove(expense, 'APPROVED')}
                          className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                          title="HQ Approve"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleReject(expense)}
                          className="p-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                    
                    {/* User: Show pending status */}
                    {!isSuperAdmin && !((user?.role === 'branch_admin' || user?.role === 'office') && expense.status === 'PENDING_BRANCH') && expense.status !== 'APPROVED' && expense.status !== 'REJECTED' && (
                      <Badge variant="warning">{STATUS_LABELS[expense.status]}</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Receipt size={48} className="mx-auto mb-3 opacity-30" />
                <p>No expenses found</p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Plus size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">
                    {user?.role === 'super_admin' ? 'Submit Expense' : 'Submit Expense'}
                  </h3>
                  <p className="text-slate-400 text-xs">
                    {user?.role === 'super_admin' ? 'Fill in expense details' : 'You → Branch Admin → Super Admin (2-level approval)'}
                  </p>
                </div>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white">
                <X size={22} />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Category *</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    className="w-full bg-white border border-slate-200 focus:border-brand-500 px-4 py-3 rounded-xl text-sm font-medium outline-none"
                  >
                    {Object.keys(CATEGORY_COLORS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Amount (₹) *</label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: e.target.value})} 
                    className="w-full bg-white border border-slate-200 focus:border-brand-500 px-4 py-3 rounded-xl text-sm font-bold outline-none" 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Purpose / Description *</label>
                <textarea 
                  required 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full bg-white border border-slate-200 focus:border-brand-500 px-4 py-3 rounded-xl text-sm font-medium outline-none resize-none" 
                  rows="3" 
                  placeholder="Describe the expense purpose..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Bill Date</label>
                  <input 
                    type="date" 
                    value={formData.billDate} 
                    onChange={e => setFormData({...formData, billDate: e.target.value})} 
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none" 
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Bill Photo</label>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleBillUpload}
                    className="hidden"
                  />
                  {formData.billPhoto ? (
                    <div className="relative">
                      <img 
                        src={`${api.defaults.baseURL.replace('/api', '')}${formData.billPhoto}`}
                        alt="Bill"
                        className="w-full h-14 object-cover rounded-xl border border-slate-200"
                      />
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, billPhoto: null }))}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingBill}
                      className="w-full h-14 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 hover:border-brand-400 hover:bg-brand-50/50 transition-all"
                    >
                      {uploadingBill ? (
                        <span className="text-xs text-slate-500">Uploading...</span>
                      ) : (
                        <>
                          <Camera size={18} className="text-slate-400" />
                          <span className="text-xs text-slate-500">Upload Bill</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {user?.role === 'super_admin' && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Assign to Branch *</label>
                  <select 
                    required 
                    value={formData.branchId} 
                    onChange={e => setFormData({...formData, branchId: e.target.value})} 
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none"
                  >
                    <option value="">-- Select Branch --</option>
                    {branches?.map(b => (
                      <option key={b._id} value={b._id}>{b.branchName} ({b.branchCode})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Notes</label>
                <input 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none" 
                  placeholder="Additional notes..." 
                />
              </div>

              <button 
                type="submit" 
                disabled={createMutation.isPending}
                className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-brand-500/30 transition-all disabled:opacity-60"
              >
                {createMutation.isPending ? 'Submitting...' : user?.role === 'super_admin' ? 'Submit Expense' : 'Submit for Branch Approval'}
              </button>
            </form>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 rounded-t-3xl flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <AlertTriangle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Reject Expense</h3>
                <p className="text-red-100 text-xs">{formatCurrency(rejectModal.amount)} - {rejectModal.employeeId?.name}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Rejection Reason *</label>
                <textarea 
                  value={rejectionReason} 
                  onChange={e => setRejectionReason(e.target.value)} 
                  className="w-full bg-white border border-slate-200 focus:border-red-500 px-4 py-3 rounded-xl text-sm font-medium outline-none resize-none" 
                  rows="3" 
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => { setRejectModal(null); setRejectionReason(''); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmReject}
                  disabled={statusMutation.isPending}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-500 transition-all disabled:opacity-60"
                >
                  {statusMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewExpense && viewExpense.billPhoto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewExpense(null)}>
          <div className="max-w-4xl w-full">
            <button 
              onClick={() => setViewExpense(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
            >
              <X size={24} />
            </button>
            <img 
              src={`${api.defaults.baseURL.replace('/api', '')}${viewExpense.billPhoto}`}
              alt="Bill"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
