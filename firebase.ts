// File: firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAfCRtUcaUypV-agKAzHUzMdyPzyEhTF5k",
  authDomain: "grant-meridian.firebaseapp.com",
  databaseURL: "https://grant-meridian-default-rtdb.firebaseio.com",
  projectId: "grant-meridian",
  storageBucket: "grant-meridian.firebasestorage.app",
  messagingSenderId: "99567297260",
  appId: "1:99567297260:web:808140699accc4a9a9bbc9",
  measurementId: "G-3XR49CPJSS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
