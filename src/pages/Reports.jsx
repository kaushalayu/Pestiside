import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { BarChart3, Download, Calendar, FileText, Receipt, Users, TrendingUp, IndianRupee, Filter, X, ChevronRight, Package, Clock, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const Reports = () => {
  const { user } = useSelector(state => state.auth);
  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_admin';
  const isOffice = user?.role === 'office';
  const isSales = user?.role === 'sales';
  const isTechnician = user?.role === 'technician';

  const [dateRange, setDateRange] = useState('this_month');
  const [reportType, setReportType] = useState('summary');

  const dateRangeFilter = useMemo(() => {
    const now = new Date();
    let start, end;

    switch (dateRange) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'this_week': {
        const dayOfWeek = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case 'this_month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last_month': {
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      }
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
  }, [dateRange]);

  // Fetch data based on role
  const { data: forms = [] } = useQuery({
    queryKey: ['forms', dateRangeFilter],
    queryFn: async () => {
      const res = await api.get(`/forms?startDate=${dateRangeFilter.startDate}&endDate=${dateRangeFilter.endDate}`);
      return res.data?.data || [];
    },
    staleTime: 0,
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ['receipts', dateRangeFilter],
    queryFn: async () => {
      const res = await api.get(`/receipts?startDate=${dateRangeFilter.startDate}&endDate=${dateRangeFilter.endDate}`);
      return res.data?.data || [];
    },
    staleTime: 0,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', dateRangeFilter],
    queryFn: async () => {
      const res = await api.get(`/expenses?startDate=${dateRangeFilter.startDate}&endDate=${dateRangeFilter.endDate}`);
      return res.data?.data || [];
    },
    staleTime: 0,
  });

  const { data: inventoryUsage = [] } = useQuery({
    queryKey: ['inventory-usage'],
    queryFn: async () => {
      const res = await api.get('/employee-inventory/usage-history');
      return res.data?.data || [];
    },
    staleTime: 0,
  });

  const { data: taskHistory = [] } = useQuery({
    queryKey: ['task-history'],
    queryFn: async () => {
      const res = await api.get('/task-assignments/my-history');
      return res.data?.data || [];
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    const filteredForms = forms.filter(f => {
      const formDate = new Date(f.createdAt);
      return formDate >= new Date(dateRangeFilter.startDate) && formDate <= new Date(dateRangeFilter.endDate + 'T23:59:59');
    });

    const filteredReceipts = receipts.filter(r => {
      const receiptDate = new Date(r.createdAt);
      return receiptDate >= new Date(dateRangeFilter.startDate) && receiptDate <= new Date(dateRangeFilter.endDate + 'T23:59:59');
    });

    const filteredExpenses = expenses.filter(e => {
      const expDate = new Date(e.date || e.createdAt);
      return expDate >= new Date(dateRangeFilter.startDate) && expDate <= new Date(dateRangeFilter.endDate + 'T23:59:59');
    });

    return {
      totalForms: filteredForms.length,
      totalReceipts: filteredReceipts.length,
      totalCollection: filteredReceipts.reduce((sum, r) => sum + (r.advancePaid || 0), 0),
      totalExpenses: filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
      pendingForms: filteredForms.filter(f => f.status === 'SUBMITTED').length,
      completedForms: filteredForms.filter(f => f.status === 'COMPLETED').length,
    };
  }, [forms, receipts, expenses, dateRangeFilter]);

  const dateRangeOptions = [
    { id: 'today', label: 'Today' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 size={24} className="text-brand-600" /> Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin ? 'Overview & Analytics' : 'Your Performance Summary'}
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="flex gap-2 flex-wrap">
          {dateRangeOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setDateRange(opt.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${dateRange === opt.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Reports - Full Access */}
      {isAdmin && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-80">Total Forms</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalForms}</p>
                </div>
                <FileText size={32} className="opacity-50" />
              </div>
            </div>

            <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-80">Collection</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalCollection)}</p>
                </div>
                <IndianRupee size={32} className="opacity-50" />
              </div>
            </div>

            <div className="bg-linear-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-80">Expenses</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalExpenses)}</p>
                </div>
                <TrendingUp size={32} className="opacity-50" />
              </div>
            </div>

            <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-80">Receipts</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalReceipts}</p>
                </div>
                <Receipt size={32} className="opacity-50" />
              </div>
            </div>
          </div>

          {/* Forms Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-800">Forms Overview</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-3xl font-bold text-slate-800">{stats.totalForms}</p>
                  <p className="text-xs text-slate-500 mt-1">Total Forms</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <p className="text-3xl font-bold text-amber-600">{stats.pendingForms}</p>
                  <p className="text-xs text-slate-500 mt-1">Pending</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <p className="text-3xl font-bold text-emerald-600">{stats.completedForms}</p>
                  <p className="text-xs text-slate-500 mt-1">Completed</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.totalForms > 0 ? Math.round((stats.completedForms / stats.totalForms) * 100) : 0}%
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Completion Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Collections Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Recent Collections</h3>
              <span className="text-xs text-slate-500">{receipts.length} receipts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Receipt No</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Customer</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-500">Amount</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {receipts.slice(0, 10).map(rec => (
                    <tr key={rec._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{rec.receiptNo || 'N/A'}</td>
                      <td className="px-4 py-3">{rec.customerName}</td>
                      <td className="px-4 py-3 text-right font-bold">₹{formatCurrency(rec.advancePaid)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-bold rounded ${rec.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                            rec.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-700'
                          }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {rec.createdAt ? format(parseISO(rec.createdAt), 'dd MMM yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
                  {receipts.length === 0 && (
                    <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400">No receipts found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Office Staff Reports */}
      {isOffice && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
              <p className="text-xs font-medium opacity-80">My Forms</p>
              <p className="text-3xl font-bold mt-1">{stats.totalForms}</p>
            </div>
            <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
              <p className="text-xs font-medium opacity-80">Collections</p>
              <p className="text-2xl font-bold mt-1">₹{formatCurrency(stats.totalCollection)}</p>
            </div>
            <div className="bg-linear-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg">
              <p className="text-xs font-medium opacity-80">Expenses</p>
              <p className="text-2xl font-bold mt-1">₹{formatCurrency(stats.totalExpenses)}</p>
            </div>
            <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
              <p className="text-xs font-medium opacity-80">Receipts</p>
              <p className="text-3xl font-bold mt-1">{stats.totalReceipts}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-800">My Work Summary</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{stats.totalForms}</p>
                  <p className="text-xs text-slate-500 mt-1">Total Forms</p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">{stats.completedForms}</p>
                  <p className="text-xs text-slate-500 mt-1">Completed</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{stats.pendingForms}</p>
                  <p className="text-xs text-slate-500 mt-1">Pending</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <p className="text-2xl font-bold text-purple-600">₹{formatCurrency(stats.totalCollection)}</p>
                  <p className="text-xs text-slate-500 mt-1">Collected</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sales Reports */}
      {isSales && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
              <p className="text-xs font-medium opacity-80">My Forms</p>
              <p className="text-3xl font-bold mt-1">{stats.totalForms}</p>
            </div>
            <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
              <p className="text-xs font-medium opacity-80">Collections</p>
              <p className="text-2xl font-bold mt-1">₹{formatCurrency(stats.totalCollection)}</p>
            </div>
            <div className="bg-linear-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg">
              <p className="text-xs font-medium opacity-80">Receipts</p>
              <p className="text-3xl font-bold mt-1">{stats.totalReceipts}</p>
            </div>
            <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
              <p className="text-xs font-medium opacity-80">Completed</p>
              <p className="text-3xl font-bold mt-1">{stats.completedForms}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-800">My Performance</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">{stats.completedForms}</p>
                  <p className="text-xs text-slate-500 mt-1">Completed Jobs</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{stats.pendingForms}</p>
                  <p className="text-xs text-slate-500 mt-1">Pending Jobs</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <p className="text-2xl font-bold text-purple-600">₹{formatCurrency(stats.totalCollection)}</p>
                  <p className="text-xs text-slate-500 mt-1">Total Collection</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Technician Reports */}
      {isTechnician && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-2">
                <Package size={20} />
                <p className="text-xs font-medium opacity-80">My Stock</p>
              </div>
              <p className="text-2xl font-bold mt-2">View in Inventory</p>
            </div>
            <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} />
                <p className="text-xs font-medium opacity-80">Completed</p>
              </div>
              <p className="text-3xl font-bold mt-2">{taskHistory.filter(t => t.status === 'COMPLETED').length}</p>
            </div>
            <div className="bg-linear-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-2">
                <Clock size={20} />
                <p className="text-xs font-medium opacity-80">Usage Records</p>
              </div>
              <p className="text-3xl font-bold mt-2">{inventoryUsage.length}</p>
            </div>
            <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} />
                <p className="text-xs font-medium opacity-80">This Month</p>
              </div>
              <p className="text-2xl font-bold mt-2">{taskHistory.filter(t => {
                const d = new Date(t.completedAt);
                return d >= new Date(dateRangeFilter.startDate) && d <= new Date(dateRangeFilter.endDate);
              }).length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-bold text-slate-800">Task History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Order No</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Customer</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Completed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {taskHistory.slice(0, 10).map(task => (
                    <tr key={task._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{task.serviceFormId?.orderNo || 'N/A'}</td>
                      <td className="px-4 py-3">
                        {task.serviceFormId?.customerId?.name || task.serviceFormId?.customer?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-bold rounded ${task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                            task.status === 'DECLINED' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                          }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {task.completedAt ? format(parseISO(task.completedAt), 'dd MMM yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
                  {taskHistory.length === 0 && (
                    <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400">No task history</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
