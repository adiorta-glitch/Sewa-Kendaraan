import { Car, Booking, Partner, Driver, HighSeason, AppSettings, Customer } from '../types';
import { db } from './firebaseService'; // Import koneksi database
import { collection, getDocs, doc, setDoc } from 'firebase/firestore'; 

// ==========================================
// 1. DATA MOCKUP (CADANGAN/DEFAULT)
// ==========================================

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
// 2. FUNGSI LOGIKA HYBRID (PERBAIKAN UTAMA)
// ==========================================

export const getStoredData = async <T extends { id: string }>(
  collectionName: string, 
  fallbackData: T[] | T
): Promise<T[] | T> => {
    
    // Pastikan fallbackData tidak pernah undefined/null
    const safeFallback = fallbackData || [];

    // --- KASUS 1: SETTING APLIKASI (Single Object) ---
    if (collectionName === 'appSettings') {
        try {
            const snapshot = await getDocs(collection(db, collectionName));
            if (!snapshot.empty) {
                return snapshot.docs[0].data() as T;
            }
            return safeFallback as T;
        } catch (error) {
            console.error(`[FIREBASE ERROR] Settings:`, error);
            return safeFallback as T;
        }
    }

    // --- KASUS 2: DATA LIST (Array) ---
    try {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);
        
        // Jika kosong, kembalikan Array kosong/fallback (JANGAN NULL)
        if (snapshot.empty) {
            console.warn(`[FIREBASE] ${collectionName} kosong, pakai Mockup.`);
            return Array.isArray(safeFallback) ? safeFallback : [];
        }

        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as T[];
        
        // PENGAMAN: Pastikan output selalu Array
        return Array.isArray(data) ? data : [];

    } catch (error) {
        console.error(`[FIREBASE ERROR] ${collectionName}:`, error);
        // Jika error, kembalikan Array fallback
        return Array.isArray(safeFallback) ? safeFallback : [];
    }
};

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
        localStorage.setItem(key, JSON.stringify(data));
    }
};

// ==========================================
// 3. FUNGSI HELPER TAMBAHAN (WAJIB ADA)
// ==========================================

export const checkAvailability = (
  carId: string,
  startDate: string,
  endDate: string,
  bookings: Booking[]
): boolean => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  // Pengaman jika bookings null/undefined (Sangat penting agar tidak crash)
  if (!bookings || !Array.isArray(bookings)) return true;

  const isBooked = bookings.some((booking) => {
    if (booking.carId !== carId) return false;
    if (booking.status === 'Cancelled' || booking.status === 'Completed') return false;

    const bStart = new Date(booking.startDate).getTime();
    const bEnd = new Date(booking.endDate).getTime();

    return start < bEnd && end > bStart;
  });

  return !isBooked;
};

export const calculatePricing = (
  car: Car,
  rentalPackage: string,
  duration: number,
  highSeasons: HighSeason[],
  startDate: string
): number => {
  if (!car || !car.pricing) return 0; // Pengaman crash

  const basePrice = car.pricing[rentalPackage] || 0;
  
  let multiplier = duration;
  if (rentalPackage.includes('12 Jam')) multiplier = 1; 
  
  let totalPrice = basePrice * multiplier;

  const dateCheck = new Date(startDate).getTime();
  
  // Pengaman jika highSeasons null/undefined
  const seasons = Array.isArray(highSeasons) ? highSeasons : [];

  const activeSeason = seasons.find(hs => {
    const s = new Date(hs.startDate).getTime();
    const e = new Date(hs.endDate).getTime();
    return dateCheck >= s && dateCheck <= e;
  });

  if (activeSeason) {
    totalPrice += (activeSeason.priceIncrease * multiplier);
  }

  return totalPrice;
};

// ==========================================
// 4. FUNGSI IMPORT/EXPORT CSV
// ==========================================

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }

  const separator = ',';
  const keys = Object.keys(data[0]);
  
  const csvContent = [
    keys.join(separator),
    ...data.map(row => keys.map(k => {
      let cell = row[k] === null || row[k] === undefined ? '' : row[k];
      cell = cell instanceof Date ? cell.toISOString() : cell.toString();
      if (cell.search(/("|,|\n)/g) >= 0) {
        cell = `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(separator))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const processCSVImport = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return resolve([]);
      
      const lines = text.split('\n');
      if (lines.length < 2) return resolve([]); 

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      const result = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(','); 
        const obj: any = {};
        headers.forEach((h, i) => {
          let val = values[i]?.trim().replace(/^"|"$/g, '');
          if (val === 'true') obj[h] = true;
          else if (val === 'false') obj[h] = false;
          else obj[h] = val;
        });
        return obj;
      });
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

export const mergeData = (existingData: any[], newData: any[]) => {
    const dataMap = new Map(existingData.map(item => [item.id, item]));
    
    newData.forEach(item => {
        if (item.id) {
            dataMap.set(item.id, { ...dataMap.get(item.id), ...item });
        } else {
             const newId = 'imported_' + Math.random().toString(36).substr(2, 9);
             dataMap.set(newId, { id: newId, ...item });
        }
    });
    
    return Array.from(dataMap.values());
};
