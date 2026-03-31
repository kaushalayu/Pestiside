import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { 
  TrendingUp, TrendingDown, Wallet, ArrowRightLeft, Building2, 
  IndianRupee, Calendar, Clock, CheckCircle, AlertCircle,
  ArrowDownLeft, ArrowUpRight, Filter, Download, Plus, X,
  Receipt, Truck
} from 'lucide-react';
import api from '../lib/api';

const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${styles[variant]}`}>
      {children}
    </span>
  );
};

const HQAccount = () => {
  const { user } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['hqAccountDashboard'],
    queryFn: async () => {
      const res = await api.get('/hq-account/dashboard');
      return res.data?.data;
    },
    enabled: user?.role === 'super_admin'
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['hqTransactions', filterType, filterCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      const res = await api.get(`/hq-account/transactions?${params.toString()}`);
      return res.data;
    },
    enabled: user?.role === 'super_admin' && activeTab === 'transactions'
  });

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num || 0);
  };

  const transactions = transactionsData?.data || [];

  const getTypeIcon = (type) => {
    if (type === 'INVENTORY_INCOME') return <ArrowDownLeft size={16} className="text-emerald-600" />;
    if (type === 'EXPENSE_PAYOUT') return <ArrowUpRight size={16} className="text-red-600" />;
    if (type === 'STOCK_PURCHASE') return <ArrowUpRight size={16} className="text-red-600" />;
    return <ArrowRightLeft size={16} className="text-blue-600" />;
  };

  const getTypeColor = (type) => {
    if (type === 'INVENTORY_INCOME') return 'text-emerald-600 bg-emerald-50';
    if (type === 'EXPENSE_PAYOUT') return 'text-red-600 bg-red-50';
    if (type === 'STOCK_PURCHASE') return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <p className="text-lg font-bold text-slate-700">Access Denied</p>
        <p className="text-sm text-slate-500">Only Super Admin can access this page</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Wallet size={32} className="text-emerald-500 animate-pulse" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading HQ Account...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-500/30">
                <Wallet size={22} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900">HQ Account & Money Flow</h1>
                <p className="text-xs text-slate-500 font-medium">Track all income and expenses</p>
              </div>
            </div>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-emerald-500 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* HQ Balance Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 rounded-2xl text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide">HQ Account Balance</p>
                    <p className="text-4xl font-black mt-2">{formatCurrency(dashboardData?.hqBalance?.balance || 0)}</p>
                  </div>
                  <div className="p-4 bg-white/20 rounded-2xl">
                    <Wallet size={32} className="text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-emerald-400/30">
                  <div>
                    <p className="text-emerald-100 text-xs">Total Income</p>
                    <p className="text-xl font-bold">{formatCurrency(dashboardData?.hqBalance?.totalIncome || 0)}</p>
                    <p className="text-emerald-200 text-xs mt-1">From Branch Payments</p>
                  </div>
                  <div>
                    <p className="text-emerald-100 text-xs">Total Expenses</p>
                    <p className="text-xl font-bold">{formatCurrency(dashboardData?.hqBalance?.totalExpense || 0)}</p>
                    <p className="text-emerald-200 text-xs mt-1">Reimbursements + Purchases</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-4">Today</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowDownLeft size={16} className="text-emerald-600" />
                      <span className="text-sm text-slate-600">Income</span>
                    </div>
                    <span className="font-bold text-emerald-600">{formatCurrency(dashboardData?.today?.income || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight size={16} className="text-red-600" />
                      <span className="text-sm text-slate-600">Expense</span>
                    </div>
                    <span className="font-bold text-red-600">{formatCurrency(dashboardData?.today?.expense || 0)}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-3">This Month</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Income</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(dashboardData?.thisMonth?.income || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Total Expense</span>
                      <span className="font-bold text-red-600">{formatCurrency(dashboardData?.thisMonth?.expense || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Branch Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Building2 size={18} /> Branch-wise Summary
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="px-6 py-3 text-left">Branch</th>
                      <th className="px-6 py-3 text-right">Stock Value (Received)</th>
                      <th className="px-6 py-3 text-right">Paid to HQ</th>
                      <th className="px-6 py-3 text-right">Pending Balance</th>
                      <th className="px-6 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData?.branches?.map((branch) => (
                      <tr key={branch.branchId} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{branch.branchName}</p>
                          <p className="text-xs text-slate-500">{branch.branchCode}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-slate-700">{formatCurrency(branch.inventoryValue)}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-emerald-600">{formatCurrency(branch.totalPaid)}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-amber-600">{formatCurrency(branch.pendingBalance)}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {branch.pendingBalance === 0 ? (
                            <Badge variant="success">Settled</Badge>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!dashboardData?.branches || dashboardData.branches.length === 0) && (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-slate-400">No branches found</td>
                      </tr>
                    )}
                  </tbody>
                  {dashboardData?.branches && dashboardData.branches.length > 0 && (
                    <tfoot className="bg-slate-50 font-bold">
                      <tr>
                        <td className="px-6 py-3 text-left text-slate-700">TOTAL</td>
                        <td className="px-6 py-3 text-right text-slate-700">
                          {formatCurrency(dashboardData.branches.reduce((sum, b) => sum + b.inventoryValue, 0))}
                        </td>
                        <td className="px-6 py-3 text-right text-emerald-700">
                          {formatCurrency(dashboardData.branches.reduce((sum, b) => sum + b.totalPaid, 0))}
                        </td>
                        <td className="px-6 py-3 text-right text-amber-700">
                          {formatCurrency(dashboardData.branches.reduce((sum, b) => sum + b.pendingBalance, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center justify-between">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Clock size={18} /> Recent Transactions
                </h3>
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className="text-emerald-300 text-sm hover:text-emerald-200"
                >
                  View All →
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {dashboardData?.recentTransactions?.map((txn) => (
                  <div key={txn._id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${getTypeColor(txn.type)}`}>
                        {getTypeIcon(txn.type)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{txn.description}</p>
                        <p className="text-xs text-slate-500">
                          {txn.branchId?.branchName || 'HQ'} • {new Date(txn.date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black ${txn.type === 'INVENTORY_INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {txn.type === 'INVENTORY_INCOME' ? '+' : '-'}{formatCurrency(txn.amount)}
                      </p>
                      <Badge variant={txn.type === 'INVENTORY_INCOME' ? 'success' : 'danger'}>
                        {txn.type === 'INVENTORY_INCOME' ? 'IN' : 'OUT'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!dashboardData?.recentTransactions || dashboardData.recentTransactions.length === 0) && (
                  <div className="px-6 py-8 text-center text-slate-400">
                    No transactions yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex flex-wrap gap-4">
                <select 
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                >
                  <option value="all">All Types</option>
                  <option value="INVENTORY_INCOME">Income</option>
                  <option value="EXPENSE_PAYOUT">Expense Payout</option>
                  <option value="STOCK_PURCHASE">Stock Purchase</option>
                </select>
                <select 
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                >
                  <option value="all">All Categories</option>
                  <option value="BRANCH_PAYMENT">Branch Payment</option>
                  <option value="EXPENSE_REIMBURSEMENT">Expense Reimbursement</option>
                  <option value="SUPPLIER_PAYMENT">Supplier Payment</option>
                </select>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-left">Description</th>
                      <th className="px-6 py-3 text-left">Branch</th>
                      <th className="px-6 py-3 text-left">Category</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3 text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn._id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-800">{new Date(txn.date).toLocaleDateString('en-IN')}</p>
                          <p className="text-xs text-slate-500">{new Date(txn.date).toLocaleTimeString('en-IN')}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-800">{txn.description}</p>
                          {txn.transactionRef && (
                            <p className="text-xs text-slate-500">Ref: {txn.transactionRef}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-700">{txn.branchId?.branchName || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={txn.type === 'INVENTORY_INCOME' ? 'success' : 'danger'}>
                            {txn.category?.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className={`text-lg font-black ${txn.type === 'INVENTORY_INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {txn.type === 'INVENTORY_INCOME' ? '+' : '-'}{formatCurrency(txn.amount)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm font-bold text-slate-700">{formatCurrency(txn.balanceAfter)}</p>
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400">No transactions found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HQAccount;
