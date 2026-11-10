/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TemplateDefinition, CVData } from '../../types';

interface TemplateMiniatureProps {
  template: TemplateDefinition;
  color?: string;
  cv?: CVData;
  className?: string;
}

export const TemplateMiniature: React.FC<TemplateMiniatureProps> = ({
  template,
  color,
  cv,
  className = ''
}) => {
  const primaryColor = color || template.defaultColor || '#047857';
  const name = cv?.personalInfo?.lastName
    ? `${cv.personalInfo.firstName || ''} ${cv.personalInfo.lastName}`.trim()
    : 'Jean-Eudes DOSSOU';
  const title = cv?.personalInfo?.jobTitle || 'Professionnel Qualifié';

  // Rendu de la miniature selon le layout structurel réel de chaque modèle
  return (
    <div
      className={`w-full aspect-[210/297] bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative select-none flex flex-col text-[7px] leading-tight transition-transform ${className}`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* 1. MODÈLE MODERNE & PREMIER EMPLOI (Bandeau latéral gauche) */}
      {(template.id === 'moderne' || template.id === 'premier_emploi' || template.id === 'stage') && (
        <div className="grid grid-cols-12 h-full">
          <div className="col-span-4 p-2 text-white flex flex-col justify-between" style={{ backgroundColor: primaryColor }}>
            <div className="space-y-1.5">
              <div className="w-7 h-7 mx-auto rounded-full bg-white/30 border border-white/50 flex items-center justify-center font-bold text-[8px]">
                {name[0]}
              </div>
              <div className="space-y-0.5 pt-1">
                <div className="h-1 bg-white/40 rounded w-full" />
                <div className="h-1 bg-white/30 rounded w-4/5" />
                <div className="h-1 bg-white/30 rounded w-2/3" />
              </div>
              <div className="pt-2">
                <div className="text-[6px] font-bold uppercase tracking-wider text-white/80 mb-1">Compétences</div>
                <div className="flex flex-wrap gap-0.5">
                  <span className="bg-white/20 px-1 py-0.2 rounded text-[5px]">React</span>
                  <span className="bg-white/20 px-1 py-0.2 rounded text-[5px]">SQL</span>
                  <span className="bg-white/20 px-1 py-0.2 rounded text-[5px]">SYSCOHADA</span>
                </div>
              </div>
            </div>
            <div className="text-[5px] text-white/50 text-center">Bénin • Disponible</div>
          </div>
          <div className="col-span-8 p-2.5 flex flex-col justify-between bg-white">
            <div>
              <div className="border-b pb-1 mb-1.5" style={{ borderColor: `${primaryColor}40` }}>
                <div className="font-extrabold text-[8px] text-slate-900 truncate">{name}</div>
                <div className="text-[6px] font-bold uppercase" style={{ color: primaryColor }}>{title}</div>
              </div>
              <div className="space-y-1">
                <div className="h-1 bg-slate-200 rounded w-full" />
                <div className="h-1 bg-slate-200 rounded w-11/12" />
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-[6px] font-bold uppercase text-slate-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                  Expériences
                </div>
                <div className="pl-1.5 border-l" style={{ borderColor: `${primaryColor}50` }}>
                  <div className="h-1 bg-slate-300 rounded w-3/4 mb-0.5" />
                  <div className="h-0.5 bg-slate-200 rounded w-full" />
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-[6px] font-bold uppercase text-slate-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                  Formations
                </div>
                <div className="pl-1.5 border-l" style={{ borderColor: `${primaryColor}50` }}>
                  <div className="h-1 bg-slate-300 rounded w-2/3 mb-0.5" />
                  <div className="h-0.5 bg-slate-200 rounded w-4/5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODÈLE CLASSIQUE & ENSEIGNANT & PROFESSIONNEL (1 colonne centrée sobre) */}
      {(template.id === 'classique' || template.id === 'enseignant' || template.id === 'professionnel') && (
        <div className="p-3 h-full flex flex-col justify-between bg-white">
          <div>
            <div className="text-center pb-1.5 border-b-2 mb-2" style={{ borderColor: primaryColor }}>
              <div className="font-bold text-[8.5px] uppercase tracking-wide text-slate-900">{name}</div>
              <div className="text-[6px] font-bold uppercase tracking-wider mt-0.5" style={{ color: primaryColor }}>{title}</div>
              <div className="text-[5px] text-slate-500 mt-0.5">Cotonou, Bénin • +229 97 00 00 00 • contact@cvprobenin.bj</div>
            </div>
            <div className="space-y-1.5">
              <div>
                <div className="text-[6px] font-bold uppercase tracking-wider pb-0.5 mb-1 border-b" style={{ borderColor: `${primaryColor}40`, color: primaryColor }}>
                  Profil Professionnel
                </div>
                <div className="h-1 bg-slate-200 rounded w-full mb-0.5" />
                <div className="h-1 bg-slate-200 rounded w-5/6" />
              </div>
              <div>
                <div className="text-[6px] font-bold uppercase tracking-wider pb-0.5 mb-1 border-b" style={{ borderColor: `${primaryColor}40`, color: primaryColor }}>
                  Expériences Professionnelles
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <div className="h-1 bg-slate-800 rounded w-1/2" />
                    <div className="h-1 bg-slate-300 rounded w-1/4" />
                  </div>
                  <div className="h-0.5 bg-slate-200 rounded w-full" />
                  <div className="h-0.5 bg-slate-200 rounded w-4/5" />
                </div>
              </div>
              <div>
                <div className="text-[6px] font-bold uppercase tracking-wider pb-0.5 mb-1 border-b" style={{ borderColor: `${primaryColor}40`, color: primaryColor }}>
                  Formation & Diplômes
                </div>
                <div className="space-y-0.5">
                  <div className="h-1 bg-slate-800 rounded w-3/5" />
                  <div className="h-0.5 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t pt-1 flex justify-between text-[5px] text-slate-400">
            <span>UAC Bénin</span>
            <span>Page 1 / 1</span>
          </div>
        </div>
      )}

      {/* 3. MODÈLE MINIMALISTE & SANS PHOTO (Épuré, ATS-friendly) */}
      {(template.id === 'minimaliste' || template.id === 'sans_photo') && (
        <div className="p-3 h-full flex flex-col justify-between bg-white text-slate-800">
          <div>
            <div className="border-b pb-1.5 mb-2">
              <div className="font-light text-[9px] text-slate-900 tracking-tight">
                {name.split(' ')[0]} <span className="font-bold">{name.split(' ').slice(1).join(' ')}</span>
              </div>
              <div className="text-[6px] text-slate-600 font-medium">{title}</div>
              <div className="text-[5px] text-slate-400 mt-0.5">Cotonou • contact@cvprobenin.bj • +229 97 00 00 00</div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-[6px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Expérience</div>
                <div className="space-y-0.5">
                  <div className="h-1 bg-slate-700 rounded w-2/3" />
                  <div className="h-0.5 bg-slate-200 rounded w-full" />
                  <div className="h-0.5 bg-slate-200 rounded w-4/5" />
                </div>
              </div>
              <div>
                <div className="text-[6px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Formation</div>
                <div className="space-y-0.5">
                  <div className="h-1 bg-slate-700 rounded w-1/2" />
                  <div className="h-0.5 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
              <div>
                <div className="text-[6px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Compétences</div>
                <div className="flex flex-wrap gap-0.5">
                  <span className="bg-slate-100 px-1 py-0.2 rounded text-[5px]">Gestion</span>
                  <span className="bg-slate-100 px-1 py-0.2 rounded text-[5px]">Anglais</span>
                  <span className="bg-slate-100 px-1 py-0.2 rounded text-[5px]">Excel</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-[5px] text-slate-400 text-right">Format standard ATS</div>
        </div>
      )}

      {/* 4. MODÈLE ÉTUDIANT & STAGE (En-tête bleu/indigo académique) */}
      {template.id === 'etudiant' && (
        <div className="h-full flex flex-col bg-white">
          <div className="p-2 text-white" style={{ backgroundColor: primaryColor }}>
            <div className="font-extrabold text-[8px] truncate">{name}</div>
            <div className="text-[6px] font-semibold text-white/90">{title}</div>
            <div className="text-[5px] text-white/70 mt-0.5">UAC / UP • Cotonou, Bénin</div>
          </div>
          <div className="p-2.5 flex-1 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div>
                <div className="text-[6px] font-bold uppercase tracking-wider mb-1" style={{ color: primaryColor }}>
                  Formation & Diplômes (Prioritaire)
                </div>
                <div className="pl-1 border-l-2" style={{ borderColor: primaryColor }}>
                  <div className="h-1 bg-slate-800 rounded w-3/4 mb-0.5" />
                  <div className="h-0.5 bg-slate-300 rounded w-1/2" />
                </div>
              </div>
              <div>
                <div className="text-[6px] font-bold uppercase tracking-wider mb-1" style={{ color: primaryColor }}>
                  Stages & Projets
                </div>
                <div className="pl-1 border-l-2" style={{ borderColor: `${primaryColor}40` }}>
                  <div className="h-1 bg-slate-800 rounded w-2/3 mb-0.5" />
                  <div className="h-0.5 bg-slate-200 rounded w-full" />
                </div>
              </div>
            </div>
            <div className="flex justify-between border-t pt-1 text-[5px] text-slate-400">
              <span>Mention Bien</span>
              <span>2024-2026</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODÈLE INFORMATIQUE / TECH (Mode dark tech) */}
      {template.id === 'informatique' && (
        <div className="p-2.5 h-full flex flex-col justify-between bg-slate-900 text-white font-mono">
          <div>
            <div className="border-b border-slate-700 pb-1.5 mb-2">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[5px] text-emerald-400 tracking-wider">AVAILABLE_FOR_HIRE</span>
              </div>
              <div className="font-bold text-[8.5px] text-white">{name}</div>
              <div className="text-[6px] text-slate-300">{title}</div>
            </div>
            <div className="space-y-1.5">
              <div>
                <div className="text-[6px] text-emerald-400">// STACK_TECHNIQUE</div>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  <span className="bg-slate-800 border border-slate-700 text-slate-200 px-1 py-0.2 rounded text-[5px]">React</span>
                  <span className="bg-slate-800 border border-slate-700 text-slate-200 px-1 py-0.2 rounded text-[5px]">Node.js</span>
                  <span className="bg-slate-800 border border-slate-700 text-slate-200 px-1 py-0.2 rounded text-[5px]">PostgreSQL</span>
                </div>
              </div>
              <div>
                <div className="text-[6px] text-emerald-400">// RECENT_PROJECTS</div>
                <div className="border-l border-emerald-500/40 pl-1 space-y-0.5">
                  <div className="h-1 bg-slate-300 rounded w-4/5" />
                  <div className="h-0.5 bg-slate-600 rounded w-full" />
                </div>
              </div>
            </div>
          </div>
          <div className="text-[5px] text-slate-500 text-right">git://github.com/benin-dev</div>
        </div>
      )}

      {/* 6. MODÈLE COMMERCIAL & MANAGEMENT (Bannière prestige) */}
      {(template.id === 'commercial' || template.id === 'management') && (
        <div className="h-full flex flex-col bg-white">
          <div className="p-2.5 text-white" style={{ backgroundColor: primaryColor }}>
            <div className="font-black text-[9px] uppercase tracking-wide truncate">{name}</div>
            <div className="text-[6px] font-bold uppercase tracking-wider text-white/90">{title}</div>
            <div className="flex gap-1.5 text-[5px] text-white/80 mt-1">
              <span>+229 97 00 00 00</span>
              <span>• Cotonou, Bénin</span>
            </div>
          </div>
          <div className="p-2.5 flex-1 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="p-1 rounded bg-slate-50 border border-slate-200 text-[5px] italic text-slate-600">
                « Leadership opérationnel & développement de portefeuilles B2B »
              </div>
              <div>
                <div className="text-[6px] font-bold uppercase border-b pb-0.5 mb-1" style={{ color: primaryColor, borderColor: `${primaryColor}40` }}>
                  Réalisations Majeures & Direction
                </div>
                <div className="space-y-0.5">
                  <div className="h-1 bg-slate-800 rounded w-3/4" />
                  <div className="h-0.5 bg-slate-300 rounded w-full" />
                </div>
              </div>
            </div>
            <div className="text-[5px] font-bold text-right" style={{ color: primaryColor }}>
              Performance & Résultats
            </div>
          </div>
        </div>
      )}

      {/* 7. MODÈLE COMPTABILITÉ & FINANCE (Cadre formel SYSCOHADA) */}
      {template.id === 'comptabilite' && (
        <div className="p-2.5 h-full flex flex-col justify-between bg-white text-slate-900 border-2 border-slate-800 m-1">
          <div>
            <div className="border-b-2 border-slate-800 pb-1 mb-1.5 flex justify-between items-baseline">
              <div>
                <div className="font-black text-[8px] uppercase text-slate-900">{name}</div>
                <div className="text-[6px] font-bold uppercase text-teal-800">{title}</div>
              </div>
              <div className="text-[5px] text-slate-500 text-right">Cotonou, Bénin</div>
            </div>
            <div className="space-y-1.5">
              <div>
                <div className="text-[6px] font-bold uppercase text-slate-800 border-b pb-0.5 mb-0.5">
                  Missions Comptables SYSCOHADA
                </div>
                <div className="h-1 bg-slate-700 rounded w-4/5 mb-0.5" />
                <div className="h-0.5 bg-slate-200 rounded w-full" />
              </div>
              <div>
                <div className="text-[6px] font-bold uppercase text-slate-800 border-b pb-0.5 mb-0.5">
                  Fiscalité DGI & Déclarations CNSS
                </div>
                <div className="h-1 bg-slate-700 rounded w-2/3" />
              </div>
            </div>
          </div>
          <div className="text-[5px] text-slate-400 text-center border-t pt-0.5">Conforme SYSCOHADA Révisé</div>
        </div>
      )}

      {/* 8. MODÈLE TECHNICIEN & ADMINISTRATIF (Colonne droite) */}
      {(template.id === 'technicien' || template.id === 'administratif') && (
        <div className="grid grid-cols-12 h-full bg-white">
          <div className="col-span-8 p-2.5 flex flex-col justify-between border-r border-slate-200">
            <div>
              <div className="border-b pb-1 mb-1.5">
                <div className="font-extrabold text-[8px] text-slate-900 truncate">{name}</div>
                <div className="text-[6px] font-bold uppercase" style={{ color: primaryColor }}>{title}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[6px] font-bold uppercase text-slate-700">Missions & Chantiers</div>
                <div className="pl-1 border-l" style={{ borderColor: primaryColor }}>
                  <div className="h-1 bg-slate-800 rounded w-3/4 mb-0.5" />
                  <div className="h-0.5 bg-slate-200 rounded w-full" />
                </div>
              </div>
            </div>
            <div className="text-[5px] text-slate-400">Opérations terrain</div>
          </div>
          <div className="col-span-4 p-2 bg-slate-50 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="text-[6px] font-bold uppercase" style={{ color: primaryColor }}>Habilitations</div>
              <div className="space-y-0.5">
                <div className="h-1 bg-slate-300 rounded w-full" />
                <div className="h-1 bg-slate-300 rounded w-4/5" />
              </div>
              <div className="text-[6px] font-bold uppercase mt-1" style={{ color: primaryColor }}>Outils</div>
              <div className="h-0.5 bg-slate-300 rounded w-2/3" />
            </div>
            <div className="text-[5px] text-slate-400 text-center">BTP & Tech</div>
          </div>
        </div>
      )}
    </div>
  );
};
