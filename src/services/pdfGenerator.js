import jsPDF from 'jspdf';
import logo from '../assets/logo.png'

export  const generatePDF = (formData) => { 
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [600, 780]
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 50;
        let cursorY = 75;

        const logoImg = await loadImageToBase64(logo);
        const bgImg = await loadImageToBase64('https://storage.googleapis.com/msgsndr/11NLpXQF1SZFaLK9l2gW/media/682c139b438303e8bc1af578.png');

        const drawWatermark = () => {
          const originalTextColor = doc.getTextColor();
          const originalFontSize = doc.getFontSize();
          const originalFont = doc.getFont();
          doc.setTextColor(230, 230, 230);
          doc.setFontSize(120);
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(originalTextColor[0], originalTextColor[1], originalTextColor[2]);
          doc.setFontSize(originalFontSize);
          doc.setFont(originalFont.fontName, originalFont.fontStyle);
        };

        const drawHeader = () => {
          if (bgImg) doc.addImage(bgImg, 'PNG', 0, 0, 100, 100);
          if (logoImg) doc.addImage(logoImg, 'PNG', margin, 10, 100, 30);

          const now = new Date();
          const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
          const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          const fullText = `GENERATED ON: ${dateStr}, ${timeStr}`;

          const textX = pageWidth - margin;
          const textY = 25;

          doc.setFontSize(10);
          doc.setFont("Helvetica", "normal");
          doc.setTextColor(0, 0, 0); 
          doc.text(fullText, textX, textY, { align: 'right' });
          const lineWidth = 120;
          const lineY = textY + 7;
          const lineXStart = textX - lineWidth;
          const firstPartWidth = lineWidth * 0.3;
          doc.setDrawColor(54, 56, 69);
          doc.setLineWidth(2);
          doc.line(lineXStart, lineY, lineXStart + firstPartWidth, lineY);
          doc.setDrawColor(68, 145, 202);
          doc.line(lineXStart + firstPartWidth, lineY, lineXStart + lineWidth, lineY);
          doc.setFontSize(20);
          doc.setFont("Helvetica", "bold");
          doc.setTextColor(0, 0, 0);
          doc.text("PATIENT ASSESSMENT ", pageWidth / 2 + 30, 50, { align: 'left' });

          doc.setTextColor(86, 164, 0);
          doc.text("FORM", pageWidth / 2 + 205, 50, { align: 'left' });

          doc.setTextColor(0, 0, 0); 
          doc.setFontSize(12); 
          doc.setFont("Helvetica", "normal");
        };

        const drawSectionHeader = (text) => {
          if (cursorY > pageHeight - 100) {
            doc.addPage();
            drawWatermark();
            drawHeader();
            cursorY = 100; 
          }

          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(0);
          doc.setLineWidth(0.2);
          doc.rect(margin, cursorY, pageWidth - margin * 2, 30, "FD");

          doc.setFillColor(0, 120, 200);
          doc.rect(margin, cursorY, 5, 30, "F");

          doc.setTextColor(0, 0, 0);
          doc.setFontSize(15);
          doc.setFont("Helvetica", "bold");
          doc.text(text.toUpperCase(), margin + 20, cursorY + 20);

          cursorY += 50;
          doc.setTextColor(0, 0, 0);
        };

        const addLabelValue = (label, value) => {

          const lineHeight = 20;
          const indent = 150;
          const rightPadding = 30;
          const valueX = margin + indent;
          const valueMaxWidth = pageWidth - valueX - rightPadding;

          doc.setFont("Helvetica", "bold");
          doc.setFontSize(12);
          const labelWidth = doc.getTextWidth(`${label} :`);

          doc.setFont("Helvetica", "normal");
          const valueText = value || "N/A";
          const wrappedLines = doc.splitTextToSize(valueText, valueMaxWidth);

          const requiredSpace = wrappedLines.length * lineHeight + 5;

          if (cursorY + requiredSpace > pageHeight - 30) {
            doc.addPage();
            drawWatermark();
            drawHeader();
            cursorY = 100; 
            valueMaxWidth = pageWidth - valueX - 100;
          }

          doc.setFont("Helvetica", "bold");
          doc.text(`${label} :`, margin, cursorY);

          doc.setFont("Helvetica", "normal");
          let currentY = cursorY;

          for (let i = 0; i < wrappedLines.length; i++) {
            if (currentY + lineHeight > pageHeight - 30) {
              doc.addPage();
              drawWatermark();
              drawHeader();
              currentY = 100;
              valueMaxWidth = pageWidth - valueX - 100;
            }
            doc.text(wrappedLines[i], valueX, currentY);
            currentY += lineHeight;
          }

          cursorY = currentY + 5;
        };

            drawWatermark();
        drawHeader();

        drawSectionHeader("PERSONAL INFORMATION");
        const fullName = formData.firstName && formData.lastName ? `${formData.firstName} ${formData.lastName}` : "";
        addLabelValue("Name", fullName);
        addLabelValue("Email", formData.email || "");
        addLabelValue("Phone", formData.phone || "");

        cursorY += 5;

        if (cursorY > pageHeight - 150) {
          doc.addPage();
          drawWatermark();
          drawHeader();
          cursorY = 100;
        }

        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          if (i > 1) {
            drawWatermark();
            drawHeader();
          }
        }

        // doc.save("Patient_Assessment.pdf");
        const pdfBlob = doc.output("blob");
        resolve(pdfBlob);
      } catch (error) {
        console.error("PDF generation error:", error);
        reject(error);
      }
    });
  };

   const loadImageToBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
  };