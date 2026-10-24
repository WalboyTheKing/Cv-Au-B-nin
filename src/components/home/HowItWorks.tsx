/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layout, Edit3, Palette, DownloadCloud } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: <Layout className="w-6 h-6 text-emerald-600" />,
      title: 'Choisissez un modèle',
      desc: 'Sélectionnez le design adapté à votre niveau d’expérience (étudiant, technicien, commercial, cadre).'
    },
    {
      num: '02',
      icon: <Edit3 className="w-6 h-6 text-emerald-600" />,
      title: 'Renseignez vos informations',
      desc: 'Complétez les formulaires guidés : parcours, universités, expériences et compétences clés.'
    },
    {
      num: '03',
      icon: <Palette className="w-6 h-6 text-emerald-600" />,
      title: 'Personnalisez votre présentation',
      desc: 'Ajustez votre palette de couleurs professionnelles, la police typographique et l’ordre des sections.'
    },
    {
      num: '04',
      icon: <DownloadCloud className="w-6 h-6 text-emerald-600" />,
      title: 'Prévisualisez et téléchargez',
      desc: 'Vérifiez la mise en page A4 en temps réel et exportez un PDF impeccable prêt à être envoyé.'
    }
  ];

  return (
    <section className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs uppercase tracking-widest text-emerald-700 font-extrabold mb-2">
            Fonctionnement Simple & Efficace
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Votre CV professionnel prêt en 4 étapes
          </h3>
          <p className="text-slate-600 text-sm mt-3">
            Aucune compétence technique nécessaire. Notre outil prend en charge le formatage et l'alignement pour vous.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st, idx) => (
            <div
              key={idx}
              className="relative bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  {st.icon}
                </div>
                <span className="text-2xl font-black text-slate-200 font-mono">{st.num}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">{st.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
