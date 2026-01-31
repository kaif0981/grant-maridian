
import { Order, Booking, MenuItem, Table, InventoryItem, Staff, CartItem, Room, AuthCredentials } from '../types';

const PREFIX = 'dinedash_';

export const db = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`${PREFIX}${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from DB:`, e);
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to DB:`, e);
    }
  },

  processOrder: (order: Order, currentInventory: InventoryItem[], menu: MenuItem[]) => {
    if (!Array.isArray(currentInventory)) return { updatedInventory: [] };
    
    const updatedInventory = currentInventory.map(invItem => {
      let newStock = invItem.stock;
      
      if (!order.items || !Array.isArray(order.items)) return invItem;

      order.items.forEach(cartItem => {
        const menuItem = menu.find(m => m.id === cartItem.id);
        if (menuItem && menuItem.recipe) {
          const recipeItem = menuItem.recipe.find(r => r.inventoryId === invItem.id);
          if (recipeItem) {
            newStock -= recipeItem.quantity * cartItem.quantity;
          }
        }
      });
      return { ...invItem, stock: parseFloat(newStock.toFixed(2)) };
    });

    return { updatedInventory };
  },

  syncAll: (data: {
    menu: MenuItem[];
    orders: Order[];
    tables: Table[];
    inventory: InventoryItem[];
    rooms: Room[];
    bookings: Booking[];
    staff: Staff[];
    held: any[];
    auth: AuthCredentials;
  }) => {
    Object.entries(data).forEach(([key, value]) => db.set(key, value));
  }
};
