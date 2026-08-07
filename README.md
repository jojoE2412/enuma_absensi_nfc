# Sistem Absensi Berbasis NFC

Aplikasi web sistem absensi menggunakan kartu NFC dengan perangkat **ACS ACR122U NFC Reader**.

Pengguna melakukan absensi dengan menempelkan kartu NFC yang telah terdaftar pada sistem.

---

## 📌 Status Project

### Fitur yang Sudah Selesai

- [x] Setup Frontend React + Vite
- [x] Setup Tailwind CSS
- [x] Setup Supabase
- [x] Koneksi Frontend ke Supabase
- [x] Setup Supabase Authentication
- [x] Membuat tabel `profiles`
- [x] Membuat tabel `nfc_cards`
- [x] Membuat tabel `attendance`
- [x] Setup Backend Express
- [x] Konfigurasi environment variable
- [x] Membuat `.env.example`
- [x] Membuat `.gitignore`
- [x] Login Admin dan Operator
- [x] Role-based access (Admin / Operator)
- [x] Dashboard Admin
- [x] Dashboard Operator (Realtime)
- [x] Manajemen User (CRUD)
- [x] Manajemen Akun Login (CRUD)
- [x] Registrasi kartu NFC
- [x] Ganti kartu NFC
- [x] Nonaktifkan / Aktifkan kartu NFC
- [x] Hapus kartu NFC
- [x] Integrasi ACS ACR122U (via PC/SC + PowerShell listener)
- [x] Absensi masuk (Check-In)
- [x] Absensi pulang (Check-Out)
- [x] Validasi double tap (cooldown 15 menit)
- [x] Validasi kartu terdaftar & aktif
- [x] Status absensi otomatis (Tepat Waktu, Terlambat, Mendahului Pulang, Pulang Normal, Lembur)
- [x] Dashboard realtime (SSE)
- [x] Riwayat absensi
- [x] Pencarian dan filter absensi
- [x] Laporan absensi (Export Excel `.xlsx`)
- [x] Laporan absensi (Export / Cetak PDF via browser print)
- [x] Notifikasi absensi realtime (toast popup di Dashboard Operator)
- [x] Notifikasi registrasi NFC (pesan sukses/gagal di halaman Registrasi NFC)
- [x] Ganti password sendiri
- [x] Dark / Light mode

### Fitur yang Akan Dikembangkan

- [ ] Notifikasi absensi (WhatsApp / Email)
- [ ] Laporan absensi rekap bulanan

---

# 🛠️ Tech Stack

## Frontend

- React
- Vite
- Tailwind CSS
- Supabase JavaScript Client

## Backend

- Node.js
- Express.js
- CORS
- Dotenv
- Supabase JavaScript Client

## Database & Authentication

- Supabase
- PostgreSQL
- Supabase Authentication

## Hardware

- ACS ACR122U NFC Reader
- Kartu NFC

---

# 📁 Struktur Project

```text
project/
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, DatePicker
│   │   ├── context/          # AuthContext, ThemeContext
│   │   ├── lib/              # supabase.js, statusHelpers.js
│   │   └── pages/            # Semua halaman aplikasi
│   ├── .env.example
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── config/           # supabase.js
│   │   ├── controllers/      # attendanceController, nfcController, dll
│   │   ├── middleware/       # authMiddleware.js
│   │   ├── routes/           # api.js
│   │   └── services/         # nfcReader.js, acr122u_listener.ps1
│   ├── start_nfc_listener.bat
│   ├── .env.example
│   ├── package.json
│   └── ...
│
└── README.md
```

> Catatan: File `.env` tidak disimpan di repository GitHub karena berisi konfigurasi rahasia.

---

# 🚀 Persiapan

Pastikan sudah menginstall:

- Node.js
- npm
- Git

Cek instalasi:

```bash
node -v
npm -v
git --version
```

---

# 📥 1. Clone Repository

Clone repository:

```bash
git clone https://github.com/jojoE2412/enuma_absensi_nfc.git
```

Masuk ke folder project:

```bash
cd NAMA_PROJECT
```

---

# 💻 2. Setup Frontend

Masuk ke folder frontend:

```bash
cd frontend
```

Install dependency:

```bash
npm install
```

## Konfigurasi Environment Frontend

Cari file:

```text
.env.example
```

Buat salinan file tersebut dan ubah namanya menjadi:

```text
.env
```

Isi file `.env`:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Ganti:

```text
VITE_SUPABASE_URL=https://gqmcessefckwkqynzjqb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbWNlc3NlZmNrd2txeW56anFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzA5MzAsImV4cCI6MjEwMDcwNjkzMH0.fNbYorZPnfAgDTwZPLn_bpC6CiYktYyUGaKF1uyQ89U
```

dengan konfigurasi Supabase yang diberikan oleh Leader.

Setelah selesai, jalankan frontend:

```bash
npm run dev
```

Frontend dapat diakses melalui:

```text
http://localhost:5173
```

---

# ⚙️ 3. Setup Backend

Buka **terminal baru**.

Pastikan posisi terminal berada di folder utama project, kemudian:

```bash
cd backend
```

Install dependency:

```bash
npm install
```

## Konfigurasi Environment Backend

Cari file:

```text
.env.example
```

Buat salinan dan ubah namanya menjadi:

```text
.env
```

Isi:

```env
PORT=3001

SUPABASE_URL=https://gqmcessefckwkqynzjqb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbWNlc3NlZmNrd2txeW56anFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTEzMDkzMCwiZXhwIjoyMTAwNzA2OTMwfQ.dbs6unIvKjv_K7yFN6x5UdD7uXeODvYG98wVue5w5zU
```

Ganti nilai tersebut dengan konfigurasi yang diberikan oleh Leader.

Jalankan backend:

```bash
npm run dev
```

Backend berjalan pada:

```text
http://localhost:3001
```

---

# 🖥️ 4. Menjalankan Frontend dan Backend

Frontend dan Backend harus dijalankan menggunakan **dua terminal berbeda**.

### Terminal 1 — Frontend

```bash
cd frontend
npm run dev
```

### Terminal 2 — Backend

```bash
cd backend
npm run dev
```

Struktur koneksi:

```text
┌──────────────┐
│   Frontend   │
│ React + Vite │
└──────┬───────┘
       │
       │ API / Supabase
       ▼
┌──────────────┐
│   Backend    │
│   Express    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Supabase   │
│ Auth + DB    │
└──────────────┘
```

> Catatan: Tidak semua proses harus melewati Backend. Beberapa fitur dapat berkomunikasi langsung dengan Supabase melalui Supabase Client sesuai kebutuhan sistem.

---

# 🔌 5. Menjalankan Reader NFC (ACS ACR122U)

Pastikan perangkat ACS ACR122U sudah terhubung ke USB sebelum menjalankan reader.

## Cara Otomatis (dari Web)

1. Buka halaman **Registrasi NFC** di aplikasi web.
2. Listener NFC akan **otomatis aktif** saat halaman dibuka.
3. Untuk membuka jendela listener secara manual, klik tombol **"Jalankan Reader NFC"** di panel Reader Status.

## Cara Manual (langsung dari folder)

Buka file berikut secara langsung:

```text
backend/start_nfc_listener.bat
```

Jendela cmd akan terbuka dan listener akan mulai berjalan.

## Catatan

- Jangan tutup jendela listener selama sistem absensi berjalan.
- Jika reader tidak terdeteksi, cabut dan tancapkan kembali kabel USB ACS ACR122U.
- Pastikan service **Windows Smart Card (SCardSvr)** sedang berjalan.
- Jika `nfc-pcsc` belum terinstall, pesan berikut akan muncul di log backend dan bisa diabaikan selama hardware belum digunakan:

```text
[ACS ACR122U] Driver PC/SC (nfc-pcsc) belum terinstall / memerlukan build tools. Endpoint API /api/nfc/tap tetap aktif.
```

---

# 🗄️ 6. Database Supabase

Database utama menggunakan Supabase PostgreSQL.

Tabel yang sudah disiapkan:

## `profiles`

Menyimpan data akun login dan role.

```text
id
full_name
role          → admin | operator
status
created_at
```

## `employees`

Menyimpan data karyawan/user absensi.

```text
id
name
employee_number
status        → active | inactive
created_at
```

## `nfc_cards`

Menyimpan data kartu NFC yang terhubung dengan karyawan.

```text
id
employee_id
uid
status        → active | inactive
created_at
```

## `attendance`

Menyimpan data absensi karyawan.

```text
id
employee_id
date
check_in
check_in_status   → on_time | late
check_out
check_out_status  → normal | early_leave | overtime
created_at
```

---

# 🔐 7. Supabase Authentication

Sistem menggunakan Supabase Authentication untuk proses login.

Role pengguna disimpan pada tabel `profiles`.

Alur login:

```text
User Login
    ↓
Supabase Auth
    ↓
Ambil data profiles
    ↓
Cek role
    ↓
┌───────────────┐
│               │
▼               ▼
Admin        Operator
│               │
▼               ▼
Admin         Operator
Dashboard     Dashboard
```

---

# 👥 8. Role Pengguna

## Admin

- Login
- Dashboard Admin
- Manajemen User (CRUD)
- Manajemen Akun Login (CRUD)
- Registrasi kartu NFC
- Ganti kartu NFC
- Nonaktifkan / Aktifkan kartu NFC
- Hapus kartu NFC
- Melihat riwayat absensi
- Ganti password sendiri

## Operator

- Login
- Dashboard Operator (realtime)
- Melihat riwayat absensi
- Ganti password sendiri

Operator **tidak memiliki akses** untuk:

- Manajemen User
- Manajemen Akun Login
- Mengelola kartu NFC

---

# 🔌 9. Integrasi ACS ACR122U

Alur absensi dengan kartu NFC:

```text
Kartu NFC
    ↓
ACS ACR122U
    ↓
Membaca UID
    ↓
PowerShell Listener (acr122u_listener.ps1)
    ↓
POST /api/nfc/tap → Backend Express
    ↓
Validasi kartu (nfc_cards)
    ↓
Proses Absensi (attendance)
    ↓
Broadcast SSE ke Frontend
    ↓
Dashboard Realtime Update
```

Kartu yang tidak terdaftar atau berstatus `inactive` akan ditolak.

---

# ⏰ 10. Aturan Absensi

## Jam Masuk

```text
06.00 – 09.00  → Tepat Waktu
09.01 – 15.59  → Terlambat
Sebelum 06.00  → Ditolak
16.00 ke atas  → Ditolak (absen masuk sudah tutup)
```

## Jam Pulang

```text
06.00 – 15.59  → Mendahului Pulang
16.00 – 18.00  → Pulang Normal
18.01 ke atas  → Lembur
00.00 – 05.59  → Lembur (lanjutan sesi sebelumnya)
```

---

# 🛡️ 11. Validasi Absensi

- Satu user hanya dapat melakukan satu kali absen masuk per hari.
- Satu user hanya dapat melakukan satu kali absen pulang per hari.
- Kartu NFC yang tidak terdaftar ditolak.
- Kartu NFC yang nonaktif ditolak.
- Absen pulang hanya dapat dilakukan setelah absen masuk.
- Double tap dicegah dengan cooldown **15 menit** setelah check-in berhasil.
- Absensi harus menggunakan kartu yang terdaftar pada user.

---

# 🧪 12. Quality Control

### Login

- [ ] Admin dapat login.
- [ ] Operator dapat login.
- [ ] Password salah ditolak.
- [ ] Admin diarahkan ke Dashboard Admin.
- [ ] Operator diarahkan ke Dashboard Operator.
- [ ] Operator tidak dapat mengakses fitur Admin.

### NFC

- [ ] Kartu terdaftar dapat digunakan.
- [ ] Kartu tidak terdaftar ditolak.
- [ ] Kartu nonaktif ditolak.
- [ ] Double tap dicegah (cooldown 15 menit).

### Absensi

- [ ] Absen masuk berhasil.
- [ ] Absen pulang berhasil.
- [ ] Tidak dapat absen masuk dua kali.
- [ ] Tidak dapat absen pulang dua kali.
- [ ] Tidak dapat absen pulang sebelum absen masuk.
- [ ] Status Tepat Waktu berjalan.
- [ ] Status Terlambat berjalan.
- [ ] Status Mendahului Pulang berjalan.
- [ ] Status Pulang Normal berjalan.
- [ ] Status Lembur berjalan.

---

# 🐛 13. Laporan Bug

Jika menemukan bug, gunakan format:

```text
Bug ID:
Tanggal:
Fitur:
Deskripsi Bug:
Langkah Reproduksi:
Expected Result:
Actual Result:
Status:
Screenshot:
```

---

# ⚠️ Catatan Keamanan

Jangan commit atau upload file `.env` ke GitHub.

File berikut hanya digunakan sebagai template:

```text
.env.example
```

File asli:

```text
.env
```

harus tetap berada di komputer masing-masing.

### Frontend

`VITE_SUPABASE_ANON_KEY` digunakan untuk koneksi frontend.

### Backend

`SUPABASE_SERVICE_ROLE_KEY` merupakan key rahasia dan **tidak boleh dibagikan ke publik atau di-upload ke GitHub**.

Jangan memasukkan Service Role Key ke kode frontend.

Jika membutuhkan konfigurasi environment, hubungi Leader.

---

# 📌 Aturan Pengembangan Tim

Sebelum melakukan perubahan besar pada:

- Struktur database
- Nama tabel
- Nama kolom
- Relasi tabel
- RLS Policy
- Supabase Authentication
- Konfigurasi project

koordinasikan terlebih dahulu dengan Leader.

Jika menemukan error:

1. Screenshot error.
2. Catat langkah yang dilakukan sebelum error.
3. Kirim ke grup.
4. Jangan langsung mengubah database atau konfigurasi Supabase tanpa koordinasi.

---

# 🎯 Roadmap Project

```text
✅ Setup Awal
✅ Login & Authentication
✅ Role Admin / Operator
✅ Dashboard Admin & Operator
✅ Manajemen User
✅ Manajemen Akun Login
✅ Registrasi & Manajemen NFC
✅ Integrasi ACS ACR122U
✅ Absensi Masuk & Pulang
✅ Validasi Absensi & Double Tap
✅ Realtime Monitoring (SSE)
✅ Riwayat & Pencarian Absensi
✅ Export Excel & PDF
✅ Notifikasi Absensi Realtime (Toast)
✅ Ganti Password
✅ Dark / Light Mode
    ↓
[ ] Notifikasi WhatsApp / Email
    ↓
[ ] Laporan Rekap Bulanan
    ↓
[ ] Testing
    ↓
[ ] Finalisasi & Demo
```

---

# 👥 Pembagian Role Tim

### Leader
- Koordinasi project
- Perancangan sistem
- Integrasi antar bagian
- Review kode
- Pengelolaan database dan Supabase
- Membantu pengembangan Full-Stack

### Provider
- Menyiapkan ACS ACR122U
- Menguji perangkat NFC
- Membaca UID kartu
- Mendukung integrasi hardware

### Full-Stack Developer
- Pengembangan frontend
- Pengembangan backend
- Integrasi Supabase
- Implementasi fitur aplikasi
- Integrasi NFC dengan sistem

### Quality Control
- Membuat checklist testing
- Menguji fitur
- Mencari bug
- Membuat laporan bug
- Memastikan requirement terpenuhi
