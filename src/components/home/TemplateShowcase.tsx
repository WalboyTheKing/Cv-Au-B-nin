/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TemplateGallery } from '../templates/TemplateGallery';
import { INITIAL_DEMO_CV } from '../../services/storage';

interface TemplateShowcaseProps {
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateShowcase: React.FC<TemplateShowcaseProps> = ({ onSelectTemplate }) => {
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
          <p className="text-slate-600 text-sm mt-3 leading-relaxed">
            Chaque modèle dispose d'une disposition structurelle réfléchie pour maximiser la clarté et valoriser vos atouts auprès des jurys et recruteurs béninois.
          </p>
        </div>

        <TemplateGallery
          selectedTemplateId="moderne"
          onSelectTemplate={onSelectTemplate}
          cv={INITIAL_DEMO_CV}
        />
      </div>
    </section>
  );
};
