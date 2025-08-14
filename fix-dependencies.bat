@echo off
echo 🔧 KMTI Invoice App - Dependency Fix Script
echo.
echo This will reinstall all dependencies and fix the react-scripts issue.
echo.
pause

echo 📦 Step 1: Clearing npm cache...
npm cache clean --force

echo 📦 Step 2: Removing old node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo ✅ Removed node_modules
) else (
    echo ⚠️ node_modules already gone
)

echo 📦 Step 3: Removing package-lock.json...
if exist package-lock.json (
    del package-lock.json
    echo ✅ Removed package-lock.json
) else (
    echo ⚠️ package-lock.json already gone
)

echo 📦 Step 4: Installing fresh dependencies...
npm install

echo.
echo 🎯 Testing installation...
echo.
npm ls react-scripts

echo.
echo 🚀 Ready to test! Run: npm run dev
echo.
pause
