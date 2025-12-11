import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Mengambil konfigurasi dari Environment Variables Vercel
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

// Inisialisasi aplikasi Firebase
const app = initializeApp(firebaseConfig);

// Export referensi database agar bisa dipakai di file lain
export const db = getFirestore(app);
