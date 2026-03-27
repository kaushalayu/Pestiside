import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Download, ArrowLeft, Calendar, User, Phone, 
  MapPin, ShieldCheck, Layers, PenTool, IndianRupee, Printer, Mail,
  CheckCircle2, Clock
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const FormDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: form, isLoading, error } = useQuery({
    queryKey: ['form', id],
    queryFn: async () => (await api.get(`/forms/${id}`)).data.data
  });

  const handleDownloadPdf = async () => {
    try {
      const response = await api.get(`/forms/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `JobCard_${form.orderNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('Audit Copy Generated');
    } catch (err) {
      toast.error('PDF Generation Fault');
    }
  };

  if (isLoading) return (
    <div className="flex flex-col h-[70vh] items-center justify-center gap-4">
       <div className="w-10 h-10 border-4 border-slate-100 border-t-brand-500 rounded-full animate-spin"></div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retrieving Digital Asset...</p>
    </div>
  );

  if (error || !form) return (
    <div className="p-10 text-center space-y-4">
       <FileText size={40} className="mx-auto text-slate-200" />
       <h2 className="text-xl font-black text-slate-900 uppercase">Operational Asset Missing</h2>
       <button onClick={() => navigate('/forms')} className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg">Return to Archive</button>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20 font-sans">
      
      {/* Audit Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
           <button onClick={() => navigate('/forms')} className="p-3 bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-900 rounded-xl transition-all">
              <ArrowLeft size={20} />
           </button>
           <div>
              <div className="flex items-center gap-3">
                 <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{form.orderNo}</h1>
                 <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${
                    form.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    'bg-blue-50 text-blue-600 border-blue-100'
                 }`}>
                    {form.status}
                 </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Verified Operational Audit Review</p>
           </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <button 
              onClick={handleDownloadPdf}
              className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-black active:scale-95 flex items-center justify-center gap-3 border-b-4 border-slate-700"
           >
              <Download size={16} /> Print Audit Log
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Left Col: Core Intelligence */}
        <div className="md:col-span-12 lg:col-span-8 space-y-10">
           
           {/* Subject Profile */}
           <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5"><User size={80} /></div>
              <div className="flex items-center gap-3 mb-8">
                 <div className="p-2 bg-brand-50 text-brand-600 rounded-lg"><User size={16} /></div>
                 <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Personnel Subject Identification</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject Name</p>
                    <p className="text-xl font-black text-slate-900 uppercase">{form.customer?.title} {form.customer?.name}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Authenticated Phone</p>
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                       <Phone size={14} className="text-brand-600" /> {form.customer?.phone}
                    </div>
                 </div>
                 <div className="md:col-span-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Operational Address</p>
                    <div className="flex items-start gap-2 text-slate-700 font-bold italic text-sm">
                       <MapPin size={16} className="text-slate-300 mt-1 shrink-0" />
                       <span>{form.customer?.address}, {form.customer?.city}</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Operational Analytics */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-slate-900 text-white rounded-lg"><PenTool size={16} /></div>
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Deployment Parameters</h3>
                 </div>
                 <div className="space-y-6">
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                       <span className="text-[9px] font-black text-slate-400 uppercase">Sector</span>
                       <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{form.serviceCategory}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                       <span className="text-[9px] font-black text-slate-400 uppercase">Deployment</span>
                       <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{form.attDetails?.method}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-200">
                       <span className="text-[9px] font-black text-slate-400 uppercase">Resource</span>
                       <span className="text-[11px] font-black text-brand-600 uppercase tracking-tight">{form.attDetails?.chemical}</span>
                    </div>
                 </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-50 text-brand-600 rounded-lg"><ShieldCheck size={16} /></div>
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Vector Control List</h3>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {form.amcServices?.map(pest => (
                      <span key={pest} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tight border border-slate-200">
                        {pest}
                      </span>
                    )) || <span className="text-[10px] text-slate-400 italic font-bold">General Treatment Program</span>}
                 </div>
              </div>
           </div>
        </div>

        {/* Right Col: Financial & Auth */}
        <div className="md:col-span-12 lg:col-span-4 space-y-10">
           
           {/* Financial Audit */}
           <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white relative overflow-hidden border-2 border-slate-800">
              <div className="absolute -right-4 -top-4 opacity-5"><IndianRupee size={120} /></div>
              <div className="flex items-center gap-3 mb-8">
                 <div className="p-2 bg-white/10 text-white rounded-lg"><IndianRupee size={16} /></div>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ledger Settlement</h3>
              </div>
              <div className="space-y-6">
                 <div>
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 leading-none">Total Value</p>
                    <p className="text-4xl font-black text-white leading-none">₹{form.billing?.total?.toLocaleString()}</p>
                 </div>
                 <div className="pt-6 border-t border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Advance Recv</span>
                       <span className="text-xs font-black text-emerald-400">₹{form.billing?.advance || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Balance Due</span>
                       <span className="text-xs font-black text-red-400">₹{form.billing?.due || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Payment Vector</span>
                       <span className="text-[10px] font-black text-white uppercase tracking-tighter bg-white/5 px-2 py-1 rounded-md">{form.billing?.paymentMode}</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Validation Proofs */}
           <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 space-y-10">
              <div>
                 <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-slate-50 text-slate-400 rounded-lg"><ShieldCheck size={14} /></div>
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Personnel Proofs</h3>
                 </div>
                 <div className="space-y-8">
                    <div className="space-y-3">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic leading-none mb-1">Technician Stamp</p>
                       <div className="h-32 bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-center p-4">
                          {form.signatures?.employeeSignature ? (
                            <img src={form.signatures.employeeSignature} alt="Tech Sig" className="max-h-full max-w-full mix-blend-multiply opacity-80" />
                          ) : (
                            <span className="text-[9px] text-slate-300 italic">Signature Not Recorded</span>
                          )}
                       </div>
                    </div>
                    <div className="space-y-3">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic leading-none mb-1">Subject Agreement</p>
                       <div className="h-32 bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-center p-4">
                          {form.signatures?.customerSignature ? (
                            <img src={form.signatures.customerSignature} alt="Cust Sig" className="max-h-full max-w-full mix-blend-multiply opacity-80" />
                          ) : (
                            <span className="text-[9px] text-slate-300 italic">Signature Not Recorded</span>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FormDetail;
