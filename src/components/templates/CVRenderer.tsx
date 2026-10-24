/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CVData } from '../../types';
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  CheckCircle2,
  FolderGit2
} from 'lucide-react';

interface CVRendererProps {
  cv: CVData;
  scale?: number;
  showWatermark?: boolean;
}

export const CVRenderer: React.FC<CVRendererProps> = ({
  cv,
  scale = 1,
  showWatermark = false
}) => {
  const { personalInfo, settings } = cv;
  const primaryColor = settings?.primaryColor || '#047857';
  const templateId = settings?.templateId || 'moderne';
  const fontFamily = settings?.fontFamily || 'Inter';

  // Sélecteur de style de police
  const fontClass =
    fontFamily === 'Merriweather'
      ? 'font-serif'
      : fontFamily === 'Outfit' || fontFamily === 'Poppins'
      ? 'font-sans tracking-tight'
      : 'font-sans';

  return (
    <div
      className="relative transition-transform origin-top flex justify-center print:m-0 print:p-0"
      style={{ transform: `scale(${scale})` }}
    >
      {/* Conteneur standardisé au format A4 exact (210mm x 297mm) */}
      <div
        id="cv-document-preview"
        className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl print:shadow-none print:w-full print:min-h-0 print:h-auto overflow-hidden relative ${fontClass} leading-relaxed`}
        style={{
          boxSizing: 'border-box'
        }}
      >
        {/* Rendu du modèle sélectionné */}
        {renderTemplateContent(templateId, cv, primaryColor)}

        {/* Filigrane conditionnel pour le forfait gratuit */}
        {showWatermark && (
          <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none select-none z-30">
            <span className="text-[10px] tracking-wider text-slate-400/80 bg-white/90 px-3 py-0.5 rounded-full border border-slate-200">
              Créé avec CV Pro Bénin — Version Découverte (Passez au Premium pour retirer le filigrane)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

function renderTemplateContent(templateId: string, cv: CVData, color: string) {
  switch (templateId) {
    case 'classique':
    case 'enseignant':
    case 'professionnel':
      return <SingleColumnClassic cv={cv} color={color} />;

    case 'minimaliste':
    case 'sans_photo':
      return <MinimalistLayout cv={cv} color={color} showPhoto={templateId !== 'sans_photo'} />;

    case 'premier_emploi':
    case 'etudiant':
    case 'stage':
      return <StudentEarlyCareerLayout cv={cv} color={color} />;

    case 'technicien':
    case 'administratif':
      return <TwoColumnRightLayout cv={cv} color={color} />;

    case 'informatique':
      return <TechDeveloperLayout cv={cv} color={color} />;

    case 'commercial':
    case 'management':
      return <ExecutiveTopHeaderLayout cv={cv} color={color} />;

    case 'comptabilite':
      return <FinanceAccountingLayout cv={cv} color={color} />;

    case 'moderne':
    default:
      return <ModernTwoColumnLeft cv={cv} color={color} />;
  }
}

// -------------------------------------------------------------
// 1. MODÈLE MODERNE (Deux colonnes avec bandeau latéral gauche)
// -------------------------------------------------------------
function ModernTwoColumnLeft({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills, languages, customSections } = cv;

  return (
    <div className="grid grid-cols-12 min-h-[297mm]">
      {/* Colonne latérale gauche */}
      <div
        className="col-span-4 p-6 text-white flex flex-col justify-between"
        style={{ backgroundColor: color }}
      >
        <div>
          {/* Photo ou Initiales */}
          <div className="flex justify-center mb-5">
            {personalInfo.photoUrl ? (
              <img
                src={personalInfo.photoUrl}
                alt={`${personalInfo.firstName} ${personalInfo.lastName}`}
                className="w-28 h-28 rounded-full object-cover border-4 border-white/30 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl font-bold tracking-wider text-white">
                {personalInfo.firstName?.[0]}
                {personalInfo.lastName?.[0]}
              </div>
            )}
          </div>

          {/* Coordonnées */}
          <div className="space-y-3 text-xs mb-8">
            <h3 className="text-xs uppercase tracking-widest font-semibold border-b border-white/20 pb-1 mb-3">
              Contact
            </h3>
            {personalInfo.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span>{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo.email && (
              <div className="flex items-center gap-2 break-all">
                <Mail className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span>{personalInfo.email}</span>
              </div>
            )}
            {(personalInfo.city || personalInfo.country) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span>
                  {personalInfo.city}
                  {personalInfo.city && personalInfo.country ? ', ' : ''}
                  {personalInfo.country}
                </span>
              </div>
            )}
            {personalInfo.linkedIn && (
              <div className="flex items-center gap-2 break-all">
                <Linkedin className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span>{personalInfo.linkedIn}</span>
              </div>
            )}
            {personalInfo.website && (
              <div className="flex items-center gap-2 break-all">
                <Globe className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span>{personalInfo.website}</span>
              </div>
            )}
          </div>

          {/* Compétences */}
          {skills && skills.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs uppercase tracking-widest font-semibold border-b border-white/20 pb-1 mb-3">
                Compétences
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s.id}
                    className="text-[11px] bg-white/15 px-2.5 py-1 rounded font-medium"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Langues */}
          {languages && languages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-widest font-semibold border-b border-white/20 pb-1 mb-3">
                Langues
              </h3>
              <div className="space-y-2 text-xs">
                {languages.map((l) => (
                  <div key={l.id} className="flex justify-between items-center">
                    <span className="font-medium">{l.name}</span>
                    <span className="text-[10px] opacity-80 capitalize">{l.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-[9px] opacity-50 text-center pt-4">
          Bénin • Disponible immédiatement
        </div>
      </div>

      {/* Contenu principal droite */}
      <div className="col-span-8 p-8 flex flex-col justify-between">
        <div>
          {/* En-tête nom & titre */}
          <div className="border-b pb-4 mb-6" style={{ borderColor: `${color}30` }}>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {personalInfo.firstName} <span style={{ color }}>{personalInfo.lastName}</span>
            </h1>
            <p className="text-base font-semibold mt-1 text-slate-700 tracking-wide uppercase">
              {personalInfo.jobTitle}
            </p>
          </div>

          {/* Profil */}
          {cv.profileSummary && (
            <div className="mb-6">
              <h2
                className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                style={{ color }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                Profil Professionnel
              </h2>
              <p className="text-xs text-slate-600 text-justify leading-relaxed">
                {cv.profileSummary}
              </p>
            </div>
          )}

          {/* Expériences */}
          {experiences && experiences.length > 0 && (
            <div className="mb-6">
              <h2
                className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"
                style={{ color }}
              >
                <Briefcase className="w-3.5 h-3.5" style={{ color }} />
                Expériences Professionnelles
              </h2>
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="relative pl-3 border-l-2" style={{ borderColor: `${color}40` }}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-xs font-bold text-slate-900">{exp.role}</h3>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {exp.startDate} - {exp.current ? 'Présent' : exp.endDate}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-700 mb-1">
                      {exp.company} • <span className="text-slate-500">{exp.city}</span>
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {exp.description}
                    </p>
                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul className="mt-1.5 space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                        {exp.achievements.map((ach, idx) => (
                          <li key={idx}>{ach}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formations */}
          {educations && educations.length > 0 && (
            <div className="mb-6">
              <h2
                className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"
                style={{ color }}
              >
                <GraduationCap className="w-3.5 h-3.5" style={{ color }} />
                Formation & Diplômes
              </h2>
              <div className="space-y-3">
                {educations.map((edu) => (
                  <div key={edu.id} className="border-l-2 pl-3" style={{ borderColor: `${color}40` }}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-xs font-bold text-slate-900">{edu.degree}</h3>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {edu.startDate} {edu.endDate ? `- ${edu.endDate}` : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium">{edu.institution}</p>
                    {edu.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sections personnalisées (Certifications, Projets, etc.) */}
          {customSections &&
            customSections
              .filter((sec) => sec.enabled && sec.items.length > 0)
              .map((sec) => (
                <div key={sec.id} className="mb-5">
                  <h2
                    className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                    style={{ color }}
                  >
                    <Award className="w-3.5 h-3.5" style={{ color }} />
                    {sec.title}
                  </h2>
                  <div className="space-y-2">
                    {sec.items.map((it) => (
                      <div key={it.id} className="text-xs">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-900">{it.title}</span>
                          {it.date && <span className="text-[10px] text-slate-500">{it.date}</span>}
                        </div>
                        {it.subtitle && (
                          <div className="text-[11px] text-slate-600 italic">{it.subtitle}</div>
                        )}
                        {it.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{it.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. MODÈLE CLASSIQUE & INSTITUTIONNEL (Une seule colonne, sobre)
// -------------------------------------------------------------
function SingleColumnClassic({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills, languages, customSections } = cv;

  return (
    <div className="p-10 text-slate-900">
      {/* En-tête centré institutionnel */}
      <div className="text-center pb-5 border-b-2" style={{ borderColor: color }}>
        <h1 className="text-2xl font-bold tracking-wide uppercase text-slate-950">
          {personalInfo.firstName} {personalInfo.lastName}
        </h1>
        <p className="text-sm font-semibold tracking-widest uppercase mt-1" style={{ color }}>
          {personalInfo.jobTitle}
        </p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2">
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.email && <span>• {personalInfo.email}</span>}
          {personalInfo.city && <span>• {personalInfo.city}, Bénin</span>}
          {personalInfo.linkedIn && <span>• {personalInfo.linkedIn}</span>}
        </div>
      </div>

      {/* Profil */}
      {cv.profileSummary && (
        <div className="mt-5">
          <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b" style={{ borderColor: `${color}60`, color }}>
            Profil Professionnel
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">{cv.profileSummary}</p>
        </div>
      )}

      {/* Expériences */}
      {experiences && experiences.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-3 border-b" style={{ borderColor: `${color}60`, color }}>
            Expériences Professionnelles
          </h2>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-950">{exp.role}</span>
                  <span className="text-[11px] text-slate-600 font-medium">
                    {exp.startDate} - {exp.current ? 'Présent' : exp.endDate}
                  </span>
                </div>
                <div className="text-[11px] text-slate-700 font-medium italic mb-1">
                  {exp.company} — {exp.city}, Bénin
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{exp.description}</p>
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                    {exp.achievements.map((ach, idx) => (
                      <li key={idx}>{ach}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formations */}
      {educations && educations.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-3 border-b" style={{ borderColor: `${color}60`, color }}>
            Formation Académique & Diplômes
          </h2>
          <div className="space-y-3">
            {educations.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <div className="text-xs font-bold text-slate-950">{edu.degree}</div>
                  <div className="text-[11px] text-slate-700">{edu.institution}</div>
                  {edu.description && <div className="text-[11px] text-slate-500 mt-0.5">{edu.description}</div>}
                </div>
                <span className="text-[11px] text-slate-600 font-medium shrink-0 ml-4">
                  {edu.startDate} {edu.endDate ? `- ${edu.endDate}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compétences & Langues */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        {skills && skills.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b" style={{ borderColor: `${color}60`, color }}>
              Compétences Clés
            </h2>
            <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
              {skills.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ul>
          </div>
        )}

        {languages && languages.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b" style={{ borderColor: `${color}60`, color }}>
              Langues Pratiquées
            </h2>
            <div className="text-xs text-slate-700 space-y-1.5">
              {languages.map((l) => (
                <div key={l.id} className="flex justify-between">
                  <span className="font-medium">{l.name}</span>
                  <span className="text-slate-500 capitalize">{l.level}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sections supplémentaires */}
      {customSections &&
        customSections
          .filter((sec) => sec.enabled && sec.items.length > 0)
          .map((sec) => (
            <div key={sec.id} className="mt-6">
              <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b" style={{ borderColor: `${color}60`, color }}>
                {sec.title}
              </h2>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {sec.items.map((it) => (
                  <div key={it.id}>
                    <div className="font-semibold text-slate-900">{it.title}</div>
                    {it.subtitle && <div className="text-[11px] text-slate-600">{it.subtitle}</div>}
                    {it.description && <div className="text-[11px] text-slate-500">{it.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
    </div>
  );
}

// -------------------------------------------------------------
// 3. MODÈLE MINIMALISTE & ATS (Sans fioritures, haute lisibilité)
// -------------------------------------------------------------
function MinimalistLayout({ cv, color, showPhoto = true }: { cv: CVData; color: string; showPhoto?: boolean }) {
  const { personalInfo, experiences, educations, skills, languages } = cv;

  return (
    <div className="p-10 text-slate-800">
      <div className="flex justify-between items-start border-b pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-slate-950">
            {personalInfo.firstName} <span className="font-semibold">{personalInfo.lastName}</span>
          </h1>
          <p className="text-sm font-medium text-slate-600 mt-1">{personalInfo.jobTitle}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-3">
            <span>{personalInfo.email}</span>
            <span>{personalInfo.phone}</span>
            <span>{personalInfo.city}, Bénin</span>
          </div>
        </div>
        {showPhoto && personalInfo.photoUrl && (
          <img
            src={personalInfo.photoUrl}
            alt=""
            className="w-20 h-20 rounded-md object-cover border"
          />
        )}
      </div>

      {cv.profileSummary && (
        <div className="mb-6">
          <p className="text-xs text-slate-600 leading-relaxed">{cv.profileSummary}</p>
        </div>
      )}

      {experiences && experiences.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">
            Expérience Professionnelle
          </h2>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-900">{exp.role}</span>
                  <span className="text-slate-500">
                    {exp.startDate} — {exp.current ? 'Actuel' : exp.endDate}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mb-1">
                  {exp.company}, {exp.city}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {educations && educations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">
            Formation
          </h2>
          <div className="space-y-3">
            {educations.map((edu) => (
              <div key={edu.id} className="flex justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{edu.degree}</div>
                  <div className="text-[11px] text-slate-600">{edu.institution}</div>
                </div>
                <span className="text-slate-500">
                  {edu.startDate} {edu.endDate ? `— ${edu.endDate}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 pt-4 border-t">
        {skills && skills.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
              Compétences
            </h2>
            <div className="text-xs text-slate-700 flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span key={s.id} className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {languages && languages.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-2">
              Langues
            </h2>
            <div className="text-xs text-slate-700 space-y-1">
              {languages.map((l) => (
                <div key={l.id} className="flex justify-between">
                  <span>{l.name}</span>
                  <span className="text-slate-400 capitalize">{l.level}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 4. MODÈLE PREMIER EMPLOI / ÉTUDIANT (Mise en avant études & projets)
// -------------------------------------------------------------
function StudentEarlyCareerLayout({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills, languages, customSections } = cv;

  return (
    <div className="min-h-[297mm]">
      {/* Top Banner */}
      <div className="p-8 text-white flex justify-between items-center" style={{ backgroundColor: color }}>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {personalInfo.firstName} {personalInfo.lastName}
          </h1>
          <p className="text-sm font-semibold opacity-95 mt-1 tracking-wide uppercase">
            {personalInfo.jobTitle}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-85 mt-2">
            <span>{personalInfo.phone}</span>
            <span>• {personalInfo.email}</span>
            <span>• {personalInfo.city}, Bénin</span>
          </div>
        </div>
        {personalInfo.photoUrl && (
          <img
            src={personalInfo.photoUrl}
            alt=""
            className="w-24 h-24 rounded-full border-4 border-white/30 object-cover shadow"
          />
        )}
      </div>

      <div className="p-8 grid grid-cols-12 gap-8">
        {/* Colonne principale (Formation en premier pour jeune diplômé/étudiant) */}
        <div className="col-span-8 space-y-6">
          {cv.profileSummary && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>
                Projet Professionnel & Objectif
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                {cv.profileSummary}
              </p>
            </div>
          )}

          {educations && educations.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color }}>
                <GraduationCap className="w-4 h-4" />
                Parcours Académique & Diplômes
              </h2>
              <div className="space-y-3">
                {educations.map((edu) => (
                  <div key={edu.id} className="border-l-2 pl-3" style={{ borderColor: color }}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-xs font-bold text-slate-900">{edu.degree}</h3>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {edu.startDate} {edu.endDate ? `- ${edu.endDate}` : ''}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-700">{edu.institution}</p>
                    {edu.description && <p className="text-[11px] text-slate-500 mt-0.5">{edu.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {experiences && experiences.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color }}>
                <Briefcase className="w-4 h-4" />
                Stages & Expériences Concrètes
              </h2>
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="border-l-2 pl-3" style={{ borderColor: `${color}40` }}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-xs font-bold text-slate-900">{exp.role}</h3>
                      <span className="text-[10px] text-slate-500">
                        {exp.startDate} - {exp.current ? 'Présent' : exp.endDate}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-700">{exp.company} • {exp.city}</p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="col-span-4 space-y-6">
          {skills && skills.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>
                Compétences Clés
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span key={s.id} className="text-[11px] bg-slate-100 text-slate-800 px-2 py-1 rounded font-medium border border-slate-200">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {languages && languages.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>
                Langues
              </h2>
              <div className="space-y-1.5 text-xs text-slate-700">
                {languages.map((l) => (
                  <div key={l.id} className="flex justify-between border-b pb-1">
                    <span className="font-medium">{l.name}</span>
                    <span className="text-slate-500 capitalize">{l.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customSections &&
            customSections
              .filter((s) => s.enabled && s.items.length > 0)
              .map((sec) => (
                <div key={sec.id}>
                  <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>
                    {sec.title}
                  </h2>
                  <div className="space-y-2 text-xs">
                    {sec.items.map((it) => (
                      <div key={it.id} className="bg-slate-50 p-2 rounded border border-slate-100">
                        <div className="font-semibold text-slate-900">{it.title}</div>
                        {it.subtitle && <div className="text-[10px] text-slate-600">{it.subtitle}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. MODÈLE TECH & DÉVELOPPEUR WEB (Noir slate, badge GitHub/Portfolio)
// -------------------------------------------------------------
function TechDeveloperLayout({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills, languages, customSections } = cv;

  return (
    <div className="p-8 text-slate-900">
      {/* Header Tech */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm mb-6 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400">
              Disponible immédiatement • Cotonou, Bénin
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            {personalInfo.firstName} {personalInfo.lastName}
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5">{personalInfo.jobTitle}</p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-3 font-mono">
            <span>{personalInfo.email}</span>
            <span>{personalInfo.phone}</span>
            {personalInfo.website && <span className="text-emerald-400">{personalInfo.website}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          {cv.profileSummary && (
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-2">
                // Résumé Professionnel
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">{cv.profileSummary}</p>
            </div>
          )}

          {experiences && experiences.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-3">
                // Expériences & Réalisations
              </h2>
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-slate-800 pl-3">
                    <div className="flex justify-between items-baseline font-mono">
                      <span className="text-xs font-bold text-slate-900">{exp.role}</span>
                      <span className="text-[10px] text-slate-500">
                        {exp.startDate} ~ {exp.current ? 'NOW' : exp.endDate}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-semibold mb-1">
                      {exp.company} — {exp.city}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>
                    {exp.achievements && (
                      <ul className="mt-1 space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                        {exp.achievements.map((ach, idx) => (
                          <li key={idx}>{ach}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {educations && educations.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-3">
                // Formation & Diplômes
              </h2>
              <div className="space-y-2">
                {educations.map((edu) => (
                  <div key={edu.id} className="flex justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{edu.degree}</div>
                      <div className="text-[11px] text-slate-600">{edu.institution}</div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{edu.startDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stack technique */}
        <div className="col-span-4 space-y-6">
          {skills && skills.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-3">
                // Stack Technique
              </h2>
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                {skills.map((s) => (
                  <span key={s.id} className="bg-white border border-slate-300 text-slate-800 px-2 py-1 rounded shadow-2xs font-semibold">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {languages && languages.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-2">
                // Langues
              </h2>
              <div className="space-y-1.5 text-xs">
                {languages.map((l) => (
                  <div key={l.id} className="flex justify-between">
                    <span className="font-medium">{l.name}</span>
                    <span className="text-slate-500 font-mono text-[10px] capitalize">{l.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 6. MODÈLE TECHNICIEN & ADMINISTRATIF (Deux colonnes avec barre droite)
// -------------------------------------------------------------
function TwoColumnRightLayout({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills, languages } = cv;

  return (
    <div className="p-8 grid grid-cols-12 gap-8 min-h-[297mm]">
      {/* Contenu principal gauche */}
      <div className="col-span-8 space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {personalInfo.firstName} {personalInfo.lastName}
          </h1>
          <p className="text-sm font-bold uppercase tracking-wider mt-1" style={{ color }}>
            {personalInfo.jobTitle}
          </p>
        </div>

        {cv.profileSummary && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>
              Résumé Professionnel
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed text-justify">{cv.profileSummary}</p>
          </div>
        )}

        {experiences && experiences.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color }}>
              Expériences & Chantiers / Missions
            </h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 pl-3" style={{ borderColor: color }}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xs font-bold text-slate-900">{exp.role}</h3>
                    <span className="text-[10px] text-slate-500">
                      {exp.startDate} - {exp.current ? 'En cours' : exp.endDate}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700">{exp.company} • {exp.city}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {educations && educations.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color }}>
              Diplômes & Habilitations
            </h2>
            <div className="space-y-3">
              {educations.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between text-xs font-bold text-slate-900">
                    <span>{edu.degree}</span>
                    <span className="text-slate-500 font-normal text-[10px]">{edu.startDate}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">{edu.institution}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barre latérale droite */}
      <div className="col-span-4 bg-slate-50 p-5 rounded-lg border border-slate-200 flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color }}>
              Coordonnées
            </h3>
            <div className="space-y-2 text-xs text-slate-700">
              <div>{personalInfo.phone}</div>
              <div className="break-all">{personalInfo.email}</div>
              <div>{personalInfo.city}, Bénin</div>
            </div>
          </div>

          {skills && skills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color }}>
                Compétences & Outils
              </h3>
              <div className="space-y-2">
                {skills.map((s) => (
                  <div key={s.id} className="text-xs">
                    <span className="font-semibold text-slate-800">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {languages && languages.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>
                Langues
              </h3>
              <div className="space-y-1 text-xs">
                {languages.map((l) => (
                  <div key={l.id} className="flex justify-between">
                    <span className="font-medium">{l.name}</span>
                    <span className="text-slate-500 capitalize">{l.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-400 text-center pt-4 border-t border-slate-200">
          Candidat actif • Bénin
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 7. MODÈLE COMMERCIAL & MANAGEMENT (Bannière haute percutante)
// -------------------------------------------------------------
function ExecutiveTopHeaderLayout({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills, languages } = cv;

  return (
    <div className="min-h-[297mm]">
      <div className="p-8 text-white" style={{ backgroundColor: color }}>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {personalInfo.firstName} {personalInfo.lastName}
        </h1>
        <p className="text-sm font-semibold tracking-wider uppercase mt-1 opacity-90">
          {personalInfo.jobTitle}
        </p>
        <div className="flex flex-wrap gap-4 text-xs mt-3 opacity-80">
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.email}</span>
          <span>{personalInfo.city}, Bénin</span>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {cv.profileSummary && (
          <div className="border-l-4 pl-4 italic text-xs text-slate-700 leading-relaxed" style={{ borderColor: color }}>
            « {cv.profileSummary} »
          </div>
        )}

        {experiences && experiences.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4 pb-1 border-b" style={{ color, borderColor: `${color}40` }}>
              Parcours Professionnel & Performances
            </h2>
            <div className="space-y-5">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-900">{exp.role}</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {exp.startDate} - {exp.current ? 'Actuel' : exp.endDate}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 mb-1">{exp.company} — {exp.city}</div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 pt-4">
          {educations && educations.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b" style={{ color, borderColor: `${color}40` }}>
                Diplômes
              </h2>
              <div className="space-y-3">
                {educations.map((edu) => (
                  <div key={edu.id} className="text-xs">
                    <div className="font-bold text-slate-900">{edu.degree}</div>
                    <div className="text-[11px] text-slate-600">{edu.institution}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skills && skills.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b" style={{ color, borderColor: `${color}40` }}>
                Compétences Majeures
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span key={s.id} className="text-[11px] bg-slate-100 px-2 py-1 rounded font-medium text-slate-800">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 8. MODÈLE COMPTABILITÉ & FINANCE (Rigueur SYSCOHADA)
// -------------------------------------------------------------
function FinanceAccountingLayout({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills, languages } = cv;

  return (
    <div className="p-8 text-slate-900 min-h-[297mm]">
      <div className="border-4 border-slate-900 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
              {personalInfo.firstName} {personalInfo.lastName}
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-800 mt-1">
              {personalInfo.jobTitle}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>{personalInfo.phone}</div>
            <div>{personalInfo.email}</div>
            <div>{personalInfo.city}, Bénin</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {cv.profileSummary && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">
              Déclaration de Profil & Déontologie
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed text-justify">{cv.profileSummary}</p>
          </div>
        )}

        {experiences && experiences.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-3">
              Missions & Expériences Comptables / Financières
            </h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-950">{exp.role}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {exp.startDate} - {exp.current ? 'Actuel' : exp.endDate}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-teal-900 mb-1">{exp.company} — {exp.city}</div>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {educations && educations.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">
                Cursus Académique
              </h2>
              <div className="space-y-2">
                {educations.map((edu) => (
                  <div key={edu.id} className="text-xs">
                    <div className="font-bold">{edu.degree}</div>
                    <div className="text-[11px] text-slate-600">{edu.institution}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skills && skills.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">
                Maîtrise Référentiels & Outils
              </h2>
              <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                {skills.map((s) => (
                  <li key={s.id}>{s.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
