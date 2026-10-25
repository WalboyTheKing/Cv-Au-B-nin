/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { APP_CONFIG, INITIAL_PLANS, CV_TEMPLATES, MOOV_MONEY_BENEFICIARY } from '../config';
import {
  AdminMetrics,
  AuditLog,
  CVData,
  ManualPaymentOrder,
  PaymentDecision,
  PaymentSubmission,
  PaymentTransaction,
  Plan,
  TemplateDefinition,
  UserProfile,
  UserSubscription
} from '../types';

const PREFIX = APP_CONFIG.storageKeyPrefix;

export const INITIAL_DEMO_CV: CVData = {
  id: 'cv_demo_01',
  title: 'CV Ingénieur Logiciel - Cotonou',
  personalInfo: {
    firstName: 'Jean-Eudes',
    lastName: 'DOSSOU',
    jobTitle: 'Ingénieur Concepteur Logiciel & Développeur Full-Stack',
    email: 'jeaneudes.dossou@gmail.com',
    phone: '+229 97 12 34 56',
    city: 'Cotonou',
    country: 'Bénin',
    address: 'Haie Vive, Cotonou',
    linkedIn: 'linkedin.com/in/jeaneudes-dossou',
    website: 'https://jeaneudes-dev.bj',
    nationality: 'Béninoise'
  },
  profileSummary:
    "Ingénieur logiciel rigoureux diplômé de l'Institut de Formation et de Recherche en Informatique (IFRI - UAC). Spécialisé dans le développement d'applications web d'entreprise avec React, TypeScript, Node.js et PostgreSQL. Expérimenté dans la digitalisation des processus administratifs et bancaires en Afrique de l'Ouest, avec une attention particulière portée à la sécurité et à l'expérience utilisateur.",
  experiences: [
    {
      id: 'exp_01',
      role: 'Lead Développeur Full-Stack',
      company: 'Digital Solutions Bénin SARL',
      city: 'Cotonou',
      country: 'Bénin',
      startDate: '2023-01',
      endDate: '',
      current: true,
      description:
        "Supervision technique de l'équipe de développement (5 ingénieurs). Conception et mise en production d'une plateforme SaaS de gestion commerciale et facturation électronique conforme aux normes de la Direction Générale des Impôts (DGI Bénin). Intégration de solutions de paiement automatisées MTN Mobile Money et Moov Money.",
      achievements: [
        "Réduction de 40% du temps de traitement des commandes clients.",
        "Plus de 50 millions de FCFA de transactions traitées sans incident de sécurité.",
        "Mise en place de tests automatisés et déploiement continu CI/CD."
      ]
    },
    {
      id: 'exp_02',
      role: 'Développeur Web & Mobile',
      company: 'Innovatech West Africa',
      city: 'Abomey-Calavi',
      country: 'Bénin',
      startDate: '2021-06',
      endDate: '2022-12',
      current: false,
      description:
        "Développement d'interfaces responsives avec React et Tailwind CSS. Création d'APIs REST sous Node.js Express et optimisation des requêtes de bases de données relationnelles PostgreSQL. Participation active aux cérémonies agiles Scrum.",
      achievements: [
        "Développement de 8 modules applicatifs livrés dans les délais impartis.",
        "Amélioration des performances de chargement de 35% sur connexions mobiles 3G/4G."
      ]
    }
  ],
  educations: [
    {
      id: 'edu_01',
      degree: 'Master Professionnel en Génie Logiciel & Systèmes d’Information',
      institution: "Institut de Formation et de Recherche en Informatique (IFRI - UAC)",
      city: 'Abomey-Calavi',
      country: 'Bénin',
      startDate: '2021',
      endDate: '2023',
      current: false,
      description: "Major de promotion. Mémoire de recherche sur les architectures microservices sécurisées."
    },
    {
      id: 'edu_02',
      degree: 'Licence en Informatique Fondamentale et Appliquée',
      institution: "Université d'Abomey-Calavi (FAST - UAC)",
      city: 'Abomey-Calavi',
      country: 'Bénin',
      startDate: '2018',
      endDate: '2021',
      current: false,
      description: "Mention Bien. Bases solides en algorithmique avancée, structures de données et réseaux."
    }
  ],
  skills: [
    { id: 'sk_01', name: 'TypeScript & JavaScript (ESNext)', category: 'dev_web', level: 5 },
    { id: 'sk_02', name: 'React.js & Next.js', category: 'dev_web', level: 5 },
    { id: 'sk_03', name: 'Node.js & Express API', category: 'dev_web', level: 4 },
    { id: 'sk_04', name: 'PostgreSQL & Drizzle/Prisma ORM', category: 'informatique', level: 4 },
    { id: 'sk_05', name: 'Tailwind CSS & UX Responsive', category: 'dev_web', level: 5 },
    { id: 'sk_06', name: 'Sécurité web & OAuth 2.0', category: 'informatique', level: 4 },
    { id: 'sk_07', name: 'Intégration Mobile Money (MTN / Moov)', category: 'informatique', level: 5 },
    { id: 'sk_08', name: 'Gestion de projet Agile / Scrum', category: 'gestion', level: 4 }
  ],
  languages: [
    { id: 'lang_01', name: 'Français', level: 'maternelle' },
    { id: 'lang_02', name: 'Fon', level: 'courant' },
    { id: 'lang_03', name: 'Anglais', level: 'professionnel' }
  ],
  customSections: [
    {
      id: 'sec_certifs',
      title: 'Certifications Professionnelles',
      type: 'certifications',
      enabled: true,
      items: [
        {
          id: 'cert_01',
          title: 'AWS Certified Cloud Practitioner',
          subtitle: 'Amazon Web Services',
          date: '2023',
          description: 'Architecture des services cloud sécurisés et scalables.'
        },
        {
          id: 'cert_02',
          title: 'Certification Cybersécurité & RGPD/Bénin APDP',
          subtitle: 'Agence des Systèmes d’Information et du Numérique (ASIN Bénin)',
          date: '2022',
          description: 'Protection des données à caractère personnel au Bénin.'
        }
      ]
    },
    {
      id: 'sec_projets',
      title: 'Projets Notables',
      type: 'projets',
      enabled: true,
      items: [
        {
          id: 'proj_01',
          title: 'Portail E-Commerce & Logistique Bénin',
          subtitle: 'Projet open-source pour PME béninoises',
          date: '2023',
          description: 'Plateforme reliant commerçants et livreurs zémidjans avec suivi GPS.'
        }
      ]
    },
    {
      id: 'sec_loisirs',
      title: 'Centres d’intérêt',
      type: 'loisirs',
      enabled: true,
      items: [
        {
          id: 'loisir_01',
          title: 'Mentor bénévole tech',
          description: 'Accompagnement de jeunes lycéens et étudiants aux métiers du numérique au Bénin.'
        },
        {
          id: 'loisir_02',
          title: 'Basketball & Lecture',
          description: 'Pratique en club à Cotonou et veille sur l’économie numérique en Afrique.'
        }
      ]
    }
  ],
  settings: {
    templateId: 'moderne',
    primaryColor: '#047857',
    fontFamily: 'Inter',
    fontSize: 'normal',
    showPhoto: false,
    margins: 'normal',
    sectionOrder: [
      'profil',
      'experiences',
      'educations',
      'skills',
      'languages',
      'certifications',
      'projets',
      'loisirs'
    ]
  },
  createdAt: '2026-10-20T08:00:00.000Z',
  updatedAt: '2026-10-24T12:00:00.000Z'
};

export const INITIAL_USER: UserProfile = {
  id: 'user_benin_demo',
  email: 'candidat.benin@gmail.com',
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
};

export const INITIAL_ADMIN: UserProfile = {
  id: 'admin_master',
  email: 'admin@cvprobenin.bj',
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
};

class StorageService {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error', e);
    }
  }

  // --- Auth & Profile ---
  getCurrentUser(): UserProfile | null {
    return this.getItem<UserProfile | null>('current_user', INITIAL_USER);
  }

  setCurrentUser(user: UserProfile | null): void {
    this.setItem('current_user', user);
  }

  getUsers(): UserProfile[] {
    return this.getItem<UserProfile[]>('users_list', [INITIAL_USER, INITIAL_ADMIN]);
  }

  saveUser(user: UserProfile): void {
    const list = this.getUsers();
    const idx = list.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      list[idx] = user;
    } else {
      list.push(user);
    }
    this.setItem('users_list', list);
    const curr = this.getCurrentUser();
    if (curr && curr.id === user.id) {
      this.setCurrentUser(user);
    }
  }

  // --- CVs ---
  private cleanCorruptedCV(c: CVData): CVData {
    if (!c) return c;
    let hasCorruption = false;
    let fn = c.personalInfo?.firstName || '';
    let ln = c.personalInfo?.lastName || '';
    let title = c.title || '';

    if (fn.includes('%PDF') || fn.includes('obj') || fn.includes('<<')) {
      fn = 'Boris Fabrice Maud';
      hasCorruption = true;
    }
    if (ln.includes('%PDF') || ln.includes('obj') || ln.includes('<<') || ln.includes('/Catalog')) {
      ln = 'DOSSOUVI';
      hasCorruption = true;
    }
    if (title.includes('%PDF') || title.includes('obj') || title.includes('<<')) {
      title = `CV Modernisé - ${fn} ${ln}`.trim();
      hasCorruption = true;
    }

    if (hasCorruption) {
      return {
        ...c,
        title,
        personalInfo: {
          ...c.personalInfo,
          firstName: fn,
          lastName: ln
        }
      };
    }
    return c;
  }

  getCVs(userId?: string): CVData[] {
    const raw = this.getItem<CVData[]>('cvs', [INITIAL_DEMO_CV]);
    const all = raw.map((c) => this.cleanCorruptedCV(c));
    if (!userId) return all;
    return all.filter((c) => !c.userId || c.userId === userId);
  }

  getCVById(id: string): CVData | null {
    const all = this.getCVs();
    return all.find((c) => c.id === id) || null;
  }

  saveCV(cv: CVData): CVData {
    const all = this.getItem<CVData[]>('cvs', [INITIAL_DEMO_CV]);
    const updated = {
      ...cv,
      updatedAt: new Date().toISOString()
    };
    const index = all.findIndex((c) => c.id === cv.id);
    if (index >= 0) {
      all[index] = updated;
    } else {
      all.unshift(updated);
    }
    this.setItem('cvs', all);
    return updated;
  }

  deleteCV(id: string): boolean {
    const all = this.getItem<CVData[]>('cvs', [INITIAL_DEMO_CV]);
    const filtered = all.filter((c) => c.id !== id);
    if (filtered.length !== all.length) {
      this.setItem('cvs', filtered);
      return true;
    }
    return false;
  }

  duplicateCV(id: string): CVData | null {
    const original = this.getCVById(id);
    if (!original) return null;
    const copy: CVData = {
      ...JSON.parse(JSON.stringify(original)),
      id: 'cv_' + Date.now(),
      title: `${original.title} (Copie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const all = this.getItem<CVData[]>('cvs', [INITIAL_DEMO_CV]);
    all.unshift(copy);
    this.setItem('cvs', all);
    return copy;
  }

  // --- Plans & Quotas ---
  getPlans(): Plan[] {
    return this.getItem<Plan[]>('plans', INITIAL_PLANS);
  }

  savePlans(plans: Plan[]): void {
    this.setItem('plans', plans);
  }

  getPlanById(id: string): Plan | undefined {
    return this.getPlans().find((p) => p.id === id);
  }

  // --- Templates ---
  getTemplates(): TemplateDefinition[] {
    return this.getItem<TemplateDefinition[]>('templates', CV_TEMPLATES);
  }

  saveTemplates(templates: TemplateDefinition[]): void {
    this.setItem('templates', templates);
  }

  // --- Payments & Subscriptions ---
  getPayments(userId?: string): PaymentTransaction[] {
    const all = this.getItem<PaymentTransaction[]>('payments', [
      {
        id: 'tx_demo_01',
        userId: 'user_benin_demo',
        planId: 'plan_free',
        planName: 'Formule Découverte',
        provider: 'mtn_momo',
        providerReference: 'MTN-BJ-INIT-001',
        amountXOF: 0,
        currency: 'XOF',
        phoneNumber: '+229 97 12 34 56',
        status: 'confirmed',
        confirmedAt: '2026-10-01T00:00:00.000Z',
        createdAt: '2026-10-01T00:00:00.000Z'
      }
    ]);
    if (!userId) return all;
    return all.filter((p) => p.userId === userId);
  }

  savePayment(payment: PaymentTransaction): void {
    const list = this.getPayments();
    const idx = list.findIndex((p) => p.id === payment.id);
    if (idx >= 0) {
      list[idx] = payment;
    } else {
      list.unshift(payment);
    }
    this.setItem('payments', list);
  }

  activateSubscription(userId: string, plan: Plan): UserSubscription {
    const now = new Date();
    const expires = new Date();
    expires.setDate(expires.getDate() + plan.durationDays);

    const subscription: UserSubscription = {
      id: 'sub_' + Date.now(),
      userId,
      planId: plan.id,
      planCode: plan.code,
      status: 'active',
      startsAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      createdAt: now.toISOString()
    };

    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.subscription = subscription;
      this.saveUser(user);
    }

    this.addAuditLog({
      actorId: userId,
      actorEmail: user ? user.email : 'inconnu',
      action: `Activation abonnement ${plan.name} (${plan.priceXOF} FCFA)`,
      resourceType: 'plan',
      resourceId: plan.id
    });

    return subscription;
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>('audit_logs', [
      {
        id: 'log_01',
        actorId: 'admin_master',
        actorEmail: 'admin@cvprobenin.bj',
        action: 'Initialisation de la plateforme CV Pro Bénin',
        resourceType: 'plan',
        resourceId: 'system',
        createdAt: '2026-10-01T00:00:00.000Z'
      }
    ]);
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): void {
    const list = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: 'log_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    list.unshift(newLog);
    this.setItem('audit_logs', list.slice(0, 100)); // Garder les 100 derniers
  }

  // --- Manual Moov Money Orders ---
  getManualOrders(userId?: string): ManualPaymentOrder[] {
    const all = this.getItem<ManualPaymentOrder[]>('manual_orders', []);
    if (!userId) return all;
    return all.filter((o) => o.userId === userId);
  }

  getManualOrderById(id: string): ManualPaymentOrder | null {
    const all = this.getManualOrders();
    return all.find((o) => o.id === id) || null;
  }

  createManualOrder(params: {
    userId: string;
    userEmail: string;
    userName: string;
    plan: Plan;
  }): ManualPaymentOrder {
    const { userId, userEmail, userName, plan } = params;
    const now = new Date().toISOString();
    const orderNumber = `CMD-MOOV-${Date.now().toString().slice(-6)}`;
    const newOrder: ManualPaymentOrder = {
      id: 'ord_' + Date.now(),
      orderNumber,
      userId,
      userEmail,
      userName,
      planId: plan.id,
      planName: plan.name,
      planCode: plan.code as 'premium_7d' | 'plus_30d',
      amountXOF: plan.priceXOF,
      currency: 'XOF',
      operator: 'moov_money',
      beneficiaryName: MOOV_MONEY_BENEFICIARY.beneficiaryName,
      beneficiaryPhone: MOOV_MONEY_BENEFICIARY.phoneNumber,
      status: 'pending_payment',
      createdAt: now,
      updatedAt: now
    };

    const all = this.getManualOrders();
    all.unshift(newOrder);
    this.setItem('manual_orders', all);

    this.addAuditLog({
      actorId: userId,
      actorEmail: userEmail,
      action: `Création commande Moov Money ${orderNumber} (${plan.priceXOF} FCFA pour ${plan.name})`,
      resourceType: 'order',
      resourceId: newOrder.id
    });

    return newOrder;
  }

  submitPaymentDeclaration(
    orderId: string,
    submission: PaymentSubmission
  ): { success: boolean; error?: string; order?: ManualPaymentOrder } {
    const all = this.getManualOrders();
    const orderIndex = all.findIndex((o) => o.id === orderId);
    if (orderIndex < 0) {
      return { success: false, error: 'Commande introuvable.' };
    }

    const order = all[orderIndex];

    if (order.status === 'approved') {
      return { success: false, error: 'Cette commande a déjà été vérifiée et approuvée.' };
    }

    // Validation de référence unique : vérifier si cette référence n'a pas déjà été utilisée par une commande validée
    const cleanRef = submission.transactionRef.trim().toUpperCase();
    if (!cleanRef) {
      return { success: false, error: 'La référence de transaction Mobile Money est obligatoire.' };
    }

    const duplicate = all.find(
      (o) =>
        o.id !== orderId &&
        o.status === 'approved' &&
        o.submission?.transactionRef.trim().toUpperCase() === cleanRef
    );

    if (duplicate) {
      return {
        success: false,
        error: `Cette référence de transaction (${cleanRef}) a déjà été utilisée et validée pour une autre commande.`
      };
    }

    order.submission = {
      ...submission,
      transactionRef: cleanRef,
      submittedAt: new Date().toISOString()
    };
    order.status = 'pending_verification';
    order.updatedAt = new Date().toISOString();

    all[orderIndex] = order;
    this.setItem('manual_orders', all);

    this.addAuditLog({
      actorId: order.userId,
      actorEmail: order.userEmail,
      action: `Déclaration de paiement reçue pour ${order.orderNumber} (Réf Moov: ${cleanRef})`,
      resourceType: 'order',
      resourceId: order.id
    });

    return { success: true, order };
  }

  approveManualOrder(
    orderId: string,
    adminId: string,
    adminEmail: string
  ): { success: boolean; error?: string; order?: ManualPaymentOrder } {
    const all = this.getManualOrders();
    const orderIndex = all.findIndex((o) => o.id === orderId);
    if (orderIndex < 0) {
      return { success: false, error: 'Commande introuvable.' };
    }

    const order = all[orderIndex];

    // Protection atomique contre les doubles approbations
    if (order.status === 'approved') {
      return { success: false, error: 'Cette commande a déjà été approuvée.' };
    }

    const plan = this.getPlanById(order.planId);
    if (!plan) {
      return { success: false, error: 'Forfait associé introuvable.' };
    }

    const now = new Date().toISOString();
    order.status = 'approved';
    order.decision = {
      adminId,
      adminEmail,
      decisionDate: now
    };
    order.updatedAt = now;

    all[orderIndex] = order;
    this.setItem('manual_orders', all);

    // Activation de l'abonnement pour l'utilisateur
    this.activateSubscription(order.userId, plan);

    // Enregistrement d'une transaction comptable confirmée
    this.savePayment({
      id: 'tx_' + order.id,
      userId: order.userId,
      planId: plan.id,
      planName: plan.name,
      provider: 'moov_money',
      providerReference: order.submission?.transactionRef || order.orderNumber,
      amountXOF: order.amountXOF,
      currency: 'XOF',
      phoneNumber: order.submission?.senderPhone || MOOV_MONEY_BENEFICIARY.phoneNumber,
      status: 'confirmed',
      confirmedAt: now,
      createdAt: order.createdAt
    });

    this.addAuditLog({
      actorId: adminId,
      actorEmail: adminEmail,
      action: `Validation administrative de la commande ${order.orderNumber} (${order.amountXOF} FCFA - Moov: ${order.submission?.transactionRef || 'N/A'})`,
      resourceType: 'order',
      resourceId: order.id
    });

    return { success: true, order };
  }

  rejectManualOrder(
    orderId: string,
    adminId: string,
    adminEmail: string,
    reason: string
  ): { success: boolean; error?: string; order?: ManualPaymentOrder } {
    const all = this.getManualOrders();
    const orderIndex = all.findIndex((o) => o.id === orderId);
    if (orderIndex < 0) {
      return { success: false, error: 'Commande introuvable.' };
    }

    const order = all[orderIndex];

    if (order.status === 'approved') {
      return { success: false, error: 'Impossible de rejeter une commande déjà approuvée et créditée.' };
    }

    const now = new Date().toISOString();
    order.status = 'rejected';
    order.decision = {
      adminId,
      adminEmail,
      decisionDate: now,
      rejectionReason: reason.trim() || 'Paiement non identifié sur le relevé Moov Money.'
    };
    order.updatedAt = now;

    all[orderIndex] = order;
    this.setItem('manual_orders', all);

    this.addAuditLog({
      actorId: adminId,
      actorEmail: adminEmail,
      action: `Rejet de la commande ${order.orderNumber} par l'administrateur (Motif : ${order.decision.rejectionReason})`,
      resourceType: 'order',
      resourceId: order.id
    });

    return { success: true, order };
  }

  // --- Admin Metrics ---
  getAdminMetrics(): AdminMetrics {
    const users = this.getUsers();
    const cvs = this.getItem<CVData[]>('cvs', [INITIAL_DEMO_CV]);
    const payments = this.getPayments();
    const confirmed = payments.filter((p) => p.status === 'confirmed');
    const totalRev = confirmed.reduce((acc, curr) => acc + curr.amountXOF, 0);
    const manualOrders = this.getManualOrders();
    const pendingOrders = manualOrders.filter((o) => o.status === 'pending_verification');

    const activeSubs = users.filter((u) => {
      if (!u.subscription || u.subscription.status !== 'active') return false;
      const exp = new Date(u.subscription.expiresAt).getTime();
      return exp > Date.now();
    }).length;

    return {
      totalUsers: users.length,
      totalCVs: cvs.length,
      activeSubscriptions: activeSubs,
      confirmedPaymentsCount: confirmed.length,
      totalRevenueXOF: totalRev,
      pendingManualOrdersCount: pendingOrders.length,
      recentPayments: payments.slice(0, 10),
      manualOrders
    };
  }
}

export const storageService = new StorageService();

