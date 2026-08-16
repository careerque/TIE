import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Captures a DOM container element by ID, clones it into a standardized 800px print layout,
 * and exports it as a multi-page A4 PDF document with clean top/bottom page margins and gaps.
 * 
 * @param elementId ID of the HTML container element to render as PDF.
 * @param fileName Name of the generated PDF file.
 */
export async function exportElementToPdf(elementId: string, fileName: string): Promise<void> {
  const originalContainer = document.getElementById(elementId);
  if (!originalContainer) {
    console.error(`PDF Export Error: Element with ID '${elementId}' not found.`);
    return;
  }

  // Create an off-screen print wrapper at fixed 800px width for standard A4 aspect ratio
  const clone = originalContainer.cloneNode(true) as HTMLElement;
  clone.id = `${elementId}-pdf-clone`;
  
  // Apply standard executive document styles to clone
  clone.style.width = '800px';
  clone.style.maxWidth = '800px';
  clone.style.padding = '32px';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#243B53';
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0px';
  clone.style.boxSizing = 'border-box';

  document.body.appendChild(clone);

  try {
    // High-resolution canvas capture (2x scale for crisp text)
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Cleanup temporary clone node
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }

    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm

    // 15mm Top and Bottom Margins (creates 30mm total white page break gap between pages)
    const marginTop = 15; // 15mm top margin
    const marginBottom = 15; // 15mm bottom margin
    const marginSide = 12; // 12mm left/right margin

    const printableWidth = pageWidth - (marginSide * 2); // 186mm
    const printableHeight = pageHeight - marginTop - marginBottom; // 267mm

    // Calculate height of canvas slice corresponding to one A4 printable page
    const slicePixelHeight = Math.floor((printableHeight * canvas.width) / printableWidth);

    let srcY = 0;
    let pageIndex = 0;

    while (srcY < canvas.height) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      // Height of current slice in canvas pixels
      const currentSliceHeight = Math.min(slicePixelHeight, canvas.height - srcY);

      // Create temporary canvas for this page slice
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = currentSliceHeight;

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0, srcY, canvas.width, currentSliceHeight, // source rectangle
          0, 0, canvas.width, currentSliceHeight      // destination rectangle
        );
      }

      const pageImgData = pageCanvas.toDataURL('image/png');
      const renderedHeightMM = (currentSliceHeight * printableWidth) / canvas.width;

      // Fill top & bottom margin areas with solid white background to guarantee clean separation
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, marginTop, 'F');
      pdf.rect(0, pageHeight - marginBottom, pageWidth, marginBottom, 'F');

      // Add sliced page image inside printable margins
      pdf.addImage(pageImgData, 'PNG', marginSide, marginTop, printableWidth, renderedHeightMM);

      srcY += currentSliceHeight;
      pageIndex++;
    }

    const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    pdf.save(finalFileName);
  } catch (error) {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
    console.error("PDF Export failed:", error);
    throw error;
  }
}

export async function exportEmployeeReportPdf(employeeName: string, elementId: string = 'employee-report-container'): Promise<void> {
  const sanitizedName = (employeeName || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `TIE_Employee_Report_${sanitizedName}_${dateStr}.pdf`;
  await exportElementToPdf(elementId, fileName);
}

export async function exportActionPlanPdf(employeeName: string, behaviourId: string = 'WBIL', elementId: string = 'action-plan-container'): Promise<void> {
  const sanitizedName = (employeeName || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedBeh = (behaviourId || 'WBIL').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `30_Day_Action_Plan_${sanitizedName}_${sanitizedBeh}.pdf`;
  await exportElementToPdf(elementId, fileName);
}
