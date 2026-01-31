
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, Plus, Minus, Trash2, Printer, ShoppingCart, 
  X, PauseCircle, Bed, Info, History, Clock, 
  MessageSquare, ChevronRight, CheckCircle2,
  PlusCircle, Edit3, DollarSign, Utensils,
  Hash, ArrowRight, ArrowLeft, Receipt, Fingerprint
} from 'lucide-react';
import { MenuItem, Table, CartItem, OrderType, Order, PaymentMethod, Booking } from '../types';
import { calculateCompleteBill } from '../utils/calculations';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface POSViewProps {
  menuItems: MenuItem[];
  tables: Table[];
  activeBookings: Booking[];
  onAddOrder: (order: Order) => void;
  heldOrders: {id: string, cart: CartItem[], timestamp: number}[];
  setHeldOrders: React.Dispatch<React.SetStateAction<{id: string, cart: CartItem[], timestamp: number}[]>>;
  recentOrders: Order[];
}

const POSView: React.FC<POSViewProps> = ({ 
  menuItems, tables, activeBookings, onAddOrder, 
  heldOrders, setHeldOrders, recentOrders 
}) => {
  const location = useLocation();
  const [cart, setCart] = useState<(CartItem & { note?: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderType, setOrderType] = useState<OrderType>(OrderType.DINE_IN);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [aadhaarNumber, setAadhaarNumber] = useState<string>('');
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'menu' | 'held' | 'history'>('menu');
  const [mobileView, setMobileView] = useState<'MENU' | 'FOLIO'>('MENU');
  
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemData, setCustomItemData] = useState({ name: '', price: '' });
  const [successReceipt, setSuccessReceipt] = useState<Order | null>(null);

  // Auto-fill customer details if a booking is selected
  useEffect(() => {
    const booking = activeBookings.find(b => b.id === selectedBookingId);
    if (booking) {
      setCustomerName(booking.guestName);
      setAadhaarNumber(booking.aadhaarNumber || '');
    }
  }, [selectedBookingId, activeBookings]);

  // Handle cross-navigation from Tables view
  useEffect(() => {
    if (location.state?.selectedTableId) {
      setSelectedTable(location.state.selectedTableId);
      setOrderType(OrderType.DINE_IN);
    }
  }, [location.state]);

  const bill = useMemo(() => {
    return calculateCompleteBill(cart);
  }, [cart]);

  const categories = useMemo(() => ['All', ...new Set(menuItems.map(item => item.category))], [menuItems]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = useCallback((item: MenuItem | CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, gstPercent: item.gstPercent || 5 }];
    });
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const handleCheckout = (paymentMethod: PaymentMethod) => {
    if (cart.length === 0) return alert("Your cart is empty. Please add some items.");
    
    if (orderType === OrderType.DINE_IN && !selectedTable) {
      return alert("Please select a table for Dine-in service.");
    }
    
    if ((orderType === OrderType.ROOM_SERVICE || paymentMethod === PaymentMethod.CHARGE_TO_ROOM) && !selectedBookingId) {
      return alert("A valid Hotel Guest folio must be selected for Room Service or Charge-to-Room payments.");
    }

    const selectedBooking = activeBookings.find(b => b.id === selectedBookingId);

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      items: JSON.parse(JSON.stringify(cart)), // Deep clone
      type: orderType,
      subtotal: bill.subtotal,
      tax: bill.tax,
      serviceCharge: bill.serviceCharge,
      discount: 0,
      total: bill.total,
      status: 'PENDING',
      timestamp: Date.now(),
      tableId: orderType === OrderType.DINE_IN ? selectedTable : undefined,
      roomId: (orderType === OrderType.ROOM_SERVICE || paymentMethod === PaymentMethod.CHARGE_TO_ROOM) 
              ? selectedBooking?.roomId 
              : undefined,
      customerName: customerName || selectedBooking?.guestName || "Walk-in Guest",
      aadhaarNumber: aadhaarNumber || selectedBooking?.aadhaarNumber || undefined,
      paymentMethod
    };

    try {
      onAddOrder(newOrder);
      setSuccessReceipt(newOrder);
      setCart([]);
      setSelectedTable('');
      setSelectedBookingId('');
      setCustomerName('');
      setAadhaarNumber('');
      setMobileView('MENU');
    } catch (err) {
      console.error("Critical: Bill settlement failed:", err);
      alert("System Error: Order could not be committed. Please check your data.");
    }
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    setHeldOrders(prev => [...prev, { id: `held-${Date.now()}`, cart: [...cart], timestamp: Date.now() }]);
    setCart([]);
    alert("Order held successfully.");
  };

  const handleAddCustomItem = () => {
    const price = parseFloat(customItemData.price);
    if (!customItemData.name || isNaN(price)) return alert("Invalid custom item data.");
    
    const newItem: CartItem = {
      id: `custom-${Date.now()}`,
      name: customItemData.name,
      price: price,
      category: 'Custom',
      isVeg: true,
      gstPercent: 5,
      quantity: 1
    };
    addToCart(newItem);
    setCustomItemData({ name: '', price: '' });
    setShowCustomItemModal(false);
  };

  return (
    <div className="relative h-[calc(100vh-140px)] animate-in fade-in duration-500 overflow-hidden bg-white lg:rounded-[40px] border border-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] h-full overflow-hidden">
        
        {/* Left Pane: Menu and Tabs */}
        <div className={`flex flex-col min-h-0 overflow-hidden p-4 lg:p-6 ${mobileView === 'MENU' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="flex gap-2 mb-4 shrink-0 overflow-x-auto pb-1 no-scrollbar">
            <TabBtn icon={ShoppingCart} label="Menu" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
            <TabBtn icon={PauseCircle} label={`Held (${heldOrders.length})`} active={activeTab === 'held'} onClick={() => setActiveTab('held')} />
            <TabBtn icon={History} label="History" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0 space-y-4 pb-24 lg:pb-6">
            {activeTab === 'menu' && (
              <>
                <div className="bg-gray-50 p-3 rounded-2xl flex flex-col sm:flex-row gap-3 items-center sticky top-0 z-10 shadow-sm">
                  <div className="relative w-full sm:flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" placeholder="Search menu..." className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl outline-none font-bold text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <div className="flex gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl whitespace-nowrap text-[10px] font-black uppercase transition-all ${selectedCategory === cat ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-white text-gray-400 border border-gray-100'}`}>{cat}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredItems.map(item => (
                    <div key={item.id} onClick={() => addToCart(item)} className="bg-gray-50 rounded-[28px] p-2 cursor-pointer hover:bg-white hover:shadow-xl transition-all flex flex-col border border-transparent hover:border-green-100">
                      <div className="aspect-square bg-white rounded-2xl mb-2 overflow-hidden shadow-inner"><img src={item.image || `https://picsum.photos/seed/${item.id}/200`} className="w-full h-full object-cover" /></div>
                      <div className="px-1 flex-1">
                        <h3 className="font-bold text-gray-900 text-xs truncate leading-tight">{item.name}</h3>
                        <p className="text-green-600 font-black text-xs mt-0.5">{formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {activeTab === 'history' && (
              <div className="space-y-3">
                {recentOrders.map(order => (
                  <div key={order.id} className="p-5 bg-gray-50 rounded-[32px] border border-gray-100 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-green-600 transition-colors shadow-sm">
                         <Receipt size={24} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">#{order.id.split('-')[1]}</p>
                         <h4 className="text-sm font-black text-gray-900 leading-none mb-1">{formatCurrency(order.total)}</h4>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">{formatDateTime(order.timestamp)}</p>
                      </div>
                    </div>
                    <button onClick={() => setSuccessReceipt(order)} className="p-3 bg-white text-gray-400 hover:text-blue-600 rounded-xl shadow-sm border border-gray-100"><Printer size={18} /></button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'held' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {heldOrders.map(held => (
                  <div key={held.id} className="bg-orange-50/50 p-5 rounded-[28px] border border-orange-100 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{new Date(held.timestamp).toLocaleTimeString()}</span>
                         <button onClick={() => setHeldOrders(prev => prev.filter(h => h.id !== held.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                      <div className="space-y-1 mb-4">
                        {held.cart.map((i, idx) => <p key={idx} className="text-[10px] font-bold text-gray-500">{i.quantity}x {i.name}</p>)}
                      </div>
                    </div>
                    <button onClick={() => { setCart(held.cart); setHeldOrders(prev => prev.filter(h => h.id !== held.id)); setActiveTab('menu'); setMobileView('FOLIO'); }} className="w-full py-3 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100">Resume Billing</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Floating Checkout Button for Mobile */}
          {cart.length > 0 && (
            <button 
              onClick={() => setMobileView('FOLIO')}
              className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10"
            >
              <div className="bg-green-600 p-1.5 rounded-lg text-white font-black text-[10px]">{cart.length}</div>
              <span className="font-black text-xs uppercase tracking-widest">View Bill Folio • {formatCurrency(bill.total)}</span>
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* Right Pane: Checkout Sidebar */}
        <div className={`flex flex-col bg-gray-50 border-l border-gray-100 h-full overflow-hidden z-20 ${mobileView === 'FOLIO' ? 'fixed inset-0 lg:relative lg:flex bg-white' : 'hidden lg:flex'}`}>
          <div className="p-4 lg:p-6 border-b border-gray-100 bg-white shrink-0">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setMobileView('MENU')} className="lg:hidden p-2 text-gray-400 hover:text-gray-900 transition-colors"><ArrowLeft size={20} /></button>
                <div className="bg-gray-900 p-2 rounded-lg text-white"><Receipt size={16} /></div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Bill Folio</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCustomItemModal(true)} title="Add Off-Menu Item" className="p-2 bg-white border border-gray-100 text-blue-600 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"><PlusCircle size={18} /></button>
                <button onClick={() => setCart([])} title="Clear Cart" className="p-2 bg-white border border-gray-100 text-gray-300 hover:text-red-500 rounded-lg shadow-sm transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 p-1 bg-gray-50 border border-gray-100 rounded-xl mb-4">
              {Object.values(OrderType).map(type => (
                <button key={type} onClick={() => setOrderType(type)} className={`py-2 text-[8px] font-black rounded-lg uppercase tracking-widest transition-all ${orderType === type ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>{type.split(' ')[0]}</button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input type="text" placeholder="Guest Name" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-green-500 transition-colors" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                </div>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                  <input type="text" placeholder="Aadhaar No." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-green-500 transition-colors" value={aadhaarNumber} onChange={e => setAadhaarNumber(e.target.value)} />
                </div>
              </div>

              {orderType === OrderType.DINE_IN && (
                <div className="relative">
                  <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black outline-none focus:border-green-500 transition-colors appearance-none" value={selectedTable} onChange={e => setSelectedTable(e.target.value)}>
                    <option value="">Choose Table</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>
                        Table {t.number} {t.status === 'Occupied' ? '(Occupied)' : '(Available)'}
                      </option>
                    ))}
                  </select>
                  {!selectedTable && <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-red-500 animate-pulse"><Info size={14} /></div>}
                </div>
              )}
              <div className="relative">
                <select className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-black text-blue-700 outline-none focus:border-blue-500 transition-colors appearance-none" value={selectedBookingId} onChange={e => setSelectedBookingId(e.target.value)}>
                  <option value="">Link to Hotel Folio (Optional)</option>
                  {activeBookings.map(b => <option key={b.id} value={b.id}>Room {b.roomId.replace('r', '')} - {b.guestName}</option>)}
                </select>
                {selectedBookingId && <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600"><CheckCircle2 size={14} /></div>}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 custom-scrollbar min-h-0 bg-white">
            {cart.map(item => (
              <div key={item.id} className="flex flex-col gap-2 p-3 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate leading-tight">{item.name}</p>
                    <p className="text-[10px] font-black text-green-600 mt-0.5">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-400 hover:text-red-500"><Minus size={12} /></button>
                    <span className="px-2 text-[10px] font-black w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-400 hover:text-green-600"><Plus size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50">
                <Utensils size={40} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Folio is Empty</p>
              </div>
            )}
          </div>

          <div className="p-4 lg:p-6 border-t border-gray-100 bg-gray-50/50 shrink-0">
            <div className="space-y-1 mb-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-gray-900">{formatCurrency(bill.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
                <span>Tax & Service Charge</span>
                <span className="text-gray-900">{formatCurrency(bill.tax + bill.serviceCharge)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-1">
                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Grand Total</span>
                <span className="text-2xl font-black text-green-600 tracking-tighter">{formatCurrency(bill.total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
               <button onClick={handleHoldOrder} className="col-span-2 py-3 bg-white border border-gray-200 text-gray-400 hover:text-gray-600 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all">Hold Order</button>
               <button onClick={() => handleCheckout(PaymentMethod.CASH)} className="bg-gray-900 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-gray-200 hover:bg-black transition-all">Settle Cash</button>
               <button onClick={() => handleCheckout(PaymentMethod.UPI)} className="bg-green-600 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-100 hover:bg-green-700 transition-all">Settle UPI</button>
            </div>
            
            <button 
              disabled={!selectedBookingId}
              onClick={() => handleCheckout(PaymentMethod.CHARGE_TO_ROOM)} 
              className={`w-full py-3.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 transition-all uppercase tracking-widest border-2 ${
                selectedBookingId 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700' 
                  : 'bg-white border-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              <Bed size={16} /> Charge to Room Folio
            </button>
          </div>
        </div>
      </div>
      {/* Receipts and other modals remain unchanged... */}
    </div>
  );
};

const TabBtn = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`px-4 py-2.5 rounded-xl font-black text-[9px] flex items-center gap-2 transition-all uppercase tracking-widest border ${active ? 'bg-white border-transparent shadow-md text-gray-900 scale-105' : 'text-gray-400 border-transparent hover:bg-gray-50'}`}>
    <Icon size={14} strokeWidth={active ? 3 : 2} className={active ? 'text-green-600' : ''} /> {label}
  </button>
);

export default POSView;
