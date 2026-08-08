import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Captures a DOM container element by ID, clones it into a standardized 800px print layout,
 * and exports it as a multi-page A4 PDF document with margins.
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

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 10; // 10mm top/bottom/left/right page margin

    const printableWidth = pageWidth - (margin * 2); // 190mm
    const printableHeight = pageHeight - (margin * 2); // 277mm

    const imgWidth = printableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // Render Page 1
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= printableHeight;

    // Render multi-page document if content exceeds 1 page
    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= printableHeight;
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
