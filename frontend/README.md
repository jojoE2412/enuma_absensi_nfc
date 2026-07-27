# Sistem Absensi Berbasis NFC

Project kelompok untuk membuat sistem absensi berbasis web menggunakan **ACS ACR122U NFC Reader** dan **Supabase**.

---

## Tech Stack

### Frontend
- React + Vite
- Tailwind CSS
- Supabase JS

### Backend
- Node.js
- Express.js
- Supabase

### Database
- Supabase PostgreSQL

---

# Progress Hari Pertama (Setup Awal)

## ✅ Frontend

- Membuat project React + Vite
- Install Tailwind CSS
- Konfigurasi Tailwind
- Install Supabase JS
- Membuat file konfigurasi `src/lib/supabase.js`
- Membuat file `.env`
- Menghubungkan React ke Supabase
- Testing koneksi database berhasil

---

## ✅ Backend

- Membuat project Express
- Install dependency:
  - express
  - cors
  - dotenv
  - @supabase/supabase-js
- Membuat struktur folder backend
- Membuat `server.js`
- Menjalankan server Express
- Menyiapkan konfigurasi koneksi Supabase
- Menambahkan `.gitignore`
- Menyiapkan `.env.example`

---

## ✅ Database (Supabase)

### Authentication

- Mengaktifkan Supabase Auth
- Membuat akun Admin
- Membuat akun Operator

### Tables

- profiles
- nfc_cards
- attendance

### Default Value

- role → operator
- status → active
- created_at → now()

### Relasi

- auth.users → profiles
- profiles → nfc_cards
- profiles → attendance

---

## Progress Selanjutnya

- Login Supabase Auth
- Protected Route
- Dashboard Admin
- Dashboard Operator
- CRUD User
- Registrasi NFC
- Integrasi ACS ACR122U
- Sistem Absensi
- Dashboard Realtime
- Riwayat Absensi
- Testing

---

## Struktur Project

```
project
│
├── frontend
│
└── backend
```

---

## Cara Menjalankan

### Frontend

```
npm install
npm run dev
```

### Backend

```
npm install
npm run dev
```

---

## Catatan

File `.env` tidak disertakan di repository.

## Konfigurasi Environment

Sebelum menjalankan project:

### Frontend -(frontend/.env.example)

Rename:

```text
.env.example
```

menjadi

```text
.env
```

Kemudian ubah isinya jadi:

```
VITE_SUPABASE_URL=https://gqmcessefckwkqynzjqb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbWNlc3NlZmNrd2txeW56anFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzA5MzAsImV4cCI6MjEwMDcwNjkzMH0.fNbYorZPnfAgDTwZPLn_bpC6CiYktYyUGaKF1uyQ89U
```

---

### Backend - (backend/.env.example)

Rename:

```text
.env.example
```

menjadi

```text
.env
```

Kemudian ubah isinya:

```
PORT=3001

SUPABASE_URL=https://gqmcessefckwkqynzjqb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxbWNlc3NlZmNrd2txeW56anFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTEzMDkzMCwiZXhwIjoyMTAwNzA2OTMwfQ.dbs6unIvKjv_K7yFN6x5UdD7uXeODvYG98wVue5w5zU
```

dan isi sesuai konfigurasi Supabase.