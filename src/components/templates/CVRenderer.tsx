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
  Briefcase,
  GraduationCap,
  Award,
  CheckCircle2,
  FolderGit2,
  Wrench,
  BookOpen,
  Calendar,
  Building2,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { CVInteractiveLink } from '../common/CVInteractiveLink';

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

  // Sélecteur de famille de police
  const fontClass =
    fontFamily === 'Merriweather'
      ? 'font-serif'
      : fontFamily === 'Outfit' || fontFamily === 'Poppins'
      ? 'font-sans tracking-tight'
      : 'font-sans';

  // Dimensions exactes d'une feuille A4 standard (210mm x 297mm = 794px x 1123px à 96 DPI)
  const a4Width = 794;
  const a4Height = 1123;
  const scaledWidth = Math.round(a4Width * scale);
  const scaledHeight = Math.round(a4Height * scale);

  // Fallbacks gracieux si les informations sont partiellement saisies
  const displayFirstName = personalInfo.firstName?.trim() || (personalInfo.lastName ? '' : 'Prénom');
  const displayLastName = personalInfo.lastName?.trim() || (personalInfo.firstName ? '' : 'NOM');
  const displayJobTitle = personalInfo.jobTitle?.trim() || 'Titre du poste visé';

  const safeCV: CVData = {
    ...cv,
    personalInfo: {
      ...personalInfo,
      firstName: displayFirstName,
      lastName: displayLastName,
      jobTitle: displayJobTitle
    }
  };

  return (
    <div
      className="relative flex justify-center print:m-0 print:p-0 select-text transition-all duration-150 mx-auto"
      style={{
        width: `${scaledWidth}px`,
        minHeight: `${scaledHeight}px`,
        maxWidth: '100%'
      }}
    >
      {/* Conteneur A4 standardisé (210mm x 297mm) */}
      <div
        id="cv-document-preview"
        className={`bg-white text-slate-900 shadow-xl print:shadow-none print:w-full print:min-h-0 print:h-auto relative ${fontClass} leading-relaxed rounded-xs`}
        style={{
          width: `${a4Width}px`,
          minHeight: `${a4Height}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          boxSizing: 'border-box'
        }}
      >
        {/* Rendu spécifique et distinct de chacun des 15 modèles */}
        {renderTemplateContent(templateId, safeCV, primaryColor)}

        {/* Filigrane discret si offre gratuite */}
        {showWatermark && (
          <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none select-none z-30">
            <span className="text-[10px] tracking-wider text-slate-400/90 bg-white/95 px-3 py-0.5 rounded-full border border-slate-200 shadow-2xs font-medium">
              Créé avec CV Pro Bénin — Version Découverte (Souscrivez au Pack pour retirer le filigrane)
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
      return <ClassiqueInstitutionnel cv={cv} color={color} />;
    case 'enseignant':
      return <EnseignantAcademique cv={cv} color={color} />;
    case 'professionnel':
      return <ProfessionnelChronologique cv={cv} color={color} />;
    case 'minimaliste':
      return <MinimalisteEpure cv={cv} color={color} />;
    case 'sans_photo':
      return <InternationalATS cv={cv} color={color} />;
    case 'premier_emploi':
      return <PremierEmploiTremplin cv={cv} color={color} />;
    case 'etudiant':
      return <EtudiantStageAcademique cv={cv} color={color} />;
    case 'stage':
      return <StagePerfectionnement cv={cv} color={color} />;
    case 'technicien':
      return <TechnicienOperations cv={cv} color={color} />;
    case 'administratif':
      return <SecretariatAdministration cv={cv} color={color} />;
    case 'informatique':
      return <TechDeveloper cv={cv} color={color} />;
    case 'commercial':
      return <CommercialVente cv={cv} color={color} />;
    case 'management':
      return <ExecutiveManagement cv={cv} color={color} />;
    case 'comptabilite':
      return <ComptabiliteFinance cv={cv} color={color} />;
    case 'moderne':
    default:
      return <ModerneDynamique cv={cv} color={color} />;
  }
}

// =========================================================================
// 1. MODÈLE MODERNE DYNAMIQUE (Bandeau latéral gauche coloré)
// =========================================================================
function ModerneDynamique({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills, languages, customSections } = cv;

  return (
    <div className="grid grid-cols-12 min-h-[297mm]">
      {/* Colonne latérale gauche */}
      <div className="col-span-4 p-6 text-white flex flex-col justify-between" style={{ backgroundColor: color }}>
        <div>
          {/* Photo ou initiales */}
          <div className="flex justify-center mb-5">
            {personalInfo.photoUrl ? (
              <img
                src={personalInfo.photoUrl}
                alt={`${personalInfo.firstName} ${personalInfo.lastName}`}
                className="w-28 h-28 rounded-full object-cover border-4 border-white/30 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-3xl font-bold tracking-wider text-white">
                {personalInfo.firstName?.[0] || 'C'}
                {personalInfo.lastName?.[0] || 'P'}
              </div>
            )}
          </div>

          {/* Coordonnées */}
          <div className="space-y-2.5 text-xs mb-6">
            <h3 className="text-xs uppercase tracking-widest font-extrabold border-b border-white/20 pb-1 mb-2">
              Contact
            </h3>
            {personalInfo.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <CVInteractiveLink type="phone" value={personalInfo.phone} />
              </div>
            )}
            {personalInfo.phone && (
              <div className="flex items-center gap-2 text-[11px] opacity-90">
                <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center font-bold text-[8px] bg-emerald-500 text-white rounded-full">WA</span>
                <CVInteractiveLink type="whatsapp" value={personalInfo.phone}>
                  WhatsApp direct
                </CVInteractiveLink>
              </div>
            )}
            {personalInfo.email && (
              <div className="flex items-center gap-2 break-all">
                <Mail className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <CVInteractiveLink type="email" value={personalInfo.email} />
              </div>
            )}
            {(personalInfo.city || personalInfo.country) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span>{personalInfo.city || 'Cotonou'}{personalInfo.country ? `, ${personalInfo.country}` : ''}</span>
              </div>
            )}
            {personalInfo.address && (
              <div className="text-[11px] opacity-80 pl-5.5">{personalInfo.address}</div>
            )}
            {personalInfo.linkedIn && (
              <div className="flex items-center gap-2 break-all text-[11px]">
                <Linkedin className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <CVInteractiveLink type="linkedin" value={personalInfo.linkedIn} />
              </div>
            )}
            {personalInfo.website && (
              <div className="flex items-center gap-2 break-all text-[11px]">
                <Globe className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <CVInteractiveLink type="url" value={personalInfo.website} />
              </div>
            )}
          </div>

          {/* Compétences */}
          {skills && skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-widest font-extrabold border-b border-white/20 pb-1 mb-2.5">
                Compétences
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span key={s.id} className="text-[11px] bg-white/15 px-2.5 py-1 rounded font-medium">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Langues */}
          {languages && languages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-widest font-extrabold border-b border-white/20 pb-1 mb-2">
                Langues
              </h3>
              <div className="space-y-1.5 text-xs">
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

        <div className="text-[9px] opacity-60 text-center pt-4 border-t border-white/20">
          Candidat actif • Bénin
        </div>
      </div>

      {/* Contenu principal droite */}
      <div className="col-span-8 p-8 flex flex-col justify-between">
        <div>
          {/* Header Nom & Titre */}
          <div className="border-b pb-4 mb-6" style={{ borderColor: `${color}30` }}>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {personalInfo.firstName} <span style={{ color }}>{personalInfo.lastName}</span>
            </h1>
            <p className="text-base font-bold mt-1 text-slate-700 tracking-wide uppercase">
              {personalInfo.jobTitle || 'Professionnel'}
            </p>
          </div>

          {/* Résumé */}
          {cv.profileSummary && (
            <div className="mb-6 break-inside-avoid">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                Profil Professionnel
              </h2>
              <p className="text-xs text-slate-600 text-justify leading-relaxed whitespace-pre-line">
                {cv.profileSummary}
              </p>
            </div>
          )}

          {/* Expériences */}
          {experiences && experiences.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color }}>
                <Briefcase className="w-3.5 h-3.5" style={{ color }} />
                Expériences Professionnelles
              </h2>
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="relative pl-3.5 border-l-2 break-inside-avoid" style={{ borderColor: `${color}50` }}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-xs font-bold text-slate-900">{exp.role}</h3>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {exp.startDate} - {exp.current ? 'Présent' : exp.endDate}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-700 mb-1">
                      {exp.company} {exp.city ? `• ${exp.city}` : ''}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-[11px] text-slate-600 list-disc list-inside">
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
              <h2 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color }}>
                <GraduationCap className="w-3.5 h-3.5" style={{ color }} />
                Formation Académique & Diplômes
              </h2>
              <div className="space-y-3">
                {educations.map((edu) => (
                  <div key={edu.id} className="border-l-2 pl-3.5 break-inside-avoid" style={{ borderColor: `${color}50` }}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-xs font-bold text-slate-900">{edu.degree}</h3>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {edu.startDate} {edu.endDate ? `- ${edu.endDate}` : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-semibold">{edu.institution} {edu.city ? `• ${edu.city}` : ''}</p>
                    {edu.description && <p className="text-[11px] text-slate-500 mt-0.5">{edu.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sections additionnelles */}
          {customSections &&
            customSections
              .filter((sec) => sec.enabled && sec.items.length > 0)
              .map((sec) => (
                <div key={sec.id} className="mb-5 break-inside-avoid">
                  <h2 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color }}>
                    <Award className="w-3.5 h-3.5" style={{ color }} />
                    {sec.title}
                  </h2>
                  <div className="space-y-1.5 text-xs">
                    {sec.items.map((it) => (
                      <div key={it.id} className="text-xs">
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span>{it.title}</span>
                          {it.date && <span className="text-[10px] text-slate-500">{it.date}</span>}
                        </div>
                        {it.subtitle && <div className="text-[11px] text-slate-600 italic">{it.subtitle}</div>}
                        {it.description && <div className="text-[11px] text-slate-500">{it.description}</div>}
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

// =========================================================================
// 2. MODÈLE CLASSIQUE INSTITUTIONNEL (1 colonne centrée sobre)
// =========================================================================
function ClassiqueInstitutionnel({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills, languages, customSections } = cv;

  return (
    <div className="p-10 text-slate-900 min-h-[297mm]">
      {/* En-tête centré institutionnel */}
      <div className="text-center pb-5 border-b-2" style={{ borderColor: color }}>
        <h1 className="text-2xl font-black tracking-wide uppercase text-slate-950">
          {personalInfo.firstName} {personalInfo.lastName}
        </h1>
        <p className="text-sm font-bold tracking-widest uppercase mt-1" style={{ color }}>
          {personalInfo.jobTitle || 'Candidat'}
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2 font-medium">
          {personalInfo.phone && <CVInteractiveLink type="phone" value={personalInfo.phone} />}
          {personalInfo.phone && (
            <span className="inline-flex items-center gap-1">
              • <CVInteractiveLink type="whatsapp" value={personalInfo.phone} className="text-emerald-700">WhatsApp</CVInteractiveLink>
            </span>
          )}
          {personalInfo.email && (
            <span className="inline-flex items-center gap-1">
              • <CVInteractiveLink type="email" value={personalInfo.email} />
            </span>
          )}
          {personalInfo.city && <span>• {personalInfo.city}, Bénin</span>}
          {personalInfo.linkedIn && (
            <span className="inline-flex items-center gap-1">
              • <CVInteractiveLink type="linkedin" value={personalInfo.linkedIn} />
            </span>
          )}
          {personalInfo.website && (
            <span className="inline-flex items-center gap-1">
              • <CVInteractiveLink type="url" value={personalInfo.website} />
            </span>
          )}
        </div>
      </div>

      {cv.profileSummary && (
        <div className="mt-5 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b" style={{ borderColor: `${color}60`, color }}>
            Profil Professionnel
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">{cv.profileSummary}</p>
        </div>
      )}

      {experiences && experiences.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-3 border-b" style={{ borderColor: `${color}60`, color }}>
            Expériences Professionnelles
          </h2>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-950">{exp.role}</span>
                  <span className="text-[11px] text-slate-600 font-medium">
                    {exp.startDate} - {exp.current ? 'Présent' : exp.endDate}
                  </span>
                </div>
                <div className="text-[11px] text-slate-700 font-semibold italic mb-1">
                  {exp.company} — {exp.city || 'Cotonou'}, Bénin
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {educations && educations.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-3 border-b" style={{ borderColor: `${color}60`, color }}>
            Formation Académique & Diplômes
          </h2>
          <div className="space-y-3">
            {educations.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline break-inside-avoid">
                <div>
                  <div className="text-xs font-bold text-slate-950">{edu.degree}</div>
                  <div className="text-[11px] text-slate-700 font-medium">{edu.institution}</div>
                </div>
                <span className="text-[11px] text-slate-600 font-medium shrink-0 ml-4">
                  {edu.startDate} {edu.endDate ? `- ${edu.endDate}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mt-6 break-inside-avoid">
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

      {customSections &&
        customSections.filter((s) => s.enabled && s.items.length > 0).map((sec) => (
          <div key={sec.id} className="mt-6 break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b" style={{ borderColor: `${color}60`, color }}>
              {sec.title}
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {sec.items.map((it) => (
                <div key={it.id}>
                  <div className="font-semibold text-slate-900">{it.title}</div>
                  {it.subtitle && <div className="text-[11px] text-slate-600">{it.subtitle}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

// =========================================================================
// 3. MODÈLE MINIMALISTE ÉPURÉ
// =========================================================================
function MinimalisteEpure({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills, languages } = cv;

  return (
    <div className="p-10 text-slate-800 min-h-[297mm]">
      <div className="border-b pb-6 mb-6">
        <h1 className="text-3xl font-light tracking-tight text-slate-950">
          {personalInfo.firstName} <span className="font-extrabold">{personalInfo.lastName}</span>
        </h1>
        <p className="text-sm font-semibold text-slate-600 mt-1 uppercase tracking-wide">{personalInfo.jobTitle}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-3 font-medium">
          {personalInfo.email && <CVInteractiveLink type="email" value={personalInfo.email} />}
          {personalInfo.phone && (
            <span className="inline-flex items-center gap-1">
              • <CVInteractiveLink type="phone" value={personalInfo.phone} />
            </span>
          )}
          {personalInfo.phone && (
            <span className="inline-flex items-center gap-1">
              • <CVInteractiveLink type="whatsapp" value={personalInfo.phone} className="text-emerald-600 font-semibold">WhatsApp</CVInteractiveLink>
            </span>
          )}
          <span>• {personalInfo.city || 'Cotonou'}, Bénin</span>
          {personalInfo.linkedIn && (
            <span className="inline-flex items-center gap-1">
              • <CVInteractiveLink type="linkedin" value={personalInfo.linkedIn} />
            </span>
          )}
          {personalInfo.website && (
            <span className="inline-flex items-center gap-1">
              • <CVInteractiveLink type="url" value={personalInfo.website} />
            </span>
          )}
        </div>
      </div>

      {cv.profileSummary && (
        <div className="mb-6 break-inside-avoid">
          <p className="text-xs text-slate-600 leading-relaxed text-justify">{cv.profileSummary}</p>
        </div>
      )}

      {experiences && experiences.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">
            Expériences
          </h2>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-900">{exp.role}</span>
                  <span className="text-slate-500 font-medium">
                    {exp.startDate} — {exp.current ? 'Actuel' : exp.endDate}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mb-1">{exp.company}, {exp.city}</div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {educations && educations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">
            Formation
          </h2>
          <div className="space-y-3">
            {educations.map((edu) => (
              <div key={edu.id} className="flex justify-between text-xs break-inside-avoid">
                <div>
                  <div className="font-bold text-slate-900">{edu.degree}</div>
                  <div className="text-[11px] text-slate-600">{edu.institution}</div>
                </div>
                <span className="text-slate-500">{edu.startDate} {edu.endDate ? `— ${edu.endDate}` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 pt-4 border-t break-inside-avoid">
        {skills && skills.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">Compétences</h2>
            <div className="flex flex-wrap gap-1.5 text-xs text-slate-700">
              {skills.map((s) => (
                <span key={s.id} className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {languages && languages.length > 0 && (
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">Langues</h2>
            <div className="space-y-1 text-xs text-slate-700">
              {languages.map((l) => (
                <div key={l.id} className="flex justify-between">
                  <span className="font-medium">{l.name}</span>
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

// =========================================================================
// 4. MODÈLE PREMIER EMPLOI TREMPLIN
// =========================================================================
function PremierEmploiTremplin({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills, languages } = cv;

  return (
    <div className="min-h-[297mm]">
      {/* Bannière supérieure douce */}
      <div className="p-8 text-white flex justify-between items-center" style={{ backgroundColor: color }}>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{personalInfo.firstName} {personalInfo.lastName}</h1>
          <p className="text-sm font-bold uppercase tracking-wider opacity-90 mt-1">{personalInfo.jobTitle}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs opacity-80 mt-2">
            {personalInfo.phone && <CVInteractiveLink type="phone" value={personalInfo.phone} />}
            {personalInfo.phone && (
              <span>• <CVInteractiveLink type="whatsapp" value={personalInfo.phone} className="underline decoration-white/40 font-medium">WhatsApp</CVInteractiveLink></span>
            )}
            {personalInfo.email && (
              <span>• <CVInteractiveLink type="email" value={personalInfo.email} /></span>
            )}
            <span>• {personalInfo.city || 'Cotonou'}, Bénin</span>
            {personalInfo.linkedIn && (
              <span>• <CVInteractiveLink type="linkedin" value={personalInfo.linkedIn} /></span>
            )}
            {personalInfo.website && (
              <span>• <CVInteractiveLink type="url" value={personalInfo.website} /></span>
            )}
          </div>
        </div>
        {personalInfo.photoUrl && (
          <img src={personalInfo.photoUrl} alt="" className="w-20 h-20 rounded-full border-2 border-white object-cover" />
        )}
      </div>

      <div className="p-8 space-y-6">
        {/* Compétences en avant pour jeune diplômé */}
        {skills && skills.length > 0 && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>
              Atouts & Compétences Directement Opérationnelles
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s.id} className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-800">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Formation en tête */}
        {educations && educations.length > 0 && (
          <div className="break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color }}>
              <GraduationCap className="w-4 h-4" />
              Parcours Académique & Diplômes
            </h2>
            <div className="space-y-3">
              {educations.map((edu) => (
                <div key={edu.id} className="border-l-2 pl-3" style={{ borderColor: color }}>
                  <div className="flex justify-between text-xs font-bold text-slate-900">
                    <span>{edu.degree}</span>
                    <span className="text-slate-500 font-normal">{edu.endDate}</span>
                  </div>
                  <div className="text-[11px] text-slate-700 font-medium">{edu.institution}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expériences / Stages */}
        {experiences && experiences.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color }}>
              <Briefcase className="w-4 h-4" />
              Stages & Expériences Pratiques
            </h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 pl-3 break-inside-avoid" style={{ borderColor: `${color}40` }}>
                  <div className="flex justify-between text-xs font-bold text-slate-900">
                    <span>{exp.role}</span>
                    <span className="text-slate-500 font-normal">{exp.startDate} - {exp.current ? 'Présent' : exp.endDate}</span>
                  </div>
                  <div className="text-[11px] text-slate-700 font-semibold mb-1">{exp.company}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// 5. MODÈLE ÉTUDIANT & STAGE ACADÉMIQUE
// =========================================================================
function EtudiantStageAcademique({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills, languages } = cv;

  return (
    <div className="min-h-[297mm] p-8 text-slate-900">
      <div className="border-b-4 pb-4 mb-6" style={{ borderColor: color }}>
        <h1 className="text-2xl font-black uppercase text-slate-950">{personalInfo.firstName} {personalInfo.lastName}</h1>
        <p className="text-xs font-extrabold uppercase tracking-widest mt-0.5" style={{ color }}>{personalInfo.jobTitle}</p>
        <div className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-3">
          {personalInfo.phone && <CVInteractiveLink type="phone" value={personalInfo.phone} />}
          {personalInfo.phone && (
            <span>• <CVInteractiveLink type="whatsapp" value={personalInfo.phone} className="text-emerald-700 font-semibold">WhatsApp</CVInteractiveLink></span>
          )}
          {personalInfo.email && (
            <span>• <CVInteractiveLink type="email" value={personalInfo.email} /></span>
          )}
          <span>• {personalInfo.city || 'Cotonou / Abomey-Calavi (UAC)'}</span>
          {personalInfo.linkedIn && (
            <span>• <CVInteractiveLink type="linkedin" value={personalInfo.linkedIn} /></span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {educations && educations.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color }}>
              <GraduationCap className="w-4 h-4" />
              Cursus Universitaire & Mentions
            </h2>
            <div className="space-y-3">
              {educations.map((edu) => (
                <div key={edu.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl break-inside-avoid">
                  <div className="flex justify-between font-bold text-xs">
                    <span>{edu.degree}</span>
                    <span className="text-slate-500 font-mono">{edu.endDate}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 mt-0.5">{edu.institution}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {experiences && experiences.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color }}>
              <Briefcase className="w-4 h-4" />
              Stages & Projets Académiques
            </h2>
            <div className="space-y-3">
              {experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 pl-3 break-inside-avoid" style={{ borderColor: color }}>
                  <div className="flex justify-between text-xs font-bold">
                    <span>{exp.role}</span>
                    <span className="text-slate-500 font-normal">{exp.startDate} - {exp.current ? 'En cours' : exp.endDate}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium mb-1">{exp.company}</div>
                  <p className="text-xs text-slate-600">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {skills && skills.length > 0 && (
          <div className="break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>Compétences Pratiques</h2>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {skills.map((s) => (
                <span key={s.id} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// 6. MODÈLE TECH & DÉVELOPPEUR WEB
// =========================================================================
function TechDeveloper({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills, languages } = cv;

  return (
    <div className="p-8 text-slate-900 min-h-[297mm]">
      <div className="bg-slate-900 text-white p-6 rounded-2xl mb-6 flex justify-between items-center shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400">
              OPEN_TO_WORK • Bénin
            </span>
          </div>
          <h1 className="text-2xl font-black font-mono tracking-tight text-white">{personalInfo.firstName} {personalInfo.lastName}</h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5">{personalInfo.jobTitle}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
            {personalInfo.email && <CVInteractiveLink type="email" value={personalInfo.email} className="text-slate-300" />}
            {personalInfo.phone && <CVInteractiveLink type="phone" value={personalInfo.phone} className="text-slate-300" />}
            {personalInfo.phone && (
              <CVInteractiveLink type="whatsapp" value={personalInfo.phone} className="text-emerald-400 font-bold">
                [WA_DIRECT]
              </CVInteractiveLink>
            )}
            {personalInfo.linkedIn && (
              <CVInteractiveLink type="linkedin" value={personalInfo.linkedIn} className="text-sky-400" />
            )}
            {personalInfo.website && (
              <CVInteractiveLink type="url" value={personalInfo.website} className="text-emerald-400" />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          {cv.profileSummary && (
            <div className="break-inside-avoid">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-1.5">// BIO_SUMMARY</h2>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">{cv.profileSummary}</p>
            </div>
          )}

          {experiences && experiences.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-3">// WORK_EXPERIENCE</h2>
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-slate-800 pl-3 break-inside-avoid">
                    <div className="flex justify-between items-baseline font-mono text-xs">
                      <span className="font-bold text-slate-900">{exp.role}</span>
                      <span className="text-[10px] text-slate-500">{exp.startDate} ~ {exp.current ? 'NOW' : exp.endDate}</span>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600 mb-1">{exp.company}</div>
                    <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-4 space-y-6">
          {skills && skills.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 break-inside-avoid">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-2">// TECH_STACK</h2>
              <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                {skills.map((s) => (
                  <span key={s.id} className="bg-white border border-slate-300 text-slate-800 px-2 py-0.5 rounded font-semibold">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {educations && educations.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 break-inside-avoid">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-2">// EDUCATION</h2>
              <div className="space-y-2 text-xs">
                {educations.map((edu) => (
                  <div key={edu.id}>
                    <div className="font-bold text-slate-900">{edu.degree}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{edu.institution}</div>
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

// =========================================================================
// 7. MODÈLE COMMERCIAL & VENTE
// =========================================================================
function CommercialVente({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills } = cv;

  return (
    <div className="min-h-[297mm]">
      <div className="p-8 text-white" style={{ backgroundColor: color }}>
        <h1 className="text-3xl font-black tracking-tight uppercase">{personalInfo.firstName} {personalInfo.lastName}</h1>
        <p className="text-xs font-extrabold tracking-widest uppercase mt-1 opacity-90">{personalInfo.jobTitle}</p>
        <div className="flex flex-wrap items-center gap-4 text-xs mt-3 opacity-90">
          {personalInfo.phone && <CVInteractiveLink type="phone" value={personalInfo.phone} />}
          {personalInfo.phone && (
            <span>• <CVInteractiveLink type="whatsapp" value={personalInfo.phone} className="underline font-semibold">WhatsApp</CVInteractiveLink></span>
          )}
          {personalInfo.email && (
            <span>• <CVInteractiveLink type="email" value={personalInfo.email} /></span>
          )}
          <span>• {personalInfo.city || 'Cotonou'}, Bénin</span>
          {personalInfo.linkedIn && (
            <span>• <CVInteractiveLink type="linkedin" value={personalInfo.linkedIn} /></span>
          )}
        </div>
      </div>

      <div className="p-8 space-y-6">
        {cv.profileSummary && (
          <div className="border-l-4 pl-4 italic text-xs text-slate-700 leading-relaxed break-inside-avoid" style={{ borderColor: color }}>
            « {cv.profileSummary} »
          </div>
        )}

        {experiences && experiences.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-4 pb-1 border-b" style={{ color, borderColor: `${color}40` }}>
              Performances Commerciales & Postes Occupés
            </h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-900">{exp.role}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{exp.startDate} - {exp.current ? 'Actuel' : exp.endDate}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 mb-1">{exp.company} — {exp.city}</div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 pt-4 border-t break-inside-avoid">
          {educations && educations.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>Diplômes</h2>
              <div className="space-y-2 text-xs">
                {educations.map((edu) => (
                  <div key={edu.id}>
                    <div className="font-bold">{edu.degree}</div>
                    <div className="text-[11px] text-slate-500">{edu.institution}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skills && skills.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>Compétences Majeures</h2>
              <div className="flex flex-wrap gap-1">
                {skills.map((s) => (
                  <span key={s.id} className="text-[11px] bg-slate-100 px-2 py-0.5 rounded font-medium">
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

// =========================================================================
// 8. MODÈLE COMPTABILITÉ & FINANCE (SYSCOHADA)
// =========================================================================
function ComptabiliteFinance({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills } = cv;

  return (
    <div className="p-8 text-slate-900 min-h-[297mm]">
      <div className="border-4 border-slate-900 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
              {personalInfo.firstName} {personalInfo.lastName}
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-800 mt-1">{personalInfo.jobTitle}</p>
          </div>
          <div className="text-right text-xs text-slate-600 space-y-0.5">
            {personalInfo.phone && <div><CVInteractiveLink type="phone" value={personalInfo.phone} /></div>}
            {personalInfo.phone && <div><CVInteractiveLink type="whatsapp" value={personalInfo.phone} className="text-emerald-700 font-medium">WhatsApp direct</CVInteractiveLink></div>}
            {personalInfo.email && <div><CVInteractiveLink type="email" value={personalInfo.email} /></div>}
            <div>{personalInfo.city || 'Cotonou'}, Bénin</div>
            {personalInfo.linkedIn && <div><CVInteractiveLink type="linkedin" value={personalInfo.linkedIn} /></div>}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {cv.profileSummary && (
          <div className="break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">
              Déclaration de Déontologie & Profil
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed text-justify">{cv.profileSummary}</p>
          </div>
        )}

        {experiences && experiences.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-3">
              Missions & Expériences Comptables (Référentiel SYSCOHADA)
            </h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-950">{exp.role}</span>
                    <span className="text-[11px] font-mono text-slate-500">{exp.startDate} - {exp.current ? 'Actuel' : exp.endDate}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-teal-900 mb-1">{exp.company} — {exp.city}</div>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 break-inside-avoid">
          {educations && educations.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">Cursus Académique</h2>
              <div className="space-y-2 text-xs">
                {educations.map((edu) => (
                  <div key={edu.id}>
                    <div className="font-bold">{edu.degree}</div>
                    <div className="text-[11px] text-slate-600">{edu.institution}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skills && skills.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">Outils & Fiscalité</h2>
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

// =========================================================================
// 9. MODÈLE ENSEIGNANT & PÉDAGOGUE
// =========================================================================
function EnseignantAcademique({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills } = cv;

  return (
    <div className="p-10 text-slate-900 min-h-[297mm]">
      <div className="border-b-2 pb-4 mb-6 text-center" style={{ borderColor: color }}>
        <h1 className="text-2xl font-serif font-black tracking-wide uppercase text-slate-950">{personalInfo.firstName} {personalInfo.lastName}</h1>
        <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color }}>{personalInfo.jobTitle}</p>
        <div className="text-xs text-slate-600 mt-2 flex flex-wrap justify-center items-center gap-4">
          {personalInfo.phone && <CVInteractiveLink type="phone" value={personalInfo.phone} />}
          {personalInfo.phone && (
            <span>• <CVInteractiveLink type="whatsapp" value={personalInfo.phone} className="text-emerald-700">WhatsApp</CVInteractiveLink></span>
          )}
          {personalInfo.email && (
            <span>• <CVInteractiveLink type="email" value={personalInfo.email} /></span>
          )}
          <span>• {personalInfo.city || 'Cotonou'}, Bénin</span>
          {personalInfo.linkedIn && (
            <span>• <CVInteractiveLink type="linkedin" value={personalInfo.linkedIn} /></span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {cv.profileSummary && (
          <div className="break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2 font-serif" style={{ color }}>Philosophie Pédagogique</h2>
            <p className="text-xs text-slate-700 leading-relaxed text-justify">{cv.profileSummary}</p>
          </div>
        )}

        {educations && educations.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3 font-serif" style={{ color }}>Titres & Diplômes Universitaires</h2>
            <div className="space-y-3">
              {educations.map((edu) => (
                <div key={edu.id} className="border-l-2 pl-3 break-inside-avoid" style={{ borderColor: color }}>
                  <div className="flex justify-between text-xs font-bold">
                    <span>{edu.degree}</span>
                    <span className="text-slate-500 font-normal">{edu.endDate}</span>
                  </div>
                  <div className="text-[11px] text-slate-700 font-medium">{edu.institution}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {experiences && experiences.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3 font-serif" style={{ color }}>Enseignements & Postes Pédagogiques</h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="break-inside-avoid">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{exp.role}</span>
                    <span className="text-slate-500 font-normal">{exp.startDate} - {exp.current ? 'Présent' : exp.endDate}</span>
                  </div>
                  <div className="text-[11px] text-slate-700 italic mb-1">{exp.company}</div>
                  <p className="text-xs text-slate-600">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// 10. MODÈLE EXECUTIVE & MANAGEMENT
// =========================================================================
function ExecutiveManagement({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills } = cv;

  return (
    <div className="min-h-[297mm]">
      <div className="bg-slate-900 text-white p-8">
        <h1 className="text-3xl font-black uppercase tracking-tight">{personalInfo.firstName} {personalInfo.lastName}</h1>
        <p className="text-xs font-bold uppercase tracking-widest mt-1 text-slate-300">{personalInfo.jobTitle}</p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-3">
          {personalInfo.phone && <CVInteractiveLink type="phone" value={personalInfo.phone} className="text-slate-300" />}
          {personalInfo.phone && (
            <span>• <CVInteractiveLink type="whatsapp" value={personalInfo.phone} className="text-emerald-400 font-medium">WhatsApp</CVInteractiveLink></span>
          )}
          {personalInfo.email && (
            <span>• <CVInteractiveLink type="email" value={personalInfo.email} className="text-slate-300" /></span>
          )}
          <span>• {personalInfo.city || 'Cotonou'}, Bénin</span>
          {personalInfo.linkedIn && (
            <span>• <CVInteractiveLink type="linkedin" value={personalInfo.linkedIn} className="text-slate-300" /></span>
          )}
        </div>
      </div>

      <div className="p-8 space-y-6">
        {cv.profileSummary && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed break-inside-avoid">
            {cv.profileSummary}
          </div>
        )}

        {experiences && experiences.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-3">Leadership & Expériences Dirigeantes</h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="break-inside-avoid">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{exp.role}</span>
                    <span className="text-slate-500">{exp.startDate} - {exp.current ? 'Présent' : exp.endDate}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 mb-1">{exp.company} — {exp.city}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 break-inside-avoid">
          {educations && educations.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">Diplômes & Exécutif</h2>
              <div className="space-y-2 text-xs">
                {educations.map((edu) => (
                  <div key={edu.id}>
                    <div className="font-bold">{edu.degree}</div>
                    <div className="text-[11px] text-slate-500">{edu.institution}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {skills && skills.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">Compétences Stratégiques</h2>
              <div className="flex flex-wrap gap-1">
                {skills.map((s) => (
                  <span key={s.id} className="text-[11px] bg-slate-100 px-2 py-0.5 rounded font-medium">
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

// =========================================================================
// 11. MODÈLE INTERNATIONAL ATS (Sans photo)
// =========================================================================
function InternationalATS({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills } = cv;

  return (
    <div className="p-10 text-slate-900 min-h-[297mm]">
      <div className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">{personalInfo.firstName} {personalInfo.lastName}</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-700 mt-0.5">{personalInfo.jobTitle}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2">
          {personalInfo.email && <CVInteractiveLink type="email" value={personalInfo.email} />}
          {personalInfo.phone && (
            <span>• <CVInteractiveLink type="phone" value={personalInfo.phone} /></span>
          )}
          {personalInfo.phone && (
            <span>• <CVInteractiveLink type="whatsapp" value={personalInfo.phone} className="text-emerald-700 font-semibold">WhatsApp</CVInteractiveLink></span>
          )}
          <span>• {personalInfo.city || 'Cotonou'}, Bénin</span>
          {personalInfo.linkedIn && (
            <span>• <CVInteractiveLink type="linkedin" value={personalInfo.linkedIn} /></span>
          )}
          {personalInfo.website && (
            <span>• <CVInteractiveLink type="url" value={personalInfo.website} /></span>
          )}
        </div>
      </div>

      {cv.profileSummary && (
        <div className="mb-6 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">PROFESSIONAL SUMMARY</h2>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">{cv.profileSummary}</p>
        </div>
      )}

      {experiences && experiences.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">WORK EXPERIENCE</h2>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between text-xs font-bold">
                  <span>{exp.role}</span>
                  <span className="text-slate-500 font-normal">{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-700 mb-1">{exp.company} — {exp.city}</div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {educations && educations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">EDUCATION</h2>
          <div className="space-y-2">
            {educations.map((edu) => (
              <div key={edu.id} className="flex justify-between text-xs break-inside-avoid">
                <div>
                  <div className="font-bold">{edu.degree}</div>
                  <div className="text-[11px] text-slate-600">{edu.institution}</div>
                </div>
                <span className="text-slate-500">{edu.endDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {skills && skills.length > 0 && (
        <div className="break-inside-avoid border-t pt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">SKILLS</h2>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {skills.map((s) => (
              <span key={s.id} className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 12. MODÈLE STAGE PERFECTIONNEMENT
// =========================================================================
function StagePerfectionnement({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills } = cv;

  return (
    <div className="p-8 text-slate-900 min-h-[297mm]">
      <div className="p-6 rounded-2xl text-white mb-6" style={{ backgroundColor: color }}>
        <h1 className="text-2xl font-black">{personalInfo.firstName} {personalInfo.lastName}</h1>
        <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-90">{personalInfo.jobTitle || 'Candidat au stage'}</p>
        <div className="text-xs opacity-80 mt-2 flex flex-wrap items-center gap-3">
          {personalInfo.phone && <CVInteractiveLink type="phone" value={personalInfo.phone} />}
          {personalInfo.phone && (
            <span>• <CVInteractiveLink type="whatsapp" value={personalInfo.phone} className="underline font-medium">WhatsApp</CVInteractiveLink></span>
          )}
          {personalInfo.email && (
            <span>• <CVInteractiveLink type="email" value={personalInfo.email} /></span>
          )}
          <span>• Disponible immédiatement au Bénin</span>
          {personalInfo.linkedIn && (
            <span>• <CVInteractiveLink type="linkedin" value={personalInfo.linkedIn} /></span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {educations && educations.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color }}>Formation Académique Actuelle</h2>
            <div className="space-y-3">
              {educations.map((edu) => (
                <div key={edu.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 break-inside-avoid">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{edu.degree}</span>
                    <span className="text-slate-500">{edu.endDate}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{edu.institution}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {experiences && experiences.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color }}>Premières Expériences & Stages</h2>
            <div className="space-y-3">
              {experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 pl-3 break-inside-avoid" style={{ borderColor: color }}>
                  <div className="flex justify-between text-xs font-bold">
                    <span>{exp.role}</span>
                    <span className="text-slate-500 font-normal">{exp.startDate} - {exp.current ? 'Présent' : exp.endDate}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mb-1">{exp.company}</div>
                  <p className="text-xs text-slate-600">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {skills && skills.length > 0 && (
          <div className="break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>Compétences Pratiques</h2>
            <div className="flex flex-wrap gap-1 text-xs">
              {skills.map((s) => (
                <span key={s.id} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// 13. MODÈLE TECHNICIEN & OPÉRATIONS (Colonne droite outillage)
// =========================================================================
function TechnicienOperations({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills } = cv;

  return (
    <div className="p-8 grid grid-cols-12 gap-6 min-h-[297mm]">
      <div className="col-span-8 space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-black text-slate-900">{personalInfo.firstName} {personalInfo.lastName}</h1>
          <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color }}>{personalInfo.jobTitle}</p>
        </div>

        {experiences && experiences.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color }}>Expériences & Chantiers</h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 pl-3 break-inside-avoid" style={{ borderColor: color }}>
                  <div className="flex justify-between text-xs font-bold">
                    <span>{exp.role}</span>
                    <span className="text-slate-500">{exp.startDate} - {exp.current ? 'En cours' : exp.endDate}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700">{exp.company} • {exp.city}</div>
                  <p className="text-xs text-slate-600 mt-1">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase mb-2" style={{ color }}>Contact</h3>
            <div className="text-xs text-slate-700 space-y-1">
              {personalInfo.phone && <div><CVInteractiveLink type="phone" value={personalInfo.phone} /></div>}
              {personalInfo.phone && <div><CVInteractiveLink type="whatsapp" value={personalInfo.phone} className="text-emerald-700 font-medium">WhatsApp direct</CVInteractiveLink></div>}
              {personalInfo.email && <div className="break-all"><CVInteractiveLink type="email" value={personalInfo.email} /></div>}
              <div>{personalInfo.city || 'Cotonou'}, Bénin</div>
            </div>
          </div>

          {skills && skills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase mb-2" style={{ color }}>Outils & Habilitations</h3>
              <div className="space-y-1 text-xs font-medium text-slate-800">
                {skills.map((s) => (
                  <div key={s.id}>• {s.name}</div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="text-[10px] text-slate-400 text-center">Rigueur & Disponibilité</div>
      </div>
    </div>
  );
}

// =========================================================================
// 14. MODÈLE SECRÉTARIAT & ADMINISTRATION
// =========================================================================
function SecretariatAdministration({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills } = cv;

  return (
    <div className="p-8 grid grid-cols-12 gap-6 min-h-[297mm]">
      <div className="col-span-8 space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-black text-slate-900">{personalInfo.firstName} {personalInfo.lastName}</h1>
          <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color }}>{personalInfo.jobTitle}</p>
        </div>

        {experiences && experiences.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color }}>Parcours Administratif & Secrétariat</h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 pl-3 break-inside-avoid" style={{ borderColor: color }}>
                  <div className="flex justify-between text-xs font-bold">
                    <span>{exp.role}</span>
                    <span className="text-slate-500">{exp.startDate} - {exp.current ? 'Présent' : exp.endDate}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700">{exp.company}</div>
                  <p className="text-xs text-slate-600 mt-1">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase mb-2" style={{ color }}>Coordonnées</h3>
          <div className="text-xs text-slate-700 space-y-1">
            {personalInfo.phone && <div><CVInteractiveLink type="phone" value={personalInfo.phone} /></div>}
            {personalInfo.phone && <div><CVInteractiveLink type="whatsapp" value={personalInfo.phone} className="text-emerald-700 font-medium">WhatsApp direct</CVInteractiveLink></div>}
            {personalInfo.email && <div className="break-all"><CVInteractiveLink type="email" value={personalInfo.email} /></div>}
            <div>{personalInfo.city || 'Cotonou'}, Bénin</div>
            {personalInfo.linkedIn && <div><CVInteractiveLink type="linkedin" value={personalInfo.linkedIn} /></div>}
          </div>
        </div>

        {skills && skills.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase mb-2" style={{ color }}>Outils Bureautiques</h3>
            <div className="space-y-1 text-xs text-slate-800">
              {skills.map((s) => (
                <div key={s.id} className="bg-white p-1.5 rounded border border-slate-200">
                  {s.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// 15. MODÈLE EXPERT CHRONOLOGIQUE
// =========================================================================
function ProfessionnelChronologique({ cv, color }: { cv: CVData; color: string }) {
  const { personalInfo, experiences, educations, skills } = cv;

  return (
    <div className="p-10 text-slate-900 min-h-[297mm]">
      <div className="border-b-4 pb-4 mb-6" style={{ borderColor: color }}>
        <h1 className="text-3xl font-black uppercase text-slate-950">{personalInfo.firstName} {personalInfo.lastName}</h1>
        <p className="text-sm font-bold uppercase tracking-wider mt-1 text-slate-700">{personalInfo.jobTitle}</p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
          {personalInfo.phone && <CVInteractiveLink type="phone" value={personalInfo.phone} />}
          {personalInfo.phone && (
            <span>• <CVInteractiveLink type="whatsapp" value={personalInfo.phone} className="text-emerald-700 font-medium">WhatsApp</CVInteractiveLink></span>
          )}
          {personalInfo.email && (
            <span>• <CVInteractiveLink type="email" value={personalInfo.email} /></span>
          )}
          <span>• {personalInfo.city || 'Cotonou'}, Bénin</span>
          {personalInfo.linkedIn && (
            <span>• <CVInteractiveLink type="linkedin" value={personalInfo.linkedIn} /></span>
          )}
          {personalInfo.website && (
            <span>• <CVInteractiveLink type="url" value={personalInfo.website} /></span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {cv.profileSummary && (
          <div className="break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2" style={{ color }}>
              Résumé de Carrière
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed text-justify">{cv.profileSummary}</p>
          </div>
        )}

        {experiences && experiences.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-3" style={{ color }}>
              Historique Chronologique Inverse
            </h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="break-inside-avoid">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{exp.role}</span>
                    <span className="text-slate-500">{exp.startDate} - {exp.current ? 'Actuel' : exp.endDate}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 mb-1">{exp.company} — {exp.city}</div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {educations && educations.length > 0 && (
          <div className="break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b pb-1 mb-2" style={{ color }}>
              Formations & Titres
            </h2>
            <div className="space-y-2 text-xs">
              {educations.map((edu) => (
                <div key={edu.id} className="flex justify-between">
                  <span className="font-bold">{edu.degree} — {edu.institution}</span>
                  <span className="text-slate-500">{edu.endDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
