import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../lib/api';
import { Package, Plus, Send, ClipboardList, History, Beaker, User as UserIcon, Building2, AlertTriangle, ChevronRight, Activity, Calendar, ShieldCheck, Database, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const Inventory = () => {
  const { user } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('summary');
  const [chemicals, setChemicals] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchUsers, setBranchUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newChemical, setNewChemical] = useState({ name: '', unit: 'Liters', mainStock: 0 });
  const [assignment, setAssignment] = useState({ chemicalId: '', targetId: '', targetType: '', quantity: 0, notes: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [chemRes, invRes, transRes] = await Promise.all([
        api.get('/inventory/chemicals'), // Trailing slash for Express 5
        api.get('/inventory'),          // Explicit base call with trailing slash
        api.get('/inventory/transactions')
      ]);
      setChemicals(chemRes.data?.data || []);
      setInventory(invRes.data?.data || []);
      setTransactions(transRes.data?.data || []);

      if (user.role === 'super_admin') {
         const bRes = await api.get('/branches/');
         setBranches(bRes.data?.data || []);
      } else if (user.role === 'branch_admin' || user.role === 'office') {
         const uRes = await api.get('/employees/');
         setBranchUsers(uRes.data?.data || []);
      }
    } catch (error) {
       toast.error(error.response?.data?.message || 'Inventory Vault Sealed');
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
      await api.post('/inventory/chemicals/', newChemical);
      toast.success('Resource registered');
      setNewChemical({ name: '', unit: 'Liters', mainStock: 0 });
      fetchData();
    } catch (error) {
       toast.error(error.response?.data?.message || 'Conflict reported');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      if (!assignment.chemicalId || !assignment.targetId || !assignment.targetType) {
        return toast.error('Check required allocation parameters');
      }
      await api.post('/inventory/assign/', assignment);
      toast.success('Material allocated');
      setAssignment({ chemicalId: '', targetId: '', targetType: '', quantity: 0, notes: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Allocation threshold exceeded');
    }
  };

  if (loading && chemicals.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Beaker size={32} className="text-brand-500 animate-pulse" />
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Inventory Sync in progress...</p>
       </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-20">
      
      {/* Header Segment */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-slate-900 rounded-lg text-white"><Package size={18} /></div>
              <h1 className="text-xl md:text-2xl font-display font-black text-slate-900 tracking-tight uppercase">Chemical Repository</h1>
           </div>
           <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest ml-1 italic">Asset Operational Monitoring System</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-auto overflow-x-auto scrollbar-hide">
           {[ 
             { id: 'summary', icon: <Activity size={14} />, label: 'Ledger' },
             { id: 'stock', icon: <Plus size={14} />, label: 'Register' },
             { id: 'assign', icon: <Send size={14} />, label: 'Allocate' },
             { id: 'history', icon: <History size={14} />, label: 'Audit Log' }
           ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {tab.icon} {tab.label}
              </button>
           ))}
        </div>
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-10">
           {/* Section: Enterprise Stock */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-l-2 border-brand-500 pl-3">Centralized Enterprise Stock</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {chemicals.map((chem, idx) => (
                   <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 group hover:border-slate-900 transition-all relative overflow-hidden">
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px] mb-2">{chem.unit}</p>
                      <h4 className="text-sm font-black text-slate-900 mb-6 uppercase truncate">{chem.name}</h4>
                      <div className="flex items-end gap-2">
                         <span className="text-2xl font-display font-black text-slate-900 tracking-tight">{chem.mainStock}</span>
                         <span className="text-[9px] font-black text-emerald-600 mb-0.5">READY</span>
                      </div>
                   </div>
                ))}
              </div>
           </div>

           {/* Section: Distributed Inventory */}
           <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-l-2 border-amber-500 pl-3">Regional Activity Allocation</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inventory.map((inv, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 hover:border-slate-900 transition-colors group">
                     <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg ${inv.ownerType === 'Branch' ? 'bg-indigo-50 text-indigo-500' : 'bg-brand-50 text-brand-500'} group-hover:bg-slate-900 group-hover:text-white transition-all`}>
                           {inv.ownerType === 'Branch' ? <Building2 size={16} /> : <UserIcon size={16} />}
                        </div>
                        <div className="text-right">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{inv.ownerType}</p>
                           <p className="text-[10px] font-bold text-slate-900 uppercase">{inv.ownerName}</p>
                        </div>
                     </div>
                     <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic truncate">{inv.chemicalId?.name}</p>
                        <div className="flex items-end gap-2">
                           <span className="text-xl font-display font-black text-slate-900 tracking-tight">{inv.quantity}</span>
                           <span className="text-[9px] font-black text-slate-400 mb-0.5 uppercase">{inv.chemicalId?.unit}</span>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="max-w-md mx-auto">
           <form onSubmit={handleAddChemical} className="bg-white p-8 rounded-[2rem] border-2 border-slate-900 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.05),transparent)] space-y-6">
              <div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Resource Registration</h3>
                 <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Initialize material into global repository</p>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-2">Material Spec</label>
                    <input required value={newChemical.name} onChange={e => setNewChemical({...newChemical, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-bold text-xs outline-none transition-all" placeholder="Imidacloprid 17.8%" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-2">Unit</label>
                       <select value={newChemical.unit} onChange={e => setNewChemical({...newChemical, unit: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-bold text-xs outline-none">
                          <option>Liters</option><option>Kilograms</option><option>Pieces</option><option>Boxes</option>
                       </select>
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-2">Quantity</label>
                       <input type="number" value={newChemical.mainStock} onChange={e => setNewChemical({...newChemical, mainStock: Number(e.target.value)})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-bold text-xs outline-none transition-all" />
                    </div>
                 </div>
              </div>

              <button className="w-full py-4 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all border-b-4 border-slate-700 active:scale-95">
                 Synchronize Resource
              </button>
           </form>
        </div>
      )}

      {activeTab === 'assign' && (
        <div className="max-w-xl mx-auto">
           <form onSubmit={handleAssign} className="bg-white p-8 rounded-[2rem] border-2 border-slate-900 space-y-8">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-brand-600 text-white rounded-lg shadow-sm"><Send size={18} /></div>
                 <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Material Allocation</h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 italic">Transfer authority for operational use</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <div>
                       <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-2">Chemical</label>
                       <select value={assignment.chemicalId} onChange={e => setAssignment({...assignment, chemicalId: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-bold text-xs outline-none">
                          <option value="">Select Resource...</option>
                          {chemicals.map(c => <option key={c._id} value={c._id}>{c.name} ({c.mainStock} L)</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-2">Allocated Volume</label>
                       <input type="number" value={assignment.quantity} onChange={e => setAssignment({...assignment, quantity: Number(e.target.value)})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-bold text-xs outline-none transition-all" />
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <div>
                       <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-2">Audit Sector</label>
                       <select value={assignment.targetType} onChange={e => setAssignment({...assignment, targetType: e.target.value, targetId: ''})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-bold text-xs outline-none">
                          <option value="">Target...</option>
                          {user.role === 'super_admin' && <option value="Branch">Regional Hub</option>}
                           {(user.role === 'branch_admin' || user.role === 'office') && <option value="User">Field Technician</option>}
                       </select>
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-slate-800 uppercase tracking-widest block mb-2">Destination</label>
                       <select value={assignment.targetId} onChange={e => setAssignment({...assignment, targetId: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-brand-500 p-3 rounded-xl font-bold text-xs outline-none">
                          <option value="">Final Authority...</option>
                           {assignment.targetType === 'Branch' ? branches.map(b => <option key={b._id} value={b._id}>{b.branchName} ({b.branchCode})</option>) : branchUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                       </select>
                    </div>
                 </div>
              </div>

              <button className="w-full py-4 bg-brand-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl active:scale-95 transition-all flex items-center justify-center gap-3 border-b-6 border-slate-900 border-r-2 shadow-none">
                 Validate Personnel Transfer <ChevronRight size={14} />
              </button>
           </form>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
           <div className="p-6 border-b border-slate-50 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Resource Transaction Audit</h3>
              <History size={18} className="text-slate-300" />
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full">
                 <thead>
                    <tr className="bg-slate-900 text-white">
                       <th className="px-6 py-4 text-left text-[9px] uppercase tracking-widest font-black">Audit Stamp</th>
                       <th className="px-6 py-4 text-left text-[9px] uppercase tracking-widest font-black">Chemical</th>
                       <th className="px-6 py-4 text-left text-[9px] uppercase tracking-widest font-black">Volume</th>
                       <th className="px-6 py-4 text-left text-[9px] uppercase tracking-widest font-black">Authority</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {transactions.map((tr, idx) => (
                       <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                             <p className="text-[10px] font-black text-slate-900">{new Date(tr.createdAt).toLocaleDateString()}</p>
                             <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(tr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="px-6 py-4 font-black text-[10px] text-slate-800 uppercase truncate max-w-[150px]">{tr.chemicalId?.name}</td>
                          <td className="px-6 py-4 font-black text-[10px] text-slate-900">{tr.quantity} <span className="text-[8px] text-slate-400 font-bold">{tr.chemicalId?.unit}</span></td>
                          <td className="px-6 py-4">
                             <p className="text-[10px] font-black text-slate-700 uppercase">{tr.toName}</p>
                             <p className="text-[8px] text-slate-400 font-bold italic truncate max-w-[150px]">{tr.notes || 'Routine allocation'}</p>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
