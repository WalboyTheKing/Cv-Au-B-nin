/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plan, TemplateDefinition } from '../types';

export const MOOV_MONEY_BENEFICIARY = {
  beneficiaryName: 'Waaliyou Z Labouda',
  operator: 'Moov Money Bénin',
  operatorCode: 'moov_money',
  phoneNumber: '0194537741',
  formattedPhone: '01 94 53 77 41',
  internationalPhone: '+229 01 94 53 77 41',
  ussdCode: '*855#',
  currency: 'FCFA',
  currencyCode: 'XOF',
  instructions: [
    'Composez *855# sur votre téléphone Moov Money ou ouvrez votre application Moov Money Bénin.',
    'Choisissez l’option "Transfert d’argent" vers un numéro Moov Bénin.',
    'Saisissez le numéro bénéficiaire : 0194537741.',
    'Vérifiez le nom qui s’affiche : Waaliyou Z Labouda.',
    'Indiquez le montant exact en FCFA correspondant à l’offre choisie.',
    'Confirmez avec votre code secret Mobile Money confidentiel.',
    'Conservez le SMS de confirmation contenant la référence de la transaction pour renseigner le formulaire de déclaration.'
  ]
};

export const APP_CONFIG = {
  brandName: 'CV Pro Bénin',
  tagline: 'Créez un CV professionnel qui ouvre des portes au Bénin',
  description: 'Réalisez votre CV en quelques minutes, personnalisez votre présentation et téléchargez un document prêt à accompagner vos candidatures. Une solution pensée pour les talents du Bénin.',
  currency: 'FCFA',
  currencyCode: 'XOF',
  country: 'Bénin',
  countryCode: 'BJ',
  phonePrefix: '+229',
  contactEmail: 'contact@cvprobenin.bj',
  supportPhone: '+229 01 94 53 77 41',
  storageKeyPrefix: 'cvprobenin_',
  allowedPaymentCountry: 'BJ',
  moovBeneficiary: MOOV_MONEY_BENEFICIARY,
  paymentProviders: [
    {
      id: 'moov_money',
      name: 'Moov Money Bénin (Transfert direct)',
      beneficiary: MOOV_MONEY_BENEFICIARY.beneficiaryName,
      number: MOOV_MONEY_BENEFICIARY.phoneNumber,
      ussdCode: MOOV_MONEY_BENEFICIARY.ussdCode,
      badgeColor: '#005baa',
      description: 'Transfert direct vers Waaliyou Z Labouda au 0194537741 avec validation administrative.'
    }
  ]
};

export const INITIAL_PLANS: Plan[] = [
  {
    id: 'plan_free',
    name: 'Formule Découverte',
    code: 'free',
    priceXOF: 0,
    durationDays: 365,
    description: 'Idéal pour concevoir son premier CV et tester la plateforme gratuitement.',
    features: [
      'Création d’un CV complet',
      'Accès aux 5 modèles essentiels gratuits',
      'Modification et sauvegarde automatique',
      'Prévisualisation haute fidélité en temps réel',
      'Téléchargement PDF standard (filigrane discret)',
      'Conseils de rédaction béninois'
    ],
    quotas: {
      maxCVs: 1,
      allowWatermarkRemoval: false,
      allowPremiumTemplates: false,
      allowAIWriting: false,
      allowDocxExport: false
    },
    isActive: true
  },
  {
    id: 'plan_premium_7d',
    name: 'Accès Candidature 7 Jours',
    code: 'premium_7d',
    priceXOF: 500,
    durationDays: 7,
    description: 'Parfait pour postuler intensivement à une offre d’emploi urgente.',
    features: [
      'Téléchargement PDF haute résolution sans filigrane',
      'Accès illimité aux 15 modèles professionnels & modernes',
      'Création jusqu’à 3 versions de CV différentes',
      'Palette de couleurs et polices typographiques avancées',
      'Assistance à la rédaction et reformulation',
      'Support prioritaire par WhatsApp / Mobile Money'
    ],
    quotas: {
      maxCVs: 3,
      allowWatermarkRemoval: true,
      allowPremiumTemplates: true,
      allowAIWriting: true,
      allowDocxExport: true
    },
    isActive: true
  },
  {
    id: 'plan_plus_30d',
    name: 'Pack Carrière 30 Jours',
    code: 'plus_30d',
    priceXOF: 1000,
    durationDays: 30,
    description: 'La solution complète pour chercheurs d’emploi actifs et consultants.',
    features: [
      'Téléchargements illimités de PDF haute définition',
      'Tous les 15 modèles sans aucune restriction',
      'Jusqu’à 10 CV personnalisés (postes différents)',
      'Assistance IA complète pour résumés et compétences',
      'Module de duplication et déclinaison rapide',
      'Aucun renouvellement automatique surprise',
      'Reçu de paiement officiel en FCFA'
    ],
    quotas: {
      maxCVs: 10,
      allowWatermarkRemoval: true,
      allowPremiumTemplates: true,
      allowAIWriting: true,
      allowDocxExport: true
    },
    isActive: true
  }
];

export const CV_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'classique',
    name: 'Classique Institutionnel',
    slug: 'classique',
    description: 'Mise en page sobre et conventionnelle, idéale pour les concours administratifs, banques et ministères.',
    category: 'classique',
    isPremium: false,
    isActive: true,
    defaultColor: '#1e3a8a', // Bleu marine
    recommendedFor: ['Administration', 'Banque', 'Enseignement', 'Concours'],
    layoutType: 'single-col'
  },
  {
    id: 'moderne',
    name: 'Moderne Dynamique',
    slug: 'moderne',
    description: 'Bandeau latéral coloré élégant avec mise en relief des coordonnées, compétences et langues.',
    category: 'moderne',
    isPremium: false,
    isActive: true,
    defaultColor: '#047857', // Vert émeraude
    recommendedFor: ['Commerce', 'Communication', 'Management', 'Tertiaire'],
    layoutType: 'two-col-left'
  },
  {
    id: 'minimaliste',
    name: 'Minimaliste Épuré',
    slug: 'minimaliste',
    description: 'Design aéré focalisé sur la lisibilité des textes et l’impact direct des compétences.',
    category: 'moderne',
    isPremium: false,
    isActive: true,
    defaultColor: '#334155', // Ardoise
    recommendedFor: ['Consulting', 'Juridique', 'Santé', 'ONG'],
    layoutType: 'single-col'
  },
  {
    id: 'premier_emploi',
    name: 'Premier Emploi Tremplin',
    slug: 'premier-emploi',
    description: 'Spécialement agencé pour mettre en valeur les compétences et projets des jeunes diplômés.',
    category: 'debutant',
    isPremium: false,
    isActive: true,
    defaultColor: '#0284c7', // Bleu ciel
    recommendedFor: ['Nouveaux diplômés', 'Assistants débutants', 'Techniciens juniors'],
    layoutType: 'two-col-left'
  },
  {
    id: 'etudiant',
    name: 'Étudiant & Stage',
    slug: 'etudiant',
    description: 'Priorise le parcours académique, les mentions, stages et engagements associatifs.',
    category: 'debutant',
    isPremium: false,
    isActive: true,
    defaultColor: '#4f46e5', // Indigo
    recommendedFor: ['Étudiants UAC/UP', 'Recherche de stage académique ou professionnel'],
    layoutType: 'top-header'
  },
  {
    id: 'technicien',
    name: 'Technicien & Opérations',
    slug: 'technicien',
    description: 'Structure technique rigoureuse mettant en lumière les habilitations, outillages et maintenance.',
    category: 'technique',
    isPremium: true,
    isActive: true,
    defaultColor: '#ea580c', // Orange industriel
    recommendedFor: ['Électrotechnique', 'BTP', 'Télécoms', 'Génie civil', 'Mécanique'],
    layoutType: 'two-col-right'
  },
  {
    id: 'informatique',
    name: 'Tech & Développeur Web',
    slug: 'informatique',
    description: 'Style épuré haute lisibilité avec section GitHub/Portfolio et tags de langages et frameworks.',
    category: 'technique',
    isPremium: true,
    isActive: true,
    defaultColor: '#0f172a', // Noir tech
    recommendedFor: ['Développeur Full-Stack', 'Data Analyst', 'Administrateur Systèmes', 'Cybersécurité'],
    layoutType: 'two-col-left'
  },
  {
    id: 'commercial',
    name: 'Commercial & Vente',
    slug: 'commercial',
    description: 'Design percutant axé sur les résultats chiffrés, le sens du relationnel et la négociation.',
    category: 'tertiaire',
    isPremium: true,
    isActive: true,
    defaultColor: '#b91c1c', // Rouge vif énergique
    recommendedFor: ['Attaché commercial', 'Responsable grands comptes', 'Marketing terrain'],
    layoutType: 'top-header'
  },
  {
    id: 'comptabilite',
    name: 'Comptabilité & Finance',
    slug: 'comptabilite',
    description: 'Rigueur visuelle absolue, équilibre des colonnes et clarté des déclarations fiscales et d’audit.',
    category: 'tertiaire',
    isPremium: true,
    isActive: true,
    defaultColor: '#0f766e', // Sarcelle
    recommendedFor: ['Comptable', 'Auditeur interne', 'Gestionnaire de paie', 'Directeur financier'],
    layoutType: 'two-col-left'
  },
  {
    id: 'enseignant',
    name: 'Enseignant & Pédagogue',
    slug: 'enseignant',
    description: 'Présentation académique noble adaptée aux lycées, collèges, universités et centres de formation.',
    category: 'classique',
    isPremium: true,
    isActive: true,
    defaultColor: '#4338ca', // Indigo profond
    recommendedFor: ['Professeurs certifiés', 'Formateurs', 'Éducateurs', 'Chercheurs'],
    layoutType: 'single-col'
  },
  {
    id: 'management',
    name: 'Executive & Management',
    slug: 'management',
    description: 'Format haut de gamme reflétant le leadership, la gestion d’équipes et la stratégie d’entreprise.',
    category: 'tertiaire',
    isPremium: true,
    isActive: true,
    defaultColor: '#1e293b', // Anthracite
    recommendedFor: ['Directeur général', 'Chef de projet', 'Coordonnateur de programmes'],
    layoutType: 'top-header'
  },
  {
    id: 'sans_photo',
    name: 'International ATS (Sans Photo)',
    slug: 'sans-photo',
    description: 'Conforme aux standards internationaux et aux filtres ATS, maximisant vos chances pour les ONG et multinationales.',
    category: 'moderne',
    isPremium: true,
    isActive: true,
    defaultColor: '#27272a', // Neutre zinc
    recommendedFor: ['Organisations Internationales', 'Nations Unies', 'Postes à distance'],
    layoutType: 'single-col'
  },
  {
    id: 'stage',
    name: 'Stage Pro Perfectionnement',
    slug: 'stage',
    description: 'Idéal pour candidater à un stage d’insertion ou de fin de cycle au Bénin.',
    category: 'debutant',
    isPremium: true,
    isActive: true,
    defaultColor: '#059669', // Vert menthe
    recommendedFor: ['Stagiaires', 'Alternants', 'Volontaires'],
    layoutType: 'two-col-left'
  },
  {
    id: 'administratif',
    name: 'Secrétariat & Administration',
    slug: 'administratif',
    description: 'Structure organisée valorisant l’accueil, la rédaction administrative et l’organisation bureautique.',
    category: 'tertiaire',
    isPremium: true,
    isActive: true,
    defaultColor: '#7c3aed', // Violet moderne
    recommendedFor: ['Secrétaire de direction', 'Assistant administratif', 'Agent d’accueil'],
    layoutType: 'two-col-right'
  },
  {
    id: 'professionnel',
    name: 'Expert Chronologique',
    slug: 'professionnel',
    description: 'Chronologie inverse détaillée avec mise en exergue des responsabilités majeures.',
    category: 'classique',
    isPremium: true,
    isActive: true,
    defaultColor: '#374151', // Gris acier
    recommendedFor: ['Cadres supérieurs', 'Ingénieurs d’affaires', 'Consultants seniors'],
    layoutType: 'single-col'
  }
];

export const BENIN_CITIES = [
  'Cotonou',
  'Abomey-Calavi',
  'Porto-Novo',
  'Parakou',
  'Bohicon',
  'Ouidah',
  'Natitingou',
  'Djougou',
  'Kandi',
  'Lokossa',
  'Allada',
  'Dassa-Zoumè',
  'Comè',
  'Savalou',
  'Pobè',
  'Malanville',
  'Aplahoué',
  'Grand-Popo',
  'Tanguiéta',
  'Bembèrèkè'
];

export const BENIN_INSTITUTIONS = [
  "Université d'Abomey-Calavi (UAC)",
  "Université de Parakou (UP)",
  "École Nationale d'Économie Appliquée et de Management (ENEAM - UAC)",
  "Institut de Formation et de Recherche en Informatique (IFRI - UAC)",
  "École Polytechnique d'Abomey-Calavi (EPAC - UAC)",
  "Faculté des Sciences Économiques et de Gestion (FASEG - UAC)",
  "Faculté des Lettres, Langues, Arts et Communication (FLLAC - UAC)",
  "Faculté de Droit et de Science Politique (FADESP - UAC)",
  "Faculté des Sciences et Techniques (FAST - UAC)",
  "Faculté des Sciences de la Santé (FSS - Cotonou)",
  "Institut National de la Jeunesse, de l'Éducation Physique et du Sport (INJEPS)",
  "Institut Régional de Santé Publique (IRSP - Ouidah)",
  "Pigier Bénin",
  "Haute École de Commerce et de Management (HECM)",
  "École Supérieure de Management (ESM Bénin)",
  "UATM Gasa Formation",
  "Institut Cerco Bénin",
  "Lycée Technique F. Coulibaly (Cotonou)",
  "Lycée Technique Commercial de Porto-Novo",
  "École Nationale d'Administration et de Magistrature (ENAM)"
];

export const SUGGESTED_SKILLS = [
  // Bureautique
  { name: 'Microsoft Word & Excel avancé', category: 'bureautique' as const },
  { name: 'PowerPoint & présentations percutantes', category: 'bureautique' as const },
  { name: 'Google Workspace (Docs, Sheets, Drive)', category: 'bureautique' as const },
  { name: 'Rédaction administrative & comptes-rendus', category: 'bureautique' as const },
  { name: 'Archivage numérique & classement', category: 'bureautique' as const },

  // Dev Web & Informatique
  { name: 'JavaScript / TypeScript', category: 'dev_web' as const },
  { name: 'React.js & Next.js', category: 'dev_web' as const },
  { name: 'PHP / Laravel', category: 'dev_web' as const },
  { name: 'Python & Django', category: 'dev_web' as const },
  { name: 'Bases de données SQL (MySQL, PostgreSQL)', category: 'informatique' as const },
  { name: 'Maintenance informatique & dépannage réseau', category: 'maintenance' as const },
  { name: 'Configuration routeurs & Wi-Fi professionnel', category: 'maintenance' as const },
  { name: 'Cybersécurité & protection des données', category: 'informatique' as const },

  // Gestion & Finance
  { name: 'Comptabilité générale (SYSCOHADA révisé)', category: 'gestion' as const },
  { name: 'Déclarations fiscales béninoises (DGI Bénin, e-Services)', category: 'gestion' as const },
  { name: 'Déclarations sociales CNSS Bénin', category: 'gestion' as const },
  { name: 'Logiciels comptables (Sage Saari, Odoo)', category: 'gestion' as const },
  { name: 'Gestion de trésorerie & rapprochement bancaire', category: 'gestion' as const },
  { name: 'Contrôle de gestion & tableaux de bord', category: 'gestion' as const },

  // Vente & Commerce
  { name: 'Prospection commerciale terrain & B2B', category: 'vente' as const },
  { name: 'Négociation & conclusion des ventes', category: 'vente' as const },
  { name: 'Gestion de la relation client (CRM)', category: 'vente' as const },
  { name: 'Marketing digital & Community Management', category: 'vente' as const },

  // Transverse
  { name: 'Travail en équipe & sens de l’écoute', category: 'transverse' as const },
  { name: 'Organisation rigoureuse & gestion des priorités', category: 'transverse' as const },
  { name: 'Résolution méthodique de problèmes', category: 'transverse' as const },
  { name: 'Ponctualité & esprit d’initiative', category: 'transverse' as const }
];

export const PROFILE_SUMMARIES_EXAMPLES = [
  {
    role: 'Développeur Web & Mobile',
    text: "Développeur passionné et rigoureux, titulaire d'une licence en génie logiciel de l'IFRI - UAC. Fort d'une expérience concrète dans la conception d'applications web réactives avec React, Node.js et bases de données SQL. Motivé par l'innovation technologique et le travail d'équipe agile pour apporter des solutions fiables et évolutives."
  },
  {
    role: 'Comptable / Gestionnaire Financier',
    text: "Comptable méthodique justifiant d'une solide maîtrise du référentiel SYSCOHADA révisé et des obligations fiscales béninoises (DGI, CNSS). Expérimenté dans la tenue des journaux, l'établissement des états financiers de synthèse et l'utilisation experte de Sage Saari. Reconnu pour mon intégrité et mon sens du détail."
  },
  {
    role: 'Commercial / Responsable des Ventes',
    text: "Commercial dynamique et orienté résultats avec 4 ans d'expérience dans le développement de portefeuilles clients à Cotonou et dans le sud du Bénin. Rompu à la prospection terrain, à la négociation B2B et au management de points de vente avec un taux d'atteinte d'objectifs supérieur à 110%."
  },
  {
    role: 'Assistant(e) de Direction & Administration',
    text: "Professionnel(le) de l'administration et du secrétariat trilingue (Français, Fon, Anglais) doté(e) d'un grand sens de la discrétion et d'une organisation sans faille. Maîtrise parfaite de la rédaction administrative, de la tenue d'agenda de direction et de l'accueil protocolaire des partenaires d'affaires."
  },
  {
    role: 'Technicien Réseaux & Maintenance Informatique',
    text: "Technicien supérieur en informatique doté d'une expertise reconnue dans le déploiement d'infrastructures locales, le câblage réseau, la sécurité périmétrique et l'assistance aux utilisateurs. Réactif, méthodique et orienté disponibilité des systèmes d'information."
  }
];
