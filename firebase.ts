// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
