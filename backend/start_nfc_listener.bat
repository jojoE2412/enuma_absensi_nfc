@echo off
title ACS ACR122U NFC Listener Service
color 0B
setlocal enabledelayedexpansion

set "API_URL=https://enuma-absensi-nfc-backend.onrender.com/api/nfc/tap"

echo =========================================
echo  ACS ACR122U - NFC LISTENER SERVICE
echo =========================================
echo.
echo Listener NFC akan otomatis menggunakan backend Render.
echo.
echo Backend API yang akan dipakai:
echo    %API_URL%
echo.
echo [INFO] Memulai listener PC/SC untuk ACS ACR122U...
echo.
echo CATATAN:
echo   - Jangan tutup window ini selama sistem absensi berjalan.
echo   - Pastikan kabel USB ACS ACR122U sudah terhubung ke PC.
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0src\services\acr122u_listener.ps1" "%API_URL%"
echo.
echo [INFO] Listener berhenti. Jika reader belum terdeteksi, cek koneksi USB dan status driver PC/SC Windows.
echo [INFO] Tekan Enter untuk menutup jendela ini.
pause > nul
goto :eof

:backendTidakAktif
echo [ERROR] Backend lokal belum aktif di http://localhost:3001.
echo [INFO] Jalankan "npm run dev" dari folder backend, lalu buka listener ini kembali.
echo [INFO] Jika ingin terhubung ke backend remote, masukkan URL render ketika diminta.
pause > nul
