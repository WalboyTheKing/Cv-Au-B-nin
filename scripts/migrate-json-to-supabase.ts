/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { mapAuditToDb, mapCVToDb, mapOrderToDb, mapPaymentToDb, mapUserToDb } from '../server/db.ts';

dotenv.config();

async function migrate() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[Migration Supabase] Variables SUPABASE_URL (ou VITE_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY requises.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const dataDir = path.resolve(process.cwd(), 'server-data');
  const readJson = (name: string): any[] => {
    const p = path.join(dataDir, name);
    if (!fs.existsSync(p)) return [];
    const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  };

  const users = readJson('users.json');
  const cvs = readJson('cvs.json');
  const orders = readJson('orders.json');
  const payments = readJson('payments.json');
  const auditLogs = readJson('audit.json');

  console.log(`[Migration Supabase] Données locales détectées : ${users.length} utilisateurs, ${cvs.length} CV, ${orders.length} commandes, ${payments.length} paiements, ${auditLogs.length} logs.`);

  if (users.length > 0) {
    const { error } = await supabase.from('cvpro_users').upsert(users.map(mapUserToDb), { onConflict: 'id' });
    if (error) throw new Error(`Échec migration utilisateurs: ${error.message}`);
    console.log(`  [OK] ${users.length} utilisateurs migrés.`);
  }

  if (cvs.length > 0) {
    const { error } = await supabase.from('cvpro_cvs').upsert(cvs.map(mapCVToDb), { onConflict: 'id' });
    if (error) throw new Error(`Échec migration CVs: ${error.message}`);
    console.log(`  [OK] ${cvs.length} CVs migrés.`);
  }

  if (orders.length > 0) {
    const { error } = await supabase.from('cvpro_orders').upsert(orders.map(mapOrderToDb), { onConflict: 'id' });
    if (error) throw new Error(`Échec migration commandes: ${error.message}`);
    console.log(`  [OK] ${orders.length} commandes migrées.`);
  }

  if (payments.length > 0) {
    const { error } = await supabase.from('cvpro_payments').upsert(payments.map(mapPaymentToDb), { onConflict: 'id' });
    if (error) throw new Error(`Échec migration paiements: ${error.message}`);
    console.log(`  [OK] ${payments.length} paiements migrés.`);
  }

  if (auditLogs.length > 0) {
    const { error } = await supabase.from('cvpro_audit_logs').upsert(auditLogs.map(mapAuditToDb), { onConflict: 'id' });
    if (error) throw new Error(`Échec migration audit_logs: ${error.message}`);
    console.log(`  [OK] ${auditLogs.length} logs d'audit migrés.`);
  }

  console.log('[Migration Supabase] Migration terminée sans perte de données.');
}

migrate().catch((err) => {
  console.error('[Migration Supabase] Erreur fatale :', err?.message || err);
  process.exit(1);
});
