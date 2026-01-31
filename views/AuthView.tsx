
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Store, Key, Mail, Fingerprint, 
  ArrowRight, Loader2, CheckCircle, Smartphone, 
  Lock, ChefHat, Bed, AlertCircle, BellRing, X
} from 'lucide-react';
import { UserRole, AuthCredentials } from '../types';

interface AuthViewProps {
  auth: AuthCredentials;
  setAuth: React.Dispatch<React.SetStateAction<AuthCredentials>>;
  onLogin: (role: UserRole) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ auth, setAuth, onLogin }) => {
  const [mode, setMode] = useState<'LOGIN_CHOICE' | 'LOGIN_INPUT' | 'SIGNUP_INFO' | 'SIGNUP_OTP' | 'SIGNUP_PASS'>(
    auth.isConfigured ? 'LOGIN_CHOICE' : 'SIGNUP_INFO'
  );
  
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Onboarding / Signup state
  const [signupData, setSignupData] = useState({ hotelName: '', hotelEmail: '' });
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showDemoToast, setShowDemoToast] = useState(false);

  // Clear errors when state changes
  useEffect(() => {
    if (error) setError('');
  }, [otpInput, password, signupData]);

  // Handle Login Logic
  const handleLogin = () => {
    if (!selectedRole) return;
    setError('');
    
    let isValid = false;
    if (selectedRole === 'ADMIN' && password === auth.adminPass) isValid = true;
    if (selectedRole === 'RESTAURANT' && password === auth.restaurantPass) isValid = true;
    if (selectedRole === 'ROOMS' && password === auth.roomsPass) isValid = true;

    if (isValid) {
      onLogin(selectedRole);
    } else {
      setError('Access Denied: Invalid Key');
      setPassword('');
    }
  };

  // Phase 1: Trigger OTP
  const startSignup = () => {
    if (!signupData.hotelName || !signupData.hotelEmail) {
      return alert("Details required.");
    }
    
    setIsLoading(true);
    setTimeout(() => {
      const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(newOtp);
      
      // Mobile-friendly notification system
      setShowDemoToast(true);
      
      setIsLoading(false);
      setMode('SIGNUP_OTP');
      
      // Also fallback to console and alert
      console.log(`[DineDash System] OTP: ${newOtp}`);
    }, 1200);
  };

  // Phase 2: Verify OTP
  const handleVerifyOtp = () => {
    if (otpInput.length < 4) return;
    
    setIsLoading(true);
    setTimeout(() => {
      if (otpInput === generatedOtp) {
        setIsLoading(false);
        setMode('SIGNUP_PASS');
        setOtpInput('');
        setShowDemoToast(false);
      } else {
        setIsLoading(false);
        setError("Invalid OTP Code");
        setOtpInput('');
      }
    }, 1000);
  };

  // Phase 3: Finalize
  const finalizeOnboarding = () => {
    if (password.length < 4) return alert("Key too short.");
    setAuth({
      ...auth,
      hotelName: signupData.hotelName,
      hotelEmail: signupData.hotelEmail,
      adminPass: password,
      isConfigured: true
    });
    onLogin('ADMIN');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-6 relative">
      
      {/* MOBILE-SAFE DEMO NOTIFICATION */}
      {showDemoToast && (
        <div className="fixed top-6 left-4 right-4 z-[200] animate-in slide-in-from-top-10 duration-500">
           <div className="bg-gray-900 text-white p-6 rounded-[32px] shadow-2xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="bg-green-600 p-2 rounded-xl animate-pulse"><BellRing size={20} /></div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Security Verification</p>
                    <p className="text-sm font-bold">Your OTP Code is: <span className="text-green-400 text-xl ml-2 tracking-widest">{generatedOtp}</span></p>
                 </div>
              </div>
              <button onClick={() => setShowDemoToast(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
           </div>
        </div>
      )}

      {/* ONBOARDING MODAL */}
      {(mode === 'SIGNUP_INFO' || mode === 'SIGNUP_OTP' || mode === 'SIGNUP_PASS') ? (
        <div className="bg-white w-full max-w-xl rounded-[48px] md:rounded-[60px] p-8 md:p-16 shadow-2xl animate-in fade-in zoom-in duration-500 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-green-600 rounded-[24px] md:rounded-[30px] flex items-center justify-center text-white mx-auto mb-8 md:mb-10 shadow-xl shadow-green-100">
            <Store size={32} />
          </div>

          {mode === 'SIGNUP_INFO' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">Onboard Property</h1>
              <p className="text-gray-400 font-medium mb-8 md:mb-12 text-sm">Deploy your DineDash Pro environment.</p>
              
              <div className="space-y-4 text-left">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Hotel / Restaurant Name</label>
                   <input 
                    type="text" 
                    className="w-full p-5 bg-gray-50 text-gray-900 placeholder-gray-400 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-green-500/10 transition-all" 
                    value={signupData.hotelName} 
                    onChange={e => setSignupData({...signupData, hotelName: e.target.value})} 
                    placeholder="e.g. Grand Plaza" 
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Corporate Email</label>
                   <input 
                    type="email" 
                    className="w-full p-5 bg-gray-50 text-gray-900 placeholder-gray-400 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-green-500/10 transition-all" 
                    value={signupData.hotelEmail} 
                    onChange={e => setSignupData({...signupData, hotelEmail: e.target.value})} 
                    placeholder="manager@hotel.com" 
                   />
                </div>
              </div>

              <button 
                onClick={startSignup} 
                disabled={isLoading} 
                className="w-full mt-10 md:mt-12 py-5 md:py-6 bg-gray-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Mail size={20} />}
                Generate & Alert OTP
              </button>
            </div>
          )}

          {mode === 'SIGNUP_OTP' && (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Verification</h2>
              <p className="text-gray-400 text-sm font-medium mb-8">Enter the 4-digit code from the top banner.</p>
              
              <div className="space-y-6">
                <div className="relative">
                   <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
                   <input 
                    type="text" 
                    maxLength={4} 
                    inputMode="numeric"
                    className={`w-full pl-16 pr-6 py-6 bg-gray-50 text-gray-900 placeholder-gray-400 rounded-2xl border-none outline-none font-black text-3xl tracking-[0.8em] transition-all text-center ${error ? 'ring-2 ring-red-500' : 'focus:ring-4 focus:ring-blue-500/10'}`} 
                    placeholder="0000" 
                    value={otpInput} 
                    onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))} 
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                   />
                </div>
                
                {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>}

                <button 
                  onClick={handleVerifyOtp} 
                  disabled={isLoading || otpInput.length < 4}
                  className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                  Confirm Identity
                </button>
                
                <button onClick={() => setMode('SIGNUP_INFO')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Edit Details</button>
              </div>
            </div>
          )}

          {mode === 'SIGNUP_PASS' && (
            <div className="animate-in slide-in-from-right-4 duration-500">
               <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Secure Hub</h2>
               <p className="text-gray-400 text-sm font-medium mb-10">Set your Master Admin key.</p>
               <div className="space-y-6">
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
                    <input 
                      type="password" 
                      className="w-full pl-16 pr-6 py-6 bg-gray-50 text-gray-900 placeholder-gray-400 rounded-2xl border-none outline-none font-black text-3xl tracking-[0.5em] focus:ring-4 focus:ring-green-500/10 transition-all text-center" 
                      placeholder="••••" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      autoFocus
                    />
                  </div>
                  <button onClick={finalizeOnboarding} className="w-full py-6 bg-gray-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl">Finish Onboarding</button>
               </div>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD LOGIN PANELS */
        <div className="bg-white w-full max-w-4xl rounded-[48px] md:rounded-[60px] shadow-2xl animate-in fade-in zoom-in duration-700 overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-1/2 bg-gray-900 p-8 md:p-16 text-white flex flex-col justify-between relative overflow-hidden">
             <div className="relative z-10">
                <div className="bg-green-600 w-12 h-12 rounded-xl flex items-center justify-center mb-8"><Store size={24} /></div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase mb-4">{auth.hotelName || 'DineDash Pro'}</h1>
                <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">Global Cloud Terminal</p>
             </div>
             <div className="relative z-10 space-y-4 mt-8 md:mt-0">
                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400"><ShieldCheck className="text-green-500" size={16} /> Secure Verification</div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400"><Fingerprint className="text-blue-500" size={16} /> Biometric Compatible</div>
             </div>
          </div>

          <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
            {mode === 'LOGIN_CHOICE' && (
              <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Select Portal</h2>
                    <p className="text-gray-400 text-xs font-medium">Choose operational terminal.</p>
                 </div>
                 <div className="space-y-3">
                    <PortalOption icon={ShieldCheck} title="Admin" color="hover:border-green-500 text-green-600" onClick={() => { setSelectedRole('ADMIN'); setMode('LOGIN_INPUT'); }} />
                    <PortalOption icon={ChefHat} title="Restaurant" color="hover:border-orange-500 text-orange-600" onClick={() => { setSelectedRole('RESTAURANT'); setMode('LOGIN_INPUT'); }} />
                    <PortalOption icon={Bed} title="Rooms" color="hover:border-blue-500 text-blue-600" onClick={() => { setSelectedRole('ROOMS'); setMode('LOGIN_INPUT'); }} />
                 </div>
              </div>
            )}

            {mode === 'LOGIN_INPUT' && selectedRole && (
              <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                 <button onClick={() => setMode('LOGIN_CHOICE')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><ArrowRight className="rotate-180" size={14} /> Back</button>
                 <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">{selectedRole}</h2>
                    <p className="text-gray-400 text-xs font-medium">Verification required.</p>
                 </div>
                 <div className="space-y-6">
                    <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                        <input 
                          type="password" 
                          className={`w-full pl-14 pr-6 py-5 bg-gray-50 text-gray-900 placeholder-gray-400 rounded-2xl border-none outline-none font-bold transition-all ${error ? 'ring-2 ring-red-500' : 'focus:ring-4 focus:ring-green-500/10'}`} 
                          placeholder="••••" 
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        />
                    </div>
                    {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}
                    <button onClick={handleLogin} className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl">Enter Terminal</button>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PortalOption = ({ icon: Icon, title, onClick, color }: any) => (
  <button onClick={onClick} className={`w-full p-5 bg-white border border-gray-100 rounded-3xl flex items-center gap-4 transition-all group ${color}`}>
     <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:bg-white transition-colors"><Icon size={20} /></div>
     <div className="text-left flex-1"><h4 className="font-black text-gray-900 leading-none group-hover:text-current">{title}</h4></div>
     <ArrowRight size={16} className="text-gray-200 group-hover:text-current transition-colors" />
  </button>
);

export default AuthView;
