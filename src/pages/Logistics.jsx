import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { 
  Truck, Gauge, Camera, CheckCircle, X, Play, Clock,
  Route, AlertCircle, Calendar, IndianRupee, Check, Ban,
  ArrowRight, History, Eye, User
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const PURPOSE_OPTIONS = [
  { value: 'SERVICE', label: 'Service Visit', icon: '🔧', color: 'blue' },
  { value: 'PICKUP', label: 'Material Pickup', icon: '📦', color: 'purple' },
  { value: 'SUPPLIER', label: 'Supplier Visit', icon: '🏭', color: 'orange' },
  { value: 'EMERGENCY', label: 'Emergency Call', icon: '🚨', color: 'red' },
  { value: 'OFFICE', label: 'Office Work', icon: '🏢', color: 'slate' },
  { value: 'OTHER', label: 'Other', icon: '📝', color: 'gray' }
];

const Logistics = () => {
  const { user } = useSelector(state => state.auth);
  const queryClient = useQueryClient();
  const startFileRef = useRef(null);
  const endFileRef = useRef(null);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState(null);
  const [linkedFormId, setLinkedFormId] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [rejectRemark, setRejectRemark] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  const [travelData, setTravelData] = useState({
    purpose: '',
    purposeNotes: '',
    formId: '',
    fromLocation: '',
    toLocation: '',
    vehicleNo: '',
    startMeter: '',
    startMeterPhoto: null,
    endMeter: '',
    endMeterPhoto: null
  });

  const { data: linkedForms } = useQuery({
    queryKey: ['travel-forms'],
    queryFn: async () => {
      const res = await api.get('/travel-logs/forms');
      return res.data.data || [];
    },
    enabled: true
  });

  const { data: activeLog } = useQuery({
    queryKey: ['travel-active'],
    queryFn: async () => {
      const res = await api.get('/travel-logs/active');
      return res.data.data;
    }
  });

  useEffect(() => {
    if (activeLog && !isAdmin) {
      const endMeterInput = document.getElementById('end-meter-input');
      if (endMeterInput) {
        setTimeout(() => endMeterInput.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      }
    }
  }, [activeLog, isAdmin]);

  const { data: travelHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['travel-history'],
    queryFn: async () => {
      const res = await api.get('/travel-logs');
      return res.data.data || [];
    }
  });

  const { data: pendingApprovals } = useQuery({
    queryKey: ['travel-pending'],
    queryFn: async () => {
      const res = await api.get('/travel-logs/pending');
      return res.data.data || [];
    },
    enabled: isAdmin
  });

  const startMutation = useMutation({
    mutationFn: (data) => api.post('/travel-logs/start', data),
    onSuccess: (res) => {
      toast.success('Travel started!');
      queryClient.invalidateQueries(['travel-active']);
      queryClient.invalidateQueries(['travel-history']);
      setShowNewForm(false);
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to start')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/travel-logs/${id}`, data),
    onSuccess: () => {
      toast.success('Updated');
      queryClient.invalidateQueries(['travel-active']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update')
  });

  const endMutation = useMutation({
    mutationFn: ({ id, data }) => api.post(`/travel-logs/${id}/end`, data),
    onSuccess: () => {
      toast.success('Travel completed! Waiting for approval.');
      queryClient.invalidateQueries(['travel-active']);
      queryClient.invalidateQueries(['travel-history']);
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to complete')
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.delete(`/travel-logs/${id}`),
    onSuccess: () => {
      toast.success('Travel cancelled');
      queryClient.invalidateQueries(['travel-active']);
      queryClient.invalidateQueries(['travel-history']);
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel')
  });

  const acceptMutation = useMutation({
    mutationFn: (id) => api.post(`/travel-logs/${id}/accept`),
    onSuccess: () => {
      toast.success('Allowance accepted and settled!');
      queryClient.invalidateQueries(['travel-history']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to accept')
  });

  const branchApproveMutation = useMutation({
    mutationFn: ({ id, status, remark }) => api.post(`/travel-logs/${id}/branch-approve`, { status, remark }),
    onSuccess: () => {
      toast.success('Action completed');
      queryClient.invalidateQueries(['travel-pending']);
      setShowRejectModal(null);
      setRejectRemark('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed')
  });

  const superApproveMutation = useMutation({
    mutationFn: ({ id, status, remark }) => api.post(`/travel-logs/${id}/super-approve`, { status, remark }),
    onSuccess: () => {
      toast.success('Action completed');
      queryClient.invalidateQueries(['travel-pending']);
      setShowRejectModal(null);
      setRejectRemark('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed')
  });

  const uploadPhoto = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      console.log('Uploading photo...', file.name);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Upload success:', res.data.data);
      return res.data.data;
    } catch (error) {
      console.error('Upload error:', error.response?.data || error.message);
      toast.error('Upload failed: ' + (error.response?.data?.message || error.message));
      return null;
    }
  };

  const handleStartPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeLog?._id) return;
    const url = await uploadPhoto(file);
    if (url) {
      updateMutation.mutate({ id: activeLog._id, data: { startMeterPhoto: url } });
    }
  };

  const handleEndPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeLog?._id) return;
    const url = await uploadPhoto(file);
    if (url) {
      updateMutation.mutate({ id: activeLog._id, data: { endMeterPhoto: url } });
    }
  };

  const handleStartTravel = () => {
    if (!selectedPurpose) return toast.error('Select a purpose');
    if (!travelData.startMeter) return toast.error('Enter start meter');
    startMutation.mutate({
      ...travelData,
      purpose: selectedPurpose,
      formId: linkedFormId || null,
      startMeter: parseFloat(travelData.startMeter)
    });
  };

  const handleEndTravel = () => {
    if (!activeLog?._id) return;
    if (!travelData.endMeter) return toast.error('Enter end meter');
    endMutation.mutate({
      id: activeLog._id,
      data: { endMeter: parseFloat(travelData.endMeter) }
    });
  };

  const resetForm = () => {
    setSelectedPurpose(null);
    setLinkedFormId('');
    setTravelData({
      purpose: '', purposeNotes: '', formId: '', fromLocation: '', toLocation: '',
      vehicleNo: '', startMeter: '', startMeterPhoto: null, endMeter: '', endMeterPhoto: null
    });
  };

  const handlePurposeSelect = (purpose) => {
    setSelectedPurpose(purpose);
    setTravelData({ ...travelData, purpose });
  };

  const getPurposeInfo = (purpose) => PURPOSE_OPTIONS.find(p => p.value === purpose) || PURPOSE_OPTIONS[5];

  const getStatusBadge = (log) => {
    if (log.employeeStatus === 'ACCEPTED') {
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'SETTLED ✅' };
    }
    if (log.superAdminStatus === 'APPROVED') {
      return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'APPROVED - Accept Pending' };
    }
    if (log.superAdminStatus === 'REJECTED') {
      return { bg: 'bg-red-100', text: 'text-red-700', label: 'REJECTED' };
    }
    if (log.branchAdminStatus === 'APPROVED') {
      return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Branch Approved - Awaiting HQ' };
    }
    if (log.branchAdminStatus === 'REJECTED') {
      return { bg: 'bg-red-100', text: 'text-red-700', label: 'REJECTED by Branch' };
    }
    return { bg: 'bg-slate-100', text: 'text-slate-700', label: 'PENDING' };
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num || 0);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <Truck size={20} />
            </div>
            Travel Log
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin ? 'Track & approve travel allowances' : 'Track your travel & get allowances'}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowHistory(false)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm ${!showHistory ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              <Eye size={16} className="inline mr-1" /> Pending
              {pendingApprovals?.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 rounded-full">{pendingApprovals.length}</span>
              )}
            </button>
          )}
          <button
            onClick={() => setShowHistory(true)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm ${showHistory ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            <History size={16} className="inline mr-1" /> History
          </button>
          {!activeLog && !isAdmin && (
            <button
              onClick={() => setShowNewForm(true)}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30"
            >
              <Play size={16} /> Start Travel
            </button>
          )}
        </div>
      </div>

      {/* Admin Pending Approvals */}
      {isAdmin && !showHistory && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-500" /> 
            Pending Approvals ({pendingApprovals?.length || 0})
          </h3>
          
          {pendingApprovals?.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
              <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
              <p>No pending approvals</p>
            </div>
          ) : (
            pendingApprovals?.map(log => {
              const purpose = getPurposeInfo(log.purpose);
              const logBranchId = log.branchId?._id?.toString() || log.branchId?.toString();
              const employeeBranchId = log.employeeId?.branchId?._id?.toString() || log.employeeId?.branchId?.toString();
              const branchCanApprove = user?.role === 'branch_admin' && log.branchAdminStatus === 'PENDING' && (logBranchId === user?.branchId?.toString() || employeeBranchId === user?.branchId?.toString());
              const superCanApprove = user?.role === 'super_admin' && log.branchAdminStatus === 'APPROVED' && log.superAdminStatus === 'PENDING';
              const canApprove = branchCanApprove || superCanApprove;
              
              return (
                <div key={log._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{purpose.icon}</span>
                        <div>
                          <p className="font-bold">{purpose.label}</p>
                          <p className="text-xs opacity-80">{log.purposeNotes || 'No notes'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-80">
                          {log.employeeId?.name || 'Employee'}
                        </p>
                        <p className="text-xs opacity-60">{new Date(log.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-blue-600 font-medium">Start</p>
                        <p className="text-xl font-black text-blue-700">{log.startMeter} km</p>
                        {log.startMeterPhoto ? (
                          <img 
                            src={log.startMeterPhoto} 
                            alt="Start meter" 
                            className="w-full h-16 object-cover rounded-lg border border-blue-200 mt-1 cursor-pointer"
                            onClick={() => window.open(log.startMeterPhoto, '_blank')}
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">No photo</span>
                        )}
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-emerald-600 font-medium">End</p>
                        <p className="text-xl font-black text-emerald-700">{log.endMeter} km</p>
                        {log.endMeterPhoto ? (
                          <img 
                            src={log.endMeterPhoto} 
                            alt="End meter" 
                            className="w-full h-16 object-cover rounded-lg border border-emerald-200 mt-1 cursor-pointer"
                            onClick={() => window.open(log.endMeterPhoto, '_blank')}
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">No photo</span>
                        )}
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-amber-600 font-medium">Distance</p>
                        <p className="text-xl font-black text-amber-700">{Math.round(log.distance * 10) / 10} km</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-purple-600 font-medium">Allowance</p>
                        <p className="text-xl font-black text-purple-700">{formatCurrency(log.allowance)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                      <span>Rate: ₹{log.ratePerKm}/km</span>
                      {log.vehicleNo && <span>Vehicle: {log.vehicleNo}</span>}
                    </div>

                    {canApprove ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowRejectModal(log._id);
                            setRejectRemark('');
                          }}
                          className="flex-1 py-3 bg-red-100 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-200 flex items-center justify-center gap-2"
                        >
                          <Ban size={16} /> Reject
                        </button>
                        <button
                          onClick={() => {
                            if (superCanApprove) {
                              superApproveMutation.mutate({ id: log._id, status: 'APPROVED' });
                            } else {
                              branchApproveMutation.mutate({ id: log._id, status: 'APPROVED' });
                            }
                          }}
                          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 flex items-center justify-center gap-2"
                        >
                          <Check size={16} /> {superCanApprove ? 'HQ Approve' : 'Branch Approve'}
                        </button>
                      </div>
                      ) : (
                      <div className="bg-slate-100 rounded-xl p-3 text-center text-sm text-slate-600">
                        {log.branchAdminStatus === 'PENDING' ? 'Pending Branch Approval' : 'Pending HQ Approval'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Admin: View Active Travel */}
      {activeLog && isAdmin && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Route size={18} />
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">Active Travel</span>
              </div>
              <h2 className="text-xl font-bold">{getPurposeInfo(activeLog.purpose).icon} {getPurposeInfo(activeLog.purpose).label}</h2>
              {activeLog.purposeNotes && <p className="text-sm opacity-80 mt-1">{activeLog.purposeNotes}</p>}
              <p className="text-xs opacity-70 mt-2">Employee: {activeLog.employeeId?.name || 'Unknown'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Started</p>
              <p className="font-bold">{new Date(activeLog.startTime || activeLog.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white/20 rounded-xl p-3">
              <p className="text-xs opacity-80">Start Meter</p>
              <p className="text-2xl font-black">{activeLog.startMeter} km</p>
              {activeLog.startMeterPhoto ? (
                <img 
                  src={activeLog.startMeterPhoto} 
                  alt="Start meter" 
                  className="w-full h-16 object-cover rounded-lg border border-white mt-1 cursor-pointer"
                  onClick={() => {
                    console.log('Admin view - opening start photo:', activeLog.startMeterPhoto);
                    window.open(activeLog.startMeterPhoto, '_blank');
                  }}
                  onError={(e) => {
                    console.error('Admin start photo load error:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <p className="text-[10px] text-white/50 mt-1">No photo</p>
              )}
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <p className="text-xs opacity-80">End Meter</p>
              <p className="text-2xl font-black">{activeLog.endMeter || '---'} km</p>
              {activeLog.endMeterPhoto ? (
                <img 
                  src={activeLog.endMeterPhoto} 
                  alt="End meter" 
                  className="w-full h-16 object-cover rounded-lg border border-white mt-1 cursor-pointer"
                  onClick={() => {
                    console.log('Admin view - opening end photo:', activeLog.endMeterPhoto);
                    window.open(activeLog.endMeterPhoto, '_blank');
                  }}
                  onError={(e) => {
                    console.error('Admin end photo load error:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <p className="text-[10px] text-white/50 mt-1">No photo</p>
              )}
            </div>
            {activeLog.distance > 0 && (
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-xs opacity-80">Distance</p>
                <p className="text-2xl font-black">{Math.round(activeLog.distance * 10) / 10} km</p>
              </div>
            )}
            {activeLog.vehicleNo && (
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-xs opacity-80">Vehicle</p>
                <p className="text-lg font-bold">{activeLog.vehicleNo}</p>
              </div>
            )}
          </div>

          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-xs opacity-80">Status</p>
            <p className="font-bold text-lg">{activeLog.status || 'IN_PROGRESS'}</p>
          </div>
        </div>
      )}

      {/* Employee Active Travel */}
      {activeLog && !isAdmin && (
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Route size={18} />
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">Active Travel</span>
              </div>
              <h2 className="text-xl font-bold">{getPurposeInfo(activeLog.purpose).icon} {getPurposeInfo(activeLog.purpose).label}</h2>
              {activeLog.purposeNotes && <p className="text-sm opacity-80 mt-1">{activeLog.purposeNotes}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Started</p>
              <p className="font-bold">{new Date(activeLog.startTime || activeLog.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white/20 rounded-xl p-3">
              <p className="text-xs opacity-80">Start Meter</p>
              <p className="text-2xl font-black">{activeLog.startMeter} km</p>
              {activeLog.startMeterPhoto ? (
                <div className="mt-2">
                  <img 
                    src={activeLog.startMeterPhoto} 
                    alt="Start meter" 
                    className="w-full h-20 object-cover rounded-lg border-2 border-white cursor-pointer"
                    onClick={() => {
                      console.log('Opening start photo:', activeLog.startMeterPhoto);
                      if (activeLog.startMeterPhoto) {
                        window.open(activeLog.startMeterPhoto, '_blank');
                      }
                    }}
                    onError={(e) => {
                      console.error('Start photo load error:', e.target.src);
                      e.target.style.display = 'none';
                    }}
                  />
                  <p className="text-[10px] text-emerald-300 text-center mt-1">Tap to view</p>
                </div>
              ) : (
                <p className="text-[10px] text-white/50 mt-2">No photo</p>
              )}
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <p className="text-xs opacity-80">End Meter</p>
              <p className="text-2xl font-black">{travelData.endMeter || '---'} km</p>
              {travelData.endMeterPhoto && travelData.endMeterPhoto !== 'uploading' ? (
                <div className="mt-2">
                  <img 
                    src={travelData.endMeterPhoto} 
                    alt="End meter" 
                    className="w-full h-20 object-cover rounded-lg border-2 border-white cursor-pointer"
                    onClick={() => {
                      console.log('Opening end photo:', travelData.endMeterPhoto);
                      window.open(travelData.endMeterPhoto, '_blank');
                    }}
                    onError={(e) => {
                      console.error('End photo load error:', e.target.src);
                      e.target.style.display = 'none';
                    }}
                  />
                  <p className="text-[10px] text-emerald-300 text-center mt-1">Tap to view</p>
                </div>
              ) : (
                <p className="text-[10px] text-white/50 mt-2">No photo yet</p>
              )}
            </div>
            {(() => {
              const dist = travelData.endMeter && activeLog.startMeter ? parseFloat(travelData.endMeter) - parseFloat(activeLog.startMeter) : 0;
              return dist > 0 && (
                <div className="bg-white/20 rounded-xl p-3">
                  <p className="text-xs opacity-80">Distance</p>
                  <p className="text-2xl font-black">{dist} km</p>
                </div>
              );
            })()}
            {activeLog.vehicleNo && (
              <div className="bg-white/20 rounded-xl p-3">
                <p className="text-xs opacity-80">Vehicle</p>
                <p className="text-lg font-bold">{activeLog.vehicleNo}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 space-y-4">
            <div className="bg-blue-50 rounded-xl p-3 mb-4">
              <p className="text-xs font-bold text-blue-700 mb-2">START METER PHOTO</p>
              {activeLog.startMeterPhoto ? (
                <>
                  <img 
                    src={activeLog.startMeterPhoto} 
                    alt="Start meter" 
                    className="w-full h-32 object-cover rounded-lg border-2 border-blue-200 cursor-pointer"
                    onClick={() => {
                      console.log('Employee view - start photo:', activeLog.startMeterPhoto);
                      window.open(activeLog.startMeterPhoto, '_blank');
                    }}
                    onError={(e) => {
                      console.error('Employee start photo error:', e.target.src);
                      e.target.style.display = 'none';
                    }}
                  />
                  <p className="text-[10px] text-blue-500 mt-1">Start reading: {activeLog.startMeter} km - Tap to enlarge</p>
                </>
              ) : (
                <p className="text-sm text-blue-600">No start photo uploaded</p>
              )}
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 mb-4">
              <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                <Gauge size={16} /> End Meter Reading
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Meter Reading (km) *</label>
                  <input
                    id="end-meter-input"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={travelData.endMeter}
                    onChange={(e) => setTravelData({ ...travelData, endMeter: e.target.value })}
                    placeholder="Enter end meter reading"
                    className="w-full px-4 py-4 text-2xl font-bold border-4 border-emerald-400 rounded-xl outline-none focus:border-emerald-600 bg-white text-slate-900 placeholder:text-slate-300"
                    autoComplete="off"
                  />
                  {travelData.endMeter && (
                    <p className="text-sm text-emerald-600 mt-2 font-semibold">Current: {travelData.endMeter} km</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Meter Photo (Optional)</label>
                  <input
                    type="file"
                    ref={endFileRef}
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setTravelData({ ...travelData, endMeterPhoto: 'uploading' });
                        const url = await uploadPhoto(file);
                        if (url) {
                          setTravelData({ ...travelData, endMeterPhoto: url });
                        } else {
                          setTravelData({ ...travelData, endMeterPhoto: null });
                        }
                      }
                    }}
                    className="hidden"
                    id="end-photo-input"
                  />
                  {travelData.endMeterPhoto && travelData.endMeterPhoto !== 'uploading' ? (
                    <div className="relative">
                      <img 
                        src={travelData.endMeterPhoto} 
                        alt="End meter" 
                        className="w-full h-32 object-cover rounded-lg border-2 border-emerald-300 cursor-pointer"
                        onClick={() => {
                          console.log('Employee view - opening end photo:', travelData.endMeterPhoto);
                          window.open(travelData.endMeterPhoto, '_blank');
                        }}
                        onError={(e) => {
                          console.error('Employee end photo error:', e.target.src);
                          e.target.style.display = 'none';
                        }}
                      />
                      <p className="text-[10px] text-emerald-600 text-center mt-1">Tap to enlarge</p>
                    </div>
                  ) : (
                    <label 
                      htmlFor="end-photo-input"
                      className="block border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                    >
                      <div className="text-slate-500">
                        <Camera size={32} className="mx-auto mb-2" />
                        <p className="text-sm font-medium">Tap to capture photo</p>
                        <p className="text-xs text-slate-400 mt-1">Take a clear photo of meter</p>
                      </div>
                    </label>
                  )}
                  {travelData.endMeterPhoto === 'uploading' && (
                    <div className="text-center py-4 text-emerald-600">Uploading...</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => cancelMutation.mutate(activeLog._id)}
                className="flex-1 py-3 bg-red-100 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEndTravel}
                disabled={endMutation.isPending || !travelData.endMeter}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {endMutation.isPending ? 'Saving...' : 'Complete Travel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Travel Form */}
      {showNewForm && !activeLog && !isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Route size={18} /> Start New Travel
            </h2>
            <button onClick={() => { setShowNewForm(false); resetForm(); }} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-3">Why are you traveling? *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PURPOSE_OPTIONS.map(purpose => (
                  <button
                    key={purpose.value}
                    onClick={() => handlePurposeSelect(purpose.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedPurpose === purpose.value ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="text-2xl mb-2 block">{purpose.icon}</span>
                    <span className="text-sm font-semibold text-slate-700">{purpose.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Purpose Details</label>
              <textarea
                value={travelData.purposeNotes}
                onChange={(e) => setTravelData({ ...travelData, purposeNotes: e.target.value })}
                placeholder="e.g., Customer meeting at Sector 15..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none resize-none"
                rows="2"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Link to Booking (Optional)</label>
              <select
                value={linkedFormId}
                onChange={(e) => setLinkedFormId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none"
              >
                <option value="">No booking linked</option>
                {linkedForms?.map(form => (
                  <option key={form._id} value={form._id}>{form.orderNo} - {form.customer?.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Vehicle Number</label>
                <input
                  value={travelData.vehicleNo}
                  onChange={(e) => setTravelData({ ...travelData, vehicleNo: e.target.value.toUpperCase() })}
                  placeholder="UP 32 AB 1234"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none"
                />
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                <Gauge size={16} /> Start Meter Reading
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Meter Reading (km) *</label>
                  <input
                    type="number"
                    value={travelData.startMeter}
                    onChange={(e) => setTravelData({ ...travelData, startMeter: e.target.value })}
                    placeholder="Enter start meter reading"
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl text-sm outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Meter Photo</label>
                  <input
                    type="file"
                    ref={startFileRef}
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setTravelData({ ...travelData, startMeterPhoto: 'uploading' });
                        const url = await uploadPhoto(file);
                        setTravelData({ ...travelData, startMeterPhoto: url });
                      }
                    }}
                    className="hidden"
                  />
                  <div 
                    onClick={() => startFileRef.current?.click()}
                    className="border-2 border-dashed border-blue-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-100/50 transition-colors"
                  >
                    {travelData.startMeterPhoto === 'uploading' ? (
                      <div className="text-blue-600 text-sm">Uploading...</div>
                    ) : travelData.startMeterPhoto ? (
                      <div className="text-emerald-600 text-sm flex items-center justify-center gap-2">
                        <CheckCircle size={18} /> Photo uploaded
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm">
                        <Camera size={24} className="mx-auto mb-1" />
                        Tap to capture photo
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowNewForm(false); resetForm(); }}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleStartTravel}
                disabled={startMutation.isPending || !selectedPurpose || !travelData.startMeter}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {startMutation.isPending ? 'Starting...' : <><Play size={16} /> Start Travel</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      {showHistory && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Travel History</h3>
          </div>
          
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {travelHistory?.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Route size={32} className="mx-auto mb-2 opacity-50" />
                <p>No travel history</p>
              </div>
            ) : (
              travelHistory?.map(log => {
                const purpose = getPurposeInfo(log.purpose);
                const status = getStatusBadge(log);
                const canAccept = !isAdmin && log.employeeStatus === 'PENDING' && log.superAdminStatus === 'APPROVED';

                return (
                  <div key={log._id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-100 rounded-xl">
                        <span className="text-2xl">{purpose.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-800">{purpose.label}</p>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </div>
                        {log.purposeNotes && <p className="text-sm text-slate-500 mt-1">{log.purposeNotes}</p>}
                        
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                            <span className="text-slate-500">Start:</span> <span className="font-bold">{log.startMeter} km</span>
                            {log.startMeterPhoto && <span className="text-blue-500 ml-1">📷</span>}
                          </span>
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                            <span className="text-slate-500">End:</span> <span className="font-bold">{log.endMeter} km</span>
                            {log.endMeterPhoto && <span className="text-emerald-500 ml-1">📷</span>}
                          </span>
                          <span className="text-xs bg-emerald-100 px-2 py-1 rounded">
                            <span className="text-emerald-700 font-bold">{log.distance} km</span>
                          </span>
                          {isAdmin && (
                            <span className="text-xs bg-purple-100 px-2 py-1 rounded">
                              <span className="text-purple-700 font-bold">{formatCurrency(log.allowance)}</span>
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-slate-400">
                            {new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {log.startTime && ` at ${new Date(log.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                          {canAccept && (
                            <button
                              onClick={() => acceptMutation.mutate(log._id)}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center gap-1"
                            >
                              <Check size={14} /> Accept & Settle
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Ban size={20} className="text-red-500" /> Reject Travel
            </h3>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Reason (Optional)</label>
              <textarea
                value={rejectRemark}
                onChange={(e) => setRejectRemark(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none resize-none"
                rows="3"
                placeholder="Why are you rejecting?"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowRejectModal(null); setRejectRemark(''); }}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (isSuperAdmin) {
                    superApproveMutation.mutate({ id: showRejectModal, status: 'REJECTED', remark: rejectRemark });
                  } else {
                    branchApproveMutation.mutate({ id: showRejectModal, status: 'REJECTED', remark: rejectRemark });
                  }
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logistics;
