/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utilitaires stricts de détection, nettoyage et validation de liens interactifs
 * pour les CV professionnels (Export PDF avec annotations de liens & Aperçu HTML).
 */

/**
 * Valide et nettoie une adresse e-mail en lien mailto:
 */
export function buildEmailLink(email?: string | null): string | null {
  if (!email || typeof email !== 'string') return null;
  const clean = email.trim().toLowerCase();
  // Regex standard RFC 5322 simplifiée
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) return null;
  return `mailto:${clean}`;
}

/**
 * Nettoie et formate un numéro de téléphone pour un appel tel:
 */
export function buildPhoneLink(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const raw = phone.trim();
  if (raw.length < 8) return null;

  // Supprime tous les caractères non numériques sauf le '+' initial
  let sanitized = raw.replace(/[^\d+]/g, '');

  // Remplacement du préfixe 00 international
  if (sanitized.startsWith('00')) {
    sanitized = '+' + sanitized.slice(2);
  }

  // Si c'est un numéro béninois standard à 8 chiffres sans indicatif (ex: 97123456 ou 01945377)
  const digitsOnly = sanitized.replace(/\D/g, '');
  if (!sanitized.startsWith('+') && (digitsOnly.length === 8 || digitsOnly.length === 10)) {
    sanitized = `+229${digitsOnly}`;
  }

  if (digitsOnly.length < 8) return null;
  return `tel:${sanitized}`;
}

/**
 * Construit un lien WhatsApp direct (https://wa.me/229XXXXXXXX)
 * uniquement lorsque le numéro est valide avec l'indicatif.
 */
export function buildWhatsAppLink(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const raw = phone.trim();
  const digits = raw.replace(/\D/g, '');

  if (digits.length < 8) return null;

  // Si indicatif manquant pour un numéro béninois à 8 chiffres ou 10 chiffres commençant sans 229
  let fullDigits = digits;
  if (!fullDigits.startsWith('229') && (digits.length === 8 || (digits.length === 10 && digits.startsWith('01')))) {
    fullDigits = '229' + digits;
  }

  if (fullDigits.length < 10) return null;
  return `https://wa.me/${fullDigits}`;
}

/**
 * Nettoie et sécurise une URL externe (Website, Portfolio, etc.)
 * Bloque strictement tout protocole dangereux comme javascript:, data:, etc.
 */
export function buildSafeWebUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  let clean = url.trim();
  if (clean.length < 3) return null;

  // Protection anti-injection
  const lower = clean.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return null;
  }

  // Ajout automatique du protocole https:// si absent
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    // Si c'est un email mal catégorisé
    if (lower.includes('@') && !lower.includes('/')) {
      return buildEmailLink(clean);
    }
    clean = `https://${clean}`;
  }

  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    // Vérification que le hostname comporte au moins un point (ex: exemple.bj ou linkedin.com)
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Construit un lien LinkedIn officiel valide
 */
export function buildLinkedInLink(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let clean = raw.trim();
  if (!clean) return null;

  // Si l'utilisateur a entré uniquement son pseudo (ex: "jeaneudes-dossou" ou "in/jeaneudes-dossou")
  if (!clean.includes('linkedin.com')) {
    const path = clean.replace(/^\/?(in\/)?/, '');
    return `https://www.linkedin.com/in/${encodeURIComponent(path)}`;
  }

  return buildSafeWebUrl(clean);
}

/**
 * Construit un lien GitHub officiel valide
 */
export function buildGitHubLink(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let clean = raw.trim();
  if (!clean) return null;

  // Si l'utilisateur a entré uniquement son nom d'utilisateur (ex: "dossoudev")
  if (!clean.includes('github.com')) {
    const username = clean.replace(/^@/, '').replace(/^\//, '');
    return `https://github.com/${encodeURIComponent(username)}`;
  }

  return buildSafeWebUrl(clean);
}

/**
 * Épure l'affichage visuel des URLs pour ne pas encombrer le CV
 * (retire https://, http://, www., slash final).
 */
export function formatDisplayUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  return url
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');
}

/**
 * Vérifie si une chaîne d'URL est totalement sûre pour l'insertion dans une annotation PDF
 */
export function isValidPdfAnnotationUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return false;
  }

  return (
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:')
  );
}
