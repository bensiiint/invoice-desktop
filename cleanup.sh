#!/bin/bash
# Cleanup script to remove empty folders

echo "🧹 Cleaning up empty folders..."

# Remove empty folders
if [ -d "src/components/PrintPreview" ]; then
    rmdir "src/components/PrintPreview"
    echo "✅ Removed src/components/PrintPreview"
fi

if [ -d "src/styles" ]; then
    rmdir "src/styles"
    echo "✅ Removed src/styles"
fi

if [ -d "src/utils" ]; then
    rmdir "src/utils"  
    echo "✅ Removed src/utils"
fi

echo "🎉 Cleanup complete!"
