import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Target, Plus, Search, Phone, MapPin, Calendar, Star,
  ChevronLeft, ChevronRight, X, Trash2, UserCheck,
  Clock, AlertCircle, Tag, IndianRupee, Eye, Users,
  TrendingUp, Filter, MoreVertical, ArrowUpRight, Zap
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import ErrorBoundary from '../components/ErrorBoundary';

const STATUS_CONFIG = {
  NEW: { color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'New' },
  CONTACTED: { color: 'bg-blue-100 text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', label: 'Contacted' },
  VISIT_DONE: { color: 'bg-cyan-100 text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500', label: 'Visit Done' },
  DEMO_SCHEDULED: { color: 'bg-violet-100 text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500', label: 'Demo Sched.' },
  QUALIFIED: { color: 'bg-purple-100 text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500', label: 'Qualified' },
  CONVERTED: { color: 'bg-slate-900 text-white', border: 'border-slate-900', dot: 'bg-emerald-400', label: 'Converted' },
  LOST: { color: 'bg-red-100 text-red-600', border: 'border-red-200', dot: 'bg-red-500', label: 'Lost' },
  JUNK: { color: 'bg-slate-100 text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400', label: 'Junk' },
};

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', ring: 'ring-slate-200', text: 'text-slate-500', bg: 'bg-slate-50' },
  MEDIUM: { label: 'Medium', ring: 'ring-amber-200', text: 'text-amber-600', bg: 'bg-amber-50' },
  HIGH: { label: 'High', ring: 'ring-orange-200', text: 'text-orange-600', bg: 'bg-orange-50' },
  URGENT: { label: 'Urgent', ring: 'ring-red-300', text: 'text-red-600', bg: 'bg-red-50' },
};

const EMPTY_FORM = {
  name: '', phone: '', email: '', city: '', address: '',
  source: 'Walk-in', propertyType: 'Residential',
  serviceInterest: [], priority: 'MEDIUM',
  budget: '', budgetRange: '', requirement: '', notes: '', branchId: '',
  expectedCloseDate: '',
};

// ── Confirm Popup ─────────────────────────────────────────────────────────────
const ConfirmPopup = ({ title, message, onConfirm, onCancel, danger = false }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-150">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
        <AlertCircle size={24} className={danger ? 'text-red-500' : 'text-amber-500'} />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-5 leading-relaxed">{message}</p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl">Cancel</button>
        <button onClick={onConfirm} className={`flex-1 py-2.5 font-semibold text-sm rounded-xl text-white ${danger ? 'bg-red-500' : 'bg-slate-900'}`}>Confirm</button>
      </div>
    </div>
  </div>
);

// ── Assign Modal ──────────────────────────────────────────────────────────────
const AssignModal = ({ lead, user, branches, onClose, onSubmit, isLoading }) => {
  const isSuperAdmin = user?.role === 'super_admin';
  const isSales = user?.role === 'sales';
  const canPickBranch = isSuperAdmin || isSales;
  const [selectedBranch, setSelectedBranch] = useState(
    lead.branchId?._id || lead.branchId ||
    (canPickBranch ? '' : (user?.branchId?._id || user?.branchId || ''))
  );
  const [selectedUser, setSelectedUser] = useState('');

  const { data: employees } = useQuery({
    queryKey: ['branch-employees', selectedBranch],
    queryFn: async () => {
      if (!selectedBranch) return [];
      const res = await api.get(`/employees?branchId=${selectedBranch}&isActive=true`);
      return res.data?.data || [];
    },
    enabled: !!selectedBranch,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) { toast.error('Please select an employee'); return; }
    const payload = { assignedTo: selectedUser };
    if (canPickBranch && selectedBranch) payload.branchId = selectedBranch;
    onSubmit(lead._id, payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
              <UserCheck size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Assign Lead</h3>
              <p className="text-xs text-slate-400">{lead.name} • {lead.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {canPickBranch && (
            <div>
              <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1 sm:mb-1.5">Branch</label>
              <select value={selectedBranch} onChange={e => { setSelectedBranch(e.target.value); setSelectedUser(''); }}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 p-2 sm:p-2.5 rounded-xl text-xs sm:text-sm font-medium outline-none">
                <option value="">Select branch...</option>
                {branches?.map(b => <option key={b._id} value={b._id}>{b.branchName} ({b.branchCode})</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1 sm:mb-1.5">Assign To</label>
            <select required value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 p-2 sm:p-2.5 rounded-xl text-xs sm:text-sm font-medium outline-none"
              disabled={canPickBranch && !selectedBranch}>
              <option value="">{(canPickBranch && !selectedBranch) ? 'Select branch first' : 'Select employee...'}</option>
              {employees?.map(e => <option key={e._id} value={e._id}>{e.name} ({e.role?.replace('_', ' ')})</option>)}
            </select>
          </div>
          {lead.assignedTo?.name && (
            <p className="text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg">
              Currently: <span className="font-semibold text-slate-600">{lead.assignedTo.name}</span>
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-slate-900 text-white font-semibold text-sm rounded-xl disabled:opacity-50">
              {isLoading ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Lead Card ─────────────────────────────────────────────────────────────────
const LeadCard = ({ lead, user, onStatusChange, onDelete, onView, onFollowUp, onAssign }) => {
  const st = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
  const pr = PRIORITY_CONFIG[lead.priority] || PRIORITY_CONFIG.MEDIUM;
  const isOverdue = lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date();
  const canDelete = user?.role === 'super_admin';
  const canAssign = user?.role === 'super_admin' || user?.role === 'branch_admin' || user?.role === 'sales';

  const priorityGradients = {
    URGENT: 'from-red-500 to-red-600',
    HIGH: 'from-orange-500 to-orange-600',
    MEDIUM: 'from-amber-500 to-amber-600',
    LOW: 'from-slate-400 to-slate-500',
  };
  const priorityGradient = priorityGradients[lead.priority] || priorityGradients.LOW;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 overflow-hidden group">
      {/* Top gradient strip */}
      <div className={`h-1 w-full bg-gradient-to-r ${priorityGradient}`} />

      <div className="p-3 sm:p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
          <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold ${st.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button onClick={() => onView(lead)} className="p-1 sm:p-1.5 bg-slate-100 rounded-lg text-slate-400">
              <Eye size={12} className="sm:w-3.5 sm:h-3.5" />
            </button>
            {canDelete && (
              <button onClick={() => onDelete(lead)} className="p-1 sm:p-1.5 bg-red-50 rounded-lg text-slate-400">
                <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Name & contact */}
        <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-0.5 sm:mb-1 truncate">{lead.name}</h3>
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500 mb-2 sm:mb-3">
          <span className="flex items-center gap-0.5"><Phone size={9} className="sm:w-2.5 sm:h-2.5" />{lead.phone}</span>
          <span className="flex items-center gap-0.5"><MapPin size={9} className="sm:w-2.5 sm:h-2.5" />{lead.city}</span>
        </div>

        {/* Services */}
        {lead.serviceInterest?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
            {lead.serviceInterest.slice(0, 2).map(s => (
              <span key={s} className="px-2 py-0.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg text-[9px] sm:text-[10px] font-bold text-blue-600">{s}</span>
            ))}
            {lead.serviceInterest.length > 2 && (
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-[9px] sm:text-[10px] text-slate-500 font-medium">+{lead.serviceInterest.length - 2}</span>
            )}
          </div>
        )}

        {/* Requirement */}
        {lead.requirement && (
          <p className="text-[10px] sm:text-xs text-slate-400 italic bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg px-3 py-2 mb-2 sm:mb-3 line-clamp-2 border border-slate-100">"{lead.requirement}"</p>
        )}

        {/* Assigned to */}
        {lead.assignedTo?.name && (
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 mb-2 sm:mb-3 bg-gradient-to-r from-purple-50 to-blue-50 px-2.5 py-1 rounded-lg border border-purple-100">
            <Users size={10} className="sm:w-2.5 sm:h-2.5 text-purple-500" />
            <span className="truncate font-medium">{lead.assignedTo.name}</span>
          </div>
        )}

        {/* Follow-up badge */}
        {lead.nextFollowUp && (
          <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-lg mb-2 sm:mb-3 ${isOverdue ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-600 border border-red-200' : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 border border-blue-200'}`}>
            <Clock size={10} className="sm:w-2.5 sm:h-2.5" />
            {isOverdue ? '⚠️ Overdue' : '📅 Follow-up'}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-amber-500 font-bold">
            <Star size={10} className="sm:w-3 sm:h-3" fill="currentColor" /> {lead.leadScore || 0}
            {lead.budgetRange && <span className="text-slate-400 font-normal ml-2 hidden sm:inline">· {lead.budgetRange}</span>}
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button onClick={() => onFollowUp(lead)}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 rounded-lg text-[9px] sm:text-[10px] font-bold flex items-center gap-1 border border-amber-200">
              <Calendar size={9} className="sm:w-2.5 sm:h-2.5" /> <span className="hidden sm:inline">Log</span>
            </button>
            {canAssign && (
              <button onClick={() => onAssign(lead)}
                className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 rounded-lg text-[9px] sm:text-[10px] font-bold flex items-center gap-1 border border-purple-200">
                <UserCheck size={9} className="sm:w-2.5 sm:h-2.5" /> <span className="hidden sm:inline">Assign</span>
              </button>
            )}
            {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
              <select value="" onChange={e => e.target.value && onStatusChange(lead._id, e.target.value)}
                className="px-1.5 py-1.5 sm:px-2 sm:py-1.5 bg-slate-100 border-0 rounded-lg text-[9px] sm:text-[10px] font-bold text-slate-600 outline-none cursor-pointer">
                <option value="">→</option>
                {Object.keys(STATUS_CONFIG).filter(s => s !== lead.status).map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Lead Form Modal ───────────────────────────────────────────────────────────
const LeadFormModal = ({ user, branches, onClose, onSubmit, isLoading }) => {
  const isSuperAdmin = user?.role === 'super_admin';
  const userBranchId = user?.branchId?._id || user?.branchId || '';
  const [form, setForm] = useState({ ...EMPTY_FORM, branchId: isSuperAdmin ? '' : userBranchId });
  const [showConfirm, setShowConfirm] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isSuperAdmin && userBranchId) setForm(f => ({ ...f, branchId: userBranchId }));
    else if (isSuperAdmin && branches?.length === 1) setForm(f => ({ ...f, branchId: branches[0]._id }));
  }, [branches]);

  const toggleService = (s) => set('serviceInterest',
    form.serviceInterest.includes(s) ? form.serviceInterest.filter(x => x !== s) : [...form.serviceInterest, s]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.city.trim()) { toast.error('Name, phone and city are required'); return; }
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) { toast.error('Enter a valid 10-digit Indian mobile number'); return; }
    if (!form.branchId) { toast.error('Please select a branch'); return; }
    setShowConfirm(true);
  };

  const branchName = branches?.find(b => b._id === form.branchId || b._id === userBranchId)?.branchName
    || user?.branchId?.branchName || 'Your Branch';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[92vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-900 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Target size={14} className="sm:w-4 sm:h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">New Lead</h2>
                <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">Core details locked after submission</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 bg-slate-100 rounded-lg text-slate-400"><X size={16} className="sm:w-4 sm:h-4" /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Basic Info */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact Info</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name *</label>
                  <input required value={form.name} onChange={e => set('name', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white p-2.5 rounded-xl text-sm font-medium outline-none"
                    placeholder="Customer name" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Phone *</label>
                  <input required value={form.phone} onChange={e => set('phone', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white p-2.5 rounded-xl text-sm font-medium outline-none"
                    placeholder="10-digit mobile" maxLength={10} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">City *</label>
                  <input required value={form.city} onChange={e => set('city', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white p-2.5 rounded-xl text-sm font-medium outline-none"
                    placeholder="City" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white p-2.5 rounded-xl text-sm font-medium outline-none"
                    placeholder="optional" />
                </div>
              </div>
            </div>

            {/* Source & Branch */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Assignment</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Lead Source</label>
                  <select value={form.source} onChange={e => set('source', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 p-2.5 rounded-xl text-sm font-medium outline-none">
                    {['Walk-in', 'Phone Call', 'Website', 'Google', 'Facebook', 'Justdial', 'Reference', 'Social Media', 'Other'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Branch *</label>
                  {isSuperAdmin ? (
                    <select required value={form.branchId} onChange={e => set('branchId', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 p-2.5 rounded-xl text-sm font-medium outline-none">
                      <option value="">Select branch...</option>
                      {branches?.map(b => <option key={b._id} value={b._id}>{b.branchName}</option>)}
                    </select>
                  ) : (
                    <div className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm font-medium text-slate-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />{branchName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Property & Priority */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Property Type</label>
                  <select value={form.propertyType} onChange={e => set('propertyType', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 p-2.5 rounded-xl text-sm font-medium outline-none">
                    {['Residential', 'Commercial', 'Industrial', 'Office', 'Restaurant', 'Hotel', 'Hospital', 'Warehouse', 'Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Budget Range</label>
                  <select value={form.budgetRange} onChange={e => set('budgetRange', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 p-2.5 rounded-xl text-sm font-medium outline-none">
                    <option value="">Select range...</option>
                    {['Under 5K', '5K-10K', '10K-25K', '25K-50K', '50K-1L', 'Above 1L'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-2">Priority</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <button key={k} type="button" onClick={() => set('priority', k)}
                    className={`py-2 rounded-xl text-xs font-semibold border ${form.priority === k ? 'bg-slate-900 border-slate-900 text-white' : `${v.bg} border-slate-200 ${v.text}`}`}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-2">Service Interest</label>
              <div className="flex flex-wrap gap-2">
                {['AMC', 'GPC', 'ATT', 'BOTH', 'Fumigation', 'Rodent', 'Bird Control', 'Other'].map(s => (
                  <button key={s} type="button" onClick={() => toggleService(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${form.serviceInterest.includes(s) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Requirement */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Requirement</label>
              <textarea value={form.requirement} onChange={e => set('requirement', e.target.value)} rows={3}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white p-2.5 rounded-xl text-sm font-medium outline-none resize-none"
                placeholder="Describe the pest problem or requirement..." />
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-3 bg-slate-900 text-white font-semibold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
              <Zap size={15} /> Review & Submit Lead
            </button>
          </form>
        </div>
      </div>

      {showConfirm && (
        <ConfirmPopup
          title="Submit this lead?"
          message={`"${form.name}" · ${form.phone} · ${form.city}. Core details cannot be edited after submission.`}
          onConfirm={() => { setShowConfirm(false); onSubmit(form); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};

// ── Follow-up Modal ───────────────────────────────────────────────────────────
const FollowUpModal = ({ lead, onClose, onSubmit, isLoading }) => {
  const [data, setData] = useState({ notes: '', outcome: '', nextFollowUp: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
              <Calendar size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Log Follow-up</h3>
              <p className="text-xs text-slate-400">{lead.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSubmit(lead._id, data); }} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1 sm:mb-1.5">Outcome</label>
            <select value={data.outcome} onChange={e => setData(d => ({ ...d, outcome: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 p-2 sm:p-2.5 rounded-xl text-xs sm:text-sm font-medium outline-none">
              <option value="">Select outcome...</option>
              {[['CALL_NOT_ANSWERED', 'Call Not Answered'], ['BUSY', 'Busy'], ['NOT_INTERESTED', 'Not Interested'],
              ['PRICE_HIGH', 'Price Too High'], ['COMPETING', 'Going with Competitor'], ['SCHEDULED_VISIT', 'Scheduled Visit'], ['OTHER', 'Other']
              ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1 sm:mb-1.5">Notes</label>
            <textarea value={data.notes} onChange={e => setData(d => ({ ...d, notes: e.target.value }))} rows={3}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 p-2 sm:p-2.5 rounded-xl text-xs sm:text-sm font-medium outline-none resize-none"
              placeholder="What happened in this follow-up?" />
          </div>
          <div>
            <label className="text-[10px] sm:text-xs font-semibold text-slate-600 block mb-1 sm:mb-1.5">Next Follow-up Date</label>
            <input type="date" value={data.nextFollowUp} onChange={e => setData(d => ({ ...d, nextFollowUp: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 p-2 sm:p-2.5 rounded-xl text-xs sm:text-sm font-medium outline-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 sm:py-2.5 bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2 sm:py-2.5 bg-amber-500 text-white font-semibold text-xs sm:text-sm rounded-xl disabled:opacity-50">
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Lead Detail Drawer ────────────────────────────────────────────────────────
const LeadDetailDrawer = ({ lead, onClose }) => {
  if (!lead) return null;
  const st = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <h3 className="font-bold text-slate-900 text-sm">Lead Details</h3>
          <button onClick={onClose} className="p-1.5 bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">{lead.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{lead.phone}{lead.email && ` · ${lead.email}`}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${st.color}`}>{st.label}</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            Core details (name, phone, city) are locked after creation.
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[['City', lead.city], ['Property', lead.propertyType], ['Source', lead.source],
            ['Priority', lead.priority], ['Budget', lead.budgetRange || '—'], ['Score', lead.leadScore || 0],
            ['Branch', lead.branchId?.branchName || '—'], ['Assigned', lead.assignedTo?.name || 'Unassigned'],
            ].map(([k, v]) => (
              <div key={k} className="bg-slate-50 p-3 rounded-xl">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{k}</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{v}</p>
              </div>
            ))}
          </div>

          {lead.serviceInterest?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {lead.serviceInterest.map(s => (
                  <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {lead.requirement && (
            <div className="bg-slate-50 p-3 rounded-xl">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Requirement</p>
              <p className="text-sm text-slate-700 italic">"{lead.requirement}"</p>
            </div>
          )}

          {lead.followups?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Follow-up History ({lead.followups.length})</p>
              <div className="space-y-2">
                {[...lead.followups].reverse().map((f, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-slate-500">{f.outcome?.replace(/_/g, ' ') || 'Note'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(f.date).toLocaleDateString('en-IN')}</span>
                    </div>
                    {f.notes && <p className="text-xs text-slate-600">{f.notes}</p>}
                    {f.nextFollowUp && <p className="text-[10px] text-blue-600 font-semibold mt-1">Next: {new Date(f.nextFollowUp).toLocaleDateString('en-IN')}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Leads Page ───────────────────────────────────────────────────────────
const Leads = () => {
  const { user } = useSelector(s => s.auth);
  const qc = useQueryClient();
  const isSuperAdmin = user?.role === 'super_admin';
  const canDelete = isSuperAdmin;
  const canAssign = isSuperAdmin || user?.role === 'branch_admin' || user?.role === 'sales';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [followUpTarget, setFollowUpTarget] = useState(null);
  const [viewLead, setViewLead] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignedToMeFilter, setAssignedToMeFilter] = useState(false);

  const { data: leadsRes, isLoading } = useQuery({
    queryKey: ['leads', search, statusFilter, priorityFilter, page, assignedToMeFilter],
    queryFn: async () => {
      const p = new URLSearchParams({ page, limit: 12 });
      if (search) p.append('search', search);
      if (statusFilter !== 'ALL') p.append('status', statusFilter);
      if (priorityFilter !== 'ALL') p.append('priority', priorityFilter);
      if (assignedToMeFilter) p.append('assignedToMe', 'true');
      return (await api.get(`/leads?${p}`)).data;
    },
    staleTime: 0,
    refetchInterval: 3000,
  });

  const { data: statsRes } = useQuery({
    queryKey: ['leadStats'],
    queryFn: async () => (await api.get('/leads/stats')).data?.data || {},
    staleTime: 0,
    refetchInterval: 3000,
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await api.get('/branches')).data?.data || [],
    enabled: isSuperAdmin || user?.role === 'branch_admin' || user?.role === 'sales',
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/leads', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['leadStats'] });
      setShowForm(false);
      toast.success('Lead created');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create lead'),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/leads/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['leadStats'] });
      toast.success('Status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/leads/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['leadStats'] });
      setDeleteTarget(null);
      toast.success('Lead deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });
  const followUpMutation = useMutation({
    mutationFn: ({ id, data }) => api.post(`/leads/${id}/followup`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['leadStats'] });
      setFollowUpTarget(null);
      toast.success('Follow-up saved');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
  const assignMutation = useMutation({
    mutationFn: ({ id, payload }) => api.post(`/leads/${id}/assign`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['leadStats'] });
      setAssignTarget(null);
      toast.success('Lead assigned');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Assign failed'),
  });

  const leads = leadsRes?.data || [];
  const pagination = leadsRes?.pagination || {};
  const totalLeads = pagination.total || statsRes?.totalLeads || leads.length;
  const stats = statsRes?.statusStats || [];
  const getCount = (s) => stats.find(x => x._id === s)?.count || 0;

  const STAT_TABS = [
    { key: 'ALL', label: 'All', count: totalLeads, color: 'text-slate-900' },
    { key: 'NEW', label: 'New', count: getCount('NEW'), color: 'text-emerald-600' },
    { key: 'QUALIFIED', label: 'Qualified', count: getCount('QUALIFIED'), color: 'text-purple-600' },
    { key: 'CONVERTED', label: 'Converted', count: getCount('CONVERTED'), color: 'text-blue-600' },
    { key: 'LOST', label: 'Lost', count: getCount('LOST'), color: 'text-red-500' },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 pb-20">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Target size={18} className="sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Leads</h1>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                  {isSuperAdmin ? 'All branches' : user?.role === 'branch_admin' ? 'Your branch' : 'Assigned to you'}
                </p>
              </div>
            </div>
            <button onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-purple-200 w-full sm:w-auto">
              <Plus size={15} /> New Lead
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {STAT_TABS.map((s, i) => {
              const colors = [
                'from-slate-700 to-slate-800 shadow-slate-300',
                'from-emerald-500 to-emerald-600 shadow-emerald-200',
                'from-purple-500 to-purple-600 shadow-purple-200',
                'from-blue-500 to-blue-600 shadow-blue-200',
                'from-red-500 to-red-600 shadow-red-200',
              ];
              return (
                <button key={s.key} onClick={() => { setStatusFilter(s.key); setPage(1); }}
                  className={`bg-linear-to-br ${colors[i]} rounded-xl sm:rounded-2xl p-3 sm:p-4 text-left ${statusFilter === s.key ? 'ring-2 ring-offset-2 ring-white ring-opacity-50' : ''}`}>
                  <p className="text-[9px] sm:text-[10px] font-bold text-white text-opacity-80 mb-0.5 sm:mb-1 truncate">{s.label}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-black text-white">{s.count}</p>
                </button>
              );
            })}
          </div>

          {/* Overdue / today alerts */}
          {(statsRes?.overdueFollowups > 0 || statsRes?.followupsToday > 0) && (
            <div className="flex flex-wrap gap-2">
              {statsRes?.overdueFollowups > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl text-xs font-bold text-red-600 shadow-sm">
                  <AlertCircle size={14} /> {statsRes.overdueFollowups} overdue follow-up{statsRes.overdueFollowups > 1 ? 's' : ''}
                </div>
              )}
              {statsRes?.followupsToday > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-600 shadow-sm">
                  <Clock size={14} /> {statsRes.followupsToday} follow-up{statsRes.followupsToday > 1 ? 's' : ''} due today
                </div>
              )}
            </div>
          )}

          {/* Search & filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search name, phone, city..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 focus:border-blue-400 rounded-xl text-xs sm:text-sm font-medium outline-none shadow-sm" />
            </div>
            {!isSuperAdmin && (
              <button
                onClick={() => { setAssignedToMeFilter(!assignedToMeFilter); setPage(1); }}
                className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border shadow-sm ${assignedToMeFilter
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent text-white'
                    : 'bg-white border-slate-200 text-slate-600'
                  }`}
              >
                <Users size={14} /> My Leads
              </button>
            )}
            <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
              className="px-3 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none shadow-sm">
              <option value="ALL">All Priority</option>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Status tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {['ALL', ...Object.keys(STATUS_CONFIG)].map(s => {
              const cfg = STATUS_CONFIG[s];
              const isActive = statusFilter === s;
              return (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap border ${isActive
                      ? (s === 'NEW' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200' :
                        s === 'CONTACTED' ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-200' :
                          s === 'VISIT_DONE' ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-200' :
                            s === 'DEMO_SCHEDULED' ? 'bg-violet-500 border-violet-500 text-white shadow-lg shadow-violet-200' :
                              s === 'QUALIFIED' ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-200' :
                                s === 'CONVERTED' ? 'bg-slate-800 border-slate-800 text-white shadow-lg' :
                                  s === 'LOST' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200' :
                                    s === 'JUNK' ? 'bg-slate-400 border-slate-400 text-white shadow-lg' :
                                      'bg-slate-900 border-slate-900 text-white shadow-lg')
                      : 'bg-white border-slate-200 text-slate-600'
                    }`}>
                  {s === 'ALL' ? 'All' : cfg.label}
                  {s !== 'ALL' && getCount(s) > 0 && <span className="ml-1 opacity-75">({getCount(s)})</span>}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px] gap-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
              </div>
              <p className="text-sm text-slate-500 font-medium">Loading leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] gap-4 bg-linear-to-br from-white to-slate-50 rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="w-20 h-20 bg-linear-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                <Target size={36} className="text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-slate-700 mb-1">No leads yet</p>
                <p className="text-xs text-slate-400">Start by adding your first lead</p>
              </div>
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-200">
                <Plus size={16} /> Add First Lead
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {leads.map(lead => (
                <LeadCard key={lead._id} lead={lead} user={user}
                  onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
                  onDelete={canDelete ? setDeleteTarget : null}
                  onView={setViewLead}
                  onFollowUp={setFollowUpTarget}
                  onAssign={canAssign ? setAssignTarget : null}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between bg-gradient-to-r from-white to-slate-50 px-4 sm:px-5 py-3 sm:py-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
              Showing {((page - 1) * 12) + 1}-{Math.min(page * 12, totalLeads)} of {totalLeads} leads
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 bg-white rounded-xl disabled:opacity-40 text-slate-600 border border-slate-200 shadow-sm">
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm text-xs font-medium text-slate-600">
                {page}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={leads.length < 12}
                className="p-2 bg-white rounded-xl disabled:opacity-40 text-slate-600 border border-slate-200 shadow-sm">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showForm && <LeadFormModal user={user} branches={branches} onClose={() => setShowForm(false)} onSubmit={(data) => createMutation.mutate(data)} isLoading={createMutation.isPending} />}
      {deleteTarget && <ConfirmPopup title="Delete Lead" danger message={`Delete lead for "${deleteTarget.name}"? This cannot be undone.`} onConfirm={() => deleteMutation.mutate(deleteTarget._id)} onCancel={() => setDeleteTarget(null)} />}
      {followUpTarget && <FollowUpModal lead={followUpTarget} onClose={() => setFollowUpTarget(null)} onSubmit={(id, data) => followUpMutation.mutate({ id, data })} isLoading={followUpMutation.isPending} />}
      {assignTarget && <AssignModal lead={assignTarget} user={user} branches={branches} onClose={() => setAssignTarget(null)} onSubmit={(id, payload) => assignMutation.mutate({ id, payload })} isLoading={assignMutation.isPending} />}
      {viewLead && <LeadDetailDrawer lead={viewLead} onClose={() => setViewLead(null)} />}
    </ErrorBoundary>
  );
};

export default Leads;
