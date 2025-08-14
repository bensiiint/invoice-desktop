@echo off
echo 🔍 EBUSY ERROR DIAGNOSTIC TOOL
echo.

echo Checking for running processes...
echo.

echo 🔎 Looking for Electron processes:
tasklist /fi "imagename eq electron.exe" 2>nul | find "electron.exe" && (
    echo ❌ Electron is still running! Kill it with: taskkill /f /im electron.exe
) || (
    echo ✅ No Electron processes found
)

echo.
echo 🔎 Looking for Node processes:
tasklist /fi "imagename eq node.exe" 2>nul | find "node.exe" && (
    echo ❌ Node is still running! Kill it with: taskkill /f /im node.exe
) || (
    echo ✅ No Node processes found
)

echo.
echo 🔎 Looking for NPM processes:
tasklist /fi "imagename eq npm.exe" 2>nul | find "npm.exe" && (
    echo ❌ NPM is still running! Kill it with: taskkill /f /im npm.exe
) || (
    echo ✅ No NPM processes found
)

echo.
echo 📁 Checking node_modules status:
if exist node_modules (
    echo ❌ node_modules exists - try deleting it
    dir node_modules | find "File(s)" 
) else (
    echo ✅ node_modules already gone
)

echo.
echo 🔒 Checking if files are locked:
if exist "node_modules\electron\dist\electron.exe" (
    echo ❌ Electron files still exist - likely locked
) else (
    echo ✅ No locked Electron files found
)

echo.
echo 💡 RECOMMENDED SOLUTIONS:
echo 1. Run: nuclear-fix.bat
echo 2. Restart computer if still failing
echo 3. Temporarily disable antivirus
echo 4. Run Command Prompt as Administrator
echo.

pause
