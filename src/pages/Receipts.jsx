import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, Plus, Download, CheckCircle2, Mail, Eye, X, Send, FileCheck, ChevronDown, Building2, User, Check, Ban } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../lib/api';
import toast from 'react-hot-toast';

const fetchReceipts = async () => (await api.get('/receipts')).data.data;
const fetchBranches = async () => (await api.get('/branches')).data.data;
const fetchAllBookings = async () => {
  // Fetch all bookings regardless of status for receipt generation
  const response = await api.get('/forms?status=DRAFT,SUBMITTED,SCHEDULED,COMPLETED');
  return response.data.data || [];
};
const fetchAMCsByPhone = async (phone) => (await api.get(`/amc/phone/${phone}`)).data.data;
const fetchPendingApprovals = async () => (await api.get('/receipts/pending')).data.data;

const Receipts = () => {
  const { user } = useSelector(state => state.auth);
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'super_admin';
  const isBranchAdmin = user?.role === 'branch_admin';
  const canApprove = isSuperAdmin || isBranchAdmin;

  const { data: receipts, isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: fetchReceipts,
    staleTime: 5000,
    refetchInterval: 10000,
  });
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: fetchBranches,
    enabled: user?.role === 'super_admin' || user?.role === 'branch_admin',
    staleTime: 300000,
  });
  const { data: forms } = useQuery({
    queryKey: ['forms-for-receipt'],
    queryFn: fetchAllBookings,
    staleTime: 5000,
    refetchInterval: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  const { data: pendingApprovals, isLoading: loadingPending, refetch: refetchPending } = useQuery({
    queryKey: ['receipts-pending'],
    queryFn: fetchPendingApprovals,
    enabled: canApprove,
    staleTime: 5000,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  // Approve/Reject mutations
  const branchApproveMutation = useMutation({
    mutationFn: (id) => api.patch(`/receipts/${id}/branch-approve`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['receipts'] });
      const previousReceipts = queryClient.getQueryData(['receipts']);

      // Optimistic update
      queryClient.setQueryData(['receipts'], (old) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map(r => r._id === id ? { ...r, branchApproved: true, approvalStatus: 'PENDING_HQ' } : r);
        }
        if (old.data) {
          return {
            ...old,
            data: old.data.map(r => r._id === id ? { ...r, branchApproved: true, approvalStatus: 'PENDING_HQ' } : r)
          };
        }
        return old;
      });

      return { previousReceipts };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['receipts'], context?.previousReceipts);
      toast.error(err.response?.data?.message || 'Failed to approve');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipts-pending'] });
      queryClient.invalidateQueries({ queryKey: ['forms-pending-payment'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections-stats'] });
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Receipt branch approved!');
    },
  });

  const branchRejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.patch(`/receipts/${id}/branch-reject`, { reason }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['receipts'] });
      const previousReceipts = queryClient.getQueryData(['receipts']);

      // Optimistic update
      queryClient.setQueryData(['receipts'], (old) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map(r => r._id === id ? { ...r, branchApproved: false, approvalStatus: 'REJECTED' } : r);
        }
        if (old.data) {
          return {
            ...old,
            data: old.data.map(r => r._id === id ? { ...r, branchApproved: false, approvalStatus: 'REJECTED' } : r)
          };
        }
        return old;
      });

      return { previousReceipts };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['receipts'], context?.previousReceipts);
      toast.error(err.response?.data?.message || 'Failed to reject');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipts-pending'] });
      queryClient.invalidateQueries({ queryKey: ['forms-pending-payment'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections-stats'] });
      toast.success('Receipt rejected');
    },
  });

  const finalApproveMutation = useMutation({
    mutationFn: (id) => api.patch(`/receipts/${id}/approve`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['receipts'] });
      const previousReceipts = queryClient.getQueryData(['receipts']);

      // Optimistic update
      queryClient.setQueryData(['receipts'], (old) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map(r => r._id === id ? { ...r, superAdminApproved: true, approvalStatus: 'APPROVED' } : r);
        }
        if (old.data) {
          return {
            ...old,
            data: old.data.map(r => r._id === id ? { ...r, superAdminApproved: true, approvalStatus: 'APPROVED' } : r)
          };
        }
        return old;
      });

      return { previousReceipts };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['receipts'], context?.previousReceipts);
      toast.error(err.response?.data?.message || 'Failed to approve');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipts-pending'] });
      queryClient.invalidateQueries({ queryKey: ['forms-pending-payment'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections-stats'] });
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Receipt fully approved! Payment processed.');
    }
  });

  const finalRejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.patch(`/receipts/${id}/reject`, { reason }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['receipts'] });
      const previousReceipts = queryClient.getQueryData(['receipts']);

      // Optimistic update
      queryClient.setQueryData(['receipts'], (old) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map(r => r._id === id ? { ...r, approvalStatus: 'REJECTED' } : r);
        }
        if (old.data) {
          return {
            ...old,
            data: old.data.map(r => r._id === id ? { ...r, approvalStatus: 'REJECTED' } : r)
          };
        }
        return old;
      });

      return { previousReceipts };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['receipts'], context?.previousReceipts);
      toast.error(err.response?.data?.message || 'Failed to reject');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipts-pending'] });
      queryClient.invalidateQueries({ queryKey: ['forms-pending-payment'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections-stats'] });
      toast.success('Receipt rejected');
    },
  });

  // Calculate stats from APPROVED receipts only
  const approvedReceipts = receipts?.filter(r => r.approvalStatus === 'APPROVED') || [];
  const stats = receipts ? {
    totalReceipts: receipts.length,
    totalAmount: receipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0),
    totalCollected: approvedReceipts.reduce((sum, r) => sum + (r.advancePaid || 0), 0),
    pendingAmount: approvedReceipts.reduce((sum, r) => sum + (r.balanceDue || 0), 0),
    pendingApproval: receipts.filter(r => r.approvalStatus === 'PENDING' || r.branchApprovalStatus === 'PENDING').length,
  } : { totalReceipts: 0, totalAmount: 0, totalCollected: 0, pendingAmount: 0, pendingApproval: 0 };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewReceipt, setViewReceipt] = useState(null);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [availableAMCs, setAvailableAMCs] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [createMode, setCreateMode] = useState('manual');

  const getDefaultBranchId = () => {
    if (user?.role !== 'super_admin' && user?.branchId) {
      return typeof user.branchId === 'object' ? user.branchId._id : user.branchId;
    }
    return '';
  };

  const [formData, setFormData] = useState({
    formId: '',
    serviceType: 'AMC',
    category: 'Residential',
    customerName: '', customerPhone: '', customerEmail: '',
    customerAddress: '', customerGstNo: '',
    amcId: '',
    attDetails: { constructionPhase: '', treatmentType: '', chemical: '', method: 'Drill', warranty: '' },
    premisesType: 'Bunglow',
    floors: [{ label: 'Floor 1', length: '', width: '' }],
    amcRatePerSqft: 15,
    attRatePerSqft: 18,
    gstPercent: 18,
    totalAmount: 0,
    advancePaid: '',
    paymentMode: 'CASH', transactionId: '', paymentDate: new Date().toISOString().split('T')[0],
    branchId: getDefaultBranchId(), notes: ''
  });

  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  const resetForm = () => {
    setFormData({
      formId: '', serviceType: 'AMC', category: 'Residential',
      customerName: '', customerPhone: '', customerEmail: '',
      customerAddress: '', customerGstNo: '',
      amcId: '',
      attDetails: { constructionPhase: '', treatmentType: '', chemical: '', method: 'Drill', warranty: '' },
      premisesType: 'Bunglow',
      floors: [{ label: 'Floor 1', length: '', width: '' }],
      amcRatePerSqft: 15, attRatePerSqft: 18,
      gstPercent: 18,
      totalAmount: 0,
      advancePaid: '',
      paymentMode: 'CASH', transactionId: '', paymentDate: new Date().toISOString().split('T')[0],
      branchId: getDefaultBranchId(), notes: ''
    });
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setAvailableAMCs([]);
    setSelectedBooking(null);
    setCreateMode('manual');
  };

  const handleSelectBooking = (booking) => {
    const cust = booking.customer || {};
    const pricing = booking.pricing || {};
    const billing = booking.billing || {};
    const premises = booking.premises || {};
    const floors = premises.floors || [{ label: 'Floor 1', length: '', width: '' }];

    // Get branchId - handle both populated and non-populated cases
    const bookingBranchId = typeof booking.branchId === 'object' ? booking.branchId?._id : booking.branchId;
    const totalAmount = pricing.finalAmount || 0;
    const alreadyPaid = billing.advance || billing.totalPaid || 0;
    const balanceDue = Math.max(0, totalAmount - alreadyPaid);

    setSelectedBooking(booking);
    setFormData(prev => ({
      ...prev,
      formId: booking._id,
      serviceType: booking.serviceType || 'AMC',
      category: booking.serviceCategory || 'Residential',
      customerName: cust.name || '',
      customerPhone: cust.phone || '',
      customerEmail: cust.email || '',
      customerAddress: cust.address || '',
      customerGstNo: cust.gstNo || '',
      premisesType: premises.type || 'Bunglow',
      floors: floors.length > 0 ? floors : [{ label: 'Floor 1', length: '', width: '' }],
      totalAmount: totalAmount,
      gstPercent: pricing.gstPercent || 18,
      advancePaid: balanceDue.toString(),
      branchId: bookingBranchId || user?.branchId || getDefaultBranchId()
    }));
  };

  const calculateTotals = () => {
    const totalArea = Math.ceil(formData.floors.reduce((sum, floor) => {
      return sum + (parseFloat(floor.length) || 0) * (parseFloat(floor.width) || 0);
    }, 0));

    let amcAmount = 0, attAmount = 0;

    if (formData.serviceType === 'AMC' || formData.serviceType === 'BOTH') {
      amcAmount = Math.ceil(totalArea * formData.amcRatePerSqft);
    }
    if (formData.serviceType === 'ATT' || formData.serviceType === 'BOTH') {
      attAmount = Math.ceil(totalArea * formData.attRatePerSqft);
    }

    const baseAmount = amcAmount + attAmount;
    const gstAmount = Math.ceil((baseAmount * formData.gstPercent) / 100);
    const totalAmount = baseAmount + gstAmount;

    return { totalArea, baseAmount, gstAmount, totalAmount, amcAmount, attAmount };
  };

  const totals = calculateTotals();
  const finalTotal = formData.totalAmount > 0 ? formData.totalAmount : totals.totalAmount;
  const alreadyPaid = selectedBooking?.billing?.advance || selectedBooking?.billing?.totalPaid || 0;
  const currentAmount = parseFloat(formData.advancePaid) || 0;
  const balanceDue = finalTotal - alreadyPaid - currentAmount;

  const handleFloorChange = (index, field, value) => {
    const newFloors = [...formData.floors];
    newFloors[index][field] = value;
    setFormData({ ...formData, floors: newFloors });
  };

  const addFloor = () => {
    setFormData({
      ...formData,
      floors: [...formData.floors, { label: `Floor ${formData.floors.length + 1}`, length: '', width: '' }]
    });
  };

  const removeFloor = (index) => {
    if (formData.floors.length > 1) {
      setFormData({
        ...formData,
        floors: formData.floors.filter((_, i) => i !== index)
      });
    }
  };

  const mutation = useMutation({
    mutationFn: (data) => api.post('/receipts', data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['receipts'], exact: true });
      await queryClient.cancelQueries({ queryKey: ['forms'], exact: false });
      const previousReceipts = queryClient.getQueryData(['receipts']);
      const previousForms = queryClient.getQueryData(['forms-pending-payment']);

      const tempReceipt = {
        _id: `temp-${Date.now()}`,
        receiptNo: 'Pending',
        customerName: data.get('customerName') || '',
        totalAmount: parseFloat(data.get('totalAmount')) || 0,
        approvalStatus: 'PENDING',
        branchApprovalStatus: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['receipts'], (old) => {
        if (!old) return [tempReceipt];
        if (Array.isArray(old)) {
          return [tempReceipt, ...old];
        }
        if (old.data) {
          return { ...old, data: [tempReceipt, ...old.data] };
        }
        return old;
      });

      return { previousReceipts, previousForms };
    },
    onSuccess: (res) => {
      const createdReceipt = res.data?.data;
      if (createdReceipt) {
        queryClient.setQueryData(['receipts'], (old) => {
          if (!old) return [createdReceipt];
          if (Array.isArray(old)) {
            return [createdReceipt, ...old.filter(r => !String(r._id).startsWith('temp-'))];
          }
          if (old.data) {
            return { ...old, data: [createdReceipt, ...old.data.filter(r => !String(r._id).startsWith('temp-'))] };
          }
          return old;
        });
      }
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['hqSummary'] });
      queryClient.invalidateQueries({ queryKey: ['collections-stats'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms-pending-payment'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Receipt generated successfully!');
    },
    onError: (err, data, context) => {
      queryClient.setQueryData(['receipts'], context?.previousReceipts);
      queryClient.setQueryData(['forms-pending-payment'], context?.previousForms);
      toast.error(err.response?.data?.message || 'Failed to generate receipt');
    },
  });

  const resendMutation = useMutation({
    mutationFn: (id) => api.post(`/receipts/${id}/resend`),
    onSuccess: () => toast.success('Receipt email resent!'),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to resend email'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (user.role === 'super_admin' && !formData.branchId) {
      toast.error('Branch selection is mandatory for Head Office users.');
      return;
    }

    const payload = new FormData();
    payload.append('formId', formData.formId);
    payload.append('customerName', formData.customerName);
    payload.append('customerPhone', formData.customerPhone);
    payload.append('customerEmail', formData.customerEmail);
    payload.append('customerAddress', formData.customerAddress);
    payload.append('customerGstNo', formData.customerGstNo);
    payload.append('serviceType', formData.serviceType);
    payload.append('category', formData.category);
    payload.append('serviceDescription', `${formData.serviceType} - ${formData.premisesType} - ${formData.category}`);
    payload.append('amcServices', JSON.stringify(formData.amcServices || []));
    payload.append('attDetails', JSON.stringify(formData.attDetails));
    payload.append('premisesType', formData.premisesType);
    payload.append('floors', JSON.stringify(formData.floors.map(f => ({
      ...f,
      area: Math.ceil((parseFloat(f.length) || 0) * (parseFloat(f.width) || 0))
    }))));
    payload.append('amcRatePerSqft', formData.amcRatePerSqft);
    payload.append('attRatePerSqft', formData.attRatePerSqft);
    payload.append('serviceTotal', totals.baseAmount);
    payload.append('baseAmount', totals.baseAmount);
    payload.append('gstPercent', formData.gstPercent);
    payload.append('gstAmount', totals.gstAmount);
    payload.append('totalAmount', finalTotal);
    payload.append('advancePaid', currentAmount);
    payload.append('balanceDue', balanceDue);
    payload.append('paymentMode', formData.paymentMode);
    payload.append('transactionId', formData.transactionId || '');
    payload.append('paymentDate', formData.paymentDate || new Date().toISOString());
    payload.append('branchId', formData.branchId);
    payload.append('notes', formData.notes || '');

    if (screenshotFile) {
      payload.append('paymentScreenshot', screenshotFile);
    }

    mutation.mutate(payload);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PARTIAL': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PENDING': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filtered = receipts?.filter(r => {
    const matchSearch = r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.receiptNo?.toLowerCase().includes(search.toLowerCase());
    const matchType = serviceFilter === 'ALL' || r.serviceType === serviceFilter;
    const matchPending = showPendingOnly
      ? (r.approvalStatus === 'PENDING' || r.branchApprovalStatus === 'PENDING' || r.approvalStatus === 'BRANCH_APPROVED')
      : true;
    return matchSearch && matchType && matchPending;
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-24">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500" /> Receipts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Generate receipts with booking selection</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="px-4 sm:px-5 py-2 sm:py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto">
          <Plus size={16} className="sm:w-4.5 sm:h-4.5" /> New Receipt
        </button>
      </div>

      {/* Summary Cards */}
      <div className={`grid grid-cols-2 lg:grid-cols-${canApprove && stats.pendingApproval > 0 ? '5' : '4'} gap-2 sm:gap-3 md:gap-4`}>
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-lg">
          <p className="text-[10px] sm:text-xs font-medium opacity-80">Total</p>
          <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1">{stats.totalReceipts}</p>
        </div>
        <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-lg">
          <p className="text-[10px] sm:text-xs font-medium opacity-80">Amount</p>
          <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1">₹{stats.totalAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-lg">
          <p className="text-[10px] sm:text-xs font-medium opacity-80">Collected</p>
          <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1">₹{stats.totalCollected.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-linear-to-br from-amber-500 to-amber-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-lg">
          <p className="text-[10px] sm:text-xs font-medium opacity-80">Pending</p>
          <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1">₹{stats.pendingAmount.toLocaleString('en-IN')}</p>
        </div>
        {canApprove && stats.pendingApproval > 0 && (
          <div className="bg-linear-to-br from-red-500 to-red-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white shadow-lg">
            <p className="text-[10px] sm:text-xs font-medium opacity-80">Approval</p>
            <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1">{stats.pendingApproval}</p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'AMC', 'ATT', 'BOTH'].map(type => (
              <button key={type} onClick={() => setServiceFilter(type)}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${serviceFilter === type
                  ? type === 'AMC' ? 'bg-emerald-500 text-white'
                    : type === 'ATT' ? 'bg-blue-500 text-white'
                      : type === 'BOTH' ? 'bg-purple-500 text-white'
                        : 'bg-slate-700 text-white'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}>
                {type}
              </button>
            ))}
            {canApprove && stats.pendingApproval > 0 && (
              <button
                onClick={() => setShowPendingOnly(!showPendingOnly)}
                className={`ml-2 px-3 py-1 text-xs font-bold rounded-full transition-all ${showPendingOnly
                  ? 'bg-amber-500 text-white'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
              >
                {showPendingOnly ? '✓ Showing Pending' : `${stats.pendingApproval} Pending`}
              </button>
            )}
            <span className="text-xs text-slate-400 self-center ml-2">
              {filtered?.length || 0} receipts
            </span>
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer or receipt ID..."
            className="w-full max-w-md px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-50 text-[9px] sm:text-xs uppercase text-slate-500 font-bold">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left">Receipt No</th>
                <th className="px-2 sm:px-4 py-3 text-left">Customer</th>
                <th className="px-2 sm:px-4 py-3 text-left hidden sm:table-cell">Service</th>
                <th className="px-2 sm:px-4 py-3 text-right">Amount</th>
                <th className="px-2 sm:px-4 py-3 text-center">Status</th>
                <th className="px-2 sm:px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
              ) : filtered?.length > 0 ? filtered.map(rec => (
                <tr key={rec._id} className="hover:bg-slate-50">
                  <td className="px-2 sm:px-4 py-3">
                    <p className="font-bold text-slate-900 text-xs">{rec.receiptNo || 'N/A'}</p>
                    <p className="text-[9px] sm:text-xs text-slate-400">{rec.branchId?.branchName}</p>
                  </td>
                  <td className="px-2 sm:px-4 py-3">
                    <p className="font-semibold text-xs truncate max-w-[100px] sm:max-w-none">{rec.customerName}</p>
                    <p className="text-[9px] sm:text-xs text-slate-400">{rec.customerPhone}</p>
                  </td>
                  <td className="px-2 sm:px-4 py-3 hidden sm:table-cell">
                    <span className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded ${rec.serviceType === 'AMC' ? 'bg-emerald-100 text-emerald-700' : rec.serviceType === 'ATT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {rec.serviceType}
                    </span>
                    <p className="text-[9px] sm:text-xs text-slate-400 mt-1 hidden md:block">{rec.category}</p>
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-right font-bold text-xs">₹{(rec.totalAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="px-2 sm:px-4 py-3 text-center">
                    {rec.approvalStatus === 'APPROVED' ? (
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold rounded border ${getStatusStyle(rec.status)}`}>{rec.status}</span>
                    ) : rec.approvalStatus === 'REJECTED' ? (
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold rounded border bg-red-100 text-red-700">REJECTED</span>
                    ) : rec.branchApprovalStatus === 'APPROVED' ? (
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold rounded border bg-blue-100 text-blue-700">BRANCH APPROVED</span>
                    ) : (
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold rounded border bg-yellow-100 text-yellow-700">PENDING</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewReceipt(rec)} className="px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1">
                        <Eye size={10} className="sm:w-3 sm:h-3" />
                      </button>
                      <button onClick={async () => {
                        try {
                          const response = await api.get(`/receipts/${rec._id}/pdf`, { responseType: 'blob' });
                          const url = window.URL.createObjectURL(new Blob([response.data]));
                          const link = document.createElement('a');
                          link.href = url; link.setAttribute('download', `Receipt_${rec.receiptNo || rec._id}.pdf`);
                          document.body.appendChild(link); link.click();
                          toast.success('PDF Downloaded');
                        } catch (err) { toast.error('PDF Failed'); }
                      }} className="px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center gap-1">
                        <Download size={10} className="sm:w-3 sm:h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-400">No receipts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40">
          <div className="absolute inset-0" onClick={() => setViewReceipt(null)} />
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-brand-50 to-emerald-50 p-3 sm:p-4 flex items-center justify-between border-b">
              <div>
                <p className="text-[10px] sm:text-xs font-black text-brand-500 uppercase">Receipt</p>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">{viewReceipt.receiptNo}</h3>
              </div>
              <button onClick={() => setViewReceipt(null)} className="p-1.5 sm:p-2 hover:bg-white rounded-lg sm:rounded-xl"><X size={18} className="sm:w-5 sm:h-5" /></button>
            </div>

            <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
              <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase mb-1 sm:mb-2">Customer</p>
                <p className="font-bold text-slate-800 text-sm sm:text-base">{viewReceipt.customerName}</p>
                <p className="text-xs sm:text-sm text-slate-500">{viewReceipt.customerPhone}</p>
              </div>

              <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs font-bold text-blue-400 uppercase mb-1 sm:mb-2">Service</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold rounded ${viewReceipt.serviceType === 'AMC' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {viewReceipt.serviceType}
                  </span>
                </div>
              </div>

              <div className="border-t-2 border-slate-200 pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm"><span>Total Amount</span><span className="font-bold">₹{(viewReceipt.totalAmount || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-xs sm:text-sm text-emerald-600"><span>Paid</span><span>+₹{(viewReceipt.advancePaid || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-bold text-red-600 text-xs sm:text-sm"><span>Balance</span><span>₹{(viewReceipt.balanceDue || 0).toLocaleString('en-IN')}</span></div>
                <div className="mt-2 pt-2 border-t">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Approval Status</span>
                    <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded ${viewReceipt.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      viewReceipt.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        viewReceipt.branchApprovalStatus === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                      }`}>
                      {viewReceipt.approvalStatus === 'APPROVED' ? 'APPROVED' :
                        viewReceipt.approvalStatus === 'REJECTED' ? 'REJECTED' :
                          viewReceipt.branchApprovalStatus === 'APPROVED' ? 'BRANCH APPROVED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {/* Approval Actions for Admins */}
                {canApprove && viewReceipt.approvalStatus !== 'APPROVED' && viewReceipt.approvalStatus !== 'REJECTED' && (
                  <div className="flex flex-col sm:flex-row gap-2 w-full mb-2">
                    {isBranchAdmin && viewReceipt.branchApprovalStatus === 'PENDING' && (
                      <>
                        <button
                          onClick={() => { branchApproveMutation.mutate(viewReceipt._id); setViewReceipt(null); }}
                          disabled={branchApproveMutation.isPending}
                          className="flex-1 py-2 bg-emerald-500 text-white rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-1"
                        >
                          <Check size={12} className="sm:w-3.5 sm:h-3.5" /> Branch Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason !== null) {
                              branchRejectMutation.mutate({ id: viewReceipt._id, reason });
                              setViewReceipt(null);
                            }
                          }}
                          disabled={branchRejectMutation.isPending}
                          className="flex-1 py-2 bg-red-500 text-white rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-1"
                        >
                          <Ban size={12} className="sm:w-3.5 sm:h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {isSuperAdmin && viewReceipt.approvalStatus === 'BRANCH_APPROVED' && (
                      <>
                        <button
                          onClick={() => { finalApproveMutation.mutate(viewReceipt._id); setViewReceipt(null); }}
                          disabled={finalApproveMutation.isPending}
                          className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-1"
                        >
                          <Check size={12} className="sm:w-3.5 sm:h-3.5" /> Final Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason !== null) {
                              finalRejectMutation.mutate({ id: viewReceipt._id, reason });
                              setViewReceipt(null);
                            }
                          }}
                          disabled={finalRejectMutation.isPending}
                          className="flex-1 py-2 bg-red-500 text-white rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center gap-1"
                        >
                          <Ban size={12} className="sm:w-3.5 sm:h-3.5" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                )}
                <button onClick={async () => {
                  try {
                    const response = await api.get(`/receipts/${viewReceipt._id}/pdf`, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url; link.setAttribute('download', `Receipt_${viewReceipt.receiptNo}.pdf`);
                    document.body.appendChild(link); link.click();
                    toast.success('PDF Downloaded!');
                  } catch (err) { toast.error('PDF Failed'); }
                }} className="flex-1 py-2.5 sm:py-3 bg-brand-600 text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2">
                  <Download size={14} className="sm:w-4 sm:h-4" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40">
          <div className="absolute inset-0" onClick={() => { setIsModalOpen(false); resetForm(); }} />
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl">
            <div className="sticky top-0 bg-slate-50 p-3 sm:p-4 flex items-center justify-between border-b">
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">New Receipt</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-1.5 sm:p-2 hover:bg-slate-200 rounded-lg sm:rounded-xl"><X size={18} className="sm:w-5 sm:h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* Booking Selection */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 text-white">
                <p className="text-xs font-bold uppercase opacity-70 mb-3">Select Booking (Optional)</p>

                <select
                  value={formData.formId}
                  onChange={(e) => {
                    if (e.target.value) {
                      const booking = forms?.find(f => f._id === e.target.value);
                      if (booking) handleSelectBooking(booking);
                    } else {
                      setSelectedBooking(null);
                      setFormData(prev => ({ ...prev, formId: '' }));
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-900 bg-white"
                >
                  <option value="">-- Select Booking --</option>
                  {forms?.map(form => {
                    const total = form.pricing?.finalAmount || 0;
                    const paid = form.billing?.advance || form.pricing?.advancePaid || 0;
                    const paidStatus = paid >= total ? '✓ PAID' : paid > 0 ? `₹${paid.toLocaleString()} PAID` : 'PENDING';
                    return (
                      <option key={form._id} value={form._id}>
                        {form.orderNo} | {form.customer?.name || 'Customer'} | ₹{total.toLocaleString('en-IN')} | {paidStatus} | {form.status}
                      </option>
                    );
                  })}
                </select>

                {selectedBooking && (
                  <div className="mt-3 p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span className="font-semibold text-sm">Booking Selected</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="opacity-70">Order:</span> <span className="font-bold">{selectedBooking.orderNo}</span></div>
                      <div><span className="opacity-70">Service:</span> <span className="font-bold">{selectedBooking.serviceType}</span></div>
                      <div><span className="opacity-70">Total:</span> <span className="font-bold text-emerald-400">₹{(selectedBooking.pricing?.finalAmount || 0).toLocaleString('en-IN')}</span></div>
                      <div><span className="opacity-70">Branch:</span> <span className="font-bold">{selectedBooking.branchId?.branchName}</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <User size={14} /> Customer Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Customer Name *" value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm" />
                  <input required placeholder="Phone *" value={formData.customerPhone}
                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm" />
                  <input type="email" placeholder="Email" value={formData.customerEmail}
                    onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm col-span-2" />
                  <input placeholder="Address" value={formData.customerAddress}
                    onChange={e => setFormData({ ...formData, customerAddress: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm col-span-2" />
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3">
                  <p className="text-xs font-bold text-white uppercase opacity-70">Price Summary</p>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Total Amount Override</label>
                    <input
                      type="text"
                      value={formData.totalAmount > 0 ? formData.totalAmount.toString() : ''}
                      onChange={e => setFormData({ ...formData, totalAmount: parseFloat(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
                      placeholder="Enter total amount"
                    />
                  </div>

                  {selectedBooking && formData.totalAmount > 0 && (
                    <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Booking Total</span>
                        <span className="font-semibold text-slate-700">₹{(selectedBooking.pricing?.finalAmount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      {selectedBooking?.billing?.advance > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Previous Paid</span>
                          <span className="font-semibold text-emerald-600">-₹{selectedBooking.billing.advance.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                        <span className="font-semibold text-slate-700">Balance Due</span>
                        <span className="font-bold text-slate-900">₹{(formData.totalAmount - (selectedBooking?.billing?.advance || 0)).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">GST %</label>
                      <input type="text" value={formData.gstPercent || ''}
                        onChange={e => setFormData({ ...formData, gstPercent: parseFloat(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-2">
                  <IndianRupee size={14} /> Payment Details
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <select required value={formData.paymentMode}
                    onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="px-2 py-2 border rounded-lg text-sm bg-white">
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI</option>
                    <option value="ONLINE">ONLINE</option>
                    <option value="NEFT">NEFT</option>
                    <option value="CHEQUE">CHEQUE</option>
                  </select>
                  <input placeholder="TXN ID" value={formData.transactionId}
                    onChange={e => setFormData({ ...formData, transactionId: e.target.value })}
                    className="px-2 py-2 border rounded-lg text-sm" />
                  <input type="date" value={formData.paymentDate}
                    onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="px-2 py-2 border rounded-lg text-sm" />
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Amount Received (₹) *</label>
                  <input type="number" required value={formData.advancePaid}
                    onChange={e => setFormData({ ...formData, advancePaid: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-bold text-lg" placeholder="0" />

                  <div className="mt-2 p-3 bg-white rounded-lg border border-emerald-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Total Amount:</span>
                      <span className="font-bold text-slate-900">₹{finalTotal.toLocaleString('en-IN')}</span>
                    </div>
                    {alreadyPaid > 0 && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-slate-500">Already Paid:</span>
                        <span className="font-bold text-blue-600">₹{alreadyPaid.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-slate-500">Paying Now:</span>
                      <span className="font-bold text-emerald-600">₹{currentAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                      <span className="text-sm font-semibold text-slate-700">Remaining Balance:</span>
                      <span className={`font-bold text-lg ${balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        ₹{balanceDue.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch */}
              {user?.role === 'super_admin' && (
                <div className="bg-brand-50 rounded-xl p-4">
                  <label className="text-xs font-bold text-brand-600 uppercase mb-2 block flex items-center gap-2">
                    <Building2 size={14} /> Assign to Branch *
                  </label>
                  <select required value={formData.branchId}
                    onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-200 rounded-lg text-sm">
                    <option value="">Select Branch</option>
                    {branches?.map(b => (
                      <option key={b._id} value={b._id}>{b.branchName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows="2"
                  placeholder="Any notes..."
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl">
                  Cancel
                </button>
                <button type="submit" disabled={mutation.isPending}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                  {mutation.isPending ? 'Processing...' : <><IndianRupee size={16} /> Generate Receipt</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipts;
