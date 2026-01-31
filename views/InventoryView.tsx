
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Package, AlertCircle, Plus, ArrowUpRight, ArrowDownLeft, Trash2, History, Scale } from 'lucide-react';

interface InventoryViewProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

const InventoryView: React.FC<InventoryViewProps> = ({ inventory, setInventory }) => {
  const [showWasteModal, setShowWasteModal] = useState<string | null>(null);
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState('SPOILAGE');

  const updateStock = (id: string, delta: number) => {
    setInventory(prev => prev.map(item => 
      item.id === id ? { ...item, stock: Math.max(0, parseFloat((item.stock + delta).toFixed(2))) } : item
    ));
  };

  const handleWasteSubmit = () => {
    if (showWasteModal && wasteQty) {
      updateStock(showWasteModal, -parseFloat(wasteQty));
      setShowWasteModal(null);
      setWasteQty('');
      alert("Wastage recorded and stock adjusted.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Stock & Procurement</h1>
          <p className="text-gray-400 text-sm font-medium">Monitor ingredients, handle wastage, and update stock levels.</p>
        </div>
        <div className="flex gap-4">
           <button className="bg-white border border-gray-100 px-6 py-3 rounded-2xl font-black text-xs text-gray-500 flex items-center gap-2 hover:bg-gray-50 transition-all">
             <History size={16} /> Audit Log
           </button>
           <button className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-xl shadow-green-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
             <Plus size={18} /> New Shipment
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-6">Ingredient</th>
              <th className="px-8 py-6">Current Level</th>
              <th className="px-8 py-6">Threshold</th>
              <th className="px-8 py-6">Cost / Unit</th>
              <th className="px-8 py-6 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {inventory.map(item => {
              const isLowStock = item.stock <= item.minLevel;
              return (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl shadow-sm ${isLowStock ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{item.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase">#{item.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>{item.stock}</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase">{item.unit}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-gray-400">{item.minLevel} {item.unit}</span>
                  </td>
                  <td className="px-8 py-6 font-black text-sm text-gray-900">₹{item.costPrice}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setShowWasteModal(item.id)}
                        className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        title="Record Waste"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        onClick={() => updateStock(item.id, 1)}
                        className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"
                        title="Inbound Ship"
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-orange-50 p-8 rounded-[40px] border border-orange-100 relative overflow-hidden">
           <AlertCircle size={80} className="absolute -right-5 -bottom-5 text-orange-200 opacity-50" />
           <div className="relative z-10">
              <h4 className="text-xl font-black text-orange-900 flex items-center gap-3 mb-4">
                <AlertCircle size={24} /> Supply Alert
              </h4>
              <p className="text-orange-800 text-sm font-bold leading-relaxed mb-8 max-w-sm">
                Inventory audit detected {inventory.filter(i => i.stock <= i.minLevel).length} items below safety thresholds. Replenish immediately to prevent kitchen downtime.
              </p>
              <button className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95">
                Generate PO for All
              </button>
           </div>
        </div>
        <div className="bg-blue-900 p-8 rounded-[40px] text-white flex flex-col justify-between">
           <div>
              <Scale size={24} className="text-blue-400 mb-6" />
              <h4 className="text-xl font-black mb-4">Inventory Valuation</h4>
              <p className="text-blue-300 text-sm font-bold">Total stock asset value based on last purchase price.</p>
           </div>
           <p className="text-3xl font-black mt-8">₹{inventory.reduce((acc, i) => acc + (i.stock * i.costPrice), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Wastage Modal */}
      {showWasteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center gap-4 mb-8">
                 <div className="bg-red-50 p-4 rounded-2xl text-red-600"><Trash2 size={24} /></div>
                 <div>
                    <h2 className="text-xl font-black text-gray-900">Record Wastage</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{inventory.find(i => i.id === showWasteModal)?.name}</p>
                 </div>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Quantity Lost ({inventory.find(i => i.id === showWasteModal)?.unit})</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 0.5" 
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-2 focus:ring-red-500/10 transition-all" 
                      value={wasteQty}
                      onChange={e => setWasteQty(e.target.value)}
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Reason for Waste</label>
                    <select className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold" value={wasteReason} onChange={e => setWasteReason(e.target.value)}>
                       <option value="SPOILAGE">Spoilage / Expired</option>
                       <option value="PREP">Prep Error / Burned</option>
                       <option value="THEFT">Missing / Inventory Shrink</option>
                       <option value="OTHER">Other Damage</option>
                    </select>
                 </div>
              </div>
              <div className="flex gap-4 mt-10">
                 <button onClick={() => setShowWasteModal(null)} className="flex-1 py-4 font-black text-xs text-gray-400 hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                 <button onClick={handleWasteSubmit} className="flex-2 bg-red-600 text-white px-10 py-4 rounded-2xl font-black text-xs shadow-xl shadow-red-100 hover:bg-red-700 transition-all">Confirm Deduct</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
