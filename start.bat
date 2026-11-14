@echo off
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python tidak ditemukan. Silakan install Python 3 terlebih dahulu.
  pause
  exit /b 1
)
python tools\serve.py
pause
