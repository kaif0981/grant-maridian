
import { MenuItem, Table, TableStatus, InventoryItem, Room, RoomStatus, RoomType, Staff } from './types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv1', name: 'Basmati Rice', stock: 50, unit: 'kg', minLevel: 10, costPrice: 90 },
  { id: 'inv2', name: 'Paneer', stock: 15, unit: 'kg', minLevel: 2, costPrice: 400 },
  { id: 'inv3', name: 'Chicken', stock: 20, unit: 'kg', minLevel: 5, costPrice: 220 },
  { id: 'inv4', name: 'Milk', stock: 10, unit: 'L', minLevel: 5, costPrice: 60 },
  { id: 'inv5', name: 'Onions', stock: 100, unit: 'kg', minLevel: 20, costPrice: 30 },
  { id: 'inv6', name: 'Butter', stock: 8, unit: 'kg', minLevel: 2, costPrice: 550 },
  { id: 'inv7', name: 'Spices Mix', stock: 5, unit: 'kg', minLevel: 1, costPrice: 800 },
];

export const INITIAL_MENU: MenuItem[] = [
  { 
    id: '1', name: 'Paneer Butter Masala', category: 'Main Course', price: 280, isVeg: true, gstPercent: 5,
    recipe: [{ inventoryId: 'inv2', quantity: 0.2 }, { inventoryId: 'inv6', quantity: 0.05 }]
  },
  { 
    id: '2', name: 'Chicken Biryani', category: 'Main Course', price: 350, isVeg: false, gstPercent: 5,
    recipe: [{ inventoryId: 'inv1', quantity: 0.3 }, { inventoryId: 'inv3', quantity: 0.25 }]
  },
  { id: '3', name: 'Garlic Naan', category: 'Breads', price: 60, isVeg: true, gstPercent: 5 },
  { id: '4', name: 'Veg Manchurian', category: 'Starters', price: 180, isVeg: true, gstPercent: 5 },
  { id: '5', name: 'Cold Coffee', category: 'Beverages', price: 120, isVeg: true, gstPercent: 12, recipe: [{ inventoryId: 'inv4', quantity: 0.25 }] },
  { id: '6', name: 'Tandoori Roti', category: 'Breads', price: 30, isVeg: true, gstPercent: 5 },
  { id: '7', name: 'Dal Makhani', category: 'Main Course', price: 220, isVeg: true, gstPercent: 5, recipe: [{ inventoryId: 'inv6', quantity: 0.03 }] },
  { id: '8', name: 'Chicken 65', category: 'Starters', price: 240, isVeg: false, gstPercent: 5, recipe: [{ inventoryId: 'inv3', quantity: 0.2 }] },
];

export const INITIAL_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: `t${i + 1}`,
  number: i + 1,
  capacity: i % 3 === 0 ? 2 : 4,
  status: TableStatus.VACANT
}));

export const INITIAL_ROOMS: Room[] = [
  { id: 'r101', number: '101', type: RoomType.STANDARD, floor: 1, price: 2500, status: RoomStatus.AVAILABLE, image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800' },
  { id: 'r102', number: '102', type: RoomType.STANDARD, floor: 1, price: 2500, status: RoomStatus.AVAILABLE, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800' },
  { id: 'r201', number: '201', type: RoomType.DELUXE, floor: 2, price: 4500, status: RoomStatus.AVAILABLE, image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=800' },
  { id: 'r202', number: '202', type: RoomType.DELUXE, floor: 2, price: 4500, status: RoomStatus.AVAILABLE, image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800' },
  { id: 'r301', number: '301', type: RoomType.SUITE, floor: 3, price: 8500, status: RoomStatus.AVAILABLE, image: 'https://images.unsplash.com/photo-1591088398332-8a77d399c842?auto=format&fit=crop&q=80&w=800' },
];

export const INITIAL_STAFF: Staff[] = [
  { id: 's1', name: 'Rahul Sharma', role: 'CHEF', phone: '+91 9999911111', status: 'ACTIVE', salary: 45000, paidHolidays: 12, holidaysTaken: 2, advanceTaken: 0, attendance: [] },
  { id: 's2', name: 'Priya Singh', role: 'RECEPTIONIST', phone: '+91 9999922222', status: 'ACTIVE', salary: 32000, paidHolidays: 15, holidaysTaken: 1, advanceTaken: 0, attendance: [] },
  { id: 's3', name: 'Amit Kumar', role: 'WAITER', phone: '+91 9999933333', status: 'ACTIVE', salary: 18000, paidHolidays: 10, holidaysTaken: 4, advanceTaken: 0, attendance: [] },
];
