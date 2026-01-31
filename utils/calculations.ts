
import { CartItem, Order, Booking } from '../types';

/**
 * Precision Math Helper - Prevents floating point issues and NaN
 */
const safeNum = (val: any): number => {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
};

const round = (val: number) => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

export const calculateItemTotal = (price: number, qty: number): number => {
  return round(safeNum(price) * safeNum(qty));
};

export const calculateSubtotal = (items: CartItem[]): number => {
  if (!items || items.length === 0) return 0;
  return round(items.reduce((acc, item) => acc + (safeNum(item.price) * safeNum(item.quantity)), 0));
};

export const calculateTax = (items: CartItem[]): number => {
  if (!items || items.length === 0) return 0;
  return round(items.reduce((acc, item) => {
    const itemSubtotal = safeNum(item.price) * safeNum(item.quantity);
    const taxRate = safeNum(item.gstPercent) || 5;
    return acc + (itemSubtotal * (taxRate / 100));
  }, 0));
};

/**
 * Unified Billing Engine
 */
export const calculateCompleteBill = (items: CartItem[], discount: number = 0, serviceChargeRate: number = 0.05) => {
  const subtotal = calculateSubtotal(items);
  const tax = calculateTax(items);
  const serviceCharge = round(subtotal * safeNum(serviceChargeRate));
  const disc = safeNum(discount);
  
  const total = Math.max(0, Math.round(subtotal + tax + serviceCharge - disc));
  
  return { 
    subtotal: round(subtotal), 
    tax: round(tax), 
    serviceCharge: round(serviceCharge), 
    total: total, 
    discount: disc 
  };
};

export const calculateGrandTotal = (subtotal: number, tax: number, discount: number = 0, serviceCharge: number = 0): number => {
  const st = safeNum(subtotal);
  const tx = safeNum(tax);
  const ds = safeNum(discount);
  const sc = safeNum(serviceCharge);
  return Math.max(0, Math.round(st + tx + sc - ds));
};

export const calculateBookingTotals = (booking: Booking, roomOrders: Order[]) => {
  const foodTotal = round(roomOrders.reduce((acc, o) => acc + safeNum(o.total), 0));
  const checkIn = safeNum(booking?.checkIn) || Date.now();
  const checkOut = safeNum(booking?.expectedCheckOut) || Date.now();
  const stayDuration = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
  
  const roomTotal = safeNum(booking?.roomCharges); 
  const netTotal = round(roomTotal + foodTotal);
  
  return {
    foodTotal,
    roomTotal,
    netTotal,
    stayDuration
  };
};
