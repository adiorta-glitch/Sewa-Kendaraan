
import React, { useState, useEffect, useRef } from 'react';
import { getStoredData, setStoredData, checkAvailability, DEFAULT_SETTINGS, compressImage } from '../services/dataService';
import { Car, Booking, BookingStatus, PaymentStatus, Transaction, Driver, HighSeason, AppSettings, Customer, User } from '../types';
import { generateInvoicePDF, generateWhatsAppLink } from '../services/pdfService';
import { Calendar, Car as CarIcon, User as UserIcon, Shield, CheckCircle, AlertTriangle, MessageCircle, Zap, Trash2, Edit2, FileSpreadsheet, ChevronDown, Filter, Clock, X } from 'lucide-react';

interface Props {
    currentUser: User;
}

const BookingPage: React.FC<Props> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Form State
  const [selectedCarId, setSelectedCarId] = useState('');
  const [isCarDropdownOpen, setIsCarDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('08:00');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [carError, setCarError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setCars(getStoredData<Car[]>('cars', []));
    setBookings(getStoredData<Booking[]>('bookings', []));
    setDrivers(getStoredData<Driver[]>('drivers', []));
    setCustomers(getStoredData<Customer[]>('customers', []));
    setSettings(getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS));
  }, []);

  // ANTI-BENTROK VALIDATION
  useEffect(() => {
    if (selectedCarId && startDate && endDate) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      
      if (end <= start) {
          setCarError('Waktu selesai harus setelah waktu mulai');
          return;
      }

      const isAvailable = checkAvailability(bookings, selectedCarId, start, end, 'car');
      setCarError(isAvailable ? '' : 'Unit mobil ini sudah dibooking pada jadwal tersebut!');
    }
  }, [selectedCarId, startDate, startTime, endDate, endTime, bookings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (carError) return;

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    const newBooking: Booking = {
      id: Date.now().toString(),
      carId: selectedCarId,
      customerName,
      customerPhone,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      packageType: settings.rentalPackages[0],
      destination: 'Dalam Kota',
      securityDepositType: 'Uang',
      securityDepositValue: 0,
      securityDepositDescription: '',
      basePrice: 0,
      driverFee: 0,
      highSeasonFee: 0,
      deliveryFee: 0,
      totalPrice: 0,
      amountPaid: Number(amountPaid),
      status: BookingStatus.BOOKED,
      paymentStatus: PaymentStatus.UNPAID,
      notes: '',
      createdAt: Date.now()
    };

    const updated = [newBooking, ...bookings];
    setBookings(updated);
    setStoredData('bookings', updated);
    setSuccessMessage('Booking berhasil disimpan!');
    setTimeout(() => setSuccessMessage(''), 3000);
    setActiveTab('list');
  };

  const selectedCar = cars.find(c => c.id === selectedCarId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Booking & Jadwal</h2>
          <p className="text-slate-500">Anti-bentrok jadwal otomatis terintegrasi.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200">
           <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'list' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Daftar</button>
           <button onClick={() => setActiveTab('create')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'create' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Input Baru</button>
        </div>
      </div>

      {successMessage && <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2 shadow-sm animate-fade-in"><CheckCircle size={20} /> {successMessage}</div>}

      {activeTab === 'create' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2"><Calendar size={18}/> Waktu & Unit</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ambil Unit</label>
                        <input required type="date" className="w-full border p-2 rounded-md" value={startDate} onChange={e => setStartDate(e.target.value)} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jam</label>
                        <input type="time" className="w-full border p-2 rounded-md" value={startTime} onChange={e => setStartTime(e.target.value)} />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kembali Unit</label>
                        <input required type="date" className="w-full border p-2 rounded-md" value={endDate} onChange={e => setEndDate(e.target.value)} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Jam</label>
                        <input type="time" className="w-full border p-2 rounded-md" value={endTime} onChange={e => setEndTime(e.target.value)} />
                     </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pilih Mobil</label>
                    <select required className="w-full border p-2 rounded-md" value={selectedCarId} onChange={e => setSelectedCarId(e.target.value)}>
                        <option value="">-- Pilih Unit --</option>
                        {cars.map(c => <option key={c.id} value={c.id}>{c.name} - {c.plate}</option>)}
                    </select>
                    {carError && <p className="text-red-600 text-xs mt-1 font-bold flex items-center gap-1"><AlertTriangle size={12}/> {carError}</p>}
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2"><UserIcon size={18}/> Detail Penyewa</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                    <input required type="text" className="w-full border p-2 rounded-md" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp</label>
                    <input required type="tel" className="w-full border p-2 rounded-md" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pembayaran DP</label>
                    <input type="number" className="w-full border p-2 rounded-md bg-green-50" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
                  </div>
               </div>
            </div>
            <button type="submit" disabled={!!carError || !selectedCarId} className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:bg-slate-300 shadow-lg shadow-red-100 transition-all">Simpan Booking</button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
           {bookings.map(b => {
             const car = cars.find(c => c.id === b.carId);
             return (
               <div key={b.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 hover:border-red-200 transition-colors">
                  <div className="flex items-center gap-4 w-full">
                     <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500"><CarIcon size={24}/></div>
                     <div>
                        <h4 className="font-bold text-slate-800">{car?.name || 'Mobil Dihapus'}</h4>
                        <p className="text-xs text-slate-500">{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</p>
                        <p className="text-sm font-medium text-red-600">{b.customerName}</p>
                     </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto justify-end">
                     <button onClick={() => window.open(generateWhatsAppLink(b, car!), '_blank')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Kirim WA"><MessageCircle size={18}/></button>
                     <button onClick={() => generateInvoicePDF(b, car!)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Nota PDF"><Zap size={18}/></button>
                     <button className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100"><Edit2 size={18}/></button>
                  </div>
               </div>
             )
           })}
           {bookings.length === 0 && <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-400">Belum ada data booking.</div>}
        </div>
      )}
    </div>
  );
};

export default BookingPage;
