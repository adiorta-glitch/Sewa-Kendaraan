import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getStoredData, setStoredData, checkAvailability, DEFAULT_SETTINGS, compressImage } from '../services/dataService';
import { Car, Booking, BookingStatus, PaymentStatus, Transaction, Driver, HighSeason, AppSettings, Customer, User, VehicleChecklist } from '../types';
import { generateInvoicePDF, generateWhatsAppLink, generateDriverTaskLink } from '../services/pdfService';
import { Search, Plus, Trash2, MessageCircle, AlertTriangle, Calendar, User as UserIcon, Zap, CheckCircle, MapPin, Shield, Image as ImageIcon, X, FileText, ClipboardCheck, Fuel, Gauge, Car as CarIcon, Edit, Edit2, FileSpreadsheet, ChevronDown, Filter, Info, ArrowRight, Clock as ClockIcon, Send, DollarSign, Wallet, CheckSquare } from 'lucide-react';

interface Props {
    currentUser: User;
}

const BookingPage: React.FC<Props> = ({ currentUser }) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // Data State
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [highSeasons, setHighSeasons] = useState<HighSeason[]>([]);

  // Filtered Data State
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  
  // Filter State
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Form State
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);

  const [selectedCarId, setSelectedCarId] = useState<string>('');
  const [isCarDropdownOpen, setIsCarDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [useDriver, setUseDriver] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('08:00');
  
  // Overtime / Return
  const [actualReturnDate, setActualReturnDate] = useState('');
  const [actualReturnTime, setActualReturnTime] = useState('');
  const [overtimeFee, setOvertimeFee] = useState<number>(0);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [packageType, setPackageType] = useState<string>('');
  const [customBasePrice, setCustomBasePrice] = useState<number>(0); // Editable Rate
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  
  // New Fields
  const [destination, setDestination] = useState<'Dalam Kota' | 'Luar Kota'>('Dalam Kota');
  
  // Deposit
  const [securityDepositType, setSecurityDepositType] = useState<'Uang' | 'Barang'>('Uang');
  const [securityDepositValue, setSecurityDepositValue] = useState<number>(0);
  const [securityDepositDescription, setSecurityDepositDescription] = useState('');
  const [depositImage, setDepositImage] = useState<string | null>(null);

  // Status (Automated now, stored for internal logic)
  const [currentStatus, setCurrentStatus] = useState<BookingStatus>(BookingStatus.BOOKED);
  
  const [amountPaid, setAmountPaid] = useState<string>('0');
  const [paymentProofImage, setPaymentProofImage] = useState<string | null>(null); // New state for receipt
  const [notes, setNotes] = useState('');
  
  // Checklist Modal State
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistBooking, setChecklistBooking] = useState<Booking | null>(null);
  
  // Checklist Form State
  const [checkOdometer, setCheckOdometer] = useState<string>('');
  const [checkFuel, setCheckFuel] = useState<string>('');
  const [checkSpeedometerImg, setCheckSpeedometerImg] = useState<string | null>(null);
  const [checkFrontImg, setCheckFrontImg] = useState<string | null>(null);
  const [checkBackImg, setCheckBackImg] = useState<string | null>(null);
  const [checkLeftImg, setCheckLeftImg] = useState<string | null>(null);
  const [checkRightImg, setCheckRightImg] = useState<string | null>(null);
  const [checkNotes, setCheckNotes] = useState('');

  // Logic State
  const [carError, setCarError] = useState('');
  const [driverError, setDriverError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Calculation State
  const [durationDays, setDurationDays] = useState(0);
  const [pricing, setPricing] = useState({
    basePrice: 0,
    driverFee: 0,
    highSeasonFee: 0,
    deliveryFee: 0,
    overtimeFee: 0,
    totalPrice: 0
  });

  const isSuperAdmin = currentUser.role === 'superadmin';

  useEffect(() => {
    setCars(getStoredData<Car[]>('cars', []));
    setBookings(getStoredData<Booking[]>('bookings', []));
    setDrivers(getStoredData<Driver[]>('drivers', []));
    setHighSeasons(getStoredData<HighSeason[]>('highSeasons', []));
    setCustomers(getStoredData<Customer[]>('customers', []));
    const loadedSettings = getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS);
    setSettings(loadedSettings);
    if(loadedSettings.rentalPackages.length > 0) {
        setPackageType(loadedSettings.rentalPackages[0]);
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsCarDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle URL Params for Filtering
  useEffect(() => {
      const dateParam = searchParams.get('date');
      if (dateParam) {
          setFilterStartDate(dateParam);
          setFilterEndDate(dateParam);
      }
  }, [searchParams]);

  useEffect(() => {
      if (selectedCustomerId) {
          const cust = customers.find(c => c.id === selectedCustomerId);
          if (cust) {
              setCustomerName(cust.name);
              setCustomerPhone(cust.phone);
          }
      }
  }, [selectedCustomerId, customers]);

  // Update Custom Base Price when Car or Package changes (Only if not editing existing booking to prevent overwrite)
  useEffect(() => {
      if (!selectedCarId || !packageType || editingBookingId) return;
      
      const car = cars.find(c => c.id === selectedCarId);
      if (car) {
          let price = car.price24h || 0;
          if (car.pricing && car.pricing[packageType]) {
              price = car.pricing[packageType];
          }
          setCustomBasePrice(price);
      }
  }, [selectedCarId, packageType, cars, editingBookingId]);

  const handleDepositImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
          const compressed = await compressImage(file);
          setDepositImage(compressed);
      } catch (e) {
          alert("Gagal memproses gambar. Gunakan file lain.");
      }
    }
  };

  const handlePaymentProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
          const compressed = await compressImage(file);
          setPaymentProofImage(compressed);
      } catch (e) {
          alert("Gagal memproses gambar bukti bayar.");
      }
    }
  };

  const handleChecklistImageUpload = async (field: 'speedometer' | 'front' | 'back' | 'left' | 'right', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const res = await compressImage(file);
            if (field === 'speedometer') setCheckSpeedometerImg(res);
            if (field === 'front') setCheckFrontImg(res);
            if (field === 'back') setCheckBackImg(res);
            if (field === 'left') setCheckLeftImg(res);
            if (field === 'right') setCheckRightImg(res);
        } catch(e) {
            alert("Gagal memproses gambar.");
        }
    }
  };

  useEffect(() => {
      if (!startDate || !endDate) {
          setAvailableDrivers(drivers);
          return;
      }

      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);

      if (end <= start) {
          setAvailableDrivers(drivers);
          return;
      }

      const filteredDrivers = drivers.filter(driver => {
          return checkAvailability(bookings, driver.id, start, end, 'driver', editingBookingId || undefined);
      });

      setAvailableDrivers(filteredDrivers);

  }, [startDate, startTime, endDate, endTime, cars, drivers, bookings, editingBookingId]);


  useEffect(() => {
    if (!startDate || !endDate) return;

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    
    // Calculate Duration in Days
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.max(1, Math.ceil(diffHours / 24));
    setDurationDays(diffDays);

    if (selectedCarId) {
      const isCarAvailable = checkAvailability(bookings, selectedCarId, start, end, 'car', editingBookingId || undefined);
      setCarError(isCarAvailable ? '' : 'Mobil ini sudah dibooking pada tanggal tersebut (Bentrok).');
    } else {
        setCarError('');
    }

    if (useDriver && selectedDriverId) {
        const isDriverAvailable = checkAvailability(bookings, selectedDriverId, start, end, 'driver', editingBookingId || undefined);
        setDriverError(isDriverAvailable ? '' : 'Driver sedang bertugas di jadwal ini!');
    } else {
        setDriverError('');
    }

    // Calculation Logic
    if (start < end) {
        const driver = useDriver ? drivers.find(d => d.id === selectedDriverId) : undefined;
        
        // 1. Base Price (Custom Rate * Days)
        const totalBase = customBasePrice * diffDays;

        // 2. Driver Fee
        let totalDriver = 0;
        if (driver) {
            totalDriver = driver.dailyRate * diffDays;
        }

        // 3. High Season
        let hsFee = 0;
        highSeasons.forEach(hs => {
            const hsStart = new Date(hs.startDate);
            const hsEnd = new Date(hs.endDate);
            if (start < hsEnd && end > hsStart) {
                hsFee += hs.priceIncrease * diffDays;
            }
        });

        const total = totalBase + totalDriver + hsFee + deliveryFee + (overtimeFee || 0);
            
        setPricing({
            basePrice: totalBase,
            driverFee: totalDriver,
            highSeasonFee: hsFee,
            deliveryFee: deliveryFee,
            overtimeFee: overtimeFee || 0,
            totalPrice: total
        });
    }
  }, [selectedCarId, selectedDriverId, useDriver, startDate, startTime, endDate, endTime, customBasePrice, deliveryFee, bookings, cars, drivers, highSeasons, editingBookingId, overtimeFee]);

  const handleEdit = (booking: Booking) => {
      setEditingBookingId(booking.id);
      setActiveTab('create');
      setPaymentProofImage(null); // Reset proof image for new edit session
      
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      
      // Calculate derived rate per day for UI
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.max(1, Math.ceil((diffMs / (1000 * 60 * 60)) / 24));
      const ratePerDay = booking.basePrice / diffDays;

      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0,5));
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0,5));
      
      setSelectedCarId(booking.carId);
      setUseDriver(!!booking.driverId);
      setSelectedDriverId(booking.driverId || '');
      setSelectedCustomerId(booking.customerId || '');
      setCustomerName(booking.customerName);
      setCustomerPhone(booking.customerPhone);
      setDestination(booking.destination);
      setPackageType(booking.packageType);
      
      setCustomBasePrice(ratePerDay); // Set Editable Field
      
      setDeliveryFee(booking.deliveryFee);
      
      setSecurityDepositType(booking.securityDepositType);
      setSecurityDepositValue(booking.securityDepositValue);
      setSecurityDepositDescription(booking.securityDepositDescription);
      setDepositImage(booking.securityDepositImage || null);
      
      setCurrentStatus(booking.status);
      setAmountPaid(booking.amountPaid.toString());
      setNotes(booking.notes);

      setOvertimeFee(booking.overtimeFee || 0);
      if (booking.actualReturnDate) {
          const act = new Date(booking.actualReturnDate);
          setActualReturnDate(act.toISOString().split('T')[0]);
          setActualReturnTime(act.toTimeString().slice(0,5));
      } else {
          setActualReturnDate('');
          setActualReturnTime('');
      }
  };

  const handlePayFull = (booking: Booking) => {
      handleEdit(booking);
      // Automatically set amount paid to total price
      setAmountPaid(booking.totalPrice.toString());
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteBooking = (booking: Booking) => {
      handleEdit(booking);
      
      // Set Actual Return to NOW
      const now = new Date();
      // Adjust timezone to local if needed, but ISO string split usually works for input value
      // Using simple string manipulation for local time
      const dateStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

      setActualReturnDate(dateStr);
      setActualReturnTime(timeStr);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (carError || driverError) return;

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    
    if (end <= start) {
      alert('Waktu selesai harus setelah waktu mulai');
      return;
    }

    let actReturnIso = undefined;
    if (actualReturnDate && actualReturnTime) {
        actReturnIso = new Date(`${actualReturnDate}T${actualReturnTime}`).toISOString();
    }

    // --- AUTOMATED STATUS LOGIC ---
    let finalStatus = BookingStatus.BOOKED;
    
    if (actReturnIso) {
        finalStatus = BookingStatus.COMPLETED;
    } else if (currentStatus === BookingStatus.ACTIVE) {
        // Keep active if it was already active (via checklist)
        finalStatus = BookingStatus.ACTIVE;
    } else {
        // Default new or booked
        finalStatus = BookingStatus.BOOKED;
    }

    // --- AUTOMATED PAYMENT STATUS LOGIC ---
    const paid = parseInt(amountPaid) || 0;
    let finalPaymentStatus = PaymentStatus.UNPAID;
    
    if (paid >= pricing.totalPrice) {
        finalPaymentStatus = PaymentStatus.PAID;
    } else if (paid > 0) {
        finalPaymentStatus = PaymentStatus.PARTIAL;
    }

    const newBooking: Booking = {
      id: editingBookingId || Date.now().toString(),
      carId: selectedCarId,
      driverId: useDriver ? selectedDriverId : undefined,
      customerId: selectedCustomerId || undefined,
      customerName,
      customerPhone,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      actualReturnDate: actReturnIso,
      
      packageType,
      destination,
      securityDepositType,
      securityDepositValue,
      securityDepositDescription,
      securityDepositImage: depositImage || undefined,

      basePrice: pricing.basePrice,
      driverFee: pricing.driverFee,
      highSeasonFee: pricing.highSeasonFee,
      deliveryFee: pricing.deliveryFee,
      overtimeFee: overtimeFee,
      totalPrice: pricing.totalPrice,
      
      amountPaid: paid,
      status: finalStatus,
      paymentStatus: finalPaymentStatus,
      notes,
      checklist: editingBookingId ? bookings.find(b => b.id === editingBookingId)?.checklist : undefined,
      createdAt: editingBookingId ? (bookings.find(b => b.id === editingBookingId)?.createdAt || Date.now()) : Date.now()
    };

    // --- TRANSACTION RECORDING LOGIC ---
    let shouldCreateTx = false;
    let txAmount = 0;
    
    if (newBooking.amountPaid > 0) {
        if (!editingBookingId) {
            // New Booking
            shouldCreateTx = true;
            txAmount = newBooking.amountPaid;
        } else {
            // Editing: Calculate if payment amount increased
            const oldBooking = bookings.find(b => b.id === editingBookingId);
            const oldPaid = oldBooking ? oldBooking.amountPaid : 0;
            if (newBooking.amountPaid > oldPaid) {
                shouldCreateTx = true;
                txAmount = newBooking.amountPaid - oldPaid;
            }
        }
    }

    if (shouldCreateTx && txAmount > 0) {
        const transaction: Transaction = {
            id: `tx-${Date.now()}`,
            date: new Date().toISOString(), // Use current timestamp for payment record
            amount: txAmount,
            type: 'Income',
            category: 'Rental Payment',
            description: `Pembayaran ${editingBookingId ? 'Tambahan' : ''} ${newBooking.customerName} - ${cars.find(c => c.id === selectedCarId)?.name || 'Mobil'}`,
            bookingId: newBooking.id,
            receiptImage: paymentProofImage || undefined // Attach proof if uploaded
        };
        const currentTx = getStoredData<Transaction[]>('transactions', []);
        setStoredData('transactions', [transaction, ...currentTx]);
    }
    // -----------------------------------

    let updatedBookings;
    if (editingBookingId) {
        updatedBookings = bookings.map(b => b.id === editingBookingId ? newBooking : b);
    } else {
        updatedBookings = [newBooking, ...bookings];
    }

    setBookings(updatedBookings);
    setStoredData('bookings', updatedBookings);
    
    setSuccessMessage(editingBookingId ? `Booking diperbarui (Status: ${finalStatus}, Pembayaran: ${finalPaymentStatus})` : 'Booking berhasil disimpan!');
    setTimeout(() => setSuccessMessage(''), 3000);
    setActiveTab('list');
    resetForm();
  };

  const resetForm = () => {
    setEditingBookingId(null);
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCarId('');
    setSelectedDriverId('');
    setUseDriver(false);
    setStartDate('');
    setEndDate('');
    setAmountPaid('0');
    setDeliveryFee(0);
    setSecurityDepositValue(0);
    setSecurityDepositDescription('');
    setDepositImage(null);
    setPaymentProofImage(null);
    setNotes('');
    setCarError('');
    setDriverError('');
    setOvertimeFee(0);
    setActualReturnDate('');
    setActualReturnTime('');
    setCustomBasePrice(0);
    setCurrentStatus(BookingStatus.BOOKED);
    setPricing({ basePrice:0, driverFee:0, highSeasonFee:0, deliveryFee:0, overtimeFee: 0, totalPrice:0 });
  };

  const handleDelete = (id: string) => {
      if(window.confirm('Hapus data booking ini secara permanen?')) {
          setBookings(prev => {
              const updated = prev.filter(b => b.id !== id);
              setStoredData('bookings', updated);
              return updated;
          });
      }
  };

  const handleExportCSV = () => {
      let dataToExport = bookings;
      if (filterStartDate || filterEndDate) {
          dataToExport = bookings.filter(b => {
             const bDate = b.startDate.split('T')[0];
             const start = filterStartDate || '0000-00-00';
             const end = filterEndDate || '9999-12-31';
             return bDate >= start && bDate <= end;
          });
      }

      if (dataToExport.length === 0) {
          alert("Tidak ada data booking yang cocok dengan filter tanggal untuk diexport.");
          return;
      }

      const headers = [
          "ID Booking", 
          "Nama Pelanggan", 
          "No HP", 
          "Mobil", 
          "Plat Nomor", 
          "Driver", 
          "Tgl Mulai", 
          "Tgl Selesai", 
          "Tujuan",
          "Paket",
          "Total Biaya", 
          "Status Bayar", 
          "Status Booking"
      ];

      const rows = dataToExport.map(b => {
          const car = cars.find(c => c.id === b.carId);
          const driver = drivers.find(d => d.id === b.driverId);
          
          return [
              b.id.slice(0, 8),
              b.customerName,
              b.customerPhone,
              car?.name || '-',
              car?.plate || '-',
              driver ? driver.name : 'Tanpa Driver',
              new Date(b.startDate).toLocaleString('id-ID'),
              new Date(b.endDate).toLocaleString('id-ID'),
              b.destination,
              b.packageType,
              b.totalPrice,
              b.paymentStatus,
              b.status
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const dateSuffix = filterStartDate ? `_${filterStartDate}_to_${filterEndDate || 'now'}` : '_All';
      link.setAttribute("download", `Data_Booking_BRC${dateSuffix}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const openChecklistModal = (booking: Booking) => {
      setChecklistBooking(booking);
      if (booking.checklist) {
          setCheckOdometer(booking.checklist.odometer.toString());
          setCheckFuel(booking.checklist.fuelLevel);
          setCheckSpeedometerImg(booking.checklist.speedometerImage);
          setCheckFrontImg(booking.checklist.physicalImages.front || null);
          setCheckBackImg(booking.checklist.physicalImages.back || null);
          setCheckLeftImg(booking.checklist.physicalImages.left || null);
          setCheckRightImg(booking.checklist.physicalImages.right || null);
          setCheckNotes(booking.checklist.notes || '');
      } else {
          setCheckOdometer('');
          setCheckFuel('Full');
          setCheckSpeedometerImg(null);
          setCheckFrontImg(null);
          setCheckBackImg(null);
          setCheckLeftImg(null);
          setCheckRightImg(null);
          setCheckNotes('');
      }
      setIsChecklistModalOpen(true);
  };

  const saveChecklist = (e: React.FormEvent) => {
      e.preventDefault();
      if (!checklistBooking || !checkSpeedometerImg) {
          alert("Foto Speedometer Wajib Diisi!");
          return;
      }

      const updatedChecklist: VehicleChecklist = {
          odometer: Number(checkOdometer),
          fuelLevel: checkFuel,
          speedometerImage: checkSpeedometerImg,
          physicalImages: {
              front: checkFrontImg || undefined,
              back: checkBackImg || undefined,
              left: checkLeftImg || undefined,
              right: checkRightImg || undefined,
          },
          notes: checkNotes,
          checkedAt: Date.now(),
          checkedBy: currentUser.name
      };

      const updatedBookings = bookings.map(b => {
          if (b.id === checklistBooking.id) {
              // Automatically set to ACTIVE if currently BOOKED
              const newStatus = b.status === BookingStatus.BOOKED ? BookingStatus.ACTIVE : b.status;
              return { ...b, checklist: updatedChecklist, status: newStatus };
          }
          return b;
      });

      setBookings(updatedBookings);
      setStoredData('bookings', updatedBookings);
      setIsChecklistModalOpen(false);
      setSuccessMessage("Checklist disimpan & Status Transaksi Menjadi Active!");
      setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getFilteredBookings = () => {
      let filtered = bookings;

      // Filter by Date
      if (filterStartDate || filterEndDate) {
          filtered = filtered.filter(b => {
             const bDate = b.startDate.split('T')[0];
             const start = filterStartDate || '0000-00-00';
             const end = filterEndDate || '9999-12-31';
             return bDate >= start && bDate <= end;
          });
      }

      // Filter by Status
      if (filterStatus !== 'All') {
          filtered = filtered.filter(b => b.status === filterStatus);
      }

      return filtered;
  };

  const selectedCarData = cars.find(c => c.id === selectedCarId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Booking & Jadwal</h2>
          <p className="text-slate-500">Reservasi unit, jaminan, dan jadwal perjalanan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           {activeTab === 'list' && (
              <button onClick={handleExportCSV} className="px-4 py-2 rounded-md text-sm font-medium transition-colors text-green-700 bg-green-100 hover:bg-green-200 border border-green-200 flex items-center gap-2">
                 <FileSpreadsheet size={18} /> Export CSV
              </button>
           )}
           <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
             <button onClick={() => { setActiveTab('list'); resetForm(); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Daftar Booking</button>
             <button onClick={() => { setActiveTab('create'); resetForm(); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'create' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Buat Baru</button>
           </div>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle size={20} />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
             <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800">{editingBookingId ? 'Edit Data Booking' : 'Input Booking Baru'}</h3>
                 {editingBookingId && (
                     <button onClick={resetForm} className="text-xs text-red-600 hover:underline">Batal Edit</button>
                 )}
             </div>
             <form onSubmit={handleCreateBooking} className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                         <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={20} /></div>
                            Jadwal & Durasi Sewa
                         </h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                             <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mulai Sewa (Ambil Unit)</label>
                                 <div className="flex gap-2">
                                     <input required type="date" className="block w-full border border-slate-300 bg-white p-2 rounded-md text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                     <input type="time" className="block w-full border border-slate-300 bg-white p-2 rounded-md text-sm" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                 </div>
                             </div>
                             <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Selesai (Jadwal Kembali)</label>
                                 <div className="flex gap-2">
                                     <input required type="date" className="block w-full border border-slate-300 bg-white p-2 rounded-md text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                     <input type="time" className="block w-full border border-slate-300 bg-white p-2 rounded-md text-sm" value={endTime} onChange={e => setEndTime(e.target.value)} />
                                 </div>
                             </div>
                         </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-slate-700">Pilih Unit Mobil <span className="text-slate-400 font-normal text-xs">(Hanya unit ready)</span></label>
                            {packageType && <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded">Paket: {packageType}</span>}
                        </div>
                        {carError && <div className="mb-2 text-red-600 text-sm bg-red-50 p-2 rounded border border-red-100 flex items-center gap-2"><AlertTriangle size={14}/> {carError}</div>}
                        
                        <div className="relative" ref={dropdownRef}>
                            <div onClick={() => setIsCarDropdownOpen(!isCarDropdownOpen)} className={`w-full border rounded-lg p-3 cursor-pointer flex items-center justify-between bg-white transition-all ${isCarDropdownOpen ? 'ring-2 ring-indigo-200 border-indigo-500' : 'hover:border-indigo-300'}`}>
                                {selectedCarData ? (
                                    <div className="flex items-center gap-3">
                                        <img src={selectedCarData.image} alt={selectedCarData.name} className="w-12 h-8 object-cover rounded bg-slate-100" />
                                        <div>
                                            <p className="font-semibold text-sm text-slate-800">{selectedCarData.name}</p>
                                            <p className="text-xs text-slate-500">{selectedCarData.plate}</p>
                                        </div>
                                    </div>
                                ) : <span className="text-slate-500 text-sm">-- Pilih Mobil --</span>}
                                <ChevronDown size={18} className="text-slate-400" />
                            </div>
                            {isCarDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                                    {cars.length === 0 ? <div className="p-4 text-center text-slate-500 text-sm">Belum ada data armada mobil.</div> : cars.map(car => {
                                        const isAvailable = (!startDate || !endDate) ? true : checkAvailability(bookings, car.id, new Date(`${startDate}T${startTime}`), new Date(`${endDate}T${endTime}`), 'car', editingBookingId || undefined);
                                        return (
                                            <div key={car.id} onClick={() => { if (isAvailable) { setSelectedCarId(car.id); setIsCarDropdownOpen(false); } }} className={`p-3 flex items-center gap-3 border-b last:border-0 border-slate-50 transition-colors ${!isAvailable ? 'bg-slate-100 cursor-not-allowed opacity-60' : selectedCarId === car.id ? 'bg-indigo-50 cursor-pointer' : 'hover:bg-slate-50 cursor-pointer'}`}>
                                                <img src={car.image} alt={car.name} className="w-12 h-8 object-cover rounded bg-slate-100" />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center"><p className="font-semibold text-sm">{car.name}</p>{!isAvailable && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold uppercase">Sedang Dipakai</span>}</div>
                                                    <p className="text-xs text-slate-500">{car.plate}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2"><UserIcon size={18} /> Layanan Supir</h4>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" checked={useDriver} onChange={e => setUseDriver(e.target.checked)} /><span className="text-sm font-medium text-slate-700">Butuh Driver?</span></label>
                        </div>
                        {useDriver && <select className="w-full border p-2 rounded-md text-sm" value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)} required={useDriver}><option value="">-- Pilih Driver --</option>{availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name} - Rp {d.dailyRate.toLocaleString('id-ID')}/hari</option>)}</select>}
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                         <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Shield size={18} /> Jaminan</h4>
                         <div className="space-y-4">
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="depositType" value="Uang" checked={securityDepositType === 'Uang'} onChange={() => setSecurityDepositType('Uang')} /> Uang</label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="depositType" value="Barang" checked={securityDepositType === 'Barang'} onChange={() => setSecurityDepositType('Barang')} /> Barang</label>
                            </div>
                            {securityDepositType === 'Uang' ? <input type="number" className="w-full border rounded p-2 text-sm" placeholder="Nominal Rp" value={securityDepositValue} onChange={e => setSecurityDepositValue(Number(e.target.value))} /> : <input type="text" className="w-full border rounded p-2 text-sm" placeholder="Keterangan Jaminan" value={securityDepositDescription} onChange={e => setSecurityDepositDescription(e.target.value)} />}
                            <input type="file" accept="image/*" onChange={handleDepositImageUpload} className="block w-full text-sm text-slate-500"/>
                         </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900 border-b pb-2">Data Penyewa & Tujuan</h4>
                        
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Pilih Pelanggan (Opsional)</label>
                            <select 
                                className="block w-full border p-2 rounded text-sm bg-slate-50"
                                value={selectedCustomerId} 
                                onChange={(e) => {
                                    const cid = e.target.value;
                                    setSelectedCustomerId(cid);
                                    if(!cid) {
                                        setCustomerName('');
                                        setCustomerPhone('');
                                    }
                                }}
                            >
                                <option value="">-- Input Manual / Pelanggan Baru --</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                                ))}
                            </select>
                        </div>

                        <input type="text" placeholder="Nama Penyewa" className="block w-full border p-2 rounded text-sm" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                        <input type="tel" placeholder="No WhatsApp" className="block w-full border p-2 rounded text-sm" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
                        
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-slate-500">Paket & Harga</label>
                            <select className="block w-full border p-2 rounded text-sm" value={packageType} onChange={(e:any) => setPackageType(e.target.value)}>{settings.rentalPackages.map(pkg => <option key={pkg} value={pkg}>{pkg}</option>)}</select>
                            
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500 text-xs font-bold">Rp</span>
                                <input 
                                    type="number" 
                                    className="block w-full border p-2 pl-8 rounded text-sm bg-white focus:ring-1 focus:ring-indigo-500" 
                                    value={customBasePrice} 
                                    onChange={e => setCustomBasePrice(Number(e.target.value))}
                                    placeholder="Harga Sewa Per Hari/Paket" 
                                />
                                <span className="absolute right-3 top-2.5 text-gray-400 text-[10px]">Per Hari/Paket</span>
                            </div>

                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500 text-xs font-bold">Rp</span>
                                <input 
                                    type="number" 
                                    placeholder="Biaya Antar / Jemput" 
                                    className="block w-full border p-2 pl-8 rounded text-sm" 
                                    value={deliveryFee} 
                                    onChange={e => setDeliveryFee(Number(e.target.value))} 
                                />
                                <span className="absolute right-3 top-2.5 text-gray-400 text-[10px]">Biaya Antar</span>
                            </div>
                        </div>

                        <textarea className="block w-full border p-2 rounded text-sm" rows={2} placeholder="Catatan..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                    
                    {/* Detailed Calculation Box */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-sm">
                        <div className="flex justify-between text-slate-600">
                            <span>Harga Unit ({durationDays} hari)</span>
                            <span>{pricing.basePrice.toLocaleString('id-ID')}</span>
                        </div>
                        {pricing.driverFee > 0 && (
                            <div className="flex justify-between text-slate-600">
                                <span>Jasa Driver ({durationDays} hari)</span>
                                <span>{pricing.driverFee.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        {pricing.highSeasonFee > 0 && (
                            <div className="flex justify-between text-orange-600">
                                <span>High Season</span>
                                <span>{pricing.highSeasonFee.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        {pricing.deliveryFee > 0 && (
                            <div className="flex justify-between text-slate-600">
                                <span>Antar/Jemput</span>
                                <span>{pricing.deliveryFee.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        {pricing.overtimeFee > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>Overtime</span>
                                <span>{pricing.overtimeFee.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="border-t border-slate-300 my-2 pt-2 flex justify-between font-bold text-lg text-indigo-900">
                            <span>Total</span>
                            <span>Rp {pricing.totalPrice.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pembayaran</label>
                        <input type="number" placeholder="Jumlah Bayar (DP / Lunas)" className="w-full border p-3 rounded-lg text-sm font-bold text-slate-800 bg-green-50 border-green-200" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
                        
                        <div className="flex items-center justify-between text-xs px-1">
                            <span className="text-slate-500">Status Bayar Otomatis:</span>
                            <span className={`font-bold ${parseInt(amountPaid) >= pricing.totalPrice ? 'text-green-600' : parseInt(amountPaid) > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                                {parseInt(amountPaid) >= pricing.totalPrice ? 'LUNAS' : parseInt(amountPaid) > 0 ? 'DP (PARTIAL)' : 'BELUM LUNAS'}
                            </span>
                        </div>

                        {/* File Upload for Payment Proof */}
                        <div className="mt-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Bukti Transfer / Nota Pelunasan</label>
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs font-medium border border-slate-300 flex items-center gap-2 w-full justify-center">
                                    <ImageIcon size={14}/> {paymentProofImage ? 'Ganti Foto' : 'Upload Bukti'}
                                    <input type="file" className="hidden" accept="image/*" onChange={handlePaymentProofUpload} />
                                </label>
                                {paymentProofImage && (
                                    <div className="w-10 h-10 bg-slate-200 rounded overflow-hidden flex-shrink-0 border border-slate-300">
                                        <img src={paymentProofImage} alt="Bukti" className="w-full h-full object-cover"/>
                                    </div>
                                )}
                            </div>
                        </div>

                        {editingBookingId && (currentStatus === BookingStatus.ACTIVE || currentStatus === BookingStatus.COMPLETED || actualReturnDate) && (
                            <div className="pt-4 mt-4 border-t animate-fade-in">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Actual Return (Pengembalian)</label>
                                <div className="flex gap-2">
                                     <input type="date" className="block w-full border border-slate-300 bg-white p-2 rounded-md text-sm" value={actualReturnDate} onChange={e => setActualReturnDate(e.target.value)} />
                                     <input type="time" className="block w-full border border-slate-300 bg-white p-2 rounded-md text-sm" value={actualReturnTime} onChange={e => setActualReturnTime(e.target.value)} />
                                 </div>
                                 <p className="text-[10px] text-slate-400 mt-1">*Mengisi ini akan mengubah status menjadi COMPLETED</p>
                            </div>
                        )}

                        <button type="submit" disabled={!!carError || !!driverError || !selectedCarId} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 mt-4 shadow-lg shadow-indigo-200">
                            {editingBookingId ? 'Simpan Perubahan' : 'Simpan Booking'}
                        </button>
                    </div>
                </div>
             </form>
        </div>
      )}

      {/* --- NEW CARD LIST VIEW --- */}
      {activeTab === 'list' && (
        <div className="space-y-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-wrap gap-4 items-center shadow-sm">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Filter size={16}/> Filter:</span>
                <input type="date" className="border rounded px-2 py-1 text-sm text-slate-600" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                <span className="text-slate-400">-</span>
                <input type="date" className="border rounded px-2 py-1 text-sm text-slate-600" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
                
                <select 
                    className="border rounded px-2 py-1 text-sm text-slate-600" 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                >
                    <option value="All">Semua Status</option>
                    <option value={BookingStatus.BOOKED}>{BookingStatus.BOOKED}</option>
                    <option value={BookingStatus.ACTIVE}>{BookingStatus.ACTIVE}</option>
                    <option value={BookingStatus.COMPLETED}>{BookingStatus.COMPLETED}</option>
                    <option value={BookingStatus.CANCELLED}>{BookingStatus.CANCELLED}</option>
                </select>

                {(filterStartDate || filterEndDate || filterStatus !== 'All') && (
                    <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setFilterStatus('All'); }} className="text-xs text-red-600 hover:underline">Reset</button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4">
                {getFilteredBookings().sort((a,b) => b.createdAt - a.createdAt).map(booking => {
                    const car = cars.find(c => c.id === booking.carId);
                    const driver = drivers.find(d => d.id === booking.driverId);
                    const due = booking.totalPrice - booking.amountPaid;
                    
                    return (
                        <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                            {/* Status Stripe */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                booking.status === 'Active' ? 'bg-green-500' :
                                booking.status === 'Completed' ? 'bg-blue-500' :
                                booking.status === 'Cancelled' ? 'bg-red-500' : 'bg-slate-300'
                            }`}></div>

                            <div className="pl-3">
                                {/* Top Row */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                            <CarIcon size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{car?.name || 'Unknown'}</h3>
                                            <div className="flex items-center gap-2 text-sm mt-1">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono border border-slate-200">{car?.plate}</span>
                                                {driver && (
                                                    <span className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-xs border border-orange-100">
                                                        <UserIcon size={10}/> {driver.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                            booking.status === 'Active' ? 'bg-green-100 text-green-700' :
                                            booking.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                                            booking.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {booking.status}
                                        </span>
                                        <div className="text-[10px] text-slate-400 mt-1 font-mono">#{booking.id.slice(0,8)}</div>
                                    </div>
                                </div>

                                {/* Detail Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-t border-slate-100 border-b border-slate-100 mb-4 bg-slate-50/50 rounded-lg px-2">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Penyewa</p>
                                        <p className="font-bold text-slate-800 text-sm">{booking.customerName}</p>
                                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                            <MessageCircle size={10} /> {booking.customerPhone}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Jadwal & Tujuan</p>
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <Calendar size={14} className="text-indigo-400"/>
                                            <span>{new Date(booking.startDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} - {new Date(booking.endDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                                        </div>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded ${booking.destination === 'Luar Kota' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}`}>
                                                {booking.destination}
                                            </span>
                                            {booking.overtimeFee && booking.overtimeFee > 0 ? <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">Overtime</span> : null}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Keuangan</p>
                                        <p className="font-bold text-lg text-slate-800">Rp {booking.totalPrice.toLocaleString('id-ID')}</p>
                                        <div className="text-xs mt-0.5">
                                            {due > 0 ? (
                                                <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">Kurang: {due.toLocaleString('id-ID')}</span>
                                            ) : (
                                                <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded flex items-center gap-1 w-fit"><CheckCircle size={10}/> Lunas</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons (Below Details) */}
                                <div className="flex flex-wrap justify-end gap-2">
                                    {car && (
                                        <>
                                            {booking.status !== BookingStatus.COMPLETED && booking.status !== BookingStatus.CANCELLED && (
                                                <button
                                                    onClick={() => handleCompleteBooking(booking)}
                                                    title="Selesaikan Sewa (Unit Kembali)"
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                                                >
                                                    <CheckSquare size={14}/> Selesai
                                                </button>
                                            )}

                                            {due > 0 && (
                                                <button 
                                                    onClick={() => handlePayFull(booking)}
                                                    title="Bayar Lunas Sekarang"
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm animate-pulse"
                                                >
                                                    <Wallet size={14}/> Lunasi
                                                </button>
                                            )}
                                            
                                            <button onClick={() => handleEdit(booking)} title="Edit" className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                                                <Edit2 size={14} /> Edit
                                            </button>
                                            <button onClick={() => openChecklistModal(booking)} title="Checklist" className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${booking.checklist ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}>
                                                <ClipboardCheck size={14} /> Checklist
                                            </button>
                                            
                                            <div className="h-8 w-px bg-slate-200 mx-1"></div>

                                            <button onClick={() => window.open(generateWhatsAppLink(booking, car), '_blank')} title="Kirim Nota WA" className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                                                <MessageCircle size={14} /> Nota WA
                                            </button>
                                            
                                            {driver && (
                                                <button onClick={() => window.open(generateDriverTaskLink(booking, car, driver), '_blank')} title="Kirim Tugas" className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-medium hover:bg-orange-100 transition-colors">
                                                    <Send size={14} /> Tugas
                                                </button>
                                            )}

                                            <button onClick={() => generateInvoicePDF(booking, car)} title="Download PDF" className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                                                <Zap size={14} /> PDF
                                            </button>
                                        </>
                                    )}
                                    
                                    {isSuperAdmin && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(booking.id);
                                            }} 
                                            title="Hapus" 
                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors ml-2"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {/* Checklist Modal is kept same (No changes needed) */}
      {isChecklistModalOpen && checklistBooking && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             {/* ... Checklist Modal Content ... */}
             <div className="bg-white rounded-xl w-full max-w-4xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                 <div className="flex justify-between items-center mb-6 pb-4 border-b">
                     <div>
                        <h3 className="text-xl font-bold text-slate-800">Checklist Serah Terima Unit</h3>
                        <p className="text-sm text-slate-500">ID: {checklistBooking.id.slice(0,8)} - {checklistBooking.customerName}</p>
                     </div>
                     <button onClick={() => setIsChecklistModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                         <X size={24} />
                     </button>
                 </div>

                 <form onSubmit={saveChecklist} className="space-y-6">
                    {/* ... Form Body (Same as before) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2"><Gauge size={18} /> Indikator Kendaraan</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">KM (Odometer)</label>
                                    <input required type="number" className="w-full border rounded p-2 mt-1" placeholder="Ex: 54000" value={checkOdometer} onChange={e => setCheckOdometer(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">BBM (Fuel)</label>
                                    <select className="w-full border rounded p-2 mt-1" value={checkFuel} onChange={e => setCheckFuel(e.target.value)}><option value="Full">Full</option><option value="3/4">3/4</option><option value="1/2">1/2</option><option value="1/4">1/4</option><option value="Empty">Empty / Res</option></select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Foto Speedometer (Wajib)</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 relative h-40 flex flex-col items-center justify-center">
                                    {checkSpeedometerImg ? <img src={checkSpeedometerImg} className="absolute inset-0 w-full h-full object-contain p-2" /> : <div className="text-slate-400"><Gauge className="mx-auto mb-2" /><span className="text-xs">Upload Foto Speedometer</span></div>}
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleChecklistImageUpload('speedometer', e)} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2"><CarIcon size={18} /> Foto Fisik (Opsional)</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {[{ label: 'Depan', val: checkFrontImg, key: 'front' }, { label: 'Belakang', val: checkBackImg, key: 'back' }, { label: 'Kiri', val: checkLeftImg, key: 'left' }, { label: 'Kanan', val: checkRightImg, key: 'right' }].map((item) => (
                                    <div key={item.key} className="border rounded-lg h-24 relative bg-slate-50 flex items-center justify-center overflow-hidden">
                                        {item.val ? <img src={item.val} className="w-full h-full object-cover" /> : <span className="text-xs text-slate-400">{item.label}</span>}
                                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleChecklistImageUpload(item.key as any, e)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 border-t">
                        <label className="block text-sm font-medium text-slate-700">Catatan Kondisi (Baret/Penyok dll)</label>
                        <textarea className="w-full border rounded p-2 mt-1" rows={3} value={checkNotes} onChange={e => setCheckNotes(e.target.value)} placeholder="Tuliskan catatan kerusakan yang sudah ada sebelumnya..." />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsChecklistModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium">Batal</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Simpan Checklist</button>
                    </div>
                 </form>
             </div>
          </div>
      )}
    </div>
  );
};

export default BookingPage;