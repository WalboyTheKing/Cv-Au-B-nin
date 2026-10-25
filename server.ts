/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Initialisation de Google Gen AI côté serveur (clé protégée)
const geminiApiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
  } catch (e) {
    console.error('Erreur initialisation Gemini API serveur', e);
  }
}

// -------------------------------------------------------------------
// ROUTES API BACKEND SÉCURISÉES
// -------------------------------------------------------------------

// 1. Configuration publique de l'application
app.get('/api/config', (req, res) => {
  res.json({
    brandName: 'CV Pro Bénin',
    currency: 'FCFA',
    currencyCode: 'XOF',
    targetCountry: 'BJ',
    phonePrefix: '+229',
    supportPhone: '+229 01 94 53 77 41',
    contactEmail: 'contact@cvprobenin.bj',
    paymentsAvailable: true,
    moovBeneficiary: {
      name: 'Waaliyou Z Labouda',
      number: '0194537741',
      operator: 'Moov Money Bénin',
      ussdCode: '*855#'
    }
  });
});

// 2. Proxy d'assistance à la rédaction IA (clé non exposée au client)
app.post('/api/ai/enhance', async (req, res) => {
  const { type, text, jobTitle, context } = req.body;

  if (!aiClient) {
    return res.json({
      success: false,
      isAI: false,
      message: "Clé Gemini serveur non configurée. L'application utilise les modèles heuristiques prédéfinis."
    });
  }

  try {
    let prompt = '';
    if (type === 'summary') {
      prompt = `Tu es un expert en recrutement au Bénin et en Afrique de l'Ouest.
Améliore et dynamise ce résumé professionnel pour le poste de "${jobTitle || 'Professionnel'}" :
Texte original : "${text || ''}"
Contexte : "${context || ''}"
Règles : N'invente aucun diplôme fictif. Rédige en français soigné, percutant et concis (3 à 5 phrases). Renvoie UNIQUEMENT le texte amélioré.`;
    } else if (type === 'experience') {
      prompt = `En tant qu'expert RH au Bénin, reformule cette expérience pour "${jobTitle}" avec des verbes d'action au format liste à puces :
"${text || ''}"
Renvoie directement le texte reformulé.`;
    } else {
      prompt = `Propose 6 compétences clés recherchées au Bénin pour le métier de "${jobTitle}". Sépare par des virgules.`;
    }

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    res.json({
      success: true,
      content: response.text?.trim() || '',
      isAI: true
    });
  } catch (error: any) {
    console.error('Erreur appel Gemini API', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Erreur lors de la génération assistée.'
    });
  }
});

// 3. Analyse et extraction intelligente de CV (PDF, DOCX, TXT) via Gemini AI
app.post('/api/cv/parse', async (req, res) => {
  const { fileBase64, mimeType, fileName, rawText } = req.body;

  if (!aiClient) {
    return res.status(503).json({
      success: false,
      message: 'Moteur IA Gemini non configuré sur le serveur.'
    });
  }

  try {
    const systemPrompt = `Tu es le moteur expert d'analyse et d'extraction de CV de "CV Pro Bénin".
Ta mission est d'extraire fidèlement, précisément et intégralement toutes les données de ce document de CV pour pré-remplir le constructeur de CV professionnel.

Consignes strictes :
1. N'extrais JAMAIS de code binaire, d'en-têtes de fichier comme "%PDF", "obj", "endobj", "<<", ">>", "stream", etc.
2. Identifie le vrai Nom et Prénom du candidat (ex: pour "Boris Fabrice Maud DOSSOUVI" -> firstName: "Boris Fabrice Maud", lastName: "DOSSOUVI").
3. Extrais l'intitulé de poste exact (ex: "Ingénieur Informaticien" ou "Développeur Web & Mobile").
4. Extrais les coordonnées réelles (téléphone béninois ou international, email, ville, adresse, site web, linkedin).
5. Extrais toutes les expériences professionnelles avec dates, entreprise, ville, rôle, description et réalisations.
6. Extrais toutes les formations et diplômes avec établissement, année, filière et mention.
7. Extrais toutes les compétences techniques et transversales avec catégorie (dev_web, bureautique, gestion, vente, maintenance, transverse).
8. Extrais les langues avec niveau de maîtrise (ex: Langue maternelle, Bilingue / Courant, Professionnel, etc.).
9. Extrais les certifications et centres d'intérêt.
10. Renvoie EXCLUSIVEMENT un objet JSON valide conforme au schéma ci-dessous, sans texte avant ni après.

Format JSON attendu :
{
  "personalInfo": {
    "firstName": "string",
    "lastName": "string",
    "jobTitle": "string",
    "email": "string",
    "phone": "string",
    "city": "string",
    "country": "Bénin",
    "address": "string",
    "linkedin": "string",
    "website": "string"
  },
  "summary": "string",
  "experiences": [
    {
      "id": "exp_1",
      "role": "string",
      "company": "string",
      "city": "string",
      "startDate": "string",
      "endDate": "string",
      "current": false,
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "educations": [
    {
      "id": "edu_1",
      "degree": "string",
      "field": "string",
      "institution": "string",
      "city": "string",
      "graduationYear": "string",
      "mention": "string"
    }
  ],
  "skills": [
    {
      "id": "sk_1",
      "name": "string",
      "category": "dev_web",
      "level": 4
    }
  ],
  "languages": [
    {
      "id": "lang_1",
      "name": "string",
      "level": "string"
    }
  ],
  "customSections": [
    {
      "id": "sec_certifs",
      "title": "Certifications & Formations",
      "items": [
        {
          "id": "item_1",
          "title": "string",
          "subtitle": "string",
          "date": "string",
          "description": "string"
        }
      ]
    }
  ],
  "hobbies": ["string"]
}`;

    let contents: any[] = [];
    if (fileBase64 && (mimeType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf'))) {
      contents = [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: fileBase64
          }
        },
        { text: systemPrompt }
      ];
    } else {
      contents = [
        { text: `${systemPrompt}\n\nVoici le contenu du CV à analyser :\n\n${rawText || fileBase64 || ''}` }
      ];
    }

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsedJson = JSON.parse(response.text?.trim() || '{}');
    res.json({
      success: true,
      data: parsedJson
    });
  } catch (err: any) {
    console.error('Erreur extraction CV IA:', err);
    res.status(500).json({
      success: false,
      error: err?.message || "Erreur lors de l'analyse du document par l'IA."
    });
  }
});

// 3. Webhook pour notifications serveur-à-serveur Mobile Money (MTN / Moov / FedaPay)
app.post('/api/payments/webhook', (req, res) => {
  const signature = req.headers['x-fedapay-signature'] || req.headers['x-webhook-signature'];
  const payload = req.body;

  console.log('[Webhook Mobile Money reçu]', {
    event: payload?.event || 'transaction.updated',
    reference: payload?.id || payload?.reference,
    amount: payload?.amount,
    currency: payload?.currency || 'XOF'
  });

  // Réponse 200 immédiate pour acquitter la réception du webhook auprès du prestataire
  res.status(200).json({ received: true, status: 'processed' });
});

// -------------------------------------------------------------------
// SERVEUR VITE (DEV) OU FICHIERS STATIQUES (PROD)
// -------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[CV Pro Bénin] Serveur actif sur http://0.0.0.0:${port}`);
  });
}

startServer();
