@echo off
echo 🔍 KMTI Invoice App - Diagnosis Script
echo.

echo Checking current directory...
cd
echo.

echo Checking if package.json exists...
if exist package.json (
    echo ✅ package.json found
) else (
    echo ❌ package.json NOT found - you might be in wrong directory
    goto :error
)

echo.
echo Checking if node_modules exists...
if exist node_modules (
    echo ✅ node_modules folder exists
) else (
    echo ❌ node_modules folder missing - need to run: npm install
    goto :fix
)

echo.
echo Checking if react-scripts is installed...
if exist "node_modules\.bin\react-scripts.cmd" (
    echo ✅ react-scripts binary found
) else (
    echo ❌ react-scripts binary missing
    goto :fix
)

echo.
echo Checking package.json content...
type package.json | findstr "react-scripts"
if errorlevel 1 (
    echo ❌ react-scripts not in package.json
) else (
    echo ✅ react-scripts listed in package.json
)

echo.
echo 🎯 Everything looks good! Try: npm run dev
goto :end

:fix
echo.
echo 🔧 SOLUTION: Run the fix-dependencies.bat script or:
echo   npm cache clean --force
echo   rmdir /s node_modules
echo   del package-lock.json  
echo   npm install
goto :end

:error
echo.
echo 🔧 SOLUTION: Navigate to your project directory first:
echo   cd C:\Users\hamster\Documents\invoice-desktop
echo   Then run this script again

:end
echo.
pause
