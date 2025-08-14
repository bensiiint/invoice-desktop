@echo off
echo 🧹 Cleaning up empty folders...

if exist "src\components\PrintPreview" (
    rmdir "src\components\PrintPreview"
    echo ✅ Removed src\components\PrintPreview
)

if exist "src\styles" (
    rmdir "src\styles"
    echo ✅ Removed src\styles
)

if exist "src\utils" (
    rmdir "src\utils"
    echo ✅ Removed src\utils
)

echo 🎉 Cleanup complete!
pause
