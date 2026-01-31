import { db as firebaseDb } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

// Ye 'db' object App.tsx ki zaroorat poori karega
export const db = {
  // 1. Data padhne ke liye (LocalStorage se taaki fast ho)
  get: (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  },

  // 2. Data save aur sync karne ke liye
  syncAll: async (data: any) => {
    // LocalStorage mein save karein (Offline ke liye)
    Object.keys(data).forEach(key => {
      try {
        localStorage.setItem(key, JSON.stringify(data[key]));
      } catch (e) {}
    });

    // (Optional: Future mein yahan hum Firebase code jodenge sync ke liye)
  }
};
