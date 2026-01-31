
export enum OrderType {
  DINE_IN = 'Dine-in',
  TAKEAWAY = 'Takeaway',
  DELIVERY = 'Delivery',
  ROOM_SERVICE = 'Room Service'
}

export enum TableStatus {
  VACANT = 'Vacant',
  OCCUPIED = 'Occupied',
  BILLING = 'Billing'
}

export enum RoomStatus {
  AVAILABLE = 'Available',
  OCCUPIED = 'Occupied',
  DIRTY = 'Dirty',
  MAINTENANCE = 'Maintenance'
}

export enum RoomType {
  STANDARD = 'Standard',
  DELUXE = 'Deluxe',
  SUITE = 'Suite'
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  WALLET = 'WALLET',
  CHARGE_TO_ROOM = 'CHARGE_TO_ROOM'
}

export type UserRole = 'ADMIN' | 'RESTAURANT' | 'ROOMS';

export interface AuthCredentials {
  adminPass: string;
  restaurantPass: string;
  roomsPass: string;
  hotelName: string;
  hotelEmail: string;
  isConfigured: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  isVeg: boolean;
  gstPercent: number;
  recipe?: RecipeItem[];
}

export interface RecipeItem {
  inventoryId: string;
  quantity: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
}

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  floor: number;
  price: number;
  status: RoomStatus;
  currentBookingId?: string;
  image?: string;
}

export interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  phone: string;
  aadhaarNumber?: string;
  checkIn: number;
  expectedCheckOut: number;
  checkOut?: number;
  status: 'RESERVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  foodCharges: number;
  roomCharges: number;
  total: number;
  paymentMethod?: PaymentMethod;
}

export interface Order {
  id: string;
  tableId?: string;
  roomId?: string;
  items: CartItem[];
  type: OrderType;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  total: number;
  status: 'PENDING' | 'KITCHEN' | 'READY' | 'COMPLETED' | 'CANCELLED';
  timestamp: number;
  customerName?: string;
  aadhaarNumber?: string;
  paymentMethod?: PaymentMethod;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  unit: string;
  minLevel: number;
  costPrice: number;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'PAID_LEAVE' | 'HALF_DAY';

export interface AttendanceRecord {
  date: string; // ISO format YYYY-MM-DD
  status: AttendanceStatus;
}

export interface Payout {
  id: string;
  staffId: string;
  month: string; // YYYY-MM
  amount: number;
  timestamp: number;
}

export interface Staff {
  id: string;
  name: string;
  role: 'ADMIN' | 'WAITER' | 'CHEF' | 'RECEPTIONIST';
  phone: string;
  status: 'ACTIVE' | 'OFF-DUTY';
  salary: number;
  paidHolidays: number;
  holidaysTaken: number;
  advanceTaken: number;
  attendance: AttendanceRecord[];
}
