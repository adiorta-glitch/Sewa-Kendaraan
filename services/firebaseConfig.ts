
// @ts-ignore
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED
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
let app: any = null;

try {
    // Initialize Firebase (Singleton pattern to prevent HMR errors)
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    
    // Initialize Firestore
    if (app) {
        try {
            // Attempt to initialize with offline persistence
            // Note: This will throw if Firestore is already initialized (e.g. during fast refresh)
            db = initializeFirestore(app, {
                localCache: persistentLocalCache({
                    tabManager: persistentMultipleTabManager(),
                    cacheSizeBytes: CACHE_SIZE_UNLIMITED
                })
            });
            console.log("[Firebase] Persistence enabled.");
        } catch (e: any) {
            // If already initialized or persistence fails, fallback to existing instance
            if (e.code === 'failed-precondition' || e.message?.includes('already been initialized')) {
                 db = getFirestore(app);
            } else {
                console.warn("[Firebase] Persistence initialization failed. Falling back to standard.", e);
                try {
                    db = getFirestore(app);
                } catch (innerError) {
                    console.error("[Firebase] Fatal: Could not get Firestore instance.", innerError);
                }
            }
        }

        // @ts-ignore
        try {
            analytics = getAnalytics(app);
        } catch (e) {
            console.log("[Firebase] Analytics skipped.");
        }
        
        console.log("[Firebase] Initialized successfully.");
    }
} catch (error) {
    console.error("[Firebase] Critical Initialization error:", error);
}

export { db, analytics };
