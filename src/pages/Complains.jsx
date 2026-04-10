import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { 
  AlertTriangle, Plus, X, Send, Check, Clock, 
  Building2, User, Phone, MessageSquare, Filter
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const COMPLAIN_TYPES = [
  { value: 'SERVICE_QUALITY', label: 'Service Quality', color: 'bg-red-100 text-red-700' },
  { value: 'STAFF_BEHAVIOR', label: 'Staff Behavior', color: 'bg-orange-100 text-orange-700' },
  { value: 'DELAYED_SERVICE', label: 'Delayed Service', color: 'bg-amber-100 text-amber-700' },
  { value: 'BILLING_ISSUE', label: 'Billing Issue', color: 'bg-blue-100 text-blue-700' },
  { value: 'PRODUCT_QUALITY', label: 'Product Quality', color: 'bg-purple-100 text-purple-700' },
  { value: 'OTHER', label: 'Other', color: 'bg-slate-100 text-slate-700' },
];

const PRIORITY_COLORS = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

const STATUS_COLORS = {
  OPEN: 'bg-red-100 text-red-700',
  ASSIGNED: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  SOLVED: 'bg-emerald-100 text-emerald-700',
};

const Complains = () => {
  const { user } = useSelector(state => state.auth);
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'super_admin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [assignModal, setAssignModal] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('');

  const [formData, setFormData] = useState({
    orderNo: '',
    receiptNo: '',
    employeeId: '',
    customerName: '',
    customerPhone: '',
    complainType: 'SERVICE_QUALITY',
    description: '',
    priority: 'MEDIUM',
    complainBranchId: ''
  });

  const { data: myComplains, refetch: refetchMy } = useQuery({
    queryKey: ['myComplains'],
    queryFn: async () => {
      const res = await api.get('/complains/my');
      return res.data.data || [];
    },
    staleTime: 0,
    refetchInterval: 3000,
  });

  const { data: allComplains, refetch: refetchAll } = useQuery({
    queryKey: ['allComplains', filterStatus],
    queryFn: async () => {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const res = await api.get(`/complains/all${params}`);
      return res.data.data || [];
    },
    enabled: isSuperAdmin,
    staleTime: 0,
    refetchInterval: 3000,
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/complains/branches');
      return res.data.data || [];
    },
    enabled: isSuperAdmin,
    staleTime: 0,
    refetchInterval: 10000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/complains', data),
    onMutate: async (newComplain) => {
      await queryClient.cancelQueries(['myComplains']);
      const previousComplains = queryClient.getQueryData(['myComplains']);
      
      const tempComplain = {
        _id: 'temp-' + Date.now(),
        ...newComplain,
        userId: { name: user?.name },
        status: 'OPEN',
        createdAt: new Date().toISOString()
      };
      
      queryClient.setQueryData(['myComplains'], (old) => [tempComplain, ...(old || [])]);
      
      return { previousComplains };
    },
    onError: (err, newComplain, context) => {
      queryClient.setQueryData(['myComplains'], context?.previousComplains);
      toast.error(err.response?.data?.message || 'Failed to submit complain');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myComplains'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Complain submitted successfully');
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, assignedToBranch }) => 
      api.put(`/complains/${id}/assign`, { assignedToBranch }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries(['allComplains']);
      const previousComplains = queryClient.getQueryData(['allComplains']);
      
      queryClient.setQueryData(['allComplains'], (old) => 
        old?.map(c => c._id === id ? { ...c, status: 'ASSIGNED' } : c) || []
      );
      
      return { previousComplains };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['allComplains'], context?.previousComplains);
      toast.error(err.response?.data?.message || 'Failed to assign');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allComplains'] });
      setAssignModal(null);
      setSelectedBranch('');
      toast.success('Complain assigned successfully');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, resolution }) => 
      api.put(`/complains/${id}/status`, { status, resolution }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries(['myComplains']);
      await queryClient.cancelQueries(['allComplains']);
      const previousMyComplains = queryClient.getQueryData(['myComplains']);
      const previousAllComplains = queryClient.getQueryData(['allComplains']);
      
      queryClient.setQueryData(['myComplains'], (old) => 
        old?.map(c => c._id === id ? { ...c, status } : c) || []
      );
      queryClient.setQueryData(['allComplains'], (old) => 
        old?.map(c => c._id === id ? { ...c, status } : c) || []
      );
      
      return { previousMyComplains, previousAllComplains };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['myComplains'], context?.previousMyComplains);
      queryClient.setQueryData(['allComplains'], context?.previousAllComplains);
      toast.error(err.response?.data?.message || 'Failed to update status');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myComplains'] });
      queryClient.invalidateQueries({ queryKey: ['allComplains'] });
      toast.success('Status updated');
    },
  });

  const resetForm = () => setFormData({
    orderNo: '',
    receiptNo: '',
    employeeId: '',
    customerName: '',
    customerPhone: '',
    complainType: 'SERVICE_QUALITY',
    description: '',
    priority: 'MEDIUM',
    complainBranchId: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      return toast.error('Please describe your complain');
    }
    createMutation.mutate(formData);
  };

  const getComplainTypeLabel = (type) => {
    return COMPLAIN_TYPES.find(t => t.value === type)?.label || type;
  };

  const complains = isSuperAdmin ? allComplains : myComplains;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-red-600 text-white rounded-lg">
              <AlertTriangle size={20} />
            </div>
            Complains
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isSuperAdmin ? 'Manage and assign complains' : 'Submit your complains'}
          </p>
        </div>
        {user?.role !== 'employee' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-red-700 shadow-lg shadow-red-600/30"
          >
            <Plus size={16} /> Submit Complain
          </button>
        )}
      </div>

      {isSuperAdmin && (
        <div className="flex gap-2">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium"
          >
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="SOLVED">Solved</option>
          </select>
        </div>
      )}

      <div className="space-y-4">
        {complains?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <AlertTriangle size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No complains found</p>
          </div>
        ) : (
          complains?.map(complain => (
            <div key={complain._id} className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${COMPLAIN_TYPES.find(t => t.value === complain.complainType)?.color || 'bg-slate-100'}`}>
                    {getComplainTypeLabel(complain.complainType)}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${PRIORITY_COLORS[complain.priority]}`}>
                    {complain.priority}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${STATUS_COLORS[complain.status]}`}>
                    {complain.status}
                  </span>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{new Date(complain.createdAt).toLocaleDateString('en-IN')}</p>
                  <p>{new Date(complain.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-800 mb-3">{complain.description}</p>

              {(complain.orderNo || complain.receiptNo || complain.customerName) && (
                <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-3 bg-slate-50 p-3 rounded-lg">
                  {complain.orderNo && <span><strong>Order:</strong> {complain.orderNo}</span>}
                  {complain.receiptNo && <span><strong>Receipt:</strong> {complain.receiptNo}</span>}
                  {complain.employeeId && <span><strong>Emp ID:</strong> {complain.employeeId}</span>}
                  {complain.customerName && <span><strong>Customer:</strong> {complain.customerName}</span>}
                  {complain.customerPhone && <span><strong>Phone:</strong> {complain.customerPhone}</span>}
                </div>
              )}

              {isSuperAdmin && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                  {complain.status === 'OPEN' && (
                    <button
                      onClick={() => setAssignModal(complain)}
                      className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-200"
                    >
                      Assign to Branch
                    </button>
                  )}
                  {complain.status === 'ASSIGNED' && (
                    <button
                      onClick={() => statusMutation.mutate({ id: complain._id, status: 'IN_PROGRESS' })}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200"
                    >
                      Mark In Progress
                    </button>
                  )}
                  {complain.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => {
                        const resolution = prompt('Enter resolution notes:');
                        if (resolution !== null) {
                          statusMutation.mutate({ id: complain._id, status: 'SOLVED', resolution });
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-200"
                    >
                      Mark Solved
                    </button>
                  )}
                </div>
              )}

              {!isSuperAdmin && complain.status !== 'SOLVED' && (
                <div className="pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const resolution = prompt('Enter resolution (how was it solved):');
                      if (resolution !== null) {
                        statusMutation.mutate({ id: complain._id, status: 'SOLVED', resolution });
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-200"
                  >
                    Mark as Solved
                  </button>
                </div>
              )}

              {complain.status === 'SOLVED' && complain.resolution && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-700">Resolution:</p>
                  <p className="text-sm text-emerald-800">{complain.resolution}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Submit Complain Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Submit Complain</h3>
                  <p className="text-red-100 text-xs">We will review and resolve your issue</p>
                </div>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Order Number</label>
                  <input 
                    value={formData.orderNo}
                    onChange={e => setFormData({...formData, orderNo: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Receipt Number</label>
                  <input 
                    value={formData.receiptNo}
                    onChange={e => setFormData({...formData, receiptNo: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Employee ID</label>
                  <input 
                    value={formData.employeeId}
                    onChange={e => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Customer Name</label>
                  <input 
                    value={formData.customerName}
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Customer Phone</label>
                <input 
                  value={formData.customerPhone}
                  onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                  placeholder="Optional"
                />
              </div>

              {isSuperAdmin && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Branch *</label>
                  <select 
                    value={formData.complainBranchId}
                    onChange={e => setFormData({...formData, complainBranchId: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                    required
                  >
                    <option value="">Select a branch</option>
                    {branches?.map(branch => (
                      <option key={branch._id} value={branch._id}>{branch.branchName} - {branch.city}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Complain Type *</label>
                <select 
                  value={formData.complainType}
                  onChange={e => setFormData({...formData, complainType: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                >
                  {COMPLAIN_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Priority</label>
                <select 
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase block mb-1">Description *</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm resize-none"
                  rows="4"
                  placeholder="Describe your complain in detail..."
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                {createMutation.isPending ? 'Submitting...' : 'Submit Complain'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-4 rounded-t-3xl flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Assign Complain</h3>
                <p className="text-amber-100 text-xs">Select branch to assign</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Select Branch</label>
                <select 
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                >
                  <option value="">Select a branch</option>
                  {branches?.map(branch => (
                    <option key={branch._id} value={branch._id}>{branch.branchName} - {branch.city}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => { setAssignModal(null); setSelectedBranch(''); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (!selectedBranch) return toast.error('Please select a branch');
                    assignMutation.mutate({ id: assignModal._id, assignedToBranch: selectedBranch });
                  }}
                  disabled={assignMutation.isPending}
                  className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-500 disabled:opacity-50"
                >
                  {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complains;
