
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Booking, BookingStatus, Car, PaymentStatus, AppSettings } from '../types';
import { getStoredData, DEFAULT_SETTINGS } from '../services/dataService';
import { getCurrentUser } from '../services/authService';
import { AlertCircle, CheckCircle, TrendingUp, Car as CarIcon, Clock, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Map, Grid, User as UserIcon, Wallet, PieChart, UserCircle, Settings, Users, Percent, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';

// --- MOBILE COMPONENTS ---

const MobileHeader = ({ user, settings }: { user: any, settings: AppSettings }) => (
    <div className="flex items-center justify-between mb-6">
        <div>
             <h1 className="font-bold text-slate-800 text-lg leading-tight">Halo, {user?.name?.split(' ')[0]} 👋</h1>
             <p className="text-xs text-slate-500">Selamat datang kembali</p>
        </div>
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
             <Logo className="w-full h-full p-1.5" src={settings.logoUrl} />
        </div>
    </div>
);

const MenuItem = ({ icon: Icon, label, onClick, to }: any) => {
    const navigate = useNavigate();
    const handleClick = () => {
        if (onClick) onClick();
        if (to) navigate(to);
    };

    return (
        <button onClick={handleClick} className="flex flex-col items-center gap-2 p-1 active:scale-95 transition-transform w-full">
            <div className="w-14 h-14 bg-red-50 text-red-600 border border-red-100 rounded-2xl flex items-center justify-center shadow-sm">
                <Icon size={26} strokeWidth={1.5} />
            </div>
            <span className="text-xs font-medium text-slate-700 text-center leading-tight truncate w-full px-1">{label}</span>
        </button>
    );
};

// --- MAIN DASHBOARD ---

const Dashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [user, setUser] = useState<any>(null);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCarFilter, setSelectedCarFilter] = useState<string>('All');

  // Mobile Menu State
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  useEffect(() => {
    const loadedBookings = getStoredData<Booking[]>('bookings', []);
    const loadedCars = getStoredData<Car[]>('cars', []);
    setBookings(loadedBookings);
    setCars(loadedCars);
    setSettings(getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS));
    setUser(getCurrentUser());

    // Prepare chart data (Revenue last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const data = last7Days.map(date => {
      const dailyTotal = loadedBookings
        .filter(b => b.startDate.startsWith(date) && b.status !== BookingStatus.CANCELLED)
        .reduce((sum, b) => sum + b.totalPrice, 0);
      return {
        name: new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }),
        total: dailyTotal
      };
    });
    setChartData(data);
  }, []);

  // Stats Calculation
  const activeUnits = bookings.filter(b => b.status === BookingStatus.ACTIVE).length;
  const upcomingReturns = bookings.filter(b => {
      if(b.status !== BookingStatus.ACTIVE) return false;
      const end = new Date(b.endDate);
      const now = new Date();
      // Returns within next 24h
      const diff = end.getTime() - now.getTime();
      return diff > 0 && diff < 86400000; 
  }).length;
  
  const todayRevenue = bookings
    .filter(b => {
        const today = new Date().toISOString().split('T')[0];
        return b.startDate.startsWith(today) && b.status !== BookingStatus.CANCELLED;
    })
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
    
    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }
    return days;
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const isToday = (date: Date) => {
      const today = new Date();
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
  };

  // Filter Bookings for Calendar
  const getCalendarBookings = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return bookings.filter(b => {
          const start = b.startDate.split('T')[0];
          const end = b.endDate.split('T')[0];
          
          const inRange = dateStr >= start && dateStr <= end;
          const notCancelled = b.status !== BookingStatus.CANCELLED;
          
          if (selectedCarFilter === 'All') {
              return inRange && notCancelled;
          } else {
              return inRange && notCancelled && b.carId === selectedCarFilter;
          }
      });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Mobile Header (Hidden on Desktop) */}
      <div className="md:hidden">
          <MobileHeader user={user} settings={settings} />
      </div>

      {/* Mobile Quick Actions Grid */}
      <div className="md:hidden">
          <h3 className="font-bold text-slate-800 mb-3">Menu Cepat</h3>
          <div className="grid grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <MenuItem to="/booking" icon={CalendarIcon} label="Booking" />
              <MenuItem to="/tracking" icon={Map} label="Tracking" />
              <MenuItem to="/fleet" icon={CarIcon} label="Armada" />
              <MenuItem to="/customers" icon={UserIcon} label="Pelanggan" />
              
              <MenuItem to="/expenses" icon={Wallet} label="Keuangan" />
              <MenuItem to="/statistics" icon={PieChart} label="Statistik" />
              <MenuItem to="/settings" icon={Settings} label="Setting" />
              <MenuItem icon={Grid} label="Lainnya" onClick={() => setIsMoreMenuOpen(true)} />
          </div>
      </div>

      {/* Calendar Section (Moved Here for Mobile Order & Desktop Top Position) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <div className="flex items-center gap-4">
                  <h3 className="font-bold text-slate-800">Kalender Booking</h3>
                  <div className="flex items-center bg-slate-100 rounded-lg p-1">
                      <button onClick={prevMonth} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronLeft size={18}/></button>
                      <span className="px-3 text-sm font-bold text-slate-700 w-32 text-center">
                          {currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </span>
                      <button onClick={nextMonth} className="p-1 hover:bg-white rounded shadow-sm transition-all"><ChevronRight size={18}/></button>
                  </div>
                  <button onClick={goToToday} className="text-xs text-indigo-600 font-bold hover:underline">Hari Ini</button>
              </div>

              {/* Car Filter Dropdown */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                  <Filter size={16} className="text-slate-400" />
                  <select 
                      className="border rounded px-2 py-1.5 text-sm text-slate-600 bg-white w-full md:w-48"
                      value={selectedCarFilter}
                      onChange={e => setSelectedCarFilter(e.target.value)}
                  >
                      <option value="All">Semua Mobil</option>
                      {cars.map(c => (
                          <option key={c.id} value={c.id}>{c.name} - {c.plate}</option>
                      ))}
                  </select>
              </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                  <div key={day} className="bg-slate-50 p-2 text-center text-xs font-bold text-slate-500 uppercase">
                      {day}
                  </div>
              ))}
              {getDaysInMonth(currentDate).map((date, idx) => {
                  const dayBookings = date ? getCalendarBookings(date) : [];
                  const isTodayDate = date ? isToday(date) : false;

                  return (
                      <div key={idx} className={`bg-white min-h-[80px] p-1 md:p-2 relative ${isTodayDate ? 'bg-blue-50/50' : ''}`}>
                          {date && (
                              <>
                                  <span className={`text-xs font-medium mb-1 block ${isTodayDate ? 'bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center font-bold mx-auto md:mx-0' : 'text-slate-400'}`}>
                                      {date.getDate()}
                                  </span>
                                  <div className="space-y-1 overflow-y-auto max-h-[60px] custom-scrollbar">
                                      {dayBookings.map(b => {
                                          const car = cars.find(c => c.id === b.carId);
                                          return (
                                              <div key={b.id} className={`text-[9px] md:text-[10px] px-1.5 py-0.5 rounded truncate border-l-2 ${
                                                  b.status === 'Completed' ? 'bg-blue-50 border-blue-400 text-blue-700' :
                                                  b.status === 'Active' ? 'bg-green-50 border-green-400 text-green-700' :
                                                  'bg-slate-100 border-slate-400 text-slate-600'
                                              }`}>
                                                  {car?.name}
                                              </div>
                                          );
                                      })}
                                  </div>
                              </>
                          )}
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Unit Sedang Jalan</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{activeUnits}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <CarIcon size={24} />
            </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Kembali Hari Ini</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{upcomingReturns}</h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                <Clock size={24} />
            </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Omset Hari Ini</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">Rp {(todayRevenue/1000).toFixed(0)}k</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <TrendingUp size={24} />
            </div>
        </div>
      </div>

      {/* More Menu Modal (Mobile) */}
      {isMoreMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:hidden" onClick={() => setIsMoreMenuOpen(false)}>
              <div className="bg-white w-full rounded-t-2xl p-6 animate-in slide-in-from-bottom duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg">Menu Lengkap</h3>
                      <button onClick={() => setIsMoreMenuOpen(false)} className="p-1 bg-slate-100 rounded-full"><Users size={20}/></button>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                      <MenuItem to="/drivers" icon={UserCircle} label="Driver" onClick={() => setIsMoreMenuOpen(false)} />
                      <MenuItem to="/partners" icon={Users} label="Mitra" onClick={() => setIsMoreMenuOpen(false)} />
                      <MenuItem to="/high-season" icon={Percent} label="Promo" onClick={() => setIsMoreMenuOpen(false)} />
                  </div>
              </div>
          </div>
      )}

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
        <h3 className="font-bold text-slate-800 mb-4">Grafik Pendapatan (7 Hari)</h3>
        {/* Fix: Explicit height and width for Recharts container */}
        <div className="h-64 w-full relative min-w-0">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#DC2626" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(val) => `${val/1000}k`} />
                    <Tooltip contentStyle={{borderRadius: '8px'}} formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                    <Area type="monotone" dataKey="total" stroke="#DC2626" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Booking Terbaru</h3>
              <Link to="/booking" className="text-xs text-indigo-600 font-bold hover:underline">Lihat Semua</Link>
          </div>
          <div className="divide-y divide-slate-100">
              {bookings.slice(0, 5).map(booking => (
                  <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${booking.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                              <CarIcon size={18} />
                          </div>
                          <div>
                              <p className="font-bold text-sm text-slate-800">{booking.customerName}</p>
                              <p className="text-xs text-slate-500">{new Date(booking.startDate).toLocaleDateString('id-ID')} • {booking.destination}</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                              booking.status === 'Active' ? 'bg-green-100 text-green-700' : 
                              booking.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 
                              booking.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                          }`}>
                              {booking.status}
                          </span>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
