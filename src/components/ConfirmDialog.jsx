import { AlertCircle } from 'lucide-react';

const ConfirmDialog = ({ title, message, onConfirm, onCancel, danger = false, isLoading = false }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onCancel} />
    <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-150">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
        <AlertCircle size={24} className={danger ? 'text-red-500' : 'text-amber-500'} />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-5 leading-relaxed">{message}</p>
      <div className="flex gap-2">
        <button 
          onClick={onCancel} 
          disabled={isLoading}
          className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          onClick={onConfirm} 
          disabled={isLoading}
          className={`flex-1 py-2.5 font-semibold text-sm rounded-xl text-white disabled:opacity-50 ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-900 hover:bg-black'}`}
        >
          {isLoading ? 'Processing...' : 'Confirm'}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmDialog;
