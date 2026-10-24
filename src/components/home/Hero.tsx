/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { APP_CONFIG } from '../../config';
import { ArrowRight, Upload, Sparkles, CheckCircle2, Shield, Eye } from 'lucide-react';

interface HeroProps {
  onStartBuilder: () => void;
  onStartImport: () => void;
  onExploreTemplates: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onStartBuilder,
  onStartImport,
  onExploreTemplates
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-white pt-12 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Colonne Texte */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-100/80 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Plateforme 100% adaptée au marché de l'emploi au Bénin</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Créez un CV professionnel qui ouvre des portes.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {APP_CONFIG.description}
            </p>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={onStartBuilder}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Créer mon CV</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onStartImport}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>Importer mon CV</span>
              </button>

              <button
                onClick={onExploreTemplates}
                className="w-full sm:w-auto px-4 py-3.5 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors cursor-pointer"
              >
                <span>Découvrir les modèles</span>
              </button>
            </div>

            {/* Éléments de réassurance sans statistiques inventées */}
            <div className="pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">15 modèles originaux</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Export PDF propre A4</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Paiement MTN / Moov</span>
              </div>
            </div>
          </div>

          {/* Colonne Aperçu Graphique Original de CV */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform lg:rotate-1 hover:rotate-0 transition-transform duration-300">
              {/* Barre supérieure style document */}
              <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-slate-300 text-[11px]">Modèle Moderne • Bénin</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
                  Format A4
                </span>
              </div>

              {/* Mini maquette d'illustration fidèle */}
              <div className="p-5 text-xs space-y-3 bg-white">
                <div className="flex items-start gap-4 pb-3 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shrink-0">
                    JD
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Jean-Eudes DOSSOU</h3>
                    <p className="text-[11px] font-semibold text-emerald-800">
                      Ingénieur Concepteur Logiciel
                    </p>
                    <p className="text-[10px] text-slate-500">Cotonou, Bénin • +229 97 12 34 56</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Expérience Récente
                  </div>
                  <div className="border-l-2 border-emerald-600 pl-2">
                    <div className="font-bold text-[11px] text-slate-900">Lead Développeur Full-Stack</div>
                    <div className="text-[10px] text-slate-500">Digital Solutions Bénin SARL • Cotonou</div>
                    <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                      Intégration facturation e-MECeF et passerelles Mobile Money Bénin.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Formation
                  </div>
                  <div className="border-l-2 border-slate-300 pl-2">
                    <div className="font-bold text-[11px] text-slate-900">Master Génie Logiciel</div>
                    <div className="text-[10px] text-slate-500">IFRI - Université d'Abomey-Calavi (UAC)</div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-1">
                  <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                    TypeScript
                  </span>
                  <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                    React.js
                  </span>
                  <span className="text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                    PostgreSQL
                  </span>
                  <span className="text-[9px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-medium border border-emerald-200">
                    SYSCOHADA
                  </span>
                </div>
              </div>

              {/* Bouton rapide d'essai direct */}
              <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-600 font-medium">
                  Prêt à être personnalisé en 5 minutes
                </span>
                <button
                  onClick={onStartBuilder}
                  className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors"
                >
                  Essayer ce modèle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
