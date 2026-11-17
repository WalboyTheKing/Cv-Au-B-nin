/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ServerUser {
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
    status: 'active' | 'expired' | 'cancelled';
    startsAt: string;
    expiresAt: string;
    createdAt: string;
  };
  token?: string;
  tokenExpiresAt?: string;
  isSuspended?: boolean;
  suspendedReason?: string;
  suspendedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'server-data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CVS_FILE = path.join(DATA_DIR, 'cvs.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.json');

const LEGACY_AUTH_SALT = process.env.AUTH_SALT || 'cv_pro_benin_secure_salt_2026';

export function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPasswordHash(password: string, storedHash: string): { valid: boolean; needsRehash: boolean } {
  if (!storedHash) return { valid: false, needsRehash: false };

  if (storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return { valid: false, needsRehash: false };
    const [, salt, hexDigest] = parts;
    const expectedBuf = Buffer.from(hexDigest, 'hex');
    const actualBuf = crypto.scryptSync(password, salt, 64);
    if (expectedBuf.length !== actualBuf.length) return { valid: false, needsRehash: false };
    return {
      valid: crypto.timingSafeEqual(expectedBuf, actualBuf),
      needsRehash: false
    };
  }

  // Compatibilité ascendante sécurisée avec les anciens hash HMAC-SHA256 (sans aucun mot de passe en dur)
  const legacyHash = crypto.createHmac('sha256', LEGACY_AUTH_SALT).update(password).digest('hex');
  const a = Buffer.from(legacyHash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
    return { valid: true, needsRehash: true };
  }
  return { valid: false, needsRehash: false };
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonArray(filePath: string): any[] {
  try {
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error(`[DB JSON] Erreur lecture ${path.basename(filePath)}:`, err);
  }
  return [];
}

function writeJsonAtomic(filePath: string, data: any[]): void {
  ensureDataDir();
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

function buildDefaultUsers(): ServerUser[] {
  const defaultUserPass = process.env.DEFAULT_DEMO_PASSWORD || 'Candidat2026!';
  const defaultAdminPass = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminBenin2026!';
  return [
    {
      id: 'user_benin_demo',
      email: 'candidat.benin@gmail.com',
      passwordHash: hashPasswordScrypt(defaultUserPass),
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
      passwordHash: hashPasswordScrypt(defaultAdminPass),
      firstName: 'Administrateur',
      lastName: 'CV Pro Bénin',
      countryCode: 'BJ',
      phoneNumber: '+229 90 00 00 01',
      role: 'admin',
      subscription: {
        id: 'sub_admin_plus',
        userId: 'admin_master',
        planId: 'plan_career_30d',
        planCode: 'career_30d',
        status: 'active',
        startsAt: '2026-01-01T00:00:00.000Z',
        expiresAt: '2030-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-10-24T00:00:00.000Z'
    }
  ];
}

// Mapping PostgreSQL <-> App Models
function mapUserFromDb(row: any): ServerUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    countryCode: row.country_code || 'BJ',
    phoneNumber: row.phone_number || '+229 ',
    role: row.role === 'admin' ? 'admin' : 'user',
    subscription: row.subscription || {
      id: `sub_${row.id}`,
      userId: row.id,
      planId: 'plan_free',
      planCode: 'free',
      status: 'active',
      startsAt: row.created_at,
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      createdAt: row.created_at
    },
    ...(row.auth_token ? { token: row.auth_token } : {}),
    ...(row.token_expires_at ? { tokenExpiresAt: row.token_expires_at } : {}),
    isSuspended: Boolean(row.is_suspended),
    ...(row.suspended_reason ? { suspendedReason: row.suspended_reason } : {}),
    ...(row.suspended_at ? { suspendedAt: row.suspended_at } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapUserToDb(u: ServerUser): any {
  return {
    id: u.id,
    email: u.email.toLowerCase(),
    password_hash: u.passwordHash,
    first_name: u.firstName,
    last_name: u.lastName,
    country_code: u.countryCode || 'BJ',
    phone_number: u.phoneNumber || '+229 ',
    role: u.role,
    subscription: u.subscription,
    auth_token: u.token || null,
    token_expires_at: u.tokenExpiresAt || null,
    is_suspended: Boolean(u.isSuspended),
    suspended_reason: u.suspendedReason || null,
    suspended_at: u.suspendedAt || null,
    created_at: u.createdAt,
    updated_at: u.updatedAt
  };
}

function mapCVFromDb(row: any): any {
  return {
    id: row.id,
    ...(row.user_id ? { userId: row.user_id } : {}),
    title: row.title,
    personalInfo: row.personal_info || {},
    profileSummary: row.profile_summary || '',
    experiences: row.experiences || [],
    educations: row.educations || [],
    skills: row.skills || [],
    languages: row.languages || [],
    customSections: row.custom_sections || [],
    settings: row.settings || {},
    ...(row.access ? { access: row.access } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapCVToDb(cv: any): any {
  return {
    id: cv.id,
    user_id: cv.userId || null,
    title: cv.title || 'Mon CV Professionnel',
    personal_info: cv.personalInfo || {},
    profile_summary: cv.profileSummary || '',
    experiences: cv.experiences || [],
    educations: cv.educations || [],
    skills: cv.skills || [],
    languages: cv.languages || [],
    custom_sections: cv.customSections || [],
    settings: cv.settings || {},
    access: cv.access || null,
    created_at: cv.createdAt || new Date().toISOString(),
    updated_at: cv.updatedAt || new Date().toISOString()
  };
}

function mapOrderFromDb(row: any): any {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    cvId: row.cv_id,
    cvTitle: row.cv_title,
    planId: row.plan_id,
    planName: row.plan_name,
    planCode: row.plan_code,
    amountXOF: row.amount_xof,
    currency: row.currency || 'XOF',
    operator: row.operator || 'moov_money',
    beneficiaryName: row.beneficiary_name,
    beneficiaryPhone: row.beneficiary_phone,
    status: row.status,
    ...(row.submission ? { submission: row.submission } : {}),
    ...(row.decision ? { decision: row.decision } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapOrderToDb(o: any): any {
  return {
    id: o.id,
    order_number: o.orderNumber,
    user_id: o.userId,
    user_email: o.userEmail,
    user_name: o.userName,
    cv_id: o.cvId || '',
    cv_title: o.cvTitle || 'Mon CV Professionnel',
    plan_id: o.planId,
    plan_name: o.planName,
    plan_code: o.planCode,
    amount_xof: o.amountXOF,
    currency: o.currency || 'XOF',
    operator: o.operator || 'moov_money',
    beneficiary_name: o.beneficiaryName || 'Waaliyou Z Labouda',
    beneficiary_phone: o.beneficiaryPhone || '0194537741',
    status: o.status,
    submission: o.submission || null,
    decision: o.decision || null,
    created_at: o.createdAt || new Date().toISOString(),
    updated_at: o.updatedAt || new Date().toISOString()
  };
}

function mapPaymentFromDb(row: any): any {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    userId: row.user_id,
    cvId: row.cv_id,
    planId: row.plan_id,
    planName: row.plan_name,
    planCode: row.plan_code,
    provider: row.provider,
    providerReference: row.provider_reference,
    amountXOF: row.amount_xof,
    currency: row.currency || 'XOF',
    status: row.status,
    confirmedAt: row.confirmed_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
}

function mapPaymentToDb(p: any): any {
  return {
    id: p.id,
    order_id: p.orderId || null,
    order_number: p.orderNumber || '',
    user_id: p.userId,
    cv_id: p.cvId || '',
    plan_id: p.planId,
    plan_name: p.planName,
    plan_code: p.planCode,
    provider: p.provider || 'moov_money',
    provider_reference: p.providerReference,
    amount_xof: p.amountXOF,
    currency: p.currency || 'XOF',
    status: p.status || 'confirmed',
    confirmed_at: p.confirmedAt || new Date().toISOString(),
    expires_at: p.expiresAt || null,
    created_at: p.createdAt || new Date().toISOString()
  };
}

function mapAuditFromDb(row: any): any {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    details: row.details || '',
    createdAt: row.created_at
  };
}

function mapAuditToDb(a: any): any {
  return {
    id: a.id,
    actor_id: a.actorId,
    actor_email: a.actorEmail,
    action: a.action,
    resource_type: a.resourceType,
    resource_id: a.resourceId,
    details: a.details || '',
    created_at: a.createdAt || new Date().toISOString()
  };
}

class DatabaseAdapter {
  private supabase: SupabaseClient | null = null;
  private mode: 'supabase' | 'json' = 'json';
  private initialized = false;

  async init(): Promise<'supabase' | 'json'> {
    if (this.initialized) return this.mode;
    ensureDataDir();

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && serviceRoleKey) {
      try {
        const client = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
        const { error } = await client.from('cvpro_users').select('id').limit(1);
        if (!error) {
          this.supabase = client;
          this.mode = 'supabase';
          this.initialized = true;
          await this.ensureSeedUsersSupabase();
          console.log('[CV Pro Bénin] Persistance connectée à Supabase PostgreSQL (mode production).');
          return this.mode;
        }
        console.warn(
          '[CV Pro Bénin] Tables Supabase cvpro_* non trouvées (exécutez la migration 002). Bascule sécurisée sur stockage JSON atomique.',
          error.message
        );
      } catch (err: any) {
        console.warn('[CV Pro Bénin] Connexion Supabase indisponible, bascule sur JSON atomique:', err?.message);
      }
    }

    this.mode = 'json';
    this.initialized = true;
    this.ensureSeedUsersJson();
    console.log('[CV Pro Bénin] Persistance active en mode fichier JSON atomique (server-data/*.json).');
    return this.mode;
  }

  getMode(): 'supabase' | 'json' {
    return this.mode;
  }

  getSupabaseClient(): SupabaseClient | null {
    return this.supabase;
  }

  private ensureSeedUsersJson() {
    if (!fs.existsSync(USERS_FILE)) {
      writeJsonAtomic(USERS_FILE, buildDefaultUsers());
    } else {
      const existing = readJsonArray(USERS_FILE);
      if (existing.length === 0) {
        writeJsonAtomic(USERS_FILE, buildDefaultUsers());
      }
    }
  }

  private async ensureSeedUsersSupabase() {
    if (!this.supabase) return;
    const { data } = await this.supabase.from('cvpro_users').select('id').limit(1);
    if (!data || data.length === 0) {
      const defaults = buildDefaultUsers().map(mapUserToDb);
      await this.supabase.from('cvpro_users').upsert(defaults, { onConflict: 'id' });
    }
  }

  // --- USERS ---
  async getUsers(): Promise<ServerUser[]> {
    await this.init();
    if (this.mode === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('cvpro_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapUserFromDb);
    }
    return readJsonArray(USERS_FILE);
  }

  async getUserByToken(token: string): Promise<ServerUser | null> {
    await this.init();
    if (!token) return null;
    if (this.mode === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('cvpro_users')
        .select('*')
        .eq('auth_token', token)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapUserFromDb(data) : null;
    }
    const users = readJsonArray(USERS_FILE);
    return users.find((u: ServerUser) => u.token === token) || null;
  }

  async upsertUser(user: ServerUser): Promise<ServerUser> {
    await this.init();
    if (this.mode === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('cvpro_users')
        .upsert(mapUserToDb(user), { onConflict: 'id' })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapUserFromDb(data);
    }
    const users = readJsonArray(USERS_FILE);
    const idx = users.findIndex((u: ServerUser) => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    writeJsonAtomic(USERS_FILE, users);
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.init();
    if (this.mode === 'supabase' && this.supabase) {
      const { error } = await this.supabase.from('cvpro_users').delete().eq('id', userId);
      if (error) throw new Error(error.message);
      return;
    }
    const users = readJsonArray(USERS_FILE).filter((u: ServerUser) => u.id !== userId);
    writeJsonAtomic(USERS_FILE, users);
  }

  // --- CVS ---
  async getCVs(userId?: string): Promise<any[]> {
    await this.init();
    if (this.mode === 'supabase' && this.supabase) {
      let query = this.supabase.from('cvpro_cvs').select('*').order('updated_at', { ascending: false });
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []).map(mapCVFromDb);
    }
    const cvs = readJsonArray(CVS_FILE);
    return userId ? cvs.filter((c: any) => c.userId === userId) : cvs;
  }

  async getCVById(id: string): Promise<any | null> {
    await this.init();
    if (this.mode === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase.from('cvpro_cvs').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapCVFromDb(data) : null;
    }
    const cvs = readJsonArray(CVS_FILE);
    return cvs.find((c: any) => c.id === id) || null;
  }

  async upsertCV(cv: any): Promise<any> {
    await this.init();
    if (this.mode === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('cvpro_cvs')
        .upsert(mapCVToDb(cv), { onConflict: 'id' })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapCVFromDb(data);
    }
    const cvs = readJsonArray(CVS_FILE);
    const idx = cvs.findIndex((c: any) => c.id === cv.id);
    if (idx >= 0) cvs[idx] = cv;
    else cvs.unshift(cv);
    writeJsonAtomic(CVS_FILE, cvs);
    return cv;
  }

  async deleteCV(id: string): Promise<void> {
    await this.init();
    if (this.mode === 'supabase' && this.supabase) {
      const { error } = await this.supabase.from('cvpro_cvs').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }
    const cvs = readJsonArray(CVS_FILE).filter((c: any) => c.id !== id);
    writeJsonAtomic(CVS_FILE, cvs);
  }

  async deleteCVsByUser(userId: string): Promise<void> {
    await this.init();
    if (this.mode === 'supabase' && this.supabase) {
      const { error } = await this.supabase.from('cvpro_cvs').delete().eq('user_id', userId);
      if (error) throw new Error(error.message);
      return;
    }
    const cvs = readJsonArray(CVS_FILE).filter((c: any) => c.userId !== userId);
    writeJsonAtomic(CVS_FILE, cvs);
  }

  // --- ORDERS ---
  async getOrders(userId?: string): Promise<any[]> {
    await this.init();
    if (this.mode === 'supabase' && this.supabase) {
      let query = this.supabase.from('cvpro_orders').select('*').order('created_at', { ascending: false });
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []).map(mapOrderFromDb);
    }
    const orders = readJsonArray(ORDERS_FILE);
    return userId ? orders.filter((o: any) => o.userId === userId) : orders;
  }

  async getOrderById(id: string): Promise<any | null> {
    await this.init();
    if (this.mode === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase.from('cvpro_orders').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapOrderFromDb(data) : null;
    }
    const orders = readJsonArray(ORDERS_FILE);
    return orders.find((o: any) => o.id === id) || null;
  }

  async upsertOrder(order: any): Promise<any> {
    await this.init();
    if (this.mode === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('cvpro_orders')
        .upsert(mapOrderToDb(order), { onConflict: 'id' })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapOrderFromDb(data);
    }
    const orders = readJsonArray(ORDERS_FILE);
    const idx = orders.findIndex((o: any) => o.id === order.id);
    if (idx >= 0) orders[idx] = order;
    else orders.unshift(order);
    writeJsonAtomic(ORDERS_FILE, orders);
    return order;
  }

  // --- PAYMENTS ---
  async getPayments(userId?: string): Promise<any[]> {
    await this.init();
    if (this.mode === 'supabase' && this.supabase) {
      let query = this.supabase.from('cvpro_payments').select('*').order('created_at', { ascending: false });
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []).map(mapPaymentFromDb);
    }
    const payments = readJsonArray(PAYMENTS_FILE);
    return userId ? payments.filter((p: any) => p.userId === userId) : payments;
  }

  async addPayment(payment: any): Promise<any> {
    await this.init();
    if (this.mode === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('cvpro_payments')
        .insert(mapPaymentToDb(payment))
        .select()
        .single();
      if (error) throw new Error(error.message);
      return mapPaymentFromDb(data);
    }
    const payments = readJsonArray(PAYMENTS_FILE);
    payments.unshift(payment);
    writeJsonAtomic(PAYMENTS_FILE, payments);
    return payment;
  }

  // --- AUDIT LOGS ---
  async getAuditLogs(): Promise<any[]> {
    await this.init();
    if (this.mode === 'supabase' && this.supabase) {
      const { data, error } = await this.supabase
        .from('cvpro_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return (data || []).map(mapAuditFromDb);
    }
    return readJsonArray(AUDIT_FILE);
  }

  async addAuditLog(
    actorId: string,
    actorEmail: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details = ''
  ): Promise<void> {
    await this.init();
    const entry = {
      id: 'log_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      actorId,
      actorEmail,
      action,
      resourceType,
      resourceId,
      details,
      createdAt: new Date().toISOString()
    };
    if (this.mode === 'supabase' && this.supabase) {
      const { error } = await this.supabase.from('cvpro_audit_logs').insert(mapAuditToDb(entry));
      if (error) console.error('[DB Supabase] Erreur écriture audit_log:', error.message);
      return;
    }
    const logs = readJsonArray(AUDIT_FILE);
    logs.unshift(entry);
    if (logs.length > 1000) logs.length = 1000;
    writeJsonAtomic(AUDIT_FILE, logs);
  }
}

export const db = new DatabaseAdapter();
export { mapUserToDb, mapCVToDb, mapOrderToDb, mapPaymentToDb, mapAuditToDb };
