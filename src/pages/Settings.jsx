import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Settings as SettingsIcon, Building2, Phone, Mail, MapPin, Save, User, Shield } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useSelector(state => state.auth);
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'super_admin';

  const [companySettings, setCompanySettings] = useState({
    companyName: 'Safe Home Pestochem India Pvt. Ltd.',
    email: 'info@safehomepest.com',
    phone: '',
    address: '',
    gstNo: '',
    cinNo: '',
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

  const [selectedBranch, setSelectedBranch] = useState(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/branches/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['branches']);
      toast.success('Settings updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
  });

  const handleCompanySubmit = (e) => {
    e.preventDefault();
    toast.success('Company settings saved (Demo)');
  };

  const handleBranchUpdate = () => {
    if (selectedBranch) {
      updateMutation.mutate({ id: selectedBranch, data: branchSettings });
    }
  };

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
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 px-6 py-3 flex items-center gap-2">
            <Building2 size={16} className="text-white" />
            <h2 className="text-xs font-black text-white uppercase">Company Profile</h2>
          </div>
          <form onSubmit={handleCompanySubmit} className="p-6 space-y-4">
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
            <div className="flex justify-end">
              <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg text-xs font-medium flex items-center gap-2">
                <Save size={14} /> Save Company Settings
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
              <p className="text-sm font-medium text-slate-900 uppercase">{user?.role?.replace('_', ' ')}</p>
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
