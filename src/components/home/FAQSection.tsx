/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Comment s’effectue le paiement par Mobile Money au Bénin ?',
      a: 'Le règlement s’effectue en Francs CFA (XOF) directement avec votre numéro MTN Mobile Money (*880#) ou Moov Money (*855#). Une notification USSD s’affiche sur votre téléphone pour confirmer la transaction. Dès validation, votre forfait Premium ou Plus est immédiatement activé sans délai.'
    },
    {
      q: 'Y a-t-il un renouvellement automatique ou un prélèvement imprévu ?',
      a: 'Absolument aucun. Nos forfaits sont strictement prépayés pour la période sélectionnée (7 jours ou 30 jours). À la fin de la période, votre forfait s’arrête simplement sans aucun débit sur votre portefeuille électronique.'
    },
    {
      q: 'Mon CV au format PDF est-il compatible avec les systèmes de recrutement (ATS) ?',
      a: 'Oui. Nos 15 modèles génèrent des documents au format A4 avec une typographie nette et une structure claire qui respecte les standards de lecture automatique utilisés par les cabinets de recrutement et les ONG au Bénin.'
    },
    {
      q: 'Puis-je modifier mon CV après l’avoir téléchargé ?',
      a: 'Tout à fait. Votre CV reste enregistré dans votre espace personnel. Vous pouvez y accéder à tout moment depuis votre téléphone, tablette ou ordinateur pour actualiser une expérience, changer de couleur ou de modèle.'
    },
    {
      q: 'Je suis jeune diplômé sans expérience professionnelle, comment faire ?',
      a: 'Nos modèles "Premier Emploi" et "Étudiant" sont spécialement configurés pour mettre en avant votre cursus universitaire, vos mentions, vos projets académiques et vos compétences pratiques plutôt que des années d’ancienneté.'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Foire Aux Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Questions fréquemment posées
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Tout ce que vous devez savoir pour démarrer sereinement sur la plateforme.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-bold text-sm text-slate-900 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ml-2 ${
                      isOpen ? 'rotate-180 text-emerald-700' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-xs text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
