import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const CheckboxGroup = ({ options, selected, onChange, prices = {} }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
    {options.map(opt => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={`flex items-center justify-between px-3 py-2 rounded-md border text-[10px] font-medium transition-all ${
          selected.includes(opt) 
            ? 'bg-slate-900 border-slate-900 text-white' 
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
        }`}
      >
        <span className="flex items-center gap-2">
          {selected.includes(opt) ? <CheckSquare size={12} /> : <XCircle size={12} />}
          {opt}
        </span>
        {prices[opt] && (
          <span className={`text-[9px] font-bold ${selected.includes(opt) ? 'text-emerald-300' : 'text-emerald-600'}`}>
            ₹{prices[opt]}
          </span>
        )}
      </button>
    ))}
  </div>
);

const CreateForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector(state => state.auth);
  const isFieldStaff = user?.role === 'technician' || user?.role === 'sales';
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  const [formData, setFormData] = useState({
    branchId: '',
    customerId: '',
    customer: { title: 'Mr.', name: '', address: '', city: '', gstNo: '', phone: '', whatsapp: '', email: '' },
    serviceCategory: 'Residential',
    reference: 'Walk-in',
    attDetails: { constructionPhase: '', treatmentType: '', chemical: '', method: 'Drill', base: 'Water' },
    amcServices: [],
    premises: { type: '', floors: '', otherArea: '', measurement: '', rooms: '' },
    schedule: { type: 'Single', date: '', time: '' },
    billing: { paymentMode: 'Cash', advance: '', due: '', total: '', discount: '', paymentDetail: '', transactionNo: '', paymentImage: '' },
    contract: { contractNo: '', period: '', warranty: '', startDate: '', endDate: '' },
    signatures: { employeeSignature: null, customerSignature: null },
    logistics: { vehicleNo: '', startMeter: '', endMeter: '', startMeterPhoto: '', endMeterPhoto: '' }
  });

  const [serviceRates, setServiceRates] = useState({});
  const [, setPaymentProofFile] = useState(null);
  const [, setIsUploadingProof] = useState(false);
  const [, setUploadState] = useState({ start: false, end: false });
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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
    enabled: user?.role === 'super_admin' || user?.role === 'branch_admin'
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: async () => {
      if (customerSearch.length < 2) return [];
      const res = await api.get(`/customers?search=${customerSearch}&limit=20`);
      return res.data.data;
    },
    enabled: customerSearch.length >= 2
  });

  const handleSelectCustomer = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer._id,
      customer: {
        ...prev.customer,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        city: customer.city || '',
        gstNo: customer.gstNo || ''
      }
    }));
    setSelectedCustomerId(customer._id);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  };

  const { data: rateData } = useQuery({
    queryKey: ['serviceRates', formData.serviceCategory, formData.branchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('category', formData.serviceCategory);
      if (formData.branchId) params.append('branchId', formData.branchId);
      const res = await api.get(`/service-rates?${params.toString()}`);
      return res.data.data;
    },
    enabled: !!formData.serviceCategory
  });

  useEffect(() => {
    if (rateData && rateData.length > 0) {
      const ratesMap = {};
      rateData.forEach(r => { ratesMap[r.serviceName] = r.price; });
      setServiceRates(ratesMap);
    }
  }, [rateData]);

  const sigPadRefEmp = useRef(null);
  const sigPadRefCust = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const pestOptions = ['Cockroaches', 'Ants', 'Spider', 'Mosquito', 'Flies', 'Lizard', 'Rodent', 'Vector', 'Bed Bugs', 'Wood Borer', 'Fumigation', 'Others'];
  const serviceOptions = ['Residential', 'Commercial', 'Industrial'];
  const referenceOptions = ['Company', 'Social Media', 'Website', 'Walk-in', 'Referral', 'Google', 'Facebook', 'Justdial', 'Other'];
  const scheduleOptions = ['Single', 'One Time', 'Monthly', 'Yearly'];
  const pMethodOptions = ['Drill', 'Fill', 'Seal'];
  const paymentModes = ['Cash', 'Cheque', 'NEFT', 'Online', 'Wallet', 'Pending'];
  const premisesTypes = ['Bunglow', 'Flat', 'Building', 'Office', 'Factory', 'Warehouse', 'Hotel', 'Restaurant', 'Hospital', 'School', 'Other'];
  const constructionPhases = ['New Construction', 'Renovation', 'Existing Building', 'Vacant', 'Occupied'];
  const treatmentTypes = ['Pre-Construction', 'Post-Construction', 'General Pest Control', 'Termite Control', 'Fumigation'];
  const warrantyOptions = ['1 Month', '3 Months', '6 Months', '1 Year', '2 Years', 'No Warranty'];


  const calculateBilling = (currentForm) => {
    let serviceTotal = 0;
    currentForm.amcServices.forEach(service => {
      serviceTotal += serviceRates[service] || 0;
    });
    
    const area = parseFloat(currentForm.premises.measurement) || 0;
    const areaRatePerSqft = 2;
    const areaTotal = area * areaRatePerSqft;
    
    const subTotal = serviceTotal + areaTotal;
    const discount = parseFloat(currentForm.billing.discount) || 0;
    const advance = parseFloat(currentForm.billing.advance) || 0;
    const grandTotal = subTotal - discount;
    const due = Math.max(0, grandTotal - advance);
    
    return {
      serviceTotal,
      areaTotal,
      total: grandTotal,
      due
    };
  };

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [section]: { ...prev[section], [field]: value } };
      
      if (section === 'billing' && (field === 'discount' || field === 'advance')) {
        const billing = calculateBilling(updated);
        updated.billing.total = billing.total;
        updated.billing.due = billing.due;
      }
      
      if (section === 'premises' && field === 'measurement') {
        const billing = calculateBilling(updated);
        updated.billing.total = billing.total;
        updated.billing.due = billing.due;
      }
      
      return updated;
    });
  };

  const handlePestToggle = (pest) => {
    setFormData(prev => {
      const exists = prev.amcServices.includes(pest);
      const updated = {
        ...prev,
        amcServices: exists 
          ? prev.amcServices.filter(p => p !== pest) 
          : [...prev.amcServices, pest]
      };
      
      const billing = calculateBilling(updated);
      updated.billing.total = billing.total;
      updated.billing.due = billing.due;
      
      return updated;
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
    } catch {
      toast.error('Evidence logic fault');
    }
  };

  const handlePaymentProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingProof(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      handleNestedChange('billing', 'paymentImage', res.data.data);
      setPaymentProofFile(file);
      toast.success('Payment proof uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const mutation = useMutation({
    mutationFn: (payload) => {
      if (isEditing) {
        return api.put(`/forms/${editId}`, payload);
      }
      return api.post('/forms', payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Service Record Updated' : 'Service Record Generated');
      queryClient.invalidateQueries(['forms']);
      navigate('/forms');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Data integrity violation');
      setIsLoading(false);
    }
  });

  useEffect(() => {
    if (editId) {
      api.get(`/forms/${editId}`).then(res => {
        const form = res.data.data;
        setFormData({
          branchId: form.branchId?._id || form.branchId || '',
          customerId: form.customerId || '',
          customer: form.customer || { title: 'Mr.', name: '', address: '', city: '', gstNo: '', phone: '', whatsapp: '', email: '' },
          serviceCategory: form.serviceCategory || 'Residential',
          reference: form.reference || 'Walk-in',
          attDetails: form.attDetails || { constructionPhase: '', treatmentType: '', chemical: '', method: 'Drill', base: 'Water' },
          amcServices: form.amcServices || [],
          premises: form.premises || { type: '', floors: '', otherArea: '', measurement: '', rooms: '' },
          schedule: form.schedule || { type: 'Single', date: '', time: '' },
          billing: form.billing || { paymentMode: 'Cash', advance: '', due: '', total: '', discount: '', paymentDetail: '', transactionNo: '', paymentImage: '' },
          contract: form.contract || { contractNo: '', period: '', warranty: '', startDate: '', endDate: '' },
          signatures: { employeeSignature: null, customerSignature: null },
          logistics: form.logistics || { vehicleNo: '', startMeter: '', endMeter: '', startMeterPhoto: '', endMeterPhoto: '' }
        });
      }).catch(err => {
        toast.error('Failed to load form data');
        navigate('/forms');
      });
    }
  }, [editId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.branchId) {
       toast.error('Security Context Requirement: Select/Verify active branch');
       return;
    }

    if (!formData.customer.name || !formData.customer.phone) {
      toast.error('Customer details are required');
      return;
    }

    if (formData.amcServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmAndSubmit = () => {
    setIsLoading(true);
    const empSig = sigPadRefEmp.current?.getTrimmedCanvas()?.toDataURL('image/png');
    const custSig = sigPadRefCust.current?.getTrimmedCanvas()?.toDataURL('image/png');

    if (!empSig || !custSig) {
      toast.error('Consignee & Tech Signatures Required');
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
                
                <div className="relative">
                  <Label>Select Existing Customer</Label>
                  <Input 
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                      if (!e.target.value) {
                        setSelectedCustomerId('');
                        setFormData(prev => ({ ...prev, customerId: '' }));
                      }
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Search by name or phone..."
                  />
                  {showCustomerDropdown && customersData?.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {customersData.map(cust => (
                        <button
                          key={cust._id}
                          type="button"
                          onClick={() => handleSelectCustomer(cust)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 text-xs"
                        >
                          <span className="font-medium">{cust.name}</span>
                          <span className="text-slate-400 ml-2">{cust.phone}</span>
                          <span className="text-slate-400 ml-2 text-[10px]">{cust.city}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedCustomerId && (
                    <p className="text-[9px] text-emerald-600 mt-1">✓ Customer selected</p>
                  )}
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
                <div>
                  <Label>How did you hear about us?</Label>
                  <Select value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})}>
                    {referenceOptions.map(ref => <option key={ref} value={ref}>{ref}</option>)}
                  </Select>
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
            <CheckboxGroup options={pestOptions} selected={formData.amcServices} onChange={handlePestToggle} prices={serviceRates} />
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

        <div className={`grid grid-cols-1 gap-4 ${isFieldStaff ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
          {isFieldStaff && (
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
          )}

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 px-4 py-2 flex items-center gap-2">
              <IndianRupee size={14} className="text-white" />
              <Label className="mb-0 text-white">Billing</Label>
            </div>
            <div className="p-4 space-y-3">
              {(formData.amcServices.length > 0 || formData.premises.measurement) && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-md p-2 mb-2">
                  <p className="text-[9px] font-bold text-emerald-700 uppercase mb-1">Price Breakdown</p>
                  <div className="space-y-0.5">
                    {formData.amcServices.map(s => (
                      <div key={s} className="flex justify-between text-[10px]">
                        <span className="text-slate-600">{s}</span>
                        <span className="font-medium text-slate-900">₹{(serviceRates[s] || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    {formData.premises.measurement > 0 && (
                      <div className="flex justify-between text-[10px] pt-1 border-t border-emerald-200 mt-1">
                        <span className="text-slate-600">Area Charge ({formData.premises.measurement} sqft × ₹2)</span>
                        <span className="font-medium text-slate-900">₹{(formData.premises.measurement * 2).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px] font-bold pt-1 border-t border-emerald-200 mt-1">
                      <span className="text-slate-700">Sub Total</span>
                      <span className="text-slate-900">₹{((formData.amcServices.reduce((sum, s) => sum + (serviceRates[s] || 0), 0)) + (formData.premises.measurement * 2)).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <Label>Total Amount (After Discount)</Label>
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
              {formData.billing.paymentMode !== 'Cash' && formData.billing.paymentMode !== 'Pending' && (
                <>
                  <div>
                    <Label>Transaction / Reference No.</Label>
                    <Input 
                      value={formData.billing.transactionNo || ''} 
                      onChange={e => handleNestedChange('billing', 'transactionNo', e.target.value)} 
                      placeholder="Enter transaction number" 
                    />
                  </div>
                  <div>
                    <Label>Payment Proof (Screenshot/Image)</Label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePaymentProofUpload}
                      className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                    {formData.billing.paymentImage && (
                      <p className="text-[9px] text-emerald-600 mt-1">✓ Payment proof uploaded</p>
                    )}
                  </div>
                </>
              )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Contract No</Label>
                <Input value={formData.contract.contractNo} onChange={e => handleNestedChange('contract', 'contractNo', e.target.value)} placeholder="Contract No (Optional)" />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={formData.contract.startDate} onChange={e => handleNestedChange('contract', 'startDate', e.target.value)} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={formData.contract.endDate} onChange={e => handleNestedChange('contract', 'endDate', e.target.value)} />
              </div>
              <div>
                <Label>Warranty</Label>
                <Select value={formData.contract.warranty} onChange={e => handleNestedChange('contract', 'warranty', e.target.value)}>
                   <option value="">Select Warranty</option>
                   {warrantyOptions.map(w => <option key={w} value={w}>{w}</option>)}
                </Select>
              </div>
            </div>
            {formData.contract.startDate && formData.contract.endDate && (
              <div className="mt-3 text-[10px] text-slate-500">
                Contract Duration: {Math.ceil((new Date(formData.contract.endDate) - new Date(formData.contract.startDate)) / (1000 * 60 * 60 * 24))} days
              </div>
            )}
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
             {isLoading ? 'Processing...' : (isEditing ? 'Update Service Record' : 'Generate Service Record')}
          </button>
        </div>
      </form>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 px-6 py-4 rounded-t-xl">
              <h3 className="text-white font-bold uppercase text-sm">Confirm Service Booking</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-500 font-medium uppercase">Customer</p>
                  <p className="font-bold">{formData.customer.title} {formData.customer.name}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium uppercase">Phone</p>
                  <p className="font-bold">{formData.customer.phone}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium uppercase">Service Type</p>
                  <p className="font-bold">{formData.serviceCategory}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium uppercase">Reference</p>
                  <p className="font-bold">{formData.reference}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium uppercase">Schedule</p>
                  <p className="font-bold">{formData.schedule.type} - {formData.schedule.date}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500 font-medium uppercase">Services</p>
                  <p className="font-bold">{formData.amcServices.join(', ')}</p>
                </div>
                {formData.premises.measurement && (
                  <div className="col-span-2">
                    <p className="text-slate-500 font-medium uppercase">Area</p>
                    <p className="font-bold">{formData.premises.measurement} Sqft</p>
                  </div>
                )}
                {formData.contract.startDate && (
                  <div className="col-span-2">
                    <p className="text-slate-500 font-medium uppercase">Contract Period</p>
                    <p className="font-bold">{formData.contract.startDate} to {formData.contract.endDate}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Sub Total</span>
                  <span className="font-bold">₹{((formData.amcServices.reduce((sum, s) => sum + (serviceRates[s] || 0), 0)) + (formData.premises.measurement * 2)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Discount</span>
                  <span className="font-bold">-₹{(formData.billing.discount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Advance Paid</span>
                  <span className="font-bold">₹{(formData.billing.advance || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-emerald-200 pt-2 mt-2">
                  <span>Balance Due</span>
                  <span className="text-amber-600">₹{(formData.billing.due || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-bold uppercase text-xs hover:bg-slate-200"
                >
                  Edit Details
                </button>
                <button 
                  onClick={confirmAndSubmit}
                  disabled={mutation.isPending}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-bold uppercase text-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  {mutation.isPending ? 'Processing...' : 'Confirm & Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateForm;
