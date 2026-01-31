
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Grid3X3, Package, Users, Settings, 
  TrendingUp, Menu as MenuIcon, Smartphone, Bed, ChefHat, UserCircle, Search, Bell, UtensilsCrossed,
  LogOut, ShieldCheck, Store, Key
} from 'lucide-react';

import POSView from './views/POSView.tsx';
import TableView from './views/TableView.tsx';
import InventoryView from './views/InventoryView.tsx';
import AnalyticsView from './views/AnalyticsView.tsx';
import CRMView from './views/CRMView.tsx';
import HotelView from './views/HotelView.tsx';
import RoomFolioView from './views/RoomFolioView.tsx';
import KDSView from './views/KDSView.tsx';
import StaffView from './views/StaffView.tsx';
import SettingsView from './views/SettingsView.tsx';
import MenuView from './views/MenuView.tsx';
import AuthView from './views/AuthView.tsx';

import { Order, MenuItem, Table, InventoryItem, TableStatus, Room, RoomStatus, Booking, PaymentMethod, Staff, CartItem, Payout, UserRole, AuthCredentials } from './types';
import { INITIAL_MENU, INITIAL_TABLES, INITIAL_INVENTORY, INITIAL_ROOMS, INITIAL_STAFF } from './constants';
import { db } from './firebase';
import { calculateCompleteBill } from './utils/calculations';

const INITIAL_AUTH: AuthCredentials = {
  adminPass: '1234',
  restaurantPass: 'rest123',
  roomsPass: 'room123',
  hotelName: '',
  hotelEmail: '',
  isConfigured: false
};

const SidebarItem = ({ to, icon: Icon, label, active, visible }: { to: string, icon: any, label: string, active: boolean, visible: boolean }) => {
  if (!visible) return null;
  return (
    <Link 
      to={to} 
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
        active ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon size={20} />
      <span className="font-semibold text-sm whitespace-nowrap overflow-hidden">{label}</span>
    </Link>
  );
};

const AppContent = () => {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ role: UserRole } | null>(null);
  
  const [auth, setAuth] = useState<AuthCredentials>(() => db.get('auth', INITIAL_AUTH));
  const [menu, setMenu] = useState<MenuItem[]>(() => db.get('menu', INITIAL_MENU));
  const [orders, setOrders] = useState<Order[]>(() => db.get('orders', []));
  const [heldOrders, setHeldOrders] = useState<{id: string, cart: CartItem[], timestamp: number}[]>(() => db.get('held', []));
  const [tables, setTables] = useState<Table[]>(() => db.get('tables', INITIAL_TABLES));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => db.get('inventory', INITIAL_INVENTORY));
  const [rooms, setRooms] = useState<Room[]>(() => db.get('rooms', INITIAL_ROOMS));
  const [bookings, setBookings] = useState<Booking[]>(() => db.get('bookings', []));
  const [staff, setStaff] = useState<Staff[]>(() => db.get('staff', INITIAL_STAFF));
  const [payouts, setPayouts] = useState<Payout[]>(() => db.get('payouts', []));

  useEffect(() => {
    db.syncAll({ menu, orders, tables, inventory, rooms, bookings, staff, held: heldOrders, payouts, auth } as any);
  }, [menu, orders, tables, inventory, rooms, bookings, staff, heldOrders, payouts, auth]);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const addOrder = useCallback((newOrder: Order) => {
    if (!newOrder) return;
    setOrders(prevOrders => {
      const existingOrderIndex = newOrder.tableId 
        ? prevOrders.findIndex(o => o.tableId === newOrder.tableId && o.status !== 'COMPLETED' && o.status !== 'CANCELLED')
        : -1;

      if (existingOrderIndex !== -1) {
        const updatedOrders = [...prevOrders];
        const existingOrder = { ...updatedOrders[existingOrderIndex] };
        const mergedItems = [...existingOrder.items];
        newOrder.items.forEach(newItem => {
          const itemIdx = mergedItems.findIndex(i => i.id === newItem.id);
          if (itemIdx !== -1) {
            mergedItems[itemIdx] = { ...mergedItems[itemIdx], quantity: mergedItems[itemIdx].quantity + newItem.quantity };
          } else {
            mergedItems.push({ ...newItem });
          }
        });

        const bill = calculateCompleteBill(mergedItems);
        updatedOrders[existingOrderIndex] = {
          ...existingOrder,
          items: mergedItems,
          subtotal: bill.subtotal,
          tax: bill.tax,
          serviceCharge: bill.serviceCharge,
          total: bill.total,
          timestamp: Date.now()
        };

        setInventory(prevInv => {
          const { updatedInventory } = db.processOrder(newOrder, prevInv, menu);
          return updatedInventory;
        });

        if (newOrder.roomId) {
          setBookings(prevB => prevB.map(b => {
            if (b.roomId === newOrder.roomId && b.status === 'ACTIVE') {
              return { ...b, foodCharges: (b.foodCharges || 0) + newOrder.total, total: (b.total || 0) + newOrder.total };
            }
            return b;
          }));
        }
        return updatedOrders;
      } else {
        setInventory(prevInv => {
          const { updatedInventory } = db.processOrder(newOrder, prevInv, menu);
          return updatedInventory;
        });
        if (newOrder.tableId) {
          setTables(prev => prev.map(t => t.id === newOrder.tableId ? { ...t, status: TableStatus.OCCUPIED, currentOrderId: newOrder.id } : t));
        }
        if (newOrder.roomId) {
          setBookings(prev => prev.map(b => {
            if (b.roomId === newOrder.roomId && b.status === 'ACTIVE') {
              const currentFood = b.foodCharges || 0;
              const currentRoom = b.roomCharges || 0;
              const orderTotal = newOrder.total || 0;
              return { ...b, foodCharges: currentFood + orderTotal, total: currentRoom + currentFood + orderTotal };
            }
            return b;
          }));
        }
        return [newOrder, ...prevOrders];
      }
    });
  }, [menu]);

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => {
      const updatedOrders = prev.map(o => o.id === orderId ? { ...o, status } : o);
      if (status === 'COMPLETED') {
        const order = updatedOrders.find(o => o.id === orderId);
        if (order?.tableId) {
          setTables(tPrev => tPrev.map(t => t.id === order.tableId ? { ...t, status: TableStatus.VACANT, currentOrderId: undefined } : t));
        }
      }
      return updatedOrders;
    });
  };

  const handleCheckIn = (roomId: string, guestName: string, phone: string, days: number = 1, checkInTime: number = Date.now(), aadhaar?: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const roomCharges = room.price * days;
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      roomId, guestName, phone,
      aadhaarNumber: aadhaar,
      checkIn: checkInTime,
      expectedCheckOut: checkInTime + (days * 86400000),
      status: 'ACTIVE',
      foodCharges: 0,
      roomCharges: roomCharges,
      total: roomCharges
    };
    setBookings(prev => [...prev, newBooking]);
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: RoomStatus.OCCUPIED, currentBookingId: newBooking.id } : r));
  };

  const handleReserve = (roomId: string, guestName: string, phone: string, days: number = 1, startDate: number = Date.now(), aadhaar?: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const roomCharges = room.price * days;
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      roomId, guestName, phone,
      aadhaarNumber: aadhaar,
      checkIn: startDate,
      expectedCheckOut: startDate + (days * 86400000),
      status: 'RESERVED',
      foodCharges: 0,
      roomCharges: roomCharges,
      total: roomCharges
    };
    setBookings(prev => [...prev, newBooking]);
  };

  const handleSettleFolio = (bookingId: string, paymentMethod: PaymentMethod) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'COMPLETED', checkOut: Date.now(), paymentMethod } : b));
    setRooms(prev => prev.map(r => r.id === booking.roomId ? { ...r, status: RoomStatus.DIRTY, currentBookingId: undefined } : r));
  };

  const handleUpdateBookingStatus = (bookingId: string, status: Booking['status']) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        if (status === 'ACTIVE') {
          setRooms(roomsPrev => roomsPrev.map(r => r.id === b.roomId ? { ...r, status: RoomStatus.OCCUPIED, currentBookingId: b.id } : r));
        }
        return { ...b, status };
      }
      return b;
    }));
  };

  if (!currentUser) {
    return <AuthView auth={auth} setAuth={setAuth} onLogin={(role) => setCurrentUser({ role })} />;
  }

  const role = currentUser.role;
  const isAdm = role === 'ADMIN';
  const isRes = role === 'RESTAURANT' || isAdm;
  const isRoom = role === 'ROOMS' || isAdm;

  const getPageTitle = () => {
    const path = location.pathname;
    const titles: Record<string, string> = {
      '/': 'DASHBOARD', '/pos': 'POS BILLING', '/menu': 'MENU LAB',
      '/tables': 'TABLES', '/kds': 'KITCHEN', '/hotel': 'FRONT DESK',
      '/inventory': 'INVENTORY', '/staff': 'STAFF', '/crm': 'CUSTOMERS', '/settings': 'SETTINGS'
    };
    return titles[path] || 'DASHBOARD';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 lg:hidden hover:bg-gray-100 rounded-lg">
            <MenuIcon size={20} />
          </button>
          <div className="flex items-center gap-3">
             <div className="bg-green-600 p-2 rounded-lg text-white"><Store size={18} /></div>
             <div className="flex flex-col">
               <h1 className="text-sm font-black text-gray-900 tracking-tight">{auth.hotelName || 'DineDash Pro'}</h1>
               <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">{role} PORTAL • {getPageTitle()}</span>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-400 hover:text-gray-900"><Bell size={20} /><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" /></button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </header>

      <aside className={`${isSidebarOpen ? 'w-60' : 'w-0 lg:w-20'} bg-white border-r border-gray-100 flex flex-col transition-all duration-300 z-40 pt-16`}>
        <nav className="flex-1 px-3 py-6 space-y-1">
          <SidebarItem to="/" icon={LayoutDashboard} label={isSidebarOpen ? "Dashboard" : ""} active={location.pathname === '/'} visible={isAdm} />
          <SidebarItem to="/pos" icon={ShoppingCart} label={isSidebarOpen ? "POS Billing" : ""} active={location.pathname === '/pos'} visible={isRes} />
          <SidebarItem to="/menu" icon={UtensilsCrossed} label={isSidebarOpen ? "Menu Lab" : ""} active={location.pathname === '/menu'} visible={isAdm} />
          <SidebarItem to="/tables" icon={Grid3X3} label={isSidebarOpen ? "Tables" : ""} active={location.pathname === '/tables'} visible={isRes} />
          <SidebarItem to="/kds" icon={ChefHat} label={isSidebarOpen ? "Kitchen (KDS)" : ""} active={location.pathname === '/kds'} visible={isRes} />
          <SidebarItem to="/hotel" icon={Bed} label={isSidebarOpen ? "Front Desk" : ""} active={location.pathname.startsWith('/hotel')} visible={isRoom} />
          <SidebarItem to="/inventory" icon={Package} label={isSidebarOpen ? "Inventory" : ""} active={location.pathname === '/inventory'} visible={isRes} />
          <SidebarItem to="/staff" icon={Users} label={isSidebarOpen ? "Staff" : ""} active={location.pathname === '/staff'} visible={isAdm} />
          <SidebarItem to="/crm" icon={Users} label={isSidebarOpen ? "Customers" : ""} active={location.pathname === '/crm'} visible={isRoom} />
          <SidebarItem to="/analytics" icon={TrendingUp} label={isSidebarOpen ? "Analytics" : ""} active={location.pathname === '/analytics'} visible={isAdm} />
        </nav>
        <div className="p-4 border-t border-gray-50 mb-4">
          <SidebarItem to="/settings" icon={Settings} label={isSidebarOpen ? "Settings" : ""} active={location.pathname === '/settings'} visible={isAdm} />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative pt-20 px-6 pb-10">
        <div className="max-w-[1400px] mx-auto">
          <Routes>
            <Route path="/" element={isAdm ? <AnalyticsView orders={orders} bookings={bookings} menu={menu} /> : <Navigate to={isRes ? "/pos" : "/hotel"} />} />
            <Route path="/pos" element={isRes ? <POSView menuItems={menu} tables={tables} activeBookings={bookings.filter(b => b.status === 'ACTIVE')} onAddOrder={addOrder} heldOrders={heldOrders} setHeldOrders={setHeldOrders} recentOrders={orders.slice(0, 10)} /> : <Navigate to="/" />} />
            <Route path="/menu" element={isAdm ? <MenuView menuItems={menu} setMenuItems={setMenu} /> : <Navigate to="/" />} />
            <Route path="/tables" element={isRes ? <TableView tables={tables} orders={orders} onCompleteOrder={(id) => handleUpdateOrderStatus(id, 'COMPLETED')} /> : <Navigate to="/" />} />
            <Route path="/kds" element={isRes ? <KDSView orders={orders} onUpdateStatus={handleUpdateOrderStatus} /> : <Navigate to="/" />} />
            <Route path="/hotel" element={isRoom ? <HotelView rooms={rooms} setRooms={setRooms} bookings={bookings} onCheckIn={handleCheckIn} onCheckOut={handleSettleFolio} onReserve={handleReserve} onUpdateBookingStatus={handleUpdateBookingStatus} /> : <Navigate to="/" />} />
            <Route path="/hotel/folio/:bookingId" element={isRoom ? <RoomFolioView bookings={bookings} rooms={rooms} orders={orders} onSettleFolio={handleSettleFolio} /> : <Navigate to="/" />} />
            <Route path="/inventory" element={isRes ? <InventoryView inventory={inventory} setInventory={setInventory} /> : <Navigate to="/" />} />
            <Route path="/staff" element={isAdm ? <StaffView staff={staff} setStaff={setStaff} payouts={payouts} setPayouts={setPayouts} /> : <Navigate to="/" />} />
            <Route path="/crm" element={isRoom ? <CRMView orders={orders} bookings={bookings} /> : <Navigate to="/" />} />
            <Route path="/settings" element={isAdm ? <SettingsView auth={auth} setAuth={setAuth} /> : <Navigate to="/" />} />
          </Routes>
        </div>
      </main>
      {isSidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
