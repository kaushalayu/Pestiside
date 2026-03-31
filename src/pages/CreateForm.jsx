import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import SignaturePad from '../components/SignaturePad';
import { 
  FileText, User, MapPin, Phone, Mail, Building2, Layers, Home, Bug,
  ChevronLeft, Calendar, Clock, Tag, IndianRupee,
  Plus, Trash2, Calculator, CheckSquare, XCircle, Eye, Edit2, Search,
  Check, X, CreditCard, FileCheck, Send, ChevronDown, AlertCircle
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const Label = ({ children, className = '', required }) => (
  <label className={`text-sm font-semibold text-slate-700 block mb-1.5 ${className}`}>
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const Input = ({ className = '', ...props }) => (
  <input 
    {...props} 
    className={`w-full bg-white border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-slate-400 ${className}`} 
  />
);

const Select = ({ className = '', ...props }) => (
  <select 
    {...props} 
    className={`w-full bg-white border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all cursor-pointer ${className}`} 
  />
);

const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700'
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${styles[variant]}`}>
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

const CreateForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector(state => state.auth);
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  const [serviceType, setServiceType] = useState('AMC');
  const [serviceRates, setServiceRates] = useState({});
  const [formData, setFormData] = useState({
    branchId: '',
    customerId: '',
    customer: { title: 'Mr.', name: '', address: '', city: '', gstNo: '', phone: '', whatsapp: '', email: '' },
    serviceCategory: 'Residential',
    reference: 'Walk-in',
    referenceBy: '',
    attDetails: { 
      treatmentTypes: [], 
      chemicals: [], 
      methods: ['Drill'], 
      baseSolutions: ['Water Based'],
      constructionPhase: '',
      warranty: ''
    },
    amcServices: [],
    premises: { type: '', floors: [{ id: Date.now(), label: 'Floor 1', length: 0, width: 0, area: 0 }], totalArea: 0 },
    ratePerSqft: 0,
    perFloorExtra: 0,
    pricing: { baseAmount: 0, gstPercent: 18, gstAmount: 0, discountPercent: 0, discountAmount: 0, finalAmount: 0 },
    schedule: { type: 'One Time', date: '', time: '', period: 12, servicesPerMonth: 1, serviceCount: 1, intervalDays: 30, scheduledDates: [] },
    billing: { paymentMode: 'Cash', advance: '', due: '', paymentDetail: '', transactionNo: '', paymentImage: '' },
    contract: { agreementArea: '', ratePerSqft: '', period: '', warranty: '', startDate: '', endDate: '' },
    executive: { name: '', phone: '' },
    signatures: { employeeSignature: null, customerSignature: null },
    logistics: { vehicleNo: '', startMeter: '', endMeter: '', startMeterPhoto: '', endMeterPhoto: '' }
  });

  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const sigPadRefEmp = useRef(null);
  const sigPadRefCust = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const { data: rateData } = useQuery({
    queryKey: ['serviceRates', formData.serviceCategory, formData.branchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('category', formData.serviceCategory);
      if (formData.branchId) params.append('branchId', formData.branchId);
      const res = await api.get(`/service-rates?${params.toString()}`);
      return res.data.data;
    },
    enabled: !!formData.serviceCategory && !!formData.branchId
  });

  useEffect(() => {
    if (rateData && rateData.length > 0) {
      const ratesMap = {};
      rateData.forEach(r => { ratesMap[r.serviceName] = r.price; });
      setServiceRates(ratesMap);
    }
  }, [rateData]);

  // Recalculate pricing when serviceRates are loaded
  useEffect(() => {
    if (Object.keys(serviceRates).length > 0) {
      calculatePricing();
    }
  }, [serviceRates]);

  const getAutoRate = () => {
    if (formData.amcServices.length > 0 && Object.keys(serviceRates).length > 0) {
      return formData.amcServices.reduce((sum, service) => sum + (serviceRates[service] || 0), 0);
    }
    return 0;
  };

  // AMC Floor-wise calculation
  const getAMCFloorBreakdown = () => {
    if (serviceType !== 'AMC' && serviceType !== 'BOTH') return [];
    if (formData.amcServices.length === 0 || Object.keys(serviceRates).length === 0) return [];

    return formData.premises.floors.map(floor => {
      const floorBreakdown = formData.amcServices.map(service => ({
        service,
        rate: serviceRates[service] || 0,
        area: floor.area,
        amount: floor.area * (serviceRates[service] || 0)
      }));
      const floorTotal = floorBreakdown.reduce((sum, item) => sum + item.amount, 0);
      return {
        floorId: floor.id,
        floorLabel: floor.label,
        area: floor.area,
        breakdown: floorBreakdown,
        total: floorTotal
      };
    });
  };

  const getAMCTotal = () => {
    const breakdown = getAMCFloorBreakdown();
    return breakdown.reduce((sum, floor) => sum + floor.total, 0);
  };

  const pestOptions = ['Cockroaches', 'Ants', 'Spider', 'Mosquito', 'Flies', 'Lizard', 'Rodent', 'Vector', 'Bed Bugs', 'Wood Borer', 'Fumigation', 'Others'];
  const serviceOptions = ['Residential', 'Commercial', 'Industrial'];
  const referenceOptions = ['Company', 'Social Media', 'Website', 'Walk-in', 'Referral', 'Google', 'Facebook', 'Justdial', 'Other'];
  const scheduleOptions = ['One Time', 'Monthly', 'Yearly'];
  const pMethodOptions = ['Drill', 'Fill', 'Seal'];
  const paymentModes = ['Cash', 'Cheque', 'NEFT', 'Online', 'Wallet', 'Pending'];
  const premisesTypes = ['Bunglow', 'Flat', 'Building', 'Office', 'Factory', 'Warehouse', 'Hotel', 'Restaurant', 'Hospital', 'School', 'Other'];
  const warrantyOptions = ['No Warranty', '1 Year', '2 Years', '5 Years', 'Lifetime'];
  const attConstructionPhases = ['Pre-Construction', 'Post-Construction'];
  const attWarrantyOptions = ['No Warranty', '1 Month', '3 Months', '6 Months', '1 Year', '2 Years', '3 Years', '5 Years', '7 Years', '10 Years'];
  
  // ATT Options - Multiple selection
  const attTreatmentTypes = ['Side Treatment', 'Back Treatment', 'Plinth Treatment', 'Complete Treatment', 'RCC Treatment', 'Soil Treatment', 'Underground Treatment'];
  const attChemicals = ['Repellent', 'Non-Repellent', 'Chlorpyrifos', 'Imidacloprid', 'Fipronil', 'Bifenthrin', 'Cypermethrin'];
  const attMethods = ['Drill', 'Fill', 'Seal', 'Spray', 'Injection', 'Rodding'];
  const attBaseSolutions = ['Water Based', 'Oil Based', 'Emulsion Based'];

  const addFloor = () => {
    setFormData(prev => {
      const newFloor = { id: Date.now(), label: `Floor ${prev.premises.floors.length + 1}`, length: 0, width: 0, area: 0 };
      return { ...prev, premises: { ...prev.premises, floors: [...prev.premises.floors, newFloor] } };
    });
  };

  const removeFloor = (id) => {
    setFormData(prev => {
      const floors = prev.premises.floors.filter(f => f.id !== id);
      const totalArea = floors.reduce((sum, f) => sum + f.area, 0);
      return { ...prev, premises: { ...prev.premises, floors, totalArea } };
    });
    calculatePricing();
  };

  const updateFloor = (id, field, value) => {
    setFormData(prev => {
      const floors = prev.premises.floors.map(f => {
        if (f.id === id) {
          const updated = { ...f, [field]: parseFloat(value) || 0 };
          if (field === 'length' || field === 'width') {
            updated.area = Math.ceil(updated.length * updated.width);
          }
          return updated;
        }
        return f;
      });
      const totalArea = Math.ceil(floors.reduce((sum, f) => sum + f.area, 0));
      return { ...prev, premises: { ...prev.premises, floors, totalArea } };
    });
    calculatePricing();
  };

  const calculatePricing = () => {
    setFormData(prev => {
      const totalArea = prev.premises.totalArea;
      const noOfFloors = prev.premises.floors.length;
      const ratePerSqft = prev.ratePerSqft || 0;
      const perFloorExtra = prev.perFloorExtra || 0;
      const serviceCount = prev.schedule.serviceCount || 1;
      
      let amcAmount = 0;
      let attAmount = 0;
      
      // AMC: Rate per service × total services (multiplied by service count)
      if ((serviceType === 'AMC' || serviceType === 'BOTH') && prev.amcServices.length > 0 && Object.keys(serviceRates).length > 0) {
        const perServiceTotal = prev.premises.floors.reduce((total, floor) => {
          const floorTotal = prev.amcServices.reduce((sum, service) => {
            const serviceRate = serviceRates[service] || 0;
            return sum + (floor.area * serviceRate);
          }, 0);
          return total + floorTotal;
        }, 0);
        amcAmount = perServiceTotal * serviceCount;
      }
      
      // GPC: Rate per service × area (without multiplying by service count)
      if (serviceType === 'GPC' && prev.amcServices.length > 0 && Object.keys(serviceRates).length > 0) {
        amcAmount = prev.premises.floors.reduce((total, floor) => {
          const floorTotal = prev.amcServices.reduce((sum, service) => {
            const serviceRate = serviceRates[service] || 0;
            return sum + (floor.area * serviceRate);
          }, 0);
          return total + floorTotal;
        }, 0);
      }
      
      // ATT Calculation (manual rate per sqft)
      if ((serviceType === 'ATT' || serviceType === 'BOTH') && ratePerSqft > 0) {
        const areaAmount = Math.ceil(totalArea * ratePerSqft);
        const floorExtraAmount = Math.ceil(noOfFloors * perFloorExtra);
        attAmount = areaAmount + floorExtraAmount;
      }
      
      const baseAmount = amcAmount + attAmount;
      const gstAmount = Math.ceil(baseAmount * (prev.pricing.gstPercent || 18) / 100);
      const discountAmount = Math.ceil(baseAmount * (prev.pricing.discountPercent || 0) / 100);
      const finalAmount = baseAmount + gstAmount - discountAmount;
      
      return {
        ...prev,
        pricing: { ...prev.pricing, baseAmount, gstAmount, discountAmount, finalAmount }
      };
    });
  };

  // Calculate AMC fields based on servicesPerMonth and intervalDays
  const calculateAMCFields = (servicesPerMonth, intervalDays) => {
    const serviceCount = servicesPerMonth;
    return { serviceCount, intervalDays };
  };

  // Generate AMC Schedule based on service count and interval
  const generateAMCSchedule = (startDate) => {
    if (!startDate) return;
    
    const { serviceCount, intervalDays } = formData.schedule;
    
    const dates = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < serviceCount; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + (i * intervalDays));
      
      const dayDiff = Math.floor((currentDate - start) / (1000 * 60 * 60 * 24)) + 1;
      
      dates.push({
        date: currentDate.toISOString().split('T')[0],
        formatted: currentDate.toLocaleDateString('en-IN', { 
          weekday: 'short', 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        dayNumber: dayDiff
      });
    }
    
    setFormData(prev => ({
      ...prev,
      schedule: { ...prev.schedule, scheduledDates: dates }
    }));
  };

  useEffect(() => {
    calculatePricing();
  }, [formData.premises.totalArea, formData.ratePerSqft, formData.perFloorExtra, formData.pricing.gstPercent, formData.pricing.discountPercent, formData.amcServices, formData.schedule.serviceCount, serviceType, serviceRates]);

  useEffect(() => {
    setFormData(prev => {
      const totalAmount = Math.ceil(prev.pricing.finalAmount || 0);
      const advance = Math.ceil(parseFloat(prev.billing.advance) || 0);
      const due = Math.max(0, totalAmount - advance);
      return { ...prev, billing: { ...prev.billing, due } };
    });
  }, [formData.pricing.finalAmount, formData.billing.advance]);

  // Auto-fill agreement area with total area
  useEffect(() => {
    const totalArea = formData.premises.totalArea;
    if (totalArea > 0 && !formData.contract.agreementArea) {
      setFormData(prev => ({
        ...prev,
        contract: { ...prev.contract, agreementArea: totalArea }
      }));
    }
  }, [formData.premises.totalArea]);

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [section]: { ...prev[section], [field]: value } };
      if (section === 'pricing' && (field === 'discountPercent')) {
        calculatePricing();
      }
      return updated;
    });
  };

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

  const handleServiceTypeChange = (type) => {
    setServiceType(type);
    if (type === 'AMC') {
      setFormData(prev => ({ ...prev, attDetails: { treatmentTypes: [], chemicals: [], methods: ['Drill'], baseSolutions: ['Water Based'], warranty: '' } }));
    } else if (type === 'ATT') {
      setFormData(prev => ({ ...prev, amcServices: [] }));
    }
  };

  const toggleAMCService = (service) => {
    setFormData(prev => {
      const exists = prev.amcServices.includes(service);
      const amcServices = exists ? prev.amcServices.filter(s => s !== service) : [...prev.amcServices, service];
      return { ...prev, amcServices };
    });
  };

  const toggleATTOption = (field, value) => {
    setFormData(prev => {
      const current = prev.attDetails[field] || [];
      const exists = current.includes(value);
      const updated = exists ? current.filter(v => v !== value) : [...current, value];
      return { 
        ...prev, 
        attDetails: { ...prev.attDetails, [field]: updated } 
      };
    });
  };

  const isATTOptionSelected = (field, value) => {
    return formData.attDetails[field]?.includes(value) || false;
  };

  const mutation = useMutation({
    mutationFn: (payload) => {
      if (isEditing) return api.put(`/forms/${editId}`, payload);
      return api.post('/forms', payload);
    },
    onSuccess: (res) => {
      toast.success(isEditing ? 'Form Updated' : 'Form Created Successfully');
      if (!isEditing && res.data.data?._id) {
        api.post(`/forms/${res.data.data._id}/submit`)
          .then(() => {
            toast.success('PDF sent to customer email');
          })
          .catch((err) => {
            console.warn('PDF email failed:', err);
            toast.error('Form saved but email could not be sent');
          });
      }
      queryClient.invalidateQueries(['forms']);
      navigate('/forms');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Error saving form');
      setIsLoading(false);
    }
  });

  useEffect(() => {
    if (editId) {
      setIsLoadingForm(true);
      api.get(`/forms/${editId}`).then(res => {
        const form = res.data.data;
        const premises = form.premises || {};
        const floorsWithIds = (premises.floors || []).map((f, i) => ({
          ...f,
          id: f.id || Date.now() + i
        }));
        setFormData({
          _id: form._id,
          branchId: form.branchId?._id || form.branchId || '',
          customerId: form.customerId || '',
          customer: form.customer || { title: 'Mr.', name: '', address: '', city: '', gstNo: '', phone: '', whatsapp: '', email: '' },
          serviceCategory: form.serviceCategory || 'Residential',
          reference: form.reference || 'Walk-in',
          referenceBy: form.referenceBy || '',
          attDetails: form.attDetails || { treatmentTypes: [], chemicals: [], methods: ['Drill'], baseSolutions: ['Water Based'], constructionPhase: '', warranty: '' },
          amcServices: form.amcServices || [],
          premises: { ...premises, floors: floorsWithIds },
          ratePerSqft: form.ratePerSqft || 0,
          perFloorExtra: form.perFloorExtra || 0,
          pricing: form.pricing || { baseAmount: 0, gstPercent: 18, gstAmount: 0, discountPercent: 0, discountAmount: 0, finalAmount: 0 },
          schedule: form.schedule || { type: 'One Time', date: '', time: '' },
          billing: form.billing || { paymentMode: 'Cash', advance: '', due: '', paymentDetail: '', transactionNo: '', paymentImage: '' },
          contract: form.contract || { agreementArea: '', ratePerSqft: '', period: '', warranty: '', startDate: '', endDate: '' },
          executive: form.executive || { name: '', phone: '' },
          signatures: { employeeSignature: null, customerSignature: null },
          logistics: form.logistics || { vehicleNo: '', startMeter: '', endMeter: '', startMeterPhoto: '', endMeterPhoto: '' }
        });
        setServiceType(form.serviceType || 'AMC');
        if (form.customer?.name) {
          setCustomerSearch(form.customer.name);
          setSelectedCustomerId(form.customerId || '');
        }
        setIsLoadingForm(false);
      }).catch(() => {
        setIsLoadingForm(false);
        toast.error('Failed to load form');
        navigate('/forms');
      });
    }
  }, [editId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.branchId) { toast.error('Select branch'); return; }
    if (!formData.customer.name || !formData.customer.phone) { toast.error('Customer details required'); return; }
    
    // AMC or BOTH service requires AMC services to be selected
    if ((serviceType === 'AMC' || serviceType === 'GPC' || serviceType === 'BOTH') && formData.amcServices.length === 0) { 
      toast.error('Select at least one AMC service'); return; 
    }
    
    // ATT or BOTH service requires ATT details (at least one treatment type or chemical)
    if ((serviceType === 'ATT' || serviceType === 'BOTH') && 
        (formData.attDetails.treatmentTypes?.length === 0 || formData.attDetails.chemicals?.length === 0)) { 
      toast.error('Select at least one Treatment Type and Chemical for ATT'); return; 
    }
    
    if (formData.premises.totalArea <= 0) { toast.error('Add premises area'); return; }
    if (formData.ratePerSqft <= 0) { toast.error('Enter rate per sqft'); return; }
    setShowConfirmModal(true);
  };

  const confirmAndSubmit = async () => {
    setIsLoading(true);
    const empSig = sigPadRefEmp.current?.getTrimmedCanvas()?.toDataURL('image/png');
    const custSig = sigPadRefCust.current?.getTrimmedCanvas()?.toDataURL('image/png');
    if (!empSig || !custSig) {
      toast.error('Both signatures required');
      setIsLoading(false);
      return;
    }
    
    // Clean up empty strings - convert to null for ObjectId fields
    const payload = {
      ...formData,
      customerId: formData.customerId || null,
      branchId: formData.branchId || null,
      serviceType,
      signatures: { employeeSignature: empSig, customerSignature: custSig },
      billing: { ...formData.billing, total: formData.pricing.finalAmount }
    };
    
    mutation.mutate(payload);
    
    if ((serviceType === 'AMC' || serviceType === 'GPC' || serviceType === 'BOTH') && formData.amcServices.length > 0) {
      const endDate = new Date();
      const period = formData.contract.period || 12;
      endDate.setMonth(endDate.getMonth() + parseInt(period));
      
      try {
        await api.post('/amc', {
          customerId: formData.customerId || null,
          customerName: formData.customer.name,
          customerPhone: formData.customer.phone,
          customerAddress: formData.customer.address,
          serviceType: formData.serviceCategory,
          premisesType: formData.premises.type,
          servicesIncluded: formData.amcServices,
          startDate: formData.contract.startDate || new Date().toISOString().split('T')[0],
          endDate: formData.contract.endDate || endDate.toISOString().split('T')[0],
          period: period,
          totalAmount: formData.pricing.finalAmount,
          paidAmount: formData.billing.advance || 0,
          branchId: formData.branchId,
          formId: null
        });
        toast.success('AMC Contract also created!');
      } catch (err) {
        console.error('AMC creation failed:', err);
      }
    }
  };

  if (isLoadingForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 pb-32">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group">
            <div className="p-2 rounded-xl bg-white shadow-sm group-hover:bg-slate-100 transition-colors">
              <ChevronLeft size={20} />
            </div>
            <span className="text-sm font-semibold">{isEditing ? 'Back to Forms' : 'Back to Archive'}</span>
          </button>
          <div className="flex items-center gap-3">
            {isEditing && formData._id && (
              <button type="button" onClick={() => window.open(`/api/forms/${formData._id}/pdf`, '_blank')} className="px-4 py-2 bg-white shadow-sm text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 transition-all border border-slate-200">
                <Eye size={16} /> View PDF
              </button>
            )}
            <Badge variant="info">{new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</Badge>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
        {user?.role === 'super_admin' && (
          <SectionCard title="Branch Selection" icon={Building2} headerBg="bg-gradient-to-r from-amber-500 to-amber-600">
            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
              <Label className="text-amber-700">Select Branch *</Label>
              <Select value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} required className="bg-white">
                <option value="">-- Select Branch --</option>
                {branches?.map(b => <option key={b._id} value={b._id}>{b.branchName} ({b.cityPrefix})</option>)}
              </Select>
            </div>
          </SectionCard>
        )}

        <SectionCard title="Service Job Card" icon={FileText}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-100 rounded-xl">
                  <User size={18} className="text-brand-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Customer Details</h4>
              </div>
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Search size={14} className="text-slate-400" />
                  <Label className="mb-0 text-slate-500">Search Existing Customer</Label>
                </div>
                <Input 
                  value={customerSearch}
                  onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); if (!e.target.value) { setSelectedCustomerId(''); setFormData(prev => ({ ...prev, customerId: '' })); }}}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search by name or phone..."
                  className="pl-11"
                />
                <Search size={16} className="absolute left-4 top-[42px] text-slate-400" />
                {showCustomerDropdown && customersData?.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    {customersData.map(cust => (
                      <button key={cust._id} type="button" onClick={() => handleSelectCustomer(cust)} className="w-full text-left px-4 py-3 hover:bg-brand-50 border-b border-slate-100 last:border-0 transition-colors">
                        <span className="font-semibold text-slate-800 block">{cust.name}</span>
                        <span className="text-sm text-slate-500 mt-0.5 block">{cust.phone} • {cust.city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-5 gap-3">
                <div>
                  <Label>Title</Label>
                  <Select value={formData.customer.title} onChange={e => handleNestedChange('customer', 'title', e.target.value)}>
                    <option>Mr.</option><option>Mrs.</option><option>Ms.</option><option>M/S</option>
                  </Select>
                </div>
                <div className="col-span-4">
                  <Label required>Customer Name</Label>
                  <Input value={formData.customer.name} onChange={e => handleNestedChange('customer', 'name', e.target.value)} placeholder="Enter full name" />
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <MapPin size={14} className="text-slate-400" />
                  <Label className="mb-0">Address</Label>
                </div>
                <Input value={formData.customer.address} onChange={e => handleNestedChange('customer', 'address', e.target.value)} placeholder="House no, Street, Area" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input value={formData.customer.city} onChange={e => handleNestedChange('customer', 'city', e.target.value)} placeholder="City name" />
                </div>
                <div>
                  <Label>GST Number</Label>
                  <Input value={formData.customer.gstNo} onChange={e => handleNestedChange('customer', 'gstNo', e.target.value)} placeholder="Optional" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Phone size={14} className="text-slate-400" />
                    <Label className="mb-0">Phone</Label>
                  </div>
                  <Input type="tel" value={formData.customer.phone} onChange={e => handleNestedChange('customer', 'phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input value={formData.customer.whatsapp} onChange={e => handleNestedChange('customer', 'whatsapp', e.target.value)} placeholder="Optional" />
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Mail size={14} className="text-slate-400" />
                  <Label className="mb-0">Email</Label>
                </div>
                <Input type="email" value={formData.customer.email} onChange={e => handleNestedChange('customer', 'email', e.target.value)} placeholder="customer@email.com" />
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 rounded-xl">
                  <Tag size={18} className="text-purple-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Service & Reference</h4>
              </div>

              <div>
                <Label>Service Category</Label>
                <div className="grid grid-cols-3 gap-3">
                  {serviceOptions.map(opt => (
                    <button key={opt} type="button" onClick={() => setFormData({...formData, serviceCategory: opt})}
                      className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2 ${
                        formData.serviceCategory === opt ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reference Source</Label>
                  <Select value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})}>
                    {referenceOptions.map(ref => <option key={ref} value={ref}>{ref}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Reference By</Label>
                  <Input value={formData.referenceBy} onChange={e => setFormData({...formData, referenceBy: e.target.value})} placeholder="Person name" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-emerald-100 rounded-xl">
                    <Calculator size={18} className="text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">Executive Details</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Executive Name</Label>
                    <Input value={formData.executive.name} onChange={e => handleNestedChange('executive', 'name', e.target.value)} placeholder="Field executive" />
                  </div>
                  <div>
                    <Label>Executive Phone</Label>
                    <Input value={formData.executive.phone} onChange={e => handleNestedChange('executive', 'phone', e.target.value)} placeholder="Contact number" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Service Type Selection" icon={Layers}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[{ key: 'AMC', label: 'AMC', subtitle: 'Annual Maintenance Contract', color: 'emerald', icon: CheckSquare }, 
              { key: 'GPC', label: 'GPC', subtitle: 'General Pest Control', color: 'amber', icon: Bug },
              { key: 'ATT', label: 'ATT', subtitle: 'Anti Termite Treatment', color: 'blue', icon: FileCheck }, 
              { key: 'BOTH', label: 'AMC + ATT', subtitle: 'Both Services', color: 'purple', icon: FileText }].map(opt => (
              <button key={opt.key} type="button" onClick={() => handleServiceTypeChange(opt.key)}
                className={`p-5 rounded-2xl border-2 transition-all relative overflow-hidden ${
                  serviceType === opt.key 
                    ? opt.color === 'emerald' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                    : opt.color === 'amber' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/30'
                    : opt.color === 'blue' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:shadow-md'
                }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${serviceType === opt.key ? 'bg-white/20' : 'bg-slate-100'}`}>
                    <opt.icon size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">{opt.label}</p>
                    <p className={`text-sm mt-0.5 ${serviceType === opt.key ? 'text-white/80' : 'text-slate-500'}`}>{opt.subtitle}</p>
                  </div>
                </div>
                {serviceType === opt.key && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-white/20 rounded-full p-1">
                      <Check size={16} />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </SectionCard>

        {(serviceType === 'AMC' || serviceType === 'GPC' || serviceType === 'BOTH') && (
          <SectionCard title={serviceType === 'GPC' ? "GPC Services - General Pest Control" : "AMC Services - Pest Control"} icon={serviceType === 'GPC' ? Bug : CheckSquare} headerBg={serviceType === 'GPC' ? "bg-gradient-to-r from-amber-600 to-amber-500" : "bg-gradient-to-r from-emerald-600 to-emerald-500"}>
            {Object.keys(serviceRates).length === 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                Loading service rates...
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {pestOptions.map(pest => (
                <button key={pest} type="button" onClick={() => toggleAMCService(pest)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    formData.amcServices.includes(pest) ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50'
                  }`}>
                  <div className="mb-2">
                    {formData.amcServices.includes(pest) ? <CheckSquare size={24} /> : <XCircle size={24} />}
                  </div>
                  <span className="font-semibold text-sm text-center">{pest}</span>
                  {serviceRates[pest] && (
                    <span className={`text-xs mt-1 font-bold ${formData.amcServices.includes(pest) ? 'text-emerald-200' : 'text-emerald-600'}`}>
                      ₹{serviceRates[pest]}/sqft
                    </span>
                  )}
                </button>
              ))}
            </div>
            {formData.amcServices.length > 0 && (
              <div className="mt-5 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Check size={18} className="text-emerald-600" />
                    <p className="font-bold text-emerald-800">Selected Services: {formData.amcServices.length}</p>
                  </div>
                  <p className="text-sm text-emerald-600 font-semibold">Total: ₹{getAMCTotal().toLocaleString('en-IN')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.amcServices.map(service => (
                    <span key={service} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                      {service}
                      {serviceRates[service] && <span className="text-emerald-500">₹{serviceRates[service]}/sqft</span>}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-emerald-600 mt-2">Rate calculated per sqft per service. See Pricing section for floor-wise breakdown.</p>
              </div>
            )}
          </SectionCard>
        )}

        {(serviceType === 'ATT' || serviceType === 'BOTH') && (
          <SectionCard title="ATT Services - Anti Termite Treatment" icon={FileCheck} headerBg="bg-gradient-to-r from-blue-600 to-blue-500">
            
            {/* Construction Phase & Warranty Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div>
                <Label className="text-blue-700 mb-3 block">Construction Phase</Label>
                <Select 
                  value={formData.attDetails.constructionPhase} 
                  onChange={e => setFormData(prev => ({ ...prev, attDetails: { ...prev.attDetails, constructionPhase: e.target.value } }))}
                  className="w-full"
                >
                  <option value="">Select Phase</option>
                  {attConstructionPhases.map(phase => (
                    <option key={phase} value={phase}>{phase}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="text-blue-700 mb-3 block">Warranty Period</Label>
                <Select 
                  value={formData.attDetails.warranty} 
                  onChange={e => setFormData(prev => ({ ...prev, attDetails: { ...prev.attDetails, warranty: e.target.value } }))}
                  className="w-full"
                >
                  <option value="">Select Warranty</option>
                  {attWarrantyOptions.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Treatment Types */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare size={16} className="text-blue-600" />
                <Label className="mb-0 text-blue-700">Treatment Type (Select Multiple)</Label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {attTreatmentTypes.map(type => (
                  <button key={type} type="button" onClick={() => toggleATTOption('treatmentTypes', type)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      isATTOptionSelected('treatmentTypes', type) 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:bg-blue-50'
                    }`}>
                    <div className="mb-1">
                      {isATTOptionSelected('treatmentTypes', type) ? <CheckSquare size={20} /> : <XCircle size={20} />}
                    </div>
                    <span className="font-semibold text-sm text-center">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chemicals */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FileCheck size={16} className="text-blue-600" />
                <Label className="mb-0 text-blue-700">Chemical Used (Select Multiple)</Label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {attChemicals.map(chem => (
                  <button key={chem} type="button" onClick={() => toggleATTOption('chemicals', chem)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      isATTOptionSelected('chemicals', chem) 
                        ? 'bg-purple-600 border-purple-600 text-white shadow-lg' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-purple-400 hover:bg-purple-50'
                    }`}>
                    <div className="mb-1">
                      {isATTOptionSelected('chemicals', chem) ? <CheckSquare size={20} /> : <XCircle size={20} />}
                    </div>
                    <span className="font-semibold text-sm text-center">{chem}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Application Methods */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Check size={16} className="text-blue-600" />
                <Label className="mb-0 text-blue-700">Application Method (Select Multiple)</Label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {attMethods.map(method => (
                  <button key={method} type="button" onClick={() => toggleATTOption('methods', method)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      isATTOptionSelected('methods', method) 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50'
                    }`}>
                    <div className="mb-1">
                      {isATTOptionSelected('methods', method) ? <CheckSquare size={20} /> : <XCircle size={20} />}
                    </div>
                    <span className="font-semibold text-sm">{method}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Base Solutions */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-blue-600" />
                <Label className="mb-0 text-blue-700">Base Solution (Select Multiple)</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {attBaseSolutions.map(base => (
                  <button key={base} type="button" onClick={() => toggleATTOption('baseSolutions', base)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      isATTOptionSelected('baseSolutions', base) 
                        ? 'bg-amber-600 border-amber-600 text-white shadow-lg' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-amber-400 hover:bg-amber-50'
                    }`}>
                    <div className="mb-1">
                      {isATTOptionSelected('baseSolutions', base) ? <CheckSquare size={20} /> : <XCircle size={20} />}
                    </div>
                    <span className="font-semibold text-sm">{base}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {(formData.attDetails.treatmentTypes?.length > 0 || formData.attDetails.chemicals?.length > 0 || formData.attDetails.constructionPhase || formData.attDetails.warranty) && (
              <div className="mt-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <Check size={18} className="text-blue-600" />
                  <p className="font-bold text-blue-800">ATT Summary</p>
                </div>
                {(formData.attDetails.constructionPhase || formData.attDetails.warranty) && (
                  <div className="flex flex-wrap gap-4 mb-3 pb-3 border-b border-blue-200">
                    {formData.attDetails.constructionPhase && (
                      <p className="text-sm text-blue-700">
                        <span className="font-semibold">Phase:</span> {formData.attDetails.constructionPhase}
                      </p>
                    )}
                    {formData.attDetails.warranty && (
                      <p className="text-sm text-red-700 font-semibold">
                        <span className="font-semibold">Warranty:</span> {formData.attDetails.warranty}
                      </p>
                    )}
                  </div>
                )}
                {formData.attDetails.treatmentTypes?.length > 0 && (
                  <p className="text-sm text-blue-700 mb-2">
                    <span className="font-semibold">Treatment:</span> {formData.attDetails.treatmentTypes.join(', ')}
                  </p>
                )}
                {formData.attDetails.chemicals?.length > 0 && (
                  <p className="text-sm text-blue-700 mb-2">
                    <span className="font-semibold">Chemicals:</span> {formData.attDetails.chemicals.join(', ')}
                  </p>
                )}
                {formData.attDetails.methods?.length > 0 && (
                  <p className="text-sm text-blue-700 mb-2">
                    <span className="font-semibold">Methods:</span> {formData.attDetails.methods.join(', ')}
                  </p>
                )}
                {formData.attDetails.baseSolutions?.length > 0 && (
                  <p className="text-sm text-blue-700 mb-2">
                    <span className="font-semibold">Base:</span> {formData.attDetails.baseSolutions.join(', ')}
                  </p>
                )}
              </div>
            )}
          </SectionCard>
        )}

        <SectionCard title="Premises & Floor Management" icon={Home}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label>Property Type</Label>
              <Select value={formData.premises.type} onChange={e => handleNestedChange('premises', 'type', e.target.value)}>
                <option value="">Select Property Type</option>
                {premisesTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <Label>Total Area</Label>
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-4 rounded-xl text-center">
                <p className="text-2xl font-bold">{formData.premises.totalArea.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Square Feet</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-slate-800">Floor Details</h4>
              <button type="button" onClick={addFloor} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-500 transition-all shadow-sm">
                <Plus size={18} /> Add Floor
              </button>
            </div>
            
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-5 py-3.5 grid grid-cols-12 gap-4 text-sm font-bold text-slate-600 uppercase tracking-wide">
                <div className="col-span-4">Floor Label</div>
                <div className="col-span-2">Length (ft)</div>
                <div className="col-span-2">Width (ft)</div>
                <div className="col-span-2">Area (sqft)</div>
                <div className="col-span-2"></div>
              </div>
              {formData.premises.floors.map((floor, idx) => (
                <div key={floor.id} className="px-5 py-3.5 grid grid-cols-12 gap-4 items-center border-t border-slate-100 bg-white hover:bg-slate-50/50 transition-colors">
                  <div className="col-span-4">
                    <Input value={floor.label} onChange={e => updateFloor(floor.id, 'label', e.target.value)} placeholder={`Floor ${idx + 1}`} className="!py-2.5" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" value={floor.length || ''} onChange={e => updateFloor(floor.id, 'length', e.target.value)} placeholder="0" className="!py-2.5" />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" value={floor.width || ''} onChange={e => updateFloor(floor.id, 'width', e.target.value)} placeholder="0" className="!py-2.5" />
                  </div>
                  <div className="col-span-2">
                    <div className="bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl text-center font-bold">
                      {floor.area.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    {formData.premises.floors.length > 1 && (
                      <button type="button" onClick={() => removeFloor(floor.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Pricing & Rate Configuration" icon={IndianRupee}>
          <div className="space-y-6">
            {/* AMC Floor-wise Breakdown */}
            {(serviceType === 'AMC' || serviceType === 'GPC' || serviceType === 'BOTH') && formData.amcServices.length > 0 && Object.keys(serviceRates).length > 0 && (
              <div className="border border-emerald-200 rounded-2xl overflow-hidden">
                <div className="bg-emerald-600 text-white px-5 py-3 font-bold text-sm flex items-center gap-2">
                  <Calculator size={16} />
                  AMC - Floor-wise Service Calculation
                </div>
                {getAMCFloorBreakdown().map(floor => (
                  <div key={floor.floorId} className="border-t border-emerald-100">
                    <div className="bg-emerald-50 px-5 py-2.5 flex justify-between items-center">
                      <span className="font-bold text-emerald-800">{floor.floorLabel}</span>
                      <span className="text-emerald-700 font-semibold">{floor.area.toLocaleString('en-IN')} sqft</span>
                    </div>
                    <div className="p-4 space-y-2">
                      {floor.breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm items-center">
                          <span className="text-slate-600">
                            {item.service}
                            <span className="text-slate-400 ml-2">({item.area} × ₹{item.rate})</span>
                          </span>
                          <span className="font-semibold text-emerald-700">₹{item.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t border-emerald-200">
                        <span className="font-bold text-emerald-800">Floor Total</span>
                        <span className="font-bold text-emerald-700">₹{floor.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bg-emerald-600 text-white px-5 py-3 flex justify-between items-center font-bold">
                  <span>Total AMC Amount</span>
                  <span className="text-lg">₹{getAMCTotal().toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {/* Show message if AMC selected but no rates loaded */}
            {(serviceType === 'AMC' || serviceType === 'GPC' || serviceType === 'BOTH') && formData.amcServices.length > 0 && Object.keys(serviceRates).length === 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                <p className="font-semibold">Loading service rates...</p>
                <p>Service rates will appear shortly.</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div>
                  <Label>Rate Per Square Feet (₹) - Manual Override</Label>
                  <Input 
                    type="number" 
                    value={formData.ratePerSqft || ''} 
                    onChange={e => setFormData(prev => ({ ...prev, ratePerSqft: parseFloat(e.target.value) || 0 }))} 
                    placeholder="Enter rate per sqft" 
                    className="text-lg font-bold !py-4 flex-1" 
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Extra Per Floor (₹)</Label>
                    <Input type="number" value={formData.perFloorExtra || ''} onChange={e => setFormData(prev => ({ ...prev, perFloorExtra: parseFloat(e.target.value) || 0 }))} placeholder="0" />
                  </div>
                  <div>
                    <Label>Discount (%)</Label>
                    <Input type="number" value={formData.pricing.discountPercent || ''} onChange={e => handleNestedChange('pricing', 'discountPercent', e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <Label>GST (%)</Label>
                    <Input type="number" value={formData.pricing.gstPercent || 18} onChange={e => handleNestedChange('pricing', 'gstPercent', e.target.value)} />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-5">
                  <Calculator size={20} className="text-brand-400" />
                  <h4 className="font-bold uppercase tracking-wide text-sm">Final Price Breakdown</h4>
                </div>
                <div className="space-y-3.5 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Total Area</span><span className="font-bold">{formData.premises.totalArea.toLocaleString('en-IN')} sqft</span></div>
                  
                  {/* AMC Section */}
                  {(serviceType === 'AMC' || serviceType === 'GPC' || serviceType === 'BOTH') && formData.amcServices.length > 0 && Object.keys(serviceRates).length > 0 && (
                    <div className="flex justify-between border-t border-slate-700 pt-3">
                      <span className="text-emerald-400 font-semibold">AMC Total</span>
                      <span className="font-bold text-emerald-400">₹{getAMCTotal().toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  
                  {/* ATT Section - Manual Rate */}
                  {(serviceType === 'ATT' || serviceType === 'BOTH') && formData.ratePerSqft > 0 && (
                    <>
                      <div className="flex justify-between"><span className="text-blue-400">ATT Rate/Sq.Ft.</span><span className="font-bold">₹{formData.ratePerSqft}</span></div>
                      <div className="flex justify-between"><span className="text-blue-400">ATT Amount</span><span className="font-bold text-blue-400">₹{(formData.premises.totalArea * formData.ratePerSqft).toLocaleString('en-IN')}</span></div>
                    </>
                  )}
                  
                  {formData.perFloorExtra > 0 && (
                    <div className="flex justify-between"><span className="text-slate-400">Floor Extra ({formData.premises.floors.length} × ₹{formData.perFloorExtra})</span><span className="font-bold">₹{(formData.premises.floors.length * formData.perFloorExtra).toLocaleString('en-IN')}</span></div>
                  )}
                  
                  <div className="flex justify-between border-t border-slate-700 pt-3">
                    <span className="font-semibold">Base Amount</span>
                    <span className="font-bold">₹{formData.pricing.baseAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-400">GST ({formData.pricing.gstPercent}%)</span><span className="font-bold text-emerald-400">+₹{formData.pricing.gstAmount.toLocaleString('en-IN')}</span></div>
                  {formData.pricing.discountPercent > 0 && (
                    <div className="flex justify-between"><span className="text-slate-400">Discount ({formData.pricing.discountPercent}%)</span><span className="font-bold text-red-400">-₹{formData.pricing.discountAmount.toLocaleString('en-IN')}</span></div>
                  )}
                  <div className="flex justify-between border-t border-slate-700 pt-3 text-base">
                    <span className="font-bold">Final Amount</span>
                    <span className="font-black text-emerald-400 text-xl">₹{formData.pricing.finalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Service Schedule" icon={Calendar}>
          {/* GPC & ATT - Simple Date Time */}
          {(serviceType === 'GPC' || serviceType === 'ATT') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label>Service Date</Label>
                <Input type="date" value={formData.schedule.date} onChange={e => handleNestedChange('schedule', 'date', e.target.value)} />
              </div>
              <div>
                <Label>Service Time</Label>
                <Input type="time" value={formData.schedule.time} onChange={e => handleNestedChange('schedule', 'time', e.target.value)} />
              </div>
            </div>
          )}

          {/* AMC - Custom Schedule */}
          {serviceType === 'AMC' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-sm font-semibold text-emerald-800 mb-3">AMC Service Schedule Configuration</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>First Service Date</Label>
                    <Input 
                      type="date" 
                      value={formData.schedule.date} 
                      onChange={e => {
                        handleNestedChange('schedule', 'date', e.target.value);
                        generateAMCSchedule(e.target.value);
                      }} 
                    />
                  </div>
                  <div>
                    <Label>Total Months</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="60" 
                      value={formData.schedule.period} 
                      onChange={e => {
                        handleNestedChange('schedule', 'period', parseInt(e.target.value) || 12);
                      }}
                      placeholder="e.g., 12"
                    />
                  </div>
                  <div>
                    <Label>Total Services</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="365" 
                      value={formData.schedule.serviceCount} 
                      onChange={e => {
                        const count = parseInt(e.target.value) || 1;
                        handleNestedChange('schedule', 'serviceCount', count);
                        if (formData.schedule.date) {
                          generateAMCSchedule(formData.schedule.date);
                        }
                      }}
                      placeholder="e.g., 4"
                    />
                  </div>
                  <div>
                    <Label>Interval (Days)</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="365"
                      value={formData.schedule.intervalDays} 
                      onChange={e => {
                        const interval = parseInt(e.target.value) || 30;
                        handleNestedChange('schedule', 'intervalDays', interval);
                        if (formData.schedule.date) {
                          generateAMCSchedule(formData.schedule.date);
                        }
                      }}
                      placeholder="e.g., 30"
                    />
                  </div>
                  <div>
                    <Label>Services Per Month</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="30" 
                      value={formData.schedule.servicesPerMonth} 
                      onChange={e => {
                        const count = parseInt(e.target.value) || 1;
                        handleNestedChange('schedule', 'servicesPerMonth', count);
                        handleNestedChange('schedule', 'serviceCount', count);
                        if (formData.schedule.date) {
                          generateAMCSchedule(formData.schedule.date);
                        }
                      }}
                      placeholder="e.g., 4"
                    />
                  </div>
                </div>
              </div>

              {/* Service Time */}
              <div>
                <Label>Preferred Service Time</Label>
                <Input type="time" value={formData.schedule.time} onChange={e => handleNestedChange('schedule', 'time', e.target.value)} />
              </div>

              {/* Auto-generated Schedule */}
              {formData.schedule.scheduledDates && formData.schedule.scheduledDates.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-emerald-700">Service Schedule Timeline</Label>
                    <span className="text-sm text-emerald-600 font-medium">
                      Total: {formData.schedule.scheduledDates.length} Services
                    </span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {formData.schedule.scheduledDates.map((date, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-emerald-100">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{date.formatted}</p>
                          <p className="text-xs text-slate-500">Day {date.dayNumber}</p>
                        </div>
                        <div className="text-sm text-emerald-600 font-medium">
                          {formData.schedule.time || '10:00'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Billing & Payment Details" icon={CreditCard}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <div>
              <Label>Payment Mode</Label>
              <Select value={formData.billing.paymentMode} onChange={e => handleNestedChange('billing', 'paymentMode', e.target.value)}>
                {paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
              </Select>
            </div>
            <div>
              <Label>Advance Amount (₹)</Label>
              <Input type="number" value={formData.billing.advance || ''} onChange={e => handleNestedChange('billing', 'advance', e.target.value)} placeholder="0" className="!bg-emerald-50 !border-emerald-200 !text-emerald-700 !font-bold" />
            </div>
            <div>
              <Label>Balance Due (₹)</Label>
              <Input type="number" value={formData.billing.due || ''} readOnly className="!bg-red-50 !border-red-200 !text-red-700 !font-bold !cursor-not-allowed" />
            </div>
            <div>
              <Label>Payment Details</Label>
              <Input value={formData.billing.paymentDetail} onChange={e => handleNestedChange('billing', 'paymentDetail', e.target.value)} placeholder="Optional" />
            </div>
          </div>
          {formData.billing.paymentMode !== 'Cash' && formData.billing.paymentMode !== 'Pending' && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label>Transaction / Reference No.</Label>
                  <Input value={formData.billing.transactionNo} onChange={e => handleNestedChange('billing', 'transactionNo', e.target.value)} placeholder="Enter reference number" />
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="AMC Contract Details" icon={Tag}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <div>
              <Label>Contract No.</Label>
              <Input value={formData.contract.contractNo || 'Auto-generated'} readOnly className="!bg-slate-100 !cursor-not-allowed" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Agreement Area</Label>
                {formData.contract.agreementArea !== formData.premises.totalArea && formData.premises.totalArea > 0 && (
                  <button type="button" onClick={() => handleNestedChange('contract', 'agreementArea', formData.premises.totalArea)} 
                    className="text-[10px] text-brand-600 hover:text-brand-800 font-medium">
                    Reset to {formData.premises.totalArea}
                  </button>
                )}
              </div>
              <Input type="number" value={formData.contract.agreementArea} onChange={e => handleNestedChange('contract', 'agreementArea', e.target.value)} placeholder="Sq.Ft." />
              {formData.contract.agreementArea > 0 && (
                <p className="text-[10px] text-slate-500 mt-1">Total Area: {formData.premises.totalArea} sq.ft.</p>
              )}
            </div>
            <div>
              <Label>Rate/Sq.Ft.</Label>
              <Input type="number" value={formData.contract.ratePerSqft} onChange={e => handleNestedChange('contract', 'ratePerSqft', e.target.value)} placeholder="₹" />
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
                <option value="">Select</option>
                {warrantyOptions.map(w => <option key={w} value={w}>{w}</option>)}
              </Select>
            </div>
          </div>
          {formData.contract.startDate && formData.contract.endDate && (
            <div className="mt-4 p-3 bg-brand-50 rounded-xl inline-flex items-center gap-2">
              <AlertCircle size={16} className="text-brand-600" />
              <span className="text-sm text-brand-700 font-medium">Contract Duration: {Math.ceil((new Date(formData.contract.endDate) - new Date(formData.contract.startDate)) / (1000 * 60 * 60 * 24))} days</span>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Digital Signatures" icon={FileText}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <Label>Executive Signature</Label>
              <div className="border-2 border-slate-200 rounded-2xl bg-slate-50 h-36 overflow-hidden">
                <SignaturePad ref={sigPadRefEmp} penColor="#0f172a" />
              </div>
              <button type="button" onClick={() => sigPadRefEmp.current?.clear()} className="mt-2 text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-1">
                <Trash2 size={14} /> Clear Signature
              </button>
            </div>
            <div>
              <Label>Customer Signature</Label>
              <div className="border-2 border-slate-200 rounded-2xl bg-slate-50 h-36 overflow-hidden">
                <SignaturePad ref={sigPadRefCust} penColor="#0f172a" />
              </div>
              <button type="button" onClick={() => sigPadRefCust.current?.clear()} className="mt-2 text-sm font-medium text-red-500 hover:text-red-700 flex items-center gap-1">
                <Trash2 size={14} /> Clear Signature
              </button>
            </div>
          </div>
        </SectionCard>

        <div className="sticky bottom-6 z-10">
          <button disabled={isLoading} type="submit" className="w-full py-5 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-2xl font-bold text-base uppercase tracking-wider hover:from-brand-500 hover:to-brand-400 disabled:opacity-60 flex items-center justify-center gap-3 shadow-xl shadow-brand-500/30 transition-all">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Processing...
              </>
            ) : (
              <>
                <Send size={20} />
                {isEditing ? 'Update Service Record' : 'Generate & Submit Booking'}
              </>
            )}
          </button>
        </div>
      </form>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <FileCheck size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Confirm Booking</h3>
                  <p className="text-slate-400 text-sm">Please review details before submitting</p>
                </div>
              </div>
              <button onClick={() => setShowConfirmModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <XCircle size={22} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Customer</p>
                  <p className="font-bold text-slate-800 mt-1">{formData.customer.title} {formData.customer.name}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Phone</p>
                  <p className="font-bold text-slate-800 mt-1">{formData.customer.phone}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Service Type</p>
                  <p className="font-bold text-slate-800 mt-1">{formData.serviceCategory}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Category</p>
                  <p className="font-bold text-slate-800 mt-1">{serviceType}</p>
                </div>
              </div>
              
              {formData.amcServices.length > 0 && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-emerald-600 text-xs font-medium uppercase tracking-wide">AMC Services</p>
                  <p className="font-bold text-emerald-800 mt-1">{formData.amcServices.join(', ')}</p>
                </div>
              )}
              {(formData.attDetails.treatmentTypes?.length > 0 || formData.attDetails.chemicals?.length > 0) && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-blue-600 text-xs font-medium uppercase tracking-wide">ATT Details</p>
                  <p className="font-bold text-blue-800 mt-1">
                    {formData.attDetails.treatmentTypes?.join(', ')} - {formData.attDetails.chemicals?.join(', ')}
                  </p>
                </div>
              )}
              
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Total Area</p>
                <p className="font-bold text-slate-800 text-lg mt-1">{formData.premises.totalArea.toLocaleString('en-IN')} Sq.Ft.</p>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-slate-600">Base Amount</span><span className="font-bold">₹{formData.pricing.baseAmount.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-600">GST ({formData.pricing.gstPercent}%)</span><span className="font-bold">₹{formData.pricing.gstAmount.toLocaleString('en-IN')}</span></div>
                {formData.pricing.discountPercent > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-slate-600">Discount ({formData.pricing.discountPercent}%)</span><span className="font-bold text-red-600">-₹{formData.pricing.discountAmount.toLocaleString('en-IN')}</span></div>
                )}
                <div className="flex justify-between text-base font-bold border-t-2 border-emerald-200 pt-3">
                  <span>Final Amount</span>
                  <span className="text-emerald-600 text-xl">₹{formData.pricing.finalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm"><span className="text-slate-600">Advance Paid</span><span className="font-bold text-emerald-700">₹{(formData.billing.advance || 0).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between text-base font-bold text-amber-600 border-t-2 border-emerald-200 pt-3">
                  <span>Balance Due</span>
                  <span>₹{formData.billing.due.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                  <Edit2 size={16} /> Edit Details
                </button>
                <button onClick={confirmAndSubmit} disabled={mutation.isPending} className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold text-sm hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30">
                  {mutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Confirm & Submit
                    </>
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

export default CreateForm;
