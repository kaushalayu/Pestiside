import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, Plus, Search, MapPin, Download, CheckCircle2, AlertCircle, Mail, Eye, X, Send, RefreshCw, Edit3 } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../lib/api';
import toast from 'react-hot-toast';

const fetchReceipts = async () => (await api.get('/receipts')).data.data;
const fetchBranches = async () => (await api.get('/branches')).data.data;

const Receipts = () => {
  const queryClient = useQueryClient();
  const { user } = useSelector(state => state.auth);

  const { data: receipts, isLoading } = useQuery({ queryKey: ['receipts'], queryFn: fetchReceipts });
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: fetchBranches,
    enabled: user?.role === 'super_admin'
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editReceipt, setEditReceipt] = useState(null);
  const [viewReceipt, setViewReceipt] = useState(null);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    serviceDescription: '', amount: '', advancePaid: '',
    paymentMode: 'CASH', chequeNo: '', branchId: '', notes: ''
  });

  const resetForm = () => setFormData({
    customerName: '', customerEmail: '', customerPhone: '',
    serviceDescription: '', amount: '', advancePaid: '',
    paymentMode: 'CASH', chequeNo: '', branchId: '', notes: ''
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/receipts', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['receipts']);
      setIsModalOpen(false);
      setEditReceipt(null);
      resetForm();
      toast.success('Receipt generated successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate receipt'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/receipts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['receipts']);
      setIsModalOpen(false);
      setEditReceipt(null);
      resetForm();
      toast.success('Receipt updated successfully!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update receipt'),
  });

  const handleEdit = (receipt) => {
    setEditReceipt(receipt);
    setFormData({
      customerName: receipt.customerName || '',
      customerEmail: receipt.customerEmail || '',
      customerPhone: receipt.customerPhone || '',
      serviceDescription: receipt.serviceDescription || '',
      amount: receipt.amount || '',
      advancePaid: receipt.advancePaid || '',
      paymentMode: receipt.paymentMode || 'CASH',
      chequeNo: receipt.chequeNo || '',
      branchId: receipt.branchId?._id || '',
      notes: receipt.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditReceipt(null);
    resetForm();
  };

  const resendMutation = useMutation({
    mutationFn: (id) => api.post(`/receipts/${id}/resend`),
    onSuccess: () => toast.success('Receipt email resent!'),
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to resend email'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user.role === 'super_admin' && !formData.branchId) {
      toast.error('Branch selection is mandatory for Head Office users.');
      return;
    }
    
    const payload = {
      ...formData,
      amount: Number(formData.amount),
      advancePaid: Number(formData.advancePaid || 0),
    };
    
    if (editReceipt) {
      updateMutation.mutate({ id: editReceipt._id, data: payload });
    } else {
      mutation.mutate(payload);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PAID':    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PARTIAL': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PENDING': return 'bg-red-100 text-red-700 border-red-200';
      default:        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filtered = receipts?.filter(r =>
    r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    r.receiptNo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-24">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-brand-500" /> Accounts & Receipts
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Generate payment receipts, track dues, and auto-email invoices.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={18} /> Generate Receipt
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by customer name or receipt ID..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium placeholder:text-slate-400 shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 font-bold uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Receipt ID</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Staff / Branch</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan="7" className="px-5 py-12 text-center text-slate-400 font-medium">Fetching accounts...</td></tr>
              ) : filtered?.length > 0 ? (
                filtered.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-4 font-bold text-slate-800 tracking-wide text-xs">
                      {rec.receiptNo || <span className="text-slate-300 italic">Pending</span>}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">{rec.customerName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{rec.customerPhone || '—'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-700 text-sm">{rec.employeeId?.name || 'N/A'}</p>
                      <p className="text-[11px] font-bold text-brand-500 mt-0.5 uppercase tracking-widest">
                        {rec.branchId?.branchName || rec.branchId?.branchCode || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-700 truncate max-w-[160px]" title={rec.serviceDescription}>
                        {rec.serviceDescription}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{rec.paymentMode}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="font-bold text-slate-800">₹{rec.amount?.toLocaleString('en-IN')}</p>
                      {rec.balanceDue > 0 ? (
                        <p className="text-[11px] text-red-500 font-semibold mt-0.5">₹{rec.balanceDue?.toLocaleString('en-IN')} due</p>
                      ) : (
                        <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">Fully paid</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border inline-flex items-center gap-1 ${getStatusStyle(rec.status)}`}>
                        {rec.status === 'PAID' && <CheckCircle2 size={10} />}
                        {rec.status === 'PARTIAL' && <AlertCircle size={10} />}
                        {rec.status}
                      </span>
                    </td>

                    {/* ✅ ACTION BUTTONS — always visible */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">

                        {/* Edit Receipt */}
                        <button
                          onClick={() => handleEdit(rec)}
                          title="Edit Receipt"
                          className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all"
                        >
                          <Edit3 size={15} />
                        </button>

                        {/* View Details */}
                        <button
                          onClick={() => setViewReceipt(rec)}
                          title="View Details"
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white transition-all"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Download PDF */}
                        <button
                          onClick={async () => {
                            try {
                              const response = await api.get(`/receipts/${rec._id}/pdf`, { responseType: 'blob' });
                              const url = window.URL.createObjectURL(new Blob([response.data]));
                              const link = document.createElement('a');
                              link.href = url;
                              link.setAttribute('download', `Receipt_${rec.receiptNo || rec._id}.pdf`);
                              document.body.appendChild(link);
                              link.click();
                              toast.success('Receipt PDF Downloaded');
                            } catch (err) {
                              toast.error('PDF Download Failed');
                            }
                          }}
                          title="Download PDF"
                          className="p-2 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white transition-all"
                        >
                          <Download size={15} />
                        </button>

                        {/* Resend Email */}
                        {rec.customerEmail && (
                          <button
                            onClick={() => resendMutation.mutate(rec._id)}
                            disabled={resendMutation.isPending}
                            title={`Resend to ${rec.customerEmail}`}
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                          >
                            {resendMutation.isPending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="px-5 py-12 text-center text-slate-400 font-medium">No receipts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View Detail Modal ── */}
      {viewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewReceipt(null)} />
          <div className="bg-white rounded-3xl w-full max-w-lg relative z-10 shadow-2xl animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-brand-50 to-emerald-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Receipt Details</p>
                <h3 className="text-lg font-display font-bold text-slate-800">{viewReceipt.receiptNo || 'Pending'}</h3>
              </div>
              <button onClick={() => setViewReceipt(null)} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Client */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Client</p>
                <p className="font-bold text-slate-800 text-base">{viewReceipt.customerName}</p>
                {viewReceipt.customerPhone && <p className="text-sm text-slate-500">{viewReceipt.customerPhone}</p>}
                {viewReceipt.customerEmail && (
                  <p className="text-sm text-brand-500 flex items-center gap-1"><Mail size={12} />{viewReceipt.customerEmail}</p>
                )}
              </div>

              {/* Service */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Service</p>
                <p className="font-semibold text-slate-700">{viewReceipt.serviceDescription}</p>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">{viewReceipt.paymentMode}</p>
              </div>

              {/* Billing */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                  <p className="font-black text-slate-900 text-sm">₹{viewReceipt.amount?.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Paid</p>
                  <p className="font-black text-emerald-700 text-sm">₹{viewReceipt.advancePaid?.toLocaleString('en-IN')}</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${viewReceipt.balanceDue > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
                  <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${viewReceipt.balanceDue > 0 ? 'text-red-500' : 'text-emerald-600'}`}>Due</p>
                  <p className={`font-black text-sm ${viewReceipt.balanceDue > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    ₹{viewReceipt.balanceDue?.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex justify-between items-center pt-1">
                <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border inline-flex items-center gap-1.5 ${getStatusStyle(viewReceipt.status)}`}>
                  {viewReceipt.status === 'PAID' && <CheckCircle2 size={12} />}
                  {viewReceipt.status}
                </span>
                <p className="text-[10px] text-slate-400 font-bold">
                  {new Date(viewReceipt.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={async () => {
                    try {
                      const response = await api.get(`/receipts/${viewReceipt._id}/pdf`, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `Receipt_${viewReceipt.receiptNo || viewReceipt._id}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      toast.success('Receipt PDF Downloaded');
                    } catch (err) {
                      toast.error('PDF Download Failed');
                    }
                  }}
                  className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Download size={15} /> Download PDF
                </button>
                {viewReceipt.customerEmail && (
                  <button
                    onClick={() => { resendMutation.mutate(viewReceipt._id); setViewReceipt(null); }}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Mail size={15} /> Resend Email
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create/Edit Receipt Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleModalClose} />
          <div className="bg-white rounded-3xl w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl animate-fade-in max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-display font-bold text-slate-800">{editReceipt ? 'Update Receipt' : 'New Payment Receipt'}</h3>
              <button onClick={handleModalClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Bill To (Client Name) *</label>
                  <input required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="premium-input" placeholder="Rajesh Sharma" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Mobile No</label>
                  <input value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} className="premium-input" placeholder="+91 9999..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Email <span className="font-normal text-slate-400">(for auto PDF)</span></label>
                  <input type="email" value={formData.customerEmail} onChange={e => setFormData({...formData, customerEmail: e.target.value})} className="premium-input" placeholder="client@email.com" />
                </div>

                {user?.role === 'super_admin' && (
                  <div className="space-y-1.5 col-span-2 bg-brand-50/40 rounded-2xl px-4 py-3 border border-brand-100">
                    <label className="text-sm font-bold text-brand-600 ml-1 flex items-center gap-1.5">
                      <MapPin size={14} /> Assign to Branch *
                    </label>
                    <select
                      required
                      value={formData.branchId}
                      onChange={e => setFormData({...formData, branchId: e.target.value})}
                      className="w-full px-4 py-3 bg-white border border-brand-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold"
                    >
                      <option value="">-- Select Target Branch --</option>
                      {branches?.map(b => (
                        <option key={b._id} value={b._id}>{b.branchName} ({b.branchCode})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 ml-1">Description of Services *</label>
                <textarea required rows="2" value={formData.serviceDescription} onChange={e => setFormData({...formData, serviceDescription: e.target.value})} className="premium-input resize-none" placeholder="E.g., Termite control full residential package..." />
              </div>

              <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-800 ml-1">Total Bill (₹) *</label>
                  <input required type="number" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-emerald-600 ml-1">Amount Paid (₹)</label>
                  <input type="number" min="0" value={formData.advancePaid} onChange={e => setFormData({...formData, advancePaid: e.target.value})} className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-red-500 ml-1">Balance Due (₹)</label>
                  <input disabled type="number" value={Number(formData.amount || 0) - Number(formData.advancePaid || 0)} className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-xl font-bold text-red-500 opacity-80 cursor-not-allowed" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Payment Method</label>
                  <select required value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-xs uppercase tracking-wider">
                    <option value="CASH">CASH</option>
                    <option value="ONLINE">ONLINE / UPI</option>
                    <option value="NEFT">NEFT / RTGS</option>
                    <option value="CHEQUE">CHEQUE</option>
                  </select>
                </div>
                {(formData.paymentMode === 'CHEQUE' || formData.paymentMode === 'NEFT') && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 ml-1">Reference / Cheque No</label>
                    <input value={formData.chequeNo} onChange={e => setFormData({...formData, chequeNo: e.target.value})} className="premium-input" placeholder="Ref No..." />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={handleModalClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors">
                  Cancel
                </button>
                <button disabled={mutation.isPending || updateMutation.isPending} type="submit" className="premium-btn">
                  {mutation.isPending || updateMutation.isPending ? 'Processing...' : (editReceipt ? 'Update Receipt' : 'Generate Receipt & Email')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipts;
