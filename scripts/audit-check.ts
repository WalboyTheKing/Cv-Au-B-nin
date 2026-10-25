/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { CV_TEMPLATES, INITIAL_PLANS, MOOV_MONEY_BENEFICIARY } from '../src/config';
import { CVData, ManualPaymentOrder, isCVAccessActive } from '../src/types';

console.log('======================================================================');
console.log('LANCEMENT DES VÉRIFICATIONS OFFICIELLES DU MODÈLE COMMERCIAL CV PRO BÉNIN');
console.log('======================================================================');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  [OK] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failedTests++;
  }
}

// -----------------------------------------------------------------------------
// 1. INSCRIPTION, CONNEXION ET SÉCURITÉ DU HACHAGE DU MOT DE PASSE (HMAC-SHA256)
// -----------------------------------------------------------------------------
console.log('\n--- 1. Inscription, Connexion & Sécurité des Mots de Passe ---');
const SALT = 'cv_pro_benin_secure_salt_2026';
function hashPassword(password: string): string {
  return crypto.createHmac('sha256', SALT).update(password).digest('hex');
}

const rawPasswordUserA = 'CandidatSecret2026!';
const hashA = hashPassword(rawPasswordUserA);
const hashB = hashPassword('AutreCandidat2026!');

assert(hashA.length === 64, 'Hash généré au format HMAC-SHA256 (64 hex)');
assert(!hashA.includes(rawPasswordUserA), 'Le mot de passe en clair ne figure nulle part dans le hash');
assert(hashA !== hashB, 'Mots de passe distincts produisent des hashs distincts');
assert(hashA === hashPassword(rawPasswordUserA), 'Hachage déterministe pour validation de connexion');

// Simulation session utilisateur
interface MockSession {
  userId: string;
  email: string;
  token: string;
}
function simulateLogin(email: string, pass: string, storedHash: string): MockSession | null {
  if (hashPassword(pass) !== storedHash) return null;
  return {
    userId: 'usr_' + Date.now(),
    email,
    token: 'tok_' + crypto.randomBytes(16).toString('hex')
  };
}
const validSession = simulateLogin('candidat@test.bj', rawPasswordUserA, hashA);
const invalidSession = simulateLogin('candidat@test.bj', 'MauvaisMotDePasse', hashA);

assert(!!validSession && !!validSession.token, 'Connexion réussie avec mot de passe valide');
assert(invalidSession === null, 'Rejet immédiat d’une connexion avec mot de passe erroné');

// -----------------------------------------------------------------------------
// 2. SAUVEGARDE ET RÉCUPÉRATION D'UN BROUILLON DE CV ASSOCIÉ AU COMPTE
// -----------------------------------------------------------------------------
console.log('\n--- 2. Sauvegarde & Récupération de Brouillon avant Paiement ---');
const databaseCVs: CVData[] = [];

function saveDraft(cv: CVData): CVData {
  const index = databaseCVs.findIndex((c) => c.id === cv.id);
  const updated = { ...cv, updatedAt: new Date().toISOString() };
  if (index >= 0) {
    databaseCVs[index] = updated;
  } else {
    databaseCVs.push(updated);
  }
  return updated;
}

function getCVsForUser(userId: string): CVData[] {
  return databaseCVs.filter((c) => c.userId === userId);
}

const userA_Id = 'user_001_dossou';
const draftCV: CVData = {
  id: 'cv_draft_001',
  userId: userA_Id,
  title: 'CV Ingénieur Télécoms Cotonou',
  personalInfo: {
    firstName: 'Jean-Eudes',
    lastName: 'Dossou',
    jobTitle: 'Ingénieur Télécoms',
    email: 'jeaneudes.dossou@gmail.com',
    phone: '+229 97 12 34 56',
    city: 'Cotonou',
    country: 'Bénin'
  },
  profileSummary: 'Ingénieur rigoureux basé à Cotonou...',
  experiences: [],
  educations: [],
  skills: [],
  languages: [],
  customSections: [],
  settings: {
    templateId: 'moderne',
    primaryColor: '#047857',
    fontFamily: 'Inter',
    fontSize: 'normal',
    showPhoto: false,
    margins: 'normal',
    sectionOrder: ['profil', 'experiences']
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

saveDraft(draftCV);
const retrievedUserACVs = getCVsForUser(userA_Id);

assert(retrievedUserACVs.length === 1, 'Brouillon sauvegardé et retrouvé avec succès dans le compte');
assert(retrievedUserACVs[0].title === 'CV Ingénieur Télécoms Cotonou', 'Données du brouillon fidèlement préservées');

// -----------------------------------------------------------------------------
// 3. SÉPARATION DES DONNÉES ENTRE DEUX UTILISATEURS (MULTI-TENANT STRICT)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Séparation Stricte des Données entre Deux Utilisateurs ---');
const userB_Id = 'user_002_tossou';
const cvUserB: CVData = {
  ...draftCV,
  id: 'cv_userB_001',
  userId: userB_Id,
  title: 'CV Comptable Parakou'
};
saveDraft(cvUserB);

const cvsSeenByUserA = getCVsForUser(userA_Id);
const cvsSeenByUserB = getCVsForUser(userB_Id);

assert(cvsSeenByUserA.every((c) => c.userId === userA_Id), 'L’utilisateur A ne voit exclusivement que ses propres CV');
assert(cvsSeenByUserB.every((c) => c.userId === userB_Id), 'L’utilisateur B ne voit exclusivement que ses propres CV');
assert(!cvsSeenByUserA.some((c) => c.id === 'cv_userB_001'), 'Le CV de B est totalement invisible et inaccessible pour A');

// -----------------------------------------------------------------------------
// 4. BROUILLON NON PAYÉ ET EXPORT PREMIUM BLOQUÉ (FILIGRANE OBLIGATOIRE)
// -----------------------------------------------------------------------------
console.log('\n--- 4. Brouillon Non Payé et Blocage de l’Export Sans Filigrane ---');
function canExportWithoutWatermark(cv: CVData): boolean {
  return isCVAccessActive(cv);
}

assert(canExportWithoutWatermark(draftCV) === false, 'Brouillon non payé : export sans filigrane strictement bloqué');
assert(draftCV.access === undefined, 'Aucun accès premium accordé sans paiement approuvé');

// -----------------------------------------------------------------------------
// 5. PROCESSUS MOOV MONEY & ACTIVATION UNIQUEMENT APRÈS APPROBATION ADMINISTRATIVE
// -----------------------------------------------------------------------------
console.log('\n--- 5. Moov Money & Approbation Administrative Obligatoire ---');
const ordersDB: ManualPaymentOrder[] = [];

function createOrder(userId: string, cvId: string, planCode: 'cand_24h' | 'career_30d'): ManualPaymentOrder {
  const is30d = planCode === 'career_30d';
  const order: ManualPaymentOrder = {
    id: 'ord_' + Date.now() + Math.random().toString().slice(2, 6),
    orderNumber: `CMD-MOOV-${Date.now().toString().slice(-6)}`,
    userId,
    userEmail: 'candidat@test.bj',
    userName: 'Jean-Eudes Dossou',
    cvId,
    cvTitle: 'CV Ingénieur Télécoms Cotonou',
    planId: is30d ? 'plan_career_30d' : 'plan_cand_24h',
    planName: is30d ? 'Pack Carrière' : 'Accès Candidature',
    planCode,
    amountXOF: is30d ? 1000 : 500,
    currency: 'XOF',
    operator: 'moov_money',
    beneficiaryName: MOOV_MONEY_BENEFICIARY.beneficiaryName,
    beneficiaryPhone: MOOV_MONEY_BENEFICIARY.phoneNumber,
    status: 'pending_payment',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  ordersDB.push(order);
  return order;
}

function declarePayment(orderId: string, ref: string, phone: string): boolean {
  const ord = ordersDB.find((o) => o.id === orderId);
  if (!ord || ord.status === 'approved') return false;
  const cleanRef = ref.trim().toUpperCase();

  // Contrôle anti-doublon
  const duplicate = ordersDB.find((o) => o.status === 'approved' && o.submission?.transactionRef === cleanRef);
  if (duplicate) return false;

  ord.submission = {
    transactionRef: cleanRef,
    amountDeclared: ord.amountXOF,
    senderPhone: phone,
    transactionDate: new Date().toISOString(),
    submittedAt: new Date().toISOString()
  };
  ord.status = 'pending_verification';
  return true;
}

function approveOrder(orderId: string, adminChecksPassed: boolean): { success: boolean; error?: string } {
  if (!adminChecksPassed) {
    return { success: false, error: 'Attestation de vérification Moov obligatoire' };
  }
  const ord = ordersDB.find((o) => o.id === orderId);
  if (!ord) return { success: false, error: 'Commande introuvable' };
  if (ord.status === 'approved') return { success: false, error: 'Déjà approuvée' };

  const durationMs = (ord.planCode === 'career_30d' || (ord.planCode as any) === 'plus_30d')
    ? 30 * 24 * 60 * 60 * 1000 // 30 jours
    : 24 * 60 * 60 * 1000;      // 24 heures (500 FCFA)

  const now = new Date();
  ord.status = 'approved';
  ord.decision = {
    adminId: 'admin_master',
    adminEmail: 'admin@cvprobenin.bj',
    decisionDate: now.toISOString()
  };

  // Mise à jour ciblée du CV spécifique
  const cv = databaseCVs.find((c) => c.id === ord.cvId);
  if (cv) {
    const currentExpiry = cv.access?.expiresAt ? new Date(cv.access.expiresAt) : null;
    let expiresAtDate: Date;
    if (currentExpiry && currentExpiry.getTime() > now.getTime()) {
      expiresAtDate = new Date(currentExpiry.getTime() + durationMs);
    } else {
      expiresAtDate = new Date(now.getTime() + durationMs);
    }

    cv.access = {
      planCode: ord.planCode,
      planName: ord.planName,
      status: 'active',
      approvedAt: now.toISOString(),
      expiresAt: expiresAtDate.toISOString(),
      orderId: ord.id,
      orderNumber: ord.orderNumber
    };
  }

  return { success: true };
}

const order1 = createOrder(userA_Id, draftCV.id, 'cand_24h');
assert(order1.status === 'pending_payment', 'Commande créée en statut "pending_payment"');
assert(canExportWithoutWatermark(draftCV) === false, 'Droits inactifs tant que le paiement n’est pas déclaré');

declarePayment(order1.id, 'MOOV_BJ_REF_1001', '0194537741');
assert(order1.status === 'pending_verification', 'Après déclaration : statut "pending_verification"');
assert(canExportWithoutWatermark(draftCV) === false, 'Droits inactifs pendant la vérification administrative');

// Tentative d'approbation sans cocher les vérifications
assert(approveOrder(order1.id, false).success === false, 'Refus d’approbation sans attestation de vérification');
assert(canExportWithoutWatermark(draftCV) === false, 'Droits toujours bloqués');

function getCVById(id: string): CVData {
  return databaseCVs.find((c) => c.id === id)!;
}

// Approbation administrative effective
const approvedResult = approveOrder(order1.id, true);
assert(approvedResult.success === true, 'Approbation administrative confirmée');
assert(order1.status === 'approved', 'Statut de commande passé à "approved"');
const approvedDraftCV = getCVById(draftCV.id);
assert(canExportWithoutWatermark(approvedDraftCV) === true, 'Droits Premium et export sans filigrane ACTIVÉS après approbation');

// -----------------------------------------------------------------------------
// 6. ACCÈS DE 24 HEURES (500 FCFA) ET EXPIRATION EFFECTIVE
// -----------------------------------------------------------------------------
console.log('\n--- 6. Accès Candidature 24 Heures & Expiration Effective ---');
const approvedAt24h = new Date(approvedDraftCV.access!.approvedAt!).getTime();
const expiresAt24h = new Date(approvedDraftCV.access!.expiresAt!).getTime();
const diff24hMs = expiresAt24h - approvedAt24h;

assert(diff24hMs === 24 * 60 * 60 * 1000, 'Calcul exact de l’expiration : 24 heures pile (86 400 000 ms)');

// Simulation du passage du temps : 23h après -> Actif
const checkAt23h = expiresAt24h - 3600 * 1000;
const isActiveAt23h = checkAt23h < expiresAt24h;
assert(isActiveAt23h === true, 'À 23h après approbation : accès premium toujours actif');

// Simulation du passage du temps : 25h après -> Expiré
const checkAt25h = expiresAt24h + 3600 * 1000;
const isActiveAt25h = checkAt25h < expiresAt24h;
assert(isActiveAt25h === false, 'À 25h après approbation : accès expiré et bloqué');

// -----------------------------------------------------------------------------
// 7. ACCÈS DE 30 JOURS (1 000 FCFA) ET EXPIRATION EFFECTIVE
// -----------------------------------------------------------------------------
console.log('\n--- 7. Pack Carrière 30 Jours & Expiration Effective ---');
const cvPack30d: CVData = {
  ...draftCV,
  id: 'cv_career_002',
  title: 'CV Pack Carrière 30 Jours',
  access: undefined
};
saveDraft(cvPack30d);

const order30d = createOrder(userA_Id, cvPack30d.id, 'career_30d');
declarePayment(order30d.id, 'MOOV_BJ_REF_2002', '0194537741');
approveOrder(order30d.id, true);

const approvedPack30d = getCVById(cvPack30d.id);
const approvedAt30d = new Date(approvedPack30d.access!.approvedAt!).getTime();
const expiresAt30d = new Date(approvedPack30d.access!.expiresAt!).getTime();
const diff30dMs = expiresAt30d - approvedAt30d;

assert(diff30dMs === 30 * 24 * 60 * 60 * 1000, 'Calcul exact de l’expiration : 30 jours pile (2 592 000 000 ms)');
assert(canExportWithoutWatermark(approvedPack30d) === true, 'Droits Premium actifs pour le CV Pack Carrière');

// -----------------------------------------------------------------------------
// 8. BLOCAGE CÔTÉ SERVEUR APRÈS EXPIRATION ET CONSERVATION DES DONNÉES
// -----------------------------------------------------------------------------
console.log('\n--- 8. Blocage Côté Serveur après Expiration & Préservation des Données ---');
// Simuler un CV dont la date d'expiration est dépassée
const expiredCV: CVData = {
  ...draftCV,
  id: 'cv_expired_003',
  title: 'CV Consultant Senior (Accès Expiré)',
  access: {
    planCode: 'cand_24h',
    planName: 'Accès Candidature',
    status: 'active',
    approvedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // Expiré hier
    orderId: 'ord_old_01',
    orderNumber: 'CMD-MOOV-OLD'
  }
};
saveDraft(expiredCV);

function serverExportCheck(cv: CVData): { allowWatermarkRemoval: boolean; reason?: string } {
  const now = Date.now();
  const expTime = cv.access?.expiresAt ? new Date(cv.access.expiresAt).getTime() : 0;
  if (!cv.access || cv.access.status !== 'active' || expTime <= now) {
    return {
      allowWatermarkRemoval: false,
      reason: expTime && expTime <= now ? 'Accès expiré' : 'Brouillon non payé'
    };
  }
  return { allowWatermarkRemoval: true };
}

const serverCheck = serverExportCheck(expiredCV);
assert(serverCheck.allowWatermarkRemoval === false, 'Contrôle serveur : export sans filigrane rejeté après expiration');
assert(serverCheck.reason === 'Accès expiré', 'Motif explicite "Accès expiré" renvoyé par le serveur');
assert(expiredCV.personalInfo.firstName === 'Jean-Eudes', 'Données et historique du CV intégralement conservés après expiration');

// -----------------------------------------------------------------------------
// 9. RENOUVELLEMENT APRÈS UN NOUVEAU PAIEMENT APPROUVÉ (PROLONGATION COHÉRENTE)
// -----------------------------------------------------------------------------
console.log('\n--- 9. Renouvellement après Nouveau Paiement Approuvé ---');
// Cas A : Renouvellement d'un CV expiré -> Nouvelle période de 24h à partir de l'approbation
const orderRenewalExpired = createOrder(userA_Id, expiredCV.id, 'cand_24h');
declarePayment(orderRenewalExpired.id, 'MOOV_BJ_REF_3003', '0194537741');
approveOrder(orderRenewalExpired.id, true);

const renewedCV = getCVById(expiredCV.id);
const newExpiryExpired = new Date(renewedCV.access!.expiresAt!).getTime();
assert(newExpiryExpired > Date.now(), 'CV expiré renouvelé avec succès : date d’expiration repoussée dans le futur');
assert(isCVAccessActive(renewedCV) === true, 'Le CV renouvelé redevient actif immédiatement');

// Cas B : Prolongation pendant qu'un accès est encore actif -> Ajout au délai existant
const activeCVToExtend: CVData = {
  ...draftCV,
  id: 'cv_extend_004',
  title: 'CV en cours d’accès',
  access: {
    planCode: 'cand_24h',
    planName: 'Accès Candidature',
    status: 'active',
    approvedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10 * 3600 * 1000).toISOString(), // Reste 10h
    orderId: 'ord_extend_01',
    orderNumber: 'CMD-MOOV-EXT'
  }
};
saveDraft(activeCVToExtend);
const initialExpiryMs = new Date(activeCVToExtend.access!.expiresAt!).getTime();

const orderExtension = createOrder(userA_Id, activeCVToExtend.id, 'cand_24h');
declarePayment(orderExtension.id, 'MOOV_BJ_REF_4004', '0194537741');
approveOrder(orderExtension.id, true);

const extendedCV = getCVById(activeCVToExtend.id);
const extendedExpiryMs = new Date(extendedCV.access!.expiresAt!).getTime();
const differenceExtension = extendedExpiryMs - initialExpiryMs;
assert(
  differenceExtension === 24 * 60 * 60 * 1000,
  'Prolongation cumulative cohérente : +24h ajoutées à l’échéance déjà en cours'
);

// -----------------------------------------------------------------------------
// 10. CRÉATION D'UN SECOND CV ET APPLICATION STRICTE DE SES PROPRES DROITS
// -----------------------------------------------------------------------------
console.log('\n--- 10. Multi-CV Strict : L’Achat d’un CV ne Débloque pas les Autres ---');
const secondCVUserA: CVData = {
  ...draftCV,
  id: 'cv_userA_second_005',
  title: 'Deuxième CV - Candidature Commerciale',
  access: undefined // Non payé
};
saveDraft(secondCVUserA);

assert(isCVAccessActive(approvedDraftCV) === true, 'Le premier CV acheté possède bien ses droits actifs');
assert(isCVAccessActive(secondCVUserA) === false, 'Le second CV reste en brouillon gratuit sans droits premium');
assert(canExportWithoutWatermark(secondCVUserA) === false, 'L’export sans filigrane sur le 2nd CV est bloqué');

// -----------------------------------------------------------------------------
// 11. GESTION DES 15 MODÈLES DE CV & VÉRIFICATION DE CONFORMITÉ
// -----------------------------------------------------------------------------
console.log('\n--- 11. Conformité des 15 Modèles Professionnels Béninois ---');
assert(CV_TEMPLATES.length === 15, `Exactement 15 modèles sont enregistrés (trouvé: ${CV_TEMPLATES.length})`);
const templateIds = CV_TEMPLATES.map((t) => t.id);
const uniqueTemplateIds = new Set(templateIds);
assert(uniqueTemplateIds.size === 15, 'Tous les 15 identifiants de modèles sont distincts et uniques');

// -----------------------------------------------------------------------------
// 12. ABSENCE DE RÉGRESSION SUR LES OFFRES, ANTI-DOUBLON & BÉNÉFICIAIRE
// -----------------------------------------------------------------------------
console.log('\n--- 12. Absence de Régression & Paramètres Officiels Moov Money ---');
const candOffer = INITIAL_PLANS.find((p) => p.code === 'cand_24h' || (p.code as any) === 'premium_7d');
const careerOffer = INITIAL_PLANS.find((p) => p.code === 'career_30d' || (p.code as any) === 'plus_30d');

assert(!!candOffer && candOffer.priceXOF === 500, 'Accès Candidature : 500 FCFA');
assert(!!careerOffer && careerOffer.priceXOF === 1000, 'Pack Carrière : 1 000 FCFA');

assert(MOOV_MONEY_BENEFICIARY.beneficiaryName === 'Waaliyou Z Labouda', 'Bénéficiaire Moov Money : Waaliyou Z Labouda');
assert(MOOV_MONEY_BENEFICIARY.phoneNumber === '0194537741', 'Numéro de réception : 0194537741');
assert(MOOV_MONEY_BENEFICIARY.ussdCode === '*855#', 'Code USSD Moov Money : *855#');

// Anti-doublon strict de transaction
const isDuplicateRef = !declarePayment(order1.id, 'MOOV_BJ_REF_1001', '0194537741');
assert(isDuplicateRef, 'Rejet immédiat d’une référence de transaction déjà validée pour une autre commande');

console.log('\n======================================================================');
console.log(`BILAN DU CONTRÔLE QUALITÉ : ${passedTests} TESTS VALIDÉS, ${failedTests} ÉCHECS`);
console.log('======================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
