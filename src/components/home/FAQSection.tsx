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
      q: 'Comment s’effectue le paiement par Moov Money au Bénin ?',
      a: 'Le règlement s’effectue en Francs CFA (XOF) via Moov Money (*855#) vers le numéro 0194537741 (Waaliyou Z Labouda). Vous renseignez ensuite votre référence de transaction SMS dans l’application, et votre accès est activé dès vérification par l’administration.'
    },
    {
      q: 'Y a-t-il un renouvellement automatique ou un prélèvement imprévu ?',
      a: 'Absolument aucun. Vous choisissez librement entre la formule Découverte gratuite, l’Accès Candidature (500 FCFA / 24h) ou le Pack Carrière (1 000 FCFA / 30 jours). À l’expiration, aucun débit n’est effectué.'
    },
    {
      q: 'Mes CV sont-ils supprimés à la fin des 24 heures ou des 30 jours ?',
      a: 'Jamais. Vos CV restent conservés en sécurité dans votre espace personnel. Après expiration d’un accès payant, le CV concerné passe simplement en consultation et nécessite un nouveau pass pour être modifié à nouveau ou exporté sans filigrane.'
    },
    {
      q: 'Mon CV au format PDF est-il compatible avec les systèmes de recrutement (ATS) ?',
      a: 'Oui. Nos 15 modèles génèrent des documents A4 avec texte réel sélectionnable, indexable par les logiciels ATS, et des liens cliquables (téléphone, WhatsApp, e-mail, LinkedIn et portfolio).'
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
