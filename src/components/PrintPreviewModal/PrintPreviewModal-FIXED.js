// This is the FIXED handleDownloadPDF function
// Replace lines 772-795 in PrintPreviewModal.js with this:

  // Handle PDF download
  const handleDownloadPDF = useCallback(async () => {
    setIsProcessing(true);
    try {
      if (window.electronAPI) {
        const documentType = printMode === 'billing' ? 'BillingStatement' : 'Quotation';
        const documentNo = printMode === 'billing' 
          ? (quotationDetails.invoiceNo || quotationDetails.quotationNo || 'Draft')
          : (quotationDetails.quotationNo || 'Draft');
        
        // CLEAN FIX: Temporarily inject preview content into main document for Electron to capture
        const previewContent = previewRef.current;
        if (!previewContent) {
          throw new Error('Preview content not found');
        }

        // Create a temporary container in the main document
        const tempContainer = document.createElement('div');
        tempContainer.id = 'electron-pdf-capture';
        tempContainer.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 999999;
          background: white;
          overflow: visible;
        `;
        
        // Clone the preview content (this includes all your edits!)
        tempContainer.innerHTML = previewContent.innerHTML;
        
        // Hide the modal temporarily
        const modalContainer = document.querySelector('.print-preview-modal');
        if (modalContainer) {
          modalContainer.style.display = 'none';
        }
        
        // Inject into main document
        document.body.appendChild(tempContainer);
        
        // Small delay to ensure rendering
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Generate PDF (now Electron will capture the correct content!)
        await window.electronAPI.printToPDF({
          margins: {
            marginType: 'custom',
            top: 5,
            bottom: 5,
            left: 5,
            right: 5
          },
          pageSize: 'A4',
          landscape: false,
          printBackground: true,
          color: true,
          filename: `KMTI_${documentType}_${documentNo}.pdf`
        });
        
        // Clean up: Remove temp container and restore modal
        document.body.removeChild(tempContainer);
        if (modalContainer) {
          modalContainer.style.display = '';
        }
      } else {
        window.print();
        setTimeout(() => {
          alert('💡 To save as PDF:\n\n1. In the print dialog, click "Destination"\n2. Select "Save as PDF"\n3. Click "Save"');
        }, 500);
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Please try again.');
      
      // Clean up on error
      const tempContainer = document.getElementById('electron-pdf-capture');
      if (tempContainer && document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      const modalContainer = document.querySelector('.print-preview-modal');
      if (modalContainer) {
        modalContainer.style.display = '';
      }
    } finally {
      setIsProcessing(false);
    }
  }, [quotationDetails.quotationNo, quotationDetails.invoiceNo, printMode]);
