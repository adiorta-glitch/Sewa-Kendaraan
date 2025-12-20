
# Panduan Menjadikan Aplikasi Android & iOS (Capacitor)

Proyek ini sudah dilengkapi dengan **Capacitor**, framework yang memungkinkan aplikasi web (React/Vite) diubah menjadi aplikasi mobile native.

### Prasyarat (Wajib Install)
1.  **Node.js** (v18+)
2.  **Android Studio** (untuk build Android)
3.  **Xcode** (Hanya untuk pengguna Mac - untuk build iOS)

---

### Langkah 1: Build Project Web
Sebelum dijadikan aplikasi, kode React harus di-build menjadi file statis (HTML/CSS/JS).

```bash
npm run build
```
*Perintah ini akan membuat folder `dist/` yang berisi aplikasi siap pakai.*

### Langkah 2: Inisialisasi Mobile Platform
Jalankan perintah ini hanya **sekali** jika folder `android` atau `ios` belum ada.

**Untuk Android:**
```bash
npx cap add android
```

**Untuk iOS (Mac Only):**
```bash
npx cap add ios
```

### Langkah 3: Sinkronisasi Kode
Setiap kali Anda mengubah kode di `src/` atau `public/`, Anda harus melakukan build ulang dan sync ke native.

```bash
npm run build
npx cap sync
```
*Perintah `sync` akan menyalin isi folder `dist/` ke dalam folder native Android/iOS.*

### Langkah 4: Buka di Android Studio / Xcode

**Untuk Android:**
```bash
npx cap open android
```
*   Android Studio akan terbuka.
*   Tunggu proses Gradle sync selesai (lihat progress bar di bawah kanan).
*   Hubungkan HP Android via USB (pastikan USB Debugging aktif) atau gunakan Emulator.
*   Klik tombol **Run (Play)** hijau di toolbar atas.

**Untuk iOS:**
```bash
npx cap open ios
```
*   Xcode akan terbuka.
*   Pilih target device (Simulator atau iPhone asli).
*   Klik tombol **Play**.

---

### Tips Penting

1.  **Icon Aplikasi:**
    Ganti icon default Capacitor dengan icon Anda sendiri.
    *   Android: Ganti file di `android/app/src/main/res/mipmap-*`
    *   iOS: Ganti di `ios/App/App/Assets.xcassets/AppIcon.appiconset`
    *   *Saran: Gunakan tool `capacitor-assets` untuk generate icon otomatis.*

2.  **Permissions (Kamera/Lokasi):**
    Aplikasi ini meminta izin kamera dan lokasi. Pastikan izin tersebut sudah didefinisikan di `AndroidManifest.xml` (Android) dan `Info.plist` (iOS). 
    *Project ini sudah memiliki `metadata.json` yang meminta permission tersebut, namun pengecekan manual di file native tetap disarankan.*

3.  **Tombol Back (Android):**
    Capacitor sudah menangani tombol back secara default, namun jika ingin custom, edit di `App.tsx` menggunakan `App.addListener('backButton', ...)` dari `@capacitor/app`.

---

### Troubleshooting Umum

*   **Error "Webview not installed":** Pada emulator Android lama, pastikan "Android System WebView" terupdate via Play Store emulator.
*   **Halaman Putih (Blank Screen):** Biasanya karena path routing salah. Pastikan `vite.config.ts` dan `capacitor.config.json` mengarah ke folder `dist` yang benar.
*   **Api Key Error:** Jika peta atau firebase tidak muncul, pastikan `google-services.json` (Android) atau `GoogleService-Info.plist` (iOS) sudah dimasukkan ke folder native jika menggunakan layanan native Firebase (opsional, karena app ini menggunakan SDK Web yang tetap jalan di mobile).
