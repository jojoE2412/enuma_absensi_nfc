@echo off
title ACS ACR122U NFC Listener Service
color 0B
setlocal enabledelayedexpansion

set "DEFAULT_API_URL=https://enuma-absensi-nfc-backend.onrender.com/api/nfc/tap"
set "API_URL="

echo =========================================
echo  ACS ACR122U - NFC LISTENER SERVICE
echo =========================================
echo.
echo Listener NFC akan menggunakan remote Render backend secara default.
echo Jika ingin menggunakan backend lokal, masukkan URL lokal berikut:
echo   http://localhost:3001/api/nfc/tap
echo.
set /p "API_URL=Masukkan URL backend API (default: %DEFAULT_API_URL%): "
if "%API_URL%"=="" set "API_URL=%DEFAULT_API_URL%"

echo.
echo Backend API yang akan dipakai:
echo    %API_URL%
echo.

echo %API_URL% | findstr /i /c:"localhost:3001/api/nfc/tap" >nul
if %ERRORLEVEL%==0 (
  echo [INFO] Memastikan Backend Express sudah berjalan di port 3001...
  powershell -NoProfile -Command "if (-not (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue)) { exit 1 }"
  if errorlevel 1 goto :backendTidakAktif
  echo [INFO] Backend terdeteksi di port 3001.
) else (
  echo [INFO] Menggunakan remote backend.
)
echo [INFO] Memulai listener PC/SC untuk ACS ACR122U...
echo.
echo CATATAN:
echo   - Jangan tutup window ini selama sistem absensi berjalan.
echo   - Pastikan kabel USB ACS ACR122U terhubung ke PC.
echo   - Pastikan file "acr122u_listener.ps1" tersedia di folder src\services relatif ke lokasi file ini.
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
go to :eof