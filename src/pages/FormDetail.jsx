import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  FileText, Download, ArrowLeft, User, Phone, 
  MapPin, ShieldCheck, PenTool, IndianRupee,
  CheckCircle2, Clock, Calendar, Truck, Building2, Home
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['DRAFT', 'SUBMITTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];

const STATUS_CONFIG = {
  DRAFT: { color: 'bg-slate-100 text-slate-600 border-slate-200', next: 'SUBMITTED', label: 'Draft' },
  SUBMITTED: { color: 'bg-blue-50 text-blue-600 border-blue-100', next: 'SCHEDULED', label: 'Submitted' },
  SCHEDULED: { color: 'bg-amber-50 text-amber-600 border-amber-100', next: 'COMPLETED', label: 'Scheduled' },
  COMPLETED: { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', next: null, label: 'Completed' },
  CANCELLED: { color: 'bg-red-50 text-red-600 border-red-100', next: null, label: 'Cancelled' },
};

const FormDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector(state => state.auth);
  const isFieldStaff = user?.role === 'technician' || user?.role === 'sales';

  const { data: form, isLoading, error } = useQuery({
    queryKey: ['form', id],
    queryFn: async () => (await api.get(`/forms/${id}`)).data.data
  });

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
        </div>
      </div>

      {/* Status Update */}
      <div className="bg-slate-800 p-4 rounded-xl flex items-center gap-2 flex-wrap">
         <span className="text-white text-xs font-bold uppercase mr-2">Update Status:</span>
         {STATUS_OPTIONS.map(status => {
           const info = STATUS_CONFIG[status];
           const isCurrent = status === currentStatus;
           const isNext = statusInfo.next === status;
           
           return (
             <button
               key={status}
               disabled={statusMutation.isPending || isCurrent || (!isNext && status !== currentStatus)}
               onClick={() => statusMutation.mutate({ status })}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                 isCurrent 
                   ? `${info.color} border-2 cursor-default` 
                   : isNext 
                     ? 'bg-emerald-500 text-white hover:bg-emerald-400' 
                     : 'bg-slate-700 text-slate-500 cursor-not-allowed'
               }`}
             >
               {info.label}
             </button>
           );
         })}
      </div>

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

    </div>
  );
};

export default FormDetail;
