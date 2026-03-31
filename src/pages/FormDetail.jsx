import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FileText, Download, ArrowLeft, User, Phone, 
  MapPin, ShieldCheck, PenTool, IndianRupee,
  CheckCircle2, Clock, Calendar, Truck, Building2, Home, X, Receipt, Plus, Camera
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['DRAFT', 'SUBMITTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];
const PAYMENT_MODES = ['CASH', 'UPI', 'NEFT', 'CHEQUE', 'ONLINE'];

const STATUS_CONFIG = {
  DRAFT: { color: 'bg-slate-100 text-slate-600 border-slate-200', next: 'SUBMITTED', label: 'Draft' },
  SUBMITTED: { color: 'bg-blue-50 text-blue-600 border-blue-100', next: 'SCHEDULED', label: 'Submitted' },
  SCHEDULED: { color: 'bg-amber-50 text-amber-600 border-amber-100', next: 'COMPLETED', label: 'Scheduled' },
  COMPLETED: { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', next: null, label: 'Completed' },
  CANCELLED: { color: 'bg-red-50 text-red-600 border-red-100', next: null, label: 'Cancelled' },
};

const CANCELLABLE_STATES = ['DRAFT', 'SUBMITTED', 'SCHEDULED'];

  const FormDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector(state => state.auth);
  const isFieldStaff = user?.role === 'technician' || user?.role === 'sales';
  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_admin' || user?.role === 'office';

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    advancePaid: '',
    paymentMode: 'CASH',
    transactionId: '',
    notes: ''
  });
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const screenshotRef = useRef(null);

  const { data: form, isLoading, error } = useQuery({
    queryKey: ['form', id],
    queryFn: async () => (await api.get(`/forms/${id}`)).data.data
  });

  const generateReceiptMutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append('advancePaid', data.advancePaid);
      formData.append('paymentMode', data.paymentMode);
      formData.append('transactionId', data.transactionId || '');
      formData.append('notes', data.notes || '');
      if (data.screenshot) {
        formData.append('paymentScreenshot', data.screenshot);
      }
      const response = await api.post(`/receipts/from-form/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response;
    },
    onSuccess: (res) => {
      toast.success('Receipt generated and email sent!');
      setShowPaymentModal(false);
      setPaymentData({ advancePaid: '', paymentMode: 'CASH', transactionId: '', notes: '' });
      setPaymentScreenshot(null);
      setScreenshotPreview(null);
      queryClient.invalidateQueries(['form', id]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to generate receipt');
    }
  });

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setPaymentScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveScreenshot = () => {
    setPaymentScreenshot(null);
    setScreenshotPreview(null);
    if (screenshotRef.current) screenshotRef.current.value = '';
  };

  const handleGenerateReceipt = () => {
    if (!paymentData.advancePaid || parseFloat(paymentData.advancePaid) <= 0) {
      return toast.error('Enter valid amount');
    }
    generateReceiptMutation.mutate({ ...paymentData, screenshot: paymentScreenshot });
  };

  const downloadReceipt = async (receiptId, receiptNo) => {
    try {
      const response = await api.get(`/receipts/${receiptId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt_${receiptNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('Receipt downloaded!');
    } catch (err) {
      toast.error('Failed to download receipt');
    }
  };

  const statusMutation = useMutation({
    mutationFn: async ({ status }) => {
      await api.patch(`/forms/${id}/status`, { status });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries(['form', id]);
      queryClient.invalidateQueries(['forms']);
      toast.success(`Status updated to ${status}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  });

  const handleDownloadPdf = async () => {
    try {
      const response = await api.get(`/forms/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `JobCard_${form?.orderNo || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('PDF Generated');
    } catch (err) {
      console.error('PDF Error:', err);
      toast.error('PDF Generation Failed');
    }
  };

  if (isLoading) return (
    <div className="flex flex-col h-[70vh] items-center justify-center gap-4">
       <div className="w-10 h-10 border-4 border-slate-100 border-t-brand-500 rounded-full animate-spin"></div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading...</p>
    </div>
  );

  if (error || !form) return (
    <div className="p-10 text-center space-y-4">
       <FileText size={40} className="mx-auto text-slate-200" />
       <h2 className="text-xl font-black text-slate-900 uppercase">Form Not Found</h2>
       <button onClick={() => navigate('/forms')} className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg">Back to Forms</button>
    </div>
  );

  const currentStatus = form?.status;
  const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.DRAFT;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-20 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/forms')} className="p-3 bg-white border-2 border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 rounded-xl transition-all">
              <ArrowLeft size={20} />
           </button>
           <div>
              <div className="flex items-center gap-3">
                 <h1 className="text-2xl font-black text-slate-900 uppercase">{form.orderNo || 'DRAFT'}</h1>
                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border-2 ${statusInfo.color}`}>
                    {statusInfo.label}
                 </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                 Created: {form.createdAt ? new Date(form.createdAt).toLocaleDateString('en-IN') : 'N/A'}
              </p>
           </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
              onClick={handleDownloadPdf}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-black transition-all flex items-center gap-2"
           >
              <Download size={16} /> Download PDF
           </button>
           {isAdmin && (
             <>
               {form?.status === 'COMPLETED' ? (
                 <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center gap-2"
                 >
                    <Receipt size={16} /> Generate Receipt
                 </button>
               ) : (
                 <div className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl text-xs flex items-center gap-2">
                   <Clock size={14} /> Receipt available after service completion
                 </div>
               )}
             </>
           )}
        </div>
      </div>

      {/* Status Update - Only for Admin */}
      {isAdmin && (
        <div className="bg-slate-800 p-4 rounded-xl flex items-center gap-2 flex-wrap">
           <span className="text-white text-xs font-bold uppercase mr-2">Update Status:</span>
           {STATUS_OPTIONS.map(status => {
             const info = STATUS_CONFIG[status];
             const isCurrent = status === currentStatus;
             const isNext = statusInfo.next === status;
             const isCancellable = status === 'CANCELLED' && CANCELLABLE_STATES.includes(currentStatus);
             const canChange = statusMutation.isPending || isCurrent || (!isNext && !isCancellable && status !== currentStatus);
             
             return (
               <button
                 key={status}
                 disabled={canChange}
                 onClick={() => statusMutation.mutate({ status })}
                 className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                   isCurrent 
                     ? `${info.color} border-2 cursor-default` 
                     : isNext || isCancellable
                       ? status === 'CANCELLED'
                         ? 'bg-red-500 text-white hover:bg-red-400'
                         : 'bg-emerald-500 text-white hover:bg-emerald-400' 
                       : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                 }`}
               >
                 {info.label}
               </button>
             );
           })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Details */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-brand-600 px-4 py-2 flex items-center gap-2">
            <User size={14} className="text-white" />
            <span className="text-white text-xs font-bold uppercase">Customer Details</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Name</span>
              <span className="text-xs font-bold text-slate-900">{form.customer?.title} {form.customer?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
              <span className="text-xs font-bold text-slate-900">{form.customer?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp</span>
              <span className="text-xs font-bold text-slate-900">{form.customer?.whatsapp || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
              <span className="text-xs font-bold text-slate-900">{form.customer?.email || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Address</span>
              <span className="text-xs font-bold text-slate-900 text-right">{form.customer?.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">City</span>
              <span className="text-xs font-bold text-slate-900">{form.customer?.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">GST No</span>
              <span className="text-xs font-bold text-slate-900">{form.customer?.gstNo || '-'}</span>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-white" />
            <span className="text-white text-xs font-bold uppercase">Service Details</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Service Type</span>
              <span className="text-xs font-bold text-slate-900">{form.serviceCategory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Branch</span>
              <span className="text-xs font-bold text-slate-900">{form.branchId?.branchName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Employee</span>
              <span className="text-xs font-bold text-slate-900">{form.employeeId?.name || 'Not Assigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pest Services</span>
              <span className="text-xs font-bold text-slate-900">{form.amcServices?.join(', ') || '-'}</span>
            </div>
          </div>
        </div>

        {/* Treatment Details */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-amber-600 px-4 py-2 flex items-center gap-2">
            <Building2 size={14} className="text-white" />
            <span className="text-white text-xs font-bold uppercase">Treatment Details</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Construction Phase</span>
              <span className="text-xs font-bold text-slate-900">{form.attDetails?.constructionPhase || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Treatment Type</span>
              <span className="text-xs font-bold text-slate-900">{form.attDetails?.treatmentType || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Chemical</span>
              <span className="text-xs font-bold text-slate-900">{form.attDetails?.chemical || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Method</span>
              <span className="text-xs font-bold text-slate-900">{form.attDetails?.method || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Base</span>
              <span className="text-xs font-bold text-slate-900">{form.attDetails?.base || '-'}</span>
            </div>
          </div>
        </div>

        {/* Premises Details */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-purple-600 px-4 py-2 flex items-center gap-2">
            <Home size={14} className="text-white" />
            <span className="text-white text-xs font-bold uppercase">Premises Details</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Type</span>
              <span className="text-xs font-bold text-slate-900">{form.premises?.type || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Floors</span>
              <span className="text-xs font-bold text-slate-900">{form.premises?.floors || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Rooms</span>
              <span className="text-xs font-bold text-slate-900">{form.premises?.rooms || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Measurement</span>
              <span className="text-xs font-bold text-slate-900">{form.premises?.measurement || '-'}</span>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-blue-600 px-4 py-2 flex items-center gap-2">
            <Calendar size={14} className="text-white" />
            <span className="text-white text-xs font-bold uppercase">Schedule</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Type</span>
              <span className="text-xs font-bold text-slate-900">{form.schedule?.type || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Date</span>
              <span className="text-xs font-bold text-slate-900">{form.schedule?.date || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Time</span>
              <span className="text-xs font-bold text-slate-900">{form.schedule?.time || '-'}</span>
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-emerald-600 px-4 py-2 flex items-center gap-2">
            <IndianRupee size={14} className="text-white" />
            <span className="text-white text-xs font-bold uppercase">Billing</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Amount</span>
              <span className="text-xs font-bold text-slate-900">₹{form.billing?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Discount</span>
              <span className="text-xs font-bold text-slate-900">₹{form.billing?.discount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Advance Paid</span>
              <span className="text-xs font-bold text-emerald-600">₹{form.billing?.advance || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Balance Due</span>
              <span className="text-xs font-bold text-amber-600">₹{form.billing?.due || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Mode</span>
              <span className="text-xs font-bold text-slate-900">{form.billing?.paymentMode || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Detail</span>
              <span className="text-xs font-bold text-slate-900">{form.billing?.paymentDetail || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logistics - Only for field staff */}
      {isFieldStaff && form.logistics && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 px-4 py-2 flex items-center gap-2">
            <Truck size={14} className="text-white" />
            <span className="text-white text-xs font-bold uppercase">Logistics</span>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Vehicle No</span>
              <span className="text-xs font-bold text-slate-900">{form.logistics?.vehicleNo || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Start KM</span>
              <span className="text-xs font-bold text-slate-900">{form.logistics?.startMeter || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">End KM</span>
              <span className="text-xs font-bold text-slate-900">{form.logistics?.endMeter || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total KM</span>
              <span className="text-xs font-bold text-slate-900">
                {form.logistics?.endMeter && form.logistics?.startMeter 
                  ? parseInt(form.logistics.endMeter) - parseInt(form.logistics.startMeter) 
                  : '-'}
              </span>
            </div>
           </div>
         </div>
       )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
            <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Receipt size={18} /> Generate Receipt
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold">{form.customer?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Amount:</span>
                  <span className="font-bold">₹{(form.pricing?.finalAmount || form.billing?.total || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Amount Received *
                </label>
                <input
                  type="number"
                  value={paymentData.advancePaid}
                  onChange={(e) => setPaymentData({ ...paymentData, advancePaid: e.target.value })}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Payment Mode *
                </label>
                <select
                  value={paymentData.paymentMode}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
                >
                  {PAYMENT_MODES.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={paymentData.transactionId}
                  onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                  placeholder="UPI Ref / Transaction No"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Payment Screenshot (Optional)
                </label>
                <input
                  type="file"
                  ref={screenshotRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                />
                {screenshotPreview ? (
                  <div className="relative">
                    <img src={screenshotPreview} alt="Payment" className="w-full h-40 object-cover rounded-xl border-2 border-emerald-200" />
                    <button
                      onClick={handleRemoveScreenshot}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => screenshotRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                  >
                    <Camera size={28} className="text-slate-400 mb-2" />
                    <span className="text-sm text-slate-500">Tap to capture payment screenshot</span>
                  </button>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="Any notes..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none resize-none focus:border-emerald-500"
                  rows="2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateReceipt}
                  disabled={generateReceiptMutation.isPending}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generateReceiptMutation.isPending ? 'Generating...' : (
                    <> <Receipt size={16} /> Generate Receipt </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FormDetail;
