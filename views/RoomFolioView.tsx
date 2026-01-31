
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Booking, Room, Order, PaymentMethod } from '../types';
import { 
  ArrowLeft, FileText, Bed, Coffee, CreditCard, 
  Printer, CheckCircle2, Receipt, User, Phone, Calendar,
  Smartphone, Building, ShieldCheck, MapPin, Hash, Download, X,
  // Added missing icons
  Fingerprint, Wallet
} from 'lucide-react';
import { calculateBookingTotals } from '../utils/calculations';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface RoomFolioViewProps {
  bookings: Booking[];
  rooms: Room[];
  orders: Order[];
  onSettleFolio: (bookingId: string, paymentMethod: PaymentMethod) => void;
}

const RoomFolioView: React.FC<RoomFolioViewProps> = ({ bookings, rooms, orders, onSettleFolio }) => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [showSettleModal, setShowSettleModal] = useState(false);

  const businessSettings = useMemo(() => {
    const saved = localStorage.getItem('dinedash_settings');
    return saved ? JSON.parse(saved) : {
      restaurantName: 'DineDash Grand Hotel',
      address: '123 Luxury Avenue, Mumbai 400001',
      gstNumber: '27AAACP0123A1Z5',
      cgstRate: '2.5'
    };
  }, []);

  const booking = bookings.find(b => b.id === bookingId);
  const room = rooms.find(r => booking && r.id === booking.roomId);
  
  if (!booking || !room) return <div className="flex items-center justify-center py-20 text-gray-400 font-black uppercase tracking-widest">Folio not found</div>;

  const roomOrders = orders.filter(o => o.roomId === booking.roomId && o.timestamp >= booking.checkIn);
  const { foodTotal, roomTotal, netTotal, stayDuration } = calculateBookingTotals(booking, roomOrders);
  
  const cgst = netTotal * (parseFloat(businessSettings.cgstRate) / 100);
  const sgst = cgst;
  const grandTotal = netTotal + cgst + sgst;

  const handleFinalSettlement = (method: PaymentMethod) => {
    onSettleFolio(booking.id, method);
    setShowSettleModal(false);
    alert(`Folio settled successfully via ${method}. Room ${room.number} is now marked for cleaning.`);
    navigate('/hotel');
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 animate-in fade-in duration-500">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <button onClick={() => navigate('/hotel')} className="flex items-center gap-2 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-colors"><ArrowLeft size={18} /> Back to Desk</button>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 shadow-sm"><Printer size={16} /> Print Folio</button>
          {booking.status === 'ACTIVE' && (
            <button onClick={() => setShowSettleModal(true)} className="px-8 py-3 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-100 hover:bg-green-700 active:scale-95 transition-all"><ShieldCheck size={16} /> Settle Bill & Checkout</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[48px] shadow-2xl border border-gray-100 overflow-hidden print:shadow-none print:rounded-none">
        <div className="p-12 bg-gray-900 text-white flex flex-col md:flex-row justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-green-500 p-5 rounded-2xl"><Building size={40} /></div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase">{businessSettings.restaurantName}</h1>
              <p className="text-gray-400 text-[10px] font-black tracking-widest uppercase mt-1">Guest Folio & Invoice • #{booking.id.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <div className="text-right flex flex-col justify-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Payable</p>
            <h2 className="text-5xl font-black tracking-tighter text-green-400">{formatCurrency(grandTotal)}</h2>
          </div>
        </div>

        <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-gray-100">
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Guest Details</p>
              <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                 <h3 className="text-2xl font-black text-gray-900">{booking.guestName}</h3>
                 <p className="text-sm font-bold text-gray-500 mt-2 flex items-center gap-2"><Phone size={14} className="text-gray-300" /> {booking.phone}</p>
                 {booking.aadhaarNumber && (
                   <p className="text-xs font-black text-blue-600 mt-2 flex items-center gap-2 uppercase"><Fingerprint size={14} className="text-blue-400" /> Aadhaar: {booking.aadhaarNumber}</p>
                 )}
              </div>
           </div>
           <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Stay Summary</p>
              <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 grid grid-cols-2 gap-8">
                 <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Room Allocation</p>
                    <p className="text-lg font-black text-blue-900 leading-none">{room.number} ({room.type})</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Duration</p>
                    <p className="text-lg font-black text-blue-900 leading-none">{stayDuration} Night{stayDuration > 1 ? 's' : ''}</p>
                 </div>
                 <div className="col-span-2">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Check-In Timestamp</p>
                    <p className="text-sm font-bold text-blue-900">{formatDateTime(booking.checkIn)}</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-0">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-12 py-6">Service Description</th>
                <th className="px-12 py-6 text-center">Qty / Base</th>
                <th className="px-12 py-6 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="px-12 py-8">
                  <p className="font-black text-gray-900">Room Accommodation Charges</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Daily rate: {formatCurrency(room.price)}</p>
                </td>
                <td className="px-12 py-8 text-center font-bold text-gray-500">{stayDuration} Night{stayDuration > 1 ? 's' : ''}</td>
                <td className="px-12 py-8 text-right font-black text-gray-900">{formatCurrency(roomTotal)}</td>
              </tr>
              {roomOrders.length > 0 && (
                <tr>
                  <td className="px-12 py-8">
                    <p className="font-black text-gray-900">Food, Beverage & Room Service</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Aggregated restaurant orders</p>
                  </td>
                  <td className="px-12 py-8 text-center font-bold text-gray-500">{roomOrders.length} Order{roomOrders.length > 1 ? 's' : ''}</td>
                  <td className="px-12 py-8 text-right font-black text-gray-900">{formatCurrency(foodTotal)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-12 bg-gray-50 border-t flex flex-col md:flex-row justify-between items-end gap-12">
           <div className="flex-1 max-w-sm text-xs text-gray-400 leading-relaxed">
             <p className="font-bold text-gray-500 uppercase text-[9px] mb-2">Terms & Conditions</p>
             <p>This guest folio is an official tax invoice issued by {businessSettings.restaurantName}. Please verify all line items before settlement. Taxes are calculated as per prevailing GST norms for {businessSettings.gstNumber}.</p>
           </div>
           <div className="w-80 space-y-3">
             <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest"><span>Net Service Value</span><span>{formatCurrency(netTotal)}</span></div>
             <div className="flex justify-between text-xs font-bold text-gray-400"><span>CGST ({businessSettings.cgstRate}%)</span><span>{formatCurrency(cgst)}</span></div>
             <div className="flex justify-between text-xs font-bold text-gray-400"><span>SGST ({businessSettings.cgstRate}%)</span><span>{formatCurrency(sgst)}</span></div>
             <div className="h-px bg-gray-200 my-2" />
             <div className="flex justify-between items-center"><span className="text-base font-black text-gray-900 uppercase tracking-tight">Invoice Total</span><span className="text-3xl font-black text-green-600">{formatCurrency(grandTotal)}</span></div>
           </div>
        </div>
      </div>

      {/* Settle Modal */}
      {showSettleModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start mb-8">
                 <div className="flex items-center gap-4">
                    <div className="bg-green-50 p-4 rounded-2xl text-green-600 shadow-inner"><Wallet size={32} /></div>
                    <div>
                       <h2 className="text-2xl font-black text-gray-900 tracking-tight">Bill Settlement</h2>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio: {booking.id.slice(-6).toUpperCase()}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowSettleModal(false)} className="p-2 text-gray-300 hover:text-gray-900 transition-colors"><X size={24} /></button>
              </div>

              <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 mb-8 text-center">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Final Amount Due</p>
                 <p className="text-4xl font-black text-gray-900">{formatCurrency(grandTotal)}</p>
              </div>

              <div className="space-y-3">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2 text-center">Select Payment Method</p>
                 <PaymentBtn label="Cash Payment" icon={Wallet} onClick={() => handleFinalSettlement(PaymentMethod.CASH)} color="hover:bg-green-50 hover:text-green-600" />
                 <PaymentBtn label="UPI / QR Scan" icon={Smartphone} onClick={() => handleFinalSettlement(PaymentMethod.UPI)} color="hover:bg-blue-50 hover:text-blue-600" />
                 <PaymentBtn label="Credit/Debit Card" icon={CreditCard} onClick={() => handleFinalSettlement(PaymentMethod.CARD)} color="hover:bg-purple-50 hover:text-purple-600" />
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50">
                 <button onClick={() => setShowSettleModal(false)} className="w-full py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-all">Cancel & Re-review</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const PaymentBtn = ({ label, icon: Icon, onClick, color }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl transition-all group ${color}`}>
     <div className="flex items-center gap-4">
        <div className="bg-gray-50 p-2.5 rounded-xl group-hover:bg-white transition-colors"><Icon size={20} /></div>
        <span className="font-black text-sm uppercase tracking-tight">{label}</span>
     </div>
     <ArrowLeft className="rotate-180 text-gray-300 group-hover:text-current transition-colors" size={18} />
  </button>
);

export default RoomFolioView;
