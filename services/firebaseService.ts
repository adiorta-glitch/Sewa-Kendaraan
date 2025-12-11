// Import fungsi yang dibutuhkan SDK (Sesuai dokumentasi resmi)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBNsY1YTvbBX82ua41yUNiI1dNQEulaATg",
  authDomain: "sewa-kendaraan-283af.firebaseapp.com",
  projectId: "sewa-kendaraan-283af",
  storageBucket: "sewa-kendaraan-283af.firebasestorage.app",
  messagingSenderId: "1033232570934",
  appId: "1:1033232570934:web:8a1563bb84deafccd29697",
  measurementId: "G-BW9MHSRB6N"
};
// JANGAN PAKAI import.meta.env LAGI. Langsung tempel string-nya.
const firebaseConfig = {
  apiKey: "AIzaSyDy..........................", // <--- Tempel API Key ASLI Anda di sini
  authDomain: "sewa-kendaraan-xxxx.firebaseapp.com", // <--- Tempel authDomain ASLI
  projectId: "sewa-kendaraan-xxxx", // <--- Tempel projectId ASLI
  storageBucket: "sewa-kendaraan-xxxx.appspot.com", // <--- Tempel storageBucket ASLI
  messagingSenderId: "1234567890", // <--- Tempel Sender ID ASLI
  appId: "1:1234567890:web:xxxxxxxxx" // <--- Tempel App ID ASLI
};
// ---------------------------------------------------

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Firestore Database
export const db = getFirestore(app);
