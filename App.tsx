
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Car, CalendarRange, Users, Wallet, Menu, X, UserCog, CalendarClock, Settings, LogOut, MapPin, Receipt, PieChart, UserCircle, Loader2, RefreshCw, FileText, Palette, List, HelpCircle, Map } from 'lucide-react';
import { initializeData, getStoredData, DEFAULT_SETTINGS } from './services/dataService';
import { getCurrentUser, logout } from './services/authService';
import { User, AppSettings } from './types';
import { Logo, LogoText } from './components/Logo';
import Dashboard from './pages/Dashboard';
import BookingPage from './pages/BookingPage';
import FleetPage from './pages/FleetPage';
import PartnersPage from './pages/PartnersPage';
import DriversPage from './pages/DriversPage';
import HighSeasonPage from './pages/HighSeasonPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import CustomersPage from './pages/CustomersPage';
import DriverTrackingPage from './pages/DriverTrackingPage';
import ExpensesPage from './pages/ExpensesPage';
import StatisticsPage from './pages/StatisticsPage';

// --- THEME ENGINE ---
const THEME_COLORS: {[key: string]: {main: string, hover: string, light: string, text: string}} = {
    red: { main: '#DC2626', hover: '#B91C1C', light: '#FEF2F2', text: '#DC2626' },
    blue: { main: '#2563EB', hover: '#1D4ED8', light: '#EFF6FF', text: '#2563EB' },
    green: { main: '#16A34A', hover: '#15803D', light: '#F0FDF4', text: '#16A34A' },
    purple: { main: '#7C3AED', hover: '#6D28D9', light: '#F5F3FF', text: '#7C3AED' },
    orange: { main: '#EA580C', hover: '#C2410C', light: '#FFF7ED', text: '#EA580C' },
    black: { main: '#1F2937', hover: '#111827', light: '#F3F4F6', text: '#1F2937' },
};

const ThemeEngine = ({ settings }: { settings: AppSettings }) => {
    useEffect(() => {
        // 1. Handle Dark Mode
        if (settings.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // 2. Handle Color Theme Injection
        // We override the standard 'red' and 'indigo' classes used in the app to match the selected theme
        const color = THEME_COLORS[settings.themeColor || 'red'] || THEME_COLORS['red'];
        
        const styleId = 'brc-theme-styles';
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }

        styleTag.innerHTML = `
            /* OVERRIDE RED BUTTONS/TEXT */
            .bg-red-600, .bg-indigo-600 { background-color: ${color.main} !important; }
            .hover\\:bg-red-700:hover, .hover\\:bg-indigo-700:hover { background-color: ${color.hover} !important; }
            .text-red-600, .text-indigo-600, .text-indigo-700 { color: ${color.text} !important; }
            .bg-red-50, .bg-indigo-50 { background-color: ${color.light} !important; }
            .border-red-600, .focus\\:border-red-600:focus, .focus\\:ring-red-600:focus { border-color: ${color.main} !important; --tw-ring-color: ${color.main} !important; }
            .border-indigo-600 { border-color: ${color.main} !important; }
            
            /* Specific fix for Sidebar Active State */
            .bg-red-600.text-white { background-color: ${color.main} !important; }
            
            /* Dark Mode Overrides for Layout */
            .dark body { background-color: #0F172A !important; color: #F8FAFC !important; }
            .dark .bg-white { background-color: #1E293B !important; color: #F8FAFC !important; border-color: #334155 !important; }
            .dark .bg-slate-50, .dark .bg-slate-100 { background-color: #334155 !important; border-color: #475569 !important; color: #F1F5F9 !important; }
            .dark .text-slate-800, .dark .text-slate-900 { color: #F8FAFC !important; }
            .dark .text-slate-500, .dark .text-slate-600, .dark .text-slate-700 { color: #94A3B8 !important; }
            .dark .border-slate-200, .dark .border-slate-100 { border-color: #334155 !important; }
            .dark input, .dark select, .dark textarea { background-color: #0F172A !important; border-color: #475569 !important; color: white !important; }
            
            /* Mobile Safe Area Fixes */
            .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
            .pt-safe { padding-top: env(safe-area-inset-top); }
        `;
    }, [settings.themeColor, settings.darkMode]);

    return null;
};

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'}`}>
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const BottomNavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className={`flex flex-col items-center justify-center p-2 flex-1 transition-colors ${isActive ? 'text-red-600' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}>
      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </Link>
  );
};

interface AppLayoutProps {
  children?: React.ReactNode;
  user: User;
  onLogout: () => void;
}

// Layout Component to wrap protected routes
const AppLayout = ({ children, user, onLogout }: AppLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Role Helpers
  const isSuperAdmin = user.role === 'superadmin';
  const isStaff = user.role === 'admin';
  const isDriver = user.role === 'driver';
  const isPartner = user.role === 'partner';
  
  // Admin & SuperAdmin share most operational views
  const isOperational = isStaff || isSuperAdmin;

  useEffect(() => {
    const loadedSettings = getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS);
    setSettings(loadedSettings);

    // AUTO REFRESH LOGIC:
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            handleRefresh();
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleRefresh = async () => {
      setIsRefreshing(true);
      await initializeData(); // Pull fresh from Firebase
      setIsRefreshing(false);
      window.location.reload(); 
  };

  const UserProfile = ({ showName = true }) => (
      <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold border border-slate-200 overflow-hidden bg-slate-100 dark:bg-slate-700 dark:border-slate-600">
             {user.image ? (
                 <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
             ) : (
                 <span className="text-slate-500 dark:text-slate-300">{user.name.charAt(0)}</span>
             )}
          </div>
          {showName && (
              <div className="hidden md:block text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
              </div>
          )}
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <ThemeEngine settings={settings} />
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed h-full z-20">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
           <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-200 dark:shadow-none text-white">
               <Logo className="w-full h-full p-1" src={settings.logoUrl} />
           </div>
           <LogoText title={settings.displayName || settings.companyName} />
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
          {isOperational && (
              <>
                <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
                <SidebarItem to="/booking" icon={CalendarRange} label="Booking & Jadwal" />
                <SidebarItem to="/tracking" icon={Map} label="Tracking Unit" />
                <SidebarItem to="/fleet" icon={Car} label="Armada Mobil" />
                <SidebarItem to="/customers" icon={Users} label="Data Pelanggan" />
                <SidebarItem to="/drivers" icon={UserCircle} label="Data Driver" />
                <SidebarItem to="/partners" icon={UserCog} label="Mitra & Rekanan" />
                <SidebarItem to="/expenses" icon={Wallet} label="Keuangan" />
                <SidebarItem to="/statistics" icon={PieChart} label="Laporan & Statistik" />
                <SidebarItem to="/high-season" icon={CalendarClock} label="High Season" />
              </>
          )}

          {isDriver && (
              <>
                <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
                <SidebarItem to="/tracking" icon={Map} label="Tugas & Riwayat" />
                <SidebarItem to="/expenses" icon={Wallet} label="Reimbursement" />
                <SidebarItem to="/drivers" icon={UserCircle} label="Profil Saya" />
              </>
          )}

          {isPartner && (
              <>
                <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
                {/* Changed Fleet to Tracking for Partners */}
                <SidebarItem to="/tracking" icon={Map} label="Tracking Unit" />
                <SidebarItem to="/partners" icon={Wallet} label="Pendapatan" />
                <SidebarItem to="/expenses" icon={List} label="Riwayat Setoran" />
                <SidebarItem to="/statistics" icon={PieChart} label="Statistik Unit" />
              </>
          )}
          
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
            <SidebarItem to="/settings" icon={Settings} label="Pengaturan" />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
                <UserProfile />
                <button onClick={onLogout} className="text-slate-400 hover:text-red-600 transition-colors p-2" title="Keluar">
                    <LogOut size={18} />
                </button>
            </div>
        </div>
      </aside>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden fixed top-0 w-full bg-white dark:bg-slate-800 z-30 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex justify-between items-center pt-safe shadow-sm">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">
                 <Logo className="w-full h-full p-1" src={settings.logoUrl} />
             </div>
             <span className="font-black text-lg text-slate-800 dark:text-white tracking-tight">{settings.displayName || settings.companyName.split(' ')[0]}</span>
          </div>
          
          <div className="flex items-center gap-3">
              <button onClick={handleRefresh} className={`p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`}>
                  <RefreshCw size={20} />
              </button>
              <div className="relative">
                  <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                      <UserProfile showName={false} />
                  </button>
                  {isProfileMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1 animate-in fade-in zoom-in-95 duration-200">
                          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
                          </div>
                          <Link to="/settings" className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => setIsProfileMenuOpen(false)}>Pengaturan</Link>
                          <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Keluar</button>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8 pb-24 md:pb-8 min-h-screen">
        {children}
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-30 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center px-2 py-1">
          <BottomNavItem to="/" icon={LayoutDashboard} label="Home" />
          
          {isOperational && (
              <>
                <BottomNavItem to="/booking" icon={CalendarRange} label="Booking" />
                <BottomNavItem to="/tracking" icon={Map} label="Tracking" />
                <BottomNavItem to="/expenses" icon={Wallet} label="Keuangan" />
              </>
          )}

          {isDriver && (
              <>
                <BottomNavItem to="/tracking" icon={Map} label="Tugas" />
                <BottomNavItem to="/expenses" icon={Wallet} label="Reimburse" />
                <BottomNavItem to="/drivers" icon={UserCircle} label="Profil" />
              </>
          )}

          {isPartner && (
              <>
                <BottomNavItem to="/tracking" icon={Map} label="Unit" />
                <BottomNavItem to="/partners" icon={Wallet} label="Saldo" />
                <BottomNavItem to="/statistics" icon={PieChart} label="Stats" />
              </>
          )}
        </div>
      </nav>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
        await initializeData();
        const currentUser = getCurrentUser();
        setUser(currentUser);
        setIsLoading(false);
    };
    init();
  }, []);

  const handleLogin = () => {
    setUser(getCurrentUser());
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium animate-pulse">Memuat Sistem...</p>
          </div>
      );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />} />
        
        <Route path="/" element={user ? <AppLayout user={user} onLogout={handleLogout}><Dashboard /></AppLayout> : <Navigate to="/login" />} />
        
        {/* Protected Routes based on Role */}
        <Route path="/booking" element={user && (user.role === 'admin' || user.role === 'superadmin') ? <AppLayout user={user} onLogout={handleLogout}><BookingPage currentUser={user}/></AppLayout> : <Navigate to="/" />} />
        
        <Route path="/fleet" element={user && (user.role === 'admin' || user.role === 'superadmin' || user.role === 'partner') ? <AppLayout user={user} onLogout={handleLogout}><FleetPage currentUser={user}/></AppLayout> : <Navigate to="/" />} />
        
        <Route path="/tracking" element={user ? <AppLayout user={user} onLogout={handleLogout}>
            <DriverTrackingPage 
                isDriverView={user.role === 'driver'} 
                isPartnerView={user.role === 'partner'} // Added prop
                driverId={user.linkedDriverId}
                partnerId={user.linkedPartnerId} // Pass partner ID
            />
        </AppLayout> : <Navigate to="/login" />} />
        
        <Route path="/partners" element={user ? <AppLayout user={user} onLogout={handleLogout}><PartnersPage currentUser={user}/></AppLayout> : <Navigate to="/" />} />
        
        <Route path="/drivers" element={user ? <AppLayout user={user} onLogout={handleLogout}><DriversPage currentUser={user}/></AppLayout> : <Navigate to="/" />} />
        
        <Route path="/customers" element={user && (user.role === 'admin' || user.role === 'superadmin') ? <AppLayout user={user} onLogout={handleLogout}><CustomersPage currentUser={user}/></AppLayout> : <Navigate to="/" />} />
        
        <Route path="/expenses" element={user ? <AppLayout user={user} onLogout={handleLogout}><ExpensesPage isDriverView={user.role === 'driver'} isPartnerView={user.role === 'partner'} /></AppLayout> : <Navigate to="/login" />} />
        
        <Route path="/statistics" element={user ? <AppLayout user={user} onLogout={handleLogout}><StatisticsPage /></AppLayout> : <Navigate to="/" />} />
        
        <Route path="/high-season" element={user && (user.role === 'admin' || user.role === 'superadmin') ? <AppLayout user={user} onLogout={handleLogout}><HighSeasonPage currentUser={user}/></AppLayout> : <Navigate to="/" />} />
        
        <Route path="/settings" element={user ? <AppLayout user={user} onLogout={handleLogout}><SettingsPage currentUser={user}/></AppLayout> : <Navigate to="/login" />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
