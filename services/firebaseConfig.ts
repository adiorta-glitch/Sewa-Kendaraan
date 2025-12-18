
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
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
    
    // Initialize Firestore with new Persistence Settings (removes deprecation warning)
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
    });

    analytics = getAnalytics(app);
    
    console.log("[Firebase] Initialized successfully with provided config.");
} catch (error) {
    console.error("[Firebase] Initialization error:", error);
}

export { db, analytics };
