/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CVData } from '../types';

interface AIEnhanceOptions {
  type: 'summary' | 'experience' | 'skills' | 'grammar' | 'cv_audit' | 'cover_letter';
  text?: string;
  jobTitle?: string;
  context?: string;
  cvData?: CVData;
}

export interface AIEnhanceResult {
  content: string;
  suggestions?: string[];
  isAI: boolean;
}

export interface JobMatchAnalysis {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  importantKeywords: string[];
  experienceTips: string[];
  recommendations: string[];
  isAI: boolean;
}

export interface CVAuditResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  isAI: boolean;
}

export async function enhanceWithAI(options: AIEnhanceOptions): Promise<AIEnhanceResult> {
  const { type, text = '', jobTitle = 'Professionnel', context = '', cvData } = options;

  // 1. Essai via le proxy backend sécurisé /api/ai/enhance
  try {
    const response = await fetch('/api/ai/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, text, jobTitle, context, cvData })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.content) {
        const outputText = data.content.trim();
        if (type === 'skills') {
          const list = outputText
            .split(/[,;\n]/)
            .map((s: string) => s.trim().replace(/^[-*•]\s*/, ''))
            .filter((s: string) => s.length > 1);
          return {
            content: outputText,
            suggestions: list,
            isAI: Boolean(data.isAI)
          };
        }
        return {
          content: outputText,
          isAI: Boolean(data.isAI)
        };
      }
    }
  } catch (e) {
    console.info('Proxy IA indisponible, utilisation du moteur heuristique béninois de secours.', e);
  }

  // 2. Fallback de haute qualité local spécifique au contexte béninois
  return getLocalHeuristicEnhancement(options);
}

export async function analyzeJobMatch(cvData: CVData, jobOfferText: string): Promise<JobMatchAnalysis> {
  try {
    const response = await fetch('/api/ai/job-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvData, jobOfferText })
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.analysis) {
        return {
          matchScore: Number(data.analysis.matchScore) || 50,
          matchingSkills: Array.isArray(data.analysis.matchingSkills) ? data.analysis.matchingSkills : [],
          missingSkills: Array.isArray(data.analysis.missingSkills) ? data.analysis.missingSkills : [],
          importantKeywords: Array.isArray(data.analysis.importantKeywords) ? data.analysis.importantKeywords : [],
          experienceTips: Array.isArray(data.analysis.experienceTips) ? data.analysis.experienceTips : [],
          recommendations: Array.isArray(data.analysis.recommendations) ? data.analysis.recommendations : [],
          isAI: Boolean(data.isAI)
        };
      }
    }
  } catch (e) {
    console.info('Analyse offre d’emploi via repli local.', e);
  }

  return computeLocalJobMatch(cvData, jobOfferText);
}

export async function auditCVWithAI(cvData: CVData): Promise<CVAuditResult> {
  try {
    const res = await enhanceWithAI({
      type: 'cv_audit',
      jobTitle: cvData.personalInfo.jobTitle,
      cvData
    });
    const clean = res.content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(clean);
    if (typeof parsed.score === 'number') {
      return {
        score: Math.max(0, Math.min(100, parsed.score)),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        isAI: res.isAI
      };
    }
  } catch (e) {
    // Repli local
  }
  return computeLocalCVAudit(cvData);
}

export async function generateCoverLetter(cvData: CVData, jobOfferText = ''): Promise<AIEnhanceResult> {
  return enhanceWithAI({
    type: 'cover_letter',
    text: jobOfferText,
    jobTitle: cvData.personalInfo.jobTitle,
    cvData
  });
}

function computeLocalJobMatch(cvData: CVData, jobOfferText: string): JobMatchAnalysis {
  const cvCorpus = [
    cvData.personalInfo.jobTitle,
    cvData.profileSummary,
    ...cvData.skills.map((s) => s.name),
    ...cvData.experiences.map((e) => `${e.role} ${e.company} ${e.description}`),
    ...cvData.educations.map((e) => `${e.degree} ${e.institution} ${e.description || ''}`)
  ]
    .join(' ')
    .toLowerCase();

  const stopWords = new Set([
    'pour', 'avec', 'dans', 'vous', 'nous', 'cette', 'sont', 'etre', 'avoir', 'plus', 'sous',
    'sans', 'tout', 'tous', 'une', 'des', 'les', 'aux', 'par', 'sur', 'qui', 'que', 'poste',
    'offre', 'emploi', 'profil', 'mission', 'missions', 'candidat', 'benin', 'cotonou'
  ]);

  const rawWords = jobOfferText
    .toLowerCase()
    .replace(/[^a-zàâäéèêëïîôöùûüç0-9+#.\s-]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopWords.has(w));

  const freq = new Map<string, number>();
  for (const w of rawWords) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  const topKeywords = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([w]) => w);

  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const sk of cvData.skills) {
    const skLower = sk.name.toLowerCase();
    if (jobOfferText.toLowerCase().includes(skLower) || skLower.split(/\s+/).some((t) => t.length >= 4 && jobOfferText.toLowerCase().includes(t))) {
      matchingSkills.push(sk.name);
    }
  }

  for (const kw of topKeywords) {
    if (cvCorpus.includes(kw)) {
      if (!matchingSkills.some((m) => m.toLowerCase().includes(kw))) {
        matchingSkills.push(kw);
      }
    } else {
      missingSkills.push(kw);
    }
  }

  const ratio = topKeywords.length > 0 ? (topKeywords.length - missingSkills.length) / topKeywords.length : 0.6;
  const matchScore = Math.max(25, Math.min(95, Math.round(35 + ratio * 60)));

  return {
    matchScore,
    matchingSkills: matchingSkills.slice(0, 8),
    missingSkills: missingSkills.slice(0, 8),
    importantKeywords: topKeywords.slice(0, 10),
    experienceTips: [
      'Mettez en avant dans vos expériences existantes les réalisations concrètes en lien direct avec les missions de l’annonce.',
      'Ajoutez des résultats chiffrés (délais tenus, volume géré, projets livrés) sans jamais inventer de faits.'
    ],
    recommendations: [
      'Alignez l’intitulé de votre profil avec le titre du poste visé si votre parcours correspond.',
      'N’ajoutez les mots-clés manquants que s’ils reflètent réellement vos compétences acquises.'
    ],
    isAI: false
  };
}

function computeLocalCVAudit(cvData: CVData): CVAuditResult {
  let score = 30;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (cvData.personalInfo.firstName && cvData.personalInfo.lastName && cvData.personalInfo.email && cvData.personalInfo.phone) {
    score += 15;
    strengths.push('Coordonnées de contact complètes (nom, email, téléphone).');
  } else {
    weaknesses.push('Coordonnées incomplètes.');
    recommendations.push('Complétez votre nom, email et numéro joignable au Bénin.');
  }

  if ((cvData.profileSummary || '').trim().length >= 80) {
    score += 15;
    strengths.push('Résumé professionnel structuré.');
  } else {
    weaknesses.push('Résumé professionnel trop court ou absent.');
    recommendations.push('Rédigez 3 à 4 phrases résumant votre valeur ajoutée et votre objectif.');
  }

  if (cvData.experiences.length >= 1) {
    score += 15;
    strengths.push(`${cvData.experiences.length} expérience(s) renseignée(s).`);
  } else {
    weaknesses.push('Aucune expérience ou stage renseigné.');
    recommendations.push('Ajoutez vos emplois, stages académiques ou projets significatifs.');
  }

  if (cvData.educations.length >= 1) {
    score += 10;
    strengths.push(`${cvData.educations.length} formation(s) académique(s) présente(s).`);
  } else {
    weaknesses.push('Section formation vide.');
    recommendations.push('Précisez votre dernier diplôme ou niveau d’études.');
  }

  if (cvData.skills.length >= 5) {
    score += 10;
    strengths.push('Liste de compétences bien fournie.');
  } else {
    weaknesses.push('Moins de 5 compétences listées.');
    recommendations.push('Ajoutez entre 6 et 10 compétences techniques et transversales.');
  }

  if (cvData.languages.length >= 1) {
    score += 5;
  }

  return {
    score: Math.min(100, score),
    strengths,
    weaknesses,
    recommendations,
    isAI: false
  };
}

function getLocalHeuristicEnhancement(options: AIEnhanceOptions): AIEnhanceResult {
  const { type, text = '', jobTitle = '', cvData } = options;

  if (type === 'cv_audit' && cvData) {
    return {
      content: JSON.stringify(computeLocalCVAudit(cvData)),
      isAI: false
    };
  }

  if (type === 'cover_letter' && cvData) {
    const fullName = `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`.trim() || 'Candidat';
    const city = cvData.personalInfo.city || 'Cotonou';
    const skillsList = cvData.skills.slice(0, 5).map((s) => s.name).join(', ');
    const lastExp = cvData.experiences[0];
    const lastEdu = cvData.educations[0];
    return {
      content: `${city}, le ${new Date().toLocaleDateString('fr-FR')}

Objet : Candidature au poste de ${jobTitle || cvData.personalInfo.jobTitle || 'Collaborateur'}

Madame, Monsieur,

Titulaire de ${lastEdu ? `${lastEdu.degree} (${lastEdu.institution})` : 'une solide formation'}, je vous soumets ma candidature pour le poste de ${jobTitle || cvData.personalInfo.jobTitle || 'votre entreprise'}.

${lastExp ? `Au cours de mon expérience en tant que ${lastExp.role} chez ${lastExp.company}, j’ai développé une maîtrise concrète des enjeux opérationnels du métier.` : 'Mon parcours m’a permis de développer rigueur, sens des responsabilités et adaptabilité.'} ${skillsList ? `Mes compétences en ${skillsList} constituent des atouts directement mobilisables pour vos équipes.` : ''}

Disponible pour un entretien à votre convenance, je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.

${fullName}
${cvData.personalInfo.phone || ''} • ${cvData.personalInfo.email || ''}`.trim(),
      isAI: false
    };
  }

  if (type === 'summary') {
    if (!text.trim()) {
      return {
        content: `Professionnel rigoureux et passionné, titulaire d'une formation solide et désireux de mettre mes compétences au service d'une entreprise innovante au Bénin. Doté d'un excellent esprit d'équipe, d'un sens de l'organisation reconnu et d'une volonté constante d'apprentissage.`,
        isAI: false
      };
    }
    // Correction stylistique de base
    const polished = text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\bi\b/g, 'je')
      .replace(/([.!?])\s*([a-z])/g, (_, p1, p2) => `${p1} ${p2.toUpperCase()}`);
    return {
      content: `${polished} Dynamique, méthodique et immédiatement disponible pour relever vos défis opérationnels.`,
      isAI: false
    };
  }

  if (type === 'experience') {
    return {
      content: text
        ? `• Pilotage et exécution méthodique des tâches assignées avec respect strict des délais.\n• Coordination opérationnelle avec les parties prenantes et reporting régulier à la hiérarchie.\n• ${text.trim()}`
        : `• Prise en charge proactive des activités quotidiennes du département.\n• Optimisation des méthodes de travail et satisfaction des usagers/clients.`,
      isAI: false
    };
  }

  if (type === 'skills') {
    const defaultSuggestions: Record<string, string[]> = {
      informatique: ['React.js & TypeScript', 'Bases de données SQL', 'Git / GitHub', 'API REST', 'Méthode Agile Scrum', 'Cybersécurité de base'],
      comptabilite: ['SYSCOHADA révisé', 'Sage Saari', 'Fiscalité béninoise (DGI)', 'Déclarations CNSS', 'Rapprochements bancaires', 'Tableaux de bord Excel'],
      commercial: ['Prospection terrain', 'Négociation B2B & B2C', 'Fidélisation client', 'CRM & Vente', 'Communication persuasive'],
      administratif: ['Rédaction administrative', 'Tenue d’agenda complexe', 'Accueil des partenaires', 'Archivage documentaire', 'Pack Office']
    };

    const lower = jobTitle.toLowerCase();
    let key = 'informatique';
    if (lower.includes('compt') || lower.includes('finan') || lower.includes('gest')) key = 'comptabilite';
    else if (lower.includes('commerc') || lower.includes('vent') || lower.includes('market')) key = 'commercial';
    else if (lower.includes('admin') || lower.includes('secrét') || lower.includes('assist')) key = 'administratif';

    const list = defaultSuggestions[key] || defaultSuggestions.informatique;
    return {
      content: list.join(', '),
      suggestions: list,
      isAI: false
    };
  }

  // Grammar correction fallback
  const cleaned = text
    .trim()
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/\s+\./g, '.');
  return {
    content: cleaned,
    isAI: false
  };
}
