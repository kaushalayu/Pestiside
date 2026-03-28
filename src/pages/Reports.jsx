import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { BarChart3, Download, Calendar, FileText, Receipt, Users, TrendingUp, IndianRupee, Filter, X, ChevronRight, Lock } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const Reports = () => {
  const { user } = useSelector(state => state.auth);
  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_admin';
  const [reportType, setReportType] = useState('forms');

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <div className="p-2 bg-slate-900 text-white rounded-lg"><BarChart3 size={20} /></div>
              Reports
            </h1>
            <p className="text-slate-500 mt-1 font-bold uppercase text-[8px] tracking-wider italic flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
               Access Restricted
            </p>
          </div>
        </div>
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center">
           <div className="p-4 bg-slate-100 rounded-full mb-4">
              <Lock size={48} className="text-slate-400" />
           </div>
           <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2">Authorization Required</h2>
           <p className="text-sm text-slate-500 font-medium">This section is restricted to Branch Admin and Super Admin only.</p>
        </div>
      </div>
    );
  }

  const { data: formStats } = useQuery({
    queryKey: ['formStats'],
    queryFn: async () => {
      const res = await api.get('/forms/stats');
      return res.data?.data || [];
    },
    enabled: reportType === 'forms'
  });

  const { data: receiptStats } = useQuery({
    queryKey: ['receiptStats'],
    queryFn: async () => {
      const res = await api.get('/receipts/stats');
      return res.data?.data || [];
    },
    enabled: reportType === 'receipts'
  });

  const { data: expenseStats } = useQuery({
    queryKey: ['expenseStats'],
    queryFn: async () => {
      const res = await api.get('/expenses/stats');
      return res.data?.data || [];
    },
    enabled: reportType === 'expenses'
  });

  const exportEnquiriesCSV = async () => {
    try {
      const response = await api.get('/enquiries/export/sheets', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Enquiries_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      toast.success('CSV Downloaded');
    } catch (err) {
      toast.error('Export Failed');
    }
  };

  const exportEnquiriesPDF = async () => {
    try {
      const response = await api.get('/enquiries/export/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Enquiries_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('PDF Downloaded');
    } catch (err) {
      toast.error('Export Failed');
    }
  };

  const reportTypes = [
    { id: 'forms', label: 'Service Forms', icon: FileText, color: 'bg-brand-50 text-brand-600 border-brand-100' },
    { id: 'receipts', label: 'Receipts', icon: Receipt, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { id: 'expenses', label: 'Expenses', icon: BarChart3, color: 'bg-amber-50 text-amber-600 border-amber-100' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-slate-900 rounded-lg text-white"><BarChart3 size={18} /></div>
            <h1 className="text-xl md:text-2xl font-display font-black text-slate-900 tracking-tight uppercase">Intelligence Reports</h1>
          </div>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest ml-1 italic">Analytics & Data Export Center</p>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-3 gap-4">
        {reportTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setReportType(type.id)}
            className={`p-6 rounded-2xl border-2 transition-all ${reportType === type.id ? `${type.color} border-current shadow-lg` : 'bg-white border-slate-100 hover:border-slate-200'}`}
          >
            <type.icon size={24} className="mx-auto mb-2" />
            <p className="text-xs font-black uppercase tracking-wider">{type.label}</p>
          </button>
        ))}
      </div>

      {/* Forms Report */}
      {reportType === 'forms' && (
        <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-brand-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Service Form Analytics</h3>
            </div>
          </div>
          <div className="p-6">
            {formStats?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {formStats.map((stat) => (
                  <div key={stat._id} className={`p-4 rounded-xl border-2 ${
                    stat._id === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100' :
                    stat._id === 'CANCELLED' ? 'bg-red-50 border-red-100' :
                    'bg-slate-50 border-slate-100'
                  }`}>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat._id}</p>
                    <p className="text-2xl font-black text-slate-900">{stat.count}</p>
                    <p className="text-[9px] font-black text-slate-400 mt-1">₹{stat.totalRevenue?.toLocaleString() || 0}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8 text-sm">No form data available</p>
            )}
          </div>
        </div>
      )}

      {/* Receipts Report */}
      {reportType === 'receipts' && (
        <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
          <div className="p-6 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt size={20} className="text-emerald-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Receipt & Collection Summary</h3>
            </div>
          </div>
          <div className="p-6">
            {receiptStats?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {receiptStats.map((stat) => (
                  <div key={stat._id} className={`p-4 rounded-xl border-2 ${
                    stat._id === 'PAID' ? 'bg-emerald-50 border-emerald-100' :
                    stat._id === 'PARTIAL' ? 'bg-amber-50 border-amber-100' :
                    'bg-red-50 border-red-100'
                  }`}>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat._id}</p>
                    <p className="text-2xl font-black text-slate-900">{stat.count}</p>
                    <p className="text-[9px] font-black text-slate-400 mt-1">₹{stat.totalAdvance?.toLocaleString() || 0} collected</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8 text-sm">No receipt data available</p>
            )}
          </div>
        </div>
      )}

      {/* Expenses Report */}
      {reportType === 'expenses' && (
        <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
          <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-amber-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Expense Ledger Summary</h3>
            </div>
          </div>
          <div className="p-6">
            {expenseStats?.todayTotal !== undefined ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-xl border-2 border-slate-100">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Today's Outflow</p>
                  <p className="text-3xl font-black text-slate-900">₹{expenseStats.todayTotal?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-xl border-2 border-slate-800 text-white">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Overall Expenditure</p>
                  <p className="text-3xl font-black text-white">₹{expenseStats.overallTotal?.toLocaleString() || 0}</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8 text-sm">No expense data available</p>
            )}
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Download size={16} className="text-brand-600" /> Data Export Terminal
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-slate-50 rounded-xl border-2 border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <Users size={20} className="text-brand-600" />
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Enquiry Export</h4>
            </div>
            <p className="text-[10px] text-slate-500 mb-4">Download complete lead database with all customer details and status</p>
            <div className="flex gap-3">
              <button
                onClick={exportEnquiriesCSV}
                className="flex-1 py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <Download size={12} /> CSV Export
              </button>
              <button
                onClick={exportEnquiriesPDF}
                className="flex-1 py-2 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <Download size={12} /> PDF Report
              </button>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 rounded-xl border-2 border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <FileText size={20} className="text-brand-600" />
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Service Forms Export</h4>
            </div>
            <p className="text-[10px] text-slate-500 mb-4">Export all job cards with billing and service details</p>
            <button
              onClick={() => toast.success('Form export coming soon!')}
              className="w-full py-2 px-4 bg-slate-900 hover:bg-black text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <Download size={12} /> Export Forms
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Reports;
