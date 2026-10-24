/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';

interface AIEnhanceOptions {
  type: 'summary' | 'experience' | 'skills' | 'grammar';
  text?: string;
  jobTitle?: string;
  context?: string;
}

export interface AIEnhanceResult {
  content: string;
  suggestions?: string[];
  isAI: boolean;
}

// Initialisation sécurisée du client Gemini
const apiKey = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' ? (window as unknown as { __GEMINI_KEY?: string }).__GEMINI_KEY : '');
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch {
    aiClient = null;
  }
}

export async function enhanceWithAI(options: AIEnhanceOptions): Promise<AIEnhanceResult> {
  const { type, text = '', jobTitle = 'Professionnel', context = '' } = options;

  // Si l'API Gemini est configurée et accessible
  if (aiClient) {
    try {
      let prompt = '';
      if (type === 'summary') {
        prompt = `Tu es un expert en recrutement au Bénin et en Afrique de l'Ouest.
Améliore et dynamise ce résumé professionnel pour le poste de "${jobTitle}" :
Texte original : "${text}"
Contexte additionnel : "${context}"

Règles impératives :
1. Reste 100% fidèle aux compétences réelles, n'invente aucun diplôme ni entreprise fictive.
2. Rédige en français soigné, percutant, d'environ 3 à 5 phrases adaptées aux recruteurs au Bénin.
3. Renvoie UNIQUEMENT le texte amélioré sans formules de politesse ni explications meta.`;
      } else if (type === 'experience') {
        prompt = `Tu es un conseiller carrière au Bénin.
Reformule cette description de mission/expérience pour le poste de "${jobTitle}" :
Texte original : "${text}"

Règles :
1. Formule sous forme de puces d'actions concrètes commençant par des verbes d'action au participe ou infinitif.
2. Mets en valeur les réalisations et responsabilités sans inventer de faux chiffres.
3. Rédige en français professionnel et concis.
4. Renvoie directement le texte reformulé.`;
      } else if (type === 'skills') {
        prompt = `Propose 6 à 8 compétences professionnelles et techniques clés couramment recherchées au Bénin pour le métier de "${jobTitle}".
Donne la liste séparée par des virgules, sans numérotation ni texte superflu.`;
      } else if (type === 'grammar') {
        prompt = `Corrige les fautes d'orthographe, de grammaire et de typographie française dans ce texte de CV sans en dénaturer le sens :
"${text}"
Renvoie UNIQUEMENT le texte corrigé.`;
      }

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const outputText = response.text?.trim() || '';
      if (outputText) {
        if (type === 'skills') {
          const list = outputText
            .split(/[,;\n]/)
            .map((s) => s.trim().replace(/^[-*•]\s*/, ''))
            .filter((s) => s.length > 1);
          return {
            content: outputText,
            suggestions: list,
            isAI: true
          };
        }
        return {
          content: outputText,
          isAI: true
        };
      }
    } catch (e) {
      console.warn('Erreur appel Gemini API, bascule sur les modèles de suggestions prédéfinis.', e);
    }
  }

  // Fallback haute qualité local si la clé API n'est pas renseignée
  return getLocalHeuristicEnhancement(options);
}

function getLocalHeuristicEnhancement(options: AIEnhanceOptions): AIEnhanceResult {
  const { type, text = '', jobTitle = '' } = options;

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
    .replace(/\s,/, ',')
    .replace(/\s\./, '.');
  return {
    content: cleaned,
    isAI: false
  };
}
