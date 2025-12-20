
// @ts-ignore
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
// @ts-ignore
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
    // @ts-ignore
    const app = initializeApp(firebaseConfig);
    
    // Initialize Firestore
    // Using gstatic imports guarantees components are registered correctly
    if (app) {
        try {
            // Try enabling offline persistence (preferred)
            db = initializeFirestore(app, {
                localCache: persistentLocalCache({
                    tabManager: persistentMultipleTabManager()
                })
            });
            console.log("[Firebase] Persistence enabled.");
        } catch (e) {
            console.warn("[Firebase] Persistence initialization failed (likely multiple tabs open or unsupported environment). Falling back to standard memory cache.", e);
            // Fallback to standard initialization if persistence fails
            db = getFirestore(app);
        }

        // @ts-ignore
        try {
            analytics = getAnalytics(app);
        } catch (e) {
            console.log("[Firebase] Analytics skipped (AdBlocker or Environment issue).");
        }
        
        console.log("[Firebase] Initialized successfully.");
    }
} catch (error) {
    console.error("[Firebase] Critical Initialization error:", error);
}

export { db, analytics };
