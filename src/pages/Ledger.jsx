import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Wallet, TrendingUp, TrendingDown, Clock, Building2, User,
  ArrowDownLeft, ArrowUpRight, Filter, Receipt, AlertCircle,
  CheckCircle, XCircle, Package, Send, ArrowRightLeft
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../lib/utils';

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

const Ledger = () => {
  const { user } = useSelector(state => state.auth);
  const isSuperAdmin = user?.role === 'super_admin';
  const isBranchAdmin = user?.role === 'branch_admin' || user?.role === 'office';
  const [activeTab, setActiveTab] = useState('my-ledger');
  const [filterType, setFilterType] = useState('all');

  const { data: myLedgerData, isLoading: myLoading } = useQuery({
    queryKey: ['myLedger'],
    queryFn: async () => {
      const res = await api.get('/ledger/me');
      return res.data?.data;
    }
  });

  const { data: branchLedgerData, isLoading: branchLoading } = useQuery({
    queryKey: ['branchLedger'],
    queryFn: async () => {
      const res = await api.get('/ledger/branch');
      return res.data?.data;
    },
    enabled: (isBranchAdmin || isSuperAdmin) && activeTab === 'branch-ledger'
  });

  const { data: hqData, isLoading: hqLoading } = useQuery({
    queryKey: ['hqAccount'],
    queryFn: async () => {
      const res = await api.get('/ledger/hq');
      return res.data?.data;
    },
    enabled: isSuperAdmin && activeTab === 'hq'
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'CUSTOMER_RECEIPT':
        return <Receipt size={16} className="text-emerald-600" />;
      case 'EXPENSE_SUBMITTED':
        return <ArrowUpRight size={16} className="text-red-600" />;
      case 'EXPENSE_APPROVED':
        return <CheckCircle size={16} className="text-emerald-600" />;
      case 'STOCK_RECEIVED':
        return <Package size={16} className="text-blue-600" />;
      case 'STOCK_DISTRIBUTED':
        return <Send size={16} className="text-purple-600" />;
      case 'BRANCH_PAYMENT_TO_HQ':
        return <ArrowRightLeft size={16} className="text-amber-600" />;
      case 'CUSTOMER_RECEIPT':
        return <Receipt size={16} className="text-emerald-600" />;
      default:
        return <Wallet size={16} className="text-slate-600" />;
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'CUSTOMER_RECEIPT': 'Customer Receipt',
      'COLLECTION': 'Collection',
      'EXPENSE_SUBMITTED': 'Expense Submitted',
      'EXPENSE_APPROVED': 'Expense Approved',
      'EXPENSE_REJECTED': 'Expense Rejected',
      'STOCK_RECEIVED': 'Stock Received',
      'STOCK_DISTRIBUTED': 'Stock Distributed',
      'BRANCH_PAYMENT_TO_HQ': 'Payment to HQ',
      'EXPENSE_REIMBURSEMENT_PAID': 'Expense Paid',
      'OPENING_BALANCE': 'Opening Balance',
      'ADJUSTMENT': 'Adjustment'
    };
    return labels[category] || category;
  };

  const transactions = activeTab === 'my-ledger'
    ? (myLedgerData?.transactions || [])
    : activeTab === 'branch-ledger'
      ? (branchLedgerData?.transactions || [])
      : (hqData?.recentTransactions || []);

  const summary = activeTab === 'my-ledger'
    ? myLedgerData?.summary
    : activeTab === 'branch-ledger'
      ? branchLedgerData?.summary
      : hqData?.balance;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-linear-to-br from-slate-700 to-slate-800 rounded-xl text-white shadow-lg">
                <Wallet size={22} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900">Financial Ledger</h1>
                <p className="text-xs text-slate-500 font-medium">
                  {isSuperAdmin ? 'Complete money tracking' : isBranchAdmin ? 'Branch & personal ledger' : 'Your transactions'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            {[
              { id: 'my-ledger', label: 'My Ledger', icon: User },
              ...(isBranchAdmin ? [{ id: 'branch-ledger', label: 'Branch', icon: Building2 }] : []),
              ...(isSuperAdmin ? [
                { id: 'hq', label: 'HQ Account', icon: TrendingUp }
              ] : []),
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-emerald-600" />
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Credit</span>
            </div>
            <p className="text-2xl font-black text-emerald-600">
              {formatCurrency(summary?.totalCredit || summary?.totalIncome || 0)}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className="text-red-600" />
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Debit</span>
            </div>
            <p className="text-2xl font-black text-red-600">
              {formatCurrency(summary?.totalDebit || summary?.totalExpense || 0)}
            </p>
          </div>
          <div className="bg-linear-to-br from-slate-800 to-slate-900 p-5 rounded-2xl text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase">Balance</span>
            </div>
            <p className="text-2xl font-black">
              {formatCurrency(summary?.balance || 0)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              {activeTab === 'my-ledger' ? 'Your net balance' :
                activeTab === 'branch-ledger' ? 'Branch net balance' : 'HQ net balance'}
            </p>
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Clock size={18} /> Transaction History
              </h3>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-xs"
              >
                <option value="all">All</option>
                <option value="CREDIT">Credits Only</option>
                <option value="DEBIT">Debits Only</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Wallet size={48} className="mx-auto mb-3 opacity-30" />
                <p>No transactions found</p>
              </div>
            ) : (
              transactions.map((txn) => (
                <div key={txn._id} className="px-6 py-4 hover:bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${txn.type === 'CREDIT' || txn.type === 'INCOME'
                        ? 'bg-emerald-50'
                        : 'bg-red-50'
                      }`}>
                      {txn.type === 'CREDIT' || txn.type === 'INCOME'
                        ? <ArrowDownLeft size={18} className="text-emerald-600" />
                        : <ArrowUpRight size={18} className="text-red-600" />
                      }
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {getCategoryLabel(txn.category || txn.source)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {txn.description || 'No description'}
                        {txn.employeeId?.name && ` • ${txn.employeeId.name}`}
                        {txn.branchId?.branchName && ` • ${txn.branchId.branchName}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${txn.type === 'CREDIT' || txn.type === 'INCOME'
                        ? 'text-emerald-600'
                        : 'text-red-600'
                      }`}>
                      {txn.type === 'CREDIT' || txn.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(txn.date || txn.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ledger;
