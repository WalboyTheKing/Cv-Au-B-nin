/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plan, UserProfile } from '../../types';
import { Check, Sparkles, Shield, AlertCircle } from 'lucide-react';

interface PricingSectionProps {
  plans: Plan[];
  currentUser: UserProfile | null;
  onSelectPlan: (plan: Plan) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  plans,
  currentUser,
  onSelectPlan
}) => {
  return (
    <section id="pricing-section" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold mb-3">
            <span>Paiement en Francs CFA (XOF) exclusivement</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Des tarifs justes et accessibles, adaptés au Bénin
          </h2>
          <p className="text-slate-600 text-sm mt-3">
            Choisissez l'offre qui correspond à votre rythme de recherche d'emploi. Aucun abonnement tacite ou prélèvement caché : vous payez une fois pour la durée choisie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {plans.map((plan) => {
            const isFeatured = plan.code === 'premium_7d';
            const isCurrent = currentUser?.subscription?.planId === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-7 flex flex-col justify-between transition-all duration-200 ${
                  isFeatured
                    ? 'bg-slate-900 text-white shadow-xl ring-2 ring-emerald-500 scale-102'
                    : 'bg-white text-slate-900 border border-slate-200 shadow-2xs hover:shadow-md'
                }`}
              >
                {/* Badge Recommandé */}
                {isFeatured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Le plus populaire au Bénin
                  </div>
                )}

                <div>
                  <div className="mb-4">
                    <h3 className="font-extrabold text-lg">{plan.name}</h3>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isFeatured ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Prix en FCFA */}
                  <div className="mb-6 pb-6 border-b border-slate-200/20">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
                        {plan.priceXOF.toLocaleString('fr-FR')}
                      </span>
                      <span className="text-sm font-bold uppercase tracking-wider opacity-80">
                        FCFA
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium block mt-1 ${
                        isFeatured ? 'text-emerald-300' : 'text-emerald-700'
                      }`}
                    >
                      {plan.priceXOF === 0
                        ? 'Accès gratuit permanent'
                        : `Paiement unique • Valable ${plan.durationDays} jours`}
                    </span>
                  </div>

                  {/* Liste des fonctionnalités */}
                  <ul className="space-y-2.5 text-xs mb-8">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isFeatured ? 'text-emerald-400' : 'text-emerald-600'
                          }`}
                        />
                        <span className={isFeatured ? 'text-slate-200' : 'text-slate-700'}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bouton d'action */}
                <div>
                  <button
                    onClick={() => onSelectPlan(plan)}
                    disabled={isCurrent}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm ${
                      isCurrent
                        ? 'bg-slate-200 text-slate-500 cursor-default'
                        : isFeatured
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    {isCurrent
                      ? 'Votre forfait actuel'
                      : plan.priceXOF === 0
                      ? 'Commencer gratuitement'
                      : `Souscrire à ${plan.priceXOF} FCFA`}
                  </button>
                  <p
                    className={`text-[10px] text-center mt-2.5 ${
                      isFeatured ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    Règlement sécurisé MTN & Moov Money
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Garanties et réassurance */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-50 border border-slate-200 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-700">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">Zéro mauvaise surprise</span>
              <span>Pas de reconduction tacite ni d'abonnement involontaire. Vous restez maître de votre solde Mobile Money.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
              MTN *880#
            </span>
            <span className="text-[11px] font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
              Moov *855#
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
