import React, { useEffect, useRef, useState } from 'react';
import {
  Stage, Layer,
  Image as KonvaImage,
  Line,
  Star,
  Ellipse,
  Rect,
  Text,
  Label,
  Tag,
  Arrow
} from 'react-konva';
import useImage from 'use-image';
import EditShapeModal from './EditSHapeModal';
import '../styles/EditShapeModal.css';
import man from '../assets/body_man.png';
import woman from '../assets/body_woman.png';
import manBack from '../assets/body_man_back.png';
import womanBack from '../assets/body_woman_back.png';
import manHeadNeck from '../assets/body_man_head.png';
import womanHeadNeck from '../assets/body_woman_head.png';
import manUpperBody from '../assets/body_man_upper.png';
import womanUpperBody from '../assets/body_woman_upper.png';
import manLeftArm from '../assets/body_man_leftarm.png';
import womanLeftArm from '../assets/body_woman_leftarm.png';
import manRightArm from '../assets/body_man_rightarm.png';
import womanRightArm from '../assets/body_woman_rightarm.png';
import manLeftLeg from '../assets/body_man_leftleg.png';
import womanLeftLeg from '../assets/body_woman_leftleg.png';
import manRightLeg from '../assets/body_man_rightleg.png';
import womanRightLeg from '../assets/body_woman_rightleg.png';
import femaleIcon from '../assets/icons/female-28-512.png';
import maleIcon from '../assets/icons/male-21-512.png'
import logo from '../assets/logo.png'
import frontBack from '../assets/icons/refresh-109-512.png';
import shapesIcon from '../assets/icons/tool.png';
import arrowIcon from '../assets/icons/arrow1.png'
import editIcon from '../assets/icons/pencil-81-512.png';
import eraserIcon from '../assets/icons/eraser.png';
import bodyPart from '../assets/icons/zoom-in-zoom-in-512.png';
import undoIcon from '../assets/icons/reset-16-128.png';
import { useFormikContext } from 'formik';

const DrawingCanvas = ({ onCanvasReady }) => {
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight);
  const [canvasWidth, setCanvasWidth] = useState(window.innerHeight / 667 * 375);
  const [alertShowPopup, setAlertShowPopup] = useState(false);
  const [tool, setTool] = useState('pencil');
  const [savedDrawings, setSavedDrawings] = useState({});
  const [drawings, setDrawings] = useState([]);
    const [gender, setGender] = useState('woman');
  const eraserRadius = 10;
  const isErasing = useRef(false);
  const [color, setColor] = useState('#ff0000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showShapePanel, setShowShapePanel] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const [view, setView] = useState('full-body');
  const [isBack, setBack] = useState(0);
  const [currentArrow, setCurrentArrow] = useState(null);
  const arrowStart = useRef(null);
  const isDrawing = useRef(false);
  const stageRef = useRef(null);
  const stageRefs = useRef({});
  const [showShapeEditor, setShowShapeEditor] = useState(false);
  
  const [shapeConfigs, setShapeConfigs] = useState({
    'sharp-pain': { size: 10, color: 'red', label: 'Sharp Pain' },
    'dull-ache': { size: 10, color: 'orange', label: 'Dull Ache' },
    'tingling': { size: 10, color: 'blue', label: 'Tingling' },
    'numbness': { size: 10, color: 'green', label: 'Numbness' },
  });
  const { values } = useFormikContext();
  const [activeLabel, setActiveLabel] = useState(null);
  const partTextStyle = {
    fontFamily: 'Arial',
    fontStyle: 'bold',
    fill: '#333',
    padding: 6,
  };

const handleDownloadWrapper = () => {
  if (zoomMode) {
    handleResetView();
    
    setAlertShowPopup(true);
    
    setTimeout(() => {
      setAlertShowPopup(false);
      handleDownload();
    }, 1000);
    
    return;
  } 

  handleDownload();         
};

useEffect(() => {
  if (onCanvasReady) {
    onCanvasReady({
      download: handleDownloadWrapper, 
    });
  }
}, [onCanvasReady, zoomMode]);  

  useEffect(() => {
    const handleResize = () => {
      const height = Math.min(window.innerHeight, window.screen.height);
      const width = height / 667 * 375;

      setCanvasHeight(height);
      setCanvasWidth(width);

      // Prevent further updates during scroll
      window.removeEventListener('resize', handleResize);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Image map remains the same
  const imageMap = {
    'man': man,
    'woman': woman,
    'man-back': manBack,
    'woman-back': womanBack,
    'man-head-neck': manHeadNeck,
    'woman-head-neck': womanHeadNeck,
    'man-upper-body': manUpperBody,
    'woman-upper-body': womanUpperBody,
    'man-left-arm': manLeftArm,
    'woman-left-arm': womanLeftArm,
    'man-right-arm': manRightArm,
    'woman-right-arm': womanRightArm,
    'man-left-leg': manLeftLeg,
    'woman-left-leg': womanLeftLeg,
    'man-right-leg': manRightLeg,
    'woman-right-leg': womanRightLeg
  };


  const [bodyImage] = useImage(imageMap[`${gender}${view === 'full-body' ? '' : '-' + view}`]);


  useEffect(() => {
    if (bodyImage && stageRef.current) {
      stageRef.current.batchDraw();
    }
  }, [bodyImage]);

  const updateShapeConfig = (toolKey, newValues) => {
    setShapeConfigs(prev => ({
      ...prev,
      [toolKey]: { ...prev[toolKey], ...newValues }
    }));
  };

  const eraseAtPoint = (pos) => {
    const radiusSq = eraserRadius * eraserRadius;
    const updatedDrawings = [];

    for (const d of drawings) {
      if (d.type === 'pencil') {
        const oldPts = d.data.points;
        let currentSegment = [];

        for (let i = 0; i < oldPts.length; i += 2) {
          const x = oldPts[i];
          const y = oldPts[i + 1];
          const dx = x - pos.x;
          const dy = y - pos.y;
          const inside = dx * dx + dy * dy < radiusSq;

          if (!inside) {
            currentSegment.push(x, y);
          } else if (currentSegment.length >= 4) {
            updatedDrawings.push({
              type: 'pencil',
              data: { stroke: d.data.stroke, points: currentSegment }
            });
            currentSegment = [];
          } else {
            currentSegment = [];
          }
        }

        if (currentSegment.length >= 4) {
          updatedDrawings.push({
            type: 'pencil',
            data: { stroke: d.data.stroke, points: currentSegment }
          });
        }

      } else if (d.type === 'shape') {
        const dx = d.data.x - pos.x;
        const dy = d.data.y - pos.y;
        if (dx * dx + dy * dy > radiusSq) {
          updatedDrawings.push(d);
        }
      } else if (d.type === 'arrow') {
        const midX = (d.data.start.x + d.data.end.x) / 2;
        const midY = (d.data.start.y + d.data.end.y) / 2;
        const dx = midX - pos.x;
        const dy = midY - pos.y;
        if (dx * dx + dy * dy > radiusSq) {
          updatedDrawings.push(d);
        }
      } else {
        updatedDrawings.push(d);
      }
    }
    setDrawings(updatedDrawings);
  };

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    if (zoomMode) return;

    if (tool === 'eraser') {
      isErasing.current = true;
      eraseAtPoint(pos);
    } else if (tool === 'pencil') {
      isDrawing.current = true;
      setDrawings([
        ...drawings,
        {
          type: 'pencil',
          data: {
            points: [pos.x, pos.y],
            stroke: color,
          },
        },
      ]);
    } else if (tool === 'arrow') {
      arrowStart.current = pos;
    } else {
      const { size, color } = shapeConfigs[tool] || {};
      setDrawings([...drawings, {
        type: 'shape',
        data: { tool, x: pos.x, y: pos.y, size, color }
      }]);
    }
  };

  const handleMouseMove = (e) => {
    const point = e.target.getStage().getPointerPosition();

    if (tool === 'eraser' && isErasing.current) {
      eraseAtPoint(point);
      return;
    }

    if (tool === 'pencil' && isDrawing.current) {
      const last = drawings[drawings.length - 1];
      if (last?.type === 'pencil') {
        const updated = {
          ...last,
          data: {
            ...last.data,
            points: [...last.data.points, point.x, point.y]
          }
        };
        setDrawings([...drawings.slice(0, -1), updated]);
      }
    } else if (tool === 'arrow' && arrowStart.current) {
      setCurrentArrow({
        start: arrowStart.current,
        end: point,
        stroke: color,
      });
    }
  };

  const handleMouseUp = (e) => {
    if (tool === 'eraser') {
      isErasing.current = false;
    } else if (tool === 'pencil') {
      isDrawing.current = false;
    } else if (tool === 'arrow' && arrowStart.current) {
      const end = e.target.getStage().getPointerPosition();
      setDrawings([...drawings, {
        type: 'arrow',
        data: { start: arrowStart.current, end, stroke: color },
      }]);
      arrowStart.current = null;
      setCurrentArrow(null);
    }
  };
  const saveCurrentViewDrawings = () => {
    const key = `${gender}-${view}`;
    setSavedDrawings(prev => ({
      ...prev,
      [key]: drawings
    }));
  };


  const handleZoomSelect = (part) => {
    saveCurrentViewDrawings();
    const nextKey = `${gender}-${part}`;
    setDrawings(savedDrawings[nextKey] || []);
    setZoomMode(false);
    setView(part);
  };

  const handleResetView = () => {
    // saveCurrentViewDrawings();
    const nextKey = `${gender}-full-body`;
    setDrawings(savedDrawings[nextKey] || []);
    setZoomMode(false);
    setView('full-body');
  };


  const handleDownload = async () => {
    
    saveCurrentViewDrawings();

    const jsPDF = (await import('jspdf')).default;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [600, 912] });

    try {
      // Load images with basic optimization
      const logoImg = await loadImageToBase64(logo);
      const bgImg = await loadImageToBase64('https://storage.googleapis.com/msgsndr/11NLpXQF1SZFaLK9l2gW/media/682c139b438303e8bc1af578.png');

      const views = [
        'full-body',
        'back',
        'head-neck',
        'upper-body',
        'left-arm',
        'right-arm',
        'left-leg',
        'right-leg',
      ];

      const viewLabels = {
        'full-body': 'Front View',
        'back': 'Back View',
        'head-neck': 'Front Head & Neck',
        'upper-body': 'Front Upper Body',
        'left-arm': 'Left Arm',
        'right-arm': 'Right Arm',
        'left-leg': 'Left Leg',
        'right-leg': 'Right Leg',
      };

      const originalGender = gender;
      const originalView = view;
      const results = [];

      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const waitForStageRender = async (stageKey, maxRetries = 10) => {
        for (let i = 0; i < maxRetries; i++) {
          const stage = stageRefs.current[stageKey];
          if (stage && stage.getStage && stage.getStage()) {
            const layer = stage.getLayer ? stage.getLayer() : stage.getLayers()[0];
            if (layer) {
              layer.batchDraw();
            }
            stage.batchDraw();
            await wait(200);
            return stage;
          }
          await wait(100);
        }
        return null;
      };

      // Generate compressed images for each view
      for (const v of views) {

        setView(v);
        await wait(800);

        const key = `${gender}-${v}`;
        const stage = await waitForStageRender(key);

        if (!stage) {
          console.warn(`Stage not found for ${key}, skipping...`);
          results.push({ view: v, image: null });
          continue;
        }

        try {
          const layer = stage.getLayer ? stage.getLayer() : stage.getLayers()[0];
          if (layer) {
            layer.batchDraw();
          }
          stage.batchDraw();
          await wait(300);

          // Optimize canvas capture for smaller file size
          const dataURL = stage.toDataURL({
            pixelRatio: 1.2,
            mimeType: 'image/png',
            quality: 0.9
          });

          if (dataURL && dataURL !== 'data:,' && dataURL.length > 100) {
            results.push({ view: v, image: dataURL });
          } else {
            console.warn(`Empty or invalid dataURL for ${v}`);
            results.push({ view: v, image: null });
          }
        } catch (error) {
          console.error(`Error capturing ${v}:`, error);
          results.push({ view: v, image: null });
        }
      }
      // Restore original view
        const missingViews = results.filter(r => !r.image).length;
    if (missingViews > 0) {
      // Restore original view
      setView(originalView);
      setGender(originalGender);
      
      // Show alert about incomplete diagram
      window.parent.postMessage({
        type: 'PAIN_DIAGRAM_INCOMPLETE',
        missingCount: missingViews
      }, '*');
      
      // Also dispatch event for internal handling
      const incompleteEvent = new CustomEvent('painDiagramIncomplete', {
        detail: { missingCount: missingViews }
      });
      window.dispatchEvent(incompleteEvent);
      
      alert(`Your pain diagram is incomplete (missing ${missingViews} views). Please redraw the pain diagram.`);
      return;
    }
      await wait(300);

      console.log(`Captured ${results.filter(r => r.image).length} out of ${results.length} images`);

      // PDF generation with optimized settings
      const pageW = 600;
      const pageH = 912;
      const paddingX = 50;
      const paddingY = 30;
      const headerHeight = 20;
      const imgW = 225;
      const imgH = 406;
      const colGap = 50;
      const rowGap = 10;
      const legendW = 120;
      const legendH = 130;
      const legendX = (pageW - legendW) / 2;
      const legendY = (pageH - legendH) / 2;

      const addCustomHeader = (pdf) => {
        try {
          if (bgImg) {
            pdf.addImage(bgImg, 'PNG', 0, 0, 200, 200);
          }
          if (logoImg) {
            pdf.addImage(logoImg, 'PNG', paddingX, 20, 100, 30);
          }
        } catch (error) {
          console.warn('Error adding header images:', error);
        }

        const now = new Date();
        const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
        const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const fullText = `GENERATED ON: ${dateStr}, ${timeStr}`;

        const textX = pageW - paddingX;
        const textY = 30;

        pdf.setFontSize(10);
        pdf.setFont("Helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        pdf.text(fullText, textX, textY, { align: 'right' });

        const lineWidth = 130;
        const lineY = textY + 7;
        const lineXStart = textX - lineWidth;
        const firstPartWidth = lineWidth * 0.3;
        const secondPartWidth = lineWidth * 0.7;

        pdf.setDrawColor(54, 56, 69);
        pdf.setLineWidth(2);
        pdf.line(lineXStart, lineY, lineXStart + firstPartWidth, lineY);

        pdf.setDrawColor(68, 145, 202);
        pdf.line(lineXStart + firstPartWidth, lineY, lineXStart + lineWidth, lineY);

        pdf.setFontSize(20);
        pdf.setFont("Helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text("PAIN ", 475, 55, { align: 'right' });
        pdf.setTextColor(86, 164, 0);
        pdf.text("DIAGRAM", 550, 55, { align: 'right' });
      };

      // Generate PDF pages with optimized compression
      for (let i = 0; i < results.length; i += 4) {
        if (i > 0) pdf.addPage();

        addCustomHeader(pdf);

        results.slice(i, i + 4).forEach((img, idx) => {
          const row = Math.floor(idx / 2);
          const col = idx % 2;

          const x = paddingX + col * (imgW + colGap);
          const y = paddingY + headerHeight + 10 + row * (imgH + rowGap);

          // Draw border
          pdf.setDrawColor(0);
          pdf.rect(x, y, imgW, imgH);

          // Add image with standard quality
          if (img.image) {
            try {
              pdf.addImage(img.image, 'PNG', x, y, imgW, imgH, undefined, 'FAST');
            } catch (error) {
              console.error(`Error adding image for ${img.view}:`, error);
              pdf.setFontSize(12);
              pdf.setTextColor(128, 128, 128);
              pdf.text('Image not available', x + imgW / 2, y + imgH / 2, { align: 'center' });
            }
          } else {
            pdf.setFontSize(12);
            pdf.setTextColor(128, 128, 128);
            pdf.text('Image not available', x + imgW / 2, y + imgH / 2, { align: 'center' });
          }

          // Add label
          const labelText = viewLabels[img.view] || img.view;
          pdf.setFontSize(14);
          pdf.setTextColor(0, 0, 0);

          if (col === 0) {
            pdf.text(labelText, x + 6, y + 14);
          } else {
            const textWidth = pdf.getTextWidth(labelText);
            pdf.text(labelText, x + imgW - textWidth - 6, y + 14);
          }
        });

        // Add legend (unchanged to maintain quality)
        pdf.setDrawColor(0);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(legendX, legendY, legendW, legendH, 'FD');

        pdf.setFontSize(14);
        pdf.setTextColor(0);
        pdf.text('Shape Legend', legendX + legendW / 2, legendY + 14, { align: 'center' });

        let startY = legendY + 30;
        const startX = legendX + 15;

        Object.entries(shapeConfigs).forEach(([tool, config]) => {
          pdf.setDrawColor(config.color);
          pdf.setLineWidth(1);

          switch (tool) {
            case 'sharp-pain': {
              const side = 10;
              const height = side * Math.sqrt(3) / 2;
              const x1 = startX;
              const y1 = startY;
              const x2 = x1 - side / 2;
              const y2 = y1 + height;
              const x3 = x1 + side / 2;
              const y3 = y1 + height;
              pdf.lines([[x2 - x1, y2 - y1], [x3 - x2, y3 - y2], [x1 - x3, y1 - y3]], x1, y1);
              break;
            }
            case 'dull-ache':
              pdf.circle(startX, startY, 5, 'D');
              break;
            case 'tingling':
              pdf.rect(startX - 5, startY - 5, 10, 10, 'D');
              break;
            case 'numbness':
              const spikes = 5;
              const outer = 6, inner = 3;
              const angle = Math.PI / spikes;
              let starPoints = [];
              for (let i = 0; i < 2 * spikes; i++) {
                const r = i % 2 === 0 ? outer : inner;
                const a = i * angle - Math.PI / 2;
                const sx = startX + r * Math.cos(a);
                const sy = startY + r * Math.sin(a);
                starPoints.push([sx, sy]);
              }
              pdf.lines(starPoints.map(([px, py], i) => {
                const next = starPoints[(i + 1) % starPoints.length];
                return [next[0] - px, next[1] - py];
              }), starPoints[0][0], starPoints[0][1]);
              break;
          }

          pdf.setFontSize(12);
          pdf.setTextColor(0);
          pdf.text(config.label, startX + 20, startY + 4);
          startY += 28;
        });
      }

      // Save PDF with compression
      const fileName = `${gender}-pain-diagram.pdf`;
      const pdfBase64 = pdf.output('datauristring');
      const pdfOutput = pdf.output('arraybuffer');
      const fileSizeInBytes = pdfOutput.byteLength;
      const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
      const pdfBlob = new Blob([pdfOutput], { type: 'application/pdf' });

      try {
        window.parent.postMessage({
          type: 'PAIN_DIAGRAM_PDF',
          fileName: fileName,
          fileSize: fileSizeInKB,
          fileData: pdfBase64
        }, '*');

        const pdfReadyEvent = new CustomEvent('painDiagramPdfReady', {
          detail: { fileName, fileSize: fileSizeInKB }
        });
        window.dispatchEvent(pdfReadyEvent);
      } catch (error) {
        console.error('Error sending PDF data:', error);
      }

      // pdf.save(fileName);

    } catch (error) {
      console.error('Error in PDF generation:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Optimized image loading function
  const loadImageToBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");

          // Slight optimization without heavy compression
          const maxWidth = 1000;
          const maxHeight = 800;
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Keep PNG format for better quality
          const dataURL = canvas.toDataURL("image/png");
          resolve(dataURL);
        } catch (error) {
          console.error('Error converting image to base64:', error);
          resolve(null);
        }
      };

      img.onerror = (error) => {
        console.error('Error loading image:', url, error);
        resolve(null);
      };

      setTimeout(() => {
        if (!img.complete) {
          console.warn('Image load timeout:', url);
          resolve(null);
        }
      }, 10000);

      img.src = url;
    });
  };

  useEffect(() => {
    window.parent.postMessage({ type: 'IFRAME_READY' }, '*');

    const handleMessage = (event) => {
      // Process messages from GHL if needed
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);


  useEffect(() => {
    if (bodyImage && stageRef.current) {
      stageRef.current.batchDraw();
    }
  }, [bodyImage]);

  useEffect(() => {
    const key = `${gender}-${view}`;
    setDrawings(savedDrawings[key] || []);
  }, [gender, view]);


  const renderZoomLabels = () => {
    const positions = {
      headNeck: { x: 0.37, y: 0.07 },
      upperBody: { x: 0.4, y: 0.25 },
      rightArm: { x: 0.23, y: 0.4 },
      leftArm: { x: 0.6, y: 0.4 },
      rightLeg: { x: 0.3, y: 0.6 },
      leftLeg: { x: 0.55, y: 0.6 },
      backButton: { x: 0.32, y: 0.9 }
    };

    const handleLabelClick = (part) => {
      setActiveLabel(part);
      setTimeout(() => setActiveLabel(null), 200);
      handleZoomSelect(part);
    };

    return (
      <>
        {/* Head & Neck */}
        <Label
          x={canvasWidth * positions.headNeck.x}
          y={canvasHeight * positions.headNeck.y}
          onClick={() => handleLabelClick('head-neck')}
          onTap={() => handleLabelClick('head-neck')}
        >
          <Tag
            fill={activeLabel === 'head-neck' ? '#f0f0f0' : 'white'}
            cornerRadius={10}
            shadowColor="black"
            shadowBlur={5}
            shadowOpacity={0.2}
          />
          <Text
            text="Head & Neck"
            fontSize={14}
            fontFamily="Arial"
            fill="#333"
            padding={8}
          />
        </Label>

        {/* Upper Body */}
        <Label
          x={canvasWidth * positions.upperBody.x}
          y={canvasHeight * positions.upperBody.y}
          onClick={() => handleLabelClick('upper-body')}
          onTap={() => handleLabelClick('upper-body')}
        >
          <Tag
            fill={activeLabel === 'upper-body' ? '#f0f0f0' : 'white'}
            cornerRadius={10}
          />
          <Text text="Upper Body" fontSize={14} {...partTextStyle} />
        </Label>

        {/* Right Arm */}
        <Label
          x={canvasWidth * positions.rightArm.x}
          y={canvasHeight * positions.rightArm.y}
          onClick={() => handleLabelClick('right-arm')}
          onTap={() => handleLabelClick('right-arm')}
        >
          <Tag
            fill={activeLabel === 'right-arm' ? '#f0f0f0' : 'white'}
            cornerRadius={10}
          />
          <Text text="Right Arm" fontSize={14} {...partTextStyle} />
        </Label>

        {/* Left Arm */}
        <Label
          x={canvasWidth * positions.leftArm.x}
          y={canvasHeight * positions.leftArm.y}
          onClick={() => handleLabelClick('left-arm')}
          onTap={() => handleLabelClick('left-arm')}
        >
          <Tag
            fill={activeLabel === 'left-arm' ? '#f0f0f0' : 'white'}
            cornerRadius={10}
          />
          <Text text="Left Arm" fontSize={14} {...partTextStyle} />
        </Label>

        {/* Right Leg */}
        <Label
          x={canvasWidth * positions.rightLeg.x}
          y={canvasHeight * positions.rightLeg.y}
          onClick={() => handleLabelClick('right-leg')}
          onTap={() => handleLabelClick('right-leg')}
        >
          <Tag
            fill={activeLabel === 'right-leg' ? '#f0f0f0' : 'white'}
            cornerRadius={10}
          />
          <Text text="Right Leg" fontSize={14} {...partTextStyle} />
        </Label>

        {/* Left Leg */}
        <Label
          x={canvasWidth * positions.leftLeg.x}
          y={canvasHeight * positions.leftLeg.y}
          onClick={() => handleLabelClick('left-leg')}
          onTap={() => handleLabelClick('left-leg')}
        >
          <Tag
            fill={activeLabel === 'left-leg' ? '#f0f0f0' : 'white'}
            cornerRadius={10}
          />
          <Text text="Left Leg" fontSize={14} {...partTextStyle} />
        </Label>

        {/* Back to Full Body */}
        <Label
          x={canvasWidth * positions.backButton.x}
          y={canvasHeight * positions.backButton.y}
          onClick={handleResetView}
          onTap={handleResetView}
        >
          <Tag fill="#0772b6" cornerRadius={10} />
          <Text
            text="Back to Full Body"
            fontSize={16}
            fontFamily="Arial"
            fill="white"
            padding={8}
          />
        </Label>
      </>
    );
  };

  return (
    <div className="drawing-wrapper">
      <div className="p-d-logo-img">
        <img src={logo} alt="Logo" />
      </div>

      <div className='canvas-container'>
        <Stage
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          ref={(node) => { stageRefs.current[`${gender}-${view}`] = node }}
          style={{
            touchAction: 'none' 
          }}
        >
          <Layer>
            {bodyImage && (
              <KonvaImage
                image={bodyImage}
                width={canvasWidth * 0.9} // Slightly smaller than canvas
                height={canvasHeight * 0.9}
                x={(canvasWidth - canvasWidth * 0.9) / 2} // Center horizontally
                y={(canvasHeight - canvasHeight * 0.9) / 2} // Center vertically
                opacity={zoomMode ? 0.4 : 0.6}
                listening={false}
                preserveAspectRatio={true}
              />
            )}

            {/* Rest of your existing drawing elements */}
            {currentArrow && (
              <Arrow
                points={[
                  currentArrow.start.x,
                  currentArrow.start.y,
                  currentArrow.end.x,
                  currentArrow.end.y,
                ]}
                stroke={currentArrow.stroke}
                strokeWidth={2}
                pointerLength={10}
                pointerWidth={8}
                dash={[4, 4]}
              />
            )}

            {drawings.map((item, i) => {
              const d = item.data;

              if (item.type === 'arrow') {
                const { start, end, stroke } = item.data;
                return (
                  <Arrow
                    key={i}
                    points={[start.x, start.y, end.x, end.y]}
                    stroke={stroke}
                    strokeWidth={2}
                    pointerLength={10}
                    pointerWidth={8}
                    fill={stroke}
                  />
                );
              }

              if (item.type === 'pencil' && !zoomMode) {
                const { points, stroke } = item.data;
                return (
                  <Line
                    key={i}
                    points={points}
                    stroke={stroke}
                    strokeWidth={2}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation="source-over"
                  />
                );
              }

              if (item.type === 'shape' && !zoomMode) {
                const { tool, x, y, size = 10, color = '#ff0000' } = item.data;

                switch (tool) {
                  case 'sharp-pain':
                    return (
                      <Line
                        key={i}
                        points={[x, y - size, x - size, y + size, x + size, y + size]}
                        closed
                        stroke={color}
                        fill="transparent"
                        strokeWidth={2}
                      />
                    );
                  case 'dull-ache':
                    return (
                      <Ellipse
                        key={i}
                        x={x}
                        y={y}
                        radiusX={size}
                        radiusY={size}
                        stroke={color}
                        fill="transparent"
                        strokeWidth={2}
                      />
                    );
                  case 'tingling':
                    return (
                      <Rect
                        key={i}
                        x={x - size}
                        y={y - size}
                        width={size * 2}
                        height={size * 2}
                        stroke={color}
                        fill="transparent"
                        strokeWidth={2}
                      />
                    );

                  case 'numbness':
                    return (
                      <Star
                        key={i}
                        x={x}
                        y={y}
                        numPoints={5}
                        innerRadius={size / 2}
                        outerRadius={size}
                        stroke={color}
                        fill="transparent"
                        strokeWidth={2}
                      />
                    );
                  default:
                    return null;
                }
              }

              return null;
            })}

            {zoomMode && renderZoomLabels()}
          </Layer>
        </Stage>
      </div>
      <div className="tool-panel left">
        <div className="color-button-wrapper">
          <button className="color-main-button all-btn" onClick={() => setShowColorPicker(!showColorPicker)}>
            <div className="color-ring">
              <div className="inner-ring" style={{ backgroundColor: color }} />
            </div>
            <text className='tool-name'> Color Picker </text>
          </button>
          {showColorPicker && (
            <div className="color-options">
              {['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#0000ff', '#ff00ff'].map((c) => (
                <div
                  key={c}
                  className="color-circle"
                  style={{ backgroundColor: c, border: color === c ? '2px solid #000' : '1px solid #aaa' }}
                  onClick={() => { setColor(c); setShowColorPicker(false); }}
                />
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowShapePanel(!showShapePanel)} className="icon-button all-btn">
          <img src={shapesIcon} alt="Shapes" className="icon-img" />
          <text className='tool-name'> Shapes </text>
        </button>

        {showShapePanel && (
          <div className="shape-popup">
            <button className="modal-close all-btn" onClick={() => {
              setShowShapePanel(prev => {
                const newState = !prev;
                if (!newState) setShowShapeEditor(false);
                return newState;
              });
            }}>✖</button>
            <button className='optionBtn all-btn' onClick={() => {
              setTool('sharp-pain'); {
                setShowShapePanel(prev => {
                  const newState = !prev;
                  if (!newState) setShowShapeEditor(false);
                  return newState;
                });
              }
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polygon points="12,4 4,20 20,20" stroke={shapeConfigs['sharp-pain']?.color || 'red'} fill="white" strokeWidth="3" />
              </svg>
              <span>{shapeConfigs['sharp-pain'].label}</span>
            </button>

            <button className='optionBtn all-btn' onClick={() => {
              setTool('dull-ache'); {
                setShowShapePanel(prev => {
                  const newState = !prev;
                  if (!newState) setShowShapeEditor(false);
                  return newState;
                });
              }
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke={shapeConfigs['dull-ache']?.color || 'orange'} fill="white" strokeWidth="3" />
              </svg>
              <span>{shapeConfigs['dull-ache'].label}</span>
            </button>

            <button className='optionBtn all-btn' onClick={() => {
              setTool('tingling'); {
                setShowShapePanel(prev => {
                  const newState = !prev;
                  if (!newState) setShowShapeEditor(false);
                  return newState;
                });
              }
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" stroke={shapeConfigs['tingling']?.color || 'blue'} fill="white" strokeWidth="3" />
              </svg>
              <span>{shapeConfigs['tingling'].label}</span>
            </button>

            <button className='optionBtn all-btn' onClick={() => {
              setTool('numbness'); {
                setShowShapePanel(prev => {
                  const newState = !prev;
                  if (!newState) setShowShapeEditor(false);
                  return newState;
                });
              }
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polygon
                  stroke={shapeConfigs['numbness']?.color || 'green'}
                  fill="white"
                  strokeWidth="3"
                  points="
                    12,2
                    14.7,8.5
                    22,9.3
                    16.5,14.1
                    18.2,21.5
                    12,17.8
                    5.8,21.5
                    7.5,14.1
                    2,9.3
                    9.3,8.5
                  "
                />
              </svg>
              <span>{shapeConfigs['numbness'].label}</span>
            </button>
            <div style={{ "height": "2px", "background": "#CCC" }} />
            <button className="optionBtn all-btn" onClick={() => { setShowShapeEditor(prev => !prev); }}>
              <img src={editIcon} alt="Shapes" className="icon-img-shape" />
              <span> Edit Shape</span>
            </button>

            {/* Edit Shape Modal */}
            {showShapeEditor && (
              <EditShapeModal
                tool={tool}
                config={shapeConfigs[tool]} // ✅ pass shape-specific config
                onUpdate={(newConfig) => updateShapeConfig(tool, newConfig)} // ✅ hook to update specific shape
                onClose={() => setShowShapeEditor(false)}
              />
            )}

          </div>
        )}

        <button className='all-btn' onClick={() => {
          if (isBack === 0) {
            setBack(1);
            handleZoomSelect('back');
          } else {
            setBack(0);
            handleZoomSelect('full-body');
          }
        }}>
          <img src={frontBack} alt="Shapes" className="icon-img" />
          <text className='tool-name'> Front / Back </text>
        </button>

        {/* Gender Selection (Always Visible) */}
 <div className="gender-toggle-row">
          <button
            className={`gender-btn all-btn ${gender === 'man' ? 'selected' : ''}`}
            onClick={() => {
              saveCurrentViewDrawings();
              const nextKey = `man-${view}`;
              setGender('man');
              setDrawings(savedDrawings[nextKey] || []);
            }}
          >
            <img src={maleIcon} alt="Male" className="icon-img" />
            <text className='tool-name'> Male </text>
          </button>
          <button
            className={`gender-btn all-btn ${gender === 'woman' ? 'selected' : ''}`}
            onClick={() => {
              saveCurrentViewDrawings();
              const nextKey = `woman-${view}`;
              setGender('woman');
              setDrawings(savedDrawings[nextKey] || []);
            }}
          >
            <img src={femaleIcon} alt="Female" className="icon-img" />
            <text className='tool-name'> Female </text>
          </button>
        </div>


      </div>

      <div className="tool-panel right">
        <button className='all-btn' onClick={() => setDrawings(drawings.slice(0, -1))}>
          <img src={undoIcon} alt="Shapes" className="icon-img" />
          <text className='tool-name'> Undo </text>
        </button>
        <button
          onClick={() => setTool('arrow')}
          className={`icon-button all-btn ${tool === 'arrow' ? 'selected' : ''}`}
        >
          <img src={arrowIcon} alt="Arrow" className="icon-img" />
          <text className='tool-name'> Arrow </text>
        </button>

        <button
          onClick={() => setTool('pencil')}
          className={`icon-button all-btn ${tool === 'pencil' ? 'selected' : ''}`}
        >
          <img src={editIcon} alt="Pencil" className="icon-img" />
          <text className='tool-name'> Pencil </text>
        </button>

        <button
          onClick={() => setTool('eraser')}
          className={`icon-button all-btn ${tool === 'eraser' ? 'selected' : ''}`}
        >
          <img src={eraserIcon} alt="Eraser" className="icon-img" />
          <text className='tool-name'> Eraser </text>
        </button>
        <button className='all-btn' onClick={() => setZoomMode(true)}>
          <img src={bodyPart} alt="Shapes" className="icon-img" />
          <text className='tool-name'> Body Part </text>
        </button>
      </div>

      {alertShowPopup && (
        <div className="alert-box">
          <div className="alert-container">
            <p className="alert-text">
              Please select a body part or reset to full body view before sending
            </p>
            <div className="alert-buttons">
              <button className="alert-btn" onClick={() => setAlertShowPopup(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DrawingCanvas;