import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Captures a DOM container element by ID and converts it to a multi-page PDF document.
 * @param elementId ID of the HTML container element to render as PDF.
 * @param fileName Name of the generated PDF file.
 */
export async function exportElementToPdf(elementId: string, fileName: string): Promise<void> {
  const container = document.getElementById(elementId);
  if (!container) {
    console.error(`PDF Export Error: Element with ID '${elementId}' not found.`);
    return;
  }

  try {
    // Capture canvas with 2x scale for crisp executive rendering
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Multi-page loop if content exceeds 1 page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  } catch (error) {
    console.error("PDF Export failed:", error);
    throw error;
  }
}

export async function exportEmployeeReportPdf(employeeName: string, elementId: string = 'employee-report-container'): Promise<void> {
  const sanitizedName = (employeeName || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Employee_Report_${sanitizedName}_${dateStr}.pdf`;
  await exportElementToPdf(elementId, fileName);
}

export async function exportActionPlanPdf(employeeName: string, behaviourId: string = 'WBIL', elementId: string = 'action-plan-container'): Promise<void> {
  const sanitizedName = (employeeName || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedBeh = (behaviourId || 'WBIL').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `30_Day_Action_Plan_${sanitizedName}_${sanitizedBeh}.pdf`;
  await exportElementToPdf(elementId, fileName);
}
