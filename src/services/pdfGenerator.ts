/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { isValidPdfAnnotationUrl } from '../utils/linkUtils';

export interface PDFExportOptions {
  filename?: string;
  hasWatermark?: boolean;
  watermarkText?: string;
  onProgress?: (progress: number) => void;
}

export interface ExtractedPdfLink {
  url: string;
  xMm: number;
  yMm: number;
  wMm: number;
  hMm: number;
  pageIndex: number;
  yOnPageMm: number;
}

/**
 * Extrait les liens interactifs de l'élément DOM et calcule leurs coordonnées
 * millimétriques réelles et leur page de destination dans le PDF.
 */
export function extractPdfLinks(
  rootEl: HTMLElement,
  pdfWidth: number,
  imgHeight: number,
  pdfHeight: number
): ExtractedPdfLink[] {
  const rootRect = rootEl.getBoundingClientRect();
  if (rootRect.width <= 0 || rootRect.height <= 0) return [];

  const linkElements = rootEl.querySelectorAll<HTMLElement>('a[href], [data-pdf-link]');
  const results: ExtractedPdfLink[] = [];

  linkElements.forEach((el) => {
    const rawUrl = el.getAttribute('data-pdf-link') || el.getAttribute('href');
    if (!rawUrl) return;

    if (!isValidPdfAnnotationUrl(rawUrl)) return;

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Ratios relatifs (0 à 1) par rapport à l'élément racine (insensibles à la mise à l'échelle CSS)
    const relX = (rect.left - rootRect.left) / rootRect.width;
    const relY = (rect.top - rootRect.top) / rootRect.height;
    const relW = rect.width / rootRect.width;
    const relH = rect.height / rootRect.height;

    // Conversion en millimètres PDF
    const xMm = relX * pdfWidth;
    const yMm = relY * imgHeight;
    const wMm = Math.max(relW * pdfWidth, 4); // Zone minimale cliquable de 4mm
    const hMm = Math.max(relH * imgHeight, 3); // Zone minimale cliquable de 3mm

    // Détermination de la page (0 = page 1, 1 = page 2, etc.)
    const pageIndex = Math.floor(yMm / pdfHeight);
    const yOnPageMm = yMm - pageIndex * pdfHeight;

    // Vérification de validité de géométrie
    if (yOnPageMm < pdfHeight && xMm < pdfWidth) {
      results.push({
        url: rawUrl.trim(),
        xMm: Math.max(0, Number(xMm.toFixed(2))),
        yMm: Number(yMm.toFixed(2)),
        wMm: Math.min(Number(wMm.toFixed(2)), Number((pdfWidth - xMm).toFixed(2))),
        hMm: Math.min(Number(hMm.toFixed(2)), Number((pdfHeight - yOnPageMm).toFixed(2))),
        pageIndex,
        yOnPageMm: Number(yOnPageMm.toFixed(2))
      });
    }
  });

  return results;
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

  onProgress?.(15);

  const pdfWidth = 210;
  const pdfHeight = 297;

  // 1. Capture haute résolution (scale: 2 pour une netteté de document imprimable 300 DPI)
  // Forçage de l'overflow visible et de la hauteur automatique pour capturer le contenu multi-pages
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
    scrollY: 0,
    scrollX: 0,
    onclone: (clonedDoc) => {
      const clonedEl = clonedDoc.getElementById(elementId);
      if (clonedEl) {
        clonedEl.style.transform = 'none';
        clonedEl.style.overflow = 'visible';
        clonedEl.style.height = 'auto';
        clonedEl.style.maxHeight = 'none';
        if (clonedEl.parentElement) {
          clonedEl.parentElement.style.transform = 'none';
          clonedEl.parentElement.style.overflow = 'visible';
          clonedEl.parentElement.style.height = 'auto';
          clonedEl.parentElement.style.maxHeight = 'none';
        }
      }
    }
  });

  onProgress?.(55);

  // Format standard A4 en millimètres (210 x 297 mm)
  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

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

  // Gestion des pages supplémentaires sans troncature si le CV s'étend
  let pageCount = 1;
  while (heightLeft > 8) {
    position = -pageCount * pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    if (hasWatermark) {
      addWatermark(pdf, watermarkText, pdfWidth, pdfHeight);
    }
    heightLeft -= pdfHeight;
    pageCount++;
  }

  onProgress?.(80);

  // 2. Extraction et projection des liens cliquables réels sur le document PDF
  try {
    const links = extractPdfLinks(element, pdfWidth, imgHeight, pdfHeight);
    links.forEach((link) => {
      const targetPageNum = link.pageIndex + 1;
      if (targetPageNum <= pageCount) {
        pdf.setPage(targetPageNum);
        pdf.link(link.xMm, link.yOnPageMm, link.wMm, link.hMm, { url: link.url });
      }
    });
  } catch (err) {
    console.warn('Annotation de liens PDF ignorée:', err);
  }

  onProgress?.(95);

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
