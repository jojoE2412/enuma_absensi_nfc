@echo off
title ACS ACR122U NFC Listener Service
color 0B
setlocal enabledelayedexpansion

set "API_URL=https://enuma-absensi-nfc-backend.onrender.com/api/nfc/tap"
set "PS1_URL=https://enuma-absensi-nfc-backend.onrender.com/api/nfc/listener-script"
set "PS1_FILE=%~dp0acr122u_listener.ps1"

echo =========================================
echo  ACS ACR122U - NFC LISTENER SERVICE
echo =========================================
echo.
echo Listener NFC akan otomatis menggunakan backend Render.
echo.
echo Backend API yang akan dipakai:
echo    %API_URL%
echo.
echo Mendownload file PowerShell listener dari backend...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri '%PS1_URL%' -OutFile '%PS1_FILE%'; & '%PS1_FILE%' '%API_URL%'"

echo.
echo [INFO] Listener berhenti. Jika reader belum terdeteksi, cek koneksi USB dan status driver PC/SC Windows.
echo [INFO] Tekan Enter untuk menutup jendela ini.
pause > nul
goto :eof

:backendTidakAktif

:backendTidakAktif
echo [ERROR] Backend lokal belum aktif di http://localhost:3001.
echo [INFO] Jalankan "npm run dev" dari folder backend, lalu buka listener ini kembali.
echo [INFO] Jika ingin terhubung ke backend remote, masukkan URL render ketika diminta.
pause > nul
