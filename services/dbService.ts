import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase'; // Ye line zaroori hai connection ke liye

// Data fetch karne ke liye (Live Update)
export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    });
  } catch (error) {
    console.error("Error subscribing:", error);
    return () => {};
  }
};

// Data add karne ke liye
export const addItem = async (collectionName: string, item: any) => {
  try {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, item);
    return docRef.id;
  } catch (error) {
    console.error("Error adding item:", error);
  }
};

// Data update karne ke liye
export const updateItem = async (collectionName: string, id: string, updates: any) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Error updating item:", error);
  }
};

// Data delete karne ke liye
export const deleteItem = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting item:", error);
  }
};
