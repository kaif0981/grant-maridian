
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, Booking } from '../types.ts';
import { 
  User, Phone, Award, Clock, Search, X, 
  Hash, Filter, Zap, Star, UserPlus, Calendar,
  Receipt, Bed, ChevronRight, History, Fingerprint, Wallet
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface CRMViewProps {
  orders: Order[];
  bookings: Booking[];
}

type FilterType = 'ALL' | 'VIP' | 'RECENT' | 'NEW';

const CRMView: React.FC<CRMViewProps> = ({ orders, bookings = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);

  // Unified Guest Aggregator Logic (Aadhaar-based)
  const uniqueGuests = useMemo(() => {
    const guestMap = new Map<string, any>();

    // Step 1: Process all bookings
    bookings.forEach(b => {
      const id = b.aadhaarNumber || `PHONE-${b.phone}`;
      if (!guestMap.has(id)) {
        guestMap.set(id, {
          name: b.guestName,
          aadhaar: b.aadhaarNumber,
          phone: b.phone,
          bookings: [],
          orders: [],
          totalSpent: 0,
          lastActive: 0
        });
      }
      const guest = guestMap.get(id);
      guest.bookings.push(b);
      guest.totalSpent += b.total;
      guest.lastActive = Math.max(guest.lastActive, b.checkIn);
    });

    // Step 2: Process all restaurant orders
    orders.forEach(o => {
      const id = o.aadhaarNumber || (o.customerName === "Walk-in Guest" ? `WALK-${o.timestamp}` : `NAME-${o.customerName}`);
      if (!guestMap.has(id)) {
        guestMap.set(id, {
          name: o.customerName || 'Walk-in Guest',
          aadhaar: o.aadhaarNumber,
          phone: 'N/A',
          bookings: [],
          orders: [],
          totalSpent: 0,
          lastActive: 0
        });
      }
      const guest = guestMap.get(id);
      guest.orders.push(o);
      guest.totalSpent += o.total;
      guest.lastActive = Math.max(guest.lastActive, o.timestamp);
    });

    return Array.from(guestMap.values()).map((guest, index) => ({
      ...guest,
      id: `guest-${index}`,
      visitCount: guest.bookings.length + guest.orders.length,
      isVIP: guest.totalSpent > 10000 || guest.bookings.length > 3
    }));
  }, [orders, bookings]);

  const filtered = useMemo(() => {
    let result = uniqueGuests;
    if (activeFilter === 'VIP') result = result.filter(g => g.isVIP);
    if (activeFilter === 'RECENT') result = result.filter(g => g.lastActive > Date.now() - 86400000 * 7);
    
    const term = searchQuery.toLowerCase().trim();
    if (term) {
      result = result.filter(g => 
        g.name.toLowerCase().includes(term) || 
        g.aadhaar?.toLowerCase().includes(term) || 
        g.phone.includes(term)
      );
    }
    return result;
  }, [uniqueGuests, activeFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Guest Directory</h2>
          <p className="text-gray-400 text-sm font-medium italic">Identification via Aadhaar / KYC for unified visit history.</p>
        </div>
        <div className="bg-white px-6 py-4 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
           <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Fingerprint size={20} /></div>
           <div>
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Unique Identities Found</span>
             <span className="text-xl font-black text-gray-900 leading-none">{uniqueGuests.length}</span>
           </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 pt-2 pb-4 bg-gray-50/80 backdrop-blur-md flex flex-col md:flex-row gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="Search by Sahil, Aadhaar #1234, or Phone..."
            className="w-full pl-16 pr-6 py-6 bg-white border-2 border-transparent rounded-[32px] text-base font-bold shadow-xl shadow-gray-200/40 outline-none focus:border-blue-500/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
           <FilterChip label="All Guests" icon={Filter} active={activeFilter === 'ALL'} onClick={() => setActiveFilter('ALL')} />
           <FilterChip label="VIP Members" icon={Star} active={activeFilter === 'VIP'} onClick={() => setActiveFilter('VIP')} color="bg-yellow-500" />
           <FilterChip label="Recent Active" icon={Zap} active={activeFilter === 'RECENT'} onClick={() => setActiveFilter('RECENT')} color="bg-purple-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((guest) => (
          <div key={guest.id} onClick={() => setSelectedGuest(guest)} className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm hover:shadow-2xl hover:scale-[1.01] transition-all duration-500 cursor-pointer group flex gap-8">
            <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center shrink-0 ${guest.isVIP ? 'bg-yellow-50 text-yellow-500 shadow-inner' : 'bg-gray-50 text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors'}`}>
              <User size={48} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 truncate leading-none mb-2">{guest.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {guest.aadhaar && <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Fingerprint size={12} /> {guest.aadhaar}</span>}
                      <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Phone size={12} /> {guest.phone}</span>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-200 group-hover:text-blue-500 transition-colors" />
               </div>
               
               <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-50 mt-2">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Stays</p>
                    <p className="text-lg font-black text-gray-900">{guest.bookings.length}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total LTV</p>
                    <p className="text-lg font-black text-green-600">{formatCurrency(guest.totalSpent)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Last Visit</p>
                    <p className="text-[11px] font-bold text-gray-900 mt-1">{guest.lastActive ? new Date(guest.lastActive).toLocaleDateString() : 'N/A'}</p>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* GUEST PROFILE MODAL */}
      {selectedGuest && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[60px] p-8 lg:p-14 shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-start mb-12 shrink-0">
                <div className="flex items-center gap-8">
                  <div className={`w-24 h-24 rounded-[36px] flex items-center justify-center ${selectedGuest.isVIP ? 'bg-yellow-50 text-yellow-500' : 'bg-gray-900 text-white'}`}>
                    <User size={48} />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-3">{selectedGuest.name}</h2>
                    <div className="flex gap-3">
                       {selectedGuest.aadhaar && <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2"><Fingerprint size={16} /> Aadhaar: {selectedGuest.aadhaar}</span>}
                       <span className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2"><Phone size={16} /> {selectedGuest.phone}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedGuest(null)} className="p-4 text-gray-300 hover:text-gray-900 transition-colors bg-gray-50 rounded-2xl"><X size={32} /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-12 pr-4 custom-scrollbar">
                {/* Stay Log */}
                <div>
                   <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                     <Bed size={18} className="text-blue-500" /> Complete Stay Log ({selectedGuest.bookings.length})
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedGuest.bookings.map((b: any) => (
                        <div key={b.id} className="p-6 bg-gray-50 rounded-[36px] border border-gray-100 flex items-center justify-between">
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Room {b.roomId.replace('r','')}</p>
                              <h4 className="text-sm font-black text-gray-900">{new Date(b.checkIn).toLocaleDateString()} — {new Date(b.expectedCheckOut).toLocaleDateString()}</h4>
                              <p className="text-[9px] font-bold text-blue-500 mt-1 uppercase">{b.status}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-xl font-black text-gray-900">{formatCurrency(b.total)}</p>
                              <span className="text-[8px] font-black text-gray-400 uppercase">{b.paymentMethod || 'PENDING'}</span>
                           </div>
                        </div>
                      ))}
                      {selectedGuest.bookings.length === 0 && <p className="text-xs font-bold text-gray-400 italic px-4">No hotel stays recorded.</p>}
                   </div>
                </div>

                {/* Dine-in History */}
                <div>
                   <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                     <Receipt size={18} className="text-green-500" /> Restaurant History ({selectedGuest.orders.length})
                   </h4>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {selectedGuest.orders.map((o: any) => (
                        <div key={o.id} className="p-5 bg-white border border-gray-100 rounded-[28px] shadow-sm flex flex-col justify-between h-32">
                           <div className="flex justify-between items-start">
                             <span className="text-[9px] font-black text-gray-400 uppercase">#{o.id.slice(-4)}</span>
                             <span className="text-[9px] font-black text-blue-600">{new Date(o.timestamp).toLocaleDateString()}</span>
                           </div>
                           <div className="mt-auto">
                             <p className="text-xs font-bold text-gray-500">{o.items.length} Items</p>
                             <p className="text-lg font-black text-gray-900">{formatCurrency(o.total)}</p>
                           </div>
                        </div>
                      ))}
                      {selectedGuest.orders.length === 0 && <p className="text-xs font-bold text-gray-400 italic px-4">No restaurant orders recorded.</p>}
                   </div>
                </div>
              </div>

              <div className="mt-12 pt-10 border-t border-gray-100 flex justify-between items-center shrink-0">
                 <div className="flex gap-12">
                   <div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lifetime Revenue</p>
                     <p className="text-3xl font-black text-green-600">{formatCurrency(selectedGuest.totalSpent)}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Profile Trust Score</p>
                     <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= (selectedGuest.isVIP ? 5 : 3) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />)}
                     </div>
                   </div>
                 </div>
                 <button onClick={() => setSelectedGuest(null)} className="px-12 py-5 bg-gray-900 text-white rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black transition-all">Close Profile</button>
              </div>
           </div>
        </div>
      )}
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }`}</style>
    </div>
  );
};

const FilterChip = ({ label, icon: Icon, active, onClick, color }: any) => (
  <button onClick={onClick} className={`px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all ${active ? `${color || 'bg-gray-900'} text-white shadow-xl scale-105` : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}>
    <Icon size={14} strokeWidth={3} /> {label}
  </button>
);

export default CRMView;
