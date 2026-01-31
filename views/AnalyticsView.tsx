
import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, DollarSign, ShoppingBag, Sparkles, 
  RefreshCw, Maximize2, Zap
} from 'lucide-react';
import { Order, Booking, MenuItem } from '../types';
import { getBusinessInsights } from '../services/geminiService';
import { INITIAL_INVENTORY } from '../constants';

interface AnalyticsViewProps {
  orders: Order[];
  bookings: Booking[];
  menu: MenuItem[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ orders, bookings, menu }) => {
  const [aiInsights, setAiInsights] = useState<string>("Analyzing your data...");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Unified Revenue Calculation
  const totalRevenue = useMemo(() => {
    const restaurantSales = orders.reduce((acc, o) => acc + o.total, 0);
    // Only count roomCharges for completed hotel stays (to avoid double counting food)
    const hotelSales = bookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((acc, b) => acc + b.roomCharges, 0);
    return restaurantSales + hotelSales;
  }, [orders, bookings]);

  const totalOrders = orders.length + bookings.filter(b => b.status === 'COMPLETED').length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Real-time Profit Estimation (including Hotel Margins)
  const estimatedProfit = useMemo(() => {
    // 1. Profit from Restaurant Orders
    const restaurantProfit = orders.reduce((acc, order) => {
      const orderCost = order.items.reduce((costAcc, item) => {
        const menuItem = menu.find(m => m.id === item.id);
        if (menuItem?.recipe) {
          const recipeCost = menuItem.recipe.reduce((rAcc, r) => {
            const inv = INITIAL_INVENTORY.find(i => i.id === r.inventoryId);
            return rAcc + (r.quantity * (inv?.costPrice || 0));
          }, 0);
          return costAcc + (recipeCost * item.quantity);
        }
        return costAcc + (item.price * 0.3 * item.quantity); // Default 30% margin if no recipe
      }, 0);
      return acc + (order.total - orderCost);
    }, 0);

    // 2. Profit from Hotel Room Rents (Estimating 80% margin after cleaning/laundry)
    const hotelProfit = bookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((acc, b) => acc + (b.roomCharges * 0.8), 0);

    return restaurantProfit + hotelProfit;
  }, [orders, bookings, menu]);

  // Hourly Data covering full range (last 24 hours logic simplified to current day slots)
  const hourlyData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      const amountOrders = orders
        .filter(o => new Date(o.timestamp).getHours() === hour)
        .reduce((acc, o) => acc + o.total, 0);
      
      const amountBookings = bookings
        .filter(b => b.status === 'COMPLETED' && b.checkOut && new Date(b.checkOut).getHours() === hour)
        .reduce((acc, b) => acc + b.roomCharges, 0);

      return { 
        name: `${hour}:00`, 
        amount: Math.round(amountOrders + amountBookings) 
      };
    });
  }, [orders, bookings]);

  const fetchInsights = async () => {
    setAiInsights("AI is thinking...");
    const summary = {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      profit: estimatedProfit,
      topItems: orders.flatMap(o => o.items).reduce((acc: any, item) => {
        acc[item.name] = (acc[item.name] || 0) + item.quantity;
        return acc;
      }, {})
    };
    const insights = await getBusinessInsights(summary);
    setAiInsights(insights);
  };

  useEffect(() => {
    if (orders.length > 0 || bookings.some(b => b.status === 'COMPLETED')) {
      fetchInsights();
    }
  }, [orders, bookings]); // Refresh insights whenever data changes

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-[60] bg-gray-50 p-8 overflow-y-auto' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Business Hub</h1>
          <p className="text-gray-400 text-sm font-medium">Global intelligence for your enterprise.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchInsights} className="p-3 bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-green-600 transition-all shadow-sm">
            <RefreshCw size={20} />
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-3 bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-blue-600 transition-all shadow-sm">
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={DollarSign} color="bg-green-100 text-green-600" trend="Combined" />
        <StatCard title="Est. Profit" value={`₹${estimatedProfit.toLocaleString()}`} icon={Zap} color="bg-blue-100 text-blue-600" trend="85% Net" />
        <StatCard title="Total Counts" value={totalOrders.toString()} icon={ShoppingBag} color="bg-orange-100 text-orange-600" trend="Guests" />
        <StatCard title="Avg. Value" value={`₹${avgOrderValue.toFixed(0)}`} icon={TrendingUp} color="bg-purple-100 text-purple-600" trend="Ticket" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-black text-gray-900 mb-8">Sales Velocity (Last 24h)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorSal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9FAFB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#9CA3AF'}}
                  interval={3}
                />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="amount" stroke="#16A34A" strokeWidth={3} fill="url(#colorSal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[40px] text-white flex flex-col relative overflow-hidden shadow-2xl">
           <div className="bg-white/10 p-3 rounded-2xl w-fit mb-6">
             <Sparkles size={24} className="text-green-400" />
           </div>
           <h3 className="text-xl font-black mb-4 tracking-tight">Gemini AI Insights</h3>
           <p className="text-gray-300 text-sm leading-relaxed italic flex-1">"{aiInsights}"</p>
           <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
             <span>Market Intelligence: ACTIVE</span>
             <div className="flex gap-1">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className={`${color} p-4 rounded-2xl shadow-inner`}><Icon size={24} /></div>
      <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-tighter">{trend}</span>
    </div>
    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
    <h4 className="text-3xl font-black text-gray-900 mt-1">{value}</h4>
  </div>
);

export default AnalyticsView;
