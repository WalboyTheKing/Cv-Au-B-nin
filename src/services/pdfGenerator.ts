/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { isValidPdfAnnotationUrl } from '../utils/linkUtils';
import { CVData } from '../types';

export interface PDFExportOptions {
  filename?: string;
  hasWatermark?: boolean;
  watermarkText?: string;
  cvData?: CVData;
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

export interface ExtractedPdfTextNode {
  text: string;
  xMm: number;
  yOnPageMm: number;
  pageIndex: number;
  fontSizePt: number;
}

function normalizePdfWinAnsiText(input: string): string {
  return input
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x20-\xFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

    const relX = (rect.left - rootRect.left) / rootRect.width;
    const relY = (rect.top - rootRect.top) / rootRect.height;
    const relW = rect.width / rootRect.width;
    const relH = rect.height / rootRect.height;

    const xMm = relX * pdfWidth;
    const yMm = relY * imgHeight;
    const wMm = Math.max(relW * pdfWidth, 4);
    const hMm = Math.max(relH * imgHeight, 3);

    const pageIndex = Math.floor(yMm / pdfHeight);
    const yOnPageMm = yMm - pageIndex * pdfHeight;

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

/**
 * Extrait les segments de texte réels du DOM pour rendre le PDF
 * sélectionnable, indexable et compatible avec les logiciels ATS.
 */
export function extractPdfTextNodes(
  rootEl: HTMLElement,
  pdfWidth: number,
  imgHeight: number,
  pdfHeight: number
): ExtractedPdfTextNode[] {
  const rootRect = rootEl.getBoundingClientRect();
  if (rootRect.width <= 0 || rootRect.height <= 0 || typeof document === 'undefined') return [];

  const nodes: ExtractedPdfTextNode[] = [];
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
  let currentNode: Node | null;

  while ((currentNode = walker.nextNode())) {
    const rawText = currentNode.textContent || '';
    const cleanText = normalizePdfWinAnsiText(rawText);
    if (!cleanText) continue;

    const parentEl = currentNode.parentElement;
    if (!parentEl) continue;
    const style = window.getComputedStyle(parentEl);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

    try {
      const range = document.createRange();
      range.selectNodeContents(currentNode);
      const rect = range.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      const relX = Math.max(0, (rect.left - rootRect.left) / rootRect.width);
      const relY = Math.max(0, (rect.bottom - rootRect.top) / rootRect.height);
      const xMm = Math.min(pdfWidth - 5, relX * pdfWidth);
      const yMm = relY * imgHeight;
      const pageIndex = Math.floor(yMm / pdfHeight);
      const yOnPageMm = Math.max(3, Math.min(pdfHeight - 2, yMm - pageIndex * pdfHeight));

      const pxFont = parseFloat(style.fontSize || '11') || 11;
      const scaleMmPerPx = pdfWidth / rootRect.width;
      const fontSizePt = Math.max(5, Math.min(18, pxFont * scaleMmPerPx * 2.2));

      nodes.push({
        text: cleanText,
        xMm: Number(xMm.toFixed(2)),
        yOnPageMm: Number(yOnPageMm.toFixed(2)),
        pageIndex,
        fontSizePt: Number(fontSizePt.toFixed(1))
      });
    } catch {
      // Ignorer les noeuds sans boîte de rendu
    }
  }

  return nodes;
}

export async function generateCVPdf(
  elementId: string,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const {
    filename = 'Mon_CV_Professionnel.pdf',
    hasWatermark = false,
    watermarkText = 'CV Pro Bénin — Version Découverte',
    cvData,
    onProgress
  } = options;

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Élément #${elementId} introuvable pour la génération du document.`);
  }

  onProgress?.(15);

  const pdfWidth = 210;
  const pdfHeight = 297;

  // Capture haute résolution 300 DPI avec largeur fixe A4 (sans troncature)
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

  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Métadonnées structurées pour réimportation fidèle
  if (cvData) {
    try {
      const jsonStr = JSON.stringify(cvData);
      const b64 =
        typeof window !== 'undefined' && window.btoa
          ? window.btoa(unescape(encodeURIComponent(jsonStr)))
          : Buffer.from(jsonStr, 'utf-8').toString('base64');

      pdf.setProperties({
        title: cvData.title || filename,
        subject: 'CV_PRO_BENIN_DATA',
        author: `${cvData.personalInfo?.firstName || ''} ${cvData.personalInfo?.lastName || ''}`.trim() || 'CV Pro Bénin',
        keywords: `CVPRO_B64:${b64}`
      });
    } catch (metaErr) {
      console.warn('Impossible d’intégrer les métadonnées CV au PDF:', metaErr);
    }
  }

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Page 1
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  if (hasWatermark) {
    addWatermark(pdf, watermarkText, pdfWidth, pdfHeight);
  }

  heightLeft -= pdfHeight;

  // Pages suivantes
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

  onProgress?.(75);

  // 2. Couche textuelle ATS invisible mais 100% sélectionnable et extractible
  try {
    const textNodes = extractPdfTextNodes(element, pdfWidth, imgHeight, pdfHeight);
    if (textNodes.length > 0) {
      pdf.setFont('helvetica', 'normal');
      textNodes.forEach((node) => {
        const targetPage = node.pageIndex + 1;
        if (targetPage <= pageCount) {
          pdf.setPage(targetPage);
          pdf.setFontSize(node.fontSizePt);
          pdf.text(node.text, node.xMm, node.yOnPageMm, { renderingMode: 'invisible' });
        }
      });
    } else if (cvData) {
      // Secours minimal si DOM hors écran sans métriques de Range
      const fallbackLines = [
        `${cvData.personalInfo?.firstName || ''} ${cvData.personalInfo?.lastName || ''}`.trim(),
        cvData.personalInfo?.jobTitle || '',
        [cvData.personalInfo?.email, cvData.personalInfo?.phone, cvData.personalInfo?.city].filter(Boolean).join(' | '),
        cvData.profileSummary || '',
        ...cvData.experiences.map((e) => `${e.role} - ${e.company}: ${e.description}`),
        ...cvData.educations.map((ed) => `${ed.degree} - ${ed.institution}`),
        cvData.skills.map((s) => s.name).join(', ')
      ]
        .map((l) => normalizePdfWinAnsiText(l))
        .filter(Boolean);
      pdf.setPage(1);
      pdf.setFontSize(8);
      pdf.text(fallbackLines.slice(0, 35), 10, 12, { renderingMode: 'invisible' });
    }
  } catch (textLayerErr) {
    console.warn('Couche textuelle ATS ignorée:', textLayerErr);
  }

  onProgress?.(85);

  // 3. Projection des liens cliquables réels (mailto:, tel:, LinkedIn, Portfolio)
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
