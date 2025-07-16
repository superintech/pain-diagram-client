import DrawingCanvas from '../../pain-diagram/DrawingCanvas';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const Step2Diagram = forwardRef(({ onSubmitWithPopup , canvasGender, setCanvasGender}, ref) => {
  const fileInputRef = useRef(null);
  const [canvasRef, setCanvasRef] = useState(null);
  const [painDiagramPdf, setPainDiagramPdf] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);   
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [waitingForSubmission, setWaitingForSubmission] = useState(false);

  useEffect(() => {
  const handlePainDiagramIncomplete = (event) => {
    if (event.data && event.data.type === 'PAIN_DIAGRAM_INCOMPLETE') {
      setWaitingForSubmission(false);
      setIsGeneratingPdf(false);
      alert(`Your pain diagram is incomplete (missing ${event.data.missingCount} views). Please redraw the pain diagram.`);
    }
  };

  window.addEventListener('message', handlePainDiagramIncomplete);
  return () => {
    window.removeEventListener('message', handlePainDiagramIncomplete);
  };
}, []);

  // Expose showPopup method to parent component
  useImperativeHandle(ref, () => ({
    showPopup: () => setShowPopup(true),
    hidePopup: () => setShowPopup(false)
  }));

  useEffect(() => {
    const handlePainDiagramMessage = (event) => {
      if (event.data && event.data.type === 'PAIN_DIAGRAM_PDF') {
        const base64Response = event.data.fileData;
        const base64Data = base64Response.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteArrays = [];

        for (let i = 0; i < byteCharacters.length; i += 512) {
          const slice = byteCharacters.slice(i, i + 512);
          const byteNumbers = new Array(slice.length);
          for (let j = 0; j < slice.length; j++) {
            byteNumbers[j] = slice.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: 'application/pdf' });
        const file = new File([blob], event.data.fileName, { type: 'application/pdf' });
        setPainDiagramPdf(file);

        if (fileInputRef.current) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.current.files = dataTransfer.files;
        }
      }
    };

    const handlePainDiagramEvent = () => {
      try {
        const pdfData = localStorage.getItem('pain_diagram_pdf_data');
        const fileName = localStorage.getItem('pain_diagram_pdf_name');

        if (pdfData) {
          const base64Data = pdfData.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteArrays = [];

          for (let i = 0; i < byteCharacters.length; i += 512) {
            const slice = byteCharacters.slice(i, i + 512);
            const byteNumbers = new Array(slice.length);
            for (let j = 0; j < slice.length; j++) {
              byteNumbers[j] = slice.charCodeAt(j);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }

          const blob = new Blob(byteArrays, { type: 'application/pdf' });
          const file = new File([blob], fileName || 'pain-diagram.pdf', { type: 'application/pdf' });
          setPainDiagramPdf(file);

          if (fileInputRef.current) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInputRef.current.files = dataTransfer.files;
          }
        }
      } catch (error) {
        console.error('Error processing pain diagram PDF data:', error);
      }
    };

    window.addEventListener('message', handlePainDiagramMessage);
    window.addEventListener('painDiagramPdfReady', handlePainDiagramEvent);

    return () => {
      window.removeEventListener('message', handlePainDiagramMessage);
      window.removeEventListener('painDiagramPdfReady', handlePainDiagramEvent);
    };
  }, []);

  useEffect(() => {
    if (painDiagramPdf instanceof File && waitingForSubmission) {
      setWaitingForSubmission(false);
      setIsGeneratingPdf(false);
      
      if (onSubmitWithPopup) {
        onSubmitWithPopup(painDiagramPdf);
      }
    }
  }, [painDiagramPdf, waitingForSubmission, onSubmitWithPopup]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleConfirm = async () => {
    setShowPopup(false);

    if (canvasRef?.checkAndShowAlert && !canvasRef.checkAndShowAlert()) return;

    if (painDiagramPdf instanceof File) {
      if (onSubmitWithPopup) {
        onSubmitWithPopup(painDiagramPdf);
      }
      return;
    }

    // Set states for PDF generation
    setIsGeneratingPdf(true);
    setWaitingForSubmission(true);

    // Start PDF generation
    if (canvasRef?.download) {
      canvasRef.download();
    }
  };

  return (
    <div className="pain-diagram-container">
      <DrawingCanvas 
        onCanvasReady={setCanvasRef}
        gender={canvasGender}          
        setGender={setCanvasGender}  
      />

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="application/pdf"
        id="pain_diagram_attachment"
      />

      {painDiagramPdf && (
        <div className="attachement-container">
          <strong>✓ Your Pain Diagram has been successfully attached:</strong>
          <p>
            Thank you for taking the time to complete your pain diagram. This visual
            information will help our medical team better understand your symptoms
            and provide more effective treatment.
          </p>
        </div>
      )}

      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p className="modal-text">
              Are you sure you want to attach the Pain Diagram?
              Have you marked correctly where you are feeling the pain?
            </p>
            <div className="modal-buttons">
              <button 
                className="btn-yes all-btn" 
                onClick={handleConfirm}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? 'Processing...' : 'Yes'}
              </button>
              <button 
                className="btn-no all-btn" 
                onClick={() => setShowPopup(false)}
                disabled={isGeneratingPdf}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {isGeneratingPdf && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p className="modal-text">
              Generating your pain diagram PDF... Please wait.
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Your form will be submitted automatically once the diagram is ready.
            </p>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <div className="spinner" style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 2s linear infinite',
                margin: '0 auto'
              }}></div>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          left: `${window.innerWidth - 80}px`,
          top: `${window.innerHeight / 5 - 30}px`,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          color: 'white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'grab',
          zIndex: 1000
        }}
        className="scroll-container"
      >
        {showScrollToTop ? (
          <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="Scroll Top" className="bounce-up">
            <ChevronUp size={30} />
          </div>
        ) : (
          <div onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })} title="Scroll Bottom" className="bounce-down" style={{ paddingTop: '8px' }}>
            <ChevronDown size={30} />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

export default Step2Diagram;