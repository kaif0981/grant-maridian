
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableStatus, Order } from '../types';
import { Users, Clock, CheckCircle2, ShoppingCart, X, Receipt, ChevronRight } from 'lucide-react';

interface TableViewProps {
  tables: Table[];
  orders: Order[];
  onCompleteOrder: (orderId: string) => void;
}

const TableView: React.FC<TableViewProps> = ({ tables, orders, onCompleteOrder }) => {
  const navigate = useNavigate();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const activeSelectedTable = tables.find(t => t.id === selectedTableId);
  const selectedOrder = activeSelectedTable?.currentOrderId 
    ? orders.find(o => o.id === activeSelectedTable.currentOrderId) 
    : null;

  const handleTableClick = (table: Table) => {
    if (table.status === TableStatus.VACANT) {
      // Navigate to POS with this table pre-selected
      navigate('/pos', { state: { selectedTableId: table.id } });
    } else {
      // Show order detail overlay
      setSelectedTableId(table.id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Floor Plan</h2>
          <p className="text-gray-400 text-sm font-medium">Live table occupancy and service status.</p>
        </div>
        <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-100">
            <div className="w-2 h-2 bg-green-600 rounded-full" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-full border border-orange-100">
            <div className="w-2 h-2 bg-orange-600 rounded-full" />
            <span>Serving</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {tables.map(table => {
          const currentOrder = table.currentOrderId ? orders.find(o => o.id === table.currentOrderId) : null;
          const isOccupied = table.status === TableStatus.OCCUPIED;
          
          return (
            <div 
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`group relative bg-white p-6 rounded-[32px] border-2 transition-all cursor-pointer ${
                isOccupied 
                ? 'border-orange-200 shadow-xl shadow-orange-50 scale-105 z-10' 
                : 'border-gray-50 hover:border-green-200 hover:shadow-lg'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                  isOccupied ? 'bg-orange-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-green-50 group-hover:text-green-600'
                }`}>
                  <h3 className="text-xl font-black leading-none">{table.number}</h3>
                </div>
                <div className="flex items-center text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded-lg">
                  <Users size={12} className="mr-1" />
                  {table.capacity}
                </div>
              </div>

              {currentOrder ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Current Bill</p>
                    <p className="text-lg font-black text-gray-900">₹{currentOrder.total.toFixed(0)}</p>
                  </div>
                  <div className="flex items-center text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-xl w-fit">
                    <Clock size={12} className="mr-1.5" />
                    {new Date(currentOrder.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-20 space-y-2">
                  <span className="text-[10px] font-black text-green-600 bg-green-50 px-4 py-2 rounded-xl uppercase tracking-widest group-hover:bg-green-600 group-hover:text-white transition-all">New Order</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Table Detail Drawer/Overlay */}
      {selectedTableId && activeSelectedTable && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white h-full w-full max-w-md shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black">
                  {activeSelectedTable.number}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Table Serving</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{selectedOrder.id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTableId(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Itemized Breakdown</h4>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-[10px] font-black text-gray-500">{item.quantity}x</div>
                      <span className="text-sm font-bold text-gray-800">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-gray-900">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-gray-50 rounded-[32px] space-y-3">
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>Tax (5%)</span>
                  <span>₹{selectedOrder.tax.toFixed(0)}</span>
                </div>
                <div className="h-px bg-gray-200 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total Payable</span>
                  <span className="text-2xl font-black text-green-600">₹{selectedOrder.total.toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white border-t border-gray-100 grid grid-cols-2 gap-4">
               <button 
                 onClick={() => {
                   onCompleteOrder(selectedOrder.id);
                   setSelectedTableId(null);
                 }}
                 className="col-span-2 py-5 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-100 flex items-center justify-center gap-2 hover:bg-green-700 transition-all"
               >
                 <CheckCircle2 size={18} /> Settle Bill & Free Table
               </button>
               <button 
                 onClick={() => navigate('/pos', { state: { selectedTableId: activeSelectedTable.id } })}
                 className="py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
               >
                 <ShoppingCart size={16} /> Add Items
               </button>
               <button 
                 className="py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
               >
                 <Receipt size={16} /> Print KOT
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableView;
