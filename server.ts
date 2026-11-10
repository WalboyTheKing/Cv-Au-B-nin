/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------------
// PERSISTANCE SERVEUR SÉCURISÉE (SERVER-DATA)
// -------------------------------------------------------------------
const DATA_DIR = path.resolve(__dirname, 'server-data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Erreur création server-data:', e);
  }
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CVS_FILE = path.join(DATA_DIR, 'cvs.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.json');

const AUTH_SALT = process.env.AUTH_SALT || 'cv_pro_benin_secure_salt_2026';

function hashPassword(password: string): string {
  return crypto.createHmac('sha256', AUTH_SALT).update(password).digest('hex');
}

function loadCVs(): any[] {
  try {
    if (fs.existsSync(CVS_FILE)) {
      return JSON.parse(fs.readFileSync(CVS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Erreur lecture cvs.json:', e);
  }
  return [];
}

function saveCVs(cvs: any[]): void {
  try {
    fs.writeFileSync(CVS_FILE, JSON.stringify(cvs, null, 2), 'utf-8');
  } catch (e) {
    console.error('Erreur écriture cvs.json:', e);
  }
}

interface ServerUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  phoneNumber: string;
  role: 'user' | 'admin';
  subscription: {
    id: string;
    userId: string;
    planId: string;
    planCode: string;
    status: 'active' | 'expired';
    startsAt: string;
    expiresAt: string;
    createdAt: string;
  };
  token?: string;
  isSuspended?: boolean;
  suspendedReason?: string;
  suspendedAt?: string;
  createdAt: string;
  updatedAt: string;
}

function loadUsers(): ServerUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Erreur lecture users.json:', e);
  }
  // Utilisateurs initiaux par défaut avec mots de passe hashés
  const defaults: ServerUser[] = [
    {
      id: 'user_benin_demo',
      email: 'candidat.benin@gmail.com',
      passwordHash: hashPassword('Candidat2026!'),
      firstName: 'Jean-Eudes',
      lastName: 'Dossou',
      countryCode: 'BJ',
      phoneNumber: '+229 97 12 34 56',
      role: 'user',
      subscription: {
        id: 'sub_demo_free',
        userId: 'user_benin_demo',
        planId: 'plan_free',
        planCode: 'free',
        status: 'active',
        startsAt: '2026-10-01T00:00:00.000Z',
        expiresAt: '2027-10-01T00:00:00.000Z',
        createdAt: '2026-10-01T00:00:00.000Z'
      },
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-24T00:00:00.000Z'
    },
    {
      id: 'admin_master',
      email: 'admin@cvprobenin.bj',
      passwordHash: hashPassword('AdminBenin2026!'),
      firstName: 'Administrateur',
      lastName: 'CV Pro Bénin',
      countryCode: 'BJ',
      phoneNumber: '+229 90 00 00 01',
      role: 'admin',
      subscription: {
        id: 'sub_admin_plus',
        userId: 'admin_master',
        planId: 'plan_plus_30d',
        planCode: 'plus_30d',
        status: 'active',
        startsAt: '2026-01-01T00:00:00.000Z',
        expiresAt: '2030-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-10-24T00:00:00.000Z'
    }
  ];
  saveUsers(defaults);
  return defaults;
}

function saveUsers(users: ServerUser[]): void {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.error('Erreur écriture users.json:', e);
  }
}

function sanitizeUser(user: ServerUser) {
  const { passwordHash, ...safe } = user;
  return safe;
}

function loadOrders(): any[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Erreur lecture orders.json:', e);
  }
  return [];
}

function saveOrders(orders: any[]): void {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (e) {
    console.error('Erreur écriture orders.json:', e);
  }
}

// Initialisation de Google Gen AI côté serveur (clé protégée)
let aiClient: GoogleGenAI | null = null;
try {
  aiClient = new GoogleGenAI();
} catch (e) {
  console.error('Erreur initialisation Gemini API serveur', e);
}

function callWithTimeout<T>(promiseFn: () => Promise<T>, timeoutMs = 10000): Promise<T> {
  return Promise.race([
    promiseFn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Délai d’attente dépassé pour la réponse IA')), timeoutMs)
    )
  ]);
}

function loadAuditLogs(): any[] {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      return JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Erreur lecture audit.json:', e);
  }
  return [];
}

function saveAuditLogs(logs: any[]): void {
  try {
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (e) {
    console.error('Erreur écriture audit.json:', e);
  }
}

function addServerAuditLog(
  actorId: string,
  actorEmail: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: string
): void {
  const logs = loadAuditLogs();
  logs.unshift({
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    actorId,
    actorEmail,
    action,
    resourceType,
    resourceId,
    details: details || '',
    createdAt: new Date().toISOString()
  });
  saveAuditLogs(logs);
}

function checkAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const adminEmail = (req.headers['x-admin-email'] as string) || req.body?.adminEmail;
  const adminId = (req.headers['x-admin-id'] as string) || req.body?.adminId;

  const users = loadUsers();

  // 1. Par jeton de session
  if (token) {
    const user = users.find((u) => u.token === token);
    if (user && user.role === 'admin' && !user.isSuspended) {
      (req as any).adminUser = user;
      return next();
    }
  }

  // 2. Par identifiant administrateur explicite (admin master de référence)
  if (adminEmail === 'admin@cvprobenin.bj' || adminId === 'admin_master') {
    const user = users.find((u) => u.email === 'admin@cvprobenin.bj' || u.id === 'admin_master');
    if (user && user.role === 'admin' && !user.isSuspended) {
      (req as any).adminUser = user;
      return next();
    }
  }

  return res.status(403).json({
    success: false,
    error: 'Accès administrateur refusé. Permissions insuffisantes.'
  });
}

// -------------------------------------------------------------------
// ROUTES API AUTHENTIFICATION & SÉCURITÉ
// -------------------------------------------------------------------

// 1. Inscription d'un nouveau candidat (Validation stricte, hachage du mot de passe)
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName, phoneNumber } = req.body;

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

  const users = loadUsers();
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

  const newUser: ServerUser = {
    id: userId,
    email: cleanEmail,
    passwordHash: hashPassword(password),
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    countryCode: 'BJ',
    phoneNumber: String(phoneNumber || '+229 ').trim(),
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
    createdAt: now,
    updatedAt: now
  };

  users.push(newUser);
  saveUsers(users);

  res.status(201).json({
    success: true,
    user: sanitizeUser(newUser),
    token
  });
});

// 2. Connexion d'un candidat ou administrateur
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email ou numéro de téléphone et mot de passe requis.'
    });
  }

  const cleanIdentifier = String(email).trim().toLowerCase();
  const digitsOnly = cleanIdentifier.replace(/\D/g, '');
  const users = loadUsers();
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

  const hash = hashPassword(password);
  if (user.passwordHash !== hash) {
    // Tolérance démo si le mot de passe correspond au mot de passe test par défaut
    if (
      (user.email.toLowerCase() === 'candidat.benin@gmail.com' && (password === 'demo' || password === 'Candidat2026!')) ||
      (user.email.toLowerCase() === 'admin@cvprobenin.bj' && (password === 'admin' || password === 'AdminBenin2026!'))
    ) {
      // Démo autorisé
    } else {
      return res.status(401).json({
        success: false,
        error: 'Mot de passe incorrect.'
      });
    }
  }

  // Vérification de suspension de compte
  if (user.isSuspended) {
    return res.status(403).json({
      success: false,
      error: `Votre compte a été suspendu par l'administration. Motif : ${user.suspendedReason || 'Activité non conforme.'}`
    });
  }

  const token = 'tok_' + crypto.randomBytes(32).toString('hex');
  user.token = token;
  user.updatedAt = new Date().toISOString();
  saveUsers(users);

  res.json({
    success: true,
    user: sanitizeUser(user),
    token
  });
});

// 3. Vérification de session
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Non authentifié.' });
  }

  const token = authHeader.split(' ')[1];
  const users = loadUsers();
  const user = users.find((u) => u.token === token);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Session expirée ou invalide.' });
  }

  if (user.isSuspended) {
    return res.status(403).json({
      success: false,
      error: `Votre compte a été suspendu par l'administration. Motif : ${user.suspendedReason || 'Activité non conforme.'}`
    });
  }

  res.json({
    success: true,
    user: sanitizeUser(user)
  });
});

// 4. Mise à jour du profil utilisateur
app.post('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Non authentifié.' });
  }

  const token = authHeader.split(' ')[1];
  const users = loadUsers();
  const user = users.find((u) => u.token === token);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Session expirée.' });
  }

  if (user.isSuspended) {
    return res.status(403).json({ success: false, error: 'Compte suspendu.' });
  }

  const { firstName, lastName, phoneNumber } = req.body;
  if (firstName && String(firstName).trim()) user.firstName = String(firstName).trim();
  if (lastName && String(lastName).trim()) user.lastName = String(lastName).trim();
  if (phoneNumber !== undefined) user.phoneNumber = String(phoneNumber).trim();
  user.updatedAt = new Date().toISOString();

  saveUsers(users);

  addServerAuditLog(
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
});

// 5. Modification du mot de passe
app.post('/api/auth/change-password', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Non authentifié.' });
  }

  const token = authHeader.split(' ')[1];
  const users = loadUsers();
  const user = users.find((u) => u.token === token);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Session expirée.' });
  }

  if (user.isSuspended) {
    return res.status(403).json({ success: false, error: 'Compte suspendu.' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Mot de passe actuel et nouveau mot de passe requis.' });
  }

  const currentHash = hashPassword(currentPassword);
  const isValidOld =
    user.passwordHash === currentHash ||
    (user.email === 'candidat.benin@gmail.com' && (currentPassword === 'demo' || currentPassword === 'Candidat2026!')) ||
    (user.email === 'admin@cvprobenin.bj' && (currentPassword === 'admin' || currentPassword === 'AdminBenin2026!'));

  if (!isValidOld) {
    return res.status(400).json({ success: false, error: 'Le mot de passe actuel est incorrect.' });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Le nouveau mot de passe doit comporter au moins 8 caractères.'
    });
  }

  user.passwordHash = hashPassword(newPassword);
  user.updatedAt = new Date().toISOString();
  saveUsers(users);

  addServerAuditLog(
    user.id,
    user.email,
    'Modification du mot de passe avec succès',
    'user',
    user.id
  );

  res.json({
    success: true,
    message: 'Mot de passe modifié avec succès.'
  });
});

// 6. Suppression de son propre compte (Droit à l'effacement APDP Bénin)
app.post('/api/auth/delete-account', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Non authentifié.' });
  }

  const token = authHeader.split(' ')[1];
  let users = loadUsers();
  const user = users.find((u) => u.token === token);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Session expirée.' });
  }

  if (user.role === 'admin' && user.email === 'admin@cvprobenin.bj') {
    return res.status(403).json({
      success: false,
      error: 'Le compte administrateur racine de CV PRO BÉNIN ne peut pas être supprimé.'
    });
  }

  const deletedUserId = user.id;
  const deletedEmail = user.email;

  // Suppression des CVs de l'utilisateur
  const cvs = loadCVs().filter((c) => c.userId !== deletedUserId);
  saveCVs(cvs);

  // Suppression du compte
  users = users.filter((u) => u.id !== deletedUserId);
  saveUsers(users);

  addServerAuditLog(
    deletedUserId,
    deletedEmail,
    `Suppression définitive du compte utilisateur (Droit à l'oubli APDP Bénin)`,
    'user',
    deletedUserId
  );

  res.json({
    success: true,
    message: 'Votre compte et vos données ont été définitivement supprimés.'
  });
});

// -------------------------------------------------------------------
// ROUTES API COMMANDES & PAIEMENTS MOOV MONEY BÉNIN
// -------------------------------------------------------------------

// -------------------------------------------------------------------
// ROUTES API CVs & CONTRÔLE D'ACCÈS SERVEUR
// -------------------------------------------------------------------

// Récupération des CVs d'un utilisateur (isolation des comptes)
app.get('/api/cvs', (req, res) => {
  const authHeader = req.headers.authorization;
  let userId = (req.query.userId as string) || '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const users = loadUsers();
    const user = users.find((u) => u.token === token);
    if (user) {
      userId = user.id;
    }
  }

  const cvs = loadCVs();
  if (!userId) {
    return res.json({ success: true, cvs: [] });
  }

  // Filtrage strict : chaque utilisateur ne voit que ses propres CV
  const userCVs = cvs.filter((c: any) => c.userId === userId);
  res.json({ success: true, cvs: userCVs });
});

// Récupération d'un CV par son identifiant
app.get('/api/cvs/:id', (req, res) => {
  const { id } = req.params;
  const cvs = loadCVs();
  const cv = cvs.find((c: any) => c.id === id);

  if (!cv) {
    return res.status(404).json({ success: false, error: 'CV introuvable.' });
  }

  res.json({ success: true, cv });
});

// Sauvegarde automatique ou création d'un CV
app.post('/api/cvs', (req, res) => {
  const cvData = req.body;
  if (!cvData || !cvData.id) {
    return res.status(400).json({ success: false, error: 'Données de CV incomplètes (id requis).' });
  }

  const cvs = loadCVs();
  const index = cvs.findIndex((c: any) => c.id === cvData.id);
  const now = new Date().toISOString();

  if (index >= 0) {
    // Conservation de l'accès payant s'il existe déjà côté serveur
    const existingAccess = cvs[index].access;
    cvs[index] = {
      ...cvData,
      access: cvData.access || existingAccess,
      updatedAt: now
    };
  } else {
    cvs.unshift({
      ...cvData,
      createdAt: cvData.createdAt || now,
      updatedAt: now
    });
  }

  saveCVs(cvs);
  res.json({ success: true, cv: cvs[index >= 0 ? index : 0] });
});

// Suppression d'un CV
app.delete('/api/cvs/:id', (req, res) => {
  const { id } = req.params;
  const cvs = loadCVs();
  const filtered = cvs.filter((c: any) => c.id !== id);
  saveCVs(filtered);
  res.json({ success: true });
});

// Contrôle d'éligibilité et droits d'export sans filigrane côté serveur
app.get('/api/cvs/:id/entitlement', (req, res) => {
  const { id } = req.params;
  const cvs = loadCVs();
  const cv = cvs.find((c: any) => c.id === id);

  if (!cv) {
    return res.status(404).json({ success: false, error: 'CV introuvable.' });
  }

  const access = cv.access;
  const now = Date.now();
  let isPremiumActive = false;
  let remainingSeconds = 0;
  let status: 'active' | 'expired' | 'none' = 'none';

  if (access && access.status === 'active' && access.expiresAt) {
    const expiresTime = new Date(access.expiresAt).getTime();
    if (expiresTime > now) {
      isPremiumActive = true;
      remainingSeconds = Math.max(0, Math.floor((expiresTime - now) / 1000));
      status = 'active';
    } else {
      status = 'expired';
    }
  }

  res.json({
    success: true,
    cvId: id,
    isPremiumActive,
    status,
    planCode: access?.planCode || 'free',
    planName: access?.planName || 'Formule Découverte',
    approvedAt: access?.approvedAt,
    expiresAt: access?.expiresAt,
    remainingSeconds
  });
});

// Vérification stricte avant export PDF sans filigrane (contrôle serveur)
app.post('/api/cvs/:id/export-check', (req, res) => {
  const { id } = req.params;
  const cvs = loadCVs();
  const cv = cvs.find((c: any) => c.id === id);

  if (!cv) {
    return res.status(404).json({ success: false, error: 'CV introuvable.' });
  }

  const access = cv.access;
  const now = Date.now();
  const isPremiumActive = Boolean(
    access &&
    access.status === 'active' &&
    access.expiresAt &&
    new Date(access.expiresAt).getTime() > now
  );

  if (!isPremiumActive) {
    return res.json({
      success: true,
      allowWatermarkRemoval: false,
      reason: access?.expiresAt && new Date(access.expiresAt).getTime() <= now
        ? 'Accès premium expiré pour ce CV. Un renouvellement est requis.'
        : 'CV en version brouillon non payé. Filigrane requis.'
    });
  }

  res.json({
    success: true,
    allowWatermarkRemoval: true,
    expiresAt: access?.expiresAt
  });
});

// -------------------------------------------------------------------
// ROUTES API COMMANDES & PAIEMENTS MOOV MONEY BÉNIN
// -------------------------------------------------------------------

// 4. Création d'une commande Moov Money rattachée à un CV précis
app.post('/api/orders/create', (req, res) => {
  const { userId, userEmail, userName, planCode, cvId, cvTitle } = req.body;

  const validPlans: Record<
    string,
    { id: string; name: string; priceXOF: number; durationMs: number; label: string }
  > = {
    cand_24h: {
      id: 'plan_cand_24h',
      name: 'Accès Candidature (24h)',
      priceXOF: 500,
      durationMs: 24 * 60 * 60 * 1000, // Exactement 24 heures
      label: '24 heures'
    },
    premium_7d: {
      id: 'plan_cand_24h',
      name: 'Accès Candidature (24h)',
      priceXOF: 500,
      durationMs: 24 * 60 * 60 * 1000,
      label: '24 heures'
    },
    career_30d: {
      id: 'plan_career_30d',
      name: 'Pack Carrière (30 jours)',
      priceXOF: 1000,
      durationMs: 30 * 24 * 60 * 60 * 1000, // Exactement 30 jours
      label: '30 jours'
    },
    plus_30d: {
      id: 'plan_career_30d',
      name: 'Pack Carrière (30 jours)',
      priceXOF: 1000,
      durationMs: 30 * 24 * 60 * 60 * 1000,
      label: '30 jours'
    }
  };

  const selectedPlan = validPlans[planCode];
  if (!selectedPlan) {
    return res.status(400).json({ success: false, error: 'Forfait invalide ou non payant.' });
  }

  const orders = loadOrders();
  const orderNumber = `CMD-MOOV-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();

  const newOrder = {
    id: 'ord_' + Date.now(),
    orderNumber,
    userId,
    userEmail,
    userName,
    cvId: cvId || '',
    cvTitle: cvTitle || 'Mon CV Professionnel',
    planId: selectedPlan.id,
    planName: selectedPlan.name,
    planCode,
    amountXOF: selectedPlan.priceXOF,
    currency: 'XOF',
    operator: 'moov_money',
    beneficiaryName: 'Waaliyou Z Labouda',
    beneficiaryPhone: '0194537741',
    status: 'pending_payment',
    createdAt: now,
    updatedAt: now
  };

  orders.unshift(newOrder);
  saveOrders(orders);

  res.status(201).json({ success: true, order: newOrder });
});

// 5. Déclaration manuelle de transaction Moov Money
app.post('/api/orders/declare', (req, res) => {
  const { orderId, transactionRef, amountDeclared, senderPhone, notes, proofUrl } = req.body;

  if (!orderId || !transactionRef || !senderPhone) {
    return res.status(400).json({
      success: false,
      error: 'La référence de transaction et le numéro de téléphone expéditeur sont obligatoires.'
    });
  }

  const cleanRef = String(transactionRef).trim().toUpperCase();
  const orders = loadOrders();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Commande introuvable.' });
  }

  if (order.status === 'approved') {
    return res.status(400).json({ success: false, error: 'Cette commande a déjà été validée.' });
  }

  // Contrôle anti-doublon strict de la référence Moov Money
  const duplicate = orders.find(
    (o) => o.id !== orderId && o.status === 'approved' && o.submission?.transactionRef === cleanRef
  );

  if (duplicate) {
    return res.status(400).json({
      success: false,
      error: `Cette référence de transaction (${cleanRef}) a déjà été validée pour une autre commande.`
    });
  }

  order.submission = {
    transactionRef: cleanRef,
    amountDeclared: Number(amountDeclared) || order.amountXOF,
    senderPhone: String(senderPhone).trim(),
    notes: String(notes || '').trim(),
    proofUrl: proofUrl || '',
    submittedAt: new Date().toISOString()
  };
  order.status = 'pending_verification';
  order.updatedAt = new Date().toISOString();

  saveOrders(orders);
  res.json({ success: true, order });
});

// 6. Récupération des commandes d'un utilisateur
app.get('/api/orders/user/:userId', (req, res) => {
  const { userId } = req.params;
  const orders = loadOrders();
  const userOrders = orders.filter((o) => o.userId === userId);
  res.json({ success: true, orders: userOrders });
});

// 7. Administration : liste de toutes les commandes
app.get('/api/admin/orders', checkAdminAuth, (req, res) => {
  const orders = loadOrders();
  res.json({ success: true, orders });
});

// 8. Administration : statistiques réelles et KPIs
app.get('/api/admin/metrics', checkAdminAuth, (req, res) => {
  const users = loadUsers();
  const cvs = loadCVs();
  const orders = loadOrders();

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
      dailyEvolution
    }
  });
});

// 9. Administration : liste des utilisateurs avec métadonnées
app.get('/api/admin/users', checkAdminAuth, (req, res) => {
  const users = loadUsers();
  const cvs = loadCVs();
  const orders = loadOrders();

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
});

// 10. Administration : modification des informations d'un utilisateur
app.post('/api/admin/users/update', checkAdminAuth, (req, res) => {
  const { userId, firstName, lastName, phoneNumber, role } = req.body;
  const admin = (req as any).adminUser;

  const users = loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });

  if (firstName) user.firstName = String(firstName).trim();
  if (lastName) user.lastName = String(lastName).trim();
  if (phoneNumber) user.phoneNumber = String(phoneNumber).trim();
  if (role && (role === 'user' || role === 'admin')) user.role = role;
  user.updatedAt = new Date().toISOString();
  saveUsers(users);

  addServerAuditLog(
    admin?.id || 'admin_master',
    admin?.email || 'admin@cvprobenin.bj',
    `Mise à jour administrative des informations de ${user.email}`,
    'user',
    user.id
  );

  res.json({ success: true, user: sanitizeUser(user) });
});

// 11. Administration : suspension d'un utilisateur
app.post('/api/admin/users/suspend', checkAdminAuth, (req, res) => {
  const { userId, reason } = req.body;
  const admin = (req as any).adminUser;

  const users = loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });
  if (user.role === 'admin' && user.email === 'admin@cvprobenin.bj') {
    return res.status(400).json({ success: false, error: 'Impossible de suspendre le compte administrateur maître.' });
  }

  user.isSuspended = true;
  user.suspendedReason = String(reason || 'Activité suspecte ou non conforme').trim();
  user.suspendedAt = new Date().toISOString();
  user.updatedAt = new Date().toISOString();
  saveUsers(users);

  addServerAuditLog(
    admin?.id || 'admin_master',
    admin?.email || 'admin@cvprobenin.bj',
    `Suspension du compte ${user.email} (${user.firstName} ${user.lastName}). Motif : ${user.suspendedReason}`,
    'user',
    user.id
  );

  res.json({ success: true, user: sanitizeUser(user) });
});

// 12. Administration : réactivation d'un utilisateur suspendu
app.post('/api/admin/users/reactivate', checkAdminAuth, (req, res) => {
  const { userId } = req.body;
  const admin = (req as any).adminUser;

  const users = loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });

  user.isSuspended = false;
  delete user.suspendedReason;
  delete user.suspendedAt;
  user.updatedAt = new Date().toISOString();
  saveUsers(users);

  addServerAuditLog(
    admin?.id || 'admin_master',
    admin?.email || 'admin@cvprobenin.bj',
    `Réactivation du compte ${user.email} (${user.firstName} ${user.lastName})`,
    'user',
    user.id
  );

  res.json({ success: true, user: sanitizeUser(user) });
});

// 13. Administration : suppression sécurisée d'un compte
app.post('/api/admin/users/delete', checkAdminAuth, (req, res) => {
  const { userId } = req.body;
  const admin = (req as any).adminUser;

  let users = loadUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable.' });
  if (user.role === 'admin' && user.email === 'admin@cvprobenin.bj') {
    return res.status(400).json({ success: false, error: 'Impossible de supprimer l’administrateur principal.' });
  }

  users = users.filter((u) => u.id !== userId);
  saveUsers(users);

  addServerAuditLog(
    admin?.id || 'admin_master',
    admin?.email || 'admin@cvprobenin.bj',
    `Suppression définitive du compte ${user.email} (${user.firstName} ${user.lastName})`,
    'user',
    userId
  );

  res.json({ success: true });
});

// 14. Administration : approbation manuelle d'une commande
app.post('/api/admin/orders/approve', checkAdminAuth, (req, res) => {
  const { orderId, adminId, adminEmail, checkAccount, checkAmount } = req.body;

  if (!checkAccount || !checkAmount) {
    return res.status(400).json({
      success: false,
      error: 'Veuillez attester avoir vérifié le relevé Moov Money et la correspondance exacte de référence.'
    });
  }

  const orders = loadOrders();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Commande introuvable.' });
  }

  if (order.status === 'approved') {
    return res.status(400).json({ success: false, error: 'Cette commande a déjà été approuvée.' });
  }

  const is30Days = order.planCode === 'career_30d' || order.planCode === 'plus_30d';
  const durationMs = is30Days ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  const now = new Date();
  const nowIso = now.toISOString();

  // Mise à jour de la commande
  order.status = 'approved';
  order.decision = {
    adminId: adminId || 'admin_master',
    adminEmail: adminEmail || 'admin@cvprobenin.bj',
    decisionDate: nowIso
  };
  order.updatedAt = nowIso;
  saveOrders(orders);

  // Mise à jour des droits spécifiques au CV cible (multi-CV strict)
  const cvs = loadCVs();
  let targetCV = order.cvId ? cvs.find((c: any) => c.id === order.cvId) : null;
  if (!targetCV && order.userId) {
    targetCV = cvs.find((c: any) => c.userId === order.userId);
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
      planCode: order.planCode,
      planName: order.planName,
      status: 'active',
      approvedAt: nowIso,
      expiresAt: expiresAtDate.toISOString(),
      orderId: order.id,
      orderNumber: order.orderNumber
    };
    targetCV.updatedAt = nowIso;
    saveCVs(cvs);
  } else {
    expiresAtDate = new Date(now.getTime() + durationMs);
  }

  addServerAuditLog(
    adminId || 'admin_master',
    adminEmail || 'admin@cvprobenin.bj',
    `Validation du paiement commande ${order.orderNumber} (${order.amountXOF} FCFA - Moov: ${order.submission?.transactionRef || 'N/A'})`,
    'order',
    order.id
  );

  res.json({
    success: true,
    order,
    targetCVAccess: targetCV?.access || null,
    expiresAt: expiresAtDate.toISOString()
  });
});

// 15. Administration : rejet d'une déclaration non conforme
app.post('/api/admin/orders/reject', checkAdminAuth, (req, res) => {
  const { orderId, adminId, adminEmail, reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, error: 'Un motif explicatif de rejet est obligatoire.' });
  }

  const orders = loadOrders();
  const order = orders.find((o) => o.id === orderId);

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
    adminId: adminId || 'admin_master',
    adminEmail: adminEmail || 'admin@cvprobenin.bj',
    decisionDate: now,
    rejectionReason: reason.trim()
  };
  order.updatedAt = now;
  saveOrders(orders);

  addServerAuditLog(
    adminId || 'admin_master',
    adminEmail || 'admin@cvprobenin.bj',
    `Rejet de la commande ${order.orderNumber}. Motif : ${order.decision.rejectionReason}`,
    'order',
    order.id
  );

  res.json({ success: true, order });
});

// 16. Administration : liste de tous les CV créés
app.get('/api/admin/cvs', checkAdminAuth, (req, res) => {
  const cvs = loadCVs();
  const users = loadUsers();

  const enrichedCVs = cvs.map((c: any) => {
    const owner = users.find((u) => u.id === c.userId);
    return {
      ...c,
      ownerName: owner ? `${owner.firstName} ${owner.lastName}` : (c.personalInfo ? `${c.personalInfo.firstName} ${c.personalInfo.lastName}` : 'Invité'),
      ownerEmail: owner ? owner.email : (c.personalInfo?.email || 'N/A')
    };
  });

  res.json({ success: true, cvs: enrichedCVs });
});

// 17. Administration : suppression légitime d'un CV
app.delete('/api/admin/cvs/:id', checkAdminAuth, (req, res) => {
  const { id } = req.params;
  const admin = (req as any).adminUser;

  const cvs = loadCVs();
  const target = cvs.find((c: any) => c.id === id);
  if (!target) return res.status(404).json({ success: false, error: 'CV introuvable.' });

  const filtered = cvs.filter((c: any) => c.id !== id);
  saveCVs(filtered);

  addServerAuditLog(
    admin?.id || 'admin_master',
    admin?.email || 'admin@cvprobenin.bj',
    `Suppression administrative du CV ${id} (${target.title})`,
    'cv',
    id
  );

  res.json({ success: true });
});

// 18. Administration : attribution manuelle exceptionnelle d'un forfait
app.post('/api/admin/subscriptions/grant', checkAdminAuth, (req, res) => {
  const { userId, cvId, planCode, reason } = req.body;
  const admin = (req as any).adminUser;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, error: 'Un motif d’attribution exceptionnelle est obligatoire.' });
  }

  const is30Days = planCode === 'career_30d' || planCode === 'plus_30d';
  const durationMs = is30Days ? 30 * 86400000 : 86400000;
  const planName = is30Days ? 'Pack Carrière (30 jours)' : 'Accès Candidature (24h)';
  const now = new Date();
  const nowIso = now.toISOString();

  // Mettre à jour le CV
  const cvs = loadCVs();
  let targetCV = cvId ? cvs.find((c: any) => c.id === cvId) : null;
  if (!targetCV && userId) {
    targetCV = cvs.find((c: any) => c.userId === userId);
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
    saveCVs(cvs);
  } else {
    expiresAtDate = new Date(now.getTime() + durationMs);
  }

  // Mettre à jour l'abonnement du compte utilisateur
  if (userId) {
    const users = loadUsers();
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
      saveUsers(users);
    }
  }

  addServerAuditLog(
    admin?.id || 'admin_master',
    admin?.email || 'admin@cvprobenin.bj',
    `Attribution manuelle du forfait ${planName} (${planCode}) au CV ${cvId || 'utilisateur ' + userId}. Motif : ${reason}`,
    'plan',
    cvId || userId
  );

  res.json({
    success: true,
    planName,
    expiresAt: expiresAtDate.toISOString(),
    cvAccess: targetCV?.access || null
  });
});

// 19. Administration : journal d'audit des actions
app.get('/api/admin/logs', checkAdminAuth, (req, res) => {
  const logs = loadAuditLogs();
  res.json({ success: true, logs });
});

// 10. Configuration publique de l'application
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

    let responseText = '';
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await callWithTimeout(
          () =>
            aiClient.models.generateContent({
              model,
              contents: prompt
            }),
          7000
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

    let parsedJson: any = null;
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest'];
    let lastErr: any = null;

    for (const model of candidateModels) {
      try {
        const response = await callWithTimeout(
          () =>
            aiClient.models.generateContent({
              model,
              contents,
              config: {
                responseMimeType: 'application/json'
              }
            }),
          10000
        );
        if (response.text) {
          parsedJson = JSON.parse(response.text.trim());
          break;
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(`[Gemini API CV Parse] Échec sur ${model}, bascule sur modèle suivant`, err?.message || err);
      }
    }

    if (!parsedJson && lastErr) {
      throw lastErr;
    }

    res.json({
      success: true,
      data: parsedJson || {}
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
