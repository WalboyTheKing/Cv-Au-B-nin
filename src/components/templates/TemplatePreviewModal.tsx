/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TemplateDefinition, CVData } from '../../types';
import { CVRenderer } from './CVRenderer';
import { X, Check, ZoomIn, ZoomOut, RotateCcw, Sparkles } from 'lucide-react';

interface TemplatePreviewModalProps {
  template: TemplateDefinition;
  cv: CVData;
  onSelect: (templateId: string) => void;
  onClose: () => void;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  cv,
  onSelect,
  onClose
}) => {
  const [scale, setScale] = useState<number>(0.85);

  // CV prévisualisé avec le modèle temporaire sans altérer les données de base
  const previewCV: CVData = {
    ...cv,
    settings: {
      ...cv.settings,
      templateId: template.id,
      primaryColor: cv.settings?.primaryColor || template.defaultColor
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-slate-100 rounded-3xl w-full max-w-5xl h-[94vh] shadow-2xl border border-slate-300 flex flex-col overflow-hidden">
        {/* Header de la modale */}
        <div className="bg-white px-6 py-3.5 border-b border-slate-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {template.name}
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {template.styleLabel}
                </span>
                {template.isPremium && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Premium
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
            </div>
          </div>

          {/* Contrôles de zoom & actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.4, Number((s - 0.1).toFixed(2))))}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                title="Zoom arrière"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-bold text-slate-700">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(1.3, Number((s + 0.1).toFixed(2))))}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors"
                title="Zoom avant"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setScale(0.85)}
                className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-700 transition-colors ml-1"
                title="Réinitialiser le zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onSelect(template.id);
                onClose();
              }}
              className="py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Choisir ce modèle</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Espace central de prévisualisation A4 */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-slate-200/60">
          <div className="my-auto transition-transform">
            <CVRenderer cv={previewCV} scale={scale} showWatermark={false} />
          </div>
        </div>
      </div>
    </div>
  );
};
