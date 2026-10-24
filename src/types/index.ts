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
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory =
  | 'tous'
  | 'debutant'
  | 'technique'
  | 'tertiaire'
  | 'moderne'
  | 'classique';

export interface TemplateDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: TemplateCategory;
  isPremium: boolean;
  isActive: boolean;
  defaultColor: string;
  recommendedFor: string[];
  layoutType: 'single-col' | 'two-col-left' | 'two-col-right' | 'top-header' | 'minimal-modern';
}

export interface Plan {
  id: string;
  name: string;
  code: 'free' | 'premium_7d' | 'plus_30d';
  priceXOF: number;
  durationDays: number;
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
  planCode: 'free' | 'premium_7d' | 'plus_30d';
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
  planId: string;
  planName: string;
  planCode: 'premium_7d' | 'plus_30d';
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
  totalCVs: number;
  activeSubscriptions: number;
  confirmedPaymentsCount: number;
  totalRevenueXOF: number;
  pendingManualOrdersCount: number;
  recentPayments: PaymentTransaction[];
  manualOrders: ManualPaymentOrder[];
}

