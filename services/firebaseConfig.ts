
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID
};

let db: any = null;

try {
    if (firebaseConfig.apiKey) {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        
        // Enable offline persistence
        enableIndexedDbPersistence(db).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn("Multiple tabs open, persistence disabled.");
            } else if (err.code === 'unimplemented') {
                console.warn("Browser doesn't support persistence.");
            }
        });
    }
} catch (error) {
    console.error("Firebase init error:", error);
}

export { db };
