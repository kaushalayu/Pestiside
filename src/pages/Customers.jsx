import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { ShieldCheck, Plus, Search, Phone, MapPin, Mail, Edit3, Trash2, FileText, IndianRupee } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const fetchCustomers = async () => (await api.get('/customers')).data.data;

const Customers = () => {
  const { user } = useSelector(state => state.auth);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { data: customers, isLoading } = useQuery({ queryKey: ['customers'], queryFn: fetchCustomers });

  const [formData, setFormData] = useState({
    title: 'Mr', name: '', phone: '', whatsapp: '', email: '', address: '', city: '', gstNo: ''
  });

  const mutation = useMutation({
    mutationFn: (data) => data._id ? api.put(`/customers/${data._id}`, data) : api.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setIsModalOpen(false);
      setFormData({ title: 'Mr', name: '', phone: '', whatsapp: '', email: '', address: '', city: '', gstNo: '' });
      toast.success('Customer saved');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save customer')
  });

  const filteredCustomers = customers?.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg"><ShieldCheck size={20} /></div>
            Customers
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Client Registry</p>
        </div>
        
        <button onClick={() => { setFormData({ title: 'Mr', name: '', phone: '', whatsapp: '', email: '', address: '', city: '', gstNo: '' }); setIsModalOpen(true); }} className="px-6 py-3 bg-brand-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-brand-500 active:scale-95 flex items-center justify-center gap-2 border-b-4 border-slate-900">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH BY NAME, PHONE OR CITY..." 
          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-brand-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse h-40"></div>)
        ) : filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
          <div key={customer._id} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-900 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">{customer.title} {customer.name}</h3>
                <p className="text-[10px] text-slate-500 font-medium mt-1">{customer.branchId?.branchName}</p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setFormData(customer); setIsModalOpen(true); }} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg"><Edit3 size={14} /></button>
              </div>
            </div>
            <div className="space-y-2 text-[10px]">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={12} /> {customer.phone}
              </div>
              {customer.whatsapp && <div className="flex items-center gap-2 text-slate-600">WhatsApp: {customer.whatsapp}</div>}
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={12} /> {customer.city}
              </div>
              {customer.email && <div className="flex items-center gap-2 text-slate-600"><Mail size={12} /> {customer.email}</div>}
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-400 font-medium">No customers found</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-slate-900 uppercase mb-4">{formData._id ? 'Edit' : 'New'} Customer</h2>
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase">Title</label>
                <select value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs">
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="M/s">M/s</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase">Name *</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase">Phone *</label>
                  <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase">WhatsApp</label>
                  <input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-600 uppercase">Address *</label>
                <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase">City *</label>
                  <input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-600 uppercase">GST No</label>
                  <input value={formData.gstNo} onChange={e => setFormData({...formData, gstNo: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-xs font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
