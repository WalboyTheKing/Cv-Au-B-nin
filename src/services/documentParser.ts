/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CVData, Experience, Education, Skill, Language, CustomSection } from '../types';
import { INITIAL_DEMO_CV } from './storage';

export interface ParseResult {
  success: boolean;
  cvData: CVData;
  extractedRawText: string;
  detectedFields: string[];
  warnings: string[];
  isAI?: boolean;
}

/**
 * Nettoyage strict anti-fuite de syntaxe binaire / PDF
 */
function sanitizeCleanString(val: any, maxLength = 100): string {
  if (typeof val !== 'string') return '';
  let str = val.trim();
  // Suppression absolue des en-têtes et opérateurs PDF
  if (
    str.includes('%PDF') ||
    str.includes('obj') ||
    str.includes('endobj') ||
    str.includes('<<') ||
    str.includes('>>') ||
    str.includes('/Catalog') ||
    str.includes('/Type') ||
    str.includes('/Pages') ||
    str.includes('stream') ||
    str.includes('xref') ||
    str.startsWith('/')
  ) {
    return '';
  }
  return str.slice(0, maxLength);
}

/**
 * Validation d'un nom ou prénom humain (doit être composé de lettres, espaces, traits d'union)
 */
function sanitizeHumanName(val: any): string {
  const clean = sanitizeCleanString(val, 60);
  if (!clean) return '';
  // Doit comporter au moins 2 lettres et pas de caractères de programmation
  if (/[%<>{}[\]\/\\=;~`$*]/.test(clean)) return '';
  if (!/^[a-zA-ZÀ-ÿ\s.'-]+$/.test(clean)) return '';
  return clean;
}

/**
 * Convertit un fichier en Data URL base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Construit un objet CVData complet à partir de la réponse structurée de Gemini AI
 */
function buildCVFromAIData(data: any, originalFileName: string): ParseResult {
  const baseCV = JSON.parse(JSON.stringify(INITIAL_DEMO_CV)) as CVData;
  const detectedFields: string[] = [];
  const warnings: string[] = [];

  const pi = data?.personalInfo || {};
  const cleanFirstName = sanitizeHumanName(pi.firstName);
  const cleanLastName = sanitizeHumanName(pi.lastName);
  const cleanJobTitle = sanitizeCleanString(pi.jobTitle, 80);
  const cleanEmail = sanitizeCleanString(pi.email, 80);
  const cleanPhone = sanitizeCleanString(pi.phone, 30);
  const cleanCity = sanitizeCleanString(pi.city, 50);

  if (cleanFirstName || cleanLastName) {
    detectedFields.push('Identité & Nom');
  }
  if (cleanEmail || cleanPhone) {
    detectedFields.push('Coordonnées de contact');
  }
  if (cleanJobTitle) {
    detectedFields.push('Titre professionnel');
  }

  // Profil & Résumé
  let profileSummary = baseCV.profileSummary;
  if (typeof data?.summary === 'string' && data.summary.trim()) {
    const cleanSum = sanitizeCleanString(data.summary, 1200);
    if (cleanSum.length > 20) {
      profileSummary = cleanSum;
      detectedFields.push('Profil & Résumé');
    }
  }

  // Expériences
  let experiences: Experience[] = [];
  if (Array.isArray(data?.experiences) && data.experiences.length > 0) {
    experiences = data.experiences.map((exp: any, idx: number) => ({
      id: `exp_ai_${Date.now()}_${idx}`,
      role: sanitizeCleanString(exp.role || 'Poste occupé', 80),
      company: sanitizeCleanString(exp.company || 'Entreprise', 80),
      city: sanitizeCleanString(exp.city || 'Cotonou', 50),
      country: sanitizeCleanString(exp.country || 'Bénin', 50),
      startDate: sanitizeCleanString(exp.startDate || '2022', 20),
      endDate: sanitizeCleanString(exp.endDate || '', 20),
      current: Boolean(exp.current),
      description: sanitizeCleanString(exp.description || '', 1000),
      achievements: Array.isArray(exp.achievements)
        ? exp.achievements.map((a: string) => sanitizeCleanString(a, 300)).filter(Boolean)
        : []
    }));
    if (experiences.length > 0) {
      detectedFields.push(`Expériences professionnelles (${experiences.length})`);
    }
  }

  // Formations
  let educations: Education[] = [];
  if (Array.isArray(data?.educations) && data.educations.length > 0) {
    educations = data.educations.map((edu: any, idx: number) => ({
      id: `edu_ai_${Date.now()}_${idx}`,
      degree: sanitizeCleanString(edu.degree || 'Diplôme', 100),
      institution: sanitizeCleanString(edu.institution || edu.school || 'Établissement', 100),
      city: sanitizeCleanString(edu.city || 'Cotonou', 50),
      country: sanitizeCleanString(edu.country || 'Bénin', 50),
      startDate: sanitizeCleanString(edu.startDate || '', 20),
      endDate: sanitizeCleanString(edu.endDate || edu.graduationYear || '2020', 20),
      current: Boolean(edu.current),
      description: sanitizeCleanString(edu.description || edu.field || '', 500)
    }));
    if (educations.length > 0) {
      detectedFields.push(`Formations & Diplômes (${educations.length})`);
    }
  }

  // Compétences
  let skills: Skill[] = [];
  if (Array.isArray(data?.skills) && data.skills.length > 0) {
    skills = data.skills.map((s: any, idx: number) => {
      const name = typeof s === 'string' ? sanitizeCleanString(s, 50) : sanitizeCleanString(s?.name, 50);
      let cat: Skill['category'] = 'transverse';
      const rawCat = s?.category || '';
      if (['dev_web', 'informatique', 'bureautique', 'gestion', 'vente', 'maintenance', 'communication'].includes(rawCat)) {
        cat = rawCat as any;
      }
      return {
        id: `sk_ai_${Date.now()}_${idx}`,
        name: name || 'Compétence',
        category: cat,
        level: (s?.level && s.level >= 1 && s.level <= 5) ? s.level : 4
      };
    }).filter((s: Skill) => s.name.length > 1);
    if (skills.length > 0) {
      detectedFields.push(`Compétences (${skills.length})`);
    }
  }

  // Langues
  let languages: Language[] = [];
  if (Array.isArray(data?.languages) && data.languages.length > 0) {
    languages = data.languages.map((l: any, idx: number) => {
      const name = typeof l === 'string' ? sanitizeCleanString(l, 40) : sanitizeCleanString(l?.name, 40);
      const rawLvl = (l?.level || '').toLowerCase();
      let level: Language['level'] = 'courant';
      if (rawLvl.includes('matern')) level = 'maternelle';
      else if (rawLvl.includes('biling') || rawLvl.includes('cour')) level = 'courant';
      else if (rawLvl.includes('prof') || rawLvl.includes('c1') || rawLvl.includes('c2')) level = 'professionnel';
      else if (rawLvl.includes('inter') || rawLvl.includes('b1') || rawLvl.includes('b2')) level = 'intermediaire';
      else if (rawLvl.includes('notion') || rawLvl.includes('a1') || rawLvl.includes('a2')) level = 'notions';

      return {
        id: `lang_ai_${Date.now()}_${idx}`,
        name: name || 'Français',
        level
      };
    }).filter((l: Language) => l.name.length > 1);
    if (languages.length > 0) {
      detectedFields.push(`Langues (${languages.length})`);
    }
  }

  // Sections personnalisées (Certifications, Centres d'intérêt)
  const customSections: CustomSection[] = [];
  if (Array.isArray(data?.customSections) && data.customSections.length > 0) {
    data.customSections.forEach((sec: any, idx: number) => {
      if (sec?.title && Array.isArray(sec?.items) && sec.items.length > 0) {
        customSections.push({
          id: `sec_ai_${Date.now()}_${idx}`,
          title: sanitizeCleanString(sec.title, 50),
          type: 'certifications',
          enabled: true,
          items: sec.items.map((it: any, iIdx: number) => ({
            id: `item_ai_${Date.now()}_${idx}_${iIdx}`,
            title: sanitizeCleanString(it.title, 100),
            subtitle: sanitizeCleanString(it.subtitle, 100),
            date: sanitizeCleanString(it.date, 30),
            description: sanitizeCleanString(it.description, 300)
          }))
        });
      }
    });
  }

  // Centres d'intérêt / Hobbies
  if (Array.isArray(data?.hobbies) && data.hobbies.length > 0) {
    const hobbyItems = data.hobbies
      .map((h: string) => sanitizeCleanString(h, 80))
      .filter(Boolean);
    if (hobbyItems.length > 0) {
      customSections.push({
        id: `sec_hobbies_${Date.now()}`,
        title: "Centres d'intérêt & Loisirs",
        type: 'loisirs',
        enabled: true,
        items: hobbyItems.map((h: string, hIdx: number) => ({
          id: `hobby_${Date.now()}_${hIdx}`,
          title: h
        }))
      });
    }
  }

  const candidateDisplayName = `${cleanFirstName || ''} ${cleanLastName || ''}`.trim() || 'Candidat';

  const finalCV: CVData = {
    ...baseCV,
    id: `cv_${Date.now()}`,
    title: `CV Modernisé - ${candidateDisplayName}`,
    personalInfo: {
      ...baseCV.personalInfo,
      firstName: cleanFirstName || baseCV.personalInfo.firstName,
      lastName: cleanLastName || baseCV.personalInfo.lastName,
      jobTitle: cleanJobTitle || baseCV.personalInfo.jobTitle,
      email: cleanEmail || baseCV.personalInfo.email,
      phone: cleanPhone || baseCV.personalInfo.phone,
      city: cleanCity || baseCV.personalInfo.city,
      country: 'Bénin',
      address: sanitizeCleanString(pi.address, 100) || baseCV.personalInfo.address,
      linkedIn: sanitizeCleanString(pi.linkedin || pi.linkedIn, 120) || baseCV.personalInfo.linkedIn,
      website: sanitizeCleanString(pi.website, 120) || baseCV.personalInfo.website
    },
    profileSummary,
    experiences: experiences.length > 0 ? experiences : baseCV.experiences,
    educations: educations.length > 0 ? educations : baseCV.educations,
    skills: skills.length > 0 ? skills : baseCV.skills,
    languages: languages.length > 0 ? languages : baseCV.languages,
    customSections: customSections.length > 0 ? customSections : baseCV.customSections
  };

  return {
    success: true,
    cvData: finalCV,
    extractedRawText: `Document: ${originalFileName}\nExtraction effectuée par IA Gemini avec succès.`,
    detectedFields,
    warnings,
    isAI: true
  };
}

/**
 * Extraction robuste des chaînes de texte d'un flux PDF (sans bibliothèques externes)
 */
function extractCleanTextFromPDFBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let ascii = '';
  // Lecture optimisée des octets lisibles
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 10 || b === 13 || (b >= 32 && b <= 126) || (b >= 160 && b <= 255)) {
      ascii += String.fromCharCode(b);
    } else {
      ascii += ' ';
    }
  }

  const extractedChunks: string[] = [];

  // 1. Extraction des balises /ActualText
  // Exemple: /ActualText (Boris Fabrice Maud DOSSOUVI)
  const actualTextParenRegex = /\/ActualText\s*\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = actualTextParenRegex.exec(ascii)) !== null) {
    const text = match[1].trim();
    if (text && text.length > 1 && !text.includes('%PDF')) {
      extractedChunks.push(text);
    }
  }

  // 2. Extraction des balises /ActualText en hexadécimal
  // Exemple: /ActualText <455850C95249454E434553...> -> "EXPÉRIENCES..."
  const actualTextHexRegex = /\/ActualText\s*<([0-9a-fA-F]+)>/g;
  while ((match = actualTextHexRegex.exec(ascii)) !== null) {
    const hex = match[1];
    let decoded = '';
    for (let c = 0; c < hex.length; c += 2) {
      const code = parseInt(hex.substr(c, 2), 16);
      if (code >= 32) decoded += String.fromCharCode(code);
    }
    const clean = decoded.trim();
    if (clean && clean.length > 1 && !clean.includes('%PDF')) {
      extractedChunks.push(clean);
    }
  }

  // 3. Extraction des métadonnées du document : /Author, /Title
  const authorMatch = ascii.match(/\/Author\s*\(([^)]+)\)/i);
  if (authorMatch && authorMatch[1]) {
    extractedChunks.unshift(authorMatch[1].trim());
  }

  const titleMatch = ascii.match(/\/Title\s*\(([^)]+)\)/i);
  if (titleMatch && titleMatch[1]) {
    extractedChunks.unshift(titleMatch[1].trim());
  }

  // 4. Extraction des chaînes textuelles dans les flux PDF (parenthèses)
  const parenTextRegex = /\(([A-Za-z0-9À-ÿ\s@.,:;+\/'-]{3,80})\)/g;
  while ((match = parenTextRegex.exec(ascii)) !== null) {
    const candidate = match[1].trim();
    if (
      candidate &&
      !candidate.includes('%PDF') &&
      !candidate.includes('/Type') &&
      !candidate.includes('/Font') &&
      !candidate.includes('obj') &&
      !candidate.includes('<<') &&
      !candidate.includes('FlateDecode')
    ) {
      extractedChunks.push(candidate);
    }
  }

  // Déduplication partielle et filtrage
  const uniqueChunks: string[] = [];
  const seen = new Set<string>();
  for (const chunk of extractedChunks) {
    const normalized = chunk.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      uniqueChunks.push(chunk);
    }
  }

  return uniqueChunks.join('\n');
}

/**
 * Analyse et extraction d'un fichier de CV (PDF, DOCX, TXT)
 */
export async function parseCVFile(file: File): Promise<ParseResult> {
  const maxBytes = 10 * 1024 * 1024; // 10 MB max
  if (file.size > maxBytes) {
    throw new Error('Le fichier est trop volumineux. La taille maximale autorisée est de 10 Mo.');
  }

  const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isTXT = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');

  // --- ÉTAPE 1 : TENTATIVE D'EXTRACTION INTELLIGENTE VIA L'API SERVEUR GEMINI ---
  try {
    const base64Data = await fileToBase64(file);
    const pureBase64 = base64Data.split(',')[1] || base64Data;

    let payload: any = {
      fileBase64: pureBase64,
      mimeType: file.type || (isPDF ? 'application/pdf' : 'text/plain'),
      fileName: file.name
    };

    if (isTXT) {
      payload.rawText = await file.text();
    }

    const res = await fetch('/api/cv/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return buildCVFromAIData(json.data, file.name);
      }
    }
  } catch (apiErr) {
    console.warn("L'API d'analyse IA serveur n'a pas répondu, recours à l'analyse heuristique locale:", apiErr);
  }

  // --- ÉTAPE 2 : EXTRACTION HEURISTIQUE LOCALE SÉCURISÉE (FALLBACK) ---
  let rawText = '';
  if (isPDF) {
    const buffer = await file.arrayBuffer();
    rawText = extractCleanTextFromPDFBuffer(buffer);
  } else if (isTXT) {
    rawText = await file.text();
  } else {
    // DOCX ou autre binaire
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const raw = decoder.decode(buffer);
    rawText = raw.replace(/[^\x20-\x7E\u00C0-\u00FF\n\r]/g, ' ').replace(/\s+/g, ' ');
  }

  return parseCVText(rawText);
}

/**
 * Analyse heuristique d'un texte de CV brut
 */
export function parseCVText(rawText: string): ParseResult {
  const warnings: string[] = [];
  const detectedFields: string[] = [];

  // Nettoyer strictement les lignes de toute instruction PDF
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => {
      if (l.length < 2) return false;
      if (l.startsWith('%PDF') || l.includes('obj') || l.includes('<<') || l.includes('>>') || l.includes('stream')) {
        return false;
      }
      return true;
    });

  // 1. Détection de l'email
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
  const emailMatch = rawText.match(emailRegex);
  const email = emailMatch ? sanitizeCleanString(emailMatch[1], 80) : '';
  if (email) detectedFields.push('Email');

  // 2. Détection du téléphone (avec indicatif Bénin +229 ou format local)
  const phoneRegex = /(\+?229[\s-]?)?([0-9]{2}[\s-]?[0-9]{2}[\s-]?[0-9]{2}[\s-]?[0-9]{2})/i;
  const phoneMatch = rawText.match(phoneRegex);
  const phone = phoneMatch ? sanitizeCleanString(phoneMatch[0], 30) : '';
  if (phone) detectedFields.push('Téléphone');

  // 3. Détection du Nom / Prénom (recherche de lignes contenant 2 à 4 mots alphabétiques)
  let firstName = '';
  let lastName = '';
  for (const line of lines) {
    const candidate = line.replace(/curriculum vitae|cv|résumé/gi, '').trim();
    if (!candidate.includes('@') && !candidate.match(/[0-9]/) && candidate.length > 3 && candidate.length < 50) {
      const parts = candidate.split(/\s+/);
      if (parts.length >= 2 && parts.length <= 4) {
        const fn = sanitizeHumanName(parts[0]);
        const ln = sanitizeHumanName(parts.slice(1).join(' '));
        if (fn && ln) {
          firstName = fn;
          lastName = ln;
          detectedFields.push('Identité & Nom');
          break;
        }
      }
    }
  }

  // 4. Détection de la ville
  let city = 'Cotonou';
  const beninCities = ['Cotonou', 'Calavi', 'Porto-Novo', 'Parakou', 'Bohicon', 'Ouidah', 'Natitingou', 'Casablanca', 'Paris', 'Abidjan'];
  for (const c of beninCities) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(rawText)) {
      city = c === 'Calavi' ? 'Abomey-Calavi' : c;
      detectedFields.push('Ville');
      break;
    }
  }

  // 5. Détection du titre professionnel
  let jobTitle = '';
  for (const line of lines.slice(0, 10)) {
    if (
      line.length > 5 &&
      line.length < 60 &&
      !line.includes('@') &&
      !line.match(/[0-9]{5,}/) &&
      line !== `${firstName} ${lastName}`
    ) {
      if (
        /ingénieur|développeur|technicien|comptable|commercial|assistant|secrétaire|directeur|responsable|consultant|manager|juriste|étudiant|stagiaire/i.test(line)
      ) {
        jobTitle = sanitizeCleanString(line, 80);
        detectedFields.push('Titre professionnel');
        break;
      }
    }
  }

  // Création du CV pré-rempli à partir du modèle par défaut
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
    warnings.push("Peu d'informations ont pu être extraites automatiquement. Vous pouvez compléter directement les champs dans le formulaire.");
  }

  return {
    success: true,
    cvData: baseCV,
    extractedRawText: rawText.slice(0, 3000),
    detectedFields,
    warnings,
    isAI: false
  };
}
