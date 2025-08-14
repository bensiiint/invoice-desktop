@echo off
echo 🔥 NUCLEAR CLEANUP - Kill all processes and force delete
echo.
echo This will:
echo - Kill all Electron/Node/NPM processes
echo - Force delete node_modules
echo - Wait and retry installation
echo.
pause

echo 🔪 Step 1: Killing processes...
taskkill /f /im electron.exe 2>nul || echo electron.exe not running
taskkill /f /im node.exe 2>nul || echo node.exe not running  
taskkill /f /im npm.exe 2>nul || echo npm.exe not running
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq npm*" 2>nul || echo No npm cmd windows

echo.
echo ⏳ Step 2: Waiting 10 seconds for file handles to release...
timeout /t 10 /nobreak

echo.
echo 🗑️ Step 3: Force deleting node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo ✅ node_modules deleted
) else (
    echo ⚠️ node_modules already gone
)

echo.
echo ⏳ Step 4: Waiting 5 more seconds...
timeout /t 5 /nobreak

echo.
echo 📦 Step 5: Installing fresh dependencies...
npm install

echo.
if errorlevel 1 (
    echo ❌ Installation failed. Try:
    echo   1. Restart computer
    echo   2. Disable antivirus temporarily
    echo   3. Run as Administrator
) else (
    echo ✅ Installation successful!
    echo.
    echo 🚀 Ready to run: npm run dev
)

echo.
pause
