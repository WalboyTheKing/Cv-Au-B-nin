/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, CheckCircle, FileText, HelpCircle, Briefcase } from 'lucide-react';

export const CareerAdvice: React.FC = () => {
  const tips = [
    {
      title: '1. Un numéro WhatsApp actif et un e-mail professionnel',
      text: 'Au Bénin, la majorité des premiers contacts et convocations d’entretiens se font par téléphone, WhatsApp ou e-mail. Indiquez un numéro joignable (+229) et une adresse e-mail sobre (ex: prenom.nom@gmail.com) au lieu de pseudonymes fantaisistes.'
    },
    {
      title: '2. Clarté sur les diplômes et établissements d’origine',
      text: 'Précisez toujours l’intitulé exact de votre diplôme (Licence, Master, BTS, BAC Technique), l’établissement d’obtention (ex: IFRI - UAC, ENEAM, Pigier, HECM) ainsi que l’année de délivrance ou la mention du mémoire si elle est valorisante.'
    },
    {
      title: '3. Privilégier les réalisations plutôt que de simples listes de tâches',
      text: 'Au lieu d’écrire "Gestion des clients", formulez : "Accueil et suivi de 40 clients quotidiens, réduction des délais d’attente au guichet de 25%". Les recruteurs recherchent des preuves d’impact concret.'
    },
    {
      title: '4. Adapter la longueur : 1 à 2 pages A4 maximum',
      text: 'Pour un profil débutant ou avec moins de 5 ans d’expérience, un CV d’une page A4 dense et aérée est amplement suffisant. Ne cherchez pas à combler le vide avec des informations inutiles.'
    },
    {
      title: '5. Cohérence avec les offres de l’ANPE et des plateformes locales',
      text: 'Lorsque vous répondez à une offre d’emploi ou à un appel d’offres, reprenez les mots-clés de l’annonce dans votre section compétences pour faciliter la présélection des recruteurs et jurys.'
    }
  ];

  return (
    <section id="tips-section" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guide Carrière & Recrutement</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Les clés pour un CV percutant sur le marché de l'emploi au Bénin
          </h2>
          <p className="text-slate-600 text-sm mt-3">
            Découvrez nos recommandations concrètes pour maximiser l'impact de vos dossiers de candidature auprès des entreprises et institutions béninoises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tips.map((tip, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow"
            >
              <h3 className="font-bold text-slate-900 text-sm mb-2 text-emerald-800">
                {tip.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed text-justify">{tip.text}</p>
            </div>
          ))}

          {/* Carte d'action */}
          <div className="bg-emerald-700 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-extrabold text-base mb-2">Prêt à passer à l'action ?</h3>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Appliquez ces conseils immédiatement grâce à nos modèles de CV conçus pour respecter ces standards.
              </p>
            </div>
            <div className="pt-4">
              <a
                href="#builder"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-block w-full text-center py-2.5 px-4 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-xs transition-colors"
              >
                Commencer mon CV maintenant
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
