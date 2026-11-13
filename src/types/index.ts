/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  address?: string;
  photoUrl?: string;
  linkedIn?: string;
  website?: string;
  birthDate?: string;
  nationality?: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements?: string[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: 'informatique' | 'bureautique' | 'dev_web' | 'maintenance' | 'gestion' | 'communication' | 'vente' | 'transverse' | 'autre';
  level?: 1 | 2 | 3 | 4 | 5; // 1: Notions, 2: Débutant, 3: Intermédiaire, 4: Avancé, 5: Expert
}

export interface Language {
  id: string;
  name: string;
  level: 'notions' | 'intermediaire' | 'professionnel' | 'courant' | 'maternelle';
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
}

export interface CustomSection {
  id: string;
  title: string; // e.g. "Certifications", "Projets", "Bénévolat", "Centres d'intérêt", "Références"
  type: 'certifications' | 'projets' | 'stages' | 'benevolat' | 'loisirs' | 'references' | 'autre';
  items: CustomSectionItem[];
  enabled: boolean;
}

export interface CVSettings {
  templateId: string;
  primaryColor: string;
  fontFamily: 'Inter' | 'Merriweather' | 'Outfit' | 'Roboto' | 'Poppins';
  fontSize: 'compact' | 'normal' | 'large';
  showPhoto: boolean;
  margins: 'narrow' | 'normal' | 'relaxed';
  sectionOrder: string[];
}

export interface CVAccessEntitlement {
  planCode: 'cand_24h' | 'career_30d' | 'premium_7d' | 'plus_30d' | 'free';
  planName: string;
  status: 'active' | 'expired' | 'none';
  approvedAt?: string;
  expiresAt?: string;
  orderId?: string;
  orderNumber?: string;
}

export interface CVData {
  id: string;
  userId?: string;
  title: string;
  personalInfo: PersonalInfo;
  profileSummary: string;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
  languages: Language[];
  customSections: CustomSection[];
  settings: CVSettings;
  access?: CVAccessEntitlement;
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory =
  | 'tous'
  | 'classique'
  | 'moderne'
  | 'professionnel'
  | 'minimaliste'
  | 'elegant'
  | 'creatif'
  | 'academique'
  | 'ats';

export interface TemplateDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: TemplateCategory;
  styleLabel: string;
  characteristics: string[];
  isPremium: boolean;
  isActive: boolean;
  defaultColor: string;
  recommendedFor: string[];
  layoutType: 'single-col' | 'two-col-left' | 'two-col-right' | 'top-header' | 'minimal-modern';
}

export interface Plan {
  id: string;
  name: string;
  code: 'free' | 'cand_24h' | 'career_30d' | 'premium_7d' | 'plus_30d';
  priceXOF: number;
  durationDays: number;
  durationHours?: number;
  description: string;
  features: string[];
  quotas: {
    maxCVs: number;
    allowWatermarkRemoval: boolean;
    allowPremiumTemplates: boolean;
    allowAIWriting: boolean;
    allowDocxExport: boolean;
  };
  isActive: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  planCode: 'free' | 'cand_24h' | 'career_30d' | 'premium_7d' | 'plus_30d';
  status: 'active' | 'pending' | 'expired' | 'cancelled' | 'refunded';
  startsAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  provider: 'mtn_momo' | 'moov_money' | 'fedapay' | 'kkiapay';
  providerReference: string;
  amountXOF: number;
  currency: 'XOF';
  phoneNumber: string;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled' | 'refunded';
  confirmedAt?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  phoneNumber?: string;
  role: 'user' | 'admin';
  subscription?: UserSubscription;
  isSuspended?: boolean;
  suspendedReason?: string;
  suspendedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSubmission {
  transactionRef: string;
  amountDeclared: number;
  senderPhone: string;
  transactionDate: string;
  notes?: string;
  proofUrl?: string;
  submittedAt: string;
}

export interface PaymentDecision {
  adminId: string;
  adminEmail: string;
  decisionDate: string;
  rejectionReason?: string;
}

export interface ManualPaymentOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  cvId?: string;
  cvTitle?: string;
  planId: string;
  planName: string;
  planCode: 'cand_24h' | 'career_30d' | 'premium_7d' | 'plus_30d';
  amountXOF: number;
  currency: 'XOF';
  operator: 'moov_money';
  beneficiaryName: string;
  beneficiaryPhone: string;
  status: 'pending_payment' | 'pending_verification' | 'approved' | 'rejected';
  submission?: PaymentSubmission;
  decision?: PaymentDecision;
  createdAt: string;
  updatedAt: string;
}

export function isCVAccessActive(cv?: CVData | null): boolean {
  if (!cv || !cv.access) return false;
  if (cv.access.status !== 'active') return false;
  if (!cv.access.expiresAt) return false;
  return new Date(cv.access.expiresAt).getTime() > Date.now();
}

export interface CVPermissions {
  canCreateCV: boolean;
  canEditCV: boolean;
  canDownloadPDF: boolean;
  canDownloadCleanPDF: boolean;
  canUsePremiumFeatures: boolean;
  remainingSeconds: number;
  reason: string;
}

export function getCVPermissions(
  cv?: CVData | null,
  user?: UserProfile | null,
  userCVCount = 0,
  plans?: Plan[]
): CVPermissions {
  if (user?.isSuspended) {
    return {
      canCreateCV: false,
      canEditCV: false,
      canDownloadPDF: false,
      canDownloadCleanPDF: false,
      canUsePremiumFeatures: false,
      remainingSeconds: 0,
      reason: 'Compte suspendu par l’administration.'
    };
  }

  const now = Date.now();
  const cvExpiresMs = cv?.access?.expiresAt ? new Date(cv.access.expiresAt).getTime() : 0;
  const cvActive = Boolean(cv?.access?.status === 'active' && cvExpiresMs > now);

  const subExpiresMs = user?.subscription?.expiresAt ? new Date(user.subscription.expiresAt).getTime() : 0;
  const subPaidActive = Boolean(
    user?.subscription?.status === 'active' &&
      subExpiresMs > now &&
      user.subscription.planCode !== 'free'
  );

  const currentPlan = plans?.find((p) => p.code === (user?.subscription?.planCode || 'free'));
  const maxCVs = currentPlan?.quotas?.maxCVs ?? (subPaidActive ? 15 : 5);

  const canCreateCV = userCVCount < maxCVs;
  const canDownloadCleanPDF = cvActive || subPaidActive;
  const remainingSeconds = cvActive
    ? Math.max(0, Math.floor((cvExpiresMs - now) / 1000))
    : subPaidActive
    ? Math.max(0, Math.floor((subExpiresMs - now) / 1000))
    : 0;

  return {
    canCreateCV,
    canEditCV: true, // Les CV ne sont jamais supprimés ni verrouillés à l'édition après expiration
    canDownloadPDF: true, // Export découverte avec filigrane toujours accessible
    canDownloadCleanPDF,
    canUsePremiumFeatures: canDownloadCleanPDF,
    remainingSeconds,
    reason: canDownloadCleanPDF
      ? 'Accès premium actif : export PDF sans filigrane autorisé.'
      : cv?.access?.expiresAt && cvExpiresMs <= now
      ? 'Accès expiré : vos données et l’édition restent conservées, l’export comporte un filigrane.'
      : 'Formule Découverte : édition conservée, export PDF avec filigrane.'
  };
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  resourceType: 'user' | 'cv' | 'plan' | 'payment' | 'template' | 'order';
  resourceId: string;
  details?: string;
  createdAt: string;
}

export interface AdminMetrics {
  totalUsers: number;
  newUsersToday: number;
  newUsers7Days: number;
  newUsers30Days: number;
  activeUsersCount: number;
  suspendedUsersCount: number;
  totalCVs: number;
  totalOrders: number;
  pendingPaymentsCount: number;
  approvedPaymentsCount: number;
  rejectedPaymentsCount: number;
  totalRevenueXOF: number;
  salesByPlan: {
    cand_24h: { count: number; revenue: number };
    career_30d: { count: number; revenue: number };
  };
  dailyEvolution: {
    date: string;
    users: number;
    orders: number;
    revenue: number;
  }[];
  recentPayments: PaymentTransaction[];
  manualOrders: ManualPaymentOrder[];
}

