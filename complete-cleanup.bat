@echo off
echo 🧹 KMTI Invoice App - Complete Cleanup Script
echo.
echo This will delete all build artifacts and dependencies for a fresh start.
echo ⚠️  WARNING: This will delete node_modules and build folders!
echo.
set /p confirm="Continue? (y/N): "
if /i not "%confirm%"=="y" goto :cancel

echo.
echo 🗑️  Step 1: Removing build artifacts...
if exist build (
    rmdir /s /q build
    echo ✅ Deleted build/
) else (
    echo ⚠️  build/ not found
)

if exist dist (
    rmdir /s /q dist  
    echo ✅ Deleted dist/
) else (
    echo ⚠️  dist/ not found
)

echo.
echo 🗑️  Step 2: Removing dependencies...
if exist node_modules (
    rmdir /s /q node_modules
    echo ✅ Deleted node_modules/
) else (
    echo ⚠️  node_modules/ not found
)

if exist package-lock.json (
    del package-lock.json
    echo ✅ Deleted package-lock.json
) else (
    echo ⚠️  package-lock.json not found
)

echo.
echo 🗑️  Step 3: Removing old files...
if exist KMTI-App.bat (
    del KMTI-App.bat
    echo ✅ Deleted KMTI-App.bat
) else (
    echo ⚠️  KMTI-App.bat not found
)

echo.
echo 🎉 Cleanup complete! 
echo.
echo 📋 Next steps:
echo   1. npm install
echo   2. npm run dev
echo.
goto :end

:cancel
echo.
echo ❌ Cleanup cancelled.
echo.

:end
pause
