import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Clock, Phone, MapPin, AlertCircle, CheckCircle2,
  Search, ChevronLeft, ChevronRight, X, Bell, Star, RefreshCw,
  Filter, TrendingUp, ArrowRight, Users, MessageSquare, CalendarDays,
  IndianRupee, TrendingUp as PriorityIcon, Building2, User,
  Mail, Globe, Tag
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import ErrorBoundary from '../components/ErrorBoundary';

const STATUS_CONFIG = {
  NEW:            { color: 'bg-emerald-100 text-emerald-700', label: 'New' },
  CONTACTED:      { color: 'bg-blue-100 text-blue-700',       label: 'Contacted' },
  VISIT_DONE:     { color: 'bg-cyan-100 text-cyan-700',       label: 'Visit Done' },
  DEMO_SCHEDULED: { color: 'bg-violet-100 text-violet-700',   label: 'Demo Sched.' },
  QUALIFIED:      { color: 'bg-purple-100 text-purple-700',    label: 'Qualified' },
  CONVERTED:      { color: 'bg-slate-900 text-white',         label: 'Converted' },
  LOST:           { color: 'bg-red-100 text-red-600',         label: 'Lost' },
};

const PRIORITY_CONFIG = {
  LOW:    { color: 'bg-slate-100 text-slate-600', label: 'Low',    icon: '↓' },
  MEDIUM: { color: 'bg-blue-100 text-blue-600',   label: 'Medium', icon: '→' },
  HIGH:   { color: 'bg-amber-100 text-amber-600', label: 'High',   icon: '↑' },
  URGENT: { color: 'bg-red-100 text-red-600',     label: 'Urgent', icon: '🔥' },
};

const getDueInfo = (dateStr) => {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due); dueDay.setHours(0, 0, 0, 0);
  const diff = Math.floor((dueDay - today) / 86400000);
  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, color: 'bg-red-50 text-red-600 border-red-200',    icon: 'overdue' };
  if (diff === 0) return { label: 'Due today',                  color: 'bg-amber-50 text-amber-600 border-amber-200', icon: 'today' };
  if (diff === 1) return { label: 'Due tomorrow',               color: 'bg-blue-50 text-blue-600 border-blue-200',   icon: 'soon' };
  return           { label: `In ${diff} days`,                  color: 'bg-slate-50 text-slate-500 border-slate-200', icon: 'future' };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ── Quick Follow-up Modal ─────────────────────────────────────────────────────
const QuickFollowUpModal = ({ lead, onClose, onSubmit, isLoading }) => {
  const [data, setData] = useState({ notes: '', outcome: '', nextFollowUp: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
              <Phone size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Log Follow-up</h3>
              <p className="text-xs text-slate-400">{lead.name} · {lead.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSubmit(lead._id, data); }} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Call Outcome *</label>
            <select required value={data.outcome} onChange={e => setData(d => ({ ...d, outcome: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 p-2.5 rounded-xl text-sm font-medium outline-none">
              <option value="">Select outcome...</option>
              {[['CALL_NOT_ANSWERED','Call Not Answered'],['BUSY','Busy'],['NOT_INTERESTED','Not Interested'],
                ['PRICE_HIGH','Price Too High'],['COMPETING','Going with Competitor'],['SCHEDULED_VISIT','Scheduled Visit'],['OTHER','Other']
              ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Notes</label>
            <textarea value={data.notes} onChange={e => setData(d => ({ ...d, notes: e.target.value }))} rows={3}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 p-2.5 rounded-xl text-sm font-medium outline-none resize-none"
              placeholder="What was discussed?" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Schedule Next Follow-up</label>
            <input type="date" value={data.nextFollowUp} onChange={e => setData(d => ({ ...d, nextFollowUp: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 p-2.5 rounded-xl text-sm font-medium outline-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl disabled:opacity-50">
              {isLoading ? 'Saving...' : 'Log Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OUTCOME_LABELS = {
  CALL_NOT_ANSWERED: 'No Answer',
  BUSY: 'Busy',
  NOT_INTERESTED: 'Not Interested',
  PRICE_HIGH: 'Price High',
  COMPETING: 'Competitor',
  SCHEDULED_VISIT: 'Visit Scheduled',
  OTHER: 'Other',
};

const getOutcomeBadge = (outcome) => {
  const colorMap = {
    CALL_NOT_ANSWERED: 'bg-slate-100 text-slate-600',
    BUSY: 'bg-amber-100 text-amber-700',
    NOT_INTERESTED: 'bg-red-100 text-red-600',
    PRICE_HIGH: 'bg-orange-100 text-orange-700',
    COMPETING: 'bg-purple-100 text-purple-700',
    SCHEDULED_VISIT: 'bg-emerald-100 text-emerald-700',
    OTHER: 'bg-blue-100 text-blue-700',
  };
  return { label: OUTCOME_LABELS[outcome] || outcome, color: colorMap[outcome] || 'bg-slate-100 text-slate-600' };
};

// ── Follow-up Card ────────────────────────────────────────────────────────────
const FollowUpCard = ({ lead, onLog, onStatusChange }) => {
  const st = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
  const priority = PRIORITY_CONFIG[lead.priority] || PRIORITY_CONFIG.MEDIUM;
  const due = getDueInfo(lead.nextFollowUp);
  const isOverdue = due?.icon === 'overdue';
  const isToday = due?.icon === 'today';
  const recentFollowUps = lead.followups?.slice(-5).reverse() || [];

  const totalFollowUps = lead.followups?.length || 0;
  const lastContacted = lead.lastContactedAt ? formatDate(lead.lastContactedAt) : 'Never';

  return (
    <div className={`bg-white rounded-2xl border transition-all hover:shadow-lg overflow-hidden ${isOverdue ? 'border-red-300 shadow-red-100' : isToday ? 'border-amber-300 shadow-amber-100' : 'border-slate-200 hover:border-slate-300'}`}>
      {/* Priority strip */}
      <div className={`h-1 w-full ${isOverdue ? 'bg-gradient-to-r from-red-500 to-red-400' : isToday ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-slate-300 to-slate-200'}`} />

      <div className="p-4 space-y-3">
        {/* Header - Name, Phone, Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900 text-sm truncate">{lead.name}</h3>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${priority.color}`}>
                {priority.icon} {priority.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Phone size={10} className="text-slate-400" />{lead.phone}</span>
              <span className="flex items-center gap-1"><MapPin size={10} className="text-slate-400" />{lead.city || '-'}</span>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${st.color}`}>{st.label}</span>
        </div>

        {/* Due Date Section */}
        <div className={`p-3 rounded-xl border ${due ? due.color : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className={isOverdue ? 'text-red-500' : isToday ? 'text-amber-500' : 'text-slate-400'} />
              <span className="text-xs font-semibold text-slate-600">Next Follow-up</span>
            </div>
            <span className="text-sm font-bold text-slate-800">
              {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : 'Not Set'}
            </span>
          </div>
          {due && (
            <div className="mt-1 text-xs font-medium text-slate-500">
              {due.label}
            </div>
          )}
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Source */}
          <div className="bg-slate-50 rounded-lg p-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
              <Globe size={9} /> Source
            </div>
            <p className="text-xs font-semibold text-slate-700 truncate">{lead.source || 'Direct'}</p>
          </div>
          
          {/* Created */}
          <div className="bg-slate-50 rounded-lg p-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
              <Calendar size={9} /> Created
            </div>
            <p className="text-xs font-semibold text-slate-700">{formatDate(lead.createdAt)}</p>
          </div>
        </div>

        {/* Services */}
        {lead.serviceInterest?.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2.5 border border-blue-100">
            <div className="flex items-center gap-1.5 text-[10px] text-blue-500 font-semibold mb-1.5">
              <Tag size={9} /> Interested Services
            </div>
            <div className="flex flex-wrap gap-1">
              {lead.serviceInterest.map(s => (
                <span key={s} className="px-2 py-0.5 bg-white border border-blue-200 rounded-md text-[10px] font-medium text-blue-600">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Budget & Requirement */}
        {(lead.budget || lead.requirement || lead.propertyType) && (
          <div className="flex flex-wrap gap-3">
            {lead.budget && (
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <IndianRupee size={11} className="text-emerald-500" />
                <span className="font-medium">{lead.budget}</span>
              </div>
            )}
            {lead.propertyType && (
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Building2 size={11} className="text-purple-500" />
                <span className="font-medium">{lead.propertyType}</span>
              </div>
            )}
            {lead.requirement && (
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <MessageSquare size={11} className="text-amber-500" />
                <span className="font-medium truncate">{lead.requirement}</span>
              </div>
            )}
          </div>
        )}

        {/* Assigned & Contact Info */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {lead.assignedTo?.name && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <User size={11} className="text-slate-400" />
                <span className="font-medium">{lead.assignedTo.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock size={10} />
            <span>Last: {lastContacted}</span>
          </div>
        </div>

        {/* Follow-up History Section */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageSquare size={12} className="text-slate-400" />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Follow-up History</span>
              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500">{totalFollowUps}</span>
            </div>
          </div>
          
          {recentFollowUps.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentFollowUps.map((fu, idx) => {
                const outcome = getOutcomeBadge(fu.outcome);
                return (
                  <div key={idx} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[9px] font-bold text-slate-600">
                          {formatDateTime(fu.date)}
                        </span>
                        {fu.nextFollowUp && (
                          <span className="flex items-center gap-1 text-[9px] text-blue-600 font-medium">
                            <CalendarDays size={8} /> {formatDate(fu.nextFollowUp)}
                          </span>
                        )}
                      </div>
                      {fu.outcome && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${outcome.color}`}>
                          {outcome.label}
                        </span>
                      )}
                    </div>
                    {fu.notes && (
                      <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{fu.notes}</p>
                    )}
                    {!fu.notes && !fu.outcome && (
                      <p className="text-[10px] text-slate-300 italic">No notes recorded</p>
                    )}
                    {fu.createdBy?.name && (
                      <p className="text-[9px] text-slate-400 mt-1">By: {fu.createdBy.name}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <Phone size={18} className="text-slate-300 mx-auto mb-1" />
              <p className="text-xs text-slate-400">No follow-ups yet</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 bg-slate-50 -mx-4 px-4 pb-0 mt-4 rounded-b-xl">
          <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
            <Star size={12} fill="currentColor" /> {lead.leadScore || 0}
          </div>
          <div className="flex items-center gap-2">
            <select value="" onChange={e => e.target.value && onStatusChange(lead._id, e.target.value)}
              className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 outline-none cursor-pointer hover:border-slate-400 transition-colors">
              <option value="">Move →</option>
              {Object.keys(STATUS_CONFIG).filter(s => s !== lead.status).map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <button onClick={() => onLog(lead)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-colors shadow-sm">
              <Phone size={10} /> Call Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main FollowUps Page ───────────────────────────────────────────────────────
const FollowUps = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [dueFilter, setDueFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [logTarget, setLogTarget] = useState(null);

  const { data: res, isLoading, refetch } = useQuery({
    queryKey: ['followups', search, dueFilter, statusFilter, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page, limit: 15 });
      if (search) p.append('search', search);
      if (dueFilter !== 'all') p.append('followUpDue', dueFilter);
      if (statusFilter !== 'ALL') p.append('status', statusFilter);
      return (await api.get(`/leads/followups?${p}`)).data;
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

  const followUpMutation = useMutation({
    mutationFn: ({ id, data }) => api.post(`/leads/${id}/followup`, data),
    onMutate: async ({ id, data }) => {
      // Cancel any ongoing refetches
      await qc.cancelQueries({ queryKey: ['followups'] });
      
      // Get snapshot of current values
      const snapshot = qc.getQueryData(['followups', search, dueFilter, statusFilter, page]);
      
      // Optimistically update to the new value
      if (snapshot?.data) {
        qc.setQueryData(['followups', search, dueFilter, statusFilter, page], {
          ...snapshot,
          data: snapshot.data.map(l => 
            l._id === id ? { 
              ...l, 
              nextFollowUp: data.nextFollowUp || l.nextFollowUp,
              followups: [...(l.followups || []), { notes: data.notes, nextFollowUp: data.nextFollowUp, date: new Date() }]
            } : l
          )
        });
      }
      
      // Show toast immediately
      toast.success('Follow-up logged');
      setLogTarget(null);
      
      return { snapshot };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.snapshot) {
        qc.setQueryData(['followups', search, dueFilter, statusFilter, page], context.snapshot);
      }
      toast.error(err.response?.data?.message || 'Failed');
    },
    onSettled: () => {
      // Refetch after server responds
      qc.invalidateQueries({ queryKey: ['followups'] });
      qc.invalidateQueries({ queryKey: ['leadStats'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/leads/${id}/status`, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['followups'] });
      
      const snapshot = qc.getQueryData(['followups', search, dueFilter, statusFilter, page]);
      
      if (snapshot?.data) {
        qc.setQueryData(['followups', search, dueFilter, statusFilter, page], {
          ...snapshot,
          data: snapshot.data.map(l => l._id === id ? { ...l, status } : l)
        });
      }
      
      toast.success('Status updated');
      
      return { snapshot };
    },
    onError: (err, variables, context) => {
      if (context?.snapshot) {
        qc.setQueryData(['followups', search, dueFilter, statusFilter, page], context.snapshot);
      }
      toast.error(err.response?.data?.message || 'Update failed');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['followups'] });
      qc.invalidateQueries({ queryKey: ['leadStats'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const leads = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
  const todayCount = statsRes?.followupsToday || 0;
  const overdueCount = statsRes?.overdueFollowups || 0;

  const DUE_TABS = [
    { key: 'all',      label: 'All' },
    { key: 'overdue',  label: `Overdue${overdueCount > 0 ? ` (${overdueCount})` : ''}`, danger: true },
    { key: 'today',    label: `Today${todayCount > 0 ? ` (${todayCount})` : ''}` },
    { key: 'upcoming', label: 'Upcoming' },
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-5 pb-20">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={20} className="text-amber-500" /> Follow-ups
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Scheduled lead follow-up tracker</p>
            </div>
            <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-red-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-400">Overdue</p>
                <AlertCircle size={14} className="text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-amber-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-400">Due Today</p>
                <Bell size={14} className="text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-600">{todayCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-blue-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-400">Upcoming</p>
                <Calendar size={14} className="text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {leads.filter(l => l.nextFollowUp && Math.floor((new Date(l.nextFollowUp) - new Date()) / 86400000) > 0).length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-400">Showing</p>
                <Filter size={14} className="text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{leads.length}</p>
            </div>
          </div>

          {/* Overdue alert banner */}
          {overdueCount > 0 && dueFilter !== 'overdue' && (
            <button onClick={() => setDueFilter('overdue')}
              className="w-full flex items-center justify-between px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors">
              <span className="flex items-center gap-2"><AlertCircle size={15} /> {overdueCount} overdue follow-up{overdueCount > 1 ? 's' : ''} need attention</span>
              <ArrowRight size={15} />
            </button>
          )}

          {/* Due filter tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {DUE_TABS.map(({ key, label, danger }) => (
              <button key={key} onClick={() => { setDueFilter(key); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  dueFilter === key
                    ? danger ? 'bg-red-500 border-red-500 text-white' : 'bg-slate-900 border-slate-900 text-white'
                    : danger ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Search & status filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name or phone..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 focus:border-slate-400 rounded-xl text-sm font-medium outline-none transition-all" />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none">
              <option value="ALL">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
              <div className="w-8 h-8 rounded-xl border-4 border-slate-200 border-t-amber-500 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading follow-ups...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 bg-white rounded-2xl border border-slate-100">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <CheckCircle2 size={28} className="text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-slate-400">
                {dueFilter === 'overdue' ? 'No overdue follow-ups!' : 'No follow-ups found'}
              </p>
              {dueFilter !== 'all' && (
                <button onClick={() => setDueFilter('all')} className="text-xs text-blue-600 font-semibold hover:underline">View all</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.map(lead => (
                <FollowUpCard key={lead._id} lead={lead}
                  onLog={setLogTarget}
                  onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Page {page} · {leads.length} results</p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-lg transition-all disabled:opacity-40 text-slate-600">
                <ChevronLeft size={15} />
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={leads.length < 15}
                className="p-2 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-lg transition-all disabled:opacity-40 text-slate-600">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {logTarget && (
        <QuickFollowUpModal lead={logTarget} onClose={() => setLogTarget(null)}
          onSubmit={(id, data) => followUpMutation.mutate({ id, data })}
          isLoading={followUpMutation.isPending} />
      )}
    </ErrorBoundary>
  );
};

export default FollowUps;
