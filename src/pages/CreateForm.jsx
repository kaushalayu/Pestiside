import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import SignaturePad from '../components/SignaturePad';
import { 
  FileText, Save, CheckCircle2, IndianRupee, PenTool, 
  MapPin, Phone, Mail, Building2, User, Layers, Home, Tag, 
  ChevronLeft, Camera, Truck, Calendar, Clock, Car, XCircle, CheckSquare
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const Label = ({ children, className = '' }) => (
  <label className={`text-[9px] font-bold text-slate-600 uppercase tracking-wider block mb-1 ${className}`}>{children}</label>
);

const Input = ({ className = '', ...props }) => (
  <input 
    {...props} 
    className={`w-full bg-white border border-slate-200 focus:border-slate-900 px-3 py-2 rounded-md text-xs font-medium outline-none transition-all placeholder:text-slate-300 ${className}`} 
  />
);

const Select = ({ className = '', ...props }) => (
  <select 
    {...props} 
    className={`w-full bg-white border border-slate-200 focus:border-slate-900 px-3 py-2 rounded-md text-xs font-medium outline-none transition-all ${className}`} 
  />
);

const CheckboxGroup = ({ options, selected, onChange }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
    {options.map(opt => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={`flex items-center gap-2 px-3 py-2 rounded-md border text-[10px] font-medium transition-all ${
          selected.includes(opt) 
            ? 'bg-slate-900 border-slate-900 text-white' 
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
        }`}
      >
        {selected.includes(opt) ? <CheckSquare size={12} /> : <XCircle size={12} />}
        {opt}
      </button>
    ))}
  </div>
);

const CreateForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    branchId: '',
    customer: { title: 'Mr.', name: '', address: '', city: '', gstNo: '', phone: '', whatsapp: '', email: '' },
    serviceCategory: 'Residential',
    attDetails: { constructionPhase: '', treatmentType: '', chemical: '', method: 'Drill', base: 'Water' },
    amcServices: [],
    premises: { type: '', floors: '', otherArea: '', measurement: '', rooms: '' },
    schedule: { type: 'Single', date: '', time: '' },
    billing: { paymentMode: 'Cash', advance: '', due: '', total: '', discount: '', paymentDetail: '' },
    contract: { contractNo: '', period: '', warranty: '' },
    signatures: { employeeSignature: null, customerSignature: null },
    logistics: { vehicleNo: '', startMeter: '', endMeter: '', startMeterPhoto: '', endMeterPhoto: '' }
  });

  const [uploadState, setUploadState] = useState({ start: false, end: false });
  const startFileRef = useRef(null);
  const endFileRef = useRef(null);

  useEffect(() => {
    if (user?.role !== 'super_admin' && user?.branchId) {
       const bId = (typeof user.branchId === 'object' && user.branchId?._id) 
           ? user.branchId._id 
           : (typeof user.branchId === 'string' ? user.branchId : null);
       
       if (bId) setFormData(prev => ({ ...prev, branchId: bId }));
    }
  }, [user]);

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await api.get('/branches')).data.data,
    enabled: user?.role === 'super_admin'
  });

  const sigPadRefEmp = useRef(null);
  const sigPadRefCust = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const pestOptions = ['Cockroaches', 'Ants', 'Spider', 'Mosquito', 'Flies', 'Lizard', 'Rodent', 'Vector', 'Bed Bugs', 'Wood Borer', 'Fumigation', 'Others'];
  const serviceOptions = ['Residential', 'Commercial', 'Industrial'];
  const scheduleOptions = ['Single', 'One Time', 'Monthly', 'Yearly'];
  const pMethodOptions = ['Drill', 'Fill', 'Seal'];
  const paymentModes = ['Cash', 'Cheque', 'NEFT', 'Online', 'Pending'];
  const premisesTypes = ['Bunglow', 'Flat', 'Building', 'Office', 'Factory', 'Warehouse', 'Hotel', 'Restaurant', 'Hospital', 'School', 'Other'];
  const constructionPhases = ['New Construction', 'Renovation', 'Existing Building', 'Vacant', 'Occupied'];
  const treatmentTypes = ['Pre-Construction', 'Post-Construction', 'General Pest Control', 'Termite Control', 'Fumigation'];
  const warrantyOptions = ['1 Month', '3 Months', '6 Months', '1 Year', '2 Years', 'No Warranty'];
  const periods = ['1 Month', '3 Months', '6 Months', '1 Year', '2 Years', '3 Years'];

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev, [section]: { ...prev[section], [field]: value }
    }));
  };

  const handlePestToggle = (pest) => {
    setFormData(prev => {
      const exists = prev.amcServices.includes(pest);
      return {
        ...prev,
        amcServices: exists 
          ? prev.amcServices.filter(p => p !== pest) 
          : [...prev.amcServices, pest]
      };
    });
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setUploadState(prev => ({ ...prev, [type]: true }));
    try {
      const res = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      handleNestedChange('logistics', `${type}MeterPhoto`, res.data.data);
      toast.success(`${type.toUpperCase()} proof appended`);
    } catch (err) {
      toast.error('Evidence logic fault');
    } finally {
      setUploadState(prev => ({ ...prev, [type]: false }));
    }
  };

  const mutation = useMutation({
    mutationFn: (payload) => api.post('/forms', payload),
    onSuccess: () => {
      toast.success('Service Record Generated');
      queryClient.invalidateQueries(['forms']);
      navigate('/forms');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Data integrity violation');
      setIsLoading(false);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.branchId) {
       toast.error('Security Context Requirement: Select/Verify active branch');
       return;
    }

    setIsLoading(true);
    const empSig = sigPadRefEmp.current?.getTrimmedCanvas()?.toDataURL('image/png');
    const custSig = sigPadRefCust.current?.getTrimmedCanvas()?.toDataURL('image/png');

    if (!empSig || !custSig) {
      toast.error('Consingee & Tech Signatures Required');
      setIsLoading(false);
      return;
    }

    mutation.mutate({ ...formData, signatures: { employeeSignature: empSig, customerSignature: custSig } });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-4">
           <ChevronLeft size={16} /> <span className="text-[10px] font-bold uppercase tracking-wider">Back to Archive</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-4 md:px-6 space-y-4">
        {user?.role === 'super_admin' && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={14} className="text-amber-600" />
              <Label className="text-amber-700 mb-0">Branch Authorization</Label>
            </div>
            <Select 
              className="max-w-md"
              value={formData.branchId}
              onChange={e => setFormData({...formData, branchId: e.target.value})}
              required
            >
               <option value="">-- Select Branch --</option>
               {branches?.map(b => (
                 <option key={b._id} value={b._id}>{b.branchName} ({b.cityPrefix})</option>
               ))}
            </Select>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-white" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wider">Service Job Card</h1>
            </div>
            <div className="text-[10px] font-medium text-slate-400 uppercase">
              {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <Label className="mb-0">Customer Details</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Select value={formData.customer.title} onChange={e => handleNestedChange('customer', 'title', e.target.value)}>
                     <option>Mr.</option><option>Mrs.</option><option>Ms.</option><option>M/S</option>
                  </Select>
                  <Input className="sm:col-span-2" value={formData.customer.name} onChange={e => handleNestedChange('customer', 'name', e.target.value)} placeholder="Customer Name" required />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                  <Input className="pl-10" value={formData.customer.address} onChange={e => handleNestedChange('customer', 'address', e.target.value)} placeholder="Address" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input value={formData.customer.city} onChange={e => handleNestedChange('customer', 'city', e.target.value)} placeholder="City" required />
                  <Input value={formData.customer.gstNo} onChange={e => handleNestedChange('customer', 'gstNo', e.target.value)} placeholder="GST No (Optional)" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                    <Input className="pl-10" value={formData.customer.phone} onChange={e => handleNestedChange('customer', 'phone', e.target.value)} placeholder="Phone" required />
                  </div>
                  <Input value={formData.customer.whatsapp} onChange={e => handleNestedChange('customer', 'whatsapp', e.target.value)} placeholder="WhatsApp (Optional)" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                  <Input type="email" className="pl-10" value={formData.customer.email} onChange={e => handleNestedChange('customer', 'email', e.target.value)} placeholder="Email (Optional)" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <PenTool size={14} className="text-slate-400" />
                  <Label className="mb-0">Service Details</Label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {serviceOptions.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData({...formData, serviceCategory: opt})}
                      className={`py-2 rounded-md text-[10px] font-bold uppercase transition-all ${
                        formData.serviceCategory === opt ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select value={formData.attDetails.constructionPhase} onChange={e => handleNestedChange('attDetails', 'constructionPhase', e.target.value)}>
                     <option value="">Construction Phase</option>
                     {constructionPhases.map(phase => <option key={phase} value={phase}>{phase}</option>)}
                  </Select>
                  <Select value={formData.attDetails.treatmentType} onChange={e => handleNestedChange('attDetails', 'treatmentType', e.target.value)}>
                     <option value="">Treatment Type</option>
                     {treatmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Select value={formData.attDetails.base} onChange={e => handleNestedChange('attDetails', 'base', e.target.value)}>
                     <option>Water</option><option>Oil</option><option>Gel</option>
                  </Select>
                  <Select value={formData.attDetails.method} onChange={e => handleNestedChange('attDetails', 'method', e.target.value)}>
                     {pMethodOptions.map(m => <option key={m}>{m}</option>)}
                  </Select>
                  <Input value={formData.attDetails.chemical} onChange={e => handleNestedChange('attDetails', 'chemical', e.target.value)} placeholder="Chemical" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
            <Layers size={14} className="text-white" />
            <Label className="mb-0 text-white">Pest Control Services</Label>
          </div>
          <div className="p-4">
            <CheckboxGroup options={pestOptions} selected={formData.amcServices} onChange={handlePestToggle} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
            <Home size={14} className="text-white" />
            <Label className="mb-0 text-white">Premises Details</Label>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div>
                <Label>Property Type</Label>
                <Select value={formData.premises.type} onChange={e => handleNestedChange('premises', 'type', e.target.value)}>
                   <option value="">Select</option>
                   {premisesTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div>
                <Label>Floors</Label>
                <Input type="number" value={formData.premises.floors} onChange={e => handleNestedChange('premises', 'floors', e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Rooms</Label>
                <Input type="number" value={formData.premises.rooms} onChange={e => handleNestedChange('premises', 'rooms', e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Other Area</Label>
                <Input type="number" value={formData.premises.otherArea} onChange={e => handleNestedChange('premises', 'otherArea', e.target.value)} placeholder="Sqft" />
              </div>
              <div>
                <Label>Total Area</Label>
                <Input type="number" value={formData.premises.measurement} onChange={e => handleNestedChange('premises', 'measurement', e.target.value)} placeholder="Sqft" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
            <Calendar size={14} className="text-white" />
            <Label className="mb-0 text-white">Schedule</Label>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Service Type</Label>
                <div className="grid grid-cols-2 gap-2">
                   {scheduleOptions.map(opt => (
                     <button
                       key={opt}
                       type="button"
                       onClick={() => handleNestedChange('schedule', 'type', opt)}
                       className={`py-2 rounded-md text-[10px] font-bold uppercase transition-all ${
                         formData.schedule.type === opt ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                       }`}
                     >
                       {opt}
                     </button>
                   ))}
                </div>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={formData.schedule.date} onChange={e => handleNestedChange('schedule', 'date', e.target.value)} />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={formData.schedule.time} onChange={e => handleNestedChange('schedule', 'time', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
              <Truck size={14} className="text-white" />
              <Label className="mb-0 text-white">Logistics</Label>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <Label>Vehicle Number</Label>
                <Input value={formData.logistics.vehicleNo} onChange={e => handleNestedChange('logistics', 'vehicleNo', e.target.value)} placeholder="DL XX XX XXXX" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start KM</Label>
                  <Input type="number" value={formData.logistics.startMeter} onChange={e => handleNestedChange('logistics', 'startMeter', e.target.value)} placeholder="Start KM" />
                  <input type="file" ref={startFileRef} hidden accept="image/*" onChange={e => handleFileUpload(e, 'start')} />
                  <button type="button" onClick={() => startFileRef.current.click()} className="w-full h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center gap-2 hover:border-slate-400 transition-all bg-slate-50">
                    {formData.logistics.startMeterPhoto ? (
                      <img src={`${api.defaults.baseURL.replace('/api', '')}${formData.logistics.startMeterPhoto}`} className="w-full h-full object-cover rounded-lg" alt="Start" />
                    ) : (
                      <>
                        <Camera size={16} className="text-slate-300" />
                        <span className="text-[9px] font-medium text-slate-400">Start Photo</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="space-y-2">
                  <Label>End KM</Label>
                  <Input type="number" value={formData.logistics.endMeter} onChange={e => handleNestedChange('logistics', 'endMeter', e.target.value)} placeholder="End KM" />
                  <input type="file" ref={endFileRef} hidden accept="image/*" onChange={e => handleFileUpload(e, 'end')} />
                  <button type="button" onClick={() => endFileRef.current.click()} className="w-full h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center gap-2 hover:border-slate-400 transition-all bg-slate-50">
                    {formData.logistics.endMeterPhoto ? (
                      <img src={`${api.defaults.baseURL.replace('/api', '')}${formData.logistics.endMeterPhoto}`} className="w-full h-full object-cover rounded-lg" alt="End" />
                    ) : (
                      <>
                        <Camera size={16} className="text-slate-300" />
                        <span className="text-[9px] font-medium text-slate-400">End Photo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
              <IndianRupee size={14} className="text-white" />
              <Label className="mb-0 text-white">Billing</Label>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <Label>Total Amount</Label>
                <Input type="number" value={formData.billing.total} onChange={e => handleNestedChange('billing', 'total', e.target.value)} placeholder="0.00" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Discount</Label>
                  <Input type="number" value={formData.billing.discount} onChange={e => handleNestedChange('billing', 'discount', e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label>Advance</Label>
                  <Input type="number" value={formData.billing.advance} onChange={e => handleNestedChange('billing', 'advance', e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div>
                <Label>Balance Due</Label>
                <Input type="number" value={formData.billing.due} onChange={e => handleNestedChange('billing', 'due', e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Payment Mode</Label>
                <div className="flex flex-wrap gap-2">
                   {paymentModes.map(mode => (
                     <button
                       key={mode}
                       type="button"
                       onClick={() => handleNestedChange('billing', 'paymentMode', mode)}
                       className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                         formData.billing.paymentMode === mode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                       }`}
                     >
                       {mode}
                     </button>
                   ))}
                </div>
              </div>
              <Input value={formData.billing.paymentDetail} onChange={e => handleNestedChange('billing', 'paymentDetail', e.target.value)} placeholder="Payment Details (Optional)" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
            <Tag size={14} className="text-white" />
            <Label className="mb-0 text-white">Contract Details</Label>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Contract No</Label>
                <Input value={formData.contract.contractNo} onChange={e => handleNestedChange('contract', 'contractNo', e.target.value)} placeholder="Contract No (Optional)" />
              </div>
              <div>
                <Label>Contract Period</Label>
                <Select value={formData.contract.period} onChange={e => handleNestedChange('contract', 'period', e.target.value)}>
                   <option value="">Select Period</option>
                   {periods.map(p => <option key={p} value={p}>{p}</option>)}
                </Select>
              </div>
              <div>
                <Label>Warranty</Label>
                <Select value={formData.contract.warranty} onChange={e => handleNestedChange('contract', 'warranty', e.target.value)}>
                   <option value="">Select Warranty</option>
                   {warrantyOptions.map(w => <option key={w} value={w}>{w}</option>)}
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
            <FileText size={14} className="text-white" />
            <Label className="mb-0 text-white">Signatures</Label>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label>Technician Signature</Label>
                <div className="border-2 border-slate-200 rounded-lg bg-slate-50 h-28 overflow-hidden">
                   <SignaturePad ref={sigPadRefEmp} penColor="#0f172a" />
                </div>
                <button type="button" onClick={() => sigPadRefEmp.current?.clear()} className="mt-1 text-[9px] font-medium text-red-500 hover:text-red-700">Clear</button>
              </div>
              <div>
                <Label>Customer Signature</Label>
                <div className="border-2 border-slate-200 rounded-lg bg-slate-50 h-28 overflow-hidden">
                   <SignaturePad ref={sigPadRefCust} penColor="#0f172a" />
                </div>
                <button type="button" onClick={() => sigPadRefCust.current?.clear()} className="mt-1 text-[9px] font-medium text-red-500 hover:text-red-700">Clear</button>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-4">
          <button 
             disabled={isLoading} 
             type="submit" 
             className="w-full py-4 bg-slate-900 text-white rounded-lg font-bold uppercase text-xs tracking-wider hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
          >
             {isLoading ? 'Processing...' : 'Generate Service Record'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateForm;
