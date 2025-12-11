import { Car, Booking, Partner, Driver, HighSeason, AppSettings, Customer } from '../types';
import { db } from './firebaseService'; // Import koneksi database
import { collection, getDocs, doc, setDoc } from 'firebase/firestore'; 

// ==========================================
// 1. DATA MOCKUP (CADANGAN/DEFAULT)
// ==========================================
// Data ini akan dipakai jika Firebase kosong atau error

export const INITIAL_PARTNERS: Partner[] = [
  { id: 'p1', name: 'Budi Santoso', phone: '08123456789', splitPercentage: 70, image: 'https://i.pravatar.cc/150?u=p1' },
];

export const INITIAL_CARS: Car[] = [
  { 
    id: 'c1', 
    name: 'Toyota Avanza', 
    plate: 'B 1234 ABC', 
    type: 'MPV', 
    pricing: { '12 Jam (Dalam Kota)': 300000, '24 Jam (Dalam Kota)': 450000, 'Full Day (Luar Kota)': 550000 },
    status: 'Available', 
    image: 'https://picsum.photos/300/200?random=1' 
  },
  { 
    id: 'c2', 
    name: 'Honda Brio', 
    plate: 'B 5678 DEF', 
    type: 'City Car', 
    pricing: { '12 Jam (Dalam Kota)': 250000, '24 Jam (Dalam Kota)': 350000, 'Full Day (Luar Kota)': 450000 }, 
    status: 'Available', 
    image: 'https://picsum.photos/300/200?random=2' 
  },
];

export const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Pak Asep', phone: '08122334455', dailyRate: 150000, status: 'Active', image: 'https://i.pravatar.cc/150?u=d1' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust1', name: 'John Doe', phone: '08111222333', address: 'Jl. Sudirman No. 1, Jakarta' }
];

export const INITIAL_HIGH_SEASONS: HighSeason[] = [
  { id: 'hs1', name: 'Libur Lebaran', startDate: '2024-04-05', endDate: '2024-04-15', priceIncrease: 100000 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Bersama Rent Car',
  tagline: 'Solusi Perjalanan Anda',
  address: 'Jl. Raya Utama No. 88, Jakarta',
  phone: '0812-3456-7890',
  email: 'admin@bersamarentcar.com',
  website: 'www.bersamarentcar.com',
  invoiceFooter: 'Terima kasih telah menyewa di Bersama Rent Car.',
  logoUrl: null,
  themeColor: 'red',
  darkMode: false,
  paymentTerms: '1. Pembayaran DP minimal 30% dimuka.\n2. Pelunasan wajib dilakukan saat serah terima unit.',
  termsAndConditions: '1. Penyewa wajib memiliki SIM A yang berlaku.\n2. Dilarang merokok di dalam kendaraan.',
  whatsappTemplate: 'Halo {name}, berikut invoice Anda...',
  carCategories: ['MPV', 'SUV', 'City Car', 'Sedan', 'Luxury', 'Minibus'],
  rentalPackages: ['12 Jam (Dalam Kota)', '24 Jam (Dalam Kota)', 'Full Day (Luar Kota)']
};

// ==========================================
// 2. FUNGSI LOGIKA HYBRID (FIREBASE + MOCK)
// ==========================================

// Fungsi Inti: Mengambil data dengan Fallback
export const getStoredData = async <T extends { id: string }>(
  collectionName: string, 
  fallbackData: T[] | T
): Promise<T[] | T> => {
    
    // Khusus untuk AppSettings (karena bukan array, tapi single object)
    if (collectionName === 'appSettings') {
        try {
            const docRef = doc(db, collectionName, 'current');
            const snapshot = await getDocs(collection(db, collectionName));
            if (!snapshot.empty) {
                return snapshot.docs[0].data() as T;
            }
            console.warn(`[FIREBASE] Settings kosong, pakai Default.`);
            return fallbackData as T;
        } catch (error) {
            console.error(`[FIREBASE ERROR] Gagal load settings, pakai Default.`, error);
            return fallbackData as T;
        }
    }

    // Untuk Data List (Cars, Partners, dll)
    try {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);
        
        // Jika Firebase kosong, kembalikan Mockup Data
        if (snapshot.empty) {
            console.warn(`[FIREBASE] Koleksi ${collectionName} kosong, menggunakan Mockup Data.`);
            return fallbackData as T[];
        }

        // Jika ada data, kembalikan data dari Firebase
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as T[];
        
        return data;

    } catch (error) {
        console.error(`[FIREBASE ERROR] Gagal koneksi ke ${collectionName}, menggunakan Mockup Data.`, error);
        // Jika error (misal internet mati atau API key salah), tetap jalan pakai Mockup
        return fallbackData as T[];
    }
};

// Fungsi Menyimpan Data (Tetap mencoba simpan ke Firebase)
export const setStoredData = async <T extends { id: string }>(key: string, data: T[] | T) => {
    try {
        if (Array.isArray(data)) {
            for (const item of data) {
                const docRef = doc(db, key, item.id);
                await setDoc(docRef, item as any, { merge: true });
            }
        } else {
            const docRef = doc(db, key, 'current');
            await setDoc(docRef, data as any, { merge: true });
        }
        console.log(`[FIREBASE] Sukses menyimpan ${key}`);
    } catch (error) {
        console.error(`[FIREBASE ERROR] Gagal menyimpan ${key}`, error);
        // Fallback: Simpan ke LocalStorage agar user tidak merasa data hilang sesaat
        localStorage.setItem(key, JSON.stringify(data));
    }
};

// Fungsi Helper lainnya (Pricing, Availability) biarkan seperti semula/copy dari file lama Anda
// ...
