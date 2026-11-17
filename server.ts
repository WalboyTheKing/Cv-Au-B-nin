/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import type { GoogleGenAI } from '@google/genai';
import { db, hashPasswordScrypt, verifyPasswordHash, ServerUser } from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const cliPortIdx = process.argv.indexOf('--port');
const cliPort = cliPortIdx !== -1 ? Number(process.argv[cliPortIdx + 1]) : NaN;
const port = Number.isFinite(cliPort) && cliPort > 0 ? cliPort : Number(process.env.PORT) || 3000;

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
const AI_RATE_LIMIT_PER_MIN = Math.max(2, Number(process.env.AI_RATE_LIMIT_PER_MIN || 8));
const AI_DAILY_LIMIT_PER_USER = Math.max(5, Number(process.env.AI_DAILY_LIMIT_PER_USER || 40));

app.disable('x-powered-by');
app.use(express.json({ limit: '10mb' }));

// En-têtes de sécurité HTTP (compatibles avec les prévisualisations iFrame AI Studio)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// -------------------------------------------------------------------
// PROTECTION ANTI-ABUS : RATE LIMITER & QUOTA GEMINI
// -------------------------------------------------------------------
interface RateEntry {
  count: number;
  resetAt: number;
}
const authRateMap = new Map<string, RateEntry>();
const aiRateMap = new Map<string, RateEntry>();
const aiDailyQuotaMap = new Map<string, { day: string; count: number }>();

function getClientIp(req: express.Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function checkWindowRateLimit(
  store: Map<string, RateEntry>,
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }
  entry.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

function authRateLimitMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = `auth:${getClientIp(req)}:${req.path}`;
  const check = checkWindowRateLimit(authRateMap, key, 15, 5 * 60 * 1000);
  if (!check.allowed) {
    return res.status(429).json({
      success: false,
      error: `Trop de tentatives. Veuillez réessayer dans ${check.retryAfterSec} secondes.`
    });
  }
  next();
}

async function aiRateAndQuotaMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authUser = await resolveOptionalAuthUser(req);
  const identityKey = authUser ? `usr:${authUser.id}` : `ip:${getClientIp(req)}`;

  const perMin = checkWindowRateLimit(aiRateMap, `min:${identityKey}`, AI_RATE_LIMIT_PER_MIN, 60 * 1000);
  if (!perMin.allowed) {
    return res.status(429).json({
      success: false,
      isAI: false,
      error: `Limite de fréquence IA atteinte. Patientez ${perMin.retryAfterSec} secondes.`
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const daily = aiDailyQuotaMap.get(identityKey);
  if (!daily || daily.day !== today) {
    aiDailyQuotaMap.set(identityKey, { day: today, count: 1 });
  } else if (daily.count >= AI_DAILY_LIMIT_PER_USER) {
    return res.status(429).json({
      success: false,
      isAI: false,
      error: `Quota journalier IA atteint (${AI_DAILY_LIMIT_PER_USER} requêtes/jour). Le moteur heuristique local reste disponible.`
    });
  } else {
    daily.count += 1;
  }

  next();
}

app.get('/api/health', async (_req, res) => {
  await db.init();
  res.json({ ok: true, port, storage: db.getMode() });
});

function sanitizeUser(user: ServerUser) {
  const { passwordHash, token, tokenExpiresAt, ...safe } = user;
  return safe;
}

function extractBearerToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const tok = authHeader.slice(7).trim();
  return tok || null;
}

async function resolveOptionalAuthUser(req: express.Request): Promise<ServerUser | null> {
  const token = extractBearerToken(req);
  if (!token) return null;
  const user = await db.getUserByToken(token);
  if (!user) return null;
  if (user.tokenExpiresAt && new Date(user.tokenExpiresAt).getTime() <= Date.now()) {
    return null;
  }
  return user;
}

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise (jeton Bearer manquant).'
      });
    }

    const user = await db.getUserByToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Session expirée ou invalide.' });
    }

    if (user.tokenExpiresAt && new Date(user.tokenExpiresAt).getTime() <= Date.now()) {
      return res.status(401).json({ success: false, error: 'Session expirée. Veuillez vous reconnecter.' });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        error: `Votre compte a été suspendu par l'administration. Motif : ${user.suspendedReason || 'Activité non conforme.'}`
      });
    }

    (req as any).authUser = user;
    next();
  } catch (err: any) {
    console.error('[Auth Middleware Error]', err);
    res.status(500).json({ success: false, error: 'Erreur de vérification de session.' });
  }
}

async function checkAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentification administrateur requise (jeton Bearer manquant).'
      });
    }

    const user = await db.getUserByToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Session expirée ou invalide.' });
    }
    if (user.tokenExpiresAt && new Date(user.tokenExpiresAt).getTime() <= Date.now()) {
      return res.status(401).json({ success: false, error: 'Session administrateur expirée.' });
    }
    if (user.role !== 'admin' || user.isSuspended) {
      return res.status(403).json({
        success: false,
        error: 'Accès administrateur refusé. Permissions insuffisantes ou compte suspendu.'
      });
    }

    (req as any).adminUser = user;
    (req as any).authUser = user;
    return next();
  } catch (err: any) {
    console.error('[Admin Auth Error]', err);
    res.status(500).json({ success: false, error: 'Erreur vérification administrateur.' });
  }
}

// Initialisation paresseuse et sécurisée de Google Gen AI côté serveur (clé protégée)
let aiClient: GoogleGenAI | null = null;
let cachedThinkingLevel: any = null;
async function getAiClient(): Promise<{ client: GoogleGenAI; ThinkingLevel: any } | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!aiClient || !cachedThinkingLevel) {
    try {
      const mod = await import('@google/genai');
      cachedThinkingLevel = mod.ThinkingLevel;
      if (!aiClient) {
        aiClient = new mod.GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });
      }
    } catch (e) {
      console.error('Erreur initialisation Gemini API serveur', e);
      return null;
    }
  }
  return { client: aiClient, ThinkingLevel: cachedThinkingLevel };
}

function callWithTimeout<T>(promiseFn: () => Promise<T>, timeoutMs = 35000): Promise<T> {
  return Promise.race([
    promiseFn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Délai d’attente dépassé pour la réponse IA')), timeoutMs)
    )
  ]);
}

function getCVStatusFlags(cv: any, owner?: ServerUser | null) {
  const now = Date.now();
  const access = cv?.access;
  const expiresTime = access?.expiresAt ? new Date(access.expiresAt).getTime() : 0;
  const hasPaidHistory = Boolean(access && access.planCode !== 'free' && access.expiresAt);
  const isPremiumActive = Boolean(access && access.status === 'active' && expiresTime > now);
  const isExpiredLocked = Boolean(hasPaidHistory && expiresTime <= now);
  const remainingSeconds = isPremiumActive ? Math.max(0, Math.floor((expiresTime - now) / 1000)) : 0;

  const subExpiresMs = owner?.subscription?.expiresAt ? new Date(owner.subscription.expiresAt).getTime() : 0;
  const isCareerActive = Boolean(
    owner?.subscription?.status === 'active' &&
      subExpiresMs > now &&
      (owner.subscription.planCode === 'career_30d' || owner.subscription.planCode === 'plus_30d')
  );
  const maxCVs = isCareerActive ? 15 : 5;

  return {
    isPremiumActive,
    isExpiredLocked,
    remainingSeconds,
    maxCVs,
    status: isPremiumActive ? ('active' as const) : isExpiredLocked ? ('expired' as const) : ('none' as const)
  };
}

// -------------------------------------------------------------------
// ROUTES API AUTHENTIFICATION & SÉCURITÉ
// -------------------------------------------------------------------

// 1. Inscription d'un nouveau candidat
app.post('/api/auth/register', authRateLimitMiddleware, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body || {};

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez renseigner tous les champs obligatoires (Nom, Prénom, Email, Mot de passe).'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Format d’adresse email invalide.'
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit comporter au minimum 8 caractères pour protéger vos données.'
      });
    }

    const users = await db.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Un compte avec cette adresse email existe déjà. Veuillez vous connecter.'
      });
    }

    const now = new Date().toISOString();
    const userId = 'usr_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

    const newUser: ServerUser = {
      id: userId,
      email: cleanEmail,
      passwordHash: hashPasswordScrypt(String(password)),
      firstName: String(firstName).trim().slice(0, 80),
      lastName: String(lastName).trim().slice(0, 80),
      countryCode: 'BJ',
      phoneNumber: String(phoneNumber || '+229 ').trim().slice(0, 32),
      role: 'user',
      subscription: {
        id: 'sub_' + Date.now(),
        userId,
        planId: 'plan_free',
        planCode: 'free',
        status: 'active',
        startsAt: now,
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        createdAt: now
      },
      token,
      tokenExpiresAt,
      createdAt: now,
      updatedAt: now
    };

    await db.upsertUser(newUser);
    await db.addAuditLog(userId, cleanEmail, 'Création de compte candidat', 'user', userId);

    res.status(201).json({
      success: true,
      user: sanitizeUser(newUser),
      token
    });
  } catch (err: any) {
    console.error('[Register Error]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de l’inscription.' });
  }
});

// 2. Connexion d'un candidat ou administrateur (sans aucun mot de passe par défaut en dur)
app.post('/api/auth/login', authRateLimitMiddleware, async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email ou numéro de téléphone et mot de passe requis.'
      });
    }

    const cleanIdentifier = String(email).trim().toLowerCase();
    const digitsOnly = cleanIdentifier.replace(/\D/g, '');
    const users = await db.getUsers();
    const user = users.find((u) => {
      if (u.email.toLowerCase() === cleanIdentifier) return true;
      if (digitsOnly.length >= 8) {
        const userPhoneDigits = (u.phoneNumber || '').replace(/\D/g, '');
        if (userPhoneDigits && (userPhoneDigits.endsWith(digitsOnly) || digitsOnly.endsWith(userPhoneDigits))) {
          return true;
        }
      }
      return false;
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects. Aucun compte associé à cet email ou numéro.'
      });
    }

    const passCheck = verifyPasswordHash(String(password), user.passwordHash);
    if (!passCheck.valid) {
      return res.status(401).json({
        success: false,
        error: 'Mot de passe incorrect.'
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        error: `Votre compte a été suspendu par l'administration. Motif : ${user.suspendedReason || 'Activité non conforme.'}`
      });
    }

    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    user.token = token;
    user.tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
    if (passCheck.needsRehash) {
      user.passwordHash = hashPasswordScrypt(String(password));
    }
    user.updatedAt = new Date().toISOString();
    await db.upsertUser(user);

    res.json({
      success: true,
      user: sanitizeUser(user),
      token
    });
  } catch (err: any) {
    console.error('[Login Error]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la connexion.' });
  }
});

// 2b. Déconnexion (révocation explicite du jeton serveur)
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    const user: ServerUser = (req as any).authUser;
    delete user.token;
    delete user.tokenExpiresAt;
    user.updatedAt = new Date().toISOString();
    await db.upsertUser(user);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur lors de la déconnexion.' });
  }
});

// 3. Vérification de session
app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user: ServerUser = (req as any).authUser;
  res.json({
    success: true,
    user: sanitizeUser(user)
  });
});

// 4. Mise à jour du profil utilisateur
app.post('/api/auth/profile', requireAuth, async (req, res) => {
  try {
    const user: ServerUser = (req as any).authUser;
    const { firstName, lastName, phoneNumber } = req.body || {};
    if (firstName && String(firstName).trim()) user.firstName = String(firstName).trim().slice(0, 80);
    if (lastName && String(lastName).trim()) user.lastName = String(lastName).trim().slice(0, 80);
    if (phoneNumber !== undefined) user.phoneNumber = String(phoneNumber).trim().slice(0, 32);
    user.updatedAt = new Date().toISOString();

    await db.upsertUser(user);
    await db.addAuditLog(
      user.id,
      user.email,
      `Mise à jour des informations de profil (${user.firstName} ${user.lastName})`,
      'user',
      user.id
    );

    res.json({
      success: true,
      user: sanitizeUser(user)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur mise à jour profil.' });
  }
});

// 5. Modification du mot de passe
app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const user: ServerUser = (req as any).authUser;
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Mot de passe actuel et nouveau mot de passe requis.' });
    }

    const passCheck = verifyPasswordHash(String(currentPassword), user.passwordHash);
    if (!passCheck.valid) {
      return res.status(400).json({ success: false, error: 'Le mot de passe actuel est incorrect.' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Le nouveau mot de passe doit comporter au moins 8 caractères.'
      });
    }

    user.passwordHash = hashPasswordScrypt(String(newPassword));
    user.updatedAt = new Date().toISOString();
    await db.upsertUser(user);

    await db.addAuditLog(user.id, user.email, 'Modification du mot de passe avec succès', 'user', user.id);

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur changement de mot de passe.' });
  }
});

// 6. Suppression de son propre compte (Droit à l'effacement APDP Bénin)
app.post('/api/auth/delete-account', requireAuth, async (req, res) => {
  try {
    const user: ServerUser = (req as any).authUser;

    if (user.role === 'admin' && user.email.toLowerCase() === 'admin@cvprobenin.bj') {
      return res.status(403).json({
        success: false,
        error: 'Le compte administrateur racine de CV PRO BÉNIN ne peut pas être supprimé.'
      });
    }

    const deletedUserId = user.id;
    const deletedEmail = user.email;

    await db.deleteCVsByUser(deletedUserId);
    await db.deleteUser(deletedUserId);
    await db.addAuditLog(
      deletedUserId,
      deletedEmail,
      "Suppression définitive du compte utilisateur (Droit à l'oubli APDP Bénin)",
      'user',
      deletedUserId
    );

    res.json({
      success: true,
      message: 'Votre compte et vos données ont été définitivement supprimés.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur suppression de compte.' });
  }
});

// -------------------------------------------------------------------
// ROUTES API CVs & CONTRÔLE D'ACCÈS SERVEUR (STRICT OWNERSHIP + RBAC)
// -------------------------------------------------------------------

// Récupération des CVs de l'utilisateur authentifié (isolation multi-tenant stricte)
app.get('/api/cvs', requireAuth, async (req, res) => {
  try {
    const authUser: ServerUser = (req as any).authUser;
    const userCVs = await db.getCVs(authUser.id);
    res.json({ success: true, cvs: userCVs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur lecture des CV.' });
  }
});

// Récupération d'un CV précis (propriétaire ou admin uniquement)
app.get('/api/cvs/:id', requireAuth, async (req, res) => {
  try {
    const authUser: ServerUser = (req as any).authUser;
    const cv = await db.getCVById(req.params.id);
    if (!cv) {
      return res.status(404).json({ success: false, error: 'CV introuvable.' });
    }
    if (cv.userId !== authUser.id && authUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès interdit à ce CV.' });
    }
    res.json({ success: true, cv });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur lecture du CV.' });
  }
});

// Création / sauvegarde automatique d'un CV (anti-escalation access + verrou après expiration)
app.post('/api/cvs', requireAuth, async (req, res) => {
  try {
    const authUser: ServerUser = (req as any).authUser;
    const cvData = req.body;
    if (!cvData || !cvData.id || typeof cvData.id !== 'string') {
      return res.status(400).json({ success: false, error: 'Données de CV incomplètes (id requis).' });
    }

    // Protection stricte : suppression de `access` envoyé par le client
    const { access: _ignoredClientAccess, userId: _ignoredUserId, ...safeClientCV } = cvData;

    const existing = await db.getCVById(cvData.id);
    const now = new Date().toISOString();

    if (existing) {
      if (existing.userId && existing.userId !== authUser.id && authUser.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Vous n’êtes pas propriétaire de ce CV.' });
      }

      // Mission 5 : verrouillage des modifications après expiration d'un forfait payant
      const flags = getCVStatusFlags(existing, authUser);
      if (flags.isExpiredLocked) {
        return res.status(403).json({
          success: false,
          code: 'ACCESS_EXPIRED_RENEWAL_REQUIRED',
          error: 'La durée d’accès de ce CV est expirée. Vos données sont conservées mais toute modification exige un nouveau paiement (500 ou 1 000 FCFA).'
        });
      }

      const updatedCV = {
        ...safeClientCV,
        id: existing.id,
        userId: existing.userId || authUser.id,
        ...(existing.access ? { access: existing.access } : {}),
        createdAt: existing.createdAt || now,
        updatedAt: now
      };
      const saved = await db.upsertCV(updatedCV);
      return res.json({ success: true, cv: saved });
    }

    // Création d'un nouveau CV : vérification du quota du compte (5 en Découverte, 15 en Pack Carrière actif)
    const userCVs = await db.getCVs(authUser.id);
    const flags = getCVStatusFlags(null, authUser);
    if (userCVs.length >= flags.maxCVs && authUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        code: 'QUOTA_EXCEEDED',
        error: `Plafond de ${flags.maxCVs} CV atteint. Passez au Pack Carrière (1 000 FCFA / 30 jours) pour créer jusqu'à 15 CV.`
      });
    }

    const newCV = {
      ...safeClientCV,
      userId: authUser.id,
      createdAt: safeClientCV.createdAt || now,
      updatedAt: now
    };
    const saved = await db.upsertCV(newCV);
    res.json({ success: true, cv: saved });
  } catch (err: any) {
    console.error('[Save CV Error]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la sauvegarde du CV.' });
  }
});

// Suppression d'un CV (propriétaire ou admin uniquement)
app.delete('/api/cvs/:id', requireAuth, async (req, res) => {
  try {
    const authUser: ServerUser = (req as any).authUser;
    const cv = await db.getCVById(req.params.id);
    if (!cv) {
      return res.status(404).json({ success: false, error: 'CV introuvable.' });
    }
    if (cv.userId !== authUser.id && authUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Suppression interdite : vous n’êtes pas propriétaire.' });
    }
    await db.deleteCV(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur suppression CV.' });
  }
});

// Contrôle d'éligibilité et permissions côté serveur
app.get('/api/cvs/:id/entitlement', requireAuth, async (req, res) => {
  try {
    const authUser: ServerUser = (req as any).authUser;
    const cv = await db.getCVById(req.params.id);
    if (!cv) {
      return res.status(404).json({ success: false, error: 'CV introuvable.' });
    }
    if (cv.userId && cv.userId !== authUser.id && authUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès interdit aux droits de ce CV.' });
    }

    const users = await db.getUsers();
    const owner = cv.userId ? users.find((u) => u.id === cv.userId) : authUser;
    const userCVs = cv.userId ? await db.getCVs(cv.userId) : [cv];
    const flags = getCVStatusFlags(cv, owner);
    const isSuspended = Boolean(owner?.isSuspended);

    res.json({
      success: true,
      cvId: cv.id,
      isPremiumActive: flags.isPremiumActive,
      isExpiredLocked: flags.isExpiredLocked,
      status: flags.status,
      planCode: cv.access?.planCode || 'free',
      planName: cv.access?.planName || 'Formule Découverte',
      approvedAt: cv.access?.approvedAt,
      expiresAt: cv.access?.expiresAt,
      remainingSeconds: flags.remainingSeconds,
      access: cv.access || null,
      permissions: {
        canCreateCV: !isSuspended && userCVs.length < flags.maxCVs,
        canEditCV: !isSuspended && !flags.isExpiredLocked,
        canDownloadPDF: !isSuspended,
        canDownloadCleanPDF: !isSuspended && flags.isPremiumActive,
        canUsePremiumFeatures: !isSuspended && flags.isPremiumActive,
        isExpiredLocked: flags.isExpiredLocked
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur vérification droits CV.' });
  }
});

// Vérification stricte avant export PDF sans filigrane (autorise brouillon non persisté en mode Découverte avec filigrane)
app.post('/api/cvs/:id/export-check', async (req, res) => {
  try {
    const { id } = req.params;
    const cv = await db.getCVById(id);

    if (!cv) {
      // Brouillon local non encore persisté (visiteur non connecté en essai Découverte) : export avec filigrane uniquement
      return res.json({
        success: true,
        allowWatermarkRemoval: false,
        permissions: {
          canCreateCV: true,
          canEditCV: true,
          canDownloadPDF: true,
          canDownloadCleanPDF: false
        },
        reason: 'Brouillon Découverte : export PDF avec filigrane standard.'
      });
    }

    // Pour tout CV enregistré côté serveur, l'utilisateur doit être authentifié et propriétaire (ou admin)
    const authUser = await resolveOptionalAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ success: false, error: 'Authentification requise pour exporter ce CV.' });
    }
    if (cv.userId && cv.userId !== authUser.id && authUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès interdit à l’export de ce CV.' });
    }

    const flags = getCVStatusFlags(cv, authUser);
    if (!flags.isPremiumActive) {
      return res.json({
        success: true,
        allowWatermarkRemoval: false,
        permissions: {
          canCreateCV: true,
          canEditCV: !flags.isExpiredLocked,
          canDownloadPDF: true,
          canDownloadCleanPDF: false
        },
        reason: flags.isExpiredLocked
          ? 'Accès premium expiré pour ce CV. Renouvelez votre accès pour modifier ou exporter sans filigrane.'
          : 'CV en version Découverte non payée. Filigrane requis.'
      });
    }

    res.json({
      success: true,
      allowWatermarkRemoval: true,
      permissions: {
        canCreateCV: true,
        canEditCV: true,
        canDownloadPDF: true,
        canDownloadCleanPDF: true
      },
      expiresAt: cv.access?.expiresAt
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur vérification export PDF.' });
  }
});

// -------------------------------------------------------------------
// ROUTES API COMMANDES & PAIEMENTS MOOV MONEY BÉNIN
// -------------------------------------------------------------------

// 4. Création d'une commande Moov Money rattachée à l'utilisateur connecté et un CV précis
app.post('/api/orders/create', requireAuth, async (req, res) => {
  try {
    const authUser: ServerUser = (req as any).authUser;
    const { orderId, orderNumber: clientOrderNumber, planCode, cvId, cvTitle } = req.body || {};

    if (!cvId || typeof cvId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'La commande doit être associée à un CV précis.'
      });
    }

    // Vérifier que si le CV existe sur serveur, il appartient bien à l'utilisateur authentifié
    const targetCV = await db.getCVById(cvId);
    if (targetCV && targetCV.userId && targetCV.userId !== authUser.id && authUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Ce CV appartient à un autre compte.'
      });
    }

    const validPlans: Record<
      string,
      { id: string; code: 'cand_24h' | 'career_30d'; name: string; priceXOF: number }
    > = {
      cand_24h: {
        id: 'plan_cand_24h',
        code: 'cand_24h',
        name: 'Accès Candidature (24h)',
        priceXOF: 500
      },
      premium_7d: {
        id: 'plan_cand_24h',
        code: 'cand_24h',
        name: 'Accès Candidature (24h)',
        priceXOF: 500
      },
      career_30d: {
        id: 'plan_career_30d',
        code: 'career_30d',
        name: 'Pack Carrière (30 jours)',
        priceXOF: 1000
      },
      plus_30d: {
        id: 'plan_career_30d',
        code: 'career_30d',
        name: 'Pack Carrière (30 jours)',
        priceXOF: 1000
      }
    };

    const selectedPlan = validPlans[planCode];
    if (!selectedPlan) {
      return res.status(400).json({ success: false, error: 'Forfait invalide ou non payant.' });
    }

    if (orderId) {
      const existing = await db.getOrderById(orderId);
      if (existing) {
        if (existing.userId !== authUser.id && authUser.role !== 'admin') {
          return res.status(403).json({ success: false, error: 'Commande inaccessible.' });
        }
        return res.status(200).json({ success: true, order: existing });
      }
    }

    const orderNumber = clientOrderNumber || `CMD-MOOV-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const newOrder = {
      id: orderId || 'ord_' + Date.now() + '_' + crypto.randomBytes(2).toString('hex'),
      orderNumber,
      userId: authUser.id,
      userEmail: authUser.email,
      userName: `${authUser.firstName} ${authUser.lastName}`.trim() || authUser.email,
      cvId,
      cvTitle: targetCV?.title || cvTitle || 'Mon CV Professionnel',
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      planCode: selectedPlan.code,
      amountXOF: selectedPlan.priceXOF,
      currency: 'XOF',
      operator: 'moov_money',
      beneficiaryName: process.env.MOOV_BENEFICIARY_NAME || 'Waaliyou Z Labouda',
      beneficiaryPhone: process.env.MOOV_BENEFICIARY_PHONE || '0194537741',
      status: 'pending_payment',
      createdAt: now,
      updatedAt: now
    };

    const saved = await db.upsertOrder(newOrder);
    res.status(201).json({ success: true, order: saved });
  } catch (err: any) {
    console.error('[Create Order Error]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la création de commande.' });
  }
});

// 5. Déclaration manuelle de transaction Moov Money (anti-fraude & montant exact)
app.post('/api/orders/declare', requireAuth, async (req, res) => {
  try {
    const authUser: ServerUser = (req as any).authUser;
    const { orderId, transactionRef, amountDeclared, senderPhone, transactionDate, notes, proofUrl } = req.body || {};

    if (!orderId || !transactionRef || !senderPhone) {
      return res.status(400).json({
        success: false,
        error: 'La référence de transaction et le numéro de téléphone expéditeur sont obligatoires.'
      });
    }

    const cleanRef = String(transactionRef).trim().toUpperCase();
    if (cleanRef.length < 4 || cleanRef.length > 64) {
      return res.status(400).json({
        success: false,
        error: 'Format de référence Moov Money invalide (4 à 64 caractères requis).'
      });
    }

    const order = await db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable.' });
    }
    if (order.userId !== authUser.id && authUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Vous ne pouvez pas déclarer le paiement d’un autre compte.' });
    }

    if (order.status === 'approved') {
      return res.status(400).json({ success: false, error: 'Cette commande a déjà été validée.' });
    }
    if (order.status === 'rejected') {
      return res.status(400).json({ success: false, error: 'Cette commande a été rejetée. Créez une nouvelle commande.' });
    }

    // Vérification stricte du montant déclaré
    const parsedAmount = Number(amountDeclared);
    if (!Number.isFinite(parsedAmount) || parsedAmount !== order.amountXOF) {
      return res.status(400).json({
        success: false,
        error: `Le montant déclaré (${amountDeclared || 0} FCFA) doit correspondre exactement au tarif de l’offre (${order.amountXOF} FCFA).`
      });
    }

    // Validation de la preuve image si fournie
    const cleanProof = String(proofUrl || '');
    if (cleanProof) {
      if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(cleanProof)) {
        return res.status(400).json({
          success: false,
          error: 'Format de capture d’écran invalide (PNG, JPG ou WebP uniquement).'
        });
      }
      if (cleanProof.length > 4.5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'Capture d’écran trop volumineuse (max 3 Mo).'
        });
      }
    }

    // Anti-doublon strict : ni déjà validée ni déjà soumise sur une autre commande en attente, ni archivée dans payments
    const allOrders = await db.getOrders();
    const duplicateOrder = allOrders.find(
      (o) =>
        o.id !== orderId &&
        (o.status === 'approved' || o.status === 'pending_verification') &&
        String(o.submission?.transactionRef || '').trim().toUpperCase() === cleanRef
    );
    if (duplicateOrder) {
      return res.status(400).json({
        success: false,
        error: `Cette référence de transaction (${cleanRef}) est déjà associée à une autre commande.`
      });
    }

    const allPayments = await db.getPayments();
    const duplicatePayment = allPayments.find(
      (p) => String(p.providerReference || '').trim().toUpperCase() === cleanRef
    );
    if (duplicatePayment) {
      return res.status(400).json({
        success: false,
        error: `Cette référence de transaction (${cleanRef}) a déjà été comptabilisée.`
      });
    }

    order.submission = {
      transactionRef: cleanRef,
      amountDeclared: parsedAmount,
      senderPhone: String(senderPhone).trim().slice(0, 32),
      transactionDate: transactionDate ? String(transactionDate).trim() : new Date().toISOString().split('T')[0],
      notes: String(notes || '').trim().slice(0, 300),
      proofUrl: cleanProof,
      submittedAt: new Date().toISOString()
    };
    order.status = 'pending_verification';
    order.updatedAt = new Date().toISOString();

    const saved = await db.upsertOrder(order);
    await db.addAuditLog(
      authUser.id,
      authUser.email,
      `Déclaration Moov Money ${order.orderNumber} (${parsedAmount} FCFA - Réf: ${cleanRef})`,
      'order',
      order.id
    );

    res.json({ success: true, order: saved });
  } catch (err: any) {
    console.error('[Declare Order Error]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la déclaration du paiement.' });
  }
});

// 6. Récupération des commandes d'un utilisateur (isolation stricte)
app.get('/api/orders/user/:userId', requireAuth, async (req, res) => {
  try {
    const authUser: ServerUser = (req as any).authUser;
    const { userId } = req.params;
    if (userId !== authUser.id && authUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès interdit aux commandes d’un autre compte.' });
    }
    const userOrders = await db.getOrders(userId);
    res.json({ success: true, orders: userOrders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur lecture commandes.' });
  }
});

// 6b. Historique archivé des paiements et activations d'un utilisateur
app.get('/api/payments/user/:userId', requireAuth, async (req, res) => {
  try {
    const authUser: ServerUser = (req as any).authUser;
    const { userId } = req.params;
    if (userId !== authUser.id && authUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès interdit à l’historique financier d’un autre compte.' });
    }
    const userPayments = await db.getPayments(userId);
    res.json({ success: true, payments: userPayments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur lecture paiements.' });
  }
});

// -------------------------------------------------------------------
// ROUTES API ADMINISTRATION (RBAC STRICT)
// -------------------------------------------------------------------

// 7. Administration : liste de toutes les commandes
app.get('/api/admin/orders', checkAdminAuth, async (_req, res) => {
  try {
    const orders = await db.getOrders();
    res.json({ success: true, orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur lecture commandes admin.' });
  }
});

// 8. Administration : statistiques réelles et KPIs
app.get('/api/admin/metrics', checkAdminAuth, async (_req, res) => {
  try {
    const [users, cvs, orders, payments] = await Promise.all([
      db.getUsers(),
      db.getCVs(),
      db.getOrders(),
      db.getPayments()
    ]);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const thirtyDaysAgo = Date.now() - 30 * 86400000;

    const newUsersToday = users.filter((u) => new Date(u.createdAt).getTime() >= todayStart).length;
    const newUsers7Days = users.filter((u) => new Date(u.createdAt).getTime() >= sevenDaysAgo).length;
    const newUsers30Days = users.filter((u) => new Date(u.createdAt).getTime() >= thirtyDaysAgo).length;
    const suspendedUsersCount = users.filter((u) => u.isSuspended === true).length;
    const activeUsersCount = users.length - suspendedUsersCount;

    const approvedOrders = orders.filter((o) => o.status === 'approved');
    const pendingOrders = orders.filter((o) => o.status === 'pending_verification' || o.status === 'pending_payment');
    const rejectedOrders = orders.filter((o) => o.status === 'rejected');

    const totalRevenueXOF = approvedOrders.reduce((sum, o) => sum + (o.amountXOF || 0), 0);

    const candOrders = approvedOrders.filter((o) => o.planCode === 'cand_24h' || o.planCode === 'premium_7d');
    const careerOrders = approvedOrders.filter((o) => o.planCode === 'career_30d' || o.planCode === 'plus_30d');

    const salesByPlan = {
      cand_24h: { count: candOrders.length, revenue: candOrders.reduce((s, o) => s + (o.amountXOF || 500), 0) },
      career_30d: { count: careerOrders.length, revenue: careerOrders.reduce((s, o) => s + (o.amountXOF || 1000), 0) }
    };

    const dailyEvolution: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const dateLabel = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

      const dayUsers = users.filter((u) => {
        const t = new Date(u.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;

      const dayOrders = approvedOrders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      });

      dailyEvolution.push({
        date: dateLabel,
        users: dayUsers,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + o.amountXOF, 0)
      });
    }

    res.json({
      success: true,
      metrics: {
        totalUsers: users.length,
        newUsersToday,
        newUsers7Days,
        newUsers30Days,
        activeUsersCount,
        suspendedUsersCount,
        totalCVs: cvs.length,
        totalOrders: orders.length,
        pendingPaymentsCount: pendingOrders.length,
        approvedPaymentsCount: approvedOrders.length,
        rejectedPaymentsCount: rejectedOrders.length,
        totalRevenueXOF,
        salesByPlan,
        dailyEvolution,
        recentPayments: payments.slice(0, 20),
        manualOrders: orders
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur calcul statistiques admin.' });
  }
});

// 9. Administration : liste des utilisateurs avec métadonnées
app.get('/api/admin/users', checkAdminAuth, async (_req, res) => {
  try {
    const [users, cvs, orders] = await Promise.all([db.getUsers(), db.getCVs(), db.getOrders()]);

    const enrichedUsers = users.map((u) => {
      const userCVs = cvs.filter((c: any) => c.userId === u.id);
      const userOrders = orders.filter((o: any) => o.userId === u.id);
      const approved = userOrders.filter((o: any) => o.status === 'approved');
      const totalSpentXOF = approved.reduce((sum, o) => sum + (o.amountXOF || 0), 0);

      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phoneNumber: u.phoneNumber,
        countryCode: u.countryCode,
        role: u.role,
        isSuspended: u.isSuspended || false,
        suspendedReason: u.suspendedReason,
        suspendedAt: u.suspendedAt,
        subscription: u.subscription,
        cvCount: userCVs.length,
        ordersCount: userOrders.length,
        totalSpentXOF,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      };
    });

    res.json({ success: true, users: enrichedUsers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur lecture utilisateurs admin.' });
  }
});

// 10. Administration : modification des informations d'un utilisateur
app.post('/api/admin/users/update', checkAdminAuth, async (req, res) => {
  try {
    const { userId, firstName, lastName, phoneNumber, role } = req.body || {};
    const admin: ServerUser = (req as any).adminUser;

    const users = await db.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });

    if (firstName) user.firstName = String(firstName).trim().slice(0, 80);
    if (lastName) user.lastName = String(lastName).trim().slice(0, 80);
    if (phoneNumber !== undefined) user.phoneNumber = String(phoneNumber).trim().slice(0, 32);
    if (role && (role === 'user' || role === 'admin')) {
      if (user.email.toLowerCase() === 'admin@cvprobenin.bj' && role !== 'admin') {
        return res.status(400).json({ success: false, error: 'Impossible de rétrograder le compte admin racine.' });
      }
      user.role = role;
    }
    user.updatedAt = new Date().toISOString();
    await db.upsertUser(user);

    await db.addAuditLog(
      admin.id,
      admin.email,
      `Mise à jour administrative des informations de ${user.email}`,
      'user',
      user.id
    );

    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur mise à jour utilisateur.' });
  }
});

// 11. Administration : suspension d'un utilisateur
app.post('/api/admin/users/suspend', checkAdminAuth, async (req, res) => {
  try {
    const { userId, reason } = req.body || {};
    const admin: ServerUser = (req as any).adminUser;

    const users = await db.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });
    if (user.role === 'admin' && user.email.toLowerCase() === 'admin@cvprobenin.bj') {
      return res.status(400).json({ success: false, error: 'Impossible de suspendre le compte administrateur maître.' });
    }

    user.isSuspended = true;
    user.suspendedReason = String(reason || 'Activité suspecte ou non conforme').trim();
    user.suspendedAt = new Date().toISOString();
    delete user.token;
    delete user.tokenExpiresAt;
    user.updatedAt = new Date().toISOString();
    await db.upsertUser(user);

    await db.addAuditLog(
      admin.id,
      admin.email,
      `Suspension du compte ${user.email} (${user.firstName} ${user.lastName}). Motif : ${user.suspendedReason}`,
      'user',
      user.id
    );

    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur suspension utilisateur.' });
  }
});

// 12. Administration : réactivation d'un utilisateur suspendu
app.post('/api/admin/users/reactivate', checkAdminAuth, async (req, res) => {
  try {
    const { userId } = req.body || {};
    const admin: ServerUser = (req as any).adminUser;

    const users = await db.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });

    user.isSuspended = false;
    delete user.suspendedReason;
    delete user.suspendedAt;
    user.updatedAt = new Date().toISOString();
    await db.upsertUser(user);

    await db.addAuditLog(
      admin.id,
      admin.email,
      `Réactivation du compte ${user.email} (${user.firstName} ${user.lastName})`,
      'user',
      user.id
    );

    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur réactivation utilisateur.' });
  }
});

// 13. Administration : suppression sécurisée d'un compte
app.post('/api/admin/users/delete', checkAdminAuth, async (req, res) => {
  try {
    const { userId } = req.body || {};
    const admin: ServerUser = (req as any).adminUser;

    const users = await db.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });
    if (user.role === 'admin' && user.email.toLowerCase() === 'admin@cvprobenin.bj') {
      return res.status(400).json({ success: false, error: 'Impossible de supprimer l’administrateur principal.' });
    }

    await db.deleteCVsByUser(userId);
    await db.deleteUser(userId);

    await db.addAuditLog(
      admin.id,
      admin.email,
      `Suppression définitive du compte ${user.email} (${user.firstName} ${user.lastName})`,
      'user',
      userId
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur suppression compte.' });
  }
});

// 14. Administration : approbation manuelle d'une commande Moov Money (calcul strict + anti-double validation)
app.post('/api/admin/orders/approve', checkAdminAuth, async (req, res) => {
  try {
    const { orderId, checkAccount, checkAmount } = req.body || {};
    const adminActor: ServerUser = (req as any).adminUser;

    if (!checkAccount || !checkAmount) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez attester avoir vérifié le relevé Moov Money et la correspondance exacte de référence.'
      });
    }

    const order = await db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable.' });
    }

    if (order.status === 'approved') {
      return res.status(400).json({ success: false, error: 'Cette commande a déjà été approuvée.' });
    }

    if (order.status !== 'pending_verification') {
      return res.status(400).json({
        success: false,
        error: 'Cette commande ne contient pas encore de déclaration de transaction Moov Money à vérifier.'
      });
    }

    const txRef = order.submission?.transactionRef
      ? String(order.submission.transactionRef).trim().toUpperCase()
      : '';
    if (!txRef) {
      return res.status(400).json({
        success: false,
        error: 'Référence de transaction Moov Money manquante.'
      });
    }

    // Protection anti-double validation sur orders + payments
    const [allOrders, allPayments] = await Promise.all([db.getOrders(), db.getPayments()]);
    const alreadyValidatedRef = allOrders.find(
      (o) =>
        o.id !== orderId &&
        o.status === 'approved' &&
        String(o.submission?.transactionRef || '').trim().toUpperCase() === txRef
    );
    if (alreadyValidatedRef) {
      return res.status(400).json({
        success: false,
        error: `La référence Moov Money ${txRef} a déjà été validée pour la commande ${alreadyValidatedRef.orderNumber}.`
      });
    }
    const alreadyArchivedPayment = allPayments.find(
      (p) => String(p.providerReference || '').trim().toUpperCase() === txRef
    );
    if (alreadyArchivedPayment) {
      return res.status(400).json({
        success: false,
        error: `La référence Moov Money ${txRef} figure déjà dans le registre des paiements validés.`
      });
    }

    const is30Days = order.planCode === 'career_30d' || order.planCode === 'plus_30d';
    const durationMs = is30Days ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    const now = new Date();
    const nowIso = now.toISOString();

    order.status = 'approved';
    order.decision = {
      adminId: adminActor.id,
      adminEmail: adminActor.email,
      decisionDate: nowIso
    };
    order.updatedAt = nowIso;
    await db.upsertOrder(order);

    // Activation ciblée sur le CV précis de l'utilisateur (24h ou 30j calculés strictement côté serveur)
    let targetCV = order.cvId ? await db.getCVById(order.cvId) : null;
    if (targetCV && targetCV.userId && targetCV.userId !== order.userId) {
      targetCV = null;
    }

    let expiresAtDate: Date;
    if (targetCV) {
      const currentExpiry = targetCV.access?.expiresAt ? new Date(targetCV.access.expiresAt) : null;
      if (currentExpiry && currentExpiry.getTime() > now.getTime()) {
        expiresAtDate = new Date(currentExpiry.getTime() + durationMs);
      } else {
        expiresAtDate = new Date(now.getTime() + durationMs);
      }

      targetCV.access = {
        planCode: is30Days ? 'career_30d' : 'cand_24h',
        planName: is30Days ? 'Pack Carrière (30 jours)' : 'Accès Candidature (24h)',
        status: 'active',
        approvedAt: nowIso,
        expiresAt: expiresAtDate.toISOString(),
        orderId: order.id,
        orderNumber: order.orderNumber
      };
      targetCV.updatedAt = nowIso;
      await db.upsertCV(targetCV);
    } else {
      expiresAtDate = new Date(now.getTime() + durationMs);
    }

    // Si Pack Carrière 30 jours, met également à jour le quota de création (15 CV) sur le compte
    if (is30Days && order.userId) {
      const users = await db.getUsers();
      const buyer = users.find((u) => u.id === order.userId);
      if (buyer) {
        buyer.subscription = {
          id: 'sub_' + Date.now(),
          userId: buyer.id,
          planId: 'plan_career_30d',
          planCode: 'career_30d',
          status: 'active',
          startsAt: nowIso,
          expiresAt: expiresAtDate.toISOString(),
          createdAt: nowIso
        };
        buyer.updatedAt = nowIso;
        await db.upsertUser(buyer);
      }
    }

    // Conservation permanente de l'historique des paiements et activations
    await db.addPayment({
      id: 'pay_' + Date.now() + '_' + crypto.randomBytes(2).toString('hex'),
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      cvId: order.cvId || targetCV?.id || '',
      planId: order.planId,
      planName: order.planName,
      planCode: order.planCode,
      provider: 'moov_money',
      providerReference: txRef,
      amountXOF: order.amountXOF,
      currency: 'XOF',
      status: 'confirmed',
      confirmedAt: nowIso,
      expiresAt: expiresAtDate.toISOString(),
      createdAt: nowIso
    });

    await db.addAuditLog(
      adminActor.id,
      adminActor.email,
      `Validation du paiement commande ${order.orderNumber} (${order.amountXOF} FCFA - Moov: ${txRef})`,
      'order',
      order.id
    );

    res.json({
      success: true,
      order,
      targetCVAccess: targetCV?.access || null,
      expiresAt: expiresAtDate.toISOString()
    });
  } catch (err: any) {
    console.error('[Approve Order Error]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la validation de la commande.' });
  }
});

// 15. Administration : rejet d'une déclaration non conforme
app.post('/api/admin/orders/reject', checkAdminAuth, async (req, res) => {
  try {
    const { orderId, reason } = req.body || {};
    const adminActor: ServerUser = (req as any).adminUser;

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ success: false, error: 'Un motif explicatif de rejet est obligatoire.' });
    }

    const order = await db.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande introuvable.' });
    }

    if (order.status === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de rejeter une commande déjà approuvée et créditée.'
      });
    }

    const now = new Date().toISOString();
    order.status = 'rejected';
    order.decision = {
      adminId: adminActor.id,
      adminEmail: adminActor.email,
      decisionDate: now,
      rejectionReason: String(reason).trim().slice(0, 300)
    };
    order.updatedAt = now;
    await db.upsertOrder(order);

    await db.addAuditLog(
      adminActor.id,
      adminActor.email,
      `Rejet de la commande ${order.orderNumber}. Motif : ${order.decision.rejectionReason}`,
      'order',
      order.id
    );

    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur lors du rejet de la commande.' });
  }
});

// 16. Administration : liste de tous les CV créés
app.get('/api/admin/cvs', checkAdminAuth, async (_req, res) => {
  try {
    const [cvs, users] = await Promise.all([db.getCVs(), db.getUsers()]);

    const enrichedCVs = cvs.map((c: any) => {
      const owner = users.find((u) => u.id === c.userId);
      return {
        ...c,
        ownerName: owner
          ? `${owner.firstName} ${owner.lastName}`
          : c.personalInfo
          ? `${c.personalInfo.firstName || ''} ${c.personalInfo.lastName || ''}`.trim() || 'Invité'
          : 'Invité',
        ownerEmail: owner ? owner.email : c.personalInfo?.email || 'N/A'
      };
    });

    res.json({ success: true, cvs: enrichedCVs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur lecture CVs admin.' });
  }
});

// 17. Administration : suppression légitime d'un CV
app.delete('/api/admin/cvs/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const admin: ServerUser = (req as any).adminUser;

    const target = await db.getCVById(id);
    if (!target) return res.status(404).json({ success: false, error: 'CV introuvable.' });

    await db.deleteCV(id);
    await db.addAuditLog(
      admin.id,
      admin.email,
      `Suppression administrative du CV ${id} (${target.title})`,
      'cv',
      id
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur suppression CV admin.' });
  }
});

// 18. Administration : attribution manuelle exceptionnelle d'un forfait
app.post('/api/admin/subscriptions/grant', checkAdminAuth, async (req, res) => {
  try {
    const { userId, cvId, planCode, reason } = req.body || {};
    const admin: ServerUser = (req as any).adminUser;

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ success: false, error: 'Un motif d’attribution exceptionnelle est obligatoire.' });
    }

    const is30Days = planCode === 'career_30d' || planCode === 'plus_30d';
    const durationMs = is30Days ? 30 * 86400000 : 86400000;
    const planName = is30Days ? 'Pack Carrière (30 jours)' : 'Accès Candidature (24h)';
    const now = new Date();
    const nowIso = now.toISOString();

    let targetCV = cvId ? await db.getCVById(cvId) : null;
    if (!targetCV && userId) {
      const userCVs = await db.getCVs(userId);
      targetCV = userCVs[0] || null;
    }

    let expiresAtDate: Date;
    if (targetCV) {
      const currentExpiry = targetCV.access?.expiresAt ? new Date(targetCV.access.expiresAt) : null;
      if (currentExpiry && currentExpiry.getTime() > now.getTime()) {
        expiresAtDate = new Date(currentExpiry.getTime() + durationMs);
      } else {
        expiresAtDate = new Date(now.getTime() + durationMs);
      }

      targetCV.access = {
        planCode: is30Days ? 'career_30d' : 'cand_24h',
        planName,
        status: 'active',
        approvedAt: nowIso,
        expiresAt: expiresAtDate.toISOString(),
        orderId: 'admin_grant_' + Date.now(),
        orderNumber: 'ACCÈS-MANUEL'
      };
      targetCV.updatedAt = nowIso;
      await db.upsertCV(targetCV);
    } else {
      expiresAtDate = new Date(now.getTime() + durationMs);
    }

    if (userId) {
      const users = await db.getUsers();
      const user = users.find((u) => u.id === userId);
      if (user) {
        user.subscription = {
          id: 'sub_' + Date.now(),
          userId,
          planId: is30Days ? 'plan_career_30d' : 'plan_cand_24h',
          planCode: is30Days ? 'career_30d' : 'cand_24h',
          status: 'active',
          startsAt: nowIso,
          expiresAt: expiresAtDate.toISOString(),
          createdAt: nowIso
        };
        user.updatedAt = nowIso;
        await db.upsertUser(user);
      }
    }

    await db.addAuditLog(
      admin.id,
      admin.email,
      `Attribution manuelle du forfait ${planName} (${planCode}) au CV ${cvId || 'utilisateur ' + userId}. Motif : ${String(reason).trim()}`,
      'plan',
      cvId || userId
    );

    res.json({
      success: true,
      planName,
      expiresAt: expiresAtDate.toISOString(),
      cvAccess: targetCV?.access || null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur attribution manuelle.' });
  }
});

// 19. Administration : journal d'audit des actions
app.get('/api/admin/logs', checkAdminAuth, async (_req, res) => {
  try {
    const logs = await db.getAuditLogs();
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur lecture logs audit.' });
  }
});

// -------------------------------------------------------------------
// CONFIGURATION PUBLIQUE (AUCUNE CLÉ SECRÈTE)
// -------------------------------------------------------------------
app.get('/api/config', (_req, res) => {
  res.json({
    brandName: 'CV Pro Bénin',
    currency: 'FCFA',
    currencyCode: 'XOF',
    targetCountry: 'BJ',
    phonePrefix: '+229',
    supportPhone: '+229 01 94 53 77 41',
    contactEmail: process.env.SUPPORT_EMAIL || 'contact@cvprobenin.bj',
    paymentsAvailable: true,
    moovBeneficiary: {
      name: process.env.MOOV_BENEFICIARY_NAME || 'Waaliyou Z Labouda',
      number: process.env.MOOV_BENEFICIARY_PHONE || '0194537741',
      operator: 'Moov Money Bénin',
      ussdCode: process.env.MOOV_USSD_CODE || '*855#'
    }
  });
});

// -------------------------------------------------------------------
// PROXY GEMINI IA (PROTÉGÉ PAR RATE LIMITER & PLAFONNEMENT DE COÛTS)
// -------------------------------------------------------------------
app.post('/api/ai/enhance', aiRateAndQuotaMiddleware, async (req, res) => {
  const { type, text = '', jobTitle = '', context = '', cvData } = req.body || {};
  const safeText = String(text || '').slice(0, 6000);
  const safeJobTitle = String(jobTitle || 'Professionnel').slice(0, 120);
  const safeContext = String(context || '').slice(0, 1000);

  const aiBundle = await getAiClient();
  if (!aiBundle) {
    return res.json({
      success: false,
      isAI: false,
      message: "Clé Gemini serveur non configurée. L'application utilise les modèles heuristiques prédéfinis."
    });
  }
  const { client, ThinkingLevel } = aiBundle;

  try {
    let prompt = '';
    const isJsonOutput = type === 'cv_audit';

    if (type === 'summary') {
      prompt = `Tu es un expert en recrutement au Bénin et en Afrique de l'Ouest.
Améliore et dynamise ce résumé professionnel pour le poste de "${safeJobTitle}" :
Texte original : "${safeText}"
Contexte : "${safeContext}"
Règles strictes : N'invente aucun diplôme, expérience ou compétence fictive. Rédige en français soigné, percutant et concis (3 à 5 phrases). Renvoie UNIQUEMENT le texte amélioré.`;
    } else if (type === 'experience') {
      prompt = `En tant qu'expert RH au Bénin, reformule cette expérience pour "${safeJobTitle}" avec des verbes d'action au format liste à puces sans inventer de faits fictifs :
"${safeText}"
Renvoie directement le texte reformulé.`;
    } else if (type === 'grammar') {
      prompt = `Corrige l'orthographe, la grammaire et le style professionnel de ce texte de CV en français sans en changer le sens ni inventer d'informations :
"${safeText}"
Renvoie UNIQUEMENT le texte corrigé.`;
    } else if (type === 'cv_audit' && cvData) {
      prompt = `Tu es un auditeur RH expert au Bénin. Évalue objectivement ce CV sans rien inventer et renvoie EXCLUSIVEMENT un JSON valide :
{
  "score": number (0 à 100),
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string"]
}
Données réelles du CV :
${JSON.stringify({
  jobTitle: cvData.personalInfo?.jobTitle,
  summary: String(cvData.profileSummary || '').slice(0, 1500),
  experiences: Array.isArray(cvData.experiences) ? cvData.experiences.slice(0, 8) : [],
  educations: Array.isArray(cvData.educations) ? cvData.educations.slice(0, 6) : [],
  skills: Array.isArray(cvData.skills) ? cvData.skills.slice(0, 25).map((s: any) => s.name) : [],
  languages: Array.isArray(cvData.languages) ? cvData.languages.slice(0, 8) : []
})}`;
    } else if (type === 'cover_letter' && cvData) {
      prompt = `Tu es un conseiller carrière expert au Bénin. Rédige une lettre de motivation professionnelle en français (format sobre, 3 paragraphes + formule de politesse) en utilisant EXCLUSIVEMENT les informations réelles de ce CV (n'invente aucun diplôme, expérience ou compétence).
${safeText ? `Offre d'emploi ciblée :\n${safeText.slice(0, 2500)}\n` : ''}
CV du candidat :
${JSON.stringify({
  fullName: `${cvData.personalInfo?.firstName || ''} ${cvData.personalInfo?.lastName || ''}`.trim(),
  city: cvData.personalInfo?.city,
  phone: cvData.personalInfo?.phone,
  email: cvData.personalInfo?.email,
  jobTitle: cvData.personalInfo?.jobTitle,
  summary: String(cvData.profileSummary || '').slice(0, 1000),
  experiences: Array.isArray(cvData.experiences) ? cvData.experiences.slice(0, 4) : [],
  educations: Array.isArray(cvData.educations) ? cvData.educations.slice(0, 3) : [],
  skills: Array.isArray(cvData.skills) ? cvData.skills.slice(0, 15).map((s: any) => s.name) : []
})}
Renvoie UNIQUEMENT le texte complet de la lettre de motivation.`;
    } else {
      prompt = `Propose 6 compétences clés réalistes recherchées au Bénin pour le métier de "${safeJobTitle}". Sépare par des virgules.`;
    }

    let responseText = '';
    const candidateModels = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const config: any = {};
        if (isJsonOutput) config.responseMimeType = 'application/json';
        if (model === 'gemini-4-hydrogen') {
          config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }
        const response = await callWithTimeout(
          () =>
            client.models.generateContent({
              model,
              contents: prompt,
              config: Object.keys(config).length > 0 ? config : undefined
            }),
          15000
        );
        if (response.text) {
          responseText = response.text.trim();
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini API] Échec sur ${model}, bascule sur le modèle de repli`, err?.message || err);
      }
    }

    if (!responseText && lastError) {
      throw lastError;
    }

    res.json({
      success: true,
      content: responseText,
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

// 2b. Analyse du CV par rapport à une offre d'emploi (sans inventer de données)
app.post('/api/ai/job-match', aiRateAndQuotaMiddleware, async (req, res) => {
  const { cvData, jobOfferText } = req.body || {};
  if (!cvData || !jobOfferText || String(jobOfferText).trim().length < 20) {
    return res.status(400).json({
      success: false,
      error: 'Veuillez coller le texte d’une offre d’emploi (minimum 20 caractères).'
    });
  }

  const aiBundle = await getAiClient();
  if (!aiBundle) {
    return res.json({
      success: false,
      isAI: false,
      message: 'Clé Gemini serveur non configurée.'
    });
  }
  const { client, ThinkingLevel } = aiBundle;

  const prompt = `Tu es un expert en recrutement et ATS au Bénin.
Analyse la compatibilité entre le CV réel du candidat et l'offre d'emploi fournie.
RÈGLE ABSOLUE : N'invente AUCUN diplôme, expérience ou compétence. Base ton analyse strictement sur les données réelles du CV. Pour "missingSkills", indique uniquement les éléments demandés par l'annonce qui ne figurent pas dans le CV (afin que le candidat ne les ajoute que s'il les maîtrise vraiment).
Renvoie EXCLUSIVEMENT un objet JSON valide :
{
  "matchScore": number (0 à 100),
  "matchingSkills": ["string"],
  "missingSkills": ["string"],
  "importantKeywords": ["string"],
  "experienceTips": ["string"],
  "recommendations": ["string"]
}

Offre d'emploi :
${String(jobOfferText).slice(0, 4000)}

CV du candidat :
${JSON.stringify({
  jobTitle: cvData.personalInfo?.jobTitle,
  summary: String(cvData.profileSummary || '').slice(0, 1500),
  experiences: Array.isArray(cvData.experiences) ? cvData.experiences.slice(0, 8) : [],
  educations: Array.isArray(cvData.educations) ? cvData.educations.slice(0, 6) : [],
  skills: Array.isArray(cvData.skills) ? cvData.skills.slice(0, 25).map((s: any) => s.name) : [],
  languages: Array.isArray(cvData.languages) ? cvData.languages.slice(0, 8) : []
})}`;

  const candidateModels = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  for (const model of candidateModels) {
    try {
      const response = await callWithTimeout(
        () =>
          client.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              ...(model === 'gemini-4-hydrogen'
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {})
            }
          }),
        18000
      );
      if (response?.text) {
        const cleanJson = response.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const analysis = JSON.parse(cleanJson);
        return res.json({
          success: true,
          isAI: true,
          analysis
        });
      }
    } catch (err: any) {
      console.warn(`[Gemini API Job Match] Échec sur ${model}:`, err?.message || err);
    }
  }

  return res.json({
    success: false,
    isAI: false,
    message: 'Service IA momentanément indisponible.'
  });
});

// Fonctions utilitaires d'extraction et d'OCR pour PDF matriciels / scannés
function extractJpegsFromPdf(buffer: Buffer): Buffer[] {
  const images: Buffer[] = [];
  let pos = 0;
  while (pos < buffer.length) {
    const start = buffer.indexOf(Buffer.from([0xff, 0xd8, 0xff]), pos);
    if (start === -1) break;
    const end = buffer.indexOf(Buffer.from([0xff, 0xd9]), start + 3);
    if (end === -1) break;
    images.push(buffer.subarray(start, end + 2));
    pos = end + 2;
  }
  return images;
}

function getJpegDimensions(buf: Buffer): { width: number; height: number } | null {
  let i = 0;
  while (i < buf.length - 8) {
    if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc2)) {
      const height = buf.readUInt16BE(i + 5);
      const width = buf.readUInt16BE(i + 7);
      return { width, height };
    }
    i++;
  }
  return null;
}

async function runOcrOnPdfBuffer(pdfBuffer: Buffer): Promise<string> {
  const images = extractJpegsFromPdf(pdfBuffer);
  if (images.length === 0) return '';

  let ocrWorker: any = null;
  try {
    const { default: Tesseract } = await import('tesseract.js');
    ocrWorker = await Tesseract.createWorker(['fra', 'eng']);
    let combinedText = '';

    for (const img of images) {
      const dims = getJpegDimensions(img);
      if (dims && dims.width > 800) {
        const sidebarWidth = Math.round(dims.width * 0.35);
        const mainWidth = dims.width - sidebarWidth;

        const resRight = await ocrWorker.recognize(img, {
          rectangle: { top: 0, left: sidebarWidth, width: mainWidth, height: dims.height }
        });
        const resLeft = await ocrWorker.recognize(img, {
          rectangle: { top: 0, left: 0, width: sidebarWidth, height: dims.height }
        });

        combinedText += '\n\n' + (resRight.data?.text || '') + '\n\n' + (resLeft.data?.text || '');
      } else {
        const res = await ocrWorker.recognize(img);
        combinedText += '\n\n' + (res.data?.text || '');
      }
    }
    return combinedText.trim();
  } catch (ocrErr) {
    console.warn('[Server Tesseract OCR Error]', ocrErr);
    return '';
  } finally {
    if (ocrWorker) {
      try {
        await ocrWorker.terminate();
      } catch (_e) {}
    }
  }
}

// 3. Extraction textuelle propre de document (PDF, DOCX, TXT)
app.post('/api/cv/extract-text', aiRateAndQuotaMiddleware, async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName, text } = req.body || {};
    if (text && typeof text === 'string' && text.trim().length > 0) {
      return res.json({ success: true, text: text.trim().slice(0, 30000) });
    }
    if (!fileBase64) {
      return res.status(400).json({ success: false, error: 'Aucun contenu fourni.' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.byteLength > 8 * 1024 * 1024) {
      return res.status(413).json({ success: false, error: 'Fichier trop volumineux (max 8 Mo).' });
    }

    const nameLower = String(fileName || '').toLowerCase();
    const isPDF = mimeType === 'application/pdf' || nameLower.endsWith('.pdf');
    const isDOCX = nameLower.endsWith('.docx') || nameLower.endsWith('.doc') || (mimeType && mimeType.includes('word'));
    const isImage = mimeType?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(nameLower);

    let extractedText = '';

    if (isPDF) {
      try {
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        if (result && result.text) {
          extractedText = result.text.trim();
        }
      } catch (pdfErr) {
        console.warn('[PDFParse Server Warning]', pdfErr);
      }

      const isMinimalOrPageNumberOnly =
        !extractedText ||
        extractedText.length < 50 ||
        /^--\s*\d+\s*of\s*\d+\s*--$/i.test(extractedText.replace(/\s+/g, ' ').trim());
      if (isMinimalOrPageNumberOnly) {
        const ocrText = await runOcrOnPdfBuffer(buffer);
        if (ocrText && ocrText.length > 20) {
          extractedText = ocrText;
        }
      }
    } else if (isDOCX) {
      try {
        const mammoth = await import('mammoth');
        const docResult = await mammoth.extractRawText({ buffer });
        if (docResult && docResult.value) {
          extractedText = docResult.value.trim();
        }
      } catch (mErr) {
        console.warn('[DOCX Mammoth Server Warning]', mErr);
      }
    } else if (isImage) {
      try {
        const { default: Tesseract } = await import('tesseract.js');
        const ocrWorker = await Tesseract.createWorker(['fra', 'eng']);
        const resImg = await ocrWorker.recognize(buffer);
        await ocrWorker.terminate();
        if (resImg?.data?.text) {
          extractedText = resImg.data.text.trim();
        }
      } catch (imgErr) {
        console.warn('[Server Image OCR Warning]', imgErr);
      }
    } else {
      extractedText = buffer.toString('utf-8');
    }

    res.json({
      success: true,
      text: extractedText.slice(0, 30000)
    });
  } catch (err: any) {
    console.error('Erreur extraction textuelle serveur:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Erreur lors de l’extraction textuelle.'
    });
  }
});

// 4. Analyse et extraction intelligente de CV (PDF, DOCX, TXT, Images) avec repli heuristique
app.post('/api/cv/parse', aiRateAndQuotaMiddleware, async (req, res) => {
  const { fileBase64, mimeType, fileName, rawText } = req.body || {};
  let docText = String(rawText || '').slice(0, 30000);

  if ((!docText || docText.length < 40) && fileBase64) {
    const buffer = Buffer.from(fileBase64, 'base64');
    if (buffer.byteLength > 8 * 1024 * 1024) {
      return res.status(413).json({ success: false, error: 'Fichier trop volumineux (max 8 Mo).' });
    }
    const nameLower = String(fileName || '').toLowerCase();
    const isPDF = mimeType === 'application/pdf' || nameLower.endsWith('.pdf');
    const isDOCX = nameLower.endsWith('.docx') || nameLower.endsWith('.doc') || (mimeType && mimeType.includes('word'));
    const isImage = mimeType?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(nameLower);

    try {
      if (isPDF) {
        try {
          const { PDFParse } = await import('pdf-parse');
          const parser = new PDFParse({ data: buffer });
          const result = await parser.getText();
          if (result && result.text) {
            docText = result.text.trim();
          }
        } catch (pErr) {
          console.warn('[Server PDFParse during parse error]', pErr);
        }

        const isMinimal =
          !docText ||
          docText.length < 50 ||
          /^--\s*\d+\s*of\s*\d+\s*--$/i.test(docText.replace(/\s+/g, ' ').trim());
        if (isMinimal) {
          const ocrText = await runOcrOnPdfBuffer(buffer);
          if (ocrText && ocrText.length > 20) {
            docText = ocrText;
          }
        }
      } else if (isDOCX) {
        const mammoth = await import('mammoth');
        const docResult = await mammoth.extractRawText({ buffer });
        if (docResult?.value) {
          docText = docResult.value.trim();
        }
      } else if (isImage) {
        const { default: Tesseract } = await import('tesseract.js');
        const ocrWorker = await Tesseract.createWorker(['fra', 'eng']);
        const resImg = await ocrWorker.recognize(buffer);
        await ocrWorker.terminate();
        if (resImg?.data?.text) {
          docText = resImg.data.text.trim();
        }
      } else {
        docText = buffer.toString('utf-8');
      }
    } catch (parseExtractErr) {
      console.warn('[Server text extraction error in /api/cv/parse]', parseExtractErr);
    }
  }

  const aiBundle = await getAiClient();
  let parsedJson: any = null;

  if (aiBundle && docText && docText.length >= 30) {
    const { client, ThinkingLevel } = aiBundle;
    try {
      const systemPrompt = `Tu es le moteur expert d'analyse et d'extraction de CV de "CV Pro Bénin".
Extrais fidèlement, précisément et intégralement toutes les données de ce document de CV pour pré-remplir le constructeur de CV professionnel.
N'invente aucune fausse information. Renvoie EXCLUSIVEMENT un objet JSON valide conforme au schéma suivant :
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
  "customSections": [],
  "hobbies": ["string"]
}`;

      const candidateModels = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
      for (const model of candidateModels) {
        try {
          const response = await callWithTimeout(
            () =>
              client.models.generateContent({
                model,
                contents: [
                  {
                    text: `${systemPrompt}\n\nVoici le contenu textuel extrait du CV à analyser fidèlement :\n\n${docText.slice(0, 16000)}`
                  }
                ],
                config: {
                  responseMimeType: 'application/json',
                  ...(model === 'gemini-4-hydrogen'
                    ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                    : {})
                }
              }),
            20000
          );
          if (response?.text) {
            const cleanJson = response.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            parsedJson = JSON.parse(cleanJson);
            break;
          }
        } catch (err: any) {
          console.warn(`[Gemini API CV Parse] Échec sur ${model} (${err?.message || 'délai'}), essai suivant...`);
        }
      }
    } catch (aiErr) {
      console.warn('[Gemini API global error in /api/cv/parse]', aiErr);
    }
  }

  if (parsedJson && (parsedJson.personalInfo || parsedJson.experiences || parsedJson.educations)) {
    return res.json({
      success: true,
      isAI: true,
      data: parsedJson,
      rawText: docText
    });
  }

  const { parseCVText } = await import('./src/services/documentParser.ts');
  const parseResult = parseCVText(docText || fileName || '');
  return res.json({
    success: true,
    isAI: false,
    data: parseResult.cvData,
    detectedFields: parseResult.detectedFields,
    warnings: parseResult.warnings,
    rawText: docText,
    message: 'Analyse et structuration experte du CV effectuées avec succès.'
  });
});

// 5. Webhook sécurisé pour notifications Mobile Money (vérification HMAC si WEBHOOK_SECRET configuré)
app.post('/api/payments/webhook', (req, res) => {
  const secret = process.env.WEBHOOK_SECRET;
  const signature = String(req.headers['x-fedapay-signature'] || req.headers['x-webhook-signature'] || '');
  if (secret) {
    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body || {})).digest('hex');
    if (!signature || signature !== expected) {
      return res.status(401).json({ received: false, error: 'Signature webhook invalide.' });
    }
  }

  const payload = req.body;
  console.log('[Webhook Mobile Money reçu]', {
    event: payload?.event || 'transaction.updated',
    reference: payload?.id || payload?.reference,
    amount: payload?.amount,
    currency: payload?.currency || 'XOF'
  });

  res.status(200).json({ received: true, status: 'processed' });
});

// -------------------------------------------------------------------
// SERVEUR VITE (DEV) OU FICHIERS STATIQUES (PROD)
// -------------------------------------------------------------------
async function startServer() {
  await db.init();

  if (process.env.NODE_ENV !== 'production') {
    const vitePromise = (async () => {
      const { createServer: createViteServer } = await import('vite');
      return createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          ws: false
        },
        appType: 'spa'
      });
    })();

    vitePromise.catch((err) => {
      console.error('[CV Pro Bénin] Erreur initialisation Vite dev:', err);
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[CV Pro Bénin] Serveur actif sur http://0.0.0.0:${port} (stockage: ${db.getMode()})`);
  });
}

startServer().catch((err) => {
  console.error('[CV Pro Bénin] Échec critique au démarrage du serveur:', err);
  process.exit(1);
});
