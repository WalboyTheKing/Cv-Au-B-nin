/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CV_TEMPLATES } from '../../config';
import { TemplateCategory, TemplateDefinition } from '../../types';
import { Sparkles, Check, ArrowRight } from 'lucide-react';

interface TemplateShowcaseProps {
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateShowcase: React.FC<TemplateShowcaseProps> = ({ onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('tous');

  const categories: { id: TemplateCategory; label: string }[] = [
    { id: 'tous', label: 'Tous les modèles (15)' },
    { id: 'debutant', label: 'Étudiant & 1er Emploi' },
    { id: 'technique', label: 'Technique & Informatique' },
    { id: 'tertiaire', label: 'Gestion & Commerce' },
    { id: 'moderne', label: 'Moderne & ATS' },
    { id: 'classique', label: 'Classique & Administration' }
  ];

  const filtered = CV_TEMPLATES.filter((t) => {
    if (!t.isActive) return false;
    if (selectedCategory === 'tous') return true;
    return t.category === selectedCategory;
  });

  return (
    <section id="templates-section" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-xs uppercase tracking-widest text-emerald-700 font-extrabold mb-2">
            Bibliothèque de Modèles Professionnels
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            15 styles de mise en page conçus pour tous les profils
          </h3>
          <p className="text-slate-600 text-sm mt-3">
            Chaque modèle dispose d'une disposition structurelle réfléchie pour maximiser la clarté et valoriser vos atouts auprès des jurys et recruteurs béninois.
          </p>
        </div>

        {/* Filtres par catégorie */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Grille des modèles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-400/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Carte d'aperçu visuelle */}
                <div className="relative h-60 bg-slate-100 border-b border-slate-100 p-4 flex items-center justify-center overflow-hidden">
                  {/* Badge Gratuit / Premium */}
                  <div className="absolute top-3 right-3 z-10">
                    {tpl.isPremium ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-white px-2.5 py-1 rounded-full shadow-xs">
                        <Sparkles className="w-2.5 h-2.5" />
                        Premium
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-xs">
                        Gratuit
                      </span>
                    )}
                  </div>

                  {/* Vignette A4 miniature stylisée */}
                  <div className="w-36 h-48 bg-white rounded shadow-md border border-slate-200 p-2.5 flex flex-col justify-between group-hover:scale-105 transition-transform duration-300">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: tpl.defaultColor }}
                        />
                        <div className="h-1.5 bg-slate-300 rounded w-16" />
                      </div>
                      <div className="h-1 bg-slate-200 rounded w-12" />
                      <div className="pt-1.5 space-y-1">
                        <div className="h-1 bg-slate-200 rounded w-full" />
                        <div className="h-1 bg-slate-200 rounded w-4/5" />
                        <div className="h-1 bg-slate-200 rounded w-2/3" />
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-1 space-y-1">
                      <div
                        className="h-1 rounded w-10"
                        style={{ backgroundColor: tpl.defaultColor }}
                      />
                      <div className="h-1 bg-slate-200 rounded w-full" />
                    </div>
                  </div>
                </div>

                {/* Métadonnées du modèle */}
                <div className="p-5 space-y-3">
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {tpl.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>

                  {/* Recommandations de métiers */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Recommandé pour :
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {tpl.recommendedFor.map((r, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bouton d'action direct */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => onSelectTemplate(tpl.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Utiliser ce modèle</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
