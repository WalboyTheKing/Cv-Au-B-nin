/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  Layout,
  FileCheck2,
  Eye,
  Download,
  Save,
  CreditCard,
  ShieldCheck
} from 'lucide-react';

export const Advantages: React.FC = () => {
  const items = [
    {
      icon: <Layout className="w-5 h-5 text-emerald-600" />,
      title: 'Création guidée étape par étape',
      description:
        'Avancez en toute sérénité. Des formulaires ergonomiques vous accompagnent à chaque étape sans risque d’oublier une mention cruciale.'
    },
    {
      icon: <FileCheck2 className="w-5 h-5 text-emerald-600" />,
      title: '15 modèles professionnels originaux',
      description:
        'De véritables variations de mise en page pour jeunes diplômés, techniciens, comptables, commerciaux, enseignants ou cadres au Bénin.'
    },
    {
      icon: <Sparkles className="w-5 h-5 text-emerald-600" />,
      title: 'Suggestions de rédaction locales',
      description:
        'Bénéficiez d’exemples réalistes de résumés et de compétences adaptés aux universités et entreprises de notre pays.'
    },
    {
      icon: <Eye className="w-5 h-5 text-emerald-600" />,
      title: 'Prévisualisation en direct',
      description:
        'Observez instantanément l’impact de vos modifications sur la page A4, les polices typographiques et les nuances de couleurs.'
    },
    {
      icon: <Download className="w-5 h-5 text-emerald-600" />,
      title: 'Export PDF A4 haute définition',
      description:
        'Téléchargez un fichier PDF propre, sélectionnable par les systèmes de recrutement (ATS) et parfaitement imprimable.'
    },
    {
      icon: <Save className="w-5 h-5 text-emerald-600" />,
      title: 'Sauvegarde automatique continue',
      description:
        'Votre travail est mémorisé au fil de la saisie. Reprenez votre CV à tout moment sans crainte de coupure d’électricité ou de réseau.'
    },
    {
      icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
      title: 'Paiement local MTN & Moov en FCFA',
      description:
        'Réglez vos accès premium en toute sécurité via vos comptes Mobile Money béninois habituels, sans carte bancaire internationale obligatoire.'
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      title: 'Confidentialité et données protégées',
      description:
        'Vos données personnelles et vos CV demeurent privés. Aucun partage à des tiers ni exploitation commerciale sans accord.'
    }
  ];

  return (
    <section className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs uppercase tracking-widest text-emerald-700 font-extrabold mb-2">
            Pourquoi choisir notre plateforme
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tout ce dont vous avez besoin pour réussir vos candidatures
          </h3>
          <p className="text-slate-600 text-sm mt-3">
            Une interface intuitive conçue pour valoriser vos compétences réelles auprès des recruteurs au Bénin et à l'international.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
