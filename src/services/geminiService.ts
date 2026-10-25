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

  // 1. Essai via le proxy backend sécurisé /api/ai/enhance
  try {
    const response = await fetch('/api/ai/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, text, jobTitle, context })
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
            isAI: true
          };
        }
        return {
          content: outputText,
          isAI: true
        };
      }
    }
  } catch (e) {
    console.info('Proxy IA indisponible, utilisation du moteur heuristique béninois de secours.', e);
  }

  // 2. Fallback de haute qualité local spécifique au contexte béninois
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
