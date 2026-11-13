/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { APP_CONFIG } from '../../config';
import { FileText, Phone, Mail, MapPin, ShieldCheck, Heart, Lock } from 'lucide-react';

interface FooterProps {
  onOpenLegal: (topic: 'cgu' | 'privacy' | 'mentions' | 'refund' | 'data') => void;
  onNavigate: (tab: string) => void;
  onOpenAuth?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, onNavigate, onOpenAuth }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800 text-xs">
          {/* Marque & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black">
                <FileText className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                {APP_CONFIG.brandName}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed pr-6">
              La plateforme de référence au Bénin pour concevoir, personnaliser et exporter des CV d'excellence conformes aux exigences des recruteurs locaux et internationaux.
            </p>
            <div className="pt-2 text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Haie Vive, Cotonou — République du Bénin</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a
                  href="https://wa.me/2290194537741"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors underline decoration-slate-700 underline-offset-2"
                >
                  Support WhatsApp : {APP_CONFIG.supportPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{APP_CONFIG.contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Navigation Rapide */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Créer & Explorer
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('builder')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Créateur de CV
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('templates')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Les 15 modèles de CV
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('import')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Importer & Moderniser un CV
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Tarifs en Francs CFA (XOF)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('tips')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Guide & Conseils Emploi Bénin
                </button>
              </li>
              <li className="pt-1 border-t border-slate-800/80">
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-amber-400 text-slate-400 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Console d'Administration</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Informations Juridiques */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Mentions Légales & Droits
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onOpenLegal('mentions')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Mentions Légales
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('cgu')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Conditions Générales d'Utilisation
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('privacy')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Politique de Confidentialité
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('refund')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Paiement & Remboursement
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('data')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Gestion des Données (APDP Bénin)
                </button>
              </li>
            </ul>
          </div>

          {/* Paiements Sécurisés au Bénin */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Paiement Local Sécurisé
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Règlement en FCFA directement avec votre numéro de téléphone :
            </p>
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="font-semibold text-white">MTN Mobile Money Bénin</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="font-semibold text-white">Moov Money Bénin</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-white">FedaPay & Cartes bancaires</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bas de page */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <p>© {new Date().getFullYear()} {APP_CONFIG.brandName}. Tous droits réservés.</p>
            <button
              onClick={() => onNavigate('admin')}
              title="Console d'Administration"
              className="text-slate-500 hover:text-amber-400 p-1 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
              aria-label="Accès Administration"
            >
              <Lock className="w-3 h-3 text-amber-500/80" />
              <span>Admin</span>
            </button>
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                title="Espace sécurisé"
                className="text-slate-600 hover:text-slate-400 p-1 transition-colors cursor-pointer"
                aria-label="Connexion candidat"
              >
                <Lock className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sécurité des données personnelles certifiée • Conformité APDP Bénin</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
