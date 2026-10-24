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
