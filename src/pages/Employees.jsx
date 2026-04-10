import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Users, Plus, Search, MapPin, Mail, Phone, ShieldCheck, Contact, Key, Image as ImageIcon, Edit3, X, AlertCircle, Trash2, Lock } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';

const fetchEmployees = async () => (await api.get('/employees')).data.data;
const fetchBranches = async () => (await api.get('/branches')).data.data;

const Employees = () => {
  const { user } = useSelector(state => state.auth);
  const isAdmin = user?.role === 'super_admin' || user?.role === 'branch_admin';
  const queryClient = useQueryClient();
  const { data: employees, isLoading } = useQuery({ 
    queryKey: ['employees'], 
    queryFn: fetchEmployees,
  });
  const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: fetchBranches, enabled: isAdmin });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [targetEmployee, setTargetEmployee] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, danger: false, isLoading: false });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'technician',
    branchId: '',
    profileImage: null
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      // Strict string cleanup for branchId to prevent [object Object] leakage
      const sanitizedData = { ...data };
      if (sanitizedData.branchId && typeof sanitizedData.branchId === 'object') {
        sanitizedData.branchId = sanitizedData.branchId._id || sanitizedData.branchId.toString();
      }

      const formPayload = new FormData();
      Object.keys(sanitizedData).forEach(key => {
        if(key === 'profileImage' && sanitizedData[key]) {
          formPayload.append('profileImage', sanitizedData[key]);
        } else {
          formPayload.append(key, sanitizedData[key]);
        }
      });
      // Smart routing: if ID exists, perform PUT update; otherwise POST new
      if (sanitizedData._id) {
        return api.put(`/employees/${sanitizedData._id}`, formPayload, { headers: { 'Content-Type': 'multipart/form-data' }});
      }
      return api.post('/employees', formPayload, { headers: { 'Content-Type': 'multipart/form-data' }});
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['stats']);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'technician', branchId: '', profileImage: null });
      setTargetEmployee(null);
      toast.success('Technician Archive Updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Archival logic violation');
    }
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, newPassword }) => api.post(`/employees/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      toast.success('Access Credentials Overridden');
      setResetModalOpen(false);
      setTargetEmployee(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Protocol Failure: Security Breach Blocked');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/employees/${id}`),
    onSuccess: (res, id) => {
      queryClient.setQueryData(['employees'], (oldData) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter(emp => emp._id !== id)
        };
      });
      if (res.data?.deactivated) {
        toast.success('Employee deactivated (has job history)');
      } else {
        toast.success('Employee deleted successfully');
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed')
  });

  const handleDelete = (emp) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Employee',
      message: `Are you sure you want to delete ${emp.name}? This action cannot be undone.`,
      danger: true,
      isLoading: false,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        deleteMutation.mutate(emp._id);
        setConfirmDialog(prev => ({ ...prev, open: false, isLoading: false }));
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const getRoleStyle = (role) => {
    switch(role) {
      case 'super_admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'branch_admin': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'technician': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'sales': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <Users className="w-8 h-8 text-brand-600" /> Human Resource Registry
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 italic">Access Restricted</p>
          </div>
        </div>
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center">
           <div className="p-4 bg-slate-100 rounded-full mb-4">
              <Lock size={48} className="text-slate-400" />
           </div>
           <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2">Authorization Required</h2>
           <p className="text-sm text-slate-500 font-medium">This module is restricted to Branch Admin and Super Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 relative z-10 pb-24 font-sans">
      
      {/* Refined Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <Users className="w-8 h-8 text-brand-600" /> Human Resource Registry
          </h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 italic">Authorized Personnel Asset Management</p>
        </div>
        
        <button 
           onClick={() => { setFormData({ name: '', email: '', phone: '', password: '', role: 'technician', branchId: '', profileImage: null }); setTargetEmployee(null); setIsModalOpen(true); }} 
           className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transform hover:bg-black active:scale-95 transition-all flex items-center gap-3 border-b-4 border-slate-700"
        >
          <Plus size={16} /> Provision New Personnel
        </button>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
         {isLoading ? (
           [1, 2, 3].map(i => (
             <div key={i} className="bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 md:p-8 border-2 border-slate-100 shadow-none animate-pulse h-48 sm:h-56 md:h-60"></div>
           ))
         ) : employees?.length > 0 ? (
           employees.map(emp => (
             <div key={emp._id} className="bg-white rounded-xl sm:rounded-[2rem] p-4 sm:p-6 md:p-8 border-2 border-slate-100 hover:border-slate-900 hover:bg-slate-50 transition-all group relative overflow-hidden flex flex-col justify-between">
                
                <div className="flex items-start gap-3 sm:gap-4 relative z-10">
                   <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 border-b-2 sm:border-b-4 border-slate-700">
                     <span className="text-base sm:text-lg md:text-xl font-black uppercase tracking-tighter">{emp.name.charAt(0)}</span>
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-900 uppercase tracking-tighter truncate">{emp.name}</h3>
                     <span className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg border-2 mt-1 sm:mt-2 ${getRoleStyle(emp.role)}`}>
                       <ShieldCheck size={10} className="sm:w-3 sm:h-3 md:w-4 md:h-4" /> {emp.role.replace('_', ' ')}
                     </span>
                   </div>
                   <div className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-widest shrink-0 ${emp.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                     {emp.isActive ? 'ON' : 'OFF'}
                   </div>
                </div>

                <div className="space-y-2 sm:space-y-3 md:space-y-4 relative z-10 mt-4 sm:mt-6 md:mt-8 pt-3 sm:pt-6 md:pt-8 border-t-2 border-slate-100 border-dashed">
                   <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-1 sm:gap-2"><Contact size={10} className="sm:w-3 sm:h-3 md:w-4 md:h-4" /> ID</div>
                      <span className="text-slate-900 truncate ml-1">{emp.employeeId || 'ROOT'}</span>
                   </div>
                   <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-1 sm:gap-2"><Phone size={10} className="sm:w-3 sm:h-3 md:w-4 md:h-4" /> Phone</div>
                      <span className="text-slate-900">{emp.phone}</span>
                   </div>
                   <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-1 sm:gap-2"><MapPin size={10} className="sm:w-3 sm:h-3 md:w-4 md:h-4" /> Branch</div>
                      <span className="text-brand-600 italic truncate ml-1">
                         {emp.branchId ? (typeof emp.branchId === 'object' ? emp.branchId.branchName : emp.branchId) : 'HQ'}
                      </span>
                   </div>
                </div>
               
               <div className="flex items-center justify-end gap-1 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
                   <button 
                     onClick={() => { 
                        const cleanEmp = { ...emp };
                        if (cleanEmp.branchId && typeof cleanEmp.branchId === 'object') {
                           cleanEmp.branchId = cleanEmp.branchId._id;
                        }
                        setTargetEmployee(emp); 
                        setFormData(cleanEmp); 
                        setIsModalOpen(true); 
                     }} 
                     className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-2"
                   >
                      <Edit3 size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Edit</span>
                   </button>
                   <button 
                     onClick={() => { setTargetEmployee(emp); setResetModalOpen(true); }} 
                     className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-2"
                   >
                      <Key size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Reset</span>
                   </button>
                   <button 
                     onClick={() => handleDelete(emp)} 
                     className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-slate-100 hover:bg-red-600 hover:text-white text-slate-600 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-2"
                   >
                      <Trash2 size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Delete</span>
                   </button>
                </div>
             </div>
           ))
         ) : (
           <div className="col-span-full py-12 sm:py-16 md:py-20 text-center bg-white rounded-2xl sm:rounded-[2.5rem] border-2 border-dashed border-slate-100">
              <Users size={32} className="mx-auto text-slate-100 mb-2 sm:mb-4" />
              <p className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest">Personnel Database Empty</p>
           </div>
         )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
           
           <div className="bg-white rounded-2xl sm:rounded-[2.5rem] w-full max-w-lg max-h-[95vh] overflow-y-auto relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 border-2 border-slate-900">
              <div className="p-4 sm:p-6 md:p-8 border-b-2 border-slate-50 flex items-center justify-between">
                 <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-900 uppercase tracking-tighter">{formData._id ? 'Update Asset' : 'Provision Personnel'}</h3>
                 <button onClick={() => { setIsModalOpen(false); setFormData({ name: '', email: '', phone: '', password: '', role: 'technician', branchId: '', profileImage: null }); }} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900">
                    <X size={18} className="sm:w-5 sm:h-5" />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                 
                 <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5">
                       <Label>Full Authorized Name</Label>
                       <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm font-bold outline-none focus:border-slate-900 transition-all" placeholder="Ramesh Kumar" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                       <div className="space-y-1.5">
                          <Label>Official Email</Label>
                          <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm font-bold outline-none focus:border-slate-900 transition-all" placeholder="tech@safehome.com" />
                       </div>
                       <div className="space-y-1.5">
                          <Label>Primary Phone</Label>
                          <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm font-bold outline-none focus:border-slate-900 transition-all" placeholder="9876543210" />
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                       <Label>System Role</Label>
                       <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm font-bold outline-none focus:border-slate-900 transition-all">
                          <option value="technician">Technician</option>
                          <option value="sales">Sales Executive</option>
                          <option value="office">Office Staff</option>
                          <option value="branch_admin">Branch Admin</option>
                       </select>
                    </div>

                    <div className="space-y-1.5">
                       <Label>Deployment Branch</Label>
                       <select required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm font-bold outline-none focus:border-slate-900 transition-all">
                          <option value="" disabled>Select Branch</option>
                          {branches?.map(b => (
                            <option key={b._id} value={b._id}>{b.branchName} ({b.cityPrefix})</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 {!formData._id && (
                   <div className="space-y-1.5">
                      <Label>Initial Password</Label>
                      <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm font-bold outline-none focus:border-slate-900 transition-all" placeholder="••••••••" />
                   </div>
                 )}

                 <div className="pt-4 sm:pt-6 flex justify-end gap-2 sm:gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-slate-400 font-black text-[8px] sm:text-[9px] uppercase tracking-widest rounded-xl transition-colors">Abort</button>
                    <button disabled={mutation.isPending} type="submit" className="px-6 sm:px-8 py-2 sm:py-3 bg-slate-900 text-white rounded-xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest border-b-4 border-slate-700 active:scale-95 transition-all">
                       {mutation.isPending ? 'Processing...' : 'Provision'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Override Security Credentials Modal */}
      {resetModalOpen && targetEmployee && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setResetModalOpen(false)}></div>
           
           <div className="bg-white rounded-2xl sm:rounded-[2.5rem] w-full max-w-sm max-h-[95vh] overflow-y-auto relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 border-2 border-red-900">
              <div className="p-4 sm:p-6 md:p-8 bg-red-50/50 border-b-2 border-red-100">
                 <h3 className="text-sm sm:text-base md:text-lg font-black text-red-900 uppercase tracking-tighter flex items-center gap-2">
                    <Key className="w-5 h-5 sm:w-6 sm:h-6" /> Security Override
                 </h3>
                 <p className="text-[9px] sm:text-[10px] font-bold text-red-600 uppercase mt-1 sm:mt-2 tracking-widest italic">Target: {targetEmployee.name}</p>
              </div>

              <form onSubmit={e => {
                e.preventDefault();
                resetMutation.mutate({ id: targetEmployee._id, newPassword: e.target.newpass.value });
              }} className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                 <div className="space-y-1.5">
                    <Label className="text-red-900">New Password</Label>
                    <div className="relative">
                       <Key size={12} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-red-300" />
                       <input name="newpass" required minLength="6" type="password" className="w-full bg-red-50/20 border-2 border-red-50 p-3 sm:p-4 pl-10 sm:pl-12 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black outline-none focus:border-red-500 transition-all text-red-900 shadow-inner" placeholder="NEW P@SSW0RD" />
                    </div>
                    <div className="flex items-center gap-2 mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 rounded-xl border border-red-100">
                       <AlertCircle size={12} className="sm:w-3.5 sm:h-3.5 text-red-500 shrink-0" />
                       <p className="text-[7px] sm:text-[8px] font-bold text-red-700 uppercase leading-relaxed">Warning: This will override the personnel access protocol.</p>
                    </div>
                 </div>

                 <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <button type="button" onClick={() => setResetModalOpen(false)} className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-slate-400 font-black text-[8px] sm:text-[9px] uppercase tracking-widest rounded-xl">Cancel</button>
                    <button disabled={resetMutation.isPending} type="submit" className="px-6 sm:px-8 py-2 sm:py-3 bg-red-600 text-white rounded-xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest border-b-4 border-red-800 active:scale-95 transition-all shadow-lg shadow-red-500/20">
                       {resetMutation.isPending ? 'Processing...' : 'Authorize'}
                    </button>
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

const Label = ({ children, className = "" }) => (
  <label className={`text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 ${className}`}>{children}</label>
);

export default Employees;
