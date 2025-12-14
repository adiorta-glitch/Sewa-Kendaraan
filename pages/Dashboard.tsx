import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Car, CalendarRange, Wallet, 
  TrendingUp, AlertCircle, CheckCircle2, Clock 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

import { getStoredData } from '../services/dataService';
import { Car as CarType, Booking, Transaction } from '../types';

const Dashboard = () => {
  // Inisialisasi state dengan Array Kosong [] agar tidak pernah undefined
  const [cars, setCars] = useState<CarType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Ambil data dengan Fallback Array Kosong []
        const [carsData, bookingsData, transData] = await Promise.all([
          getStoredData<CarType>('cars', []),
          getStoredData<Booking>('bookings', []),
          getStoredData<Transaction>('transactions', [])
        ]);

        // PENGAMAN GANDA: Pastikan yang masuk state ADALAH ARRAY
        setCars(Array.isArray(carsData) ? carsData : []);
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
        setTransactions(Array.isArray(transData) ? transData : []);
      } catch (error) {
        console.error("Gagal load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // --- LOGIKA HITUNGAN (Safe Mode / Anti-Crash) ---
  
  // 1. Hitung Unit Ready (Gunakan optional chaining ? dan default value)
  const readyUnits = cars?.filter(c => c.status === 'Available')?.length || 0;
  const totalUnits = cars?.length || 0;

  // 2. Hitung Pendapatan
  const totalRevenue = transactions?.reduce((total, t) => {
     return total + (Number(t.amount) || 0);
  }, 0) || 0;

  // 3. Hitung Booking Hari Ini
  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings?.filter(b => b && b.startDate && b.startDate.startsWith(today))?.length || 0;

  // 4. Hitung Unit Sedang Jalan
  const activeBookings = bookings?.filter(b => b.status === 'Active')?.length || 0;

  // 5. Data Grafik (Dummy jika kosong agar grafik tetap muncul cantik)
  const chartData = transactions?.length > 0 
    ? transactions.slice(0, 7).map(t => ({ name: t.date, value: t.amount }))
    : [
        { name: 'Sen', value: 0 }, { name: 'Sel', value: 0 }, 
        { name: 'Rab', value: 0 }, { name: 'Kam', value: 0 },
        { name: 'Jum', value: 0 }, { name: 'Sab', value: 0 }, { name: 'Min', value: 0 }
      ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Ringkasan performa bisnis rental Anda.</p>
        </div>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm">
          <CalendarRange size={18} />
          <span>Buat Booking</span>
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Unit Ready */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Unit Ready</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{readyUnits} <span className="text-sm text-slate-400 font-normal">/ {totalUnits}</span></h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Car size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
             <span className="text-green-500 flex items-center font-medium">
               <CheckCircle2 size={12} className="mr-1" /> Siap Jalan
             </span>
          </div>
        </div>

        {/* Card 2: Pendapatan */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pendapatan</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </h3>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
              <Wallet size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
             <span className="text-green-500 flex items-center font-medium">
               <TrendingUp size={12} className="mr-1" /> +0%
             </span>
             <span>bulan ini</span>
          </div>
        </div>

        {/* Card 3: Booking Hari Ini */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Booking Baru</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{todayBookings}</h3>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
              <CalendarRange size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
             <span className="text-purple-500 font-medium">Hari ini</span>
          </div>
        </div>

        {/* Card 4: Sedang Jalan */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sedang Jalan</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{activeBookings}</h3>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
              <Clock size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
             <span className="text-orange-500 font-medium">Unit di luar</span>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Analisis Pendapatan</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} tickFormatter={(value) => `Rp${value/1000}k`} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`Rp ${value.toLocaleString()}`, 'Pendapatan']}
                />
                <Area type="monotone" dataKey="value" stroke="#DC2626" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Widget (Unit Status) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Status Armada</h3>
          <div className="space-y-4">
             {cars.slice(0, 5).map((car) => (
               <div key={car.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                 <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden">
                    <img src={car.image} alt={car.name} className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">{car.name}</h4>
                    <p className="text-xs text-slate-500">{car.plate}</p>
                 </div>
                 <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                   car.status === 'Available' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                   car.status === 'Rented' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                 }`}>
                   {car.status}
                 </span>
               </div>
             ))}
             {cars.length === 0 && (
               <p className="text-center text-slate-400 text-sm py-4">Belum ada data unit.</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
