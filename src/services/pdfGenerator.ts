/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

export interface PDFExportOptions {
  filename?: string;
  hasWatermark?: boolean;
  watermarkText?: string;
  onProgress?: (progress: number) => void;
}

export async function generateCVPdf(
  elementId: string,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const {
    filename = 'Mon_CV_Professionnel.pdf',
    hasWatermark = false,
    watermarkText = 'CV Pro Bénin — Version Découverte',
    onProgress
  } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Élément #${elementId} introuvable pour la génération du document.`);
  }

  onProgress?.(20);

  // Capture haute résolution (scale: 2 pour une netteté de document imprimable 300 DPI)
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
    onclone: (clonedDoc) => {
      const clonedEl = clonedDoc.getElementById(elementId);
      if (clonedEl) {
        clonedEl.style.transform = 'none';
        if (clonedEl.parentElement) {
          clonedEl.parentElement.style.transform = 'none';
        }
      }
    }
  });

  onProgress?.(60);

  // Format standard A4 en millimètres (210 x 297 mm)
  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = 210;
  const pdfHeight = 297;

  // Calcul du ratio de proportion pour respecter exactement les dimensions A4
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Première page
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');

  // Filigrane discret si offre gratuite
  if (hasWatermark) {
    addWatermark(pdf, watermarkText, pdfWidth, pdfHeight);
  }

  heightLeft -= pdfHeight;

  // Gestion des pages supplémentaires si le CV déborde
  let pageCount = 1;
  while (heightLeft > 5) {
    position = -pageCount * pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    if (hasWatermark) {
      addWatermark(pdf, watermarkText, pdfWidth, pdfHeight);
    }
    heightLeft -= pdfHeight;
    pageCount++;
  }

  onProgress?.(90);

  // Sauvegarde
  pdf.save(filename);

  onProgress?.(100);
  return pdf.output('blob');
}

function addWatermark(pdf: jsPDF, text: string, width: number, height: number) {
  pdf.saveGraphicsState();
  pdf.setTextColor(160, 160, 160);
  pdf.setFontSize(9);
  pdf.text(text, width / 2, height - 6, { align: 'center' });
  pdf.restoreGraphicsState();
}

export function triggerPrintDialog(): void {
  window.print();
}
