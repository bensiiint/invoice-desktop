@echo off
echo 🎨 PRINT PREVIEW LAYOUT UPDATE
echo.
echo ✅ Updated print preview to match exact invoice layout:
echo   - Company name on single line
echo   - Reduced margins and spacing 
echo   - Tighter, more compact layout
echo   - Better positioning of logo and details
echo.
echo 🔧 Installing dependencies...
npm install

echo.
echo 🚀 Testing the updated layout...
echo.
echo 📋 What to test:
echo   1. Click "Print" button
echo   2. Check company name is on one line
echo   3. Verify compact layout with less white space
echo   4. Try different paper sizes (A4, Letter, etc.)
echo   5. Test zoom levels
echo.
echo Starting app...
npm run dev
