
import React, { useState, useEffect } from 'react';
import { 
  Building, CreditCard, Printer, Shield, Bell, 
  Smartphone, Database, Globe, Wrench, CheckCircle2,
  Save, Loader2, Key, Lock, ShieldAlert
} from 'lucide-react';
import { AuthCredentials } from '../types';

interface BusinessSettings {
  restaurantName: string;
  supportEmail: string;
  address: string;
  gstNumber: string;
  cgstRate: string;
}

interface SettingsViewProps {
  auth: AuthCredentials;
  setAuth: React.Dispatch<React.SetStateAction<AuthCredentials>>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ auth, setAuth }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');
  
  const [settings, setSettings] = useState<BusinessSettings>({
    restaurantName: auth.hotelName || 'DineDash Pro Kitchen',
    supportEmail: auth.hotelEmail || 'admin@dinedash.pro',
    address: '123 Tech Square, High Street, Mumbai, 400001',
    gstNumber: '27AAACP0123A1Z5',
    cgstRate: '2.5'
  });

  const [authForm, setAuthForm] = useState({
    adminPass: auth.adminPass,
    restaurantPass: auth.restaurantPass,
    roomsPass: auth.roomsPass
  });

  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      setAuth(prev => ({
        ...prev,
        hotelName: settings.restaurantName,
        hotelEmail: settings.supportEmail,
        adminPass: authForm.adminPass,
        restaurantPass: authForm.restaurantPass,
        roomsPass: authForm.roomsPass
      }));
      setIsSaving(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 800);
  };

  const updateField = (field: keyof BusinessSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Settings</h1>
          <p className="text-gray-400 text-sm font-medium">Manage your business identity and security keys.</p>
        </div>
        <button 
          onClick={handleSaveAll}
          disabled={isSaving}
          className={`min-w-[200px] flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-gray-200 active:scale-95 ${
            saveStatus === 'success' ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-black'
          }`}
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : saveStatus === 'success' ? <CheckCircle2 size={18} /> : <Save size={18} />}
          {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Settings Saved!' : 'Save All Changes'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-2">
          <NavBtn icon={Building} label="General" active={activeTab === 'general'} onClick={() => setActiveTab('general')} />
          <NavBtn icon={Key} label="Access Control" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
          <NavBtn icon={CreditCard} label="Billing & GST" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
          <NavBtn icon={Printer} label="Hardware" active={activeTab === 'hardware'} onClick={() => setActiveTab('hardware')} />
        </div>

        <div className="flex-1 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-10 min-h-[500px]">
           {activeTab === 'general' && (
             <div className="space-y-8 animate-in slide-in-from-right-4">
                <section>
                   <h3 className="text-lg font-black mb-6 text-gray-900">Business Profile</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Restaurant Name</label>
                         <input type="text" value={settings.restaurantName} onChange={(e) => updateField('restaurantName', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Support Email</label>
                         <input type="email" value={settings.supportEmail} onChange={(e) => updateField('supportEmail', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Address</label>
                         <textarea rows={3} value={settings.address} onChange={(e) => updateField('address', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all resize-none" />
                      </div>
                   </div>
                </section>
             </div>
           )}

           {activeTab === 'security' && (
             <div className="space-y-10 animate-in slide-in-from-right-4">
                <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4">
                   <div className="p-3 bg-white rounded-2xl text-red-600 shadow-sm shrink-0"><ShieldAlert size={20} /></div>
                   <div className="space-y-1">
                      <p className="text-sm font-black text-red-900">Critical: Master Access Hub</p>
                      <p className="text-xs font-medium text-red-700">Changing these keys will immediately sign out all active sessions for the respective portals. Ensure staff is notified before updating.</p>
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Admin Master Password</label>
                         <div className="relative">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input type="password" value={authForm.adminPass} onChange={e => setAuthForm({...authForm, adminPass: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-green-500/10 transition-all" />
                         </div>
                      </div>
                      <div className="space-y-4 opacity-50">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Verified SMTP Owner</label>
                         <div className="p-4 bg-gray-100 rounded-2xl font-bold text-sm text-gray-500">{auth.hotelEmail}</div>
                      </div>
                   </div>

                   <div className="h-px bg-gray-50" />

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest px-1">Restaurant Portal Key</label>
                         <input type="password" value={authForm.restaurantPass} onChange={e => setAuthForm({...authForm, restaurantPass: e.target.value})} className="w-full p-4 bg-orange-50/30 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-orange-500/10 transition-all" />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-1">Rooms & Front Desk Key</label>
                         <input type="password" value={authForm.roomsPass} onChange={e => setAuthForm({...authForm, roomsPass: e.target.value})} className="w-full p-4 bg-blue-50/30 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-blue-500/10 transition-all" />
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'billing' && (
             <div className="space-y-8 animate-in slide-in-from-right-4">
                <section className="space-y-6">
                   <h3 className="text-lg font-black text-gray-900">Tax & Billing Configuration</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">GST Identification Number (GSTIN)</label>
                         <input type="text" value={settings.gstNumber} onChange={(e) => updateField('gstNumber', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all uppercase" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Default CGST Rate (%)</label>
                         <input type="number" step="0.1" value={settings.cgstRate} onChange={(e) => updateField('cgstRate', e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all" />
                      </div>
                   </div>
                </section>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

const NavBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs transition-all ${active ? 'bg-green-600 text-white shadow-xl shadow-green-100 scale-105 z-10' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}><Icon size={18} strokeWidth={active ? 3 : 2} /> {label}</button>
);

export default SettingsView;
