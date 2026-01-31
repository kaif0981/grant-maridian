
import React, { useState, useMemo, useRef } from 'react';
import { MenuItem } from '../types';
import { 
  Utensils, Plus, Search, Filter, Edit2, Trash2, 
  X, Image as ImageIcon, CheckCircle2, DollarSign, 
  Leaf, Info, Save, Layers, Upload, Loader2
} from 'lucide-react';

interface MenuViewProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
}

const FOOD_PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1476224488681-aba3553ef8c7?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=800'
];

const MenuView: React.FC<MenuViewProps> = ({ menuItems, setMenuItems }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showEditModal, setShowEditModal] = useState<MenuItem | 'NEW' | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<MenuItem>>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => ['All', ...new Set(menuItems.map(item => item.category))], [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const handleOpenEdit = (item: MenuItem | 'NEW') => {
    if (item === 'NEW') {
      setEditFormData({
        name: '',
        category: 'Main Course',
        price: 0,
        gstPercent: 5,
        isVeg: true,
        image: FOOD_PRESET_IMAGES[0]
      });
    } else {
      setEditFormData({ ...item });
    }
    setShowEditModal(item);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size too large. Please upload an image under 2MB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditFormData(prev => ({ ...prev, image: reader.result as string }));
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!editFormData.name || !editFormData.price) {
      alert("Please enter Name and Price.");
      return;
    }

    if (showEditModal === 'NEW') {
      const newItem: MenuItem = {
        ...editFormData as MenuItem,
        id: `dish-${Date.now()}`
      };
      setMenuItems(prev => [...prev, newItem]);
    } else if (typeof showEditModal === 'object') {
      setMenuItems(prev => prev.map(item => item.id === showEditModal.id ? { ...item, ...editFormData } : item));
    }
    setShowEditModal(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Remove this dish from the menu?")) {
      setMenuItems(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Menu Lab</h1>
          <p className="text-gray-400 text-sm font-medium">Engineer your recipes and dish presentation.</p>
        </div>
        <button 
          onClick={() => handleOpenEdit('NEW')}
          className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-green-100 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={20} strokeWidth={3} /> Create New Dish
        </button>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          <input 
            type="text" 
            placeholder="Search dish name or code..."
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold focus:bg-white focus:border-green-500/20 transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar w-full md:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedCategory === cat ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm group overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 flex flex-col">
            <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
              <img 
                src={item.image || `https://picsum.photos/seed/${item.id}/400/300`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                alt={item.name} 
              />
              <div className="absolute top-3 left-3 flex gap-2">
                 <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${item.isVeg ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    <Leaf size={10} /> {item.isVeg ? 'Veg' : 'Non-Veg'}
                 </div>
                 <div className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-900 border border-white/20">
                    GST {item.gstPercent}%
                 </div>
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                 <button onClick={() => handleOpenEdit(item)} className="p-3 bg-white text-gray-900 rounded-2xl hover:bg-green-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300"><Edit2 size={18} /></button>
                 <button onClick={() => handleDelete(item.id)} className="p-3 bg-white text-gray-900 rounded-2xl hover:bg-red-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="mb-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">{item.category}</span>
                <h3 className="text-base font-black text-gray-900 leading-tight">{item.name}</h3>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                <p className="text-xl font-black text-green-600">₹{item.price.toLocaleString()}</p>
                <div className="text-[9px] font-black text-gray-300 uppercase">ID: {item.id.slice(-6).toUpperCase()}</div>
              </div>
            </div>
          </div>
        ))}

        <div 
          onClick={() => handleOpenEdit('NEW')}
          className="bg-white rounded-[32px] border-4 border-dashed border-gray-100 hover:border-green-200 hover:bg-green-50/20 transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center group min-h-[300px]"
        >
           <div className="w-16 h-16 bg-gray-50 rounded-[20px] flex items-center justify-center text-gray-300 group-hover:bg-green-600 group-hover:text-white transition-all mb-4">
             <Plus size={32} strokeWidth={3} />
           </div>
           <h3 className="font-black text-gray-900">Add New Dish</h3>
           <p className="text-xs font-bold text-gray-400 mt-1">Start fresh with a new recipe.</p>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[48px] p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
             <div className="flex justify-between items-start mb-8">
               <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-green-50 text-green-600 rounded-[24px] flex items-center justify-center">
                   <Utensils size={32} />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-gray-900 tracking-tight">{showEditModal === 'NEW' ? 'New Recipe' : 'Modify Dish'}</h2>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Configuration Engine</p>
                 </div>
               </div>
               <button onClick={() => setShowEditModal(null)} className="p-3 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 rounded-2xl"><X size={24} /></button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2 space-y-4">
                   <div className="flex justify-between items-end px-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Visual Presentation</label>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:text-blue-700 transition-colors"
                      >
                        {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        Upload Custom Image
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                   </div>
                   
                   {/* Selected Preview or Custom Upload */}
                   <div className="w-full h-48 rounded-[32px] overflow-hidden bg-gray-50 border border-gray-100 relative group">
                      <img src={editFormData.image} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-[10px] font-black uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">Active View</span>
                      </div>
                   </div>

                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 block mt-4">Quick Presets</label>
                   <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                     {FOOD_PRESET_IMAGES.map((img, idx) => (
                       <div 
                         key={idx} 
                         onClick={() => setEditFormData({ ...editFormData, image: img })}
                         className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-4 transition-all ${editFormData.image === img ? 'border-green-500 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                       >
                         <img src={img} className="w-full h-full object-cover" />
                       </div>
                     ))}
                   </div>
                   <div className="flex items-center gap-3 mt-4">
                      <div className="flex-1 relative">
                        <ImageIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input 
                          type="text" 
                          placeholder="Or paste custom Image URL..." 
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border-none text-xs font-bold outline-none"
                          value={editFormData.image || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, image: e.target.value })}
                        />
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Dish Name</label>
                      <input 
                        type="text" 
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all" 
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        placeholder="e.g. Garlic Naan"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Category</label>
                      <select 
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all"
                        value={editFormData.category || 'Main Course'}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      >
                         <option value="Main Course">Main Course</option>
                         <option value="Starters">Starters</option>
                         <option value="Breads">Breads</option>
                         <option value="Beverages">Beverages</option>
                         <option value="Desserts">Desserts</option>
                         <option value="Specials">Specials</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Price (₹)</label>
                        <input 
                          type="number" 
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all" 
                          value={editFormData.price || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">GST (%)</label>
                        <select 
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-bold focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all"
                          value={editFormData.gstPercent || 5}
                          onChange={(e) => setEditFormData({ ...editFormData, gstPercent: parseInt(e.target.value) })}
                        >
                           <option value={5}>5% (Basic)</option>
                           <option value={12}>12% (Std)</option>
                           <option value={18}>18% (Luxury)</option>
                        </select>
                      </div>
                   </div>
                   
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Dietary Marker</label>
                      <div className="flex gap-2">
                         <button 
                           onClick={() => setEditFormData({ ...editFormData, isVeg: true })}
                           className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editFormData.isVeg ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                         >
                           <Leaf size={14} /> Vegetarian
                         </button>
                         <button 
                           onClick={() => setEditFormData({ ...editFormData, isVeg: false })}
                           className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!editFormData.isVeg ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                         >
                           <Info size={14} /> Non-Veg
                         </button>
                      </div>
                   </div>
                </div>
             </div>

             <div className="flex gap-4 mt-12 pt-8 border-t border-gray-50">
               <button onClick={() => setShowEditModal(null)} className="flex-1 py-4 font-black text-xs text-gray-400 hover:bg-gray-50 rounded-2xl transition-all">Discard</button>
               <button onClick={handleSave} className="flex-2 bg-gray-900 text-white px-10 py-5 rounded-3xl font-black text-xs shadow-2xl shadow-gray-200 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"><Save size={18} /> Deploy to Menu</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuView;
