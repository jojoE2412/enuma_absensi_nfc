@echo off
title ACS ACR122U NFC Listener Service
color 0B
echo =========================================
echo  ACS ACR122U - NFC LISTENER SERVICE
echo  Sistem Absensi Berbasis NFC
echo =========================================
echo.
echo [INFO] Memastikan Backend Express sudah berjalan di port 3001...
PowerShell -NoProfile -Command "if (-not (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue)) { exit 1 }"
if errorlevel 1 goto :backendTidakAktif
echo [INFO] Backend terdeteksi di port 3001.
echo [INFO] Memulai listener PC/SC untuk ACS ACR122U...
echo.
echo CATATAN:
echo   - Jangan tutup window ini selama sistem absensi berjalan.
echo   - Pastikan kabel USB ACS ACR122U sudah terhubung ke PC.
echo   - Pastikan "npm run dev" sudah berjalan di folder backend.
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0src\services\acr122u_listener.ps1"
echo.
echo [INFO] Listener berhenti. Jika reader belum terdeteksi, cek koneksi USB dan status driver PC/SC Windows.
echo [INFO] Tekan Enter untuk menutup jendela ini.
pause > nul
goto :eof

:backendTidakAktif
echo [ERROR] Backend belum aktif di http://localhost:3001.
echo [INFO] Jalankan "npm run dev" dari folder backend, lalu buka listener ini kembali.
echo [INFO] Tekan Enter untuk menutup jendela ini.
pause > nul
