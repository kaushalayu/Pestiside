import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, MoveRight, Leaf } from 'lucide-react';
import api from '../lib/api';
import { loginSuccess } from '../store/slices/authSlice';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Destructure successfully mapped properties from root payload
      const { user, accessToken } = response.data;
      dispatch(loginSuccess({ user, token: accessToken }));
      
      setTimeout(() => {
        navigate('/');
      }, 600);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to authenticate. Check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 overflow-hidden font-sans">
      
      {/* Left Splash Image Pane */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16"
      >
        {/* Soft glowing bloom behind image context */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-green-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        
        {/* Elegant typography over dark theme */}
        <div className="relative z-10 flex flex-col gap-6 max-w-lg">
           <div className="flex items-center gap-3">
             <div className="flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-2xl border border-green-500/20 shadow-lg shadow-green-500/10">
               <ShieldCheck className="text-green-400 w-9 h-9" />
             </div>
             <h1 className="text-4xl font-display font-bold text-white tracking-tight">SafeHome</h1>
           </div>
           
           <h2 className="text-5xl font-display font-medium text-white leading-tight tracking-tight mt-12">
             Healthy Choice <br/> <span className="text-green-400 italic">For Healthy Home.</span>
           </h2>
           
           <p className="text-lg text-slate-400 leading-relaxed max-w-md mt-6 font-light">
             Enterprise-grade field control analytics designed specifically for robust CRM and operations management.
           </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4 text-slate-500 text-sm font-medium">
          <Leaf className="w-5 h-5 text-green-500" />
          Powered by Pestochem India Pvt Ltd.
        </div>
      </motion.div>

      {/* Right Login Pane */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 relative bg-white shadow-[-20px_0_40px_rgba(0,0,0,0.4)] z-20 rounded-none lg:rounded-s-[3rem]">
         
         <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="w-full max-w-md"
         >
            <div className="text-center lg:text-left mb-10">
              <h3 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Welcome Back</h3>
              <p className="text-slate-500 mt-2 font-medium">Please enter your credentials to access the portal.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5" autoComplete="off">
               
               <AnimatePresence>
                 {error && (
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                     className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center overflow-hidden"
                   >
                     {error}
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Email Input */}
               <div className="flex flex-col gap-2.5">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                  <div className="relative flex items-center">
                    <div className="absolute left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="text-slate-400 w-5 h-5" />
                    </div>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="off"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
                      placeholder="admin@safehome.com"
                    />
                  </div>
               </div>

               {/* Password Input */}
               <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between ml-1">
                     <label className="text-sm font-semibold text-slate-700">Password</label>
                      <a href="/forgot-password" className="text-sm font-semibold text-green-600 hover:text-green-500 transition-colors">Forgot password?</a>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="text-slate-400 w-5 h-5" />
                    </div>
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
                      placeholder="Enter your password"
                    />
                  </div>
               </div>

               {/* Submit Button */}
               <div className="pt-2">
                 <button 
                    disabled={isLoading}
                    type="submit" 
                    className="w-full py-4 px-6 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold shadow-lg shadow-green-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group text-base"
                 >
                    <span className="tracking-wide">
                      {isLoading ? 'Authenticating...' : 'Sign In Securely'}
                    </span>
                    {!isLoading && <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                 </button>
               </div>
            </form>
         </motion.div>
      </div>
    </div>
  );
};

export default Login;
