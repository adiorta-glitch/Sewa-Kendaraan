
import { 
  Car, Driver, Partner, Customer, Booking, Transaction, AppSettings, HighSeason, 
  BookingStatus, PaymentStatus 
} from '../types';

// Helper for Mock Data Dates
const getDateStr = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
};

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
  termsAndConditions: `1. Persyaratan Sewa (Lepas Kunci)\nA. Wajib: E-KTP Asli & SIM A.\nB. Jaminan Tambahan: Motor + STNK asli atau uang jaminan.`,
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

export const setStoredData = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving ${key} to localStorage`, e);
    }
};

/**
 * ANTI-BENTROK JADWAL LOGIC
 * Mengecek apakah resource (mobil/driver) tersedia pada rentang waktu tertentu.
 */
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
        if (b.status === BookingStatus.CANCELLED) return false;
        
        if (type === 'car' && b.carId !== resourceId) return false;
        if (type === 'driver' && b.driverId !== resourceId) return false;

        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);
        
        // Overlap Condition: (StartA < EndB) && (EndA > StartB)
        return (start < bEnd && end > bStart);
    });
};

export const initializeData = async () => {
    const hasCars = localStorage.getItem(KEYS.CARS);
    if (!hasCars) {
        // Inisialisasi data default jika masih kosong
        setStoredData(KEYS.SETTINGS, DEFAULT_SETTINGS);
        setStoredData(KEYS.CARS, []);
        setStoredData(KEYS.BOOKINGS, []);
        setStoredData(KEYS.TRANSACTIONS, []);
        setStoredData(KEYS.DRIVERS, []);
        setStoredData(KEYS.PARTNERS, []);
        setStoredData(KEYS.CUSTOMERS, []);
    }
    return true;
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
