import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Settings as SettingsIcon, Building2, Phone, Mail, MapPin, Save, User, Shield, Plus, Trash2, DollarSign, Edit2, X, Beaker, Globe, FileText, Upload } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const fetchAttSettings = async () => (await api.get('/settings/att-dropdowns')).data.data;

const Settings = () => {
  const { user } = useSelector(state => state.auth);
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [activeTab, setActiveTab] = useState('company');

  const [companySettings, setCompanySettings] = useState({
    companyName: 'Safe Home Pestochem India Pvt. Ltd.',
    email: 'enquiry@safehomepestochem.in',
    phone: '25709',
    website: 'www.safehomepestochem.com',
    headOffice: {
      address: 'House No. 780-J, Chaksa Husain, Pachpedwa, Ramjanki Nagar, Basaratpur, Gorakhpur-273004',
      city: 'Gorakhpur',
      state: 'UP',
      pincode: '273004'
    },
    regionalOffice: {
      address: 'H. No-68, Pink City, Sec. 06, Jankipuram Extn., Near Kendria Vihar Colony, Lucknow-226021',
      city: 'Lucknow',
      state: 'UP',
      pincode: '226021'
    },
    gstNo: '',
    cinNo: 'U52100UP2022PTC164278',
    tanNo: 'ALDS10486A',
    panNo: 'ABICS5318P',
    logo: '',
    defaultServiceType: 'AMC',
    defaultTaxRate: '18',
    inventoryMarkupPercent: '10',
    inventoryUnits: 'L,ML,KG,G,BQ'
  });

  const [branchSettings, setBranchSettings] = useState({
    branchName: '',
    city: '',
    cityPrefix: '',
    address: '',
    phone: '',
    email: '',
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await api.get('/branches')).data.data,
    enabled: isSuperAdmin
  });

  const { data: companyData, isLoading: companyLoading } = useQuery({
    queryKey: ['companySettings'],
    queryFn: async () => (await api.get('/company-settings')).data.data,
    enabled: isSuperAdmin
  });

  const { data: attSettings, isLoading: attLoading } = useQuery({
    queryKey: ['attSettings'],
    queryFn: fetchAttSettings,
    enabled: isSuperAdmin
  });

  React.useEffect(() => {
    if (companyData) {
      setCompanySettings({
        companyName: companyData.companyName || '',
        email: companyData.email || '',
        phone: companyData.phone || '',
        website: companyData.website || '',
        headOffice: companyData.headOffice || { address: '', city: '', state: '', pincode: '' },
        regionalOffice: companyData.regionalOffice || { address: '', city: '', state: '', pincode: '' },
        gstNo: companyData.gstNo || '',
        cinNo: companyData.cinNo || '',
        tanNo: companyData.tanNo || '',
        panNo: companyData.panNo || '',
        logo: companyData.logo || '',
        defaultServiceType: companyData.defaultServiceType || 'AMC',
        defaultTaxRate: companyData.defaultTaxRate || '18',
        inventoryMarkupPercent: companyData.inventoryMarkupPercent || '10',
        inventoryUnits: companyData.inventoryUnits || 'L,ML,KG,G,BQ'
      });
    }
  }, [companyData]);

  const [selectedBranch, setSelectedBranch] = useState(null);

  const [newRate, setNewRate] = useState({ serviceName: 'Cockroaches', category: 'Residential', price: '' });
  const [editingRate, setEditingRate] = useState(null);

  const [attLists, setAttLists] = useState({
    preTreatmentTypes: [],
    preChemicals: [],
    preApplicationMethods: [],
    preBaseSolutions: [],
    prePipeQuality: [],
    postTreatmentTypes: [],
    postChemicals: [],
    postApplicationMethods: [],
    postBaseSolutions: []
  });

  const [attPrePost, setAttPrePost] = useState('PRE');
  const [newItem, setNewItem] = useState({ preTreatmentTypes: '', preChemicals: '', preApplicationMethods: '', preBaseSolutions: '', prePipeQuality: '', postTreatmentTypes: '', postChemicals: '', postApplicationMethods: '', postBaseSolutions: '' });

  React.useEffect(() => {
    if (attSettings) {
      setAttLists({
        preTreatmentTypes: attSettings.preTreatmentTypes || [],
        preChemicals: attSettings.preChemicals || [],
        preApplicationMethods: attSettings.preApplicationMethods || [],
        preBaseSolutions: attSettings.preBaseSolutions || [],
        prePipeQuality: attSettings.prePipeQuality || [],
        postTreatmentTypes: attSettings.postTreatmentTypes || [],
        postChemicals: attSettings.postChemicals || [],
        postApplicationMethods: attSettings.postApplicationMethods || [],
        postBaseSolutions: attSettings.postBaseSolutions || []
      });
    }
  }, [attSettings]);

  const { data: ratesData, isLoading: ratesLoading } = useQuery({
    queryKey: ['serviceRatesAdmin'],
    queryFn: async () => {
      const res = await api.get('/service-rates/admin');
      return res.data.data;
    },
    enabled: isSuperAdmin
  });

  const [localRates, setLocalRates] = useState([]);

  useEffect(() => {
    if (ratesData) {
      setLocalRates(ratesData);
    }
  }, [ratesData]);

  const createRateMutation = useMutation({
    mutationFn: (data) => api.post('/service-rates', data),
    onMutate: (newRate) => {
      const tempId = `temp_${Date.now()}`;
      setLocalRates(prev => [...prev, { ...newRate, _id: tempId }]);
      toast.success('Rate added');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRatesAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['serviceRates'] });
      queryClient.invalidateQueries({ queryKey: ['serviceRates', 'Residential'] });
      queryClient.invalidateQueries({ queryKey: ['serviceRates', 'Commercial'] });
      queryClient.invalidateQueries({ queryKey: ['serviceRates', 'Industrial'] });
      queryClient.removeQueries({ queryKey: ['serviceRates'] });
    },
    onError: (err) => {
      setLocalRates(ratesData || []);
      toast.error(err.response?.data?.message || 'Failed to add rate');
    }
  });

  const updateRateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/service-rates/${id}`, data),
    onMutate: ({ id, data }) => {
      setLocalRates(prev => prev.map(r => r._id === id ? { ...r, ...data } : r));
      toast.success('Rate updated');
    },
    onError: (err) => {
      setLocalRates(ratesData || []);
      toast.error(err.response?.data?.message || 'Failed to update rate');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRatesAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['serviceRates'] });
      queryClient.invalidateQueries({ queryKey: ['serviceRates', 'Residential'] });
      queryClient.invalidateQueries({ queryKey: ['serviceRates', 'Commercial'] });
      queryClient.invalidateQueries({ queryKey: ['serviceRates', 'Industrial'] });
      queryClient.removeQueries({ queryKey: ['serviceRates'] });
    }
  });

  const deleteRateMutation = useMutation({
    mutationFn: (id) => api.delete(`/service-rates/${id}`),
    onMutate: (id) => {
      setLocalRates(prev => prev.filter(r => r._id !== id));
      toast.success('Rate deleted');
    },
    onError: (err) => {
      setLocalRates(ratesData || []);
      toast.error(err.response?.data?.message || 'Failed to remove rate');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRatesAdmin'] });
      queryClient.removeQueries({ queryKey: ['serviceRates'] });
      queryClient.invalidateQueries({ queryKey: ['serviceRates', 'Residential'] });
      queryClient.invalidateQueries({ queryKey: ['serviceRates', 'Commercial'] });
      queryClient.invalidateQueries({ queryKey: ['serviceRates', 'Industrial'] });
    }
  });

  const handleAddRate = () => {
    if (!newRate.price) return toast.error('Please enter price');
    createRateMutation.mutate({ ...newRate, price: parseFloat(newRate.price) });
  };

  const handleUpdateRate = () => {
    if (!editingRate.price) return toast.error('Please enter price');
    updateRateMutation.mutate({ 
      id: editingRate._id, 
      data: { price: parseFloat(editingRate.price) } 
    });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/branches/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['branches']);
      toast.success('Settings updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
  });

  const companySettingsMutation = useMutation({
    mutationFn: (data) => api.put('/company-settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['companySettings']);
      toast.success('Company settings updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update company settings')
  });

  const attSettingsMutation = useMutation({
    mutationFn: (data) => api.put('/settings/att-dropdowns', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['attSettings']);
      queryClient.invalidateQueries(['attDropdowns']);
      toast.success('ATT Settings updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update ATT settings')
  });

  const handleCompanySubmit = (e) => {
    e.preventDefault();
    companySettingsMutation.mutate(companySettings);
  };

  const handleBranchUpdate = () => {
    if (selectedBranch) {
      updateMutation.mutate({ id: selectedBranch, data: branchSettings });
    }
  };

  const addAttItem = (field, value) => {
    if (!value.trim()) return;
    setAttLists(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }));
  };

  const removeAttItem = (field, index) => {
    setAttLists(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const saveAttSettings = () => {
    attSettingsMutation.mutate(attLists);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'rates', label: 'Service Rates', icon: DollarSign },
    { id: 'pdf', label: 'PDF Header', icon: FileText },
    { id: 'att', label: 'ATT Settings', icon: Beaker },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-24">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-white rounded-lg"><SettingsIcon size={20} /></div>
          Settings
        </h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">System Configuration</p>
      </div>

      {isSuperAdmin && (
        <div className="flex gap-2 border-b border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {isSuperAdmin && activeTab === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 px-6 py-3 flex items-center gap-2">
            <SettingsIcon size={16} className="text-white" />
            <h2 className="text-xs font-black text-white uppercase">General Settings</h2>
          </div>
          <form onSubmit={handleCompanySubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Default Service Type</label>
                <select 
                  value={companySettings.defaultServiceType || ''} 
                  onChange={e => setCompanySettings({...companySettings, defaultServiceType: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                >
                  <option value="">Select Default Service</option>
                  <option value="AMC">AMC</option>
                  <option value="ATT">ATT</option>
                  <option value="GPC">GPC</option>
                  <option value="BOTH">BOTH</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Default Tax Rate (%)</label>
                <input 
                  type="text"
                  value={companySettings.defaultTaxRate || ''} 
                  onChange={e => setCompanySettings({...companySettings, defaultTaxRate: e.target.value})}
                  placeholder="e.g., 18"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Inventory Markup (%)</label>
                <input 
                  type="text"
                  value={companySettings.inventoryMarkupPercent || ''} 
                  onChange={e => setCompanySettings({...companySettings, inventoryMarkupPercent: e.target.value})}
                  placeholder="e.g., 10"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Inventory Units (comma separated)</label>
                <input 
                  type="text"
                  value={companySettings.inventoryUnits || ''} 
                  onChange={e => setCompanySettings({...companySettings, inventoryUnits: e.target.value})}
                  placeholder="e.g., L, ML, KG, G, BQ"
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={companySettingsMutation.isPending} className="px-6 py-2 bg-brand-600 text-white rounded-lg text-xs font-medium flex items-center gap-2 disabled:opacity-50">
                <Save size={14} /> {companySettingsMutation.isPending ? 'Saving...' : 'Save General Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isSuperAdmin && activeTab === 'company' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 px-6 py-3 flex items-center gap-2">
            <Building2 size={16} className="text-white" />
            <h2 className="text-xs font-black text-white uppercase">Company Profile</h2>
          </div>
          <form onSubmit={handleCompanySubmit} className="p-6 space-y-4">
            {companyLoading ? (
              <div className="text-center py-4 text-slate-400 text-xs">Loading...</div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Company Name</label>
                <input value={companySettings.companyName} onChange={e => setCompanySettings({...companySettings, companyName: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">GST Number</label>
                <input value={companySettings.gstNo} onChange={e => setCompanySettings({...companySettings, gstNo: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Email</label>
                <input type="email" value={companySettings.email} onChange={e => setCompanySettings({...companySettings, email: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Phone</label>
                <input value={companySettings.phone} onChange={e => setCompanySettings({...companySettings, phone: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Address</label>
                <input value={companySettings.address} onChange={e => setCompanySettings({...companySettings, address: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
            </div>
          )}

          <div className="flex justify-end">
              <button type="submit" disabled={companySettingsMutation.isPending} className="px-6 py-2 bg-brand-600 text-white rounded-lg text-xs font-medium flex items-center gap-2 disabled:opacity-50">
                <Save size={14} /> {companySettingsMutation.isPending ? 'Saving...' : 'Save Company Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-3 flex items-center gap-2">
          <Building2 size={16} className="text-white" />
          <h2 className="text-xs font-black text-white uppercase">Branch Settings</h2>
        </div>
        <div className="p-6 space-y-4">
          {isSuperAdmin ? (
            <>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Select Branch to Edit</label>
                <select 
                  value={selectedBranch || ''} 
                  onChange={(e) => {
                    setSelectedBranch(e.target.value);
                    const branch = branches?.find(b => b._id === e.target.value);
                    if (branch) {
                      setBranchSettings({
                        branchName: branch.branchName || '',
                        city: branch.city || '',
                        cityPrefix: branch.cityPrefix || '',
                        address: branch.address || '',
                        phone: branch.phone || '',
                        email: branch.email || '',
                      });
                    }
                  }}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                >
                  <option value="">Select a branch</option>
                  {branches?.map(branch => (
                    <option key={branch._id} value={branch._id}>{branch.branchName} - {branch.city}</option>
                  ))}
                </select>
              </div>
              {selectedBranch && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Branch Name</label>
                    <input value={branchSettings.branchName} onChange={e => setBranchSettings({...branchSettings, branchName: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">City Prefix</label>
                    <input value={branchSettings.cityPrefix} onChange={e => setBranchSettings({...branchSettings, cityPrefix: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">City</label>
                    <input value={branchSettings.city} onChange={e => setBranchSettings({...branchSettings, city: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Phone</label>
                    <input value={branchSettings.phone} onChange={e => setBranchSettings({...branchSettings, phone: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Email</label>
                    <input type="email" value={branchSettings.email} onChange={e => setBranchSettings({...branchSettings, email: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Address</label>
                    <input value={branchSettings.address} onChange={e => setBranchSettings({...branchSettings, address: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button onClick={handleBranchUpdate} className="px-6 py-2 bg-brand-600 text-white rounded-lg text-xs font-medium flex items-center gap-2">
                      <Save size={14} /> Update Branch
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 text-xs">Contact Super Admin to modify branch settings</p>
            </div>
          )}
        </div>
      </div>

      {isSuperAdmin && activeTab === 'rates' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-emerald-600 px-6 py-3 flex items-center gap-2">
            <DollarSign size={16} className="text-white" />
            <h2 className="text-xs font-black text-white uppercase">Service Rates</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Service</label>
                <select 
                  value={newRate.serviceName}
                  onChange={(e) => setNewRate({...newRate, serviceName: e.target.value})}
                  className="border border-slate-200 rounded-lg p-2 text-xs min-w-[140px]"
                >
                  {['Cockroaches', 'Ants', 'Spider', 'Mosquito', 'Flies', 'Lizard', 'Rodent', 'Vector', 'Bed Bugs', 'Wood Borer', 'Fumigation', 'Others'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Category</label>
                <select 
                  value={newRate.category}
                  onChange={(e) => setNewRate({...newRate, category: e.target.value})}
                  className="border border-slate-200 rounded-lg p-2 text-xs min-w-[120px]"
                >
                  {['Residential', 'Commercial', 'Industrial'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Price (₹)</label>
                <input 
                  type="number"
                  value={newRate.price}
                  onChange={(e) => setNewRate({...newRate, price: e.target.value})}
                  placeholder="0.00"
                  className="border border-slate-200 rounded-lg p-2 text-xs w-24"
                />
              </div>
              <button 
                onClick={handleAddRate}
                disabled={createRateMutation.isPending}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-emerald-700"
              >
                <Plus size={14} /> Add Rate
              </button>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Existing Rates</label>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left p-2 font-semibold">Service</th>
                      <th className="text-left p-2 font-semibold">Category</th>
                      <th className="text-right p-2 font-semibold">Price</th>
                      <th className="text-center p-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratesLoading && localRates.length === 0 ? (
                      <tr><td colSpan={4} className="p-4 text-center text-slate-400">Loading...</td></tr>
                    ) : localRates?.length === 0 ? (
                      <tr><td colSpan={4} className="p-4 text-center text-slate-400">No rates configured</td></tr>
                    ) : (
                      localRates?.map(rate => (
                        <tr key={rate._id} className="border-b border-slate-100">
                          {editingRate?._id === rate._id ? (
                            <>
                              <td className="p-2">{rate.serviceName}</td>
                              <td className="p-2">{rate.category}</td>
                              <td className="p-2">
                                <div className="flex items-center gap-2 justify-end">
                                  <span className="text-slate-400">₹</span>
                                  <input 
                                    type="number"
                                    value={editingRate.price}
                                    onChange={(e) => setEditingRate({...editingRate, price: e.target.value})}
                                    className="border border-slate-200 rounded p-1 w-20 text-right"
                                  />
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={handleUpdateRate}
                                    disabled={updateRateMutation.isPending}
                                    className="text-emerald-600 hover:text-emerald-800"
                                  >
                                    <Save size={14} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingRate(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-2">{rate.serviceName}</td>
                              <td className="p-2">{rate.category}</td>
                              <td className="p-2 text-right font-medium">₹{rate.price}</td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => setEditingRate({...rate})}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => deleteRateMutation.mutate(rate._id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSuperAdmin && activeTab === 'pdf' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-blue-600 px-6 py-3 flex items-center gap-2">
            <FileText size={16} className="text-white" />
            <h2 className="text-xs font-black text-white uppercase">PDF Header Settings</h2>
          </div>
          <form onSubmit={handleCompanySubmit} className="p-6 space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="text-[9px] font-bold text-slate-600 uppercase block mb-2">Company Logo (for PDF)</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 relative overflow-hidden">
                  {companySettings.logo ? (
                    <img src={companySettings.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Upload size={24} className="text-slate-400" />
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      
                      // Convert to base64
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const base64 = reader.result;
                        try {
                          const res = await api.post('/upload', { file: base64 });
                          if (res.data.success) {
                            setCompanySettings({...companySettings, logo: res.data.data});
                            toast.success('Logo uploaded successfully!');
                          }
                        } catch (err) {
                          toast.error('Failed to upload logo');
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={companySettings.logo || ''}
                    onChange={e => setCompanySettings({...companySettings, logo: e.target.value})}
                    placeholder="Or paste logo URL here (https://...)"
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs mb-2"
                  />
                  <p className="text-[10px] text-slate-400">Click on image to upload or paste URL</p>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Company Name</label>
                <input value={companySettings.companyName} onChange={e => setCompanySettings({...companySettings, companyName: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Website</label>
                <input value={companySettings.website} onChange={e => setCompanySettings({...companySettings, website: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" placeholder="www.example.com" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Email</label>
                <input value={companySettings.email} onChange={e => setCompanySettings({...companySettings, email: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Phone</label>
                <input value={companySettings.phone} onChange={e => setCompanySettings({...companySettings, phone: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
            </div>

            {/* Head Office */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">Head Office</h3>
              <textarea value={companySettings.headOffice?.address || ''} onChange={e => setCompanySettings({...companySettings, headOffice: {...companySettings.headOffice, address: e.target.value}})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" rows={2} placeholder="Full address" />
            </div>

            {/* Regional Office */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">Regional Office</h3>
              <textarea value={companySettings.regionalOffice?.address || ''} onChange={e => setCompanySettings({...companySettings, regionalOffice: {...companySettings.regionalOffice, address: e.target.value}})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" rows={2} placeholder="Full address" />
            </div>

            {/* Tax Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">CIN Number</label>
                <input value={companySettings.cinNo} onChange={e => setCompanySettings({...companySettings, cinNo: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">TAN Number</label>
                <input value={companySettings.tanNo} onChange={e => setCompanySettings({...companySettings, tanNo: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">PAN Number</label>
                <input value={companySettings.panNo} onChange={e => setCompanySettings({...companySettings, panNo: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm">
              Save PDF Settings
            </button>
          </form>
        </div>
      )}

      {isSuperAdmin && activeTab === 'att' && (
        <div className="space-y-6">
          {/* Pre/Post Toggle */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-center gap-4">
              <button
                onClick={() => setAttPrePost('PRE')}
                className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all ${
                  attPrePost === 'PRE' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-400'
                }`}>
                PRE-TREATMENT SETTINGS
              </button>
              <button
                onClick={() => setAttPrePost('POST')}
                className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all ${
                  attPrePost === 'POST' 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-emerald-400'
                }`}>
                POST-TREATMENT SETTINGS
              </button>
            </div>
          </div>

          {attPrePost === 'PRE' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-blue-900 px-6 py-3 flex items-center gap-2">
                  <Beaker size={16} className="text-white" />
                  <h2 className="text-xs font-black text-white uppercase">Pre-Treatment Types</h2>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={newItem.preTreatmentTypes} onChange={(e) => setNewItem(prev => ({ ...prev, preTreatmentTypes: e.target.value }))} placeholder="Add new treatment type" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                    <button onClick={() => { addAttItem('preTreatmentTypes', newItem.preTreatmentTypes); setNewItem(prev => ({ ...prev, preTreatmentTypes: '' })); }} className="px-4 py-2 bg-blue-900 text-white rounded-lg"><Plus size={16} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attLists.preTreatmentTypes.map((item, i) => <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full flex items-center gap-1">{item}<button onClick={() => removeAttItem('preTreatmentTypes', i)}><X size={12} /></button></span>)}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-green-900 px-6 py-3 flex items-center gap-2">
                  <Beaker size={16} className="text-white" />
                  <h2 className="text-xs font-black text-white uppercase">Pre-Chemicals</h2>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={newItem.preChemicals} onChange={(e) => setNewItem(prev => ({ ...prev, preChemicals: e.target.value }))} placeholder="Add new chemical" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                    <button onClick={() => { addAttItem('preChemicals', newItem.preChemicals); setNewItem(prev => ({ ...prev, preChemicals: '' })); }} className="px-4 py-2 bg-green-900 text-white rounded-lg"><Plus size={16} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attLists.preChemicals.map((item, i) => <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full flex items-center gap-1">{item}<button onClick={() => removeAttItem('preChemicals', i)}><X size={12} /></button></span>)}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-purple-900 px-6 py-3 flex items-center gap-2">
                  <Beaker size={16} className="text-white" />
                  <h2 className="text-xs font-black text-white uppercase">Pre-Application Methods</h2>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={newItem.preApplicationMethods} onChange={(e) => setNewItem(prev => ({ ...prev, preApplicationMethods: e.target.value }))} placeholder="Add new method" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                    <button onClick={() => { addAttItem('preApplicationMethods', newItem.preApplicationMethods); setNewItem(prev => ({ ...prev, preApplicationMethods: '' })); }} className="px-4 py-2 bg-purple-900 text-white rounded-lg"><Plus size={16} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attLists.preApplicationMethods.map((item, i) => <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full flex items-center gap-1">{item}<button onClick={() => removeAttItem('preApplicationMethods', i)}><X size={12} /></button></span>)}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-amber-900 px-6 py-3 flex items-center gap-2">
                  <Beaker size={16} className="text-white" />
                  <h2 className="text-xs font-black text-white uppercase">Pre-Base Solutions</h2>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={newItem.preBaseSolutions} onChange={(e) => setNewItem(prev => ({ ...prev, preBaseSolutions: e.target.value }))} placeholder="Add new base solution" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                    <button onClick={() => { addAttItem('preBaseSolutions', newItem.preBaseSolutions); setNewItem(prev => ({ ...prev, preBaseSolutions: '' })); }} className="px-4 py-2 bg-amber-900 text-white rounded-lg"><Plus size={16} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attLists.preBaseSolutions.map((item, i) => <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full flex items-center gap-1">{item}<button onClick={() => removeAttItem('preBaseSolutions', i)}><X size={12} /></button></span>)}
                  </div>
                </div>
              </div>

              {/* PRE Pipe Quality */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-purple-900 px-6 py-3 flex items-center gap-2">
                  <Beaker size={16} className="text-white" />
                  <h2 className="text-xs font-black text-white uppercase">Pre-Pipe Quality</h2>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={newItem.prePipeQuality} onChange={(e) => setNewItem(prev => ({ ...prev, prePipeQuality: e.target.value }))} placeholder="Add new pipe quality" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                    <button onClick={() => { addAttItem('prePipeQuality', newItem.prePipeQuality); setNewItem(prev => ({ ...prev, prePipeQuality: '' })); }} className="px-4 py-2 bg-purple-900 text-white rounded-lg"><Plus size={16} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attLists.prePipeQuality.map((item, i) => <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full flex items-center gap-1">{item}<button onClick={() => removeAttItem('prePipeQuality', i)}><X size={12} /></button></span>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {attPrePost === 'POST' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-blue-900 px-6 py-3 flex items-center gap-2">
                  <Beaker size={16} className="text-white" />
                  <h2 className="text-xs font-black text-white uppercase">Post-Treatment Types</h2>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={newItem.postTreatmentTypes} onChange={(e) => setNewItem(prev => ({ ...prev, postTreatmentTypes: e.target.value }))} placeholder="Add new treatment type" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                    <button onClick={() => { addAttItem('postTreatmentTypes', newItem.postTreatmentTypes); setNewItem(prev => ({ ...prev, postTreatmentTypes: '' })); }} className="px-4 py-2 bg-blue-900 text-white rounded-lg"><Plus size={16} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attLists.postTreatmentTypes.map((item, i) => <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full flex items-center gap-1">{item}<button onClick={() => removeAttItem('postTreatmentTypes', i)}><X size={12} /></button></span>)}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-green-900 px-6 py-3 flex items-center gap-2">
                  <Beaker size={16} className="text-white" />
                  <h2 className="text-xs font-black text-white uppercase">Post-Chemicals</h2>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={newItem.postChemicals} onChange={(e) => setNewItem(prev => ({ ...prev, postChemicals: e.target.value }))} placeholder="Add new chemical" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                    <button onClick={() => { addAttItem('postChemicals', newItem.postChemicals); setNewItem(prev => ({ ...prev, postChemicals: '' })); }} className="px-4 py-2 bg-green-900 text-white rounded-lg"><Plus size={16} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attLists.postChemicals.map((item, i) => <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full flex items-center gap-1">{item}<button onClick={() => removeAttItem('postChemicals', i)}><X size={12} /></button></span>)}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-purple-900 px-6 py-3 flex items-center gap-2">
                  <Beaker size={16} className="text-white" />
                  <h2 className="text-xs font-black text-white uppercase">Post-Application Methods</h2>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={newItem.postApplicationMethods} onChange={(e) => setNewItem(prev => ({ ...prev, postApplicationMethods: e.target.value }))} placeholder="Add new method" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                    <button onClick={() => { addAttItem('postApplicationMethods', newItem.postApplicationMethods); setNewItem(prev => ({ ...prev, postApplicationMethods: '' })); }} className="px-4 py-2 bg-purple-900 text-white rounded-lg"><Plus size={16} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attLists.postApplicationMethods.map((item, i) => <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full flex items-center gap-1">{item}<button onClick={() => removeAttItem('postApplicationMethods', i)}><X size={12} /></button></span>)}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-amber-900 px-6 py-3 flex items-center gap-2">
                  <Beaker size={16} className="text-white" />
                  <h2 className="text-xs font-black text-white uppercase">Post-Base Solutions</h2>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={newItem.postBaseSolutions} onChange={(e) => setNewItem(prev => ({ ...prev, postBaseSolutions: e.target.value }))} placeholder="Add new base solution" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                    <button onClick={() => { addAttItem('postBaseSolutions', newItem.postBaseSolutions); setNewItem(prev => ({ ...prev, postBaseSolutions: '' })); }} className="px-4 py-2 bg-amber-900 text-white rounded-lg"><Plus size={16} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attLists.postBaseSolutions.map((item, i) => <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full flex items-center gap-1">{item}<button onClick={() => removeAttItem('postBaseSolutions', i)}><X size={12} /></button></span>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={saveAttSettings} disabled={attSettingsMutation.isPending} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2">
              <Save size={16} />{attSettingsMutation.isPending ? 'Saving...' : 'Save ATT Settings'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-3 flex items-center gap-2">
          <Shield size={16} className="text-white" />
          <h2 className="text-xs font-black text-white uppercase">Account Info</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase">Name</p>
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase">Email</p>
              <p className="text-sm font-medium text-slate-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase">Role</p>
              <p className="text-sm font-medium text-slate-900 uppercase">
                {user?.role === 'super_admin' ? 'Super Admin' : 
                 user?.role === 'branch_admin' && user?.branchId?.branchName ? user.branchId.branchName : 
                 user?.role?.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase">Branch</p>
              <p className="text-sm font-medium text-slate-900">{user?.branchId?.branchName || 'HQ'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
