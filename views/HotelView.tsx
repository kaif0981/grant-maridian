
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Room, RoomStatus, Booking, RoomType } from '../types.ts';
// Fixed: Added missing UserPlus icon to imports
import { 
  Bed, CheckCircle, Edit2, Trash2, 
  X, LayoutGrid, Settings2, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, User, Clock, 
  Phone, Save, Minus, Plus, AlertCircle, Timer, CalendarClock, Ticket,
  Search, Info, Receipt, Wallet, Fingerprint, LayoutList, History,
  UserPlus, ExternalLink, CalendarDays, MapPin, Image as ImageIcon
} from 'lucide-react';
import { formatDateTime, formatCurrency } from '../utils/formatters';

interface HotelViewProps {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  bookings: Booking[];
  onCheckIn: (roomId: string, guestName: string, phone: string, days: number, checkInTime: number, aadhaar?: string) => void;
  onCheckOut: (bookingId: string) => void;
  onReserve: (roomId: string, guestName: string, phone: string, days: number, startDate: number, aadhaar?: string) => void;
  onUpdateBookingStatus: (bookingId: string, status: Booking['status']) => void;
}

const HotelView: React.FC<HotelViewProps> = ({ rooms, setRooms, bookings, onCheckIn, onCheckOut, onReserve, onUpdateBookingStatus }) => {
  const [activeTab, setActiveTab] = useState<'GRID' | 'DIARY' | 'HISTORY'>('GRID');
  const [showCheckIn, setShowCheckIn] = useState<{roomId: string, mode: 'NOW' | 'RESERVE'} | null>(null);
  const [showRoomModal, setShowRoomModal] = useState<Room | 'NEW' | null>(null);
  const [isManagementMode, setIsManagementMode] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [stayDays, setStayDays] = useState(1);
  const [reservationDate, setReservationDate] = useState(new Date().toISOString().split('T')[0]);
  const [editRoomData, setEditRoomData] = useState<Partial<Room>>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  
  // New state for viewing specific guest details in history
  const [selectedHistoryGuest, setSelectedHistoryGuest] = useState<any | null>(null);

  const navigate = useNavigate();

  const getBookingForDate = (roomId: string, date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const dTime = d.getTime();

    return bookings.find(b => {
      if (b.roomId !== roomId || (b.status !== 'ACTIVE' && b.status !== 'RESERVED')) return false;
      const start = new Date(b.checkIn).setHours(0, 0, 0, 0);
      const end = new Date(b.expectedCheckOut).setHours(0, 0, 0, 0);
      return dTime >= start && dTime <= end;
    });
  };

  // Grouped History logic: Sahil (1234) shows once
  const guestHistory = useMemo(() => {
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
    const guestMap = new Map<string, any>();

    completedBookings.forEach(b => {
      const id = b.aadhaarNumber || `P-${b.phone}`;
      if (!guestMap.has(id)) {
        guestMap.set(id, {
          name: b.guestName,
          aadhaar: b.aadhaarNumber,
          phone: b.phone,
          visits: [],
          totalPaid: 0
        });
      }
      const g = guestMap.get(id);
      g.visits.push(b);
      g.totalPaid += b.total;
    });

    return Array.from(guestMap.values());
  }, [bookings]);

  const handleOpenRoomModal = (room: Room | 'NEW') => {
    if (room === 'NEW') {
      setEditRoomData({ 
        number: '', 
        type: RoomType.STANDARD, 
        floor: 1, 
        price: 2500, 
        status: RoomStatus.AVAILABLE,
        image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800'
      });
    } else {
      setEditRoomData({ ...room });
    }
    setShowRoomModal(room);
  };

  const filteredRooms = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return rooms;
    return rooms.filter(room => {
      const roomMatch = room.number.toLowerCase().includes(term);
      const booking = getBookingForDate(room.id, selectedDate);
      const guestMatch = booking?.guestName.toLowerCase().includes(term);
      const aadhaarMatch = booking?.aadhaarNumber?.toLowerCase().includes(term);
      return roomMatch || guestMatch || aadhaarMatch;
    });
  }, [rooms, searchQuery, selectedDate, bookings]);

  const handleSaveRoom = () => {
    if (!editRoomData.number || !editRoomData.price) return alert("Fill required fields");
    
    if (showRoomModal === 'NEW') {
      const newRoom: Room = {
        ...editRoomData as Room,
        id: `r${Date.now()}`,
        status: RoomStatus.AVAILABLE,
        floor: Number(editRoomData.floor) || 1,
        price: Number(editRoomData.price) || 0
      };
      setRooms(prev => [...prev, newRoom]);
    } else if (typeof showRoomModal === 'object' && showRoomModal !== null) {
      setRooms(prev => prev.map(r => r.id === showRoomModal.id ? { ...r, ...editRoomData } : r));
    }
    setShowRoomModal(null);
  };

  const handleDeleteRoom = (id: string) => {
    if (confirm("Are you sure you want to remove this room from inventory?")) {
      setRooms(prev => prev.filter(r => r.id !== id));
      setShowRoomModal(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Front Desk</h2>
          <p className="text-gray-400 text-sm font-medium">Guest registration, billing, and identity tracking.</p>
        </div>
        
        <div className="flex gap-2 bg-white p-1.5 rounded-3xl border border-gray-100 shadow-sm">
          <TabTrigger label="Grid" icon={LayoutGrid} active={activeTab === 'GRID'} onClick={() => setActiveTab('GRID')} />
          <TabTrigger label="Timeline" icon={CalendarIcon} active={activeTab === 'DIARY'} onClick={() => setActiveTab('DIARY')} />
          <TabTrigger label="Guest Log" icon={History} active={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')} />
        </div>
      </div>

      {activeTab !== 'HISTORY' && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative group flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search Room, Guest Name or Aadhaar..."
              className="w-full pl-16 pr-6 py-5 bg-white border-2 border-transparent rounded-[28px] text-sm font-bold shadow-sm outline-none focus:border-blue-500/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={() => setIsManagementMode(!isManagementMode)} className={`px-8 py-5 rounded-[28px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl transition-all ${isManagementMode ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-100'}`}><Settings2 size={18} /> Configure Inventory</button>
          {isManagementMode && <button onClick={() => handleOpenRoomModal('NEW')} className="bg-gray-900 text-white px-8 py-5 rounded-[28px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all"><Plus size={18} /> Add Room</button>}
        </div>
      )}

      {/* Grid View */}
      {activeTab === 'GRID' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredRooms.map(room => {
            const booking = getBookingForDate(room.id, selectedDate);
            const isOccupied = booking?.status === 'ACTIVE';
            const isReserved = booking?.status === 'RESERVED';
            const isDirty = room.status === RoomStatus.DIRTY;

            return (
              <div 
                key={room.id}
                onClick={() => {
                  if (isManagementMode) return handleOpenRoomModal(room);
                  if (isOccupied) navigate(`/hotel/folio/${booking.id}`);
                  else if (isReserved) onUpdateBookingStatus(booking.id, 'ACTIVE');
                  else if (isDirty) setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: RoomStatus.AVAILABLE } : r));
                  else setShowCheckIn({ roomId: room.id, mode: 'NOW' });
                }}
                className={`group bg-white p-6 rounded-[48px] border-2 transition-all cursor-pointer hover:shadow-2xl hover:scale-[1.02] ${isOccupied ? 'border-blue-200 bg-blue-50/10' : isReserved ? 'border-purple-200 bg-purple-50/10' : isDirty ? 'border-orange-200 bg-orange-50/10' : 'border-gray-50'}`}
              >
                <div className="flex justify-between items-start mb-8">
                   <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center text-xl font-black ${isOccupied ? 'bg-blue-600 text-white' : isReserved ? 'bg-purple-600 text-white' : isDirty ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-600 group-hover:text-white'}`}>{room.number}</div>
                   <div className="text-right">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{room.type}</p>
                     <p className="text-sm font-black text-gray-900 mt-0.5">{formatCurrency(room.price)}</p>
                   </div>
                </div>

                {booking ? (
                  <div className="space-y-4">
                    <div className="min-h-[40px]">
                      <h4 className="font-black text-gray-900 truncate leading-none mb-1.5">{booking.guestName}</h4>
                      <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">{booking.aadhaarNumber ? <><Fingerprint size={12} className="text-blue-500" /> {booking.aadhaarNumber}</> : <><Phone size={12} /> {booking.phone}</>}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase text-center ${isOccupied ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{isOccupied ? 'In-Stay' : 'Incoming Reservation'}</div>
                  </div>
                ) : isDirty ? (
                   <div className="flex flex-col items-center justify-center py-4 bg-orange-50/50 rounded-3xl text-orange-600">
                     <span className="text-[9px] font-black uppercase tracking-widest">Cleaning Required</span>
                   </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50/50 rounded-3xl">
                     <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Click to Check-in</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* History View with Grouping by Guest */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-[48px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
             <h3 className="text-2xl font-black text-gray-900">Unique Guest History</h3>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{guestHistory.length} Frequent Patrons Recorded</p>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-10 py-6">Guest Identity</th>
                <th className="px-10 py-6 text-center">Visit Frequency</th>
                <th className="px-10 py-6 text-center">Lifetime Value</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {guestHistory.map(guest => (
                <tr key={guest.aadhaar || guest.phone} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><User size={24} /></div>
                       <div>
                         <span className="font-black text-gray-900 text-lg block leading-none mb-2">{guest.name}</span>
                         <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 opacity-70 group-hover:opacity-100"><Fingerprint size={12} /> Aadhaar: {guest.aadhaar || 'Not Linked'}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                     <span className="bg-gray-100 px-4 py-2 rounded-xl text-xs font-black text-gray-600">{guest.visits.length} Stay{guest.visits.length > 1 ? 's' : ''}</span>
                  </td>
                  <td className="px-10 py-8 text-center font-black text-green-600 text-lg">{formatCurrency(guest.totalPaid)}</td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setSelectedHistoryGuest(guest)} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 transition-all flex items-center gap-2">
                        <History size={14} /> View Stay Details
                      </button>
                      <button onClick={() => navigate('/crm')} className="p-3 bg-gray-100 text-gray-400 rounded-2xl hover:bg-gray-900 hover:text-white transition-all">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {guestHistory.length === 0 && (
                <tr><td colSpan={4} className="py-24 text-center opacity-20"><History size={80} className="mx-auto mb-4" /><p className="font-black uppercase tracking-widest">No past stay records found</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Guest Stay Details Modal (History Tab) */}
      {selectedHistoryGuest && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-3xl rounded-[56px] p-10 lg:p-14 shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-start mb-10 shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center shadow-inner">
                       <User size={36} />
                    </div>
                    <div>
                       <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">{selectedHistoryGuest.name}</h2>
                       <div className="flex gap-3">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Fingerprint size={12} /> {selectedHistoryGuest.aadhaar || 'No Aadhaar'}</span>
                          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Phone size={12} /> {selectedHistoryGuest.phone}</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setSelectedHistoryGuest(null)} className="p-3 text-gray-300 hover:text-gray-900 transition-colors bg-gray-50 rounded-2xl"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                   <CalendarDays size={14} /> Chronological Stay History
                 </h4>
                 
                 <div className="space-y-4">
                    {selectedHistoryGuest.visits.sort((a:any, b:any) => b.checkIn - a.checkIn).map((visit: any) => (
                       <div key={visit.id} className="bg-gray-50 rounded-[36px] p-6 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 font-black text-lg">
                                {visit.roomId.replace('r','')}
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration: {Math.ceil((visit.checkOut - visit.checkIn) / 86400000) || 1} Night(s)</p>
                                <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                   {new Date(visit.checkIn).toLocaleDateString()} — {visit.checkOut ? new Date(visit.checkOut).toLocaleDateString() : 'N/A'}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                   <span className="text-[9px] font-bold text-gray-500 flex items-center gap-1"><Clock size={10} /> In: {new Date(visit.checkIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                   {visit.checkOut && <span className="text-[9px] font-bold text-gray-500 flex items-center gap-1"><Clock size={10} /> Out: {new Date(visit.checkOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
                                </div>
                             </div>
                          </div>
                          <div className="text-right w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                             <p className="text-xl font-black text-gray-900">{formatCurrency(visit.total)}</p>
                             <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-widest">{visit.paymentMethod || 'COMPLETED'}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="mt-10 pt-8 border-t border-gray-100 flex justify-between items-center shrink-0">
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Historical Value</p>
                    <p className="text-3xl font-black text-blue-600">{formatCurrency(selectedHistoryGuest.totalPaid)}</p>
                 </div>
                 <button onClick={() => setSelectedHistoryGuest(null)} className="px-10 py-4 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl">Close Log</button>
              </div>
           </div>
        </div>
      )}

      {/* Timeline View remains functional... */}
      {activeTab === 'DIARY' && (
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
           <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><ChevronLeft size={20} /></button>
                <h3 className="text-lg font-black text-gray-900">{selectedDate.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><ChevronRight size={20} /></button>
              </div>
           </div>
           <table className="w-full text-left border-collapse">
             <tbody className="divide-y divide-gray-100">
               {filteredRooms.map(room => {
                 const booking = getBookingForDate(room.id, selectedDate);
                 return (
                   <tr key={room.id} className="hover:bg-gray-50/30">
                     <td className="px-8 py-6 border-r border-gray-100 font-black text-gray-900 w-32">Room {room.number}</td>
                     <td className="px-8 py-4">
                       {booking ? (
                         <div className={`p-4 rounded-2xl flex items-center justify-between ${booking.status === 'ACTIVE' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                           <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${booking.status === 'ACTIVE' ? 'bg-blue-600' : 'bg-purple-600'} text-white`}><User size={18} /></div>
                             <p className="text-sm font-black">{booking.guestName} ({booking.status})</p>
                           </div>
                           <button onClick={() => navigate(`/hotel/folio/${booking.id}`)} className="px-4 py-2 bg-white rounded-lg text-[9px] font-black uppercase tracking-widest">Folio</button>
                         </div>
                       ) : <div className="text-gray-200 text-[10px] font-black uppercase tracking-widest">Unoccupied</div>}
                     </td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
        </div>
      )}

      {/* Guest Entry Modal */}
      {showCheckIn && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-md rounded-[56px] p-12 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-6 mb-10">
                <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center shadow-inner ${showCheckIn.mode === 'RESERVE' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                  {showCheckIn.mode === 'RESERVE' ? <CalendarClock size={36} /> : <UserPlus size={36} />}
                </div>
                <div>
                   <h2 className="text-2xl font-black text-gray-900 tracking-tight">{showCheckIn.mode === 'RESERVE' ? 'New Reservation' : 'Quick Check-In'}</h2>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Room {rooms.find(r => r.id === showCheckIn.roomId)?.number}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Guest Full Name</label>
                   <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-blue-500/10 transition-all" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="e.g. Sahil Khan" autoFocus />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Aadhaar / ID #</label>
                     <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-blue-500/10 transition-all" value={aadhaarNumber} onChange={e => setAadhaarNumber(e.target.value)} placeholder="1234 5678..." />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Phone</label>
                     <input type="tel" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-blue-500/10 transition-all" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 99..." />
                   </div>
                 </div>
                 <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 flex flex-col items-center">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Planned Stay (Nights)</label>
                    <div className="flex items-center gap-8">
                       <button onClick={() => setStayDays(Math.max(1, stayDays - 1))} className="w-12 h-12 bg-white rounded-2xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow-sm"><Minus size={20} /></button>
                       <span className="text-3xl font-black text-gray-900">{stayDays}</span>
                       <button onClick={() => setStayDays(stayDays + 1)} className="w-12 h-12 bg-white rounded-2xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors shadow-sm"><Plus size={20} /></button>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 mt-12 pt-8 border-t border-gray-50">
                 <button onClick={() => setShowCheckIn(null)} className="flex-1 py-5 font-black text-xs text-gray-400 hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                 <button 
                  onClick={() => {
                    if (!guestName || !phone) return alert("Guest Name and Phone are mandatory.");
                    const date = showCheckIn.mode === 'RESERVE' ? new Date(reservationDate).getTime() : Date.now();
                    if (showCheckIn.mode === 'RESERVE') onReserve(showCheckIn.roomId, guestName, phone, stayDays, date, aadhaarNumber);
                    else onCheckIn(showCheckIn.roomId, guestName, phone, stayDays, date, aadhaarNumber);
                    setShowCheckIn(null); setGuestName(''); setPhone(''); setAadhaarNumber(''); setStayDays(1);
                  }}
                  className={`flex-2 text-white px-10 py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${showCheckIn.mode === 'RESERVE' ? 'bg-purple-600 shadow-purple-100' : 'bg-blue-600 shadow-blue-100'}`}
                 >Confirm</button>
              </div>
           </div>
        </div>
      )}

      {/* Room Inventory Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Room Inventory Setup</h2>
                <button onClick={() => setShowRoomModal(null)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Room Number</label>
                      <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold border border-transparent focus:border-orange-500/20" value={editRoomData.number || ''} onChange={e => setEditRoomData({...editRoomData, number: e.target.value})} placeholder="e.g. 101" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Floor</label>
                      <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold border border-transparent focus:border-orange-500/20" value={editRoomData.floor || ''} onChange={e => setEditRoomData({...editRoomData, floor: Number(e.target.value)})} placeholder="1" />
                    </div>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Room Category</label>
                   <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold border border-transparent focus:border-orange-500/20" value={editRoomData.type} onChange={e => setEditRoomData({...editRoomData, type: e.target.value as RoomType})}>
                      {Object.values(RoomType).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Base Rate (Per Night)</label>
                   <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold border border-transparent focus:border-orange-500/20" value={editRoomData.price || ''} onChange={e => setEditRoomData({...editRoomData, price: Number(e.target.value)})} placeholder="2500" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Image URL</label>
                   <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                      <input type="text" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none font-bold border border-transparent focus:border-orange-500/20" value={editRoomData.image || ''} onChange={e => setEditRoomData({...editRoomData, image: e.target.value})} placeholder="https://..." />
                   </div>
                 </div>
              </div>
              <div className="flex gap-4 mt-10">
                 {typeof showRoomModal === 'object' && showRoomModal !== null && (
                   <button onClick={() => handleDeleteRoom(showRoomModal.id)} className="p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-colors"><Trash2 size={20} /></button>
                 )}
                 <button onClick={() => setShowRoomModal(null)} className="flex-1 py-4 font-black text-xs text-gray-400">Cancel</button>
                 <button onClick={handleSaveRoom} className="flex-2 bg-gray-900 text-white px-10 py-4 rounded-2xl font-black text-xs shadow-xl shadow-gray-200 hover:bg-black transition-all">Save Room Metadata</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const TabTrigger = ({ label, icon: Icon, active, onClick }: any) => (
  <button onClick={onClick} className={`px-6 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.15em] flex items-center gap-2 transition-all ${active ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
    <Icon size={14} strokeWidth={3} /> {label}
  </button>
);

export default HotelView;
