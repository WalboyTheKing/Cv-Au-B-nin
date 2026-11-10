/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CV_TEMPLATES, TEMPLATE_CATEGORIES } from '../../config';
import { TemplateCategory, TemplateDefinition, CVData } from '../../types';
import { TemplateCard } from './TemplateCard';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { Sparkles } from 'lucide-react';

interface TemplateGalleryProps {
  selectedTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
  cv?: CVData;
  title?: string;
  subtitle?: string;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  selectedTemplateId = 'moderne',
  onSelectTemplate,
  cv,
  title,
  subtitle
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('tous');
  const [previewingTemplate, setPreviewingTemplate] = useState<TemplateDefinition | null>(null);

  const filtered = CV_TEMPLATES.filter((t) => {
    if (!t.isActive) return false;
    if (selectedCategory === 'tous') return true;
    return t.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* En-tête optionnel */}
      {(title || subtitle) && (
        <div className="text-center max-w-3xl mx-auto space-y-1.5">
          {title && (
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Barre des 8 catégories officielles */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {TEMPLATE_CATEGORIES.map((cat) => {
          const isCurrent = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isCurrent
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isCurrent ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {cat.id === 'tous' ? 15 : cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Note d'indépendance des données */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Contenu 100% indépendant du modèle :</strong> vos données personnelles, expériences et formations sont préservées intégralement lors de chaque changement de modèle.
          </span>
        </div>
      </div>

      {/* Grille des modèles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((tpl) => (
          <TemplateCard
            key={tpl.id}
            template={tpl}
            isSelected={selectedTemplateId === tpl.id}
            onSelect={onSelectTemplate}
            onPreview={(t) => setPreviewingTemplate(t)}
            cv={cv}
          />
        ))}
      </div>

      {/* Modale de prévisualisation grand format */}
      {previewingTemplate && cv && (
        <TemplatePreviewModal
          template={previewingTemplate}
          cv={cv}
          onSelect={onSelectTemplate}
          onClose={() => setPreviewingTemplate(null)}
        />
      )}
    </div>
  );
};
