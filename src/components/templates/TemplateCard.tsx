/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TemplateDefinition, CVData } from '../../types';
import { TemplateMiniature } from './TemplateMiniature';
import { Eye, Check, Sparkles } from 'lucide-react';

interface TemplateCardProps {
  template: TemplateDefinition;
  isSelected?: boolean;
  onSelect: (templateId: string) => void;
  onPreview: (template: TemplateDefinition) => void;
  cv?: CVData;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected = false,
  onSelect,
  onPreview,
  cv
}) => {
  return (
    <div
      className={`group bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative shadow-xs hover:shadow-xl ${
        isSelected
          ? 'border-emerald-600 ring-2 ring-emerald-600/30 shadow-md'
          : 'border-slate-200 hover:border-slate-400/80'
      }`}
    >
      {/* En-tête miniature avec overlay prévisualisation */}
      <div className="relative p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-center overflow-hidden">
        {/* Badges en haut */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
            {template.styleLabel}
          </span>
        </div>

        <div className="absolute top-3 right-3 z-10">
          {template.isPremium ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
              <Sparkles className="w-2.5 h-2.5" />
              Premium
            </span>
          ) : (
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
              Gratuit
            </span>
          )}
        </div>

        {/* Miniature fidèle A4 */}
        <div className="w-36 transition-transform duration-300 group-hover:scale-105">
          <TemplateMiniature template={template} color={template.defaultColor} cv={cv} />
        </div>

        {/* Bouton Prévisualiser en survol rapide */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview(template);
          }}
          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs backdrop-blur-2xs cursor-pointer"
        >
          <span className="px-3.5 py-2 rounded-xl bg-white text-slate-900 shadow-lg flex items-center gap-1.5 hover:bg-slate-100">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>Aperçu plein écran</span>
          </span>
        </button>
      </div>

      {/* Contenu et caractéristiques */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                {template.name}
              </h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {template.description}
              </p>
            </div>
            <div
              className="w-4 h-4 rounded-full shrink-0 border border-white shadow-xs"
              style={{ backgroundColor: template.defaultColor }}
              title={`Couleur signature : ${template.defaultColor}`}
            />
          </div>

          {/* Caractéristiques */}
          {template.characteristics && template.characteristics.length > 0 && (
            <div className="mt-3.5 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Caractéristiques :
              </span>
              <div className="flex flex-wrap gap-1">
                {template.characteristics.map((char, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Boutons d'action : Prévisualiser & Choisir */}
        <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onPreview(template)}
            className="flex-1 py-2 px-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Prévisualiser</span>
          </button>

          <button
            type="button"
            onClick={() => onSelect(template.id)}
            className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isSelected
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-900 hover:bg-emerald-700 text-white hover:shadow-md'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSelected ? 'Sélectionné' : 'Choisir ce modèle'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
