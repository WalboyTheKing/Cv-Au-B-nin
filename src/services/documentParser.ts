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
  const str = val.trim();
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
 * Extraction instantanée des métadonnées CV structurées intégrées lors de l'export sur CV Pro Bénin
 */
export function tryExtractEmbeddedCVData(rawInput: string | ArrayBuffer): CVData | null {
  try {
    let text = '';
    if (typeof rawInput === 'string') {
      text = rawInput;
    } else {
      const bytes = new Uint8Array(rawInput);
      let ascii = '';
      for (let i = 0; i < Math.min(bytes.length, 600000); i++) {
        const b = bytes[i];
        if (b >= 32 && b <= 126) ascii += String.fromCharCode(b);
        else ascii += ' ';
      }
      text = ascii;
    }

    // 1. Format Base64 robuste (sans problème de parenthèses ou de caractères spéciaux)
    const matchB64 = text.match(/CVPRO_B64:([A-Za-z0-9+/=]+)/);
    if (matchB64 && matchB64[1]) {
      try {
        const b64 = matchB64[1].trim();
        const jsonStr = typeof window !== 'undefined' && window.atob
          ? decodeURIComponent(escape(window.atob(b64)))
          : Buffer.from(b64, 'base64').toString('utf-8');
        const parsed = JSON.parse(jsonStr);
        if (parsed && (parsed.personalInfo || parsed.id)) {
          return parsed as CVData;
        }
      } catch (b64Err) {
        console.warn('Erreur décodage base64:', b64Err);
      }
    }

    // 2. Format URI Component historique
    const match = text.match(/CVPRO_DATA_JSON:([A-Za-z0-9%._~-]+)/);
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]);
      const parsed = JSON.parse(decoded);
      if (parsed && (parsed.personalInfo || parsed.id)) {
        return parsed as CVData;
      }
    }
  } catch (e) {
    console.warn('Erreur lecture métadonnées CV intégrées:', e);
  }
  return null;
}

/**
 * Normalisation des rubriques avec prise en compte des variantes lexicales et numérotées
 */
export const SECTION_ALIASES: Record<string, string[]> = {
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
    'formations academiques',
    'formations académiques',
    'formation academique diplomes',
    'formation academique diplome',
    'formations academiques diplomes',
    'formation academique et diplomes',
    'formations academiques et diplomes',
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
    'a propos',
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
    'stages academiques'
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
  ],
  contact: [
    'contact',
    'contacts',
    'coordonnees',
    'coordonnées',
    'etat civil',
    'état civil',
    'renseignements personnels'
  ]
};

function cleanHeaderCandidate(raw: string): string {
  let s = raw.trim();
  // Strip leading symbols and parenthesized single character or icon noise: e.g. (D), (C), (D , ®, ©, &, +, •
  s = s.replace(/^[(\[{<][a-zA-Z0-9]{1,2}[)\]}>]?\s*/, '');
  s = s.replace(/^[®©&•\-\*o~|+<>–—»«]+\s*/, '');
  s = s.replace(/^[a-zA-Z0-9][)\]}\-–:.]+\s*/, '');
  s = s.replace(/^[a-zA-Z]\s+(?=[A-ZÀ-Ý])/i, '');
  return s;
}

function normalizeHeader(text: string): string {
  const stripped = cleanHeaderCandidate(text)
    .replace(/^[\s•\-\*o\d]+[.)\-–\s:]+/i, '')
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
 * Construit un objet ParseResult complet à partir d'un CV réimporté avec métadonnées intactes
 */
function buildResultFromFullCV(cv: CVData, sourceName: string): ParseResult {
  const detectedFields: string[] = [];
  if (cv.personalInfo.firstName || cv.personalInfo.lastName) detectedFields.push('Nom et prénom');
  if (cv.personalInfo.email) detectedFields.push('Email');
  if (cv.personalInfo.phone) detectedFields.push('Téléphone');
  if (cv.personalInfo.jobTitle) detectedFields.push('Titre professionnel');
  if (cv.personalInfo.city) detectedFields.push('Ville de résidence');
  if (cv.profileSummary) detectedFields.push('Profil & Résumé');
  if (cv.experiences && cv.experiences.length > 0) detectedFields.push(`Expériences professionnelles (${cv.experiences.length})`);
  if (cv.educations && cv.educations.length > 0) detectedFields.push(`Formations académiques (${cv.educations.length})`);
  if (cv.skills && cv.skills.length > 0) detectedFields.push(`Compétences (${cv.skills.length})`);
  if (cv.languages && cv.languages.length > 0) detectedFields.push(`Langues (${cv.languages.length})`);

  return {
    success: true,
    cvData: cv,
    extractedRawText: `Document d'origine CV Pro Bénin : ${sourceName}`,
    detectedFields,
    warnings: [],
    missingFields: [],
    isAI: true
  };
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
  const cleanPhone = sanitizeCleanString(pi.phone, 40);
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

  // Sections personnalisées
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
 * Extraction d'un document DOCX via mammoth
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

  const arrayBuf = await file.arrayBuffer();

  // --- ÉTAPE 0 : VÉRIFICATION MÉTHODE 100% FIDÈLE (MÉTADONNÉES CV PRO BÉNIN INTÉGRÉES) ---
  const embeddedCV = tryExtractEmbeddedCVData(arrayBuf);
  if (embeddedCV) {
    onProgress?.(100, 'CV Pro Bénin reconnu avec fidélité absolue (100%) !');
    return buildResultFromFullCV(embeddedCV, file.name);
  }

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
      extractedRawText = await extractTextFromDOCXBuffer(arrayBuf);
    } else if (isTXT) {
      onProgress?.(35, 'Lecture du texte...');
      extractedRawText = await file.text();
    } else if (isPDF) {
      onProgress?.(35, 'Décodage des couches textuelles du PDF...');
      extractedRawText = extractCleanTextFromPDFBuffer(arrayBuf);
    }
  }

  // Si le texte extrait contient la signature métadonnée
  if (extractedRawText) {
    const embeddedInText = tryExtractEmbeddedCVData(extractedRawText);
    if (embeddedInText) {
      onProgress?.(100, 'CV Pro Bénin reconnu avec fidélité absolue !');
      return buildResultFromFullCV(embeddedInText, file.name);
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
      if (json.success && json.data && (json.data.personalInfo || json.data.experiences)) {
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
    console.warn("API serveur Gemini non disponible ou en erreur, bascule vers l'analyse experte:", apiErr);
  }

  // --- ÉTAPE 3 : ANALYSE HEURISTIQUE AVANCÉE INFAILLIBLE ---
  onProgress?.(85, 'Extraction experte des rubriques...');
  return parseCVText(extractedRawText || file.name);
}

const MONTHS_PATTERN = '(?:Janvier|F[ée]vrier|Mars|Avril|Mai|Juin|Juillet|Ao[uû]t|Septembre|Octobre|Novembre|D[ée]cembre|Jan|F[ée]v|Mar|Avr|Mai|Juin|Juil|Ao[uû]|Sep|Oct|Nov|D[ée]c)';
const isDateRangeRegex = new RegExp(`^(?:${MONTHS_PATTERN}\\s*\\d{4}|\\d{4})\\s*[-–àa]\\s*(?:${MONTHS_PATTERN}\\s*\\d{4}|\\d{4}|pr[ée]sent|en cours|actuel)$`, 'i');

/**
 * Analyse heuristique avancée d'un texte brut de CV adaptée au marché béninois
 */
export function parseCVText(rawText: string): ParseResult {
  const warnings: string[] = [];
  const detectedFields: string[] = [];
  const missingFields: string[] = [];

  // Vérifier d'abord si le texte contient les métadonnées JSON intégrées de CV Pro Bénin
  const embeddedInText = tryExtractEmbeddedCVData(rawText);
  if (embeddedInText) {
    return buildResultFromFullCV(embeddedInText, 'Texte copié CV Pro Bénin');
  }

  // Nettoyage préalable des ruptures de lignes pour liens coupés par OCR
  const normalizedRaw = rawText
    .replace(/(linkedin\.com\/in\/[a-zA-Z0-9_-]+)-\s*\r?\n\s*([a-zA-Z0-9_/-]+)/gi, '$1$2')
    .replace(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})\s*\r?\n\s*([a-zA-Z0-9_/-]+)/gi, '$1/$2');

  const lines = normalizedRaw
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
  const emailMatch = normalizedRaw.match(emailRegex);
  const email = emailMatch ? sanitizeCleanString(emailMatch[1], 80) : '';
  if (email) detectedFields.push('Email');
  else missingFields.push('Email');

  // 2. Téléphone (avec détection prioritaire de l'étiquette Téléphone / Tél et numéros béninois 8 ou 10 chiffres)
  const phoneLabeled = normalizedRaw.match(/(?:T[ée]l[ée]phone|T[ée]l|Contact|Num[ée]ro|[&☎📞📱])\s*[:\-]?\s*([+0-9\s/.-]{8,45})/i);
  let phone = phoneLabeled ? sanitizeCleanString(phoneLabeled[1].trim(), 40) : '';
  if (!phone) {
    const phoneRegex = /(\+?229[\s.-]?)?(01[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}|[0-9]{2}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}(?:[\s.-]?[0-9]{2})?)/i;
    const phoneMatch = normalizedRaw.match(phoneRegex);
    phone = phoneMatch ? sanitizeCleanString(phoneMatch[0], 40) : '';
  }
  if (phone) {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length === 10 && digitsOnly.startsWith('01')) {
      phone = `${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 4)} ${digitsOnly.slice(4, 6)} ${digitsOnly.slice(6, 8)} ${digitsOnly.slice(8, 10)}`;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('229')) {
      phone = `+229 ${digitsOnly.slice(3, 5)} ${digitsOnly.slice(5, 7)} ${digitsOnly.slice(7, 9)} ${digitsOnly.slice(9, 11)} ${digitsOnly.slice(11, 13)}`;
    }
    detectedFields.push('Téléphone');
  } else {
    missingFields.push('Téléphone');
  }

  // 3. Liens professionnels (LinkedIn, GitHub, Portfolio)
  let linkedIn = '';
  const lMatch = normalizedRaw.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  if (lMatch) {
    let slug = lMatch[1];
    const afterMatch = normalizedRaw.slice(normalizedRaw.indexOf(lMatch[0]) + lMatch[0].length);
    const nextLineCont = afterMatch.match(/^\s*(?:[^a-zA-Z0-9\n]*[a-zA-Z]?®?\s*)?([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]*)*)/);
    if (nextLineCont && nextLineCont[1] && !/^(COMPETENCES|LANGUES|CONTACT|FORMATIONS)/i.test(nextLineCont[1])) {
      slug += nextLineCont[1];
    }
    linkedIn = `https://www.linkedin.com/in/${slug}`;
  }
  if (linkedIn) detectedFields.push('LinkedIn');

  const siteMatches = Array.from(normalizedRaw.matchAll(/(?:^|[\s@])([a-zA-Z0-9.-]+\.(?:bj|gd|com|org|net|dev|io|app|me)(?:\/[a-zA-Z0-9._/-]*)?)/gi));
  let website = '';
  for (const m of siteMatches) {
    const candidate = m[1].replace(/\/+$/, '');
    if (!candidate.includes('linkedin.com') && !candidate.includes('gmail.com') && !candidate.includes('yahoo.') && !candidate.includes('cvprobenin')) {
      website = candidate.startsWith('http') ? candidate : `https://${candidate}`;
      break;
    }
  }
  if (website) detectedFields.push('Site web / Portfolio');

  // 4. Ville au Bénin (comptage par fréquence d'apparition)
  let city = 'Cotonou';
  let foundCity = false;
  let maxCityCount = 0;
  for (const c of BENIN_CITIES) {
    const matches = normalizedRaw.match(new RegExp(`\\b${c}\\b`, 'gi'));
    if (matches && matches.length > maxCityCount) {
      maxCityCount = matches.length;
      city = c;
      foundCity = true;
    }
  }
  if (foundCity) detectedFields.push('Ville de résidence');

  // 5. Adresse
  let address = '';
  const addrMatch = normalizedRaw.match(/Adresse\s*[:\-]\s*([^\n\r]+)/i);
  if (addrMatch) {
    address = sanitizeCleanString(addrMatch[1].trim(), 100);
  } else {
    for (const l of lines.slice(0, 20)) {
      if (/^(?:Maison|Quartier|Carr[ée]|Lot|Rue|Zone)\s+[A-Za-z0-9À-ÿ\s.-]+/i.test(l)) {
        address = sanitizeCleanString(l, 100);
        break;
      }
    }
  }
  if (address) detectedFields.push('Adresse');

  // 6. Mots-clés de bruit et étiquettes UI à ignorer pour l'identification de nom
  const IGNORED_NAME_WORDS = [
    'curriculum', 'vitae', 'curriculum vitea', 'etat civil', 'état civil',
    'contact', 'contacts', 'coordonnees', 'coordonnées', 'whatsapp', 'whatsapp direct',
    'candidat', 'candidat actif', 'imprimer', 'telecharger', 'télécharger',
    'enregistre', 'enregistré', 'benin', 'bénin', 'france', 'afrique',
    'maison', 'quartier', 'rue', 'carre', 'carré', 'lot', 'telephone', 'téléphone',
    'email', 'e-mail', 'ville', 'adresse', 'active', 'menu', 'connexion', 'inscription'
  ];

  function isIgnoredNameCandidate(str: string): boolean {
    const norm = normalizeHeader(str);
    if (norm.length < 3) return true;
    return IGNORED_NAME_WORDS.some((w) => norm === w || norm.startsWith(w + ' '));
  }

  function cleanCandidateNameLine(line: string): string {
    let s = line.trim();
    s = s.replace(/^[\\\/©®&•\-\*o~|+<>–—»«\s]+/g, '');
    s = s.replace(/\b([a-z])([A-ZÀ-Ý][a-zà-ÿ]+)\b/g, '$2');
    return s.trim();
  }

  // 7. Détection du Nom et Prénom & Titre professionnel
  let firstName = '';
  let lastName = '';
  let jobTitle = '';

  // A. Détection prioritaire par étiquettes explicites (Nom : ..., Prénoms : ...)
  const nomLabeled = normalizedRaw.match(/(?:^|\n|\r)\s*(?:Nom\s*(?:de\s*famille)?|Nom\s*et\s*pr[ée]noms?)\s*[:\-]\s*([A-Za-zÀ-ÿ\s.'-]+?)(?=\s*(?:Pr[ée]noms?|Date|Sexe|Nationalit[ée]|Situation|Adresse|\n|\r|$))/i);
  const prenomLabeled = normalizedRaw.match(/(?:^|\n|\r|\s)\s*Pr[ée]noms?\s*[:\-]\s*([A-Za-zÀ-ÿ\s.'-]+?)(?=\s*(?:Date|Sexe|Nationalit[ée]|Situation|Adresse|T[ée]l[ée]phone|E-?mail|\n|\r|$))/i);

  if (nomLabeled && nomLabeled[1].trim() && prenomLabeled && prenomLabeled[1].trim()) {
    lastName = sanitizeHumanName(nomLabeled[1].trim());
    firstName = sanitizeHumanName(prenomLabeled[1].trim());
  }

  // B. Détection pour les CV avec barre latérale copiée (où Nom + Titre se trouvent juste avant "Profil Professionnel")
  if (!firstName || !lastName) {
    for (let i = 0; i < lines.length; i++) {
      const norm = normalizeHeader(lines[i]);
      if (
        norm === 'profil professionnel' ||
        norm === 'experiences professionnelles' ||
        norm === 'formations academiques' ||
        norm === 'formations et diplomes'
      ) {
        const candidateNameLine = lines[i - 2] && !isIgnoredNameCandidate(lines[i - 2]) ? lines[i - 2] : lines[i - 1];
        const candidateTitleLine = lines[i - 2] && !isIgnoredNameCandidate(lines[i - 2]) ? lines[i - 1] : '';

        if (
          candidateNameLine &&
          !isIgnoredNameCandidate(candidateNameLine) &&
          !candidateNameLine.includes('@') &&
          !/[0-9]{4,}/.test(candidateNameLine)
        ) {
          const cleanedName = cleanCandidateNameLine(candidateNameLine);
          const parts = cleanedName.split(/\s+/);
          if (parts.length >= 2 && parts.length <= 4 && /^[A-Za-zÀ-ÿ\s.'-]+$/.test(cleanedName)) {
            firstName = sanitizeHumanName(parts[0]);
            lastName = sanitizeHumanName(parts.slice(1).join(' '));
            if (candidateTitleLine && !isIgnoredNameCandidate(candidateTitleLine) && !candidateTitleLine.includes('@')) {
              jobTitle = sanitizeCleanString(candidateTitleLine, 80);
            }
            break;
          }
        }
      }
    }
  }

  // C. Balayage des premières lignes si non encore trouvé
  if (!firstName || !lastName) {
    for (let i = 0; i < Math.min(lines.length, 12); i++) {
      const candidate = lines[i];
      if (
        isIgnoredNameCandidate(candidate) ||
        candidate.includes('@') ||
        candidate.match(/[0-9]{4,}/) ||
        candidate.length < 3 ||
        candidate.length > 50
      ) {
        continue;
      }
      const cleanedCandidate = cleanCandidateNameLine(candidate);
      const parts = cleanedCandidate.split(/\s+/);
      if (parts.length >= 2 && parts.length <= 4 && /^[A-Za-zÀ-ÿ\s.'-]+$/.test(cleanedCandidate)) {
        firstName = sanitizeHumanName(parts[0]);
        lastName = sanitizeHumanName(parts.slice(1).join(' '));
        // Ligne suivante candidate pour le titre
        const nextLine = lines[i + 1];
        if (
          nextLine &&
          !isIgnoredNameCandidate(nextLine) &&
          !nextLine.includes('@') &&
          !/[0-9]{4,}/.test(nextLine) &&
          nextLine.length > 3 &&
          nextLine.length < 75
        ) {
          jobTitle = sanitizeCleanString(nextLine, 80);
        }
        break;
      }
    }
  }

  if (firstName || lastName) {
    detectedFields.push('Nom et prénom');
  } else {
    missingFields.push('Nom et prénom');
  }

  // D. Détection du Titre professionnel si absent
  if (!jobTitle) {
    const specialiteMatch = rawText.match(/Sp[ée]cialit[ée](?:\s*du\s*Dipl[ôo]me)?\s*[:\-]\s*([^\n\r]+)/i);
    const licenceMatch = rawText.match(/(?:Attestation\s+de\s+)?Licence\s+en\s+([^\n\r]+?)(?:\s+[àa]\s+|$)/i);

    if (specialiteMatch && specialiteMatch[1].trim()) {
      jobTitle = sanitizeCleanString(specialiteMatch[1].trim(), 80);
    } else if (licenceMatch && licenceMatch[1].trim()) {
      jobTitle = sanitizeCleanString(`Spécialiste en ${licenceMatch[1].trim()}`, 80);
    } else {
      const titleKeywords = [
        'ingénieur', 'développeur', 'technicien', 'comptable', 'commercial',
        'assistant', 'secrétaire', 'directeur', 'responsable', 'consultant',
        'manager', 'juriste', 'analyste', 'administrateur', 'chef de projet',
        'coordonnateur', 'maintenance', 'informatique', 'système', 'réseau'
      ];
      for (const line of lines.slice(0, 15)) {
        if (
          !isIgnoredNameCandidate(line) &&
          line.length > 4 &&
          line.length < 75 &&
          !line.includes('@') &&
          !line.match(/[0-9]{4,}/) &&
          line !== `${firstName} ${lastName}`
        ) {
          if (titleKeywords.some((k) => new RegExp(`\\b${k}`, 'i').test(line))) {
            jobTitle = sanitizeCleanString(line, 80);
            break;
          }
        }
      }
    }
  }

  if (jobTitle) {
    detectedFields.push('Titre professionnel');
  } else {
    missingFields.push('Titre professionnel');
  }

  // 8. Découpage du document par rubriques
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
    hobbies: [],
    contact: []
  };

  let currentSection: string | null = null;
  const fullNameLower = `${firstName} ${lastName}`.trim().toLowerCase();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const norm = normalizeHeader(line);

    // Si on rencontre le bloc principal du candidat (Nom et Prénom), interrompre la section précédente
    if (
      fullNameLower &&
      (line.toLowerCase().includes(fullNameLower) ||
        (firstName && lastName && line.toLowerCase().includes(firstName.toLowerCase()) && line.toLowerCase().includes(lastName.toLowerCase())))
    ) {
      currentSection = null;
      continue;
    }
    if (jobTitle && line.toLowerCase() === jobTitle.toLowerCase()) {
      currentSection = null;
      continue;
    }

    let matchedSection: string | null = null;
    for (const [secKey, aliases] of Object.entries(SECTION_ALIASES)) {
      if (aliases.some((alias) => norm === alias || (norm.startsWith(alias) && norm.length < alias.length + 14))) {
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

  // 9. Profil & Résumé
  let profileSummary = '';
  if (sectionsContent.summary.length > 0) {
    profileSummary = sectionsContent.summary.slice(0, 5).join(' ').trim();
    if (profileSummary.length > 20) {
      detectedFields.push('Profil & Résumé');
    }
  }

  // 10. Compétences (Ligne par ligne + extraction des outils entre parenthèses)
  const skills: Skill[] = [];
  const rawSkillPool = sectionsContent.skills;
  for (const line of rawSkillPool) {
    const cleanL = line.replace(/^[\s•\-\*o\d.:)\-]+/gi, '').trim();
    if (!cleanL || cleanL.length < 2) continue;

    // Détection des outils logiciels entre parenthèses : (WORD, EXCEL, ...)
    const parenMatch = cleanL.match(/\(([^)]+)\)/);
    if (parenMatch) {
      const tools = parenMatch[1]
        .split(/[,;/+]/)
        .map((t) => t.replace(/et\s+bien\s+d’autres|et\s+autres|etc\./gi, '').trim())
        .filter((t) => t.length > 1 && t.length < 40);

      for (const tool of tools) {
        skills.push({
          id: `sk_h_${Date.now()}_${skills.length}`,
          name: tool,
          category: 'dev_web',
          level: 4
        });
      }
    }

    // Compétence nettoyée sans les parenthèses
    const stripped = cleanL
      .replace(/\(.*?\)/g, '')
      .replace(/^Ma[îi]trise\s+(?:tr[èe]s\s+bien\s+)?(?:l[’']|de\s+|des\s+|du\s+)?/gi, '')
      .replace(/^Bonne\s+connaissance\s+(?:des?|du|d’)?/gi, '')
      .trim();

    if (stripped.includes(',') || stripped.includes(';') || stripped.includes('•')) {
      const subItems = stripped
        .split(/[,;•]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 45);

      for (const s of subItems) {
        skills.push({
          id: `sk_h_${Date.now()}_${skills.length}`,
          name: s.charAt(0).toUpperCase() + s.slice(1),
          category: 'informatique',
          level: 4
        });
      }
    } else if (stripped.length > 1 && stripped.length < 45) {
      skills.push({
        id: `sk_h_${Date.now()}_${skills.length}`,
        name: stripped.charAt(0).toUpperCase() + stripped.slice(1),
        category: 'informatique',
        level: 4
      });
    }
  }

  if (skills.length > 0) {
    detectedFields.push(`Compétences (${skills.length})`);
  }

  // 11. Langues (Prise en compte de "Langue : Niveau" et "Langue" suivi de "Niveau" sur la ligne suivante)
  const languages: Language[] = [];
  const langLines = sectionsContent.languages;
  for (let i = 0; i < langLines.length; i++) {
    const rawLang = langLines[i].replace(/^[\s•\-\*o\d.:)\-]+/gi, '').trim();
    if (!rawLang || rawLang.length < 2) continue;

    let langName = '';
    let levelStr = '';

    if (rawLang.includes(':') || rawLang.includes(' - ')) {
      const parts = rawLang.split(/[:\-]/);
      langName = parts[0].trim();
      levelStr = (parts[1] || '').trim().toLowerCase();
    } else {
      const nextLine = langLines[i + 1]?.trim() || '';
      const isNextLevel = /^(professionnel|courant|interm|notion|matern|biling|bien|passable|fluide|moyen)/i.test(nextLine);
      if (isNextLevel) {
        langName = rawLang;
        levelStr = nextLine.toLowerCase();
        i++; // Sauter la ligne de niveau consommée
      } else if (rawLang.length < 25) {
        langName = rawLang;
        levelStr = 'courant';
      }
    }

    if (langName && langName.length > 1 && langName.length < 35) {
      let level: Language['level'] = 'courant';
      if (/maternelle|natif/i.test(levelStr)) level = 'maternelle';
      else if (/tr[èe]s\s+bien|bilingue|courant|fluide/i.test(levelStr)) level = 'courant';
      else if (/bien|professionnel/i.test(levelStr)) level = 'professionnel';
      else if (/passable|moyen|interm/i.test(levelStr)) level = 'intermediaire';
      else if (/notion|d[ée]butant/i.test(levelStr)) level = 'notions';

      languages.push({
        id: `lang_h_${Date.now()}_${languages.length}`,
        name: langName.charAt(0).toUpperCase() + langName.slice(1),
        level
      });
    }
  }

  if (languages.length > 0) {
    detectedFields.push(`Langues (${languages.length})`);
  }

  function preprocessWrappedLines(rawLines: string[]): string[] {
    const result: string[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      let curr = rawLines[i].trim();
      const wrapMatch = curr.match(/^(.*?)\s*(\b\d{4}\s*[-–])\s*$/);
      if (wrapMatch && i + 1 < rawLines.length) {
        const next = rawLines[i + 1].trim();
        const nextYearMatch = next.match(/^(\d{4}|présent|en cours)\b(.*)$/i) || next.match(/^(.*?)\s*(\d{4})\s*(.*)$/);
        if (nextYearMatch) {
          const beforeDate = (wrapMatch[1] + ' ' + (nextYearMatch[1] && isNaN(Number(nextYearMatch[1])) ? nextYearMatch[1] : '')).trim();
          const endDate = !isNaN(Number(nextYearMatch[1])) ? nextYearMatch[1] : nextYearMatch[2];
          const dateRange = wrapMatch[2] + ' ' + endDate;
          const remainder = nextYearMatch[3] || (!isNaN(Number(nextYearMatch[1])) ? nextYearMatch[2] : '');
          curr = (beforeDate + ' ' + dateRange).trim();
          result.push(curr);
          if (remainder && remainder.trim().length > 3) {
            result.push(remainder.trim());
          }
          i++;
          continue;
        }
      }
      result.push(curr);
    }
    return result;
  }

  // 12. Expériences professionnelles (Support double : Blocs multi-lignes du site & Lignes inline avec puces)
  const experiences: Experience[] = [];
  const rawExpPool = preprocessWrappedLines([...sectionsContent.experiences, ...sectionsContent.stages]);
  let currentExp: Partial<Experience> | null = null;

  const roleAndDateRegex = new RegExp(
    '^(.*?)\\s+((?:(?:' + MONTHS_PATTERN + '\\s*)?\\d{4}|' + MONTHS_PATTERN + ')\\s*[-–]\\s*(?:(?:' + MONTHS_PATTERN + '\\s*)?\\d{4}|' + MONTHS_PATTERN + '|pr[ée]sent|en cours|actuel))$',
    'i'
  );

  const inlineExpRegex = new RegExp(
    '^(?:En\\s+|De\\s+)?((?:(?:' + MONTHS_PATTERN + '\\s*)?\\d{4})|' + MONTHS_PATTERN + '\\s+\\d{4})\\s*(?:[-–]|à|au)\\s*((?:(?:' + MONTHS_PATTERN + '\\s*)?\\d{4})|pr[ée]sent|en cours|actuel)?\\s*[:\\-–]?\\s*(.*)',
    'i'
  );

  for (let i = 0; i < rawExpPool.length; i++) {
    const rawLine = rawExpPool[i];
    const isBullet = /^[\s•\-\*o«»+]/.test(rawLine);
    const cleanLine = rawLine.replace(/^[\s•\-\*o«»+]+/, '').trim();
    if (!cleanLine || cleanLine.length < 2) continue;

    // Bullet point direct attach
    if (isBullet) {
      if (currentExp) {
        if (!currentExp.achievements) currentExp.achievements = [];
        currentExp.achievements.push(cleanLine);
        currentExp.description = currentExp.description ? `${currentExp.description}\n${cleanLine}` : cleanLine;
      }
      continue;
    }

    // A. Rôle et Dates sur la même ligne (ex: "Stagiaire Juillet 2019 - Aout 2019")
    const roleDateM = cleanLine.match(roleAndDateRegex);
    if (roleDateM && roleDateM[1].trim().length >= 2) {
      if (currentExp && (currentExp.role || currentExp.company)) {
        experiences.push(finalizeExp(currentExp, city, experiences.length));
      }
      const dates = roleDateM[2].split(/\s*[-–]\s*|\s+[àa]\s+/);
      currentExp = {
        role: roleDateM[1].trim(),
        company: '',
        city,
        startDate: dates[0]?.trim() || '',
        endDate: dates[1]?.trim() || '',
        current: /présent|en cours|actuel/i.test(roleDateM[2]),
        description: '',
        achievements: []
      };
      continue;
    }

    // B. Détection d'une expérience inline (ex: "Juillet 2019 à Aout 2019 un mois de stage...")
    const inlineMatch = cleanLine.match(inlineExpRegex);
    if (inlineMatch && inlineMatch[3] && inlineMatch[3].trim().length > 8) {
      if (currentExp && (currentExp.role || currentExp.company)) {
        experiences.push(finalizeExp(currentExp, city, experiences.length));
        currentExp = null;
      }
      const sDate = inlineMatch[1].trim();
      const eDate = inlineMatch[2] ? inlineMatch[2].trim() : '';
      const rest = inlineMatch[3].trim();
      let company = 'Entreprise au Bénin';
      let expCity = city;
      let role = 'Stagiaire';

      const compMatch = rest.match(/(?:dans\s+(?:la\s+)?(?:Soci[ée]t[ée]|l'Entreprise|l'Agence)?\s*)([A-Z0-9\s()&.-]+?)(?:\s+[àa]\s+([A-Za-zÀ-ÿ\s-]+)|$)/i);
      if (compMatch) {
        company = compMatch[1].trim();
        if (compMatch[2]) expCity = compMatch[2].trim();
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
        startDate: sDate,
        endDate: eDate,
        current: /pr[ée]sent|en cours|actuel/i.test(eDate),
        description: rest,
        achievements: []
      });
      continue;
    }

    // C. Ligne Entreprise et Ville (ex: "SKY LIGHT COMMUNICATION (SLC) - Parakou" ou "... « Parakou")
    const hasCompanyCity = (cleanLine.includes(' - ') || cleanLine.includes(' « ')) && !isBullet && !isDateRangeRegex.test(cleanLine);
    if (hasCompanyCity && currentExp && !currentExp.company) {
      const parts = cleanLine.split(/[-–«]/);
      currentExp.company = parts[0]?.trim();
      if (parts[1]) {
        currentExp.city = parts[1].replace(/,\s*Bénin/i, '').trim();
      }
      continue;
    }

    // D. Ligne de Dates seule
    const isDateLine = isDateRangeRegex.test(cleanLine);
    if (isDateLine) {
      if (currentExp) {
        const parts = cleanLine.split(/\s*[-–]\s*|\s+[àa]\s+/);
        currentExp.startDate = parts[0]?.trim() || '';
        currentExp.endDate = parts[1]?.trim() || '';
        currentExp.current = /présent|en cours|actuel/i.test(currentExp.endDate || '');
      }
      continue;
    }

    // E. Rôle ou Description / Puce
    if (!currentExp || !currentExp.role) {
      if (currentExp && (currentExp.role || currentExp.company)) {
        experiences.push(finalizeExp(currentExp, city, experiences.length));
      }
      currentExp = { role: cleanLine };
    } else {
      if (isBullet) {
        if (!currentExp.achievements) currentExp.achievements = [];
        currentExp.achievements.push(cleanLine);
      }
      if (!currentExp.company) {
        currentExp.company = cleanLine;
      } else {
        currentExp.description = currentExp.description ? `${currentExp.description}\n${cleanLine}` : cleanLine;
      }
    }
  }

  if (currentExp && (currentExp.role || currentExp.company)) {
    experiences.push(finalizeExp(currentExp, city, experiences.length));
  }

  if (experiences.length > 0) {
    detectedFields.push(`Expériences (${experiences.length})`);
  }

  // 13. Formations & Diplômes (Support double : Blocs multi-lignes du site & Lignes avec années)
  const educations: Education[] = [];
  const rawEduPool = preprocessWrappedLines(sectionsContent.educations);
  let currentEdu: Partial<Education> | null = null;

  const degreeAndDateRegex = new RegExp(
    '^(.*?)\\s+((?:(?:' + MONTHS_PATTERN + '\\s*)?\\d{4}|' + MONTHS_PATTERN + ')?\\s*[-–]\\s*(?:(?:' + MONTHS_PATTERN + '\\s*)?\\d{4}|' + MONTHS_PATTERN + '|pr[ée]sent|en cours|actuel)|\\d{4})$',
    'i'
  );

  for (let i = 0; i < rawEduPool.length; i++) {
    const rawLine = rawEduPool[i];
    const isBullet = /^[\s•\-\*o«+]+/.test(rawLine);
    const cleanLine = rawLine.replace(/^[\s•\-\*o«+]+/, '').trim();
    if (!cleanLine || cleanLine.length < 2) continue;

    // A. Diplôme et Dates en ligne (ex: "Diplôme de Technicien (D.T) 2020 - 2021" ou "Licence ... 2022 - 2025")
    const degDateM = cleanLine.match(degreeAndDateRegex);
    if (degDateM && degDateM[1].trim().length >= 3) {
      if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
        educations.push(finalizeEdu(currentEdu, city, educations.length));
      }
      const dates = degDateM[2].split(/\s*[-–]\s*|\s+[àa]\s+/);
      currentEdu = {
        degree: degDateM[1].trim(),
        institution: '',
        city,
        startDate: dates[0]?.trim() || '',
        endDate: dates[1]?.trim() || dates[0]?.trim() || '',
        current: false,
        description: ''
      };
      continue;
    }

    // B. Format Bénin standard : "2022-2025 : Attestation de Licence..."
    const inlineEdu = cleanLine.match(/^(\d{4})\s*[-–/àa]\s*(\d{4}|présent|en cours)?\s*[:\-–]\s*(.*)/i);
    if (inlineEdu && inlineEdu[3] && inlineEdu[3].trim().length > 4) {
      if (currentEdu && currentEdu.degree) {
        educations.push(finalizeEdu(currentEdu, city, educations.length));
        currentEdu = null;
      }
      const sDate = inlineEdu[1].trim();
      const eDate = inlineEdu[2] ? inlineEdu[2].trim() : sDate;
      const fullText = inlineEdu[3].trim();
      let degree = fullText;
      let institution = 'Établissement au Bénin';
      let eduCity = city;

      const splitInst = fullText.split(/\s+(?:[àa]|au|chez|dans|par)\s+(?:l[’']|l[e|a]\s+)?/i);
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

      educations.push({
        id: `edu_h_${Date.now()}_${educations.length}`,
        degree,
        institution,
        city: eduCity,
        country: 'Bénin',
        startDate: sDate,
        endDate: eDate,
        current: false,
        description: ''
      });
      continue;
    }

    // C. Ligne Établissement & Ville (ex: "Haute École de Commerce et de Management (HECM) - Parakou" ou "LTP KANDI « Kandi")
    const hasInstCity = (cleanLine.includes(' - ') || cleanLine.includes(' « ')) && !isBullet && !/^\d{4}/.test(cleanLine);
    if (hasInstCity && currentEdu && !currentEdu.institution) {
      const parts = cleanLine.split(/[-–«]/);
      currentEdu.institution = parts[0]?.trim();
      if (parts[1]) {
        currentEdu.city = parts[1].replace(/,\s*Bénin/i, '').trim();
      }
      continue;
    }

    // D. Ligne d'année seule
    const isYearOnly = /^\d{4}(?:\s*[-–/àa]\s*(?:\d{4}|présent|en cours)?)?$/i.test(cleanLine);
    if (isYearOnly) {
      if (currentEdu) {
        const parts = cleanLine.split(/\s*[-–]\s*|\s+[àa]\s+/);
        currentEdu.startDate = parts[0]?.trim() || '';
        currentEdu.endDate = parts[1]?.trim() || currentEdu.startDate || '';
      }
      continue;
    }

    // E. Intitulé de diplôme ou descriptions d'option
    if (!currentEdu || !currentEdu.degree) {
      if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
        educations.push(finalizeEdu(currentEdu, city, educations.length));
      }
      currentEdu = { degree: cleanLine };
    } else {
      if (!currentEdu.institution) {
        currentEdu.institution = cleanLine;
      } else {
        currentEdu.description = currentEdu.description ? `${currentEdu.description} ${cleanLine}` : cleanLine;
      }
    }
  }

  if (currentEdu && currentEdu.degree) {
    educations.push(finalizeEdu(currentEdu, city, educations.length));
  }

  if (educations.length > 0) {
    detectedFields.push(`Formations (${educations.length})`);
  }

  // 14. Sections additionnelles (Loisirs, Certifications)
  const customSections: CustomSection[] = [];
  if (sectionsContent.hobbies.length > 0) {
    const cleanHobbies = sectionsContent.hobbies
      .map((h) => h.replace(/^[\s•\-\*o\d.:)\-]+/gi, '').trim())
      .filter((h) => h.length > 2 && h.length < 40 && !/Signature|Je certifie|Faits [àa]|-- \d/i.test(h));

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

function finalizeExp(exp: Partial<Experience>, defaultCity: string, idx: number): Experience {
  return {
    id: `exp_h_${Date.now()}_${idx}`,
    role: exp.role || 'Poste occupé',
    company: exp.company || 'Entreprise au Bénin',
    city: exp.city || defaultCity || 'Cotonou',
    country: 'Bénin',
    startDate: exp.startDate || '2023',
    endDate: exp.endDate || '',
    current: Boolean(exp.current),
    description: exp.description || '',
    achievements: []
  };
}

function finalizeEdu(edu: Partial<Education>, defaultCity: string, idx: number): Education {
  return {
    id: `edu_h_${Date.now()}_${idx}`,
    degree: edu.degree || 'Diplôme',
    institution: edu.institution || 'Établissement au Bénin',
    city: edu.city || defaultCity || 'Cotonou',
    country: 'Bénin',
    startDate: edu.startDate || '',
    endDate: edu.endDate || '',
    current: false,
    description: edu.description || ''
  };
}
