/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mammoth from 'mammoth';
import { CVData, Experience, Education, Skill, Language, CustomSection } from '../types';
import { INITIAL_DEMO_CV } from './storage';
import { BENIN_CITIES } from '../config';

export interface ParseResult {
  success: boolean;
  cvData: CVData;
  extractedRawText: string;
  detectedFields: string[];
  warnings: string[];
  missingFields: string[];
  isAI?: boolean;
}

/**
 * Nettoyage strict anti-fuite de syntaxe binaire / PDF
 */
function sanitizeCleanString(val: any, maxLength = 300): string {
  if (typeof val !== 'string') return '';
  let str = val.trim();
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
 * Validation d'un nom ou prénom humain
 */
function sanitizeHumanName(val: any): string {
  const clean = sanitizeCleanString(val, 60);
  if (!clean) return '';
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
 * Normalisation des rubriques avec prise en compte des variantes lexicales courantes
 */
export const SECTION_ALIASES = {
  experiences: [
    'experiences professionnelles',
    'expériences professionnelles',
    'experience professionnelle',
    'expérience professionnelle',
    'experiences',
    'expériences',
    'parcours professionnel',
    'parcours pro',
    'emplois et stages',
    'stages et experiences',
    'stages',
    'emplois',
    'historique professionnel',
    'carriere',
    'carrière',
    'missions et realisations',
    'activites professionnelles'
  ],
  educations: [
    'diplomes obtenues',
    'diplomes obtenus',
    'diplome obtenu',
    'diplomes',
    'diplômes',
    'formation universitaire',
    'formations universitaires',
    'cursus universitaire',
    'formations et diplomes',
    'formations et diplômes',
    'formation academique',
    'formation académique',
    'formations',
    'etudes et diplomes',
    'études et diplômes',
    'etudes',
    'études',
    'cursus academique',
    'cursus académique',
    'parcours scolaire',
    'cursus',
    'education',
    'éducation',
    'parcours academique'
  ],
  skills: [
    'competences informatiques',
    'compétences informatiques',
    'outils informatiques',
    'competences techniques',
    'compétences techniques',
    'competences professionnelles',
    'compétences professionnelles',
    'competences cles',
    'compétences clés',
    'competences',
    'compétences',
    'savoir faire',
    'savoir-faire',
    'domaines d expertise',
    'domaines d\'expertise',
    'expertises',
    'technologies',
    'outils et langages',
    'aptitudes'
  ],
  languages: [
    'maitrises linguistique',
    'maîtrises linguistique',
    'maitrise linguistique',
    'maîtrise linguistique',
    'maitrises linguistiques',
    'maîtrises linguistiques',
    'langues pratiquees',
    'langues pratiquées',
    'langues',
    'connaissances linguistiques',
    'competences linguistiques'
  ],
  summary: [
    'profil professionnel',
    'resume professionnel',
    'a propos de moi',
    'presentation',
    'objectif professionnel',
    'profil',
    'resume'
  ],
  certifications: [
    'certifications et attestations',
    'certifications professionnelles',
    'certifications',
    'certificats',
    'attestations',
    'formations certifiantes'
  ],
  projects: [
    'projets et realisations',
    'projets realises',
    'projets academiques',
    'projets personnels',
    'projets',
    'portfolio'
  ],
  stages: [
    'stages et immersions',
    'stages pratiques',
    'stages academiques',
    'stages'
  ],
  references: [
    'references professionnelles',
    'personnes de reference',
    'references',
    'recommandations'
  ],
  hobbies: [
    'loisirs',
    'loisir',
    'centres d interet',
    'centres d interets',
    'centres d\'intérêt',
    'centres d\'intérêts',
    'loisirs et passions',
    'passions',
    'activites extra professionnelles',
    'vie associative',
    'hobbies'
  ]
};

function normalizeHeader(text: string): string {
  const stripped = text
    .trim()
    .replace(/^[\s•\-\*o\d]+[.)\-–\s:]+/i, '')
    .replace(/^(?:rubrique|section|chapitre)\s*\d+[\s:.-]*/i, '')
    .trim();
  return stripped
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Construit un objet CVData complet à partir de la réponse structurée de Gemini AI
 */
function buildCVFromAIData(data: any, originalFileName: string): ParseResult {
  const baseCV = JSON.parse(JSON.stringify(INITIAL_DEMO_CV)) as CVData;
  const detectedFields: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];

  const pi = data?.personalInfo || {};
  const cleanFirstName = sanitizeHumanName(pi.firstName);
  const cleanLastName = sanitizeHumanName(pi.lastName);
  const cleanJobTitle = sanitizeCleanString(pi.jobTitle, 80);
  const cleanEmail = sanitizeCleanString(pi.email, 80);
  const cleanPhone = sanitizeCleanString(pi.phone, 30);
  const cleanCity = sanitizeCleanString(pi.city, 50);
  const cleanAddress = sanitizeCleanString(pi.address, 100);
  const cleanLinkedIn = sanitizeCleanString(pi.linkedin || pi.linkedIn, 120);
  const cleanWebsite = sanitizeCleanString(pi.website || pi.portfolio, 120);

  if (cleanFirstName || cleanLastName) detectedFields.push('Nom et prénom');
  else missingFields.push('Nom et prénom');

  if (cleanEmail) detectedFields.push('Email');
  else missingFields.push('Email');

  if (cleanPhone) detectedFields.push('Téléphone');
  else missingFields.push('Téléphone');

  if (cleanJobTitle) detectedFields.push('Titre professionnel');
  else missingFields.push('Titre professionnel');

  if (cleanCity) detectedFields.push('Ville de résidence');

  // Profil & Résumé
  let profileSummary = '';
  if (typeof data?.summary === 'string' && data.summary.trim()) {
    const cleanSum = sanitizeCleanString(data.summary, 1200);
    if (cleanSum.length > 15) {
      profileSummary = cleanSum;
      detectedFields.push('Profil & Résumé professionnel');
    }
  }
  if (!profileSummary) {
    missingFields.push('Résumé professionnel (optionnel)');
  }

  // Expériences
  let experiences: Experience[] = [];
  if (Array.isArray(data?.experiences) && data.experiences.length > 0) {
    experiences = data.experiences.map((exp: any, idx: number) => ({
      id: `exp_${Date.now()}_${idx}`,
      role: sanitizeCleanString(exp.role || exp.title || 'Poste occupé', 80),
      company: sanitizeCleanString(exp.company || exp.employer || 'Entreprise', 80),
      city: sanitizeCleanString(exp.city || exp.location || 'Cotonou', 50),
      country: sanitizeCleanString(exp.country || 'Bénin', 50),
      startDate: sanitizeCleanString(exp.startDate || '', 25),
      endDate: sanitizeCleanString(exp.endDate || '', 25),
      current: Boolean(exp.current),
      description: sanitizeCleanString(exp.description || '', 1000),
      achievements: Array.isArray(exp.achievements)
        ? exp.achievements.map((a: string) => sanitizeCleanString(a, 300)).filter(Boolean)
        : []
    }));
    detectedFields.push(`Expériences professionnelles (${experiences.length})`);
  } else {
    missingFields.push('Expériences professionnelles');
  }

  // Formations
  let educations: Education[] = [];
  if (Array.isArray(data?.educations) && data.educations.length > 0) {
    educations = data.educations.map((edu: any, idx: number) => ({
      id: `edu_${Date.now()}_${idx}`,
      degree: sanitizeCleanString(edu.degree || edu.diploma || 'Diplôme', 100),
      institution: sanitizeCleanString(edu.institution || edu.school || 'Établissement', 100),
      city: sanitizeCleanString(edu.city || 'Cotonou', 50),
      country: sanitizeCleanString(edu.country || 'Bénin', 50),
      startDate: sanitizeCleanString(edu.startDate || '', 25),
      endDate: sanitizeCleanString(edu.endDate || edu.graduationYear || '', 25),
      current: Boolean(edu.current),
      description: sanitizeCleanString(edu.description || edu.field || '', 500)
    }));
    detectedFields.push(`Formations & Diplômes (${educations.length})`);
  } else {
    missingFields.push('Formations académiques');
  }

  // Compétences
  let skills: Skill[] = [];
  if (Array.isArray(data?.skills) && data.skills.length > 0) {
    skills = data.skills
      .map((s: any, idx: number) => {
        const name = typeof s === 'string' ? sanitizeCleanString(s, 50) : sanitizeCleanString(s?.name, 50);
        let cat: Skill['category'] = 'transverse';
        const rawCat = s?.category || '';
        if (
          ['dev_web', 'informatique', 'bureautique', 'gestion', 'vente', 'maintenance', 'communication'].includes(
            rawCat
          )
        ) {
          cat = rawCat as any;
        }
        return {
          id: `sk_${Date.now()}_${idx}`,
          name: name || 'Compétence',
          category: cat,
          level: (s?.level && s.level >= 1 && s.level <= 5) ? s.level : 4
        };
      })
      .filter((s: Skill) => s.name.length > 1);

    if (skills.length > 0) {
      detectedFields.push(`Compétences (${skills.length})`);
    }
  }

  // Langues
  let languages: Language[] = [];
  if (Array.isArray(data?.languages) && data.languages.length > 0) {
    languages = data.languages
      .map((l: any, idx: number) => {
        const name = typeof l === 'string' ? sanitizeCleanString(l, 40) : sanitizeCleanString(l?.name, 40);
        const rawLvl = (l?.level || '').toLowerCase();
        let level: Language['level'] = 'courant';
        if (rawLvl.includes('matern')) level = 'maternelle';
        else if (rawLvl.includes('biling') || rawLvl.includes('cour')) level = 'courant';
        else if (rawLvl.includes('prof') || rawLvl.includes('c1') || rawLvl.includes('c2')) level = 'professionnel';
        else if (rawLvl.includes('inter') || rawLvl.includes('b1') || rawLvl.includes('b2')) level = 'intermediaire';
        else if (rawLvl.includes('notion') || rawLvl.includes('a1') || rawLvl.includes('a2')) level = 'notions';

        return {
          id: `lang_${Date.now()}_${idx}`,
          name: name || 'Français',
          level
        };
      })
      .filter((l: Language) => l.name.length > 1);

    if (languages.length > 0) {
      detectedFields.push(`Langues (${languages.length})`);
    }
  }

  // Sections personnalisées (Certifications, Projets, Stages, Références, Loisirs)
  const customSections: CustomSection[] = [];
  if (Array.isArray(data?.customSections) && data.customSections.length > 0) {
    data.customSections.forEach((sec: any, idx: number) => {
      if (sec?.title && Array.isArray(sec?.items) && sec.items.length > 0) {
        customSections.push({
          id: `sec_${Date.now()}_${idx}`,
          title: sanitizeCleanString(sec.title, 50),
          type: (sec.type as any) || 'certifications',
          enabled: true,
          items: sec.items.map((it: any, iIdx: number) => ({
            id: `item_${Date.now()}_${idx}_${iIdx}`,
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
        title: "Centres d'intérêt",
        type: 'loisirs',
        enabled: true,
        items: hobbyItems.map((h: string, hIdx: number) => ({
          id: `hobby_${Date.now()}_${hIdx}`,
          title: h
        }))
      });
      detectedFields.push(`Centres d'intérêt (${hobbyItems.length})`);
    }
  }

  const candidateDisplayName = `${cleanFirstName || ''} ${cleanLastName || ''}`.trim() || 'Candidat';

  const finalCV: CVData = {
    ...baseCV,
    id: `cv_${Date.now()}`,
    title: `CV - ${candidateDisplayName}`.trim(),
    personalInfo: {
      ...baseCV.personalInfo,
      firstName: cleanFirstName || '',
      lastName: cleanLastName || '',
      jobTitle: cleanJobTitle || '',
      email: cleanEmail || '',
      phone: cleanPhone || '',
      city: cleanCity || 'Cotonou',
      country: 'Bénin',
      address: cleanAddress || '',
      linkedIn: cleanLinkedIn || '',
      website: cleanWebsite || ''
    },
    profileSummary: profileSummary || '',
    experiences,
    educations,
    skills,
    languages: languages.length > 0 ? languages : [{ id: 'lang_def_1', name: 'Français', level: 'courant' }],
    customSections
  };

  return {
    success: true,
    cvData: finalCV,
    extractedRawText: `Document source : ${originalFileName}`,
    detectedFields,
    warnings,
    missingFields,
    isAI: true
  };
}

/**
 * Extraction robuste des chaînes de texte d'un flux PDF (sans bibliothèques externes lourdes)
 */
function extractCleanTextFromPDFBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let ascii = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 10 || b === 13 || (b >= 32 && b <= 126) || (b >= 160 && b <= 255)) {
      ascii += String.fromCharCode(b);
    } else {
      ascii += ' ';
    }
  }

  const extractedChunks: string[] = [];

  // Balises /ActualText parenthèses
  const actualTextParenRegex = /\/ActualText\s*\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = actualTextParenRegex.exec(ascii)) !== null) {
    const text = match[1].trim();
    if (text && text.length > 1 && !text.includes('%PDF')) {
      extractedChunks.push(text);
    }
  }

  // Balises /ActualText hexadécimal
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

  // Métadonnées /Author, /Title
  const authorMatch = ascii.match(/\/Author\s*\(([^)]+)\)/i);
  if (authorMatch && authorMatch[1] && !authorMatch[1].includes('%')) {
    extractedChunks.unshift(authorMatch[1].trim());
  }

  const titleMatch = ascii.match(/\/Title\s*\(([^)]+)\)/i);
  if (titleMatch && titleMatch[1] && !titleMatch[1].includes('%')) {
    extractedChunks.unshift(titleMatch[1].trim());
  }

  // Extraction des chaînes textuelles dans les parenthèses PDF
  const parenTextRegex = /\(([A-Za-z0-9À-ÿ\s@.,:;+\/'-]{3,120})\)/g;
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

  // Déduplication ordonnée
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
 * Extraction fidèle d'un document DOCX via mammoth (garde les paragraphes et tableaux)
 */
async function extractTextFromDOCXBuffer(buffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    if (result.value && result.value.trim().length > 10) {
      return result.value.trim();
    }
  } catch (err) {
    console.warn('[Mammoth DOCX extraction error]', err);
  }

  // Repli direct : lecture de secours
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const raw = decoder.decode(buffer);
  const clean = raw.replace(/<[^>]+>/g, ' ').replace(/[^\x20-\x7E\u00C0-\u00FF\n\r]/g, ' ');
  return clean.replace(/\s+/g, ' ').trim();
}

/**
 * Analyse et extraction d'un fichier de CV (PDF, DOCX, DOC, TXT)
 */
export async function parseCVFile(
  file: File,
  onProgress?: (progress: number, stepLabel: string) => void
): Promise<ParseResult> {
  const maxBytes = 10 * 1024 * 1024; // 10 Mo
  if (file.size > maxBytes) {
    throw new Error('Le fichier est trop volumineux. La taille maximale autorisée est de 10 Mo.');
  }

  const nameLower = file.name.toLowerCase();
  const isPDF = file.type === 'application/pdf' || nameLower.endsWith('.pdf');
  const isDOCX = nameLower.endsWith('.docx') || file.type.includes('wordprocessingml');
  const isDOC = nameLower.endsWith('.doc') || file.type.includes('msword');
  const isTXT = file.type === 'text/plain' || nameLower.endsWith('.txt');

  if (!isPDF && !isDOCX && !isDOC && !isTXT) {
    throw new Error('Format de fichier non pris en charge. Veuillez fournir un fichier PDF, DOCX, DOC ou TXT.');
  }

  onProgress?.(15, 'Lecture du document...');

  const base64Data = await fileToBase64(file);
  const pureBase64 = base64Data.split(',')[1] || base64Data;

  // --- ÉTAPE 1 : EXTRACTION TEXTUELLE DE HAUTE FIDÉLITÉ (SERVEUR / LOCAL) ---
  let extractedRawText = '';
  try {
    onProgress?.(30, 'Extraction textuelle de haute fidélité...');
    const extractRes = await fetch('/api/cv/extract-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileBase64: pureBase64,
        mimeType: file.type || (isPDF ? 'application/pdf' : 'text/plain'),
        fileName: file.name
      })
    });
    if (extractRes.ok) {
      const extJson = await extractRes.json();
      if (extJson.success && extJson.text && extJson.text.trim().length > 10) {
        extractedRawText = extJson.text.trim();
      }
    }
  } catch (extErr) {
    console.warn('Extraction serveur non disponible, bascule locale:', extErr);
  }

  // Repli local si échec réseau
  if (!extractedRawText) {
    if (isDOCX || isDOC) {
      onProgress?.(35, 'Extraction structurée du fichier Word...');
      const buffer = await file.arrayBuffer();
      extractedRawText = await extractTextFromDOCXBuffer(buffer);
    } else if (isTXT) {
      onProgress?.(35, 'Lecture du texte...');
      extractedRawText = await file.text();
    } else if (isPDF) {
      onProgress?.(35, 'Décodage des couches textuelles du PDF...');
      const buffer = await file.arrayBuffer();
      extractedRawText = extractCleanTextFromPDFBuffer(buffer);
    }
  }

  onProgress?.(55, 'Analyse et classification intelligente des rubriques...');

  // --- ÉTAPE 2 : ESSAI VIA LE SERVEUR GEMINI API ---
  try {
    const payload: any = {
      fileBase64: pureBase64,
      mimeType: file.type || (isPDF ? 'application/pdf' : 'text/plain'),
      fileName: file.name,
      rawText: extractedRawText
    };

    const res = await fetch('/api/cv/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.personalInfo) {
        onProgress?.(95, 'Finalisation des rubriques...');
        const aiResult = buildCVFromAIData(json.data, file.name);
        if (extractedRawText) {
          aiResult.extractedRawText = extractedRawText;
        }
        return aiResult;
      } else if (json.rawText && json.rawText.length > extractedRawText.length) {
        extractedRawText = json.rawText;
      }
    }
  } catch (apiErr) {
    console.warn("API serveur Gemini non disponible ou en erreur, bascule vers l'analyse heuristique:", apiErr);
  }

  // --- ÉTAPE 3 : ANALYSE HEURISTIQUE AVANCÉE AVEC RECONNAISSANCE D'ALIAS ---
  onProgress?.(85, 'Extraction experte des rubriques...');
  return parseCVText(extractedRawText || file.name);
}

/**
 * Analyse heuristique avancée d'un texte brut de CV adaptée au marché béninois
 */
export function parseCVText(rawText: string): ParseResult {
  const warnings: string[] = [];
  const detectedFields: string[] = [];
  const missingFields: string[] = [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => {
      if (l.length < 2) return false;
      if (l.startsWith('%PDF') || l.includes('obj') || l.includes('<<') || l.includes('>>') || l.includes('stream')) {
        return false;
      }
      if (/^--\s*\d+\s*of\s*\d+\s*--$/i.test(l)) return false;
      if (/^Je certifie vraies|^Faits [àa]|^Signature/i.test(l)) return false;
      return true;
    });

  // 1. Email
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = rawText.match(emailRegex);
  const email = emailMatch ? sanitizeCleanString(emailMatch[1], 80) : '';
  if (email) detectedFields.push('Email');
  else missingFields.push('Email');

  // 2. Téléphone (avec détection prioritaire de l'étiquette Téléphone / Tél)
  const phoneLabeled = rawText.match(/(?:T[ée]l[ée]phone|T[ée]l|Contact|Num[ée]ro)\s*[:\-]\s*([0-9\s/+-]{8,35})/i);
  let phone = phoneLabeled ? sanitizeCleanString(phoneLabeled[1].trim(), 35) : '';
  if (!phone) {
    const phoneRegex = /(\+?229[\s.-]?)?([0-9]{2}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2})/i;
    const phoneMatch = rawText.match(phoneRegex);
    phone = phoneMatch ? sanitizeCleanString(phoneMatch[0], 30) : '';
  }
  if (phone) detectedFields.push('Téléphone');
  else missingFields.push('Téléphone');

  // 3. Liens professionnels (LinkedIn, GitHub, Portfolio)
  const linkedInMatch = rawText.match(/(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i);
  const linkedIn = linkedInMatch ? `https://${linkedInMatch[1]}` : '';
  if (linkedIn) detectedFields.push('LinkedIn');

  const websiteMatch = rawText.match(/((?:https?:\/\/)?(?:github\.com\/[a-zA-Z0-9_-]+|[a-zA-Z0-9.-]+\.(?:bj|com|org|net|dev|io)\/[a-zA-Z0-9._/-]*))/i);
  const website = websiteMatch ? websiteMatch[1] : '';
  if (website) detectedFields.push('Site web / GitHub');

  // 4. Adresse
  const addrMatch = rawText.match(/Adresse\s*[:\-]\s*([^\n\r]+)/i);
  const address = addrMatch ? sanitizeCleanString(addrMatch[1].trim(), 100) : '';
  if (address) detectedFields.push('Adresse');

  // 5. Ville au Bénin (comptage par fréquence d'apparition)
  let city = 'Cotonou';
  let foundCity = false;
  let maxCityCount = 0;
  for (const c of BENIN_CITIES) {
    const matches = rawText.match(new RegExp(`\\b${c}\\b`, 'gi'));
    if (matches && matches.length > maxCityCount) {
      maxCityCount = matches.length;
      city = c;
      foundCity = true;
    }
  }
  if (foundCity) detectedFields.push('Ville de résidence');

  // 6. Nom et Prénom
  let firstName = '';
  let lastName = '';

  // A. Détection prioritaire par étiquettes explicites (Nom : ..., Prénoms : ...)
  const nomLabeled = rawText.match(/(?:^|\n|\r)\s*(?:Nom\s*(?:de\s*famille)?|Nom\s*et\s*pr[ée]noms?)\s*[:\-]\s*([A-Za-zÀ-ÿ\s.'-]+?)(?=\s*(?:Pr[ée]noms?|Date|Sexe|Nationalit[ée]|Situation|Adresse|\n|\r|$))/i);
  const prenomLabeled = rawText.match(/(?:^|\n|\r|\s)\s*Pr[ée]noms?\s*[:\-]\s*([A-Za-zÀ-ÿ\s.'-]+?)(?=\s*(?:Date|Sexe|Nationalit[ée]|Situation|Adresse|T[ée]l[ée]phone|E-?mail|\n|\r|$))/i);

  if (nomLabeled && nomLabeled[1].trim() && prenomLabeled && prenomLabeled[1].trim()) {
    lastName = sanitizeHumanName(nomLabeled[1].trim());
    firstName = sanitizeHumanName(prenomLabeled[1].trim());
    if (firstName && lastName) {
      detectedFields.push('Nom et prénom');
    }
  }

  // B. Fallback : balayage des premières lignes si pas d'étiquette explicite
  if (!firstName || !lastName) {
    for (const line of lines.slice(0, 10)) {
      const candidate = line.replace(/curriculum\s+vitae|curriculum\s+vitea|etat\s+civil|cv|resume/gi, '').trim();
      if (
        !candidate.includes('@') &&
        !candidate.match(/[0-9]{4,}/) &&
        candidate.length > 3 &&
        candidate.length < 50
      ) {
        const parts = candidate.split(/\s+/);
        if (parts.length >= 2 && parts.length <= 4) {
          const fn = sanitizeHumanName(parts[0]);
          const ln = sanitizeHumanName(parts.slice(1).join(' '));
          if (fn && ln) {
            firstName = fn;
            lastName = ln;
            detectedFields.push('Nom et prénom');
            break;
          }
        }
      }
    }
  }
  if (!firstName && !lastName) {
    missingFields.push('Nom et prénom');
  }

  // 7. Titre professionnel
  let jobTitle = '';
  const specialiteMatch = rawText.match(/Sp[ée]cialit[ée](?:\s*du\s*Dipl[ôo]me)?\s*[:\-]\s*([^\n\r]+)/i);
  const licenceMatch = rawText.match(/(?:Attestation\s+de\s+)?Licence\s+en\s+([^\n\r]+?)(?:\s+[àa]\s+|$)/i);

  if (specialiteMatch && specialiteMatch[1].trim()) {
    jobTitle = sanitizeCleanString(specialiteMatch[1].trim(), 80);
    detectedFields.push('Titre professionnel');
  } else if (licenceMatch && licenceMatch[1].trim()) {
    jobTitle = sanitizeCleanString(`Spécialiste en ${licenceMatch[1].trim()}`, 80);
    detectedFields.push('Titre professionnel');
  } else {
    const titleKeywords = [
      'ingénieur',
      'développeur',
      'technicien',
      'comptable',
      'commercial',
      'assistant',
      'secrétaire',
      'directeur',
      'responsable',
      'consultant',
      'manager',
      'juriste',
      'étudiant',
      'stagiaire',
      'analyste',
      'administrateur',
      'chef de projet',
      'coordonnateur'
    ];
    for (const line of lines.slice(0, 15)) {
      if (
        line.length > 4 &&
        line.length < 75 &&
        !line.includes('@') &&
        !line.match(/[0-9]{4,}/) &&
        line !== `${firstName} ${lastName}`
      ) {
        if (titleKeywords.some((k) => new RegExp(`\\b${k}`, 'i').test(line))) {
          jobTitle = sanitizeCleanString(line, 80);
          detectedFields.push('Titre professionnel');
          break;
        }
      }
    }
  }
  if (!jobTitle) {
    missingFields.push('Titre professionnel');
  }

  // 8. Détection des blocs de rubriques par alias
  const sectionsContent: Record<string, string[]> = {
    summary: [],
    experiences: [],
    educations: [],
    skills: [],
    languages: [],
    certifications: [],
    projects: [],
    stages: [],
    references: [],
    hobbies: []
  };

  let currentSection: string | null = null;

  for (const line of lines) {
    const norm = normalizeHeader(line);
    let matchedSection: string | null = null;

    // Vérifier si la ligne correspond à un titre de section
    for (const [secKey, aliases] of Object.entries(SECTION_ALIASES)) {
      if (aliases.some((alias) => norm === alias || (norm.startsWith(alias) && norm.length < alias.length + 15))) {
        matchedSection = secKey;
        break;
      }
    }

    if (matchedSection) {
      currentSection = matchedSection;
      continue;
    }

    if (currentSection && sectionsContent[currentSection]) {
      sectionsContent[currentSection].push(line);
    }
  }

  // Fonction helper pour fusionner les lignes de continuation (puces et sauts de ligne)
  function joinBulletLines(items: string[]): string[] {
    const res: string[] = [];
    for (const l of items) {
      const isBullet = /^[\s•\-\*o\d]/.test(l) || /(19\d\d|20\d\d)/.test(l);
      if (isBullet || res.length === 0) {
        res.push(l.replace(/^[\s•\-\*o\t]+/, '').trim());
      } else {
        res[res.length - 1] += ' ' + l.trim();
      }
    }
    return res;
  }

  // Traitement du résumé
  let profileSummary = '';
  if (sectionsContent.summary.length > 0) {
    profileSummary = sectionsContent.summary.slice(0, 4).join(' ').trim();
    if (profileSummary.length > 20) {
      detectedFields.push('Profil & Résumé');
    }
  }

  // Traitement des expériences
  const experiences: Experience[] = [];
  const rawExpPool = [...sectionsContent.experiences, ...sectionsContent.stages];

  if (rawExpPool.length > 0) {
    const expItems = joinBulletLines(rawExpPool);
    for (const item of expItems) {
      if (item.length < 8) continue;

      // Détection des dates en mois ou années (ex: Juillet 2019 à Aout 2019 ou 2023 - 2024)
      const monthYearRegex = /^([A-Za-zÀ-ÿ]+(?:\s+\d{4})?|\d{4})\s+[àa\-–]\s*([A-Za-zÀ-ÿ]+(?:\s+\d{4})?|\d{4}|pr[ée]sent|en cours)?\s*(.*)/i;
      const m = item.match(monthYearRegex);

      let startDate = '2023';
      let endDate = '';
      let rest = item;

      if (m) {
        startDate = m[1].trim();
        endDate = m[2] ? m[2].trim() : '';
        rest = m[3] ? m[3].trim() : item;
      }

      // Recherche entreprise et ville
      let role = 'Stagiaire en Informatique';
      let company = 'Entreprise au Bénin';
      let expCity = city;

      const compMatch = rest.match(/(?:dans\s+(?:la\s+)?(?:Soci[ée]t[ée]|l'Entreprise|l'Agence)?\s*)([A-Z0-9\s()&.-]+?)(?:\s+[àa]\s+([A-Za-zÀ-ÿ\s-]+)|$)/i);
      if (compMatch) {
        company = compMatch[1].trim();
        if (compMatch[2]) {
          expCity = compMatch[2].trim();
        }
      }

      if (/commercial|vente/i.test(rest)) role = 'Commercial';
      else if (/comptab/i.test(rest)) role = 'Comptable';
      else if (/d[ée]velopp/i.test(rest)) role = 'Développeur';
      else if (/technicien|maintenance/i.test(rest)) role = 'Technicien de Maintenance';
      else if (/stage/i.test(rest)) role = 'Stagiaire';

      experiences.push({
        id: `exp_h_${Date.now()}_${experiences.length}`,
        role,
        company,
        city: expCity,
        country: 'Bénin',
        startDate,
        endDate,
        current: /pr[ée]sent|en cours|actuel/i.test(endDate),
        description: rest,
        achievements: []
      });
    }
    if (experiences.length > 0) {
      detectedFields.push(`Expériences (${experiences.length})`);
    }
  }

  // Traitement des formations
  const educations: Education[] = [];
  if (sectionsContent.educations.length > 0) {
    const eduItems = joinBulletLines(sectionsContent.educations);
    for (const item of eduItems) {
      if (item.length < 5) continue;
      if (/^Option du Dipl[ôo]me|^Sp[ée]cialit[ée] du Dipl[ôo]me/i.test(item)) continue;

      const dateMatch = item.match(/(?:^|\s)(20[0-2][0-9]|19[89][0-9])\s*(?:[-–/aà]\s*(20[0-2][0-9]|présent|en cours|actuel)?)?/i);
      const startDate = dateMatch && dateMatch[1] ? dateMatch[1] : '';
      const endDate = dateMatch && dateMatch[2] ? dateMatch[2] : (startDate ? startDate : '');

      let cleaned = item.replace(/^(?:20[0-2][0-9]|19[89][0-9])\s*(?:[-–/aà]\s*(?:20[0-2][0-9]|présent|en cours|actuel)?)?\s*[:\-–]\s*/i, '').trim();

      let degree = cleaned;
      let institution = 'Établissement au Bénin';
      let eduCity = city;

      const splitInst = cleaned.split(/\s+(?:[àa]|au|chez|dans|par)\s+(?:l[’']|l[e|a]\s+)?/i);
      if (splitInst.length >= 2) {
        degree = splitInst[0].trim();
        institution = splitInst.slice(1).join(' ').trim();
      }

      for (const bc of BENIN_CITIES) {
        if (new RegExp(`\\b${bc}\\b`, 'i').test(institution)) {
          eduCity = bc;
          break;
        }
      }

      if (degree.length >= 3) {
        educations.push({
          id: `edu_h_${Date.now()}_${educations.length}`,
          degree,
          institution,
          city: eduCity,
          country: 'Bénin',
          startDate,
          endDate,
          current: false,
          description: ''
        });
      }
    }
    if (educations.length > 0) {
      detectedFields.push(`Formations (${educations.length})`);
    }
  }

  // Traitement des compétences
  const skills: Skill[] = [];
  if (sectionsContent.skills.length > 0) {
    const rawSkillItems = joinBulletLines(sectionsContent.skills);
    for (const item of rawSkillItems) {
      // Détection des listes de logiciels entre parenthèses
      const parenToolsMatch = item.match(/\(([^)]+)\)/);
      if (parenToolsMatch) {
        const tools = parenToolsMatch[1]
          .split(/[,;/+]/)
          .map((t) => t.replace(/et\s+bien\s+d’autres|et\s+autres/gi, '').trim())
          .filter((t) => t.length > 1 && t.length < 35);

        for (const tool of tools) {
          skills.push({
            id: `sk_h_${Date.now()}_${skills.length}`,
            name: tool,
            category: 'dev_web',
            level: 4
          });
        }
      }

      // Ajout de la compétence principale nettoyée
      const cleanName = item
        .replace(/^Ma[îi]trise\s+(?:tr[èe]s\s+bien\s+)?(?:l[’']|de\s+|des\s+|du\s+)?/i, '')
        .replace(/\(.*?\)/g, '')
        .trim();

      if (cleanName.length > 2 && cleanName.length < 50) {
        skills.push({
          id: `sk_h_${Date.now()}_${skills.length}`,
          name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          category: 'informatique',
          level: 4
        });
      }
    }
    if (skills.length > 0) {
      detectedFields.push(`Compétences (${skills.length})`);
    }
  }

  // Traitement des langues
  const languages: Language[] = [];
  if (sectionsContent.languages.length > 0) {
    const langLines = joinBulletLines(sectionsContent.languages);
    for (const l of langLines) {
      const parts = l.split(/[:\-–]/);
      const langName = parts[0].replace(/^[\s•\-\*o\t]+/, '').trim();
      const levelStr = (parts[1] || '').toLowerCase();

      let level: Language['level'] = 'courant';
      if (/maternelle|natif/i.test(levelStr)) level = 'maternelle';
      else if (/tr[èe]s\s+bien|bilingue|courant|fluide/i.test(levelStr)) level = 'courant';
      else if (/bien|professionnel/i.test(levelStr)) level = 'professionnel';
      else if (/passable|moyen|interm/i.test(levelStr)) level = 'intermediaire';
      else if (/notion|d[ée]butant/i.test(levelStr)) level = 'notions';

      if (langName.length > 1 && langName.length < 30) {
        languages.push({
          id: `lang_h_${Date.now()}_${languages.length}`,
          name: langName,
          level
        });
      }
    }
    if (languages.length > 0) {
      detectedFields.push(`Langues (${languages.length})`);
    }
  }

  // Sections additionnelles
  const customSections: CustomSection[] = [];
  if (sectionsContent.certifications.length > 0) {
    customSections.push({
      id: `sec_cert_${Date.now()}`,
      title: 'Certifications',
      type: 'certifications',
      enabled: true,
      items: sectionsContent.certifications.slice(0, 5).map((c, i) => ({
        id: `cert_${Date.now()}_${i}`,
        title: c
      }))
    });
    detectedFields.push('Certifications');
  }

  if (sectionsContent.hobbies.length > 0) {
    const hobbyItems = joinBulletLines(sectionsContent.hobbies);
    const cleanHobbies = hobbyItems
      .filter((h) => !/Signature|Je certifie|Faits [àa]|-- \d/i.test(h) && h.length > 2 && h.length < 40);

    if (cleanHobbies.length > 0) {
      customSections.push({
        id: `sec_hob_${Date.now()}`,
        title: "Centres d'intérêt",
        type: 'loisirs',
        enabled: true,
        items: cleanHobbies.map((h, i) => ({
          id: `hob_${Date.now()}_${i}`,
          title: h
        }))
      });
      detectedFields.push("Centres d'intérêt");
    }
  }

  const baseCV = JSON.parse(JSON.stringify(INITIAL_DEMO_CV)) as CVData;
  const candidateName = `${firstName || ''} ${lastName || ''}`.trim() || 'Candidat';

  const finalCV: CVData = {
    ...baseCV,
    id: `cv_${Date.now()}`,
    title: `CV - ${candidateName}`.trim(),
    personalInfo: {
      ...baseCV.personalInfo,
      firstName: firstName || '',
      lastName: lastName || '',
      jobTitle: jobTitle || '',
      email: email || '',
      phone: phone || '',
      city: foundCity ? city : 'Cotonou',
      country: 'Bénin',
      address,
      linkedIn,
      website
    },
    profileSummary,
    experiences: experiences.length > 0 ? experiences : [],
    educations: educations.length > 0 ? educations : [],
    skills: skills.length > 0 ? skills : [],
    languages: languages.length > 0 ? languages : [{ id: 'lang_1', name: 'Français', level: 'courant' }],
    customSections
  };

  if (detectedFields.length === 0) {
    warnings.push("Peu de champs ont été formellement identifiés. Vous pourrez saisir ou ajuster chaque information dans l'écran de vérification.");
  }

  return {
    success: true,
    cvData: finalCV,
    extractedRawText: rawText.slice(0, 3000),
    detectedFields,
    warnings,
    missingFields,
    isAI: false
  };
}
