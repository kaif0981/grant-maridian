
import React from 'react';
import { Order, OrderType } from '../types';
import { Clock, CheckCircle2, Flame, ChefHat, Bell } from 'lucide-react';

interface KDSViewProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: Order['status']) => void;
}

const KDSView: React.FC<KDSViewProps> = ({ orders, onUpdateStatus }) => {
  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'KITCHEN' || o.status === 'READY');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-xl text-orange-600"><ChefHat size={24} /></div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Kitchen Display System</h2>
        </div>
        <div className="text-[10px] font-black bg-white border border-gray-100 px-4 py-2 rounded-full text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Bell size={12} className="text-orange-500" /> {pendingOrders.length} Active Orders
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {pendingOrders.map(order => {
          const isKitchen = order.status === 'KITCHEN';
          const isReady = order.status === 'READY';
          const waitTime = Math.floor((Date.now() - order.timestamp) / 60000);

          return (
            <div key={order.id} className={`bg-white rounded-[32px] border-2 shadow-sm flex flex-col overflow-hidden transition-all ${
              isReady ? 'border-green-200 bg-green-50/20' : isKitchen ? 'border-orange-200' : 'border-gray-100'
            }`}>
              <div className="p-5 border-b border-gray-50 flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black text-gray-900">#{order.id.slice(-4).toUpperCase()}</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{order.type}</p>
                  {order.tableId && <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">Table {order.tableId.replace('t','')}</span>}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-gray-400">
                  <Clock size={12} className={waitTime > 15 ? 'text-red-500' : 'text-gray-300'} />
                  {waitTime}m
                </div>
              </div>

              <div className="flex-1 p-5 space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-[10px] font-black text-gray-600">{item.quantity}</span>
                      <p className="text-sm font-bold text-gray-800">{item.name}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-gray-50/50 mt-auto grid grid-cols-2 gap-2">
                {!isReady && (
                  <button 
                    onClick={() => onUpdateStatus(order.id, isKitchen ? 'READY' : 'KITCHEN')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all ${
                      isKitchen ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-orange-500 text-white shadow-lg shadow-orange-100'
                    }`}
                  >
                    {isKitchen ? <CheckCircle2 size={16} /> : <Flame size={16} />}
                    {isKitchen ? 'MARK READY' : 'START COOK'}
                  </button>
                )}
                {isReady && (
                  <button 
                    onClick={() => onUpdateStatus(order.id, 'COMPLETED')}
                    className="col-span-2 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black"
                  >
                    <CheckCircle2 size={16} /> DELIVER & COMPLETED
                  </button>
                )}
                {!isReady && (
                  <button 
                    onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
                    className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-100 text-gray-400 rounded-2xl text-[10px] font-black hover:text-red-500 transition-colors"
                  >
                    CANCEL
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pendingOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-20">
          <ChefHat size={80} />
          <p className="text-xl font-black mt-4">Kitchen is Clear</p>
        </div>
      )}
    </div>
  );
};

export default KDSView;
