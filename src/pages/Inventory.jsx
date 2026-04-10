import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import api from '../lib/api';
import { Package, Plus, Send, History, Beaker, User as UserIcon, Building2, Trash2, ArrowRightLeft, DollarSign, CreditCard, TrendingUp, AlertCircle, CheckCircle, Clock, RotateCcw, ShoppingCart, Upload, Wallet, ArrowRight, ArrowDown, ChevronRight, FileText, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../lib/utils';
import ConfirmDialog from '../components/ConfirmDialog';

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
  const [totalExpensesSum, setTotalExpensesSum] = useState(0);
  const [companySettings, setCompanySettings] = useState(null);
  const [convertMode, setConvertMode] = useState({});
  const [rejectModal, setRejectModal] = useState({ open: false, type: '', id: '', reason: '' });
  const [rejectReason, setRejectReason] = useState('');

  const [requestItems, setRequestItems] = useState([{ chemicalId: '', quantity: '', unit: 'L' }]);
  const [requestNotes, setRequestNotes] = useState('');

  const [purchaseForm, setPurchaseForm] = useState({
    items: [{ chemicalId: '', quantity: '', unit: 'L', bottles: '', rate: '' }],
    supplierName: '',
    supplierContact: '',
    invoiceNo: '',
    notes: ''
  });

  const [hqPurchases, setHqPurchases] = useState([]);
  const [branchTransfers, setBranchTransfers] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [employeeInventory, setEmployeeInventory] = useState([]);
  const [employeeUsageHistory, setEmployeeUsageHistory] = useState([]);
  const [employeeUsageForm, setEmployeeUsageForm] = useState({
    chemicalId: '',
    quantity: '',
    unit: 'ML',
    jobId: '',
    jobName: '',
    notes: '',
    isReturned: false,
    returnTo: 'Branch'
  });
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showNewChemicalForm, setShowNewChemicalForm] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, danger: false, isLoading: false });

  const [transferForm, setTransferForm] = useState({
    branchId: '',
    items: [{ chemicalId: '', quantity: '', unit: 'L', bottles: '' }],
    notes: '',
    transferDate: new Date().toISOString().split('T')[0]
  });

  const [distributeForm, setDistributeForm] = useState({
    employeeId: '',
    items: [{ chemicalId: '', quantity: '', unit: 'L', bottles: '' }],
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
    bottles: '',
    description: ''
  });

  const [payment, setPayment] = useState({
    branchId: '',
    amount: '',
    paymentMethod: 'UPI',
    transactionId: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  const fetchChemicals = async () => {
    const res = await api.get('/inventory/chemicals');
    return res.data.data || [];
  };

  const fetchInventoryData = async () => {
    const res = await api.get('/inventory?limit=100');
    return res.data.data || [];
  };

  const fetchTransactions = async () => {
    const res = await api.get('/inventory/transactions');
    return res.data.data || [];
  };

  const fetchWallet = async () => {
    const res = await api.get('/inventory/wallet');
    return res.data.data || null;
  };

  const fetchStockTransfers = async () => {
    const res = await api.get('/stock-transfers?limit=100');
    return res.data.data || [];
  };

  const fetchCompanySettings = async () => {
    const res = await api.get('/company-settings');
    return res.data.data || null;
  };

  const fetchBranches = async () => {
    const res = await api.get('/branches?limit=100');
    return res.data.data || [];
  };

  const fetchEmployees = async () => {
    const res = await api.get('/employees?limit=100');
    return res.data.data || [];
  };

  const fetchBranchBalances = async () => {
    const res = await api.get('/inventory/balances');
    return res.data.data || [];
  };

  const fetchPurchaseRequests = async () => {
    const path = (user.role === 'branch_admin' || user.role === 'office')
      ? '/purchase-requests/my-requests'
      : '/purchase-requests';
    const res = await api.get(path);
    return res.data.data || [];
  };

  const fetchCollections = async () => {
    const res = await api.get('/collections');
    return res.data.data || [];
  };

  const fetchTransferStats = async () => {
    const res = await api.get('/stock-transfers/stats');
    return res.data.data || null;
  };

  const fetchHqPurchases = async () => {
    const res = await api.get('/hq-purchases');
    return res.data.data || [];
  };

  const fetchDistributions = async () => {
    const path = (user.role === 'technician' || user.role === 'sales')
      ? '/employee-distributions/my-distributions?limit=100'
      : '/employee-distributions?limit=100';
    const res = await api.get(path);
    return res.data.data || [];
  };

  const fetchEmployeeInventory = async () => {
    const res = await api.get('/employee-inventory/my-inventory?limit=100');
    return res.data.data || [];
  };

  const fetchEmployeeUsageHistory = async () => {
    const res = await api.get('/employee-inventory/usage-history?limit=100');
    return res.data.data || [];
  };

  const fetchMyBalance = async () => {
    const res = await api.get('/inventory/my-balance');
    return res.data.data || null;
  };

  const fetchExpenses = async () => {
    const res = await api.get('/expenses');
    return res.data.data || [];
  };

  const chemicalsQuery = useQuery({
    queryKey: ['chemicals'],
    queryFn: fetchChemicals,
    enabled: Boolean(user?._id),
    staleTime: 0
  });
  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventoryData,
    enabled: Boolean(user?._id),
    staleTime: 0
  });
  const transactionsQuery = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
    enabled: Boolean(user?._id)
  });
  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: fetchWallet,
    enabled: Boolean(user?._id)
  });
  const stockTransfersQuery = useQuery({
    queryKey: ['stockTransfers'],
    queryFn: fetchStockTransfers,
    enabled: Boolean(user?._id),
    staleTime: 0
  });
  const companySettingsQuery = useQuery({
    queryKey: ['companySettings'],
    queryFn: fetchCompanySettings,
    enabled: Boolean(user?._id)
  });
  const branchesQuery = useQuery({
    queryKey: ['branches'],
    queryFn: fetchBranches,
    enabled: Boolean(user?._id && isSuperAdmin)
  });
  const employeesQuery = useQuery({
    queryKey: ['employees', user?.role],
    queryFn: fetchEmployees,
    enabled: Boolean(user?._id && (isSuperAdmin || user.role === 'branch_admin' || user.role === 'office'))
  });
  const branchBalancesQuery = useQuery({
    queryKey: ['branchBalances'],
    queryFn: fetchBranchBalances,
    enabled: Boolean(user?._id && isSuperAdmin)
  });
  const purchaseRequestsQuery = useQuery({
    queryKey: ['purchaseRequests', user?.role],
    queryFn: fetchPurchaseRequests,
    enabled: Boolean(user?._id && (isSuperAdmin || user.role === 'branch_admin' || user.role === 'office'))
  });
  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: fetchCollections,
    enabled: Boolean(user?._id && (isSuperAdmin || user.role === 'branch_admin' || user.role === 'office'))
  });
  const transferStatsQuery = useQuery({
    queryKey: ['transferStats'],
    queryFn: fetchTransferStats,
    enabled: Boolean(user?._id && (isSuperAdmin || user.role === 'branch_admin' || user.role === 'office'))
  });
  const hqPurchasesQuery = useQuery({
    queryKey: ['hqPurchases'],
    queryFn: fetchHqPurchases,
    enabled: Boolean(user?._id && isSuperAdmin)
  });
  const branchTransfersQuery = useQuery({
    queryKey: ['branchTransfers'],
    queryFn: fetchStockTransfers,
    enabled: Boolean(user?._id && (isSuperAdmin || user.role === 'branch_admin' || user.role === 'office')),
    staleTime: 300000
  });
  const distributionsQuery = useQuery({
    queryKey: ['distributions', user?.role],
    queryFn: fetchDistributions,
    enabled: Boolean(user?._id && (user.role === 'technician' || user.role === 'sales' || user.role === 'branch_admin' || user.role === 'office'))
  });
  const employeeInventoryQuery = useQuery({
    queryKey: ['employeeInventory', user?._id],
    queryFn: fetchEmployeeInventory,
    enabled: Boolean(user?._id && (user.role === 'technician' || user.role === 'sales')),
    staleTime: 300000
  });
  const employeeUsageHistoryQuery = useQuery({
    queryKey: ['employeeUsageHistory', user?._id],
    queryFn: fetchEmployeeUsageHistory,
    enabled: Boolean(user?._id && (user.role === 'technician' || user.role === 'sales'))
  });
  const myBalanceQuery = useQuery({
    queryKey: ['myBalance', user?.role],
    queryFn: fetchMyBalance,
    enabled: Boolean(user?._id && (user.role === 'branch_admin' || user.role === 'office'))
  });
  const expensesQuery = useQuery({
    queryKey: ['expenses', user?.role],
    queryFn: fetchExpenses,
    enabled: Boolean(user?._id && (user.role === 'branch_admin' || user.role === 'office'))
  });

  const refreshQueries = () => {
    const keys = [
      ['chemicals'],
      ['inventory'],
      ['transactions'],
      ['wallet'],
      ['stockTransfers'],
      ['companySettings'],
      ['branches'],
      ['employees', user?.role],
      ['branchBalances'],
      ['purchaseRequests', user?.role],
      ['collections'],
      ['transferStats'],
      ['hqPurchases'],
      ['branchTransfers'],
      ['distributions', user?.role],
      ['employeeInventory', user?._id],
      ['employeeUsageHistory', user?._id],
      ['myBalance', user?.role],
      ['expenses', user?.role]
    ];
    keys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
  };

  useEffect(() => {
    if (chemicalsQuery.data) setChemicals(chemicalsQuery.data);
    if (inventoryQuery.data) setInventory(inventoryQuery.data);
    if (transactionsQuery.data) setTransactions(transactionsQuery.data);
    if (walletQuery.data !== undefined) setMyWallet(walletQuery.data);
    if (stockTransfersQuery.data) setStockTransferRequests(stockTransfersQuery.data);
    if (companySettingsQuery.data !== undefined) setCompanySettings(companySettingsQuery.data);
    if (branchesQuery.data) setBranches(branchesQuery.data);
    if (employeesQuery.data) setBranchUsers(employeesQuery.data);
    if (branchBalancesQuery.data) setBranchBalances(branchBalancesQuery.data);
    if (purchaseRequestsQuery.data) setPurchaseRequests(purchaseRequestsQuery.data);
    if (collectionsQuery.data) {
      const collData = Array.isArray(collectionsQuery.data) ? collectionsQuery.data : [];
      setCollections(collData.reduce((sum, c) => sum + (c.amount || 0), 0));
    }
    if (transferStatsQuery.data !== undefined) setTransferStats(transferStatsQuery.data);
    if (hqPurchasesQuery.data) setHqPurchases(hqPurchasesQuery.data);
    if (branchTransfersQuery.data) setBranchTransfers(branchTransfersQuery.data);
    if (distributionsQuery.data) setDistributions(distributionsQuery.data);
    if (employeeInventoryQuery.data) setEmployeeInventory(employeeInventoryQuery.data);
    if (employeeUsageHistoryQuery.data) setEmployeeUsageHistory(employeeUsageHistoryQuery.data);
    if (myBalanceQuery.data !== undefined) setMyBalance(myBalanceQuery.data);
    if (expensesQuery.data) {
      const expData = Array.isArray(expensesQuery.data) ? expensesQuery.data : [];
      setTotalExpensesSum(expData.reduce((sum, e) => sum + (e.amount || 0), 0));
    }
  }, [
    chemicalsQuery.data,
    inventoryQuery.data,
    transactionsQuery.data,
    walletQuery.data,
    stockTransfersQuery.data,
    companySettingsQuery.data,
    branchesQuery.data,
    employeesQuery.data,
    branchBalancesQuery.data,
    purchaseRequestsQuery.data,
    collectionsQuery.data,
    transferStatsQuery.data,
    hqPurchasesQuery.data,
    branchTransfersQuery.data,
    distributionsQuery.data,
    employeeInventoryQuery.data,
    employeeUsageHistoryQuery.data,
    myBalanceQuery.data,
    expensesQuery.data
  ]);

  const handleAddNewChemical = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/inventory/chemicals', newChemical);
      toast.success('Chemical registered successfully');
      const newChem = res.data.data;
      setShowNewChemicalForm(false);
      setNewChemical({ name: '', unit: 'Liters', unitSystem: 'L', category: 'Insecticide', mainStock: '', purchasePrice: '', bottles: '', description: '' });
      setPurchaseForm({
        items: [{ chemicalId: newChem._id, quantity: newChem.mainStock || '', unit: newChem.unitSystem || 'L', bottles: '', rate: newChem.purchasePrice || '' }],
        supplierName: '',
        supplierContact: '',
        invoiceNo: '',
        notes: ''
      });
      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding chemical');
    } finally {
      setLoading(false);
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
      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error recording purchase');
    }
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const validItems = purchaseForm.items.filter(item => item.chemicalId && item.quantity && item.rate);
      if (validItems.length === 0) {
        toast.error('Add at least one item');
        setLoading(false);
        return;
      }
      await api.post('/hq-purchases', purchaseForm);
      toast.success('Purchase recorded successfully');
      setShowPurchaseModal(false);
      setPurchaseForm({
        items: [{ chemicalId: '', quantity: '', unit: 'L', rate: '' }],
        supplierName: '',
        supplierContact: '',
        invoiceNo: '',
        notes: ''
      });
      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error recording purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const validItems = transferForm.items.filter(item => item.chemicalId && item.quantity);
      if (validItems.length === 0 || !transferForm.branchId) {
        toast.error('Select branch and add items');
        setLoading(false);
        return;
      }

      await api.post('/stock-transfers', {
        toId: transferForm.branchId,
        toType: 'Branch',
        items: validItems.map(item => ({
          chemicalId: item.chemicalId,
          quantity: parseFloat(item.quantity),
          unit: item.unit || 'L',
          bottles: parseInt(item.bottles) || 0,
          bottleSize: item.bottleSize || ''
        })),
        notes: transferForm.notes
      });
      toast.success('Transfer created - waiting for branch acceptance');
      setShowTransferModal(false);
      setTransferForm({
        branchId: '',
        items: [{ chemicalId: '', quantity: '', unit: 'L', bottles: '' }],
        notes: '',
        transferDate: new Date().toISOString().split('T')[0]
      });
      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const validItems = distributeForm.items.filter(item => item.chemicalId && item.quantity);
      if (validItems.length === 0 || !distributeForm.employeeId) {
        toast.error('Select employee and add items');
        setLoading(false);
        return;
      }
      await api.post('/employee-distributions', distributeForm);
      toast.success('Stock distributed to employee');
      setShowDistributeModal(false);
      setDistributeForm({
        employeeId: '',
        items: [{ chemicalId: '', quantity: '', unit: 'L', bottles: '' }],
        notes: ''
      });

      // Optimistic update - reduce branch inventory
      const distributedQty = parseFloat(validItems[0]?.quantity || 0);
      const distributedUnit = validItems[0]?.unit || 'L';
      const chemId = validItems[0]?.chemicalId;

      setInventory(prev => prev.map(inv => {
        if (inv.chemicalId?._id === chemId && inv.ownerType === 'Branch') {
          return {
            ...inv,
            displayQuantity: Math.max(0, (inv.displayQuantity || 0) - distributedQty)
          };
        }
        return inv;
      }));

      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error distributing stock');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTransfer = async (transferId) => {
    try {
      await api.patch(`/stock-transfers/${transferId}/approve`);
      toast.success('Transfer accepted - stock added to your branch');

      // Optimistic update
      setStockTransferRequests(prev =>
        prev.map(req => req._id === transferId ? { ...req, status: 'APPROVED' } : req)
      );

      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error accepting transfer');
    }
  };

  const handleRejectTransfer = async (transferId) => {
    try {
      await api.patch(`/stock-transfers/${transferId}/reject`);
      toast.success('Transfer rejected');

      // Optimistic update
      setStockTransferRequests(prev =>
        prev.map(req => req._id === transferId ? { ...req, status: 'REJECTED' } : req)
      );

      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error rejecting transfer');
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

      // Optimistic update - reduce inventory
      const usedQty = parseFloat(usageForm.quantity);
      setInventory(prev => prev.map(inv => {
        if (inv.chemicalId?._id === usageForm.chemicalId && inv.ownerType === 'Employee') {
          return {
            ...inv,
            displayQuantity: Math.max(0, (inv.displayQuantity || 0) - usedQty)
          };
        }
        return inv;
      }));

      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error recording usage');
    }
  };

  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({
    employeeId: '',
    chemicalId: '',
    quantity: '',
    unit: 'ML',
    bottles: '',
    bottleSize: '',
    notes: ''
  });

  const handleSendToColleague = async (e) => {
    e.preventDefault();
    try {
      if (!sendForm.employeeId || !sendForm.chemicalId || !sendForm.quantity) {
        return toast.error('Fill all required fields');
      }

      if (user.role === 'branch_admin' || user.role === 'office') {
        await api.post('/stock-transfers', {
          toId: sendForm.employeeId,
          toType: 'Employee',
          items: [{
            chemicalId: sendForm.chemicalId,
            quantity: parseFloat(sendForm.quantity),
            unit: sendForm.unit,
            bottles: parseInt(sendForm.bottles) || 0,
            bottleSize: sendForm.bottleSize || ''
          }],
          notes: sendForm.notes
        });
        toast.success('Transfer request sent to employee for acceptance');
      } else {
        await api.post('/employee-distributions', {
          employeeId: sendForm.employeeId,
          items: [{
            chemicalId: sendForm.chemicalId,
            quantity: sendForm.quantity,
            unit: sendForm.unit
          }],
          notes: sendForm.notes,
          fromUserId: user._id
        });
        toast.success('Stock sent to colleague!');
      }

      setShowSendModal(false);
      setSendForm({ employeeId: '', chemicalId: '', quantity: '', unit: 'ML', notes: '' });
      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error sending stock');
    }
  };

  const handleEmployeeUsage = async (e) => {
    e.preventDefault();
    try {
      if (!employeeUsageForm.chemicalId || !employeeUsageForm.quantity) {
        return toast.error('Fill all required fields');
      }

      const usedQty = parseFloat(employeeUsageForm.quantity);

      if (employeeUsageForm.isReturned) {
        await api.post('/employee-inventory/return', {
          chemicalId: employeeUsageForm.chemicalId,
          quantity: usedQty,
          unit: employeeUsageForm.unit,
          notes: employeeUsageForm.notes,
          returnTo: employeeUsageForm.returnTo
        });
        toast.success('Stock returned successfully');
      } else {
        await api.post('/employee-inventory/use', {
          chemicalId: employeeUsageForm.chemicalId,
          quantity: usedQty,
          unit: employeeUsageForm.unit,
          jobId: employeeUsageForm.jobId,
          jobName: employeeUsageForm.jobName,
          notes: employeeUsageForm.notes
        });
        toast.success('Usage recorded successfully');

        // Optimistic update - reduce employee inventory
        setEmployeeInventory(prev => prev.map(inv => {
          if (inv.chemicalId === employeeUsageForm.chemicalId) {
            return {
              ...inv,
              currentStock: Math.max(0, (inv.currentStock || 0) - usedQty)
            };
          }
          return inv;
        }));
      }

      setEmployeeUsageForm({
        chemicalId: '',
        quantity: '',
        unit: 'ML',
        jobId: '',
        jobName: '',
        notes: '',
        isReturned: false,
        returnTo: 'Branch'
      });
      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error recording usage');
    }
  };

  const handleApproveDistribution = async (id) => {
    try {
      await api.post(`/employee-distributions/${id}/approve`);
      toast.success('Stock accepted!');

      // Optimistic update - remove from pending list
      setDistributions(prev =>
        prev.map(d => d._id === id ? { ...d, status: 'APPROVED' } : d)
      );

      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error accepting');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      await api.post(`/employee-distributions/${id}/reject`);
      toast.success('Request rejected');

      // Optimistic update - remove from pending list
      setDistributions(prev =>
        prev.map(d => d._id === id ? { ...d, status: 'REJECTED' } : d)
      );

      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error rejecting');
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

      // Optimistic update - add to purchase requests list
      // refresh queries to keep data fresh
      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating request');
    }
  };

  const handleApproveRequest = async (requestId, status) => {
    try {
      await api.patch(`/purchase-requests/${requestId}/status`, { status });
      toast.success(`Request ${status.toLowerCase()} successfully`);

      // Optimistic update - update status in list
      setPurchaseRequests(prev =>
        prev.map(req => req._id === requestId ? { ...req, status } : req)
      );

      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating request');
    }
  };

  const handleApproveStockTransfer = async (requestId) => {
    try {
      await api.patch(`/stock-transfers/${requestId}/approve`);
      toast.success('Transfer approved and stock added!');

      // Optimistic update - update state immediately
      setStockTransferRequests(prev =>
        prev.map(req => req._id === requestId ? { ...req, status: 'APPROVED' } : req)
      );
      setBranchTransfers(prev =>
        prev.map(req => req._id === requestId ? { ...req, status: 'APPROVED' } : req)
      );

      // Also update inventory
      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error approving transfer');
    }
  };

  const handleRejectStockTransfer = async (requestId, reason = '') => {
    try {
      await api.patch(`/stock-transfers/${requestId}/reject`, { reason });
      toast.success('Transfer rejected');

      // Optimistic update - update state immediately
      setStockTransferRequests(prev =>
        prev.map(req => req._id === requestId ? { ...req, status: 'REJECTED' } : req)
      );
      setBranchTransfers(prev =>
        prev.map(req => req._id === requestId ? { ...req, status: 'REJECTED' } : req)
      );

      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error rejecting transfer');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      if (!payment.amount) {
        return toast.error('Enter payment amount');
      }

      const paymentData = {
        ...payment,
        branchId: user?.branchId?._id || user?.branchId
      };

      await api.post('/payments', paymentData);
      toast.success('Payment recorded successfully!');
      setPayment({ branchId: '', amount: '', paymentMethod: 'UPI', transactionId: '', notes: '' });

      // Optimistic update - reduce pending balance
      if (myBalance) {
        setMyBalance(prev => ({
          ...prev,
          totalPaid: (prev.totalPaid || 0) + parseFloat(payment.amount || 0),
          pendingBalance: Math.max(0, (prev.pendingBalance || 0) - parseFloat(payment.amount || 0))
        }));
      }

      refreshQueries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error recording payment');
    }
  };

  const handleDeleteChemical = async (chemId) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Chemical',
      message: 'Are you sure you want to delete this chemical? This action cannot be undone.',
      danger: true,
      isLoading: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        try {
          await api.delete(`/inventory/chemicals/${chemId}`);
          toast.success('Chemical deleted');
          setChemicals(prev => prev.filter(c => c._id !== chemId));
          refreshQueries();
        } catch (error) {
          toast.error(error.response?.data?.message || 'Error deleting');
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false, isLoading: false }));
        }
      }
    });
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-2.5 bg-emerald-500 rounded-lg sm:rounded-xl text-white shadow-lg shadow-emerald-500/30">
                <Package size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900">Chemical Inventory</h1>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">Purchase, Transfer & Distribution</p>
              </div>
            </div>
          </div>

          <div className="flex bg-white p-1 rounded-lg sm:rounded-xl border border-slate-200 shadow-sm overflow-x-auto scrollbar-hide w-full md:w-auto">
            {[
              ...(isSuperAdmin ? [
                { id: 'summary', label: 'Dashboard', icon: TrendingUp },
                { id: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
                { id: 'products', label: 'Products', icon: Beaker },
                { id: 'requests', label: 'Requests', icon: FileText },
                { id: 'accounts', label: 'Accounts', icon: DollarSign },
                { id: 'payments', label: 'Payments', icon: CreditCard }
              ] : []),
              ...(user.role === 'branch_admin' ? [
                { id: 'summary', label: 'Dashboard', icon: TrendingUp },
                { id: 'transfer-requests', label: 'Incoming', icon: ArrowRightLeft },
                { id: 'purchase-request', label: 'Buy Chemicals', icon: ShoppingCart },
                { id: 'make-payment', label: 'Make Payment', icon: CreditCard },
                { id: 'distribute', label: 'Distribute', icon: Send },
                { id: 'accounts', label: 'Accounts', icon: DollarSign }
              ] : []),
              ...(user.role === 'technician' || user.role === 'sales' ? [
                { id: 'my-stock', label: 'My Stock', icon: Package },
                { id: 'usage', label: 'Usage', icon: Clock }
              ] : []),
              { id: 'wallet', label: 'Wallet', icon: Wallet },
              { id: 'history', label: 'History', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 sm:gap-2 ${activeTab === tab.id
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <tab.icon size={10} className="sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" /> <span className="hidden md:inline">{tab.label}</span><span className="md:hidden text-[8px] sm:text-[9px]">{tab.label.split(' ')[0]}</span>
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  <div className="bg-linear-to-br from-blue-600 to-blue-700 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl text-white shadow-xl">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Package size={14} className="sm:w-4 sm:h-4" />
                      <span className="text-[8px] sm:text-[10px] font-semibold uppercase opacity-80">Stock</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-black">
                      {chemicals.reduce((sum, c) => sum + (c.mainStock || 0), 0)} L
                    </p>
                    <p className="text-[8px] sm:text-[10px] opacity-60 mt-0.5 sm:mt-1">At HQ</p>
                  </div>
                  <div className="bg-linear-to-br from-purple-600 to-purple-700 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl text-white shadow-xl">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Send size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                      <span className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold uppercase opacity-80">Transferred</span>
                    </div>
                    <p className="text-base sm:text-xl md:text-2xl font-black truncate">{formatCurrency(transferStats?.totalTransferredValue || branchBalances.reduce((a, b) => a + b.totalReceivedValue, 0))}</p>
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] opacity-60 mt-0.5 sm:mt-1">To Branches</p>
                  </div>
                  <div className="bg-linear-to-br from-emerald-600 to-emerald-700 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl text-white shadow-xl">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                      <span className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold uppercase opacity-80">Paid</span>
                    </div>
                    <p className="text-base sm:text-xl md:text-2xl font-black truncate">{formatCurrency(transferStats?.totalPaid || branchBalances.reduce((a, b) => a + b.totalPaid, 0))}</p>
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] opacity-60 mt-0.5 sm:mt-1">By Branches</p>
                  </div>
                  <div className="bg-linear-to-br from-amber-600 to-amber-700 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl text-white shadow-xl">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <AlertCircle size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                      <span className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold uppercase opacity-80">Remaining</span>
                    </div>
                    <p className="text-base sm:text-xl md:text-2xl font-black truncate">{formatCurrency(transferStats?.pendingBalance || branchBalances.reduce((a, b) => a + b.pendingBalance, 0))}</p>
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] opacity-60 mt-0.5 sm:mt-1">Pending</p>
                  </div>
                </div>

                {/* My Pending Transfers to Branches */}
                {stockTransferRequests.filter(r => r.status === 'PENDING' && r.txnType === 'SUPER_TO_BRANCH').length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={18} className="text-amber-600" />
                      <h3 className="font-bold text-amber-800">My Transfers Awaiting Branch Acceptance</h3>
                      <Badge variant="warning">{stockTransferRequests.filter(r => r.status === 'PENDING' && r.txnType === 'SUPER_TO_BRANCH').length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {stockTransferRequests.filter(r => r.status === 'PENDING' && r.txnType === 'SUPER_TO_BRANCH').slice(0, 3).map(req => (
                        <div key={req._id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-100">
                          <div>
                            <p className="font-bold text-sm">{req.chemicalName}</p>
                            <p className="text-xs text-slate-500">{req.quantity} {req.unit} → {req.toName}</p>
                          </div>
                          <Badge variant="warning">Awaiting</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Branch Admin Dashboard */}
            {user.role === 'branch_admin' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                  <div className="bg-linear-to-br from-blue-600 to-blue-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Package size={16} />
                      <span className="text-[10px] font-semibold uppercase opacity-80">Total Stock</span>
                    </div>
                    <p className="text-2xl font-black">
                      {inventory.filter(i => i.ownerType === 'Branch').reduce((sum, i) => sum + (i.displayQuantity || 0), 0)} L
                    </p>
                    <p className="text-[10px] opacity-60 mt-1">At Branch</p>
                  </div>
                  <div className="bg-linear-to-br from-purple-600 to-purple-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Send size={14} className="md:w-4 md:h-4" />
                      <span className="text-[9px] md:text-[10px] font-semibold uppercase opacity-80">Distributed</span>
                    </div>
                    <p className="text-xl md:text-2xl font-black truncate">
                      {inventory.filter(i => i.ownerType === 'Employee').reduce((sum, i) => sum + (i.displayQuantity || 0), 0)} L
                    </p>
                    <p className="text-[9px] md:text-[10px] opacity-60 mt-1">To Employees</p>
                  </div>
                  <div className="bg-linear-to-br from-orange-600 to-orange-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Beaker size={14} className="md:w-4 md:h-4" />
                      <span className="text-[9px] md:text-[10px] font-semibold uppercase opacity-80">Bottles</span>
                    </div>
                    <p className="text-xl md:text-2xl font-black truncate">
                      {inventory.filter(i => i.ownerType === 'Branch').reduce((sum, i) => sum + (i.bottles || 0), 0)}
                    </p>
                    <p className="text-[9px] md:text-[10px] opacity-60 mt-1">At Branch</p>
                  </div>
                  <div className="bg-linear-to-br from-emerald-600 to-emerald-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={14} className="md:w-4 md:h-4" />
                      <span className="text-[9px] md:text-[10px] font-semibold uppercase opacity-80">Received</span>
                    </div>
                    <p className="text-xl md:text-2xl font-black truncate">{formatCurrency(myBalance?.totalReceivedValue || 0)}</p>
                    <p className="text-[9px] md:text-[10px] opacity-60 mt-1">From HQ</p>
                  </div>
                  <div className="bg-linear-to-br from-amber-600 to-amber-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={14} className="md:w-4 md:h-4" />
                      <span className="text-[9px] md:text-[10px] font-semibold uppercase opacity-80">Pending</span>
                    </div>
                    <p className="text-xl md:text-2xl font-black truncate">{formatCurrency(myBalance?.pendingBalance || 0)}</p>
                    <p className="text-[9px] md:text-[10px] opacity-60 mt-1">Payment Due</p>
                  </div>
                </div>

                {/* Quick Actions for Branch Admin */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => setActiveTab('purchase-request')}
                      className="p-4 bg-blue-50 rounded-xl text-center hover:bg-blue-100 transition-colors"
                    >
                      <ShoppingCart size={24} className="mx-auto mb-2 text-blue-600" />
                      <p className="text-sm font-bold text-blue-700">Buy Chemicals</p>
                    </button>
                    <button
                      onClick={() => setActiveTab('make-payment')}
                      className="p-4 bg-emerald-50 rounded-xl text-center hover:bg-emerald-100 transition-colors"
                    >
                      <CreditCard size={24} className="mx-auto mb-2 text-emerald-600" />
                      <p className="text-sm font-bold text-emerald-700">Make Payment</p>
                    </button>
                    <button
                      onClick={() => setActiveTab('distribute')}
                      className="p-4 bg-orange-50 rounded-xl text-center hover:bg-orange-100 transition-colors"
                    >
                      <Send size={24} className="mx-auto mb-2 text-orange-600" />
                      <p className="text-sm font-bold text-orange-700">Distribute</p>
                    </button>
                    <button
                      onClick={() => setActiveTab('transfer-requests')}
                      className="p-4 bg-teal-50 rounded-xl text-center hover:bg-teal-100 transition-colors relative"
                    >
                      <ArrowRightLeft size={24} className="mx-auto mb-2 text-teal-600" />
                      <p className="text-sm font-bold text-teal-700">Incoming</p>
                      {stockTransferRequests.filter(r => r.status === 'PENDING' && r.txnType === 'SUPER_TO_BRANCH').length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                          {stockTransferRequests.filter(r => r.status === 'PENDING' && r.txnType === 'SUPER_TO_BRANCH').length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Pending Transfer Alert for Branch Admin */}
                {stockTransferRequests.filter(r => r.status === 'PENDING' && r.txnType === 'SUPER_TO_BRANCH').length > 0 && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-100 rounded-xl">
                          <ArrowRightLeft size={24} className="text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-amber-800 text-lg">Pending Stock Transfers from HQ!</h3>
                          <p className="text-amber-600 text-sm">{stockTransferRequests.filter(r => r.status === 'PENDING' && r.txnType === 'SUPER_TO_BRANCH').length} transfer(s) waiting for your acceptance</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('transfer-requests')}
                        className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600"
                      >
                        View & Accept
                      </button>
                    </div>
                    <div className="space-y-2">
                      {stockTransferRequests.filter(r => r.status === 'PENDING' && r.txnType === 'SUPER_TO_BRANCH').slice(0, 3).map(req => (
                        <div key={req._id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-amber-200">
                          <div className="flex items-center gap-3">
                            <Beaker size={20} className="text-amber-600" />
                            <div>
                              <p className="font-bold text-slate-800">{req.chemicalName}</p>
                              <p className="text-xs text-slate-500">{req.quantity} {req.unit} • Value: {formatCurrency(req.totalValue)}</p>
                            </div>
                          </div>
                          <Badge variant="warning">Pending</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Branch Stock with Convert */}
                <SectionCard title="My Stock" icon={Package} headerBg="bg-gradient-to-r from-blue-600 to-blue-500">
                  {inventory.filter(i => i.ownerType === 'Branch' && (i.displayQuantity || 0) > 0).length > 0 ? (
                    <div className="space-y-3">
                      {inventory.filter(i => i.ownerType === 'Branch' && (i.displayQuantity || 0) > 0).map((inv, idx) => {
                        const isConverted = convertMode[inv._id];
                        const qty = inv.displayQuantity || 0;
                        const unit = inv.displayUnit || 'L';
                        const convertedText = isConverted && unit === 'L' ? `${qty * 1000}ml` : `${qty}L`;

                        return (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-xl">
                                <Beaker size={16} className="text-blue-600" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{inv.chemicalId?.name}</p>
                                <p className="text-[10px] text-slate-500">{inv.chemicalId?.category}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <p className="text-xl font-black text-blue-600">
                                {convertedText}
                              </p>
                              {unit === 'L' && (
                                <button
                                  onClick={() => setConvertMode({ ...convertMode, [inv._id]: !isConverted })}
                                  className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-200"
                                >
                                  {isConverted ? 'L' : 'ml'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-slate-400 py-8">No stock available</p>
                  )}
                </SectionCard>
              </div>
            )}
          </div>
        )}

        {/* Transfer Tab - HQ Chemical Stock */}
        {(activeTab === 'summary' || activeTab === 'transfer') && isSuperAdmin && (
          <div className="space-y-6">
            <SectionCard title="HQ Chemical Stock" icon={Beaker} headerBg="bg-gradient-to-r from-amber-600 to-amber-500">
              {chemicals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Name</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Stock</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Cost Rate</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Transfer Rate (+10%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chemicals.map(chem => (
                        <tr key={chem._id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold">{chem.name}</td>
                          <td className="py-3 px-4 text-slate-600">{chem.category}</td>
                          <td className="py-3 px-4 text-right font-bold text-blue-600">{chem.mainStock || 0} {chem.unitSystem || 'L'}</td>
                          <td className="py-3 px-4 text-right">₹{chem.purchasePrice || 0}</td>
                          <td className="py-3 px-4 text-right font-bold text-green-600">₹{Math.round((chem.purchasePrice || 0) * 1.1 * 100) / 100}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">No chemicals in stock</div>
              )}
            </SectionCard>
          </div>
        )}

        {/* Transfer Tab */}
        {activeTab === 'transfer' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl font-bold">
                  Pending: {branchTransfers.filter(t => t.status === 'PENDING').length}
                </div>
                <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-bold">
                  Approved: {branchTransfers.filter(t => t.status === 'APPROVED').length}
                </div>
              </div>
              <button onClick={() => setShowTransferModal(true)} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                <ArrowRightLeft size={16} /> New Transfer
              </button>
            </div>
            <SectionCard title="My Transfers to Branches" icon={ArrowRightLeft} headerBg="bg-gradient-to-r from-teal-600 to-teal-500">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Chemical</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Qty</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Unit</th>
                      {isSuperAdmin && <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Rate</th>}
                      {isSuperAdmin && <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Value</th>}
                      <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">From</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">To</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchTransfers.map(req => (
                      <tr key={req._id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <p className="font-bold">{req.chemicalName}</p>
                          <p className="text-xs text-slate-500">{req.chemicalId?.category}</p>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">{req.quantity}</td>
                        <td className="py-3 px-4 text-center">{req.unit}</td>
                        {isSuperAdmin && <td className="py-3 px-4 text-right font-bold">₹{req.rate}</td>}
                        {isSuperAdmin && <td className="py-3 px-4 text-right font-bold">₹{req.quantity * req.rate}</td>}
                        <td className="py-3 px-4 text-center">{req.fromBranch?.branchName || 'HQ'}</td>
                        <td className="py-3 px-4 text-center">{req.toBranch?.branchName}</td>
                        <td className="py-3 px-4 text-center">
                          {req.status === 'APPROVED' ? (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">Approved</span>
                          ) : req.status === 'REJECTED' ? (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">Rejected</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {req.status === 'PENDING' && (
                            <Badge variant="warning">Pending (Awaiting Branch)</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                    {branchTransfers.length === 0 && (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-400">No transfer requests</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Products Tab - Chemical Management */}
        {activeTab === 'products' && isSuperAdmin && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Chemical Products</h2>
              <button onClick={() => setShowPurchaseModal(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                <Plus size={16} /> Add Chemical
              </button>
            </div>

            <SectionCard title="All Chemicals" icon={Beaker} headerBg="bg-gradient-to-r from-emerald-600 to-emerald-500">
              {chemicals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Name</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Stock</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Unit</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Cost Rate</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Transfer Rate</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chemicals.map(chem => (
                        <tr key={chem._id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold">{chem.name}</td>
                          <td className="py-3 px-4">{chem.category}</td>
                          <td className="py-3 px-4 text-right font-bold text-blue-600">{chem.mainStock || 0}</td>
                          <td className="py-3 px-4 text-right">{chem.unitSystem || 'L'}</td>
                          <td className="py-3 px-4 text-right">₹{chem.purchasePrice || 0}</td>
                          <td className="py-3 px-4 text-right font-bold text-green-600">₹{Math.round((chem.purchasePrice || 0) * 1.1 * 100) / 100}</td>
                          <td className="py-3 px-4 text-center">
                            {isSuperAdmin && (
                              <button onClick={() => handleDeleteChemical(chem._id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Beaker size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No chemicals registered yet</p>
                  <button onClick={() => setShowPurchaseModal(true)} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold">
                    Add First Chemical
                  </button>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-6">
            {/* Balance Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-linear-to-br from-emerald-600 to-emerald-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <p className="text-[10px] font-semibold uppercase opacity-80">Received Value</p>
                <p className="text-2xl font-black">{formatCurrency(myBalance?.totalReceivedValue || 0)}</p>
              </div>
              <div className="bg-linear-to-br from-blue-600 to-blue-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <p className="text-[10px] font-semibold uppercase opacity-80">Total Paid</p>
                <p className="text-2xl font-black">{formatCurrency(myBalance?.totalPaid || 0)}</p>
              </div>
              <div className="bg-linear-to-br from-amber-600 to-amber-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <p className="text-[10px] font-semibold uppercase opacity-80">Pending Balance</p>
                <p className="text-2xl font-black">{formatCurrency(myBalance?.pendingBalance || 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <p className="text-[10px] font-semibold uppercase opacity-80">Collections</p>
                <p className="text-2xl font-black">{formatCurrency(collections)}</p>
              </div>
            </div>
            <SectionCard title="Branch Account Summary" icon={DollarSign} headerBg="bg-gradient-to-r from-rose-600 to-rose-500">
              {myBalance ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-xl">
                      <p className="text-sm text-emerald-600 font-medium">Total Stock Value</p>
                      <p className="text-2xl font-bold text-emerald-700">{formatCurrency(myBalance?.totalInventoryValue || 0)}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <p className="text-sm text-blue-600 font-medium">Available Stock</p>
                      <p className="text-2xl font-bold text-blue-700">{myBalance?.availableItems?.toFixed(2) || 0} L</p>
                    </div>
                  </div>
                  <div className="text-center py-4 text-slate-500">
                    <p className="text-sm">Pending payments can be made from the Make Payment tab</p>
                    <button
                      onClick={() => setActiveTab('make-payment')}
                      className="mt-2 px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700"
                    >
                      Go to Make Payment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Loading...</p>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* Make Payment Tab - For Branch Admin */}
        {activeTab === 'make-payment' && user.role === 'branch_admin' && (
          <div className="space-y-6">
            <SectionCard title="Make Payment to HQ" icon={CreditCard} headerBg="bg-gradient-to-r from-emerald-600 to-emerald-500">
              <form onSubmit={handleAddPayment} className="space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={18} className="text-amber-600" />
                    <p className="font-bold text-amber-800">Pending Balance</p>
                  </div>
                  <p className="text-3xl font-black text-amber-700">{formatCurrency(myBalance?.pendingBalance || 0)}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={payment.amount}
                    onChange={e => setPayment({ ...payment, amount: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-4 py-4 rounded-xl text-lg font-bold outline-none focus:border-emerald-500"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Payment Method *</label>
                  <select
                    value={payment.paymentMethod}
                    onChange={e => setPayment({ ...payment, paymentMethod: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-emerald-500"
                  >
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="RTGS">RTGS</option>
                    <option value="NEFT">NEFT</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Transaction ID (Optional)</label>
                  <input
                    type="text"
                    value={payment.transactionId}
                    onChange={e => setPayment({ ...payment, transactionId: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-emerald-500"
                    placeholder="UPI Ref / Transaction ID"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Notes (Optional)</label>
                  <textarea
                    value={payment.notes}
                    onChange={e => setPayment({ ...payment, notes: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 resize-none"
                    rows="2"
                    placeholder="Payment notes..."
                  />
                </div>

                <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-emerald-700 flex items-center justify-center gap-2">
                  <CreditCard size={18} /> Submit Payment
                </button>
              </form>
            </SectionCard>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && isSuperAdmin && (
          <div className="space-y-6">
            {/* Payment Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-linear-to-br from-emerald-600 to-emerald-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <p className="text-[10px] font-semibold uppercase opacity-80">Total Received</p>
                <p className="text-2xl font-black">{formatCurrency(branchBalances.reduce((a, b) => a + b.totalPaid, 0))}</p>
              </div>
              <div className="bg-linear-to-br from-amber-600 to-amber-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <p className="text-[10px] font-semibold uppercase opacity-80">Pending</p>
                <p className="text-2xl font-black">{formatCurrency(branchBalances.reduce((a, b) => a + b.pendingBalance, 0))}</p>
              </div>
              <div className="bg-linear-to-br from-blue-600 to-blue-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <p className="text-[10px] font-semibold uppercase opacity-80">Total Value</p>
                <p className="text-2xl font-black">{formatCurrency(branchBalances.reduce((a, b) => a + b.totalReceivedValue, 0))}</p>
              </div>
              <div className="bg-linear-to-br from-purple-600 to-purple-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <p className="text-[10px] font-semibold uppercase opacity-80">Branches</p>
                <p className="text-2xl font-black">{branches.length}</p>
              </div>
            </div>

            <SectionCard title="Branch Payment Status" icon={CreditCard} headerBg="bg-gradient-to-r from-indigo-600 to-indigo-500">
              {branchBalances.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Branch</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Received</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Paid</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Pending</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchBalances.map(branch => (
                        <tr key={branch._id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold">{branch.branchName}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(branch.totalReceivedValue || 0)}</td>
                          <td className="py-3 px-4 text-right text-emerald-600 font-bold">{formatCurrency(branch.totalPaid || 0)}</td>
                          <td className="py-3 px-4 text-right text-amber-600 font-bold">{formatCurrency(branch.pendingBalance || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">Loading...</p>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* Distribute Tab (Branch Admin) */}
        {activeTab === 'distribute' && user.role === 'branch_admin' && (
          <div className="space-y-6">
            {/* Branch Stock Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-linear-to-br from-blue-600 to-blue-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <p className="text-[10px] font-semibold uppercase opacity-80">Branch Stock</p>
                <p className="text-2xl font-black">
                  {inventory.filter(i => i.ownerType === 'Branch').reduce((sum, i) => sum + (i.displayQuantity || 0), 0)} L
                </p>
              </div>
              <div className="bg-linear-to-br from-purple-600 to-purple-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <p className="text-[10px] font-semibold uppercase opacity-80">Distributed</p>
                <p className="text-2xl font-black">
                  {inventory.filter(i => i.ownerType === 'Employee').reduce((sum, i) => sum + (i.displayQuantity || 0), 0)} L
                </p>
              </div>
              <div className="bg-linear-to-br from-emerald-600 to-emerald-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <p className="text-[10px] font-semibold uppercase opacity-80">Available</p>
                <p className="text-2xl font-black">
                  {(inventory.filter(i => i.ownerType === 'Branch').reduce((sum, i) => sum + (i.displayQuantity || 0), 0) -
                    inventory.filter(i => i.ownerType === 'Employee').reduce((sum, i) => sum + (i.displayQuantity || 0), 0)).toFixed(1)} L
                </p>
              </div>
              <div className="bg-linear-to-br from-orange-600 to-orange-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <p className="text-[10px] font-semibold uppercase opacity-80">Bottles</p>
                <p className="text-2xl font-black">
                  {inventory.filter(i => i.ownerType === 'Branch').reduce((sum, i) => sum + (i.bottles || 0), 0)}
                </p>
              </div>
            </div>

            <SectionCard title="Distribute Stock to Employees" icon={Send} headerBg="bg-gradient-to-r from-orange-600 to-orange-500">
              <form onSubmit={handleDistributeSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Select Employee *</label>
                  <select
                    required
                    value={distributeForm.employeeId}
                    onChange={e => setDistributeForm({ ...distributeForm, employeeId: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-orange-500"
                  >
                    <option value="">Select Employee</option>
                    {(Array.isArray(branchUsers) ? branchUsers : []).map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Select Chemical *</label>
                  <select
                    required
                    value={distributeForm.items[0]?.chemicalId || ''}
                    onChange={e => setDistributeForm({ ...distributeForm, items: [{ ...distributeForm.items[0], chemicalId: e.target.value }] })}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-orange-500"
                  >
                    <option value="">Select Chemical</option>
                    {inventory.filter(i => i.ownerType === 'Branch' && (i.displayQuantity || 0) > 0).map(inv => (
                      <option key={inv._id} value={inv.chemicalId?._id}>
                        {inv.chemicalId?.name} (Avail: {inv.displayQuantity || 0} {inv.displayUnit || 'L'}
                        {inv.bottles > 0 ? ` • ${inv.bottles} bottles` : ''})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Quantity *</label>
                    <input
                      type="number"
                      required
                      value={distributeForm.items[0]?.quantity || ''}
                      onChange={e => setDistributeForm({ ...distributeForm, items: [{ ...distributeForm.items[0], quantity: e.target.value }] })}
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-orange-500"
                      placeholder="e.g., 5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Unit</label>
                    <select
                      value={distributeForm.items[0]?.unit || 'L'}
                      onChange={e => setDistributeForm({ ...distributeForm, items: [{ ...distributeForm.items[0], unit: e.target.value }] })}
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-orange-500"
                    >
                      {(companySettings?.inventoryUnits || ['L', 'ML', 'KG', 'G']).map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Bottles</label>
                    <input
                      type="number"
                      value={distributeForm.items[0]?.bottles || ''}
                      onChange={e => setDistributeForm({ ...distributeForm, items: [{ ...distributeForm.items[0], bottles: e.target.value }] })}
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-orange-500"
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Notes (Optional)</label>
                  <textarea
                    value={distributeForm.notes}
                    onChange={e => setDistributeForm({ ...distributeForm, notes: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none resize-none focus:border-orange-500"
                    rows="2"
                    placeholder="Distribution notes..."
                  />
                </div>

                <button type="submit" className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-orange-700 flex items-center justify-center gap-2">
                  <Send size={18} /> Distribute Stock
                </button>
              </form>
            </SectionCard>

            {/* Distribution History */}
            <SectionCard title="Distribution History" icon={History} headerBg="bg-gradient-to-r from-slate-600 to-slate-500">
              {distributions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Employee</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distributions.slice(0, 10).map(dist => (
                        <tr key={dist._id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4">{new Date(dist.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-medium">{dist.employeeId?.name || 'Unknown'}</td>
                          <td className="py-3 px-4 text-right font-bold">{dist.totalQuantity} L</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Send size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">No distributions yet</p>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <SectionCard title="Transaction History" icon={History} headerBg="bg-gradient-to-r from-slate-600 to-slate-500">
              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Chemical</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">Qty</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 20).map(tx => (
                        <tr key={tx._id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4">{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <Badge variant={
                              tx.txnType === 'PURCHASE' ? 'success' :
                                tx.txnType === 'TRANSFER_TO_BRANCH' ? 'info' :
                                  tx.txnType === 'USAGE' ? 'danger' :
                                    tx.txnType === 'RETURN' ? 'warning' : 'default'
                            }>
                              {tx.txnType || tx.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-medium">{tx.chemicalId?.name || 'N/A'}</td>
                          <td className="py-3 px-4 text-right font-bold">{tx.displayQuantity || tx.quantity} {tx.displayUnit || tx.unit || ''}</td>
                          <td className="py-3 px-4 text-xs text-slate-500 truncate max-w-[150px]">{tx.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <History size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">No transactions yet</p>
                </div>
              )}
            </SectionCard>
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
                                  (req.txnType === 'BRANCH_TO_EMPLOYEE' && String(user._id) === String(req.toId?._id || req.toId)) ? (
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                    <div className="bg-emerald-50 p-3 md:p-4 rounded-xl text-center border border-emerald-100">
                      <p className="text-[10px] md:text-xs text-emerald-600 font-medium uppercase">Items</p>
                      <p className="text-2xl md:text-3xl font-black text-emerald-700">{myWallet.totalItems}</p>
                    </div>
                    {isAdmin && (
                      <div className="bg-blue-50 p-3 md:p-4 rounded-xl text-center border border-blue-100">
                        <p className="text-[10px] md:text-xs text-blue-600 font-medium uppercase">Value</p>
                        <p className="text-xl md:text-2xl font-black text-blue-700 truncate">{formatCurrency(myWallet.totalValue)}</p>
                      </div>
                    )}
                    <div className="bg-amber-50 p-3 md:p-4 rounded-xl text-center border border-amber-100 col-span-2 md:col-span-1">
                      <p className="text-[10px] md:text-xs text-amber-600 font-medium uppercase">Used</p>
                      <p className="text-2xl md:text-3xl font-black text-amber-700">{myWallet.items?.reduce((sum, i) => sum + (i.usedQuantity || 0), 0)} L</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {myWallet.items?.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-slate-50 rounded-xl border border-slate-100 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 md:p-3 bg-emerald-100 rounded-xl">
                            <Beaker size={16} className="md:w-5 md:h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm md:text-base">{item.chemicalName}</p>
                            {isAdmin && <p className="text-[10px] md:text-xs text-slate-500">Rate: {formatCurrency(item.transferRate)}/{item.displayUnit}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl md:text-2xl font-black text-emerald-600">{item.displayQuantity} <span className="text-sm font-medium text-slate-500">{item.displayUnit}</span></p>
                          <p className="text-[10px] md:text-xs text-slate-500">Used: {item.usedQuantity || 0} {item.displayUnit}</p>
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

        {activeTab === 'my-stock' && (user.role === 'technician' || user.role === 'sales') && (
          <div className="space-y-6">
            {/* Pending Requests for Employee */}
            <SectionCard title="Stock Requests" icon={Clock} headerBg="bg-gradient-to-r from-amber-600 to-amber-500">
              {distributions.filter(d => d.status === 'PENDING' && d.employeeId?._id === user._id).length > 0 ? (
                <div className="space-y-3">
                  {distributions.filter(d => d.status === 'PENDING' && d.employeeId?._id === user._id).map((req, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-slate-800">From: {req.fromUserId?.name || 'Branch'}</p>
                          <p className="text-xs text-slate-500">{req.items?.length} items • {req.totalQuantity}L</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveDistribution(req._id)} className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold">Accept</button>
                          <button onClick={() => handleRejectRequest(req._id)} className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-bold">Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 py-4">No pending requests</p>
              )}
            </SectionCard>

            <SectionCard title="My Chemical Stock" icon={Package} headerBg="bg-gradient-to-r from-blue-600 to-blue-500">
              {employeeInventory.length > 0 ? (
                <>
                  <div className="flex justify-end mb-4">
                    <button onClick={() => setShowSendModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                      <Send size={12} /> Send to Colleague
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                    <div className="bg-blue-50 p-3 md:p-4 rounded-xl text-center border border-blue-100">
                      <p className="text-[10px] md:text-xs text-blue-600 font-medium uppercase">Items</p>
                      <p className="text-2xl md:text-3xl font-black text-blue-700">{employeeInventory.length}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 md:p-4 rounded-xl text-center border border-emerald-100">
                      <p className="text-[10px] md:text-xs text-emerald-600 font-medium uppercase">Total Qty</p>
                      <p className="text-xl md:text-2xl font-black text-emerald-700">
                        {(employeeInventory || []).reduce((sum, i) => sum + i.currentStock, 0)} L
                      </p>
                    </div>
                    <div className="bg-amber-50 p-3 md:p-4 rounded-xl text-center border border-amber-100 col-span-2 md:col-span-1">
                      <p className="text-[10px] md:text-xs text-amber-600 font-medium uppercase">Bottles</p>
                      <p className="text-xl md:text-2xl font-black text-amber-700">
                        {(employeeInventory || []).reduce((sum, i) => sum + (i.bottles || 0), 0)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(employeeInventory || []).map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-slate-50 rounded-xl border border-slate-100 gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 md:p-3 bg-blue-100 rounded-xl">
                            <Beaker size={16} className="md:w-5 md:h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm md:text-base">{item.chemicalName}</p>
                            <p className="text-[10px] md:text-xs text-slate-500">{item.category} • {item.unit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl md:text-2xl font-black text-blue-600">{item.currentStock} <span className="text-sm font-medium text-slate-500">{item.unit}</span></p>
                          <p className="text-[10px] md:text-xs text-slate-500">
                            {item.bottles > 0 && <span className="text-orange-600 font-medium">Bottles: {item.bottles}</span>}
                            {(item.bottles > 0) && ' • '}
                            Rec: {item.totalReceived} | Ret: {item.totalReturned || 0}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Package size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No chemicals assigned to you yet</p>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Record Usage / Return" icon={Clock} headerBg="bg-gradient-to-r from-amber-600 to-amber-500">
              <form onSubmit={handleEmployeeUsage} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Chemical *</label>
                  <select
                    required
                    value={employeeUsageForm.chemicalId}
                    onChange={e => setEmployeeUsageForm({ ...employeeUsageForm, chemicalId: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none"
                  >
                    <option value="">Select from your stock</option>
                    {(employeeInventory || []).map(item => (
                      <option key={item.chemicalId} value={item.chemicalId}>
                        {item.chemicalName} (Available: {item.currentStock} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Quantity *</label>
                    <input
                      type="number"
                      required
                      value={employeeUsageForm.quantity}
                      onChange={e => setEmployeeUsageForm({ ...employeeUsageForm, quantity: e.target.value })}
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none"
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Unit</label>
                    <select
                      value={employeeUsageForm.unit}
                      onChange={e => setEmployeeUsageForm({ ...employeeUsageForm, unit: e.target.value })}
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none"
                    >
                      <option value="ML">Milliliters (ML)</option>
                      <option value="L">Liters (L)</option>
                      <option value="KG">Kilograms (KG)</option>
                      <option value="G">Grams (G)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="usageType"
                        checked={!employeeUsageForm.isReturned}
                        onChange={() => setEmployeeUsageForm({ ...employeeUsageForm, isReturned: false })}
                        className="w-4 h-4 text-red-600"
                      />
                      <span className="text-sm font-medium text-slate-700">Use for Job</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="usageType"
                        checked={employeeUsageForm.isReturned}
                        onChange={() => setEmployeeUsageForm({ ...employeeUsageForm, isReturned: true })}
                        className="w-4 h-4 text-emerald-600"
                      />
                      <span className="text-sm font-medium text-slate-700">Return Stock</span>
                    </label>
                  </div>
                </div>

                {employeeUsageForm.isReturned && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Return To</label>
                    <select
                      value={employeeUsageForm.returnTo}
                      onChange={e => setEmployeeUsageForm({ ...employeeUsageForm, returnTo: e.target.value })}
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none"
                    >
                      <option value="Branch">My Branch</option>
                      <option value="HQ">Headquarters (HQ)</option>
                    </select>
                  </div>
                )}

                {!employeeUsageForm.isReturned && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Job ID (Optional)</label>
                      <input
                        type="text"
                        value={employeeUsageForm.jobId}
                        onChange={e => setEmployeeUsageForm({ ...employeeUsageForm, jobId: e.target.value })}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none"
                        placeholder="Job ID"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Job Name (Optional)</label>
                      <input
                        type="text"
                        value={employeeUsageForm.jobName}
                        onChange={e => setEmployeeUsageForm({ ...employeeUsageForm, jobName: e.target.value })}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none"
                        placeholder="Job Name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Notes</label>
                  <textarea
                    value={employeeUsageForm.notes}
                    onChange={e => setEmployeeUsageForm({ ...employeeUsageForm, notes: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none resize-none"
                    rows="2"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg transition-all ${employeeUsageForm.isReturned
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-red-500/30'
                    }`}
                >
                  {employeeUsageForm.isReturned ? <RotateCcw size={18} className="inline mr-2" /> : <AlertCircle size={18} className="inline mr-2" />}
                  {employeeUsageForm.isReturned ? 'Return Stock' : 'Use for Job'}
                </button>
              </form>
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
                    <select required value={usageForm.chemicalId} onChange={e => setUsageForm({ ...usageForm, chemicalId: e.target.value })}
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
                      <input type="number" required value={usageForm.quantity} onChange={e => setUsageForm({ ...usageForm, quantity: e.target.value })}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none" placeholder="150" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Unit</label>
                      <select value={usageForm.unit} onChange={e => setUsageForm({ ...usageForm, unit: e.target.value })}
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
                      <input value={usageForm.jobId} onChange={e => setUsageForm({ ...usageForm, jobId: e.target.value })}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none" placeholder="JOB-001" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Job Name (Optional)</label>
                      <input value={usageForm.jobName} onChange={e => setUsageForm({ ...usageForm, jobName: e.target.value })}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none" placeholder="Pest Control" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <input
                      type="checkbox"
                      id="isReturned"
                      checked={usageForm.isReturned}
                      onChange={e => setUsageForm({ ...usageForm, isReturned: e.target.checked })}
                      className="w-5 h-5 accent-amber-500"
                    />
                    <label htmlFor="isReturned" className="text-sm font-semibold text-slate-700 cursor-pointer">
                      Return unused stock
                    </label>
                  </div>

                  {usageForm.isReturned && (
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Return To</label>
                      <select value={usageForm.returnTo} onChange={e => setUsageForm({ ...usageForm, returnTo: e.target.value })}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none">
                        <option value="Branch">My Branch</option>
                        <option value="HQ">Headquarters (Super Admin)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Notes</label>
                    <textarea value={usageForm.notes} onChange={e => setUsageForm({ ...usageForm, notes: e.target.value })}
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none resize-none" rows="2" />
                  </div>

                  <button type="submit" className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg transition-all ${usageForm.isReturned
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
                  <select required value={payment.branchId} onChange={e => setPayment({ ...payment, branchId: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none">
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b._id} value={b._id}>{b.branchName}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Amount (₹) *</label>
                  <input type="number" required value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none" placeholder="10000" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Payment Method</label>
                  <select value={payment.paymentMethod} onChange={e => setPayment({ ...payment, paymentMethod: e.target.value })}
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
                  <input value={payment.transactionId} onChange={e => setPayment({ ...payment, transactionId: e.target.value })}
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none" placeholder="UPI123456" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Notes</label>
                  <textarea value={payment.notes} onChange={e => setPayment({ ...payment, notes: e.target.value })}
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-linear-to-br from-red-600 to-red-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} className="md:w-4 md:h-4" />
                  <span className="text-[9px] md:text-[10px] font-semibold uppercase opacity-80 truncate">Pending HQ</span>
                </div>
                <p className="text-lg md:text-2xl font-black truncate">{formatCurrency(myBalance?.pendingBalance || 0)}</p>
                <p className="text-[9px] md:text-[10px] opacity-60 mt-1 hidden sm:block">Pay to Super Admin</p>
              </div>
              <div className="bg-linear-to-br from-emerald-600 to-emerald-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={14} className="md:w-4 md:h-4" />
                  <span className="text-[9px] md:text-[10px] font-semibold uppercase opacity-80 truncate">Paid HQ</span>
                </div>
                <p className="text-lg md:text-2xl font-black truncate">{formatCurrency(myBalance?.totalPaid || 0)}</p>
                <p className="text-[9px] md:text-[10px] opacity-60 mt-1 hidden sm:block">Total paid so far</p>
              </div>
              <div className="bg-linear-to-br from-blue-600 to-blue-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee size={14} className="md:w-4 md:h-4" />
                  <span className="text-[9px] md:text-[10px] font-semibold uppercase opacity-80 truncate">Collections</span>
                </div>
                <p className="text-lg md:text-2xl font-black truncate">{formatCurrency(collections || 0)}</p>
                <p className="text-[9px] md:text-[10px] opacity-60 mt-1 hidden sm:block">From receipts</p>
              </div>
              <div className="bg-linear-to-br from-amber-600 to-amber-700 p-4 md:p-5 rounded-2xl text-white shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="md:w-4 md:h-4" />
                  <span className="text-[9px] md:text-[10px] font-semibold uppercase opacity-80 truncate">Net Balance</span>
                </div>
                <p className="text-lg md:text-2xl font-black truncate">{formatCurrency((collections || 0) - (totalExpensesSum || 0) - (myBalance?.pendingBalance || 0))}</p>
                <p className="text-[9px] md:text-[10px] opacity-60 mt-1 hidden sm:block">Coll. - Exp. - Pend.</p>
              </div>
            </div>

            {/* Create Purchase Request */}
            <div className="max-w-2xl mx-auto">
              <SectionCard title="Request Chemicals from HQ" icon={ShoppingCart} headerBg="bg-gradient-to-r from-blue-600 to-blue-500">
                <form onSubmit={handleCreatePurchaseRequest} className="space-y-4">
                  {requestItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5 sm:col-span-6">
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Chemical</label>
                        <select value={item.chemicalId} onChange={e => {
                          const newItems = [...requestItems];
                          newItems[idx].chemicalId = e.target.value;
                          setRequestItems(newItems);
                        }} className="w-full bg-white border border-slate-200 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm">
                          <option value="">Select</option>
                          {chemicals.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Qty</label>
                        <input type="number" value={item.quantity} onChange={e => {
                          const newItems = [...requestItems];
                          newItems[idx].quantity = e.target.value;
                          setRequestItems(newItems);
                        }} className="w-full bg-white border border-slate-200 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm" placeholder="100" />
                      </div>
                      <div className="col-span-2">
                        <select value={item.unit} onChange={e => {
                          const newItems = [...requestItems];
                          newItems[idx].unit = e.target.value;
                          setRequestItems(newItems);
                        }} className="w-full bg-white border border-slate-200 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm">
                          <option value="L">L</option>
                          <option value="ML">ML</option>
                          <option value="KG">KG</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        {requestItems.length > 1 && (
                          <button type="button" onClick={() => setRequestItems(requestItems.filter((_, i) => i !== idx))} className="w-full py-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={14} className="mx-auto" />
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
                    {(Array.isArray(purchaseRequests) ? purchaseRequests : []).map(req => (
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
                    {(Array.isArray(purchaseRequests) ? purchaseRequests : []).length === 0 && (
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
                  {(Array.isArray(purchaseRequests) ? purchaseRequests : []).map(req => (
                    <tr key={req._id} className="border-b">
                      <td className="py-3 px-4 font-bold">{req.requestNo}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold">{req.branchId?.branchName}</p>
                        <p className="text-xs text-slate-500">{req.requestedBy?.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        {(req.items || []).map((item, i) => (
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
                  {(Array.isArray(purchaseRequests) ? purchaseRequests : []).length === 0 && (
                    <tr><td colSpan="6" className="py-8 text-center text-slate-400">No requests yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">New HQ Purchase</h3>
              <button onClick={() => setShowPurchaseModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Toggle between Chemical Form and Purchase Form */}
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowNewChemicalForm(false)}
                className={`px-4 py-2 rounded-lg font-semibold ${!showNewChemicalForm ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Existing Chemical
              </button>
              <button
                type="button"
                onClick={() => setShowNewChemicalForm(true)}
                className={`px-4 py-2 rounded-lg font-semibold ${showNewChemicalForm ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                New Chemical
              </button>
            </div>

            {/* New Chemical Registration Form */}
            {showNewChemicalForm ? (
              <form onSubmit={handleAddNewChemical} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Chemical Name *</label>
                    <input type="text" required value={newChemical.name} onChange={e => setNewChemical({ ...newChemical, name: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="e.g., Cockroach Killer" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
                    <select required value={newChemical.category} onChange={e => setNewChemical({ ...newChemical, category: e.target.value })} className="w-full p-3 border rounded-lg">
                      <option value="Insecticide">Insecticide</option>
                      <option value="Rodenticide">Rodenticide</option>
                      <option value="Herbicide">Herbicide</option>
                      <option value="Fungicide">Fungicide</option>
                      <option value="Termiticide">Termiticide</option>
                      <option value="Larvicide">Larvicide</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Unit *</label>
                    <select required value={newChemical.unitSystem} onChange={e => setNewChemical({ ...newChemical, unitSystem: e.target.value })} className="w-full p-3 border rounded-lg">
                      <option value="L">Liters (L)</option>
                      <option value="ML">ML</option>
                      <option value="KG">KG</option>
                      <option value="G">Grams (G)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Stock Qty</label>
                    <input type="number" value={newChemical.mainStock} onChange={e => setNewChemical({ ...newChemical, mainStock: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Rate (₹) *</label>
                    <input type="number" required value={newChemical.purchasePrice} onChange={e => setNewChemical({ ...newChemical, purchasePrice: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Bottles</label>
                    <input type="number" value={newChemical.bottles || ''} onChange={e => setNewChemical({ ...newChemical, bottles: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                  <textarea value={newChemical.description} onChange={e => setNewChemical({ ...newChemical, description: e.target.value })} className="w-full p-3 border rounded-lg" rows="2" placeholder="Chemical description..." />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold disabled:opacity-50">
                  {loading ? 'Registering...' : 'Register Chemical'}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Supplier Name</label>
                    <input type="text" value={purchaseForm.supplierName} onChange={e => setPurchaseForm({ ...purchaseForm, supplierName: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="Enter supplier name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Invoice No</label>
                    <input type="text" value={purchaseForm.invoiceNo} onChange={e => setPurchaseForm({ ...purchaseForm, invoiceNo: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="Invoice number" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Items</label>
                  {purchaseForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <select value={item.chemicalId} onChange={e => {
                        const newItems = [...purchaseForm.items];
                        newItems[idx].chemicalId = e.target.value;
                        setPurchaseForm({ ...purchaseForm, items: newItems });
                      }} className="flex-1 p-2 border rounded-lg">
                        <option value="">Select Chemical</option>
                        {chemicals.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                      <input type="number" value={item.quantity} onChange={e => {
                        const newItems = [...purchaseForm.items];
                        newItems[idx].quantity = e.target.value;
                        setPurchaseForm({ ...purchaseForm, items: newItems });
                      }} className="w-16 p-2 border rounded-lg" placeholder="Qty" />
                      <select value={item.unit || 'L'} onChange={e => {
                        const newItems = [...purchaseForm.items];
                        newItems[idx].unit = e.target.value;
                        setPurchaseForm({ ...purchaseForm, items: newItems });
                      }} className="w-16 p-2 border rounded-lg">
                        {(companySettings?.inventoryUnits || ['L', 'ML', 'KG', 'G']).map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <input type="number" value={item.bottles || ''} onChange={e => {
                        const newItems = [...purchaseForm.items];
                        newItems[idx].bottles = e.target.value;
                        setPurchaseForm({ ...purchaseForm, items: newItems });
                      }} className="w-16 p-2 border rounded-lg" placeholder="Btls" />
                      <input type="number" value={item.rate} onChange={e => {
                        const newItems = [...purchaseForm.items];
                        newItems[idx].rate = e.target.value;
                        setPurchaseForm({ ...purchaseForm, items: newItems });
                      }} className="w-24 p-2 border rounded-lg" placeholder="Rate" />
                      <button type="button" onClick={() => setPurchaseForm({ ...purchaseForm, items: purchaseForm.items.filter((_, i) => i !== idx) })} className="text-red-500 p-2">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setPurchaseForm({ ...purchaseForm, items: [...purchaseForm.items, { chemicalId: '', quantity: '', unit: 'L', bottles: '', rate: '' }] })} className="text-blue-600 text-sm font-semibold">+ Add Item</button>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? 'Saving...' : 'Save Purchase'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Transfer to Branch</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Branch</label>
                <select value={transferForm.branchId} onChange={e => setTransferForm({ ...transferForm, branchId: e.target.value })} className="w-full p-3 border rounded-lg">
                  <option value="">Select Branch</option>
                  {branches?.map(b => <option key={b._id} value={b._id}>{b.branchName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Items</label>
                {transferForm.items.map((item, idx) => {
                  const selectedChem = chemicals.find(c => c._id === item.chemicalId);
                  return (
                    <div key={idx} className="flex flex-wrap gap-2 mb-2">
                      <select value={item.chemicalId} onChange={e => {
                        const newItems = [...transferForm.items];
                        newItems[idx].chemicalId = e.target.value;
                        setTransferForm({ ...transferForm, items: newItems });
                      }} className="flex-1 p-2 border rounded-lg min-w-[150px]">
                        <option value="">Select Chemical</option>
                        {chemicals.filter(c => (c.mainStock || 0) > 0).map(c => <option key={c._id} value={c._id}>{c.name} (Stock: {c.mainStock} {c.unitSystem || 'L'})</option>)}
                      </select>
                      <input type="number" value={item.quantity} onChange={e => {
                        const newItems = [...transferForm.items];
                        newItems[idx].quantity = e.target.value;
                        setTransferForm({ ...transferForm, items: newItems });
                      }} className="w-20 p-2 border rounded-lg" placeholder="Qty" />
                      <input type="number" value={item.bottles || ''} onChange={e => {
                        const newItems = [...transferForm.items];
                        newItems[idx].bottles = e.target.value;
                        setTransferForm({ ...transferForm, items: newItems });
                      }} className="w-16 p-2 border rounded-lg" placeholder="Btls" />
                      <select value={item.unit || 'L'} onChange={e => {
                        const newItems = [...transferForm.items];
                        newItems[idx].unit = e.target.value;
                        setTransferForm({ ...transferForm, items: newItems });
                      }} className="w-16 p-2 border rounded-lg">
                        {(companySettings?.inventoryUnits || ['L', 'ML', 'KG', 'G']).map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <select value={item.bottleSize || ''} onChange={e => {
                        const newItems = [...transferForm.items];
                        newItems[idx].bottleSize = e.target.value;
                        setTransferForm({ ...transferForm, items: newItems });
                      }} className="w-20 p-2 border rounded-lg">
                        <option value="">Size</option>
                        <option value="500ml">500ml</option>
                        <option value="1L">1L</option>
                        <option value="5L">5L</option>
                      </select>
                      <button type="button" onClick={() => setTransferForm({ ...transferForm, items: transferForm.items.filter((_, i) => i !== idx) })} className="text-red-500 p-2">✕</button>
                    </div>
                  )
                })}
                <button type="button" onClick={() => setTransferForm({ ...transferForm, items: [...transferForm.items, { chemicalId: '', quantity: '', unit: 'L', bottles: '', bottleSize: '' }] })} className="text-blue-600 text-sm font-semibold">+ Add Item</button>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                <textarea value={transferForm.notes} onChange={e => setTransferForm({ ...transferForm, notes: e.target.value })} className="w-full p-3 border rounded-lg" rows="2" placeholder="Optional notes"></textarea>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Creating...' : 'Create Transfer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Distribute Modal */}
      {showDistributeModal && user.role === 'branch_admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Distribute to Employee</h3>
              <button onClick={() => setShowDistributeModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleDistributeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Employee</label>
                <select value={distributeForm.employeeId} onChange={e => setDistributeForm({ ...distributeForm, employeeId: e.target.value })} className="w-full p-3 border rounded-lg">
                  <option value="">Select Employee</option>
                  {employeesQuery?.data?.filter(e => e.role === 'technician' || e.role === 'sales').map(e => <option key={e._id} value={e._id}>{e.name} - {e.employeeId}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Items (from your branch stock)</label>
                {distributeForm.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select value={item.chemicalId} onChange={e => {
                      const newItems = [...distributeForm.items];
                      newItems[idx].chemicalId = e.target.value;
                      setDistributeForm({ ...distributeForm, items: newItems });
                    }} className="flex-1 p-2 border rounded-lg">
                      <option value="">Select Chemical</option>
                      {inventory.filter(i => (i.quantity || 0) > 0).map(i => <option key={i._id} value={i.chemicalId?._id}>{i.chemicalId?.name} (Stock: {i.quantity})</option>)}
                    </select>
                    <input type="number" value={item.quantity} onChange={e => {
                      const newItems = [...distributeForm.items];
                      newItems[idx].quantity = e.target.value;
                      setDistributeForm({ ...distributeForm, items: newItems });
                    }} className="w-24 p-2 border rounded-lg" placeholder="Qty" />
                    <button type="button" onClick={() => setDistributeForm({ ...distributeForm, items: distributeForm.items.filter((_, i) => i !== idx) })} className="text-red-500 p-2">✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => setDistributeForm({ ...distributeForm, items: [...distributeForm.items, { chemicalId: '', quantity: '', unit: 'L' }] })} className="text-blue-600 text-sm font-semibold">+ Add Item</button>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Distributing...' : 'Distribute Stock'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Send to Colleague Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-bold text-lg mb-4">Send to Colleague</h3>
            <form onSubmit={handleSendToColleague} className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-1">Select Colleague *</label>
                <select value={sendForm.employeeId} onChange={e => setSendForm({ ...sendForm, employeeId: e.target.value })} className="w-full p-2 border rounded-lg" required>
                  <option value="">Select colleague</option>
                  {(Array.isArray(branchUsers) ? branchUsers : []).filter(u => u._id !== user._id).map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Chemical *</label>
                <select value={sendForm.chemicalId} onChange={e => setSendForm({ ...sendForm, chemicalId: e.target.value })} className="w-full p-2 border rounded-lg" required>
                  <option value="">Select chemical</option>
                  {(employeeInventory || []).map(inv => (
                    <option key={inv._id} value={inv.chemicalId?._id}>{inv.chemicalName} ({inv.currentStock} {inv.unit})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-1">Quantity *</label>
                  <input type="number" value={sendForm.quantity} onChange={e => setSendForm({ ...sendForm, quantity: e.target.value })} className="w-full p-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Unit</label>
                  <select value={sendForm.unit} onChange={e => setSendForm({ ...sendForm, unit: e.target.value })} className="w-full p-2 border rounded-lg">
                    <option value="ML">ML</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-1">Bottles</label>
                  <input type="number" value={sendForm.bottles} onChange={e => setSendForm({ ...sendForm, bottles: e.target.value })} className="w-full p-2 border rounded-lg" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Bottle Size</label>
                  <select value={sendForm.bottleSize} onChange={e => setSendForm({ ...sendForm, bottleSize: e.target.value })} className="w-full p-2 border rounded-lg">
                    <option value="">Select</option>
                    <option value="500ml">500ml</option>
                    <option value="1L">1L</option>
                    <option value="5L">5L</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowSendModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.open && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          danger={confirmDialog.danger}
          isLoading={confirmDialog.isLoading}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        />
      )}
    </div>
  );
};

export default Inventory;
