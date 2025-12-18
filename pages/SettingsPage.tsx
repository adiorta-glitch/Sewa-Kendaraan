
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppSettings, User } from '../types';
import { getStoredData, setStoredData, DEFAULT_SETTINGS, compressImage } from '../services/dataService';
import { getUsers, saveUser, deleteUser } from '../services/authService';
import { Save, Building, FileText, Upload, Trash2, List, Shield, UserCog, Check, X, MessageCircle, Eye, EyeOff, Image as ImageIcon, Plus, Edit, HelpCircle, Palette, Moon, Sun, MapPin } from 'lucide-react';
import { Logo } from '../components/Logo';

interface Props {
    currentUser: User;
}

const SettingsPage: React.FC<Props> = ({ currentUser }) => {
  const [searchParams] = useSearchParams();
  const isSuperAdmin = currentUser.role === 'superadmin';
  const isAdmin = currentUser.role === 'admin';
  
  // Initialize tab from URL param or default
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || (isSuperAdmin ? 'general' : 'help'));
  
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [users, setUsers] = useState<User[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Users Form
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('admin');
  const [userImage, setUserImage] = useState<string | null>(null);
  
  // Master Data State
  const [newCategory, setNewCategory] = useState('');
  const [newPackage, setNewPackage] = useState('');

  useEffect(() => {
    setSettings(getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS));
    setUsers(getUsers());
  }, []);

  // Sync tab with URL param changes
  useEffect(() => {
      const tabParam = searchParams.get('tab');
      if (tabParam) {
          setActiveTab(tabParam);
      }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredData('appSettings', settings);
    setIsSaved(true);
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleThemeColorChange = (color: string) => {
      setSettings(prev => ({ ...prev, themeColor: color }));
      setIsSaved(false);
  };

  const toggleDarkMode = () => {
      setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
      setIsSaved(false);
  };

  // User Management
  const handleUserImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const compressed = await compressImage(file);
        setUserImage(compressed);
      } catch (e) {
        alert("Gagal memproses gambar.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploading(true);
          try {
             const compressed = await compressImage(file);
             setSettings(prev => ({ ...prev, logoUrl: compressed }));
          } catch(e) {
              alert("Gagal upload logo.");
          } finally {
              setIsUploading(false);
          }
      }
  };

  const handleEditUser = (u: User) => {
      setEditingUserId(u.id);
      setUsername(u.username);
      setPassword(u.password || ''); 
      setFullName(u.name);
      setEmail(u.email || '');
      setPhone(u.phone || '');
      setRole(u.role);
      setUserImage(u.image || null);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetUserForm = () => {
      setEditingUserId(null);
      setUsername(''); 
      setPassword(''); 
      setFullName(''); 
      setEmail(''); 
      setPhone(''); 
      setUserImage(null); 
      setRole('admin');
  };

  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!username || !password || !fullName) return;
      
      const userPayload: User = {
          id: editingUserId || `u-${Date.now()}`,
          username,
          password,
          name: fullName,
          email,
          phone,
          role: role as any,
          image: userImage
      };

      saveUser(userPayload);
      setUsers(getUsers());
      resetUserForm();
  };

  const handleDeleteUser = (id: string) => {
      if (id === currentUser.id) return alert("Tidak bisa menghapus akun sendiri!");
      if (confirm("Konfirmasi Persetujuan: Apakah Anda yakin ingin menghapus user ini secara permanen? Tindakan ini hanya dapat dilakukan dengan wewenang Superadmin.")) {
          deleteUser(id);
          setUsers(getUsers());
          if (editingUserId === id) resetUserForm();
      }
  };

  const addCategory = () => {
      if(newCategory && !settings.carCategories.includes(newCategory)) {
          setSettings(prev => ({...prev, carCategories: [...prev.carCategories, newCategory]}));
          setNewCategory('');
      }
  };
  const removeCategory = (cat: string) => {
      setSettings(prev => ({...prev, carCategories: prev.carCategories.filter(c => c !== cat)}));
  };

  const addPackage = () => {
      if(newPackage && !settings.rentalPackages.includes(newPackage)) {
          setSettings(prev => ({...prev, rentalPackages: [...prev.rentalPackages, newPackage]}));
          setNewPackage('');
      }
  };
  const removePackage = (pkg: string) => {
      setSettings(prev => ({...prev, rentalPackages: prev.rentalPackages.filter(p => p !== pkg)}));
  };

  const THEME_OPTIONS = [
      { id: 'red', name: 'Merah (Default)', bg: 'bg-red-600' },
      { id: 'blue', name: 'Biru', bg: 'bg-blue-600' },
      { id: 'green', name: 'Hijau', bg: 'bg-green-600' },
      { id: 'purple', name: 'Ungu', bg: 'bg-purple-600' },
      { id: 'orange', name: 'Orange', bg: 'bg-orange-600' },
      { id: 'black', name: 'Hitam', bg: 'bg-slate-800' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Pengaturan & Bantuan</h2>
          <p className="text-slate-500 dark:text-slate-400">Konfigurasi sistem dan panduan penggunaan aplikasi.</p>
        </div>
        {isSaved && <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium animate-pulse">Tersimpan! Refreshing...</span>}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {isSuperAdmin && (
              <>
                <button onClick={() => setActiveTab('general')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'general' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600'}`}>Umum & Invoice</button>
                <button onClick={() => setActiveTab('gps')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'gps' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600'}`}>Integrasi GPS</button>
                <button onClick={() => setActiveTab('appearance')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'appearance' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600'}`}>Tampilan</button>
                <button onClick={() => setActiveTab('master')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'master' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600'}`}>Kategori & Paket</button>
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600'}`}>Manajemen User</button>
              </>
          )}
          <button onClick={() => setActiveTab('help')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'help' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border dark:border-slate-600'}`}>Pusat Bantuan</button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          
          {/* GPS INTEGRATION TAB */}
          {activeTab === 'gps' && isSuperAdmin && (
              <div className="space-y-6 animate-fade-in">
                   <div className="flex items-center gap-3 border-b dark:border-slate-700 pb-4">
                      <MapPin size={32} className="text-indigo-600" />
                      <div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Integrasi GPS Tracker</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Hubungkan aplikasi dengan server GPS (Traccar/Custom) untuk tracking real-time.</p>
                      </div>
                  </div>

                  <form onSubmit={handleSave} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium mb-1 dark:text-slate-200">Penyedia Layanan GPS</label>
                          <select name="gpsProvider" value={settings.gpsProvider} onChange={handleChange} className="w-full border rounded p-2">
                              <option value="Simulation">Mode Simulasi (Demo)</option>
                              <option value="Traccar">Traccar (Open Source)</option>
                              <option value="Custom">Custom API</option>
                          </select>
                          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                              {settings.gpsProvider === 'Simulation' ? 'Menggunakan data acak untuk demo.' : 
                               settings.gpsProvider === 'Traccar' ? 'Menggunakan API Traccar untuk mengambil posisi device.' : 'Menggunakan endpoint JSON kustom.'}
                          </p>
                      </div>

                      {settings.gpsProvider !== 'Simulation' && (
                          <>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-200">URL Server API</label>
                                <input name="gpsApiUrl" value={settings.gpsApiUrl || ''} onChange={handleChange} className="w-full border rounded p-2" placeholder="https://demo.traccar.org/api" />
                                <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Pastikan URL dapat diakses (CORS Enabled jika beda domain).</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-200">API Token / Auth</label>
                                <input name="gpsApiToken" type="password" value={settings.gpsApiToken || ''} onChange={handleChange} className="w-full border rounded p-2" placeholder="Bearer Token atau Basic Auth" />
                            </div>
                          </>
                      )}

                      <div className="pt-4 border-t dark:border-slate-700">
                          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">Simpan Konfigurasi GPS</button>
                      </div>
                  </form>
              </div>
          )}

          {/* HELP TAB */}
          {activeTab === 'help' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center gap-3 border-b dark:border-slate-700 pb-4">
                      <HelpCircle size={32} className="text-indigo-600" />
                      <div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Pusat Bantuan</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Panduan penggunaan dan informasi sistem.</p>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Role Anda: <span className="uppercase text-indigo-600">{currentUser.role}</span></h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Anda memiliki akses {currentUser.role === 'superadmin' ? 'Penuh (Full Access)' : 'Terbatas'} ke fitur sistem.
                            </p>
                        </div>
                  </div>

                  <div className="mt-8 pt-6 border-t dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
                      <p>Butuh bantuan teknis lebih lanjut?</p>
                      <p className="font-medium text-slate-700 dark:text-slate-300">Hubungi IT Support: {settings.email}</p>
                  </div>
              </div>
          )}

          {activeTab === 'appearance' && isSuperAdmin && (
              <div className="space-y-8 animate-fade-in">
                  <div className="flex items-center gap-3 border-b dark:border-slate-700 pb-4">
                      <Palette size={32} className="text-indigo-600" />
                      <div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Tampilan Aplikasi</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Sesuaikan warna tema dan mode tampilan.</p>
                      </div>
                  </div>
                  
                  <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Warna Tema Utama</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                          {THEME_OPTIONS.map(option => (
                              <button 
                                  key={option.id}
                                  onClick={() => handleThemeColorChange(option.id)}
                                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${settings.themeColor === option.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 scale-105 shadow-md' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                              >
                                  <div className={`w-8 h-8 rounded-full ${option.bg} shadow-sm`}></div>
                                  <span className={`text-sm font-medium ${settings.themeColor === option.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                                      {option.name}
                                  </span>
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="pt-6 border-t dark:border-slate-700">
                       <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Mode Tampilan</h4>
                       <div className="flex items-center gap-4">
                            <button
                                onClick={() => !settings.darkMode && toggleDarkMode()}
                                className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${!settings.darkMode ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >
                                <Sun size={24} /> Mode Terang (Light)
                            </button>
                            <button
                                onClick={() => settings.darkMode && toggleDarkMode()}
                                className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${settings.darkMode ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >
                                <Moon size={24} /> Mode Gelap (Dark)
                            </button>
                       </div>
                  </div>

                  <div className="pt-6 border-t dark:border-slate-700">
                     <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold w-full">Simpan Pengaturan Tampilan</button>
                  </div>
              </div>
          )}

          {activeTab === 'general' && isSuperAdmin && (
             <form onSubmit={handleSave} className="space-y-6 animate-fade-in">
                 <div className="flex items-center gap-6 pb-6 border-b dark:border-slate-700">
                     <div className="w-20 h-20 border rounded-lg p-2 flex items-center justify-center bg-white">
                         <Logo src={settings.logoUrl} />
                     </div>
                     <div>
                         <label className="block text-sm font-medium mb-2 dark:text-slate-200">Ganti Logo (Otomatis Dikompres)</label>
                         <input 
                             disabled={!isSuperAdmin} 
                             type="file" 
                             accept="image/*" 
                             className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                             onChange={handleLogoUpload} 
                         />
                         {isUploading && <p className="text-xs text-indigo-600 mt-1">Mengupload...</p>}
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Nama Perusahaan (Lengkap)</label>
                         <input disabled={!isSuperAdmin} name="companyName" value={settings.companyName} onChange={handleChange} className="w-full border rounded p-2" />
                     </div>
                     <div>
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Nama Display Aplikasi (Singkat)</label>
                         <input disabled={!isSuperAdmin} name="displayName" value={settings.displayName} onChange={handleChange} className="w-full border rounded p-2" placeholder="Contoh: BRC" />
                     </div>
                     <div>
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Tagline</label>
                         <input disabled={!isSuperAdmin} name="tagline" value={settings.tagline} onChange={handleChange} className="w-full border rounded p-2" />
                     </div>
                     <div className="md:col-span-2">
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Alamat</label>
                         <input disabled={!isSuperAdmin} name="address" value={settings.address} onChange={handleChange} className="w-full border rounded p-2" />
                     </div>
                     <div>
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Telepon</label>
                         <input disabled={!isSuperAdmin} name="phone" value={settings.phone} onChange={handleChange} className="w-full border rounded p-2" />
                     </div>
                     <div>
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Email</label>
                         <input disabled={!isSuperAdmin} name="email" value={settings.email} onChange={handleChange} className="w-full border rounded p-2" />
                     </div>
                     
                     <div className="md:col-span-2 pt-4 border-t mt-2 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2"><FileText size={18}/> Konten Invoice PDF</h3>
                     </div>

                     <div className="md:col-span-2">
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Ketentuan Pembayaran (Muncul di Invoice)</label>
                         <textarea disabled={!isSuperAdmin} name="paymentTerms" value={settings.paymentTerms} onChange={handleChange} className="w-full border rounded p-2 text-sm" rows={3} placeholder="Masukkan nomor rekening dan ketentuan pembayaran..." />
                     </div>
                     
                     <div className="md:col-span-2">
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Syarat & Ketentuan Sewa (Muncul di Invoice)</label>
                         <textarea disabled={!isSuperAdmin} name="termsAndConditions" value={settings.termsAndConditions} onChange={handleChange} className="w-full border rounded p-2 text-sm" rows={4} placeholder="Poin-poin syarat sewa..." />
                     </div>

                     <div className="md:col-span-2">
                         <label className="block text-sm font-medium mb-1 dark:text-slate-200">Footer (Paling Bawah)</label>
                         <textarea disabled={!isSuperAdmin} name="invoiceFooter" value={settings.invoiceFooter} onChange={handleChange} className="w-full border rounded p-2" rows={1} />
                     </div>

                     {/* WHATSAPP TEMPLATE */}
                     <div className="md:col-span-2 pt-4 border-t mt-2 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2"><MessageCircle size={18}/> Format Chat WhatsApp</h3>
                        <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-3 mb-2 text-xs text-slate-600 dark:text-slate-300">
                             <strong>Variabel Tersedia:</strong> <br/>
                             {`{invoiceNo}, {name}, {unit}, {startDate}, {endDate}, {total}, {paid}, {remaining}, {status}, {footer}`}
                        </div>
                        <textarea 
                             disabled={!isSuperAdmin} 
                             name="whatsappTemplate" 
                             value={settings.whatsappTemplate} 
                             onChange={handleChange} 
                             className="w-full border rounded p-2 text-sm font-mono" 
                             rows={10} 
                        />
                     </div>
                 </div>
                 {isSuperAdmin && <button type="submit" disabled={isUploading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50">Simpan Pengaturan</button>}
             </form>
          )}

          {activeTab === 'master' && isSuperAdmin && (
              <div className="space-y-8 animate-fade-in">
                  {/* Car Categories */}
                  <div>
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200"><List size={20}/> Kategori Mobil</h3>
                      <div className="flex gap-2 mb-4">
                          <input 
                            className="border rounded p-2 flex-1" 
                            placeholder="Tambah Kategori (e.g. SUV, MPV)" 
                            value={newCategory} 
                            onChange={e => setNewCategory(e.target.value)}
                          />
                          <button onClick={addCategory} className="bg-indigo-600 text-white px-4 rounded font-bold hover:bg-indigo-700">Tambah</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {settings.carCategories.map(cat => (
                              <span key={cat} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-slate-200 dark:border-slate-600">
                                  {cat}
                                  <button onClick={() => removeCategory(cat)} className="text-slate-400 hover:text-red-600"><X size={14}/></button>
                              </span>
                          ))}
                      </div>
                  </div>

                  <div className="border-t pt-6 dark:border-slate-700">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200"><List size={20}/> Paket Sewa</h3>
                      <div className="flex gap-2 mb-4">
                          <input 
                            className="border rounded p-2 flex-1" 
                            placeholder="Tambah Paket (e.g. 12 Jam Dalam Kota)" 
                            value={newPackage} 
                            onChange={e => setNewPackage(e.target.value)}
                          />
                          <button onClick={addPackage} className="bg-indigo-600 text-white px-4 rounded font-bold hover:bg-indigo-700">Tambah</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {settings.rentalPackages.map(pkg => (
                              <span key={pkg} className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-slate-200 dark:border-slate-600">
                                  {pkg}
                                  <button onClick={() => removePackage(pkg)} className="text-slate-400 hover:text-red-600"><X size={14}/></button>
                              </span>
                          ))}
                      </div>
                  </div>
                  
                  <div className="pt-6 border-t dark:border-slate-700">
                     <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold w-full">Simpan Master Data</button>
                  </div>
              </div>
          )}

          {activeTab === 'users' && isSuperAdmin && (
              <div className="space-y-8 animate-fade-in">
                  <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-lg border border-slate-100 dark:border-slate-600">
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{editingUserId ? 'Edit User' : 'Tambah User Baru'}</h3>
                          {editingUserId && (
                              <button onClick={resetUserForm} className="text-sm text-red-600 hover:underline flex items-center gap-1">
                                  <X size={14}/> Batal Edit
                              </button>
                          )}
                      </div>
                      
                      <form onSubmit={handleSaveUser} className="space-y-4">
                          {/* ... Form fields ... */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Nama Lengkap</label>
                                <input required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border rounded p-2" placeholder="Nama Karyawan" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Role</label>
                                <select value={role} onChange={e => setRole(e.target.value)} className="w-full border rounded p-2">
                                    <option value="admin">Admin / Staff</option>
                                    <option value="driver">Driver</option>
                                    <option value="partner">Mitra</option>
                                    <option value="superadmin">Super Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Username</label>
                                <input required value={username} onChange={e => setUsername(e.target.value)} className="w-full border rounded p-2" placeholder="Username Login" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Password</label>
                                <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded p-2" placeholder="Password Login" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded p-2" placeholder="user@email.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Nomor Telepon</label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded p-2" placeholder="0812..." />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                             <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Foto Profil {isUploading && '(Kompresi...)'}</label>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center overflow-hidden border border-slate-300 dark:border-slate-500">
                                        {userImage ? (
                                            <img src={userImage} className="w-full h-full object-cover" />
                                        ) : <ImageIcon className="text-slate-400" size={20} />}
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleUserImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                                </div>
                             </div>
                          </div>

                          <div className="flex gap-2 mt-2">
                              {editingUserId && (
                                  <button type="button" onClick={resetUserForm} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded font-bold hover:bg-slate-300">
                                      Batal
                                  </button>
                              )}
                              <button disabled={isUploading} type="submit" className={`flex-1 ${editingUserId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'} text-white py-2 rounded font-bold flex items-center justify-center gap-2 disabled:opacity-50`}>
                                    {editingUserId ? <Save size={18} /> : <Plus size={18}/>}
                                    {editingUserId ? 'Simpan Perubahan' : 'Tambah User'}
                              </button>
                          </div>
                      </form>
                  </div>

                  <div>
                      <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200">Daftar User Sistem</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 border dark:border-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Profil</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Akun</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Kontak</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Role</th>
                                    <th className="px-4 py-2 text-right text-xs font-bold text-slate-500 dark:text-slate-300 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-700">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-4 py-2 text-sm">
                                            <div className="flex items-center gap-3">
                                                <img src={u.image || `https://ui-avatars.com/api/?name=${u.name}&background=random`} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                                                <div className="font-medium text-slate-900 dark:text-slate-200">{u.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{u.username}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Pwd: {u.password}</div>
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <div className="text-slate-800 dark:text-slate-200">{u.phone || '-'}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                                        </td>
                                        <td className="px-4 py-2 capitalize">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {u.role === 'admin' ? 'User' : u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => handleEditUser(u)} className="text-indigo-600 hover:text-indigo-800 p-1 bg-indigo-50 dark:bg-indigo-900/30 rounded"><Edit size={16}/></button>
                                                {u.id !== currentUser.id && (
                                                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 dark:bg-red-900/30 rounded"><Trash2 size={16}/></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default SettingsPage;
