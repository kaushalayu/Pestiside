import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, Lock, CheckCircle2, XCircle, MoveRight } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setIsSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Token may be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen bg-slate-900 items-center justify-center p-8">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Password Reset!</h2>
          <p className="text-slate-500 mb-6">Your password has been reset successfully. Redirecting to login...</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-sm tracking-wider hover:bg-black transition-all flex items-center justify-center gap-2"
          >
            Go to Login <MoveRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900 items-center justify-center p-8">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-green-400 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Reset Password</h2>
          <p className="text-slate-500 text-sm mt-2">Enter your new password below</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2 mb-6">
            <XCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                placeholder="Enter new password (min 6 chars)"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold shadow-lg shadow-green-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
            {!isLoading && <MoveRight className="w-5 h-5" />}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Remember your password?{' '}
          <button onClick={() => navigate('/login')} className="text-green-600 hover:text-green-500 font-semibold">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
