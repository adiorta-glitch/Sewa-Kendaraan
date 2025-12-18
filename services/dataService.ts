
import { 
  Car, Driver, Partner, Customer, Booking, Transaction, AppSettings, HighSeason, 
  BookingStatus, PaymentStatus 
} from '../types';
import { db } from './firebaseConfig';
import { collection, getDocs, doc, writeBatch, query } from 'firebase/firestore';

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Bersama Rent Car',
  displayName: 'BRC',
  tagline: 'Solusi Transportasi Terpercaya',
  address: 'Jl. Raya Merdeka No. 123, Jakarta',
  phone: '0812-3456-7890',
  email: 'admin@bersamarent.com',
  website: 'www.bersamarent.com',
  invoiceFooter: 'Terima kasih atas kepercayaan Anda menggunakan jasa kami.',
  themeColor: 'red',
  darkMode: false,
  paymentTerms: '1. Pembayaran DP minimal 30% saat booking.\n2. Pelunasan dilakukan saat serah terima unit.\n3. Pembayaran via Transfer BCA 1234567890 a.n Bersama Rent.',
  termsAndConditions: `1. Persyaratan Sewa (Lepas Kunci)
A. Untuk penyewaan tanpa pengemudi (self-drive), Penyewa wajib menyerahkan dokumen asli sebagai jaminan keamanan yang akan dikembalikan setelah masa sewa berakhir:
B. Wajib: E-KTP Asli Penyewa.
C. Wajib: SIM A yang masih berlaku (diperlihatkan & difotokopi/foto).
D. Jaminan Tambahan (Pilih salah satu):
E. Sepeda motor + STNK asli (atas nama Penyewa/Keluarga).
F. NPWP / Kartu Keluarga / Kartu Identitas Pegawai (Karpeg).
G. Uang deposit jaminan (Refundable) sebesar Rp1.000.000.
H. Pihak Rental berhak menolak permohonan sewa jika identitas dirasa kurang meyakinkan atau tidak valid.

2. Pembayaran dan Durasi Sewa
A. Booking Fee (DP): Penyewa wajib membayar uang muka minimal 30-50% dari total biaya sewa untuk mengamankan jadwal.
B. Pelunasan: Sisa pembayaran wajib dilunasi sebelum serah terima kunci mobil.
C. Perhitungan Waktu:
D. Paket 12 Jam / 24 Jam (Full Day).
E. Keterlambatan pengembalian (Overtime) dikenakan denda sebesar 10% per jam dari harga sewa harian.
F. Keterlambatan lebih dari 5 jam dihitung sebagai sewa 1 hari penuh.
G. Pembatalan:
I. Pembatalan H-1: DP hangus 50%.
Ii. Pembatalan pada hari H: DP hangus 100%.

3. Tanggung Jawab Penyewa
A. Kondisi Mobil: Mobil diserahkan dalam keadaan bersih dan laik jalan. Penyewa wajib mengembalikan dalam kondisi kebersihan yang sama. (Jika kotor berlebih/bau rokok tajam, dikenakan biaya salon sebesar Rp650.000,-).
B. Bahan Bakar (BBM): Sistem pengembalian BBM adalah posisi sama dengan saat pengambilan (Return to same level).
C. Penggunaan: Mobil hanya boleh digunakan sesuai peruntukan jalan raya (bukan untuk offroad, balapan, atau mengangkut barang yang merusak interior/bau menyengat seperti durian/ikan basah tanpa wadah kedap udara).

4. Kerusakan dan Kecelakaan
A. Kerusakan Ringan (Lecet/Penyok): Penyewa bertanggung jawab penuh atas biaya perbaikan di bengkel yang ditunjuk oleh Pihak Rental.
B. Kerusakan Berat/Kecelakaan:
i. Penyewa menanggung seluruh biaya perbaikan.
ii. Biaya Masa Tunggu (Idle Cost): Penyewa wajib membayar biaya sewa harian selama mobil berada di bengkel (karena mobil tidak bisa beroperasi/menghasilkan uang).
C. Kehilangan: Jika terjadi kehilangan unit akibat kelalaian Penyewa (kunci tertinggal, parkir sembarangan), Penyewa wajib mengganti unit dengan spesifikasi setara atau membayar tunai seharga mobil tersebut di pasaran.

5. Larangan Keras
A. Penyewa dilarang keras untuk:
B. Menggadaikan mobil.
C. Menyewakan kembali ke pihak ketiga (over-rent).
D. Menggunakan mobil untuk tindak kejahatan/kriminal.
E. Mengubah bentuk atau memodifikasi komponen mobil.

6. Force Majeure
Pihak Rental tidak bertanggung jawab atas kerugian Penyewa yang disebabkan oleh kejadian di luar kendali (bencana alam, huru-hara, atau kerusakan mesin murni karena faktor usia kendaraan yang bukan akibat kelalaian penggunaan).`,
  whatsappTemplate: 'Halo *{name}*,\nBerikut invoice sewa mobil anda:\nUnit: {unit}\nTotal: {total}\n\nTerima kasih.',
  carCategories: ['MPV', 'SUV', 'Sedan', 'City Car', 'Luxury', 'Minibus'],
  rentalPackages: ['12 Jam (Dalam Kota)', '24 Jam (Dalam Kota)', '24 Jam (Luar Kota)'],
  gpsProvider: 'Simulation'
};

const KEYS = {
    CARS: 'cars',
    DRIVERS: 'drivers',
    PARTNERS: 'partners',
    CUSTOMERS: 'customers',
    BOOKINGS: 'bookings',
    TRANSACTIONS: 'transactions',
    SETTINGS: 'appSettings',
    HIGH_SEASONS: 'highSeasons'
};

export const getStoredData = <T>(key: string, defaultValue: T): T => {
    try {
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.error(`Error parsing ${key} from localStorage`, e);
    }
    return defaultValue;
};

// Fungsi Sinkronisasi ke Firestore (Write/Delete)
const syncToFirestore = async (key: string, data: any) => {
    if (!db) return; // Skip jika Firebase tidak dikonfigurasi
    if (!Array.isArray(data)) return; // Hanya sync collection berupa array

    try {
        const batch = writeBatch(db);
        const colRef = collection(db, key);
        
        // 1. Ambil data eksisting di Firestore untuk cek diff (yang perlu dihapus)
        const snapshot = await getDocs(colRef);
        const newIds = new Set(data.map((item: any) => item.id));
        
        // Delete: Dokumen yang ada di Firestore tapi tidak ada di data baru (berarti sudah dihapus di UI)
        snapshot.docs.forEach(docSnap => {
            if (!newIds.has(docSnap.id)) {
                batch.delete(docSnap.ref);
            }
        });

        // Write/Update: Set ulang semua data
        data.forEach((item: any) => {
            if (item.id) {
                const docRef = doc(db, key, item.id);
                batch.set(docRef, item, { merge: true });
            }
        });

        await batch.commit();
        console.log(`[Firebase] Synced collection ${key}`);
    } catch (error) {
        console.error(`[Firebase] Error syncing ${key}:`, error);
    }
};

export const setStoredData = (key: string, data: any) => {
    try {
        // 1. Simpan ke LocalStorage (Untuk performa UI instan)
        localStorage.setItem(key, JSON.stringify(data));
        
        // 2. Sinkron ke Firebase di background
        syncToFirestore(key, data);
    } catch (e) {
        console.error(`Error saving ${key} to localStorage`, e);
    }
};

export const checkAvailability = (
    bookings: Booking[], 
    resourceId: string, 
    start: Date, 
    end: Date, 
    type: 'car' | 'driver', 
    excludeBookingId?: string
): boolean => {
    return !bookings.some(b => {
        if (excludeBookingId && b.id === excludeBookingId) return false;
        // Anti bentrok: Abaikan pesanan yang dicancel
        if (b.status === BookingStatus.CANCELLED) return false;
        
        if (type === 'car' && b.carId !== resourceId) return false;
        if (type === 'driver' && b.driverId !== resourceId) return false;

        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);
        
        return (start < bEnd && end > bStart);
    });
};

export const initializeData = async () => {
    // 1. Cek Setting
    const hasSettings = localStorage.getItem(KEYS.SETTINGS);
    if (!hasSettings) {
        setStoredData(KEYS.SETTINGS, DEFAULT_SETTINGS);
    }

    // 2. Jika Firebase terhubung, tarik data dari Cloud (Read)
    if (db) {
        try {
            console.log("[Firebase] Fetching data from cloud...");
            const collectionsToSync = [
                KEYS.CARS, KEYS.DRIVERS, KEYS.PARTNERS, KEYS.CUSTOMERS, 
                KEYS.BOOKINGS, KEYS.TRANSACTIONS, KEYS.HIGH_SEASONS
            ];

            // Load secara paralel
            await Promise.all(collectionsToSync.map(async (key) => {
                const colRef = collection(db, key);
                const snapshot = await getDocs(colRef);
                
                if (!snapshot.empty) {
                    const data = snapshot.docs.map(doc => doc.data());
                    // Update LocalStorage dengan data dari Cloud
                    localStorage.setItem(key, JSON.stringify(data));
                }
            }));
            console.log("[Firebase] Data synced to LocalStorage.");
        } catch (e) {
            console.error("[Firebase] Failed to fetch data, using LocalStorage fallback.", e);
        }
    }

    // 3. Cek apakah LocalStorage masih kosong (User baru / Offline tanpa cache)
    const hasCars = localStorage.getItem(KEYS.CARS);
    if (!hasCars) {
        // Initialize with empty arrays (Clean Slate)
        const data = generateDummyDataObjects();
        setStoredData(KEYS.PARTNERS, data.partners);
        setStoredData(KEYS.DRIVERS, data.drivers);
        setStoredData(KEYS.CARS, data.cars);
        setStoredData(KEYS.CUSTOMERS, data.customers);
        setStoredData(KEYS.BOOKINGS, data.bookings);
        setStoredData(KEYS.TRANSACTIONS, data.transactions);
        setStoredData(KEYS.HIGH_SEASONS, data.highSeasons);
    }
    return true;
};

export const clearAllData = () => {
    const keysToRemove = [KEYS.CARS, KEYS.DRIVERS, KEYS.PARTNERS, KEYS.CUSTOMERS, KEYS.BOOKINGS, KEYS.TRANSACTIONS, KEYS.HIGH_SEASONS];
    
    // Clear Local Storage
    keysToRemove.forEach(k => {
        localStorage.removeItem(k);
        // Clear Firebase Collection (Trigger empty sync)
        syncToFirestore(k, []); 
    });
    
    window.location.reload();
};

const generateDummyDataObjects = () => {
    return { 
        partners: [], 
        drivers: [], 
        cars: [], 
        customers: [], 
        bookings: [], 
        transactions: [], 
        highSeasons: [] 
    };
};

export const generateDummyData = () => {
    const data = generateDummyDataObjects();
    setStoredData(KEYS.PARTNERS, data.partners);
    setStoredData(KEYS.DRIVERS, data.drivers);
    setStoredData(KEYS.CARS, data.cars);
    setStoredData(KEYS.CUSTOMERS, data.customers);
    setStoredData(KEYS.BOOKINGS, data.bookings);
    setStoredData(KEYS.TRANSACTIONS, data.transactions);
    setStoredData(KEYS.HIGH_SEASONS, data.highSeasons);
    window.location.reload();
};

export const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
        reader.onerror = reject;
    });
};

export const exportToCSV = (data: any[], filename: string) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(fieldName => `"${String(row[fieldName]).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.click();
};

export const processCSVImport = (file: File, callback: (data: any[]) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) return;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const result = lines.slice(1).filter(l => l.trim()).map(line => {
            const currentline = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            const obj: any = {};
            headers.forEach((h, idx) => {
                let val = currentline?.[idx] || "";
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                obj[h] = val;
            });
            return obj;
        });
        callback(result);
    };
    reader.readAsText(file);
};

export const mergeData = (existing: any[], imported: any[], key = 'id') => {
    const map = new Map();
    existing.forEach(i => map.set(i[key], i));
    imported.forEach(i => map.set(i[key] || Date.now() + Math.random(), { ...i, [key]: i[key] || (Date.now() + Math.random()).toString() }));
    return Array.from(map.values());
};
