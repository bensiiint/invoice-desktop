@echo off
echo 🎯 KMTI Invoice App - Selective Cleanup Menu
echo.

:menu
echo Choose what to clean up:
echo.
echo 1) 🗑️  Essential cleanup only (build + node_modules)
echo 2) 🧹 Full cleanup (includes helper files)  
echo 3) 📋 Show me what will be deleted
echo 4) ❌ Cancel
echo.
set /p choice="Select option (1-4): "

if "%choice%"=="1" goto :essential
if "%choice%"=="2" goto :full  
if "%choice%"=="3" goto :preview
if "%choice%"=="4" goto :cancel
echo Invalid choice. Try again.
echo.
goto :menu

:essential
echo.
echo 🗑️  ESSENTIAL CLEANUP - Removing build artifacts and dependencies...
echo.
if exist build rmdir /s /q build && echo ✅ Deleted build/
if exist node_modules rmdir /s /q node_modules && echo ✅ Deleted node_modules/
if exist package-lock.json del package-lock.json && echo ✅ Deleted package-lock.json
if exist KMTI-App.bat del KMTI-App.bat && echo ✅ Deleted KMTI-App.bat
echo.
echo ✅ Essential cleanup complete!
goto :next_steps

:full
echo.
echo 🧹 FULL CLEANUP - Removing everything unnecessary...
echo.
rem Essential files
if exist build rmdir /s /q build && echo ✅ Deleted build/
if exist node_modules rmdir /s /q node_modules && echo ✅ Deleted node_modules/  
if exist package-lock.json del package-lock.json && echo ✅ Deleted package-lock.json
if exist KMTI-App.bat del KMTI-App.bat && echo ✅ Deleted KMTI-App.bat

rem Helper files
if exist cleanup.bat del cleanup.bat && echo ✅ Deleted cleanup.bat
if exist cleanup.sh del cleanup.sh && echo ✅ Deleted cleanup.sh
if exist diagnose.bat del diagnose.bat && echo ✅ Deleted diagnose.bat
if exist fix-dependencies.bat del fix-dependencies.bat && echo ✅ Deleted fix-dependencies.bat
if exist DEPENDENCY_FIX_GUIDE.md del DEPENDENCY_FIX_GUIDE.md && echo ✅ Deleted DEPENDENCY_FIX_GUIDE.md
if exist FILE_STRUCTURE_REPORT.md del FILE_STRUCTURE_REPORT.md && echo ✅ Deleted FILE_STRUCTURE_REPORT.md
if exist OPTIMIZATION_NOTES.md del OPTIMIZATION_NOTES.md && echo ✅ Deleted OPTIMIZATION_NOTES.md
if exist package-backup.json del package-backup.json && echo ✅ Deleted package-backup.json

echo.
echo ✅ Full cleanup complete!
goto :next_steps

:preview
echo.
echo 📋 PREVIEW - Files that would be deleted:
echo.
echo 🗑️  ESSENTIAL FILES (always deleted):
if exist build echo   - build/ (build artifacts)
if exist node_modules echo   - node_modules/ (dependencies - will reinstall)
if exist package-lock.json echo   - package-lock.json (dependency lock file)
if exist KMTI-App.bat echo   - KMTI-App.bat (old script)
echo.
echo 🧹 HELPER FILES (deleted in full cleanup):
if exist cleanup.bat echo   - cleanup.bat
if exist cleanup.sh echo   - cleanup.sh  
if exist diagnose.bat echo   - diagnose.bat
if exist fix-dependencies.bat echo   - fix-dependencies.bat
if exist DEPENDENCY_FIX_GUIDE.md echo   - DEPENDENCY_FIX_GUIDE.md
if exist FILE_STRUCTURE_REPORT.md echo   - FILE_STRUCTURE_REPORT.md
if exist OPTIMIZATION_NOTES.md echo   - OPTIMIZATION_NOTES.md
if exist package-backup.json echo   - package-backup.json
echo.
echo 💾 WILL KEEP (important files):
echo   - src/ (your optimized source code)
echo   - public/ (Electron and assets)
echo   - package.json (project config)
echo   - README.md (project docs)
echo.
goto :menu

:next_steps
echo.
echo 🚀 Next Steps:
echo   1. npm install    (reinstall dependencies)
echo   2. npm run dev    (run optimized app)
echo.
goto :end

:cancel
echo.
echo ❌ Cleanup cancelled. No files were deleted.
echo.

:end
pause
