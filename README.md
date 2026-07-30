# Sistem Absensi Berbasis NFC

Aplikasi web sistem absensi menggunakan kartu NFC dengan perangkat **ACS ACR122U NFC Reader**.

Pengguna melakukan absensi dengan menempelkan kartu NFC yang telah terdaftar pada sistem.

---

## 📌 Status Project

Project ini masih dalam tahap pengembangan.

### Setup Awal yang Sudah Selesai

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
- [x] Dokumentasi setup awal

### Fitur yang Akan Dikembangkan

- [ ] Login Admin dan Operator
- [ ] Role-based access
- [ ] Dashboard Admin
- [ ] Dashboard Operator
- [ ] Manajemen User
- [ ] Registrasi kartu NFC
- [ ] Integrasi ACS ACR122U
- [ ] Absensi masuk
- [ ] Absensi pulang
- [ ] Validasi double tap
- [ ] Validasi kartu terdaftar
- [ ] Dashboard realtime
- [ ] Riwayat absensi
- [ ] Pencarian dan filter absensi
- [ ] Laporan absensi

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
│   ├── .env.example
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
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

Frontend biasanya dapat diakses melalui:

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

# 🗄️ 5. Database Supabase

Database utama menggunakan Supabase PostgreSQL.

Tabel yang sudah disiapkan:

## `profiles`

Menyimpan data pengguna dan role.

Contoh data:

```text
id
full_name
role
status
created_at
```

Role yang digunakan:

```text
admin
operator
```

---

## `nfc_cards`

Menyimpan data kartu NFC yang terhubung dengan pengguna.

Contoh data:

```text
id
user_id
uid
status
created_at
```

Status kartu:

```text
active
inactive
```

---

## `attendance`

Menyimpan data absensi pengguna.

Contoh data:

```text
id
user_id
date
check_in
check_out
status
created_at
```

Status absensi akan dikembangkan sesuai aturan sistem.

---

# 🔐 6. Supabase Authentication

Sistem menggunakan Supabase Authentication untuk proses login.

Role pengguna disimpan pada tabel:

```text
profiles
```

Alur login:

```text
User Login
    ↓
Supabase Auth
    ↓
User berhasil login
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

# 👥 7. Role Pengguna

## Admin

Admin memiliki akses untuk:

- Login
- Mengelola akun pengguna
- Membuat akun pengguna
- Mengubah akun pengguna
- Menghapus akun pengguna
- Registrasi kartu NFC
- Mengganti kartu NFC
- Menonaktifkan kartu NFC
- Melihat data absensi
- Melihat dashboard
- Mengubah password sendiri

## Operator

Operator memiliki akses untuk:

- Login
- Melihat dashboard
- Memantau absensi realtime
- Melihat riwayat absensi
- Mencari data absensi
- Mengubah password sendiri

Operator **tidak memiliki akses** untuk:

- Membuat akun pengguna
- Menghapus akun pengguna
- Mengelola kartu NFC

---

# 🔌 8. Integrasi ACS ACR122U

Integrasi perangkat NFC akan dilakukan pada tahap pengembangan berikutnya.

Alur yang direncanakan:

```text
Kartu NFC
    ↓
ACS ACR122U
    ↓
Membaca UID
    ↓
Sistem menerima UID
    ↓
Cari UID di nfc_cards
    ↓
Validasi kartu
    ↓
Cari User
    ↓
Proses Absensi
    ↓
Simpan ke attendance
```

Kartu yang:

- Tidak terdaftar
- Berstatus `inactive`

tidak dapat melakukan absensi.

---

# ⏰ 9. Aturan Absensi

## Jam Masuk

```text
06.00 – 09.00
→ Tepat Waktu

Di atas 09.00
→ Terlambat
```

## Jam Pulang

```text
Sebelum 16.00
→ Mendahului Pulang

16.00 – 18.00
→ Pulang Normal

Di atas 18.00
→ Lembur
```

---

# 🛡️ 10. Validasi Absensi

Sistem harus memastikan:

- Satu user hanya dapat melakukan satu kali absen masuk per hari.
- Satu user hanya dapat melakukan satu kali absen pulang per hari.
- Kartu NFC yang tidak terdaftar ditolak.
- Kartu NFC yang nonaktif ditolak.
- Absen pulang hanya dapat dilakukan setelah absen masuk.
- Double tap harus dicegah.
- Absensi harus menggunakan kartu yang terdaftar pada user.

---

# 🧪 11. Quality Control

Setiap fitur yang selesai harus melalui proses testing.

Contoh:

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
- [ ] Double tap dicegah.

### Absensi

- [ ] Absen masuk berhasil.
- [ ] Absen pulang berhasil.
- [ ] Tidak dapat absen masuk dua kali.
- [ ] Tidak dapat absen pulang dua kali.
- [ ] Tidak dapat absen pulang sebelum absen masuk.
- [ ] Status Tepat Waktu berjalan.
- [ ] Status Terlambat berjalan.
- [ ] Status Mendahului Pulang berjalan.
- [ ] Status Lembur berjalan.

---

# 🐛 12. Laporan Bug

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
Setup Awal
    ↓
Login & Authentication
    ↓
Role Admin / Operator
    ↓
Dashboard
    ↓
Manajemen User
    ↓
Registrasi NFC
    ↓
Integrasi ACS ACR122U
    ↓
Absensi Masuk
    ↓
Absensi Pulang
    ↓
Validasi Absensi
    ↓
Realtime Monitoring
    ↓
Riwayat & Pencarian
    ↓
Testing
    ↓
Finalisasi & Demo
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