
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Configuration from user
const firebaseConfig = {
  apiKey: "AIzaSyBNsY1YTvbBX82ua41yUNiI1dNQEulaATg",
  authDomain: "sewa-kendaraan-283af.firebaseapp.com",
  projectId: "sewa-kendaraan-283af",
  storageBucket: "sewa-kendaraan-283af.firebasestorage.app",
  messagingSenderId: "1033232570934",
  appId: "1:1033232570934:web:8a1563bb84deafccd29697",
  measurementId: "G-BW9MHSRB6N"
};

let db: any = null;
let analytics: any = null;

try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    analytics = getAnalytics(app);
    
    // Enable offline persistence
    // This allows the app to work offline and sync when online
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn("Multiple tabs open, persistence disabled.");
        } else if (err.code === 'unimplemented') {
            console.warn("Browser doesn't support persistence.");
        }
    });
    
    console.log("[Firebase] Initialized successfully with provided config.");
} catch (error) {
    console.error("[Firebase] Initialization error:", error);
}

export { db, analytics };
