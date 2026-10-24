/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CVData } from '../types';
import { INITIAL_DEMO_CV } from './storage';

export interface ParseResult {
  success: boolean;
  cvData: Partial<CVData>;
  extractedRawText: string;
  detectedFields: string[];
  warnings: string[];
}

/**
 * Analyse heuristique de documents de CV
 */
export async function parseCVFile(file: File): Promise<ParseResult> {
  const maxBytes = 5 * 1024 * 1024; // 5 MB max
  if (file.size > maxBytes) {
    throw new Error('Le fichier est trop volumineux. La taille maximale autorisée est de 5 Mo.');
  }

  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];

  if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|doc|txt)$/i)) {
    throw new Error('Format non pris en charge. Veuillez fournir un fichier PDF, DOCX ou TXT.');
  }

  // Lecture du texte
  let rawText = '';
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    rawText = await file.text();
  } else {
    // Pour PDF / DOCX, on lit les flux textuels
    try {
      rawText = await extractTextFromFile(file);
    } catch {
      rawText = `Document importé: ${file.name}\nVeuillez compléter vos informations ci-dessous.`;
    }
  }

  return parseCVText(rawText);
}

export function parseCVText(rawText: string): ParseResult {
  const warnings: string[] = [];
  const detectedFields: string[] = [];

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Détection de l'email
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
  const emailMatch = rawText.match(emailRegex);
  const email = emailMatch ? emailMatch[1] : '';
  if (email) detectedFields.push('Email');

  // 2. Détection du téléphone (avec indicatif Bénin +229 ou format local)
  const phoneRegex = /(\+?229[\s-]?)?([0-9]{2}[\s-]?[0-9]{2}[\s-]?[0-9]{2}[\s-]?[0-9]{2})/i;
  const phoneMatch = rawText.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0] : '';
  if (phone) detectedFields.push('Téléphone');

  // 3. Détection du Nom / Prénom (généralement dans les premières lignes)
  let firstName = '';
  let lastName = '';
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/curriculum vitae|cv|résumé/gi, '').trim();
    const parts = firstLine.split(/\s+/);
    if (parts.length >= 2) {
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
      detectedFields.push('Identité');
    }
  }

  // 4. Détection de la ville
  let city = 'Cotonou';
  const beninCities = ['Cotonou', 'Calavi', 'Porto-Novo', 'Parakou', 'Bohicon', 'Ouidah', 'Natitingou'];
  for (const c of beninCities) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(rawText)) {
      city = c === 'Calavi' ? 'Abomey-Calavi' : c;
      detectedFields.push('Ville');
      break;
    }
  }

  // 5. Détection du titre professionnel
  let jobTitle = '';
  if (lines.length > 1) {
    // Souvent la 2e ou 3e ligne
    const candidate = lines[1];
    if (!candidate.includes('@') && !candidate.match(/[0-9]{6,}/) && candidate.length < 60) {
      jobTitle = candidate;
      detectedFields.push('Titre professionnel');
    }
  }

  // Création du CV pré-rempli à partir du template par défaut
  const baseCV = JSON.parse(JSON.stringify(INITIAL_DEMO_CV)) as CVData;
  baseCV.id = 'cv_' + Date.now();
  baseCV.title = `CV importé - ${firstName || 'Candidat'} ${lastName || ''}`.trim();
  baseCV.personalInfo = {
    ...baseCV.personalInfo,
    firstName: firstName || baseCV.personalInfo.firstName,
    lastName: lastName || baseCV.personalInfo.lastName,
    jobTitle: jobTitle || baseCV.personalInfo.jobTitle,
    email: email || baseCV.personalInfo.email,
    phone: phone || baseCV.personalInfo.phone,
    city: city || baseCV.personalInfo.city,
    country: 'Bénin'
  };

  if (detectedFields.length === 0) {
    warnings.push("Peu d'informations ont pu être extraites automatiquement. Vous pouvez renseigner directement les champs dans le formulaire.");
  }

  return {
    success: true,
    cvData: baseCV,
    extractedRawText: rawText.slice(0, 3000),
    detectedFields,
    warnings
  };
}

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const raw = decoder.decode(buffer);

  // Filtre les chaînes de caractères lisibles
  const readable = raw.replace(/[^\x20-\x7E\u00C0-\u00FF\n\r]/g, ' ');
  return readable.replace(/\s+/g, ' ').trim();
}
