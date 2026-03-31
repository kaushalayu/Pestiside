import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, FileText, Download, Filter, Eye, 
  Calendar, Phone, IndianRupee, ShieldCheck, Edit3, X,
  CheckCircle, Clock, XCircle, FileCheck, ChevronDown
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const fetchForms = async () => (await api.get('/forms')).data.data;

const Forms = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSelector(state => state.auth);
  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isFieldStaff = user?.role === 'technician' || user?.role === 'sales';
  const { data: forms, isLoading } = useQuery({ queryKey: ['forms'], queryFn: fetchForms });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [showServicePdfMenu, setShowServicePdfMenu] = useState(null);

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }) => api.patch(`/forms/${id}/status`, { status, notes }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['forms']);
      setShowStatusModal(false);
      setSelectedForm(null);
      setStatusNotes('');
      toast.success(`Status updated to ${res.data.data.status}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Status update failed')
  });

  const filteredForms = forms?.filter(form => {
    const matchesSearch = 
      form.orderNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.customer?.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SCHEDULED': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'DRAFT': return 'SUBMITTED';
      case 'SUBMITTED': return 'SCHEDULED';
      case 'SCHEDULED': return 'COMPLETED';
      default: return null;
    }
  };

  const getStatusActions = (form) => {
    const actions = [];
    const isOwnForm = form.employeeId?._id === user?._id || form.employeeId === user?._id;
    
    // EVERYONE can directly complete - no permission needed!
    if (form.status !== 'COMPLETED' && form.status !== 'CANCELLED') {
      actions.push({ status: 'COMPLETED', label: 'Complete', color: 'emerald', icon: CheckCircle });
    }
    
    // Show submit button for draft forms
    if (form.status === 'DRAFT') {
      actions.push({ status: 'SUBMITTED', label: 'Submit', color: 'blue', icon: FileCheck });
    }
    
    // Show schedule button for submitted forms (for admins)
    if (form.status === 'SUBMITTED' && isAdmin) {
      actions.push({ status: 'SCHEDULED', label: 'Schedule', color: 'amber', icon: Clock });
    }
    
    // Cancel button for admins only
    if (form.status !== 'CANCELLED' && form.status !== 'COMPLETED' && isAdmin) {
      actions.push({ status: 'CANCELLED', label: 'Cancel', color: 'red', icon: XCircle });
    }
    
    return actions;
  };

  const handleStatusChange = (form, newStatus) => {
    // Everyone can directly complete - no modal needed!
    if (newStatus === 'COMPLETED') {
      if (statusMutation) {
        const notes = isAdmin ? 'Completed by Admin' : 'Completed';
        statusMutation.mutate({ id: form._id, status: 'COMPLETED', notes });
      }
      return;
    }
    
    // For other status changes, show modal with selected status
    setSelectedForm(form);
    setSelectedStatus(newStatus);
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    if (!selectedForm || !selectedStatus) return;
    if (statusMutation) {
      statusMutation.mutate({ id: selectedForm._id, status: selectedStatus, notes: statusNotes });
    }
  };

  const handleDownloadPdf = async (formId, orderNo) => {
    try {
      const response = await api.get(`/forms/${formId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `JobCard_${orderNo || formId}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('PDF Generated');
    } catch (err) {
      toast.error('PDF Generation Failed');
    }
  };

  const handleDownloadServicePdf = async (formId, orderNo, serviceIndex) => {
    try {
      const response = await api.get(`/forms/${formId}/service/${serviceIndex}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `JobCard_${orderNo || formId}_Service${serviceIndex + 1}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('Service PDF Generated');
    } catch (err) {
      toast.error('PDF Generation Failed');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/forms/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ServiceForms_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      toast.success('CSV Exported');
    } catch (err) {
      toast.error('Export Failed');
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg"><FileText size={20} /></div>
            Booking Forms
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Service Request Registry</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={handleExportCSV} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-emerald-700">
              <Download size={14} /> Export CSV
            </button>
          )}
          <Link to="/forms/create" className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-slate-800">
            <Plus size={14} /> New Booking
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order, name, phone..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-slate-900"
            />
          </div>
          {!isSuperAdmin && (
            <div className="flex gap-2">
              {['all', 'DRAFT', 'SUBMITTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    statusFilter === status 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Order</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Services</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Amount</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-400">Loading...</td>
                </tr>
              ) : filteredForms?.length > 0 ? (
                filteredForms.map((form) => {
                  const actions = getStatusActions(form);
                  return (
                    <tr key={form._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-slate-900">{form.orderNo || 'N/A'}</div>
                        {!isSuperAdmin && <div className="text-[9px] text-slate-400">{form.branchId?.branchName || 'N/A'}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-slate-600">
                          {new Date(form.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-slate-900">{form.customer?.name || 'N/A'}</div>
                        <div className="text-[9px] text-slate-400">{form.customer?.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[10px] text-slate-600">{form.serviceCategory}</div>
                        <div className="text-[9px] text-slate-400">
                          {form.amcServices?.slice(0, 2).join(', ')}
                          {form.amcServices?.length > 2 && ` +${form.amcServices.length - 2}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-xs font-bold text-slate-900">
                          ₹{(form.billing?.total || 0).toLocaleString('en-IN')}
                        </div>
                        {form.billing?.due > 0 && (
                          <div className="text-[9px] text-red-500">Due: ₹{form.billing.due.toLocaleString('en-IN')}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-[9px] font-bold uppercase border ${getStatusColor(form.status)}`}>
                          {form.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => navigate(`/forms/${form._id}`)}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1"
                            title="View Details"
                          >
                            <Eye size={12} />
                            View
                          </button>
                          <button 
                            onClick={() => handleDownloadPdf(form._id, form.orderNo)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center gap-1"
                            title="Download PDF"
                          >
                            <Download size={12} />
                            PDF
                          </button>
                          {(form.schedule?.scheduledDates?.length > 0) && (
                            <div className="relative inline-block">
                              <button 
                                onClick={() => setShowServicePdfMenu(showServicePdfMenu === form._id ? null : form._id)}
                                className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1"
                              >
                                <FileCheck size={12} />
                                Services
                                <ChevronDown size={10} />
                              </button>
                              {showServicePdfMenu === form._id && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 w-52 max-h-60 overflow-y-auto">
                                  <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100">
                                    Service PDFs ({form.schedule.scheduledDates.length})
                                  </div>
                                  {form.schedule.scheduledDates.map((service, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        handleDownloadServicePdf(form._id, form.orderNo, idx);
                                        setShowServicePdfMenu(null);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 text-slate-700 flex items-center justify-between"
                                    >
                                      <span>Service {idx + 1}</span>
                                      <span className="text-[10px] text-slate-400">{service.formatted || service.date}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {actions.map(action => {
                            const Icon = action.icon;
                            return (
                              <button 
                                key={action.status}
                                onClick={() => handleStatusChange(form, action.status)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-white flex items-center gap-1 ${
                                  action.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                                  action.color === 'amber' ? 'bg-amber-500 hover:bg-amber-600' :
                                  action.color === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                  'bg-red-500 hover:bg-red-600'
                                }`}
                                title={action.label}
                              >
                                <Icon size={12} />
                                {action.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-400">
                    No forms found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showStatusModal && selectedForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-slate-900 px-6 py-4 rounded-t-xl flex items-center justify-between">
              <h3 className="text-white font-bold">Update Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Order</p>
                <p className="text-sm font-bold text-slate-900">{selectedForm.orderNo}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-slate-500 uppercase">Current</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(selectedForm.status)}`}>
                    {selectedForm.status}
                  </span>
                </div>
                <div className="text-slate-400">→</div>
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-slate-500 uppercase">New</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(selectedStatus)}`}>
                    {selectedStatus}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Notes (Optional)</label>
                <textarea 
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add notes about this status change..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-slate-900"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { setShowStatusModal(false); setSelectedStatus(null); }}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmStatusChange}
                  disabled={statusMutation.isPending}
                  className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
                >
                  {statusMutation.isPending ? 'Updating...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forms;
