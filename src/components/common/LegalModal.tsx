/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { APP_CONFIG } from '../../config';
import { X, ShieldCheck, FileText, Lock } from 'lucide-react';

export type LegalTopic = 'cgu' | 'privacy' | 'mentions' | 'refund' | 'data';

interface LegalModalProps {
  topic: LegalTopic | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ topic, onClose }) => {
  if (!topic) return null;

  const contentMap: Record<
    LegalTopic,
    { title: string; subtitle: string; body: React.ReactNode }
  > = {
    mentions: {
      title: 'Mentions Légales',
      subtitle: `Informations éditoriales régissant la plateforme ${APP_CONFIG.brandName}`,
      body: (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-900 mb-1">1. Éditeur de la Plateforme</h4>
            <p>
              Le service <strong>{APP_CONFIG.brandName}</strong> est une solution logicielle éditée à Cotonou, République du Bénin.
              <br />
              Adresse : Haie Vive, Arrondissement de Cotonou, Bénin.
              <br />
              Courriel de contact : {APP_CONFIG.contactEmail}
              <br />
              Ligne téléphonique & WhatsApp : {APP_CONFIG.supportPhone}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">2. Propriété Intellectuelle</h4>
            <p>
              L'ensemble des modèles de documents, gabarits typographiques, chartes graphiques, logiciels, algorithmes de mise en page et codes sources constituant le site sont protégés par les lois béninoises relatives à la propriété intellectuelle et les traités de l'OAPI (Organisation Africaine de la Propriété Intellectuelle).
              Toute reproduction non autorisée de la structure logicielle ou des modèles de CV est strictement prohibée.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">3. Responsabilité du Contenu des Utilisateurs</h4>
            <p>
              Chaque utilisateur est seul responsable de l'exactitude des diplômes, expériences, titres professionnels et certifications qu'il consigne dans ses CV. La plateforme met à disposition des outils d'édition et de mise en forme mais ne saurait être tenue responsable en cas de fausse déclaration professionnelle de l'utilisateur vis-à-vis d'un employeur.
            </p>
          </div>
        </div>
      )
    },
    cgu: {
      title: "Conditions Générales d'Utilisation (CGU)",
      subtitle: "Règles encadrant l'utilisation du service et des générateurs de CV",
      body: (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-900 mb-1">1. Objet du Service</h4>
            <p>
              {APP_CONFIG.brandName} met à disposition des candidats résidant au Bénin ou postulant à des offres d'emploi des modèles professionnels, des formulaires de rédaction guidée, une assistance textuelle et des fonctionnalités d'exportation au format PDF conforme aux normes de recrutement.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">2. Accès et Création de Compte</h4>
            <p>
              L'utilisateur s'engage à fournir des coordonnées valides lors de son inscription. Le compte est strictement personnel : un utilisateur ne peut pas céder ses accès à un tiers. Les fonctionnalités gratuites sont accessibles sans paiement obligatoire. Les fonctionnalités avancées (modèles premium, suppression de filigrane, téléchargements multiples) nécessitent la souscription d'un forfait prépayé.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">3. Utilisation Conforme & Éthique</h4>
            <p>
              Il est rigoureusement interdit d'utiliser la plateforme pour générer de faux documents officiels, usurper l'identité de tiers ou porter atteinte à l'honneur d'organisations. Tout compte se livrant à des pratiques frauduleuses sera immédiatement suspendu.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">4. Sauvegarde et Disponibilité</h4>
            <p>
              La plateforme met en œuvre les moyens techniques adéquats pour assurer la haute disponibilité de l'application et la conservation des CV créés. L'utilisateur est toutefois invité à télécharger et conserver ses fichiers PDF finaux sur ses propres supports physiques ou cloud.
            </p>
          </div>
        </div>
      )
    },
    privacy: {
      title: 'Politique de Confidentialité & APDP',
      subtitle: 'Protection rigoureuse de vos données personnelles et respect de votre vie privée',
      body: (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-900 mb-1">1. Engagement de Confidentialité Absolue</h4>
            <p>
              Vos CV contiennent vos informations les plus sensibles (numéro de téléphone, adresse, parcours professionnel, parcours académique). <strong>{APP_CONFIG.brandName} ne vend, ne loue et ne partage JAMAIS vos données personnelles ni vos CV à des courtiers en données ou des tiers non autorisés.</strong>
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">2. Données Collectées</h4>
            <p>
              Nous collectons uniquement :
              <br />• Les données de compte : nom, prénom, e-mail, numéro de téléphone (+229).
              <br />• Les informations renseignées pour composer votre CV (expériences, études, compétences).
              <br />• Les références techniques de transaction Mobile Money pour le suivi de vos forfaits (aucun code secret USSD n'est jamais demandé ni stocké).
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">3. Sécurité & Droits des Personnes (Loi Numérique Bénin)</h4>
            <p>
              Conformément à la loi n° 2017-20 portant Code du Numérique en République du Bénin et aux directives de l'APDP (Autorité de Protection des Données Personnelles) :
              <br />
              Vous disposez à tout moment d'un droit d'accès, de rectification, de portabilité et de suppression intégrale de vos données et de vos CV depuis votre tableau de bord ou par simple message à notre support.
            </p>
          </div>
        </div>
      )
    },
    refund: {
      title: 'Conditions de Paiement & Remboursement',
      subtitle: 'Transparence tarifaire en Francs CFA (XOF) et modalités Mobile Money Bénin',
      body: (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-900 mb-1">1. Tarification en Francs CFA (FCFA)</h4>
            <p>
              Tous les prix indiqués sur {APP_CONFIG.brandName} sont stipulés en Francs CFA (XOF) toutes taxes comprises. Les forfaits sont prépayés pour une durée déterminée (ex : 500 FCFA pour 7 jours ou 1 000 FCFA pour 30 jours).
              <strong> Aucun renouvellement automatique n'est imposé :</strong> aucun prélèvement imprévu ne sera effectué sur votre compte Mobile Money à l'expiration de votre accès.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">2. Moyens de Paiement Agréés au Bénin</h4>
            <p>
              Les règlements s'effectuent via les réseaux nationaux MTN Mobile Money (*880#), Moov Money (*855#) ou par carte bancaire locale via notre partenaire d'encaissement FedaPay. L'accès aux fonctionnalités premium est débloqué dès réception de la confirmation de paiement.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">3. Politique de Remboursement et Réclamation</h4>
            <p>
              Si un débit a été constaté sur votre compte Mobile Money mais qu'un incident réseau a empêché l'activation automatique de votre forfait, notre service d'assistance vérifie la référence de transaction et crédite votre compte immédiatement.
              En cas d'incompatibilité technique majeure démontrée empêchant le téléchargement de votre CV avant toute utilisation effective, un remboursement peut être demandé dans les 48 heures suivant la transaction.
            </p>
          </div>
        </div>
      )
    },
    data: {
      title: 'Gestion de vos Données Personnelles',
      subtitle: 'Vos choix de conservation et de suppression définitive',
      body: (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-900 mb-1">1. Suppression de vos documents</h4>
            <p>
              Vous pouvez à tout instant supprimer l'un de vos CV enregistrés d'un simple clic depuis votre espace « Mes CV ». La suppression entraîne l'effacement immédiat et irréversible des données associées.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">2. Clôture intégrale de compte</h4>
            <p>
              Depuis vos paramètres de profil, vous pouvez demander la destruction complète de votre profil utilisateur et de l'ensemble de vos historiques de fichiers, conformément aux standards de protection de la vie privée.
            </p>
          </div>
        </div>
      )
    }
  };

  const current = contentMap[topic];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{current.title}</h3>
              <p className="text-[11px] text-slate-500">{current.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 overflow-y-auto space-y-4">{current.body}</div>

        {/* Pied */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Fermer le document
          </button>
        </div>
      </div>
    </div>
  );
};
