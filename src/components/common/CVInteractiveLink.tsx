/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  buildEmailLink,
  buildPhoneLink,
  buildWhatsAppLink,
  buildSafeWebUrl,
  buildLinkedInLink,
  buildGitHubLink,
  formatDisplayUrl
} from '../../utils/linkUtils';

export type CVLinkType = 'email' | 'phone' | 'whatsapp' | 'url' | 'linkedin' | 'github';

interface CVInteractiveLinkProps {
  type: CVLinkType;
  value?: string | null;
  displayValue?: string | null;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  showIcon?: boolean;
}

/**
 * Composant de lien interactif discret pour l'aperçu HTML et l'export PDF.
 * Conserve fidèlement le style du modèle de CV tout en rendant le lien
 * cliquable et détectable par le moteur d'annotations PDF.
 */
export const CVInteractiveLink: React.FC<CVInteractiveLinkProps> = ({
  type,
  value,
  displayValue,
  children,
  className = '',
  style,
  title
}) => {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return null;
  }

  let href: string | null = null;
  let defaultTitle = '';

  switch (type) {
    case 'email':
      href = buildEmailLink(value);
      defaultTitle = `Envoyer un email à ${value}`;
      break;
    case 'phone':
      href = buildPhoneLink(value);
      defaultTitle = `Appeler le ${value}`;
      break;
    case 'whatsapp':
      href = buildWhatsAppLink(value);
      defaultTitle = `Ouvrir la discussion WhatsApp (${value})`;
      break;
    case 'linkedin':
      href = buildLinkedInLink(value);
      defaultTitle = `Consulter le profil LinkedIn (${formatDisplayUrl(value)})`;
      break;
    case 'github':
      href = buildGitHubLink(value);
      defaultTitle = `Consulter le profil GitHub (${formatDisplayUrl(value)})`;
      break;
    case 'url':
    default:
      href = buildSafeWebUrl(value);
      defaultTitle = `Visiter le site (${formatDisplayUrl(value)})`;
      break;
  }

  // Si l'URL n'est pas valide ou sécurisée, afficher le texte brut sans lien cassé
  if (!href) {
    return (
      <span className={className} style={style}>
        {children || displayValue || value}
      </span>
    );
  }

  return (
    <a
      href={href}
      target={type === 'email' || type === 'phone' ? '_self' : '_blank'}
      rel="noopener noreferrer"
      data-pdf-link={href}
      title={title || defaultTitle}
      className={`group/link transition-opacity hover:opacity-80 cursor-pointer ${className}`}
      style={{
        color: 'inherit',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        ...style
      }}
      onClick={(e) => {
        // Permet le clic direct en mode aperçu
        e.stopPropagation();
      }}
    >
      <span className="group-hover/link:underline decoration-current/40 underline-offset-2">
        {children || displayValue || (type === 'url' ? formatDisplayUrl(value) : value)}
      </span>
    </a>
  );
};
