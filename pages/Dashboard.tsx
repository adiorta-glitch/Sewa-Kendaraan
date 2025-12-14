import React, { useState, useEffect } from 'react';
// ... (import lainnya tetap sama)
import { getStoredData } from '../services/dataService';
// ... (import types tetap sama)

const Dashboard = () => {
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FUNGSI PEMBANTU (Helper) ---
  // Fungsi ini mengubah Object Firebase menjadi Array agar bisa di-filter
  const normalizeData = (data) => {
    if (!data) return []; // Jika null/undefined, kembalikan array kosong
    if (Array.isArray(data)) return data; // Jika sudah array, biarkan
    if (typeof data === 'object') return Object.values(data); // JIKA OBJECT, UBAH JADI ARRAY
    return []; // Fallback terakhir
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [carsData, bookingsData, transData] = await Promise.all([
          getStoredData('cars', []),
          getStoredData('bookings', []),
          getStoredData('transactions', [])
        ]);

        // GUNAKAN normalizeData DI SINI
        // Ini memastikan 'cars', 'bookings', dll SELALU berupa Array
        setCars(normalizeData(carsData));
        setBookings(normalizeData(bookingsData));
        setTransactions(normalizeData(transData));
        
      } catch (error) {
        console.error("Gagal load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // --- LOGIKA HITUNGAN (Sisa kode ke bawah tetap sama) ---
  // ...
