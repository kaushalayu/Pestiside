import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../lib/api';
import { Package, Plus, Send, History, Beaker, User as UserIcon, Building2, Trash2, ArrowRightLeft, DollarSign, CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock, RotateCcw, ShoppingCart, Upload, Wallet, ArrowRight, ArrowDown, ChevronRight, FileText, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';

const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${styles[variant]}`}>
      {children}
    </span>
  );
};

const SectionCard = ({ title, icon: Icon, children, className = '', headerBg = 'bg-gradient-to-r from-slate-800 to-slate-700' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
    <div className={`${headerBg} px-5 py-3 flex items-center gap-3`}>
      {Icon && <Icon size={18} className="text-white/90" />}
      <h3 className="text-white font-bold text-sm uppercase tracking-wide">{title}</h3>
    </div>
    <div className="p-5">
      {children}
    </div>
  </div>
);

const Inventory = () => {
  const { user } = useSelector(state => state.auth);
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_admin';
  const [activeTab, setActiveTab] = useState('summary');
  const [chemicals, setChemicals] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchUsers, setBranchUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchBalances, setBranchBalances] = useState([]);
  const [myBalance, setMyBalance] = useState(null);
  const [myWallet, setMyWallet] = useState(null);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [stockTransferRequests, setStockTransferRequests] = useState([]);
  const [transferStats, setTransferStats] = useState(null);
  const [collections, setCollections] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  const [requestItems, setRequestItems] = useState([{ chemicalId: '', quantity: '', unit: 'L' }]);
  const [requestNotes, setRequestNotes] = useState('');

  const [purchaseForm, setPurchaseForm] = useState({
    chemicalId: '',
    quantity: '',
    unit: 'L',
    purchaseRate: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    supplierName: '',
    supplierContact: '',
    invoiceNo: '',
    notes: ''
  });

  const [transferForm, setTransferForm] = useState({
    chemicalId: '',
    targetId: '',
    targetType: isSuperAdmin ? 'Branch' : 'Employee',
    quantity: '',
    unit: 'L',
    notes: ''
  });

  const [usageForm, setUsageForm] = useState({
    chemicalId: '',
    quantity: '',
    unit: 'ML',
    jobId: '',
    jobName: '',
    notes: '',
    isReturned: false,
    returnTo: 'Branch'
  });

  const [newChemical, setNewChemical] = useState({ 
    name: '', 
    unit: 'Liters', 
    unitSystem: 'L',
    category: 'Insecticide',
    mainStock: '', 
    purchasePrice: '',
    description: ''
  });

  const [payment, setPayment] = useState({
    branchId: '',
    amount: '',
    paymentMethod: 'UPI',
    transactionId: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const promises = [
        api.get('/inventory/chemicals'),
        api.get('/inventory'),
        api.get('/inventory/transactions'),
        api.get('/inventory/wallet'),
        api.get('/stock-transfers')
      ];
      
      if (isSuperAdmin) {
        promises.push(api.get('/branches'));
        promises.push(api.get('/employees'));
        promises.push(api.get('/inventory/balances'));
        promises.push(api.get('/purchase-requests'));
        promises.push(api.get('/collections'));
        promises.push(api.get('/stock-transfers/stats'));
      } else if (user.role === 'branch_admin' || user.role === 'office') {
        promises.push(api.get('/employees'));
        promises.push(api.get('/inventory/my-balance'));
        promises.push(api.get('/purchase-requests/my-requests'));
        promises.push(api.get('/collections'));
        promises.push(api.get('/expenses'));
        promises.push(api.get('/stock-transfers/stats'));
      }

      const results = await Promise.allSettled(promises);
      
      const chemicalsRes = results[0];
      if (chemicalsRes.status === 'fulfilled') {
        setChemicals(chemicalsRes.value.data?.data || []);
      }

      const invRes = results[1];
      if (invRes.status === 'fulfilled') {
        setInventory(invRes.value.data?.data || []);
      }

      const transRes = results[2];
      if (transRes.status === 'fulfilled') {
        setTransactions(transRes.value.data?.data || []);
      }

      const walletRes = results[3];
      if (walletRes.status === 'fulfilled') {
        setMyWallet(walletRes.value.data?.data);
      }

      const stockTransferRes = results[4];
      if (stockTransferRes.status === 'fulfilled') {
        setStockTransferRequests(stockTransferRes.value.data?.data || []);
      }

      if (isSuperAdmin) {
        if (results[5]?.status === 'fulfilled') setBranches(results[5].value.data?.data || []);
        if (results[6]?.status === 'fulfilled') setBranchUsers(results[6].value.data?.data || []);
        if (results[7]?.status === 'fulfilled') setBranchBalances(results[7].value.data?.data || []);
        if (results[8]?.status === 'fulfilled') setPurchaseRequests(results[8].value.data?.data || []);
        if (results[9]?.status === 'fulfilled') setCollections(results[9].value.data?.data?.data?.reduce((sum, c) => sum + (c.amount || 0), 0));
        if (results[10]?.status === 'fulfilled') setTransferStats(results[10].value.data?.data);
      } else if (user.role === 'branch_admin' || user.role === 'office') {
        if (results[5]?.status === 'fulfilled') setBranchUsers(results[5].value.data?.data || []);
        if (results[6]?.status === 'fulfilled') setMyBalance(results[6].value.data?.data);
        if (results[7]?.status === 'fulfilled') setPurchaseRequests(results[7].value.data?.data || []);
        if (results[8]?.status === 'fulfilled') setCollections(results[8].value.data?.data?.data?.reduce((sum, c) => sum + (c.amount || 0), 0));
        if (results[9]?.status === 'fulfilled') setTotalExpenses(results[9].value.data?.data?.data?.reduce((sum, e) => sum + (e.amount || 0), 0));
        if (results[10]?.status === 'fulfilled') setTransferStats(results[10].value.data?.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAddChemical = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/chemicals', newChemical);
      toast.success('Chemical registered successfully');
      setNewChemical({ name: '', unit: 'Liters', unitSystem: 'L', category: 'Insecticide', mainStock: '', purchasePrice: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding chemical');
    }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    try {
      if (!purchaseForm.chemicalId || !purchaseForm.quantity || !purchaseForm.purchaseRate) {
        return toast.error('Fill all required fields');
      }
      await api.post('/inventory/purchase', purchaseForm);
      toast.success('Purchase recorded successfully');
      setPurchaseForm({
        chemicalId: '',
        quantity: '',
        unit: 'L',
        purchaseRate: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        supplierName: '',
        supplierContact: '',
        invoiceNo: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error recording purchase');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      if (!transferForm.chemicalId || !transferForm.targetId || !transferForm.quantity) {
        return toast.error('Fill all required fields');
      }
      
      const endpoint = isSuperAdmin ? '/inventory/transfer-to-branch' : '/inventory/transfer-to-employee';
      
      // Prepare payload - convert targetId to branchId for backend
      const payload = {
        chemicalId: transferForm.chemicalId,
        quantity: transferForm.quantity,
        unit: transferForm.unit,
        notes: transferForm.notes
      };
      
      if (isSuperAdmin) {
        payload.branchId = transferForm.targetId;
      } else {
        payload.employeeId = transferForm.targetId;
      }
      
      await api.post(endpoint, payload);
      toast.success('Stock transferred successfully');
      setTransferForm({
        chemicalId: '',
        targetId: '',
        targetType: isSuperAdmin ? 'Branch' : 'Employee',
        quantity: '',
        unit: 'L',
        notes: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error transferring stock');
    }
  };

  const handleUsage = async (e) => {
    e.preventDefault();
    try {
      if (!usageForm.chemicalId || !usageForm.quantity) {
        return toast.error('Fill all required fields');
      }
      await api.post('/inventory/usage', usageForm);
      toast.success(usageForm.isReturned ? 'Stock returned successfully' : 'Usage recorded successfully');
      setUsageForm({
        chemicalId: '',
        quantity: '',
        unit: 'ML',
        jobId: '',
        jobName: '',
        notes: '',
        isReturned: false,
        returnTo: 'Branch'
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error recording usage');
    }
  };

  const handleCreatePurchaseRequest = async (e) => {
    e.preventDefault();
    try {
      const validItems = requestItems.filter(item => item.chemicalId && item.quantity);
      if (validItems.length === 0) {
        return toast.error('Add at least one item');
      }
      await api.post('/purchase-requests', { items: validItems, notes: requestNotes });
      toast.success('Purchase request sent to HQ!');
      setRequestItems([{ chemicalId: '', quantity: '', unit: 'L' }]);
      setRequestNotes('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating request');
    }
  };

  const handleApproveRequest = async (requestId, status) => {
    try {
      await api.patch(`/purchase-requests/${requestId}/status`, { status });
      toast.success(`Request ${status.toLowerCase()} successfully`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating request');
    }
  };

  const handleCreateStockTransfer = async (e) => {
    e.preventDefault();
    try {
      if (!transferForm.chemicalId || !transferForm.targetId || !transferForm.quantity) {
        return toast.error('Fill all required fields');
      }
      
      const payload = {
        chemicalId: transferForm.chemicalId,
        quantity: transferForm.quantity,
        unit: transferForm.unit,
        notes: transferForm.notes
      };
      
      if (isSuperAdmin) {
        payload.toId = transferForm.targetId;
        payload.toType = 'Branch';
      } else {
        payload.toId = transferForm.targetId;
        payload.toType = 'Employee';
      }
      
      await api.post('/stock-transfers', payload);
      toast.success('Transfer request sent. Awaiting approval.');
      setTransferForm({
        chemicalId: '',
        targetId: '',
        targetType: isSuperAdmin ? 'Branch' : 'Employee',
        quantity: '',
        unit: 'L',
        notes: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating transfer request');
    }
  };

  const handleApproveStockTransfer = async (requestId) => {
    try {
      await api.patch(`/stock-transfers/${requestId}/approve`);
      toast.success('Transfer approved and stock added!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error approving transfer');
    }
  };

  const handleRejectStockTransfer = async (requestId, reason = '') => {
    try {
      await api.patch(`/stock-transfers/${requestId}/reject`, { reason });
      toast.success('Transfer rejected');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error rejecting transfer');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      if (!payment.branchId || !payment.amount) {
        return toast.error('Fill all required fields');
      }
      await api.post('/payments', payment);
      toast.success('Payment recorded successfully');
      setPayment({ branchId: '', amount: '', paymentMethod: 'UPI', transactionId: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error recording payment');
    }
  };

  const handleDeleteChemical = async (chemId) => {
    if (window.confirm('Delete this chemical?')) {
      try {
        await api.delete(`/inventory/chemicals/${chemId}`);
        toast.success('Chemical deleted');
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting');
      }
    }
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num || 0);
  };

  const getChemicalStock = (chemId) => {
    const chem = chemicals.find(c => c._id === chemId);
    return chem ? chem.mainStock : 0;
  };

  const getAvailableStock = (chemicalId, ownerType = 'Employee') => {
    const inv = inventory.find(i => i.chemicalId?._id === chemicalId && i.ownerType === ownerType);
    return inv ? (inv.displayQuantity || inv.quantity) : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/30">
                <Package size={22} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900">Chemical Inventory</h1>
                <p className="text-xs text-slate-500 font-medium">Purchase, Transfer & Distribution Management</p>
              </div>
            </div>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            {[
              { id: 'summary', label: 'Dashboard', icon: TrendingUp },
              ...(isSuperAdmin ? [
                { id: 'purchase', label: 'Purchase', icon: ShoppingCart },
                { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
                { id: 'products', label: 'Products', icon: Beaker },
                { id: 'requests', label: 'Requests', icon: FileText },
                { id: 'transfer-requests', label: 'Stock Transfers', icon: Send },
                { id: 'accounts', label: 'Accounts', icon: DollarSign },
                { id: 'payments', label: 'Payments', icon: CreditCard }
              ] : []),
              ...(user.role === 'branch_admin' ? [
                { id: 'purchase-request', label: 'Buy Chemicals', icon: ShoppingCart },
                { id: 'distribute', label: 'Distribute', icon: Send },
                { id: 'transfer-requests', label: 'Stock Transfers', icon: ArrowRightLeft },
                { id: 'accounts', label: 'Accounts', icon: DollarSign }
              ] : []),
              { id: 'wallet', label: 'My Wallet', icon: Wallet },
              { id: 'usage', label: 'Usage', icon: Clock },
              { id: 'history', label: 'History', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-emerald-500 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Super Admin Stats */}
            {isSuperAdmin && (
              <div className="space-y-4">
                {/* New Card: Total Stock | Transferred | Paid | Remaining */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-2xl text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Package size={16} />
                      <span className="text-[10px] font-semibold uppercase opacity-80">Total Stock</span>
                    </div>
                    <p className="text-2xl font-black">
                      {chemicals.reduce((sum, c) => sum + (c.mainStock || 0), 0)} L
                    </p>
                    <p className="text-[10px] opacity-60 mt-1">At HQ</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-5 rounded-2xl text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Send size={16} />
                      <span className="text-[10px] font-semibold uppercase opacity-80">Transferred</span>
                    </div>
                    <p className="text-2xl font-black">{formatCurrency(transferStats?.totalTransferredValue || branchBalances.reduce((a, b) => a + b.totalReceivedValue, 0))}</p>
                    <p className="text-[10px] opacity-60 mt-1">To Branches</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 rounded-2xl text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={16} />
                      <span className="text-[10px] font-semibold uppercase opacity-80">Paid</span>
                    </div>
                    <p className="text-2xl font-black">{formatCurrency(transferStats?.totalPaid || branchBalances.reduce((a, b) => a + b.totalPaid, 0))}</p>
                    <p className="text-[10px] opacity-60 mt-1">By Branches</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-600 to-amber-700 p-5 rounded-2xl text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} />
                      <span className="text-[10px] font-semibold uppercase opacity-80">Remaining</span>
                    </div>
                    <p className="text-2xl font-black">{formatCurrency(transferStats?.pendingBalance || branchBalances.reduce((a, b) => a + b.pendingBalance, 0))}</p>
                    <p className="text-[10px] opacity-60 mt-1">Pending Payment</p>
                  </div>
                </div>

                {/* Pending Transfer Requests */}
                {stockTransferRequests.filter(r => r.status === 'PENDING' && r.txnType === 'SUPER_TO_BRANCH').length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={18} className="text-amber-600" />
                      <h3 className="font-bold text-amber-800">Pending Transfer Approvals</h3>
                      <Badge variant="warning">{stockTransferRequests.filter(r => r.status === 'PENDING' && r.txnType === 'SUPER_TO_BRANCH').length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {stockTransferRequests.filter(r => r.status === 'PENDING' && r.txnType === 'SUPER_TO_BRANCH').slice(0, 3).map(req => (
                        <div key={req._id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-100">
                          <div>
                            <p className="font-bold text-sm">{req.chemicalName}</p>
                            <p className="text-xs text-slate-500">{req.quantity} {req.unit} → {req.toName}</p>
                          </div>
                          <Badge variant="warning">Pending</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
)}
            </div>
          )}
          </div>
        )}

        {activeTab === 'transfer-requests' && (
          <div className="space-y-6">
            <SectionCard title="Stock Transfer Requests" icon={ArrowRightLeft} headerBg="bg-gradient-to-r from-teal-600 to-teal-500">
              {stockTransferRequests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Chemical</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Qty</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Rate</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Value</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">From</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">To</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockTransferRequests.map(req => (
                        <tr key={req._id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <p className="font-bold">{req.chemicalName}</p>
                            <p className="text-xs text-slate-500">{req.chemicalId?.category}</p>
                          </td>
                          <td className="py-3 px-4 text-center font-bold">{req.quantity} {req.unit}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(req.transferRate)}</td>
                          <td className="py-3 px-4 text-right font-bold">{formatCurrency(req.totalValue)}</td>
                          <td className="py-3 px-4 text-center text-xs">{req.fromName}</td>
                          <td className="py-3 px-4 text-center text-xs">{req.toName}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={
                              req.status === 'APPROVED' ? 'success' :
                              req.status === 'REJECTED' ? 'danger' : 'warning'
                            }>
                              {req.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {req.status === 'PENDING' && (
                              <div className="flex justify-center gap-2">
                                {(user.role === 'branch_admin' && req.txnType === 'SUPER_TO_BRANCH') || 
                                 (req.txnType === 'BRANCH_TO_EMPLOYEE' && user._id === req.toId?._id) ? (
                                  <>
                                    <button 
                                      onClick={() => handleApproveStockTransfer(req._id)}
                                      className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600"
                                    >
                                      Accept
                                    </button>
                                    <button 
                                      onClick={() => handleRejectStockTransfer(req._id)}
                                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600"
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <Badge variant="warning">Waiting</Badge>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <ArrowRightLeft size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No stock transfer requests</p>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="max-w-4xl mx-auto">
            <SectionCard title="My Chemical Wallet" icon={Wallet} headerBg="bg-gradient-to-r from-emerald-600 to-emerald-500">
              {myWallet ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-100">
                      <p className="text-xs text-emerald-600 font-medium uppercase">Total Items</p>
                      <p className="text-3xl font-black text-emerald-700">{myWallet.totalItems}</p>
                    </div>
                    {isAdmin && (
                      <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                        <p className="text-xs text-blue-600 font-medium uppercase">Total Value</p>
                        <p className="text-3xl font-black text-blue-700">{formatCurrency(myWallet.totalValue)}</p>
                      </div>
                    )}
                    <div className="bg-amber-50 p-4 rounded-xl text-center border border-amber-100">
                      <p className="text-xs text-amber-600 font-medium uppercase">Used</p>
                      <p className="text-3xl font-black text-amber-700">{myWallet.items?.reduce((sum, i) => sum + (i.usedQuantity || 0), 0)} L</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {myWallet.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-emerald-100 rounded-xl">
                            <Beaker size={20} className="text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{item.chemicalName}</p>
                            {isAdmin && <p className="text-xs text-slate-500">Rate: {formatCurrency(item.transferRate)}/{item.displayUnit}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-emerald-600">{item.displayQuantity} <span className="text-sm font-medium text-slate-500">{item.displayUnit}</span></p>
                          <p className="text-xs text-slate-500">Used: {item.usedQuantity || 0} {item.displayUnit}</p>
                        </div>
                      </div>
                    ))}
                    {(!myWallet.items || myWallet.items.length === 0) && (
                      <div className="text-center py-12 text-slate-400">
                        <Wallet size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No chemicals in your wallet</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Wallet size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Loading wallet...</p>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-6">
            {/* Usage Form - Only for Employees (Technician/Sales/Office/Branch Admin) */}
            {!isSuperAdmin && (
              <SectionCard title="Record Usage / Return" icon={Clock} headerBg="bg-gradient-to-r from-amber-600 to-amber-500">
                <form onSubmit={handleUsage} className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Chemical *</label>
                    <select required value={usageForm.chemicalId} onChange={e => setUsageForm({...usageForm, chemicalId: e.target.value})}
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none">
                      <option value="">Select from your wallet</option>
                      {inventory.filter(i => i.ownerType === 'Employee').map(inv => (
                        <option key={inv._id} value={inv.chemicalId?._id}>
                          {inv.chemicalId?.name} (Balance: {inv.displayQuantity || inv.quantity} {inv.displayUnit || inv.chemicalId?.unitSystem})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Quantity *</label>
                      <input type="number" required value={usageForm.quantity} onChange={e => setUsageForm({...usageForm, quantity: e.target.value})}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none" placeholder="150" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Unit</label>
                      <select value={usageForm.unit} onChange={e => setUsageForm({...usageForm, unit: e.target.value})}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none">
                        <option value="ML">Milliliters (ML)</option>
                        <option value="L">Liters (L)</option>
                        <option value="G">Grams (G)</option>
                        <option value="KG">Kilograms (KG)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Job ID (Optional)</label>
                      <input value={usageForm.jobId} onChange={e => setUsageForm({...usageForm, jobId: e.target.value})}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none" placeholder="JOB-001" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Job Name (Optional)</label>
                      <input value={usageForm.jobName} onChange={e => setUsageForm({...usageForm, jobName: e.target.value})}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none" placeholder="Pest Control" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <input 
                      type="checkbox" 
                      id="isReturned" 
                      checked={usageForm.isReturned} 
                      onChange={e => setUsageForm({...usageForm, isReturned: e.target.checked})}
                      className="w-5 h-5 accent-amber-500" 
                    />
                    <label htmlFor="isReturned" className="text-sm font-semibold text-slate-700 cursor-pointer">
                      Return unused stock to branch
                    </label>
                  </div>

                  {usageForm.isReturned && (
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Return To</label>
                      <select value={usageForm.returnTo} onChange={e => setUsageForm({...usageForm, returnTo: e.target.value})}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none">
                        <option value="Branch">My Branch</option>
                        <option value="HQ">Headquarters (Super Admin)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Notes</label>
                    <textarea value={usageForm.notes} onChange={e => setUsageForm({...usageForm, notes: e.target.value})}
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none resize-none" rows="2" />
                  </div>

                  <button type="submit" className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg transition-all ${
                    usageForm.isReturned 
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 shadow-amber-500/30'
                      : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-red-500/30'
                  }`}>
                    {usageForm.isReturned ? <RotateCcw size={18} className="inline mr-2" /> : <AlertCircle size={18} className="inline mr-2" />}
                    {usageForm.isReturned ? 'Return Stock' : 'Record Usage'}
                  </button>
                </form>
              </SectionCard>
            )}

            {/* Usage Info for Super Admin - Shows who used what */}
            {isSuperAdmin && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle size={24} className="text-amber-600" />
                  <h3 className="text-lg font-bold text-amber-800">Usage Tracking</h3>
                </div>
                <p className="text-amber-700 text-sm mb-4">
                  All chemical usage is tracked through employee work reports. 
                  View the History tab to see detailed usage by employee.
                </p>
                <button 
                  onClick={() => setActiveTab('history')}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-500"
                >
                  View Usage History
                </button>
              </div>
            )}

            {/* Usage Summary Table - For Admin to see who used what */}
            {(isAdmin && !isSuperAdmin) && (
              <SectionCard title="Usage by Employees" icon={History} headerBg="bg-gradient-to-r from-red-600 to-red-500">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">Employee</th>
                        <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">Chemical</th>
                        <th className="text-right py-3 text-xs font-bold text-slate-500 uppercase">Qty Used</th>
                        <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">Job</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.filter(t => t.txnType === 'USAGE' || t.txnType === 'RETURN').slice(0, 10).map((tr, idx) => (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-3">
                            <p className="text-sm font-bold text-slate-800">{tr.fromName || 'Employee'}</p>
                          </td>
                          <td className="py-3 text-sm text-slate-700">{tr.chemicalId?.name}</td>
                          <td className="py-3 text-right font-bold text-red-600">
                            {tr.displayQuantity || tr.quantity} {tr.displayUnit || tr.chemicalId?.unitSystem}
                          </td>
                          <td className="py-3 text-xs text-slate-500">{tr.jobName || '-'}</td>
                        </tr>
                      ))}
                      {transactions.filter(t => t.txnType === 'USAGE' || t.txnType === 'RETURN').length === 0 && (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-slate-400">No usage records yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <SectionCard title="Transaction History" icon={History} headerBg="bg-gradient-to-r from-slate-700 to-slate-600">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">Chemical</th>
                    <th className="text-right py-3 text-xs font-bold text-slate-500 uppercase">Qty</th>
                    <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">From</th>
                    <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">To</th>
                    <th className="text-center py-3 text-xs font-bold text-slate-500 uppercase">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tr, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3">
                        <p className="text-xs font-bold text-slate-800">{new Date(tr.createdAt).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-500">{new Date(tr.createdAt).toLocaleTimeString()}</p>
                      </td>
                      <td className="py-3 text-sm font-bold text-slate-800">{tr.chemicalId?.name}</td>
                      <td className="py-3 text-right">
                        <p className="text-sm font-bold text-slate-800">{tr.displayQuantity || tr.quantity} {tr.displayUnit || tr.chemicalId?.unitSystem}</p>
                        {isAdmin && tr.totalValue > 0 && <p className="text-[10px] text-emerald-600">{formatCurrency(tr.totalValue)}</p>}
                      </td>
                      <td className="py-3 text-xs text-slate-600">{tr.fromName}</td>
                      <td className="py-3 text-xs text-slate-600">{tr.toName}</td>
                      <td className="py-3 text-center">
                        <Badge variant={
                          tr.txnType === 'PURCHASE' ? 'success' : 
                          tr.txnType === 'USAGE' ? 'danger' : 
                          tr.txnType === 'RETURN' ? 'warning' : 
                          tr.txnType === 'TRANSFER_TO_BRANCH' ? 'info' : 
                          tr.txnType === 'TRANSFER_TO_EMPLOYEE' ? 'purple' : 'default'
                        }>
                          {tr.txnType}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">No transactions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {activeTab === 'accounts' && isSuperAdmin && (
          <SectionCard title="Branch Account Summary" icon={DollarSign} headerBg="bg-gradient-to-r from-slate-700 to-slate-600">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 text-xs font-bold text-slate-500 uppercase">Branch</th>
                    <th className="text-right py-3 text-xs font-bold text-slate-500 uppercase">Value Given</th>
                    <th className="text-right py-3 text-xs font-bold text-slate-500 uppercase">Paid</th>
                    <th className="text-right py-3 text-xs font-bold text-slate-500 uppercase">Balance</th>
                    <th className="text-center py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {branchBalances.map(b => (
                    <tr key={b._id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-4">
                        <p className="font-bold text-slate-800">{b.branchName}</p>
                        <p className="text-xs text-slate-500">{b.branchCode}</p>
                      </td>
                      <td className="py-4 text-right font-bold text-slate-700">{formatCurrency(b.totalReceivedValue)}</td>
                      <td className="py-4 text-right font-bold text-emerald-600">{formatCurrency(b.totalPaid)}</td>
                      <td className="py-4 text-right font-bold text-amber-600">{formatCurrency(b.pendingBalance)}</td>
                      <td className="py-4 text-center">
                        <Badge variant={b.pendingBalance === 0 ? 'success' : 'warning'}>
                          {b.pendingBalance === 0 ? 'Settled' : 'Pending'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {activeTab === 'payments' && isSuperAdmin && (
          <div className="max-w-xl mx-auto">
            <SectionCard title="Record Payment from Branch" icon={CreditCard} headerBg="bg-gradient-to-r from-emerald-600 to-emerald-500">
              <form onSubmit={handleAddPayment} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Branch *</label>
                  <select required value={payment.branchId} onChange={e => setPayment({...payment, branchId: e.target.value})}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none">
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b._id} value={b._id}>{b.branchName}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Amount (₹) *</label>
                  <input type="number" required value={payment.amount} onChange={e => setPayment({...payment, amount: e.target.value})}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none" placeholder="10000" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Payment Method</label>
                  <select value={payment.paymentMethod} onChange={e => setPayment({...payment, paymentMethod: e.target.value})}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none">
                    <option>UPI</option>
                    <option>NEFT</option>
                    <option>RTGS</option>
                    <option>Cash</option>
                    <option>Cheque</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Transaction ID</label>
                  <input value={payment.transactionId} onChange={e => setPayment({...payment, transactionId: e.target.value})}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none" placeholder="UPI123456" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Notes</label>
                  <textarea value={payment.notes} onChange={e => setPayment({...payment, notes: e.target.value})}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none resize-none" rows="2" />
                </div>

                <button type="submit" className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/30 transition-all">
                  <CreditCard size={18} className="inline mr-2" /> Record Payment
                </button>
              </form>
            </SectionCard>
          </div>
        )}

        {/* BRANCH ADMIN - Purchase Request Tab */}
        {activeTab === 'purchase-request' && user.role === 'branch_admin' && (
          <div className="space-y-6">
            {/* Financial Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-red-600 to-red-700 p-5 rounded-2xl text-white shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} />
                  <span className="text-[10px] font-semibold uppercase opacity-80">Pending to HQ</span>
                </div>
                <p className="text-2xl font-black">{formatCurrency(myBalance?.pendingBalance || 0)}</p>
                <p className="text-[10px] opacity-60 mt-1">Pay to Super Admin</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 rounded-2xl text-white shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} />
                  <span className="text-[10px] font-semibold uppercase opacity-80">Paid to HQ</span>
                </div>
                <p className="text-2xl font-black">{formatCurrency(myBalance?.totalPaid || 0)}</p>
                <p className="text-[10px] opacity-60 mt-1">Total paid so far</p>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-2xl text-white shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee size={16} />
                  <span className="text-[10px] font-semibold uppercase opacity-80">Collections</span>
                </div>
                <p className="text-2xl font-black">{formatCurrency(collections || 0)}</p>
                <p className="text-[10px] opacity-60 mt-1">From receipts</p>
              </div>
              <div className="bg-gradient-to-br from-amber-600 to-amber-700 p-5 rounded-2xl text-white shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} />
                  <span className="text-[10px] font-semibold uppercase opacity-80">Net Balance</span>
                </div>
                <p className="text-2xl font-black">{formatCurrency((collections || 0) - (totalExpenses || 0) - (myBalance?.pendingBalance || 0))}</p>
                <p className="text-[10px] opacity-60 mt-1">Collections - Expenses - Pending</p>
              </div>
            </div>

            {/* Create Purchase Request */}
            <div className="max-w-2xl mx-auto">
              <SectionCard title="Request Chemicals from HQ" icon={ShoppingCart} headerBg="bg-gradient-to-r from-blue-600 to-blue-500">
                <form onSubmit={handleCreatePurchaseRequest} className="space-y-4">
                  {requestItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Chemical</label>
                        <select value={item.chemicalId} onChange={e => {
                          const newItems = [...requestItems];
                          newItems[idx].chemicalId = e.target.value;
                          setRequestItems(newItems);
                        }} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm">
                          <option value="">Select</option>
                          {chemicals.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-4">
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Quantity</label>
                        <input type="number" value={item.quantity} onChange={e => {
                          const newItems = [...requestItems];
                          newItems[idx].quantity = e.target.value;
                          setRequestItems(newItems);
                        }} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm" placeholder="100" />
                      </div>
                      <div className="col-span-2">
                        <select value={item.unit} onChange={e => {
                          const newItems = [...requestItems];
                          newItems[idx].unit = e.target.value;
                          setRequestItems(newItems);
                        }} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm">
                          <option value="L">Liters</option>
                          <option value="ML">ML</option>
                          <option value="KG">KG</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        {requestItems.length > 1 && (
                          <button type="button" onClick={() => setRequestItems(requestItems.filter((_, i) => i !== idx))} className="w-full py-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setRequestItems([...requestItems, { chemicalId: '', quantity: '', unit: 'L' }])} className="text-sm text-blue-600 hover:text-blue-800 font-semibold">
                    + Add Another Chemical
                  </button>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Notes</label>
                    <textarea value={requestNotes} onChange={e => setRequestNotes(e.target.value)} className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm resize-none" rows="2" placeholder="Any special instructions..." />
                  </div>
                  <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider">
                    Send Request to HQ
                  </button>
                </form>
              </SectionCard>
            </div>

            {/* My Requests */}
            <SectionCard title="My Purchase Requests" icon={History} headerBg="bg-gradient-to-r from-slate-700 to-slate-600">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Request No</th>
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Items</th>
                      <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Value</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseRequests.map(req => (
                      <tr key={req._id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold">{req.requestNo}</td>
                        <td className="py-3 px-4 text-slate-600">{new Date(req.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="py-3 px-4 text-right">{req.items?.length}</td>
                        <td className="py-3 px-4 text-right font-bold">{formatCurrency(req.totalValue)}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={req.status === 'COMPLETED' ? 'success' : req.status === 'APPROVED' ? 'info' : req.status === 'REJECTED' ? 'danger' : 'warning'}>
                            {req.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {purchaseRequests.length === 0 && (
                      <tr><td colSpan="5" className="py-8 text-center text-slate-400">No requests yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {/* SUPER ADMIN - Requests Tab */}
        {activeTab === 'requests' && isSuperAdmin && (
          <SectionCard title="Purchase Requests from Branches" icon={FileText} headerBg="bg-gradient-to-r from-purple-600 to-purple-500">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Request No</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Branch</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Items</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Value</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseRequests.map(req => (
                    <tr key={req._id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold">{req.requestNo}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold">{req.branchId?.branchName}</p>
                        <p className="text-xs text-slate-500">{req.requestedBy?.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        {req.items?.map((item, i) => (
                          <p key={i} className="text-xs">{item.chemicalId?.name}: {item.quantity} {item.unit}</p>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">{formatCurrency(req.totalValue)}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={req.status === 'COMPLETED' ? 'success' : req.status === 'APPROVED' ? 'info' : req.status === 'REJECTED' ? 'danger' : 'warning'}>
                          {req.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {req.status === 'PENDING' && (
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleApproveRequest(req._id, 'APPROVED')} className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600">
                              Approve
                            </button>
                            <button onClick={() => handleApproveRequest(req._id, 'REJECTED')} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600">
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {purchaseRequests.length === 0 && (
                    <tr><td colSpan="6" className="py-8 text-center text-slate-400">No requests yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

      </div>
    </div>
  );
};

export default Inventory;
