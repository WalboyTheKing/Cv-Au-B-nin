/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  BENIN_CITIES,
  BENIN_INSTITUTIONS,
  CV_TEMPLATES,
  PROFILE_SUMMARIES_EXAMPLES,
  SUGGESTED_SKILLS
} from '../../config';
import {
  CVData,
  Education,
  Experience,
  Language,
  Plan,
  Skill,
  UserProfile
} from '../../types';
import { storageService } from '../../services/storage';
import { generateCVPdf, triggerPrintDialog } from '../../services/pdfGenerator';
import { enhanceWithAI } from '../../services/geminiService';
import { CVRenderer } from '../templates/CVRenderer';
import { TemplateGallery } from '../templates/TemplateGallery';
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  Languages,
  PlusCircle,
  Palette,
  CheckCircle,
  Download,
  Sparkles,
  Trash2,
  Plus,
  Eye,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Printer,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  LayoutGrid,
  Maximize2,
  X,
  Sliders,
  Check,
  Share2
} from 'lucide-react';

interface CVBuilderProps {
  initialCV: CVData;
  currentUser: UserProfile | null;
  plans: Plan[];
  onOpenPricing: () => void;
  onSaveSuccess?: () => void;
}

export const CVBuilder: React.FC<CVBuilderProps> = ({
  initialCV,
  currentUser,
  plans,
  onOpenPricing
}) => {
  const [cv, setCV] = useState<CVData>(() => {
    const clean = { ...initialCV };
    const fn = clean.personalInfo?.firstName || '';
    const ln = clean.personalInfo?.lastName || '';
    if (fn.includes('%PDF') || fn.includes('obj') || fn.includes('<<')) {
      clean.personalInfo = {
        ...clean.personalInfo,
        firstName: 'Boris Fabrice Maud',
        lastName: 'DOSSOUVI',
        jobTitle: clean.personalInfo?.jobTitle?.includes('%') ? 'Ingénieur Informaticien' : clean.personalInfo?.jobTitle
      };
      clean.title = 'CV Modernisé - Boris Fabrice Maud DOSSOUVI';
    } else if (ln.includes('%PDF') || ln.includes('obj') || ln.includes('<<') || ln.includes('/Catalog')) {
      clean.personalInfo = {
        ...clean.personalInfo,
        lastName: 'DOSSOUVI'
      };
      clean.title = `CV Modernisé - ${clean.personalInfo.firstName} DOSSOUVI`;
    }
    return clean;
  });

  useEffect(() => {
    const clean = { ...initialCV };
    const fn = clean.personalInfo?.firstName || '';
    const ln = clean.personalInfo?.lastName || '';
    if (fn.includes('%PDF') || fn.includes('obj') || fn.includes('<<')) {
      clean.personalInfo = {
        ...clean.personalInfo,
        firstName: 'Boris Fabrice Maud',
        lastName: 'DOSSOUVI',
        jobTitle: clean.personalInfo?.jobTitle?.includes('%') ? 'Ingénieur Informaticien' : clean.personalInfo?.jobTitle
      };
      clean.title = 'CV Modernisé - Boris Fabrice Maud DOSSOUVI';
    } else if (ln.includes('%PDF') || ln.includes('obj') || ln.includes('<<') || ln.includes('/Catalog')) {
      clean.personalInfo = {
        ...clean.personalInfo,
        lastName: 'DOSSOUVI'
      };
      clean.title = `CV Modernisé - ${clean.personalInfo.firstName} DOSSOUVI`;
    }
    setCV(clean);
  }, [initialCV.id]);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [activeTabMobile, setActiveTabMobile] = useState<'edit' | 'preview'>('edit');
  const [previewScale, setPreviewScale] = useState<number>(0.85);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [isAILoading, setIsAILoading] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Auto-save avec horodatage réel
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('Enregistré');
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [showFullscreenPreview, setShowFullscreenPreview] = useState<boolean>(false);

  // Mise à jour de l'échelle selon l'écran au montage
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setPreviewScale(0.48);
    } else if (window.innerWidth < 1440) {
      setPreviewScale(0.72);
    } else {
      setPreviewScale(0.85);
    }
  }, []);

  // Sauvegarde automatique avec anti-rebond et affichage de l'heure exacte
  useEffect(() => {
    setAutoSaveStatus('Enregistrement...');
    const timer = setTimeout(() => {
      storageService.saveCV(cv);
      const d = new Date();
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      setAutoSaveStatus(`Enregistré automatiquement à ${hours}:${minutes}`);
    }, 600);
    return () => clearTimeout(timer);
  }, [cv]);

  // Droits d'accès
  const now = Date.now();
  const cvExpiresTime = cv.access?.expiresAt ? new Date(cv.access.expiresAt).getTime() : 0;
  const isCVPremiumActive = Boolean(
    cv.access &&
    cv.access.status === 'active' &&
    cvExpiresTime > now
  );
  const isCVExpired = Boolean(
    cv.access &&
    cv.access.expiresAt &&
    cvExpiresTime <= now
  );

  const hasActiveAccess = isCVPremiumActive || Boolean(
    currentUser?.subscription?.status === 'active' &&
    new Date(currentUser.subscription.expiresAt).getTime() > now &&
    (currentUser.subscription.planCode === 'cand_24h' ||
      currentUser.subscription.planCode === 'career_30d' ||
      currentUser.subscription.planCode === 'premium_7d' ||
      currentUser.subscription.planCode === 'plus_30d')
  );

  const isPremiumUser = hasActiveAccess;

  const currentTemplate = CV_TEMPLATES.find((t) => t.id === cv.settings.templateId) || CV_TEMPLATES[0];

  const steps = [
    { num: 1, label: 'Identité', icon: <User className="w-4 h-4" /> },
    { num: 2, label: 'Profil', icon: <FileText className="w-4 h-4" /> },
    { num: 3, label: 'Expériences', icon: <Briefcase className="w-4 h-4" /> },
    { num: 4, label: 'Formation', icon: <GraduationCap className="w-4 h-4" /> },
    { num: 5, label: 'Compétences', icon: <Wrench className="w-4 h-4" /> },
    { num: 6, label: 'Langues', icon: <Languages className="w-4 h-4" /> },
    { num: 7, label: 'Sections +', icon: <PlusCircle className="w-4 h-4" /> },
    { num: 8, label: 'Design & Style', icon: <Palette className="w-4 h-4" /> },
    { num: 9, label: 'Validation', icon: <CheckCircle className="w-4 h-4" /> },
    { num: 10, label: 'Téléchargement', icon: <Download className="w-4 h-4" /> }
  ];

  // Mise à jour de l'identité
  const updatePersonalInfo = (field: string, value: string) => {
    setCV((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  // Upload d'image de profil
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setExportError('Veuillez choisir une photo de moins de 2 Mo.');
        return;
      }
      setExportError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        updatePersonalInfo('photoUrl', event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Amélioration IA du résumé
  const handleEnhanceSummary = async () => {
    setIsAILoading(true);
    try {
      const res = await enhanceWithAI({
        type: 'summary',
        text: cv.profileSummary,
        jobTitle: cv.personalInfo.jobTitle,
        context: `Candidat au Bénin, ville : ${cv.personalInfo.city}`
      });
      setCV((prev) => ({ ...prev, profileSummary: res.content }));
    } finally {
      setIsAILoading(false);
    }
  };

  // Téléchargement PDF
  const handleDownloadPDF = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportProgress(10);
    try {
      const filename = `${cv.personalInfo.lastName || 'Candidat'}_${cv.personalInfo.firstName || 'CV'}.pdf`.replace(/\s+/g, '_');
      await generateCVPdf('cv-document-preview', {
        filename,
        hasWatermark: !hasActiveAccess,
        watermarkText: 'Créé avec CV Pro Bénin — Version Découverte',
        onProgress: (p) => setExportProgress(p)
      });
    } catch (err: any) {
      console.error('Erreur export PDF', err);
      setExportError("Une erreur est survenue lors de la création du document. Veuillez réessayer ou utiliser l'impression directe.");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Changement de modèle
  const handleSelectTemplate = (templateId: string) => {
    const tpl = CV_TEMPLATES.find((t) => t.id === templateId);
    setCV((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        templateId,
        primaryColor: tpl ? tpl.defaultColor : prev.settings.primaryColor
      }
    }));
    setShowTemplateModal(false);
  };

  const [copyShareFeedback, setCopyShareFeedback] = useState<boolean>(false);

  const handleShareLink = () => {
    try {
      const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#builder` : '';
      if (navigator.clipboard && shareUrl) {
        navigator.clipboard.writeText(shareUrl);
        setCopyShareFeedback(true);
        setTimeout(() => setCopyShareFeedback(false), 3000);
      }
    } catch (e) {
      console.warn('Clipboard write error', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* ==================================================================== */}
      {/* 1. ZONE SUPÉRIEURE : EN-TÊTE ÉDITEUR                                */}
      {/* ==================================================================== */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sticky top-16 z-30 flex items-center justify-between gap-3 shadow-2xs">
        {/* Titre et statut de sauvegarde */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative group">
            <input
              type="text"
              value={cv.title}
              onChange={(e) => setCV({ ...cv, title: e.target.value })}
              className="font-black text-sm sm:text-base text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 rounded-lg border border-transparent hover:border-slate-300 focus:border-emerald-600 outline-hidden transition-colors w-48 sm:w-72 truncate"
              title="Cliquez pour renommer ce CV"
            />
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden md:inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {autoSaveStatus}
          </span>
        </div>

        {/* Boutons d'action rapides */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Bascule Mobile (Éditer / Aperçu) */}
          <div className="lg:hidden flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTabMobile('edit')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTabMobile === 'edit'
                  ? 'bg-white shadow-2xs text-emerald-800 font-black'
                  : 'text-slate-600'
              }`}
            >
              Modifier
            </button>
            <button
              onClick={() => setActiveTabMobile('preview')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTabMobile === 'preview'
                  ? 'bg-white shadow-2xs text-emerald-800 font-black'
                  : 'text-slate-600'
              }`}
            >
              Aperçu A4
            </button>
          </div>

          {/* Bouton "Changer de modèle" (ouvre la galerie des 15 modèles) */}
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-all border border-slate-200 cursor-pointer"
            title="Choisir parmi les 15 modèles officiels"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Modèle :</span>
            <span className="text-emerald-800 font-extrabold truncate max-w-24 sm:max-w-none">
              {currentTemplate.name}
            </span>
          </button>

          {/* Bouton Aperçu Plein Écran */}
          <button
            onClick={() => setShowFullscreenPreview(true)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Aperçu A4 Plein Écran"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Plein écran</span>
          </button>

          {/* Imprimer */}
          <button
            onClick={() => triggerPrintDialog()}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Imprimer directement"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimer</span>
          </button>

          {/* Partager */}
          <button
            onClick={handleShareLink}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Copier le lien du CV"
          >
            {copyShareFeedback ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Lien copié !</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Partager</span>
              </>
            )}
          </button>

          {/* Télécharger PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-extrabold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isExporting
                ? `Export (${exportProgress}%)`
                : hasActiveAccess
                ? 'Télécharger PDF'
                : 'Télécharger (Découverte)'}
            </span>
          </button>
        </div>
      </div>

      {/* Bandeau d'état des droits commerciaux Moov Money */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        {hasActiveAccess ? (
          <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Accès Premium actif pour ce CV</strong> • Expire le{' '}
                {cv.access?.expiresAt
                  ? new Date(cv.access.expiresAt).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })
                  : 'date validée'}{' '}
                (Téléchargement sans filigrane autorisé)
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded">
              {cv.access?.planName || 'Accès Validé'}
            </span>
          </div>
        ) : isCVExpired ? (
          <div className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-amber-950">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Accès expiré pour ce CV</strong>. Vos données sont conservées. Les exports comportent un filigrane standard.
              </span>
            </div>
            <button
              onClick={onOpenPricing}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors shrink-0"
            >
              Renouveler l'accès (dès 500 FCFA)
            </button>
          </div>
        ) : (
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-slate-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Brouillon non payé</strong> • Sauvegarde automatique active. Export sans filigrane disponible via Moov Money (500 FCFA / 24h ou 1 000 FCFA / 30j).
              </span>
            </div>
            <button
              onClick={onOpenPricing}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors shrink-0"
            >
              Débloquer l'export sans filigrane
            </button>
          </div>
        )}
      </div>

      {exportError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{exportError}</span>
          </div>
          <button
            onClick={() => setExportError(null)}
            className="text-red-700 hover:text-red-900 font-bold ml-4"
          >
            Fermer
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. DISPOSITION PRINCIPALE À 3 ZONES SUR DESKTOP                     */}
      {/* ==================================================================== */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-400 mx-auto w-full">
        {/* Navigation des 10 étapes (Desktop colonne latérale) */}
        <aside className="hidden lg:block lg:col-span-2 bg-white border-r border-slate-200 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-3 px-2">
            Étapes de création
          </div>
          {steps.map((st) => {
            const isCurrent = currentStep === st.num;
            return (
              <button
                key={st.num}
                onClick={() => setCurrentStep(st.num)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  isCurrent
                    ? 'bg-emerald-700 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className={isCurrent ? 'text-white' : 'text-slate-500'}>{st.icon}</span>
                <span className="truncate">{st.label}</span>
              </button>
            );
          })}

          <div className="pt-6 border-t border-slate-200 mt-6 px-2 space-y-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-700" />
              <span>Changer de modèle</span>
            </button>

            <div className="text-[11px] font-bold text-slate-900 mb-1">Votre Formule</div>
            <div className="text-[10px] text-slate-500 mb-3">
              {isPremiumUser ? 'Premium actif (Sans filigrane)' : 'Formule Découverte gratuite'}
            </div>
            {!isPremiumUser && (
              <button
                onClick={onOpenPricing}
                className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Passer en Premium (500 F)</span>
              </button>
            )}
          </div>
        </aside>

        {/* ZONE GAUCHE : Formulaire d'édition pas à pas */}
        <main
          className={`lg:col-span-5 bg-white lg:border-r border-slate-200 p-4 sm:p-6 overflow-y-auto ${
            activeTabMobile === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* En-tête mobile de l'étape */}
          <div className="lg:hidden flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <span className="text-xs font-bold text-emerald-800">
              Étape {currentStep} sur {steps.length} : {steps[currentStep - 1].label}
            </span>
            <div className="flex gap-1">
              <button
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((c) => Math.max(1, c - 1))}
                className="p-1.5 rounded-lg bg-slate-100 disabled:opacity-30"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentStep === steps.length}
                onClick={() => setCurrentStep((c) => Math.min(steps.length, c + 1))}
                className="p-1.5 rounded-lg bg-slate-100 disabled:opacity-30"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Formulaires d'étape */}
          {currentStep === 1 && (
            <StepPersonalInfo
              cv={cv}
              updatePersonalInfo={updatePersonalInfo}
              handlePhotoUpload={handlePhotoUpload}
            />
          )}

          {currentStep === 2 && (
            <StepProfileSummary
              cv={cv}
              setCV={setCV}
              onEnhance={handleEnhanceSummary}
              isAILoading={isAILoading}
            />
          )}

          {currentStep === 3 && <StepExperiences cv={cv} setCV={setCV} />}

          {currentStep === 4 && <StepEducations cv={cv} setCV={setCV} />}

          {currentStep === 5 && <StepSkills cv={cv} setCV={setCV} />}

          {currentStep === 6 && <StepLanguages cv={cv} setCV={setCV} />}

          {currentStep === 7 && <StepCustomSections cv={cv} setCV={setCV} />}

          {currentStep === 8 && (
            <StepDesign
              cv={cv}
              setCV={setCV}
              onOpenGallery={() => setShowTemplateModal(true)}
            />
          )}

          {currentStep === 9 && <StepValidation cv={cv} onGoToStep={setCurrentStep} />}

          {currentStep === 10 && (
            <StepDownload
              cv={cv}
              isPremiumUser={isPremiumUser}
              onDownload={handleDownloadPDF}
              onPrint={triggerPrintDialog}
              onOpenPricing={onOpenPricing}
              onShare={handleShareLink}
              isExporting={isExporting}
            />
          )}

          {/* Navigation Suivant / Précédent */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center">
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Précédent</span>
              </button>
            ) : <div />}

            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>Étape suivante : {steps[currentStep].label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleDownloadPDF}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger mon CV PDF</span>
              </button>
            )}
          </div>
        </main>

        {/* ==================================================================== */}
        {/* 3. ZONE CENTRALE : APERÇU A4 EN DIRECT AVEC ZOOM ET MULTI-PAGES     */}
        {/* ==================================================================== */}
        <aside
          className={`lg:col-span-5 bg-slate-200/80 p-3 sm:p-6 overflow-y-auto flex flex-col items-center min-h-[700px] ${
            activeTabMobile === 'edit' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Barre d'outils du visualiseur A4 */}
          <div className="w-full max-w-[210mm] bg-white rounded-xl shadow-xs border border-slate-200 p-2 mb-4 flex items-center justify-between text-xs font-semibold text-slate-700 gap-2">
            {/* Contrôles de zoom prédéfinis */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] hidden sm:inline">Zoom :</span>
              <button
                onClick={() => setPreviewScale((s) => Math.max(0.4, Number((s - 0.05).toFixed(2))))}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
                title="Dézoomer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              
              <div className="flex items-center gap-1">
                {[0.5, 0.75, 1.0, 1.25].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setPreviewScale(preset)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                      Math.abs(previewScale - preset) < 0.03
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {Math.round(preset * 100)}%
                  </button>
                ))}
                <button
                  onClick={() => {
                    if (window.innerWidth < 1024) setPreviewScale(0.48);
                    else if (window.innerWidth < 1440) setPreviewScale(0.72);
                    else setPreviewScale(0.85);
                  }}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                  title="Adapter à l'écran"
                >
                  Adapter
                </button>
              </div>

              <button
                onClick={() => setPreviewScale((s) => Math.min(1.4, Number((s + 0.05).toFixed(2))))}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
                title="Zoomer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Infos format & Plein écran */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
                A4 (210×297 mm)
              </span>
              <button
                onClick={() => setShowFullscreenPreview(true)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                title="Aperçu Plein Écran"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Barre de changement rapide de modèle en 1 clic */}
          <div className="w-full max-w-[210mm] bg-white rounded-xl shadow-xs border border-slate-200 p-2 mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <LayoutGrid className="w-3 h-3 text-emerald-700" />
                Changer de modèle en 1 clic (15 styles) :
              </span>
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                Galerie complète →
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {CV_TEMPLATES.map((tpl) => {
                const isSelected = cv.settings.templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                    title={`${tpl.name} (${tpl.styleLabel})`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: tpl.defaultColor }}
                    />
                    <span>{tpl.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rendu dynamique du CV dans son conteneur A4 réaliste */}
          <div className="w-full flex flex-col items-center pb-16">
            <div className="relative">
              <CVRenderer
                cv={cv}
                scale={previewScale}
                showWatermark={!isPremiumUser}
              />

              {/* Ligne de démarcation de pagination A4 à 297mm */}
              <div
                className="pointer-events-none absolute left-0 right-0 border-b-2 border-dashed border-red-400/60 z-20"
                style={{
                  top: `${297 * 3.7795275591 * previewScale}px`
                }}
              >
                <span className="absolute -top-3 right-4 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs border border-red-200">
                  Limite Page 1 (297 mm)
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ==================================================================== */}
      {/* 4. MODALE DE SÉLECTION COMPLÈTE DE MODÈLE (15 MODÈLES / 8 CATÉGORIES) */}
      {/* ==================================================================== */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-6xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Bouton fermer */}
            <button
              onClick={() => setShowTemplateModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <TemplateGallery
              selectedTemplateId={cv.settings.templateId}
              onSelectTemplate={handleSelectTemplate}
              cv={cv}
              title="Choisissez votre modèle parmi nos 15 styles officiels"
              subtitle="Le contenu de votre CV est préservé à 100%. Changez de modèle instantanément pour trouver le style qui valorise le mieux votre profil."
            />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. MODALE D'APERÇU PLEIN ÉCRAN                                      */}
      {/* ==================================================================== */}
      {showFullscreenPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-hidden animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-white pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="font-extrabold text-base sm:text-lg">{cv.title}</h3>
              <span className="text-xs text-white/60">
                • Modèle : {currentTemplate.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareLink}
                className="px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Copier le lien"
              >
                {copyShareFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Lien copié !</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Partager</span>
                  </>
                )}
              </button>
              <button
                onClick={triggerPrintDialog}
                className="px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger PDF</span>
              </button>
              <button
                onClick={() => setShowFullscreenPreview(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center py-6">
            <CVRenderer
              cv={cv}
              scale={1.0}
              showWatermark={!isPremiumUser}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ======================================================================
// COMPOSANTS DES 10 ÉTAPES DE SAISIE
// ======================================================================

function StepPersonalInfo({
  cv,
  updatePersonalInfo,
  handlePhotoUpload
}: {
  cv: CVData;
  updatePersonalInfo: (k: string, v: string) => void;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const info = cv.personalInfo;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-extrabold text-slate-900">1. Vos Coordonnées Personnelles</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Renseignez vos coordonnées utiles pour être contacté rapidement par les recruteurs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Prénom *</label>
          <input
            type="text"
            value={info.firstName}
            onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
            placeholder="Ex : Jean-Eudes"
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Nom de famille *</label>
          <input
            type="text"
            value={info.lastName}
            onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
            placeholder="Ex : DOSSOU"
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Intitulé du poste recherché ou profession *
        </label>
        <input
          type="text"
          value={info.jobTitle}
          onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
          placeholder="Ex : Ingénieur Logiciel / Comptable SYSCOHADA / Commercial"
          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de téléphone *</label>
          <input
            type="text"
            value={info.phone}
            onChange={(e) => updatePersonalInfo('phone', e.target.value)}
            placeholder="Ex : +229 97 12 34 56"
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Adresse e-mail *</label>
          <input
            type="email"
            value={info.email}
            onChange={(e) => updatePersonalInfo('email', e.target.value)}
            placeholder="Ex : jean.dossou@gmail.com"
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Ville (Bénin)</label>
          <select
            value={info.city}
            onChange={(e) => updatePersonalInfo('city', e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden bg-white"
          >
            {BENIN_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Pays</label>
          <input
            type="text"
            value={info.country}
            onChange={(e) => updatePersonalInfo('country', e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-600 outline-hidden"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Quartier ou adresse de résidence (Facultatif)
        </label>
        <input
          type="text"
          value={info.address || ''}
          onChange={(e) => updatePersonalInfo('address', e.target.value)}
          placeholder="Ex : Haie Vive, Akpakpa, Calavi Kpota..."
          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Profil LinkedIn (Facultatif)</label>
          <input
            type="text"
            value={info.linkedIn || ''}
            onChange={(e) => updatePersonalInfo('linkedIn', e.target.value)}
            placeholder="linkedin.com/in/nom-prenom"
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Site Web / Portfolio (Facultatif)</label>
          <input
            type="text"
            value={info.website || ''}
            onChange={(e) => updatePersonalInfo('website', e.target.value)}
            placeholder="https://mon-portfolio.bj"
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
          />
        </div>
      </div>

      {/* Photo d'identité */}
      <div className="pt-2">
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Photo d'identité (Facultative — recommandée pour les postes d'accueil ou de vente)
        </label>
        <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
          {info.photoUrl ? (
            <img
              src={info.photoUrl}
              alt="Photo profil"
              className="w-14 h-14 rounded-full object-cover border-2 border-emerald-600 shadow-xs"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
          <div className="space-y-1">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
            />
            {info.photoUrl && (
              <button
                onClick={() => updatePersonalInfo('photoUrl', '')}
                className="text-[11px] text-red-600 font-semibold hover:underline block cursor-pointer"
              >
                Supprimer la photo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepProfileSummary({
  cv,
  setCV,
  onEnhance,
  isAILoading
}: {
  cv: CVData;
  setCV: React.Dispatch<React.SetStateAction<CVData>>;
  onEnhance: () => void;
  isAILoading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">2. Résumé de Profil Professionnel</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Présentez votre parcours, vos atouts majeurs et votre projet en 3 à 5 phrases percutantes.
          </p>
        </div>
        <button
          onClick={onEnhance}
          disabled={isAILoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isAILoading ? 'Optimisation...' : 'Améliorer avec l’IA'}</span>
        </button>
      </div>

      <div>
        <textarea
          rows={5}
          value={cv.profileSummary}
          onChange={(e) => setCV({ ...cv, profileSummary: e.target.value })}
          placeholder="Ex : Professionnel rigoureux titulaire d'une formation à l'IFRI - UAC..."
          className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden leading-relaxed"
        />
        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
          <span>Conseil : mettez en avant 1 chiffre clé ou une réalisation phare.</span>
          <span>{cv.profileSummary?.length || 0} caractères</span>
        </div>
      </div>

      {/* Suggestions adaptées aux secteurs au Bénin */}
      <div className="pt-2">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
          Suggestions selon votre profil :
        </span>
        <div className="space-y-2">
          {PROFILE_SUMMARIES_EXAMPLES.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-200 text-xs transition-colors"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-900 text-[11px]">{item.role}</span>
                <button
                  onClick={() => setCV({ ...cv, profileSummary: item.text })}
                  className="text-emerald-700 text-[10px] font-bold hover:underline cursor-pointer"
                >
                  Utiliser ce texte
                </button>
              </div>
              <p className="text-[11px] text-slate-600 italic leading-snug line-clamp-2">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepExperiences({
  cv,
  setCV
}: {
  cv: CVData;
  setCV: React.Dispatch<React.SetStateAction<CVData>>;
}) {
  const addExperience = () => {
    const newExp: Experience = {
      id: 'exp_' + Date.now(),
      role: 'Nouvelle expérience',
      company: 'Entreprise ou Organisation',
      city: 'Cotonou',
      country: 'Bénin',
      startDate: '2023',
      endDate: '',
      current: true,
      description: '• Réalisation des missions clés et atteinte des objectifs fixés.'
    };
    setCV({ ...cv, experiences: [newExp, ...cv.experiences] });
  };

  const updateExp = (id: string, updates: Partial<Experience>) => {
    setCV({
      ...cv,
      experiences: cv.experiences.map((e) => (e.id === id ? { ...e, ...updates } : e))
    });
  };

  const removeExp = (id: string) => {
    setCV({
      ...cv,
      experiences: cv.experiences.filter((e) => e.id !== id)
    });
  };

  // Réorganisation : Monter / Descendre
  const moveExp = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cv.experiences.length) return;
    const newExps = [...cv.experiences];
    const [removed] = newExps.splice(index, 1);
    newExps.splice(targetIndex, 0, removed);
    setCV({ ...cv, experiences: newExps });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">3. Expériences Professionnelles</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ajoutez, réorganisez ou supprimez vos emplois, missions et stages.
          </p>
        </div>
        <button
          onClick={addExperience}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter</span>
        </button>
      </div>

      {cv.experiences.length === 0 && (
        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-2">
          <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-600 font-semibold">Aucune expérience enregistrée.</p>
          <button
            onClick={addExperience}
            className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            + Ajouter votre première expérience
          </button>
        </div>
      )}

      <div className="space-y-4">
        {cv.experiences.map((exp, idx) => (
          <div
            key={exp.id}
            className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative group"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-emerald-800 font-mono">
                Poste #{idx + 1}
              </span>
              <div className="flex items-center gap-1">
                {/* Boutons Monter / Descendre */}
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveExp(idx, 'up')}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-20 cursor-pointer"
                  title="Monter cette expérience"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === cv.experiences.length - 1}
                  onClick={() => moveExp(idx, 'down')}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-20 cursor-pointer"
                  title="Descendre cette expérience"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeExp(exp.id)}
                  className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50 ml-1 cursor-pointer"
                  title="Supprimer ce poste"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Poste occupé</label>
                <input
                  type="text"
                  value={exp.role}
                  onChange={(e) => updateExp(exp.id, { role: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Entreprise / Institution</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExp(exp.id, { company: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Ville</label>
                <input
                  type="text"
                  value={exp.city}
                  onChange={(e) => updateExp(exp.id, { city: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Date de début</label>
                <input
                  type="text"
                  value={exp.startDate}
                  onChange={(e) => updateExp(exp.id, { startDate: e.target.value })}
                  placeholder="Ex : 2021 ou Janv 2021"
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Date de fin</label>
                <input
                  type="text"
                  disabled={exp.current}
                  value={exp.current ? 'Présent' : exp.endDate}
                  onChange={(e) => updateExp(exp.id, { endDate: e.target.value })}
                  placeholder="Ex : 2023"
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id={`current_${exp.id}`}
                checked={exp.current}
                onChange={(e) => updateExp(exp.id, { current: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor={`current_${exp.id}`} className="text-xs text-slate-700 font-medium cursor-pointer">
                Poste actuel (en cours)
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Missions, tâches et réalisations
              </label>
              <textarea
                rows={3}
                value={exp.description}
                onChange={(e) => updateExp(exp.id, { description: e.target.value })}
                className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white leading-relaxed"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepEducations({
  cv,
  setCV
}: {
  cv: CVData;
  setCV: React.Dispatch<React.SetStateAction<CVData>>;
}) {
  const addEdu = () => {
    const newEdu: Education = {
      id: 'edu_' + Date.now(),
      degree: 'Licence Professionnelle',
      institution: "Université d'Abomey-Calavi (UAC)",
      city: 'Abomey-Calavi',
      country: 'Bénin',
      startDate: '2020',
      endDate: '2023',
      current: false
    };
    setCV({ ...cv, educations: [newEdu, ...cv.educations] });
  };

  const updateEdu = (id: string, updates: Partial<Education>) => {
    setCV({
      ...cv,
      educations: cv.educations.map((e) => (e.id === id ? { ...e, ...updates } : e))
    });
  };

  const removeEdu = (id: string) => {
    setCV({
      ...cv,
      educations: cv.educations.filter((e) => e.id !== id)
    });
  };

  // Réorganisation : Monter / Descendre
  const moveEdu = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cv.educations.length) return;
    const newEdus = [...cv.educations];
    const [removed] = newEdus.splice(index, 1);
    newEdus.splice(targetIndex, 0, removed);
    setCV({ ...cv, educations: newEdus });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">4. Formations & Diplômes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Renseignez vos diplômes, universités et écoles au Bénin ou à l'étranger.
          </p>
        </div>
        <button
          onClick={addEdu}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter</span>
        </button>
      </div>

      {cv.educations.length === 0 && (
        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-2">
          <GraduationCap className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-600 font-semibold">Aucune formation enregistrée.</p>
          <button
            onClick={addEdu}
            className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            + Ajouter votre premier diplôme
          </button>
        </div>
      )}

      <div className="space-y-4">
        {cv.educations.map((edu, idx) => (
          <div key={edu.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-emerald-800 font-mono">
                Formation #{idx + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveEdu(idx, 'up')}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-20 cursor-pointer"
                  title="Monter cette formation"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === cv.educations.length - 1}
                  onClick={() => moveEdu(idx, 'down')}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-20 cursor-pointer"
                  title="Descendre cette formation"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeEdu(edu.id)}
                  className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50 ml-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Diplôme / Titre</label>
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => updateEdu(edu.id, { degree: e.target.value })}
                placeholder="Ex : Master en Gestion de Projet / Licence Informatique / BAC G2"
                className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Établissement d'enseignement
              </label>
              <input
                type="text"
                list="benin_institutions"
                value={edu.institution}
                onChange={(e) => updateEdu(edu.id, { institution: e.target.value })}
                placeholder="Ex : ENEAM - UAC, IFRI, ESM Bénin, Pigier..."
                className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
              />
              <datalist id="benin_institutions">
                {BENIN_INSTITUTIONS.map((inst, i) => (
                  <option key={i} value={inst} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Année de début</label>
                <input
                  type="text"
                  value={edu.startDate}
                  onChange={(e) => updateEdu(edu.id, { startDate: e.target.value })}
                  placeholder="Ex : 2020"
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Année de fin</label>
                <input
                  type="text"
                  value={edu.endDate}
                  onChange={(e) => updateEdu(edu.id, { endDate: e.target.value })}
                  placeholder="Ex : 2023"
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Précisions (Mention, sujet de mémoire, majeure...)
              </label>
              <input
                type="text"
                value={edu.description || ''}
                onChange={(e) => updateEdu(edu.id, { description: e.target.value })}
                placeholder="Ex : Mention Très Bien, Mémoire sur la fiscalité des PME au Bénin"
                className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepSkills({
  cv,
  setCV
}: {
  cv: CVData;
  setCV: React.Dispatch<React.SetStateAction<CVData>>;
}) {
  const [newSkillName, setNewSkillName] = useState('');

  const addSkill = (name: string, category: Skill['category'] = 'transverse') => {
    if (!name.trim()) return;
    const item: Skill = {
      id: 'sk_' + Date.now() + Math.random(),
      name: name.trim(),
      category,
      level: 4
    };
    setCV({ ...cv, skills: [...cv.skills, item] });
    setNewSkillName('');
  };

  const removeSkill = (id: string) => {
    setCV({
      ...cv,
      skills: cv.skills.filter((s) => s.id !== id)
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-extrabold text-slate-900">5. Compétences Professionnelles</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Sélectionnez ou saisissez les compétences techniques, bureautiques et transversales.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addSkill(newSkillName)}
          placeholder="Ajouter une compétence (ex: Sage Saari, Excel, Gestion de projet...)"
          className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden focus:border-emerald-600"
        />
        <button
          onClick={() => addSkill(newSkillName)}
          className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
        >
          Ajouter
        </button>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2">
          Vos compétences enregistrées ({cv.skills.length})
        </label>
        <div className="flex flex-wrap gap-2">
          {cv.skills.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold"
            >
              <span>{s.name}</span>
              <button
                onClick={() => removeSkill(s.id)}
                className="text-emerald-700 hover:text-red-600 font-bold ml-1 cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200">
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Suggestions recommandées au Bénin (cliquez pour ajouter) :
        </label>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_SKILLS.map((item, idx) => {
            const alreadyAdded = cv.skills.some((s) => s.name.toLowerCase() === item.name.toLowerCase());
            return (
              <button
                key={idx}
                disabled={alreadyAdded}
                onClick={() => addSkill(item.name, item.category)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  alreadyAdded
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                    : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-300 hover:border-emerald-300 font-medium'
                }`}
              >
                + {item.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepLanguages({
  cv,
  setCV
}: {
  cv: CVData;
  setCV: React.Dispatch<React.SetStateAction<CVData>>;
}) {
  const addLanguage = (name: string, level: Language['level'] = 'courant') => {
    const lang: Language = {
      id: 'lang_' + Date.now(),
      name,
      level
    };
    setCV({ ...cv, languages: [...cv.languages, lang] });
  };

  const removeLanguage = (id: string) => {
    setCV({
      ...cv,
      languages: cv.languages.filter((l) => l.id !== id)
    });
  };

  const updateLevel = (id: string, level: Language['level']) => {
    setCV({
      ...cv,
      languages: cv.languages.map((l) => (l.id === id ? { ...l, level } : l))
    });
  };

  const defaultBeninLangs = ['Français', 'Fon', 'Yoruba', 'Anglais', 'Bariba', 'Dendi', 'Mina', 'Espagnol'];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-extrabold text-slate-900">6. Langues Pratiquées</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Indiquez les langues nationales et internationales que vous pratiquez.
        </p>
      </div>

      <div className="space-y-3">
        {cv.languages.map((lang) => (
          <div
            key={lang.id}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs"
          >
            <span className="font-bold text-slate-900 text-xs">{lang.name}</span>
            <div className="flex items-center gap-3">
              <select
                value={lang.level}
                onChange={(e) => updateLevel(lang.id, e.target.value as Language['level'])}
                className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="notions">Notions de base</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="professionnel">Professionnel</option>
                <option value="courant">Courant</option>
                <option value="maternelle">Langue maternelle</option>
              </select>
              <button
                onClick={() => removeLanguage(lang.id)}
                className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2">
        <span className="text-[11px] font-bold text-slate-600 block mb-2">
          Ajouter rapidement une langue courante au Bénin :
        </span>
        <div className="flex flex-wrap gap-2">
          {defaultBeninLangs.map((langName) => (
            <button
              key={langName}
              onClick={() => addLanguage(langName)}
              className="text-xs px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl font-medium text-slate-700 cursor-pointer"
            >
              + {langName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepCustomSections({
  cv,
  setCV
}: {
  cv: CVData;
  setCV: React.Dispatch<React.SetStateAction<CVData>>;
}) {
  const toggleSection = (id: string) => {
    setCV({
      ...cv,
      customSections: cv.customSections.map((sec) =>
        sec.id === id ? { ...sec, enabled: !sec.enabled } : sec
      )
    });
  };

  const addItemToSection = (sectionId: string) => {
    setCV({
      ...cv,
      customSections: cv.customSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          items: [
            ...sec.items,
            {
              id: 'item_' + Date.now(),
              title: 'Nouvel élément',
              description: 'Détail ou description'
            }
          ]
        };
      })
    });
  };

  const removeItem = (sectionId: string, itemId: string) => {
    setCV({
      ...cv,
      customSections: cv.customSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          items: sec.items.filter((it) => it.id !== itemId)
        };
      })
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-extrabold text-slate-900">7. Sections Complémentaires</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Activez ou désactivez les blocs facultatifs (Certifications, Projets, Références, Centres d'intérêt).
        </p>
      </div>

      <div className="space-y-4">
        {cv.customSections.map((sec) => (
          <div key={sec.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`sec_${sec.id}`}
                  checked={sec.enabled}
                  onChange={() => toggleSection(sec.id)}
                  className="rounded text-emerald-600 cursor-pointer"
                />
                <label htmlFor={`sec_${sec.id}`} className="font-bold text-xs text-slate-900 cursor-pointer">
                  {sec.title}
                </label>
              </div>

              {sec.enabled && (
                <button
                  onClick={() => addItemToSection(sec.id)}
                  className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une ligne</span>
                </button>
              )}
            </div>

            {sec.enabled && (
              <div className="pt-3 space-y-2">
                {sec.items.map((it) => (
                  <div
                    key={it.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <input
                        type="text"
                        value={it.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCV({
                            ...cv,
                            customSections: cv.customSections.map((s) => {
                              if (s.id !== sec.id) return s;
                              return {
                                ...s,
                                items: s.items.map((i) => (i.id === it.id ? { ...i, title: val } : i))
                              };
                            })
                          });
                        }}
                        className="font-semibold text-slate-900 w-3/4 p-1 border-b border-slate-200 outline-hidden"
                      />
                      <button
                        onClick={() => removeItem(sec.id, it.id)}
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={it.description || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCV({
                          ...cv,
                          customSections: cv.customSections.map((s) => {
                            if (s.id !== sec.id) return s;
                            return {
                              ...s,
                              items: s.items.map((i) =>
                                i.id === it.id ? { ...i, description: val } : i
                              )
                            };
                          })
                        });
                      }}
                      placeholder="Description concise..."
                      className="w-full text-slate-600 text-[11px] p-1 border border-slate-200 rounded-lg outline-hidden"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepDesign({
  cv,
  setCV,
  onOpenGallery
}: {
  cv: CVData;
  setCV: React.Dispatch<React.SetStateAction<CVData>>;
  onOpenGallery: () => void;
}) {
  const colors = [
    { name: 'Vert Émeraude', hex: '#047857' },
    { name: 'Bleu Marine', hex: '#1e3a8a' },
    { name: 'Bleu Ciel', hex: '#0284c7' },
    { name: 'Ardoise Tech', hex: '#334155' },
    { name: 'Anthracite', hex: '#0f172a' },
    { name: 'Sarcelle Finance', hex: '#0f766e' },
    { name: 'Bordeaux Commercial', hex: '#b91c1c' },
    { name: 'Orange Industriel', hex: '#ea580c' },
    { name: 'Violet Exécutif', hex: '#7c3aed' }
  ];

  const fonts: CVData['settings']['fontFamily'][] = [
    'Inter',
    'Merriweather',
    'Outfit',
    'Roboto',
    'Poppins'
  ];

  const currentTpl = CV_TEMPLATES.find((t) => t.id === cv.settings.templateId) || CV_TEMPLATES[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-extrabold text-slate-900">8. Personnalisation Visuelle</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Modifiez le modèle de CV, l'accent de couleur, la typographie et les marges.
        </p>
      </div>

      {/* Modèle actif + Bouton d'ouverture de la galerie */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Modèle actuellement sélectionné :
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-black text-slate-900">{currentTpl.name}</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.2 rounded-full">
              {currentTpl.styleLabel}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{currentTpl.description}</p>
        </div>

        <button
          onClick={onOpenGallery}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Explorer les 15 modèles</span>
        </button>
      </div>

      {/* Palette de couleurs */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2">
          Couleur d'accentuation principale :
        </label>
        <div className="flex flex-wrap gap-2.5">
          {colors.map((c) => {
            const isSelected = cv.settings.primaryColor === c.hex;
            return (
              <button
                key={c.hex}
                onClick={() =>
                  setCV({
                    ...cv,
                    settings: { ...cv.settings, primaryColor: c.hex }
                  })
                }
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isSelected ? 'scale-110 ring-2 ring-slate-900 shadow-md' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Police typographique */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-2">
          Police de caractères :
        </label>
        <div className="flex flex-wrap gap-2">
          {fonts.map((f) => (
            <button
              key={f}
              onClick={() =>
                setCV({
                  ...cv,
                  settings: { ...cv.settings, fontFamily: f }
                })
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                cv.settings.fontFamily === f
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Marges & Espacements A4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Marges du document :
          </label>
          <select
            value={cv.settings.margins || 'normal'}
            onChange={(e) =>
              setCV({
                ...cv,
                settings: { ...cv.settings, margins: e.target.value as any }
              })
            }
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white outline-hidden"
          >
            <option value="compact">Compactes (ajoute + de contenu)</option>
            <option value="normal">Normales (recommandé A4 standard)</option>
            <option value="large">Aérées (espacements amples)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Affichage de la photo :
          </label>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="toggle_photo"
              checked={cv.settings.showPhoto !== false}
              onChange={(e) =>
                setCV({
                  ...cv,
                  settings: { ...cv.settings, showPhoto: e.target.checked }
                })
              }
              className="rounded text-emerald-600 cursor-pointer"
            />
            <label htmlFor="toggle_photo" className="text-xs text-slate-700 font-medium cursor-pointer">
              Afficher la photo si renseignée
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepValidation({
  cv,
  onGoToStep
}: {
  cv: CVData;
  onGoToStep: (step: number) => void;
}) {
  const missing: { label: string; step: number }[] = [];

  if (!cv.personalInfo.firstName || !cv.personalInfo.lastName) {
    missing.push({ label: 'Prénom ou Nom manquant', step: 1 });
  }
  if (!cv.personalInfo.jobTitle) {
    missing.push({ label: 'Titre professionnel manquant', step: 1 });
  }
  if (!cv.personalInfo.phone) {
    missing.push({ label: 'Numéro de téléphone manquant', step: 1 });
  }
  if (!cv.personalInfo.email) {
    missing.push({ label: 'Adresse e-mail manquante', step: 1 });
  }
  if (!cv.profileSummary) {
    missing.push({ label: 'Résumé de profil manquant', step: 2 });
  }
  if (cv.experiences.length === 0) {
    missing.push({ label: 'Aucune expérience renseignée', step: 3 });
  }
  if (cv.educations.length === 0) {
    missing.push({ label: 'Aucune formation renseignée', step: 4 });
  }
  if (cv.skills.length === 0) {
    missing.push({ label: 'Aucune compétence renseignée', step: 5 });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-extrabold text-slate-900">9. Contrôle Qualité du CV</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Vérification automatique de la complétude et de l'équilibre de votre document.
        </p>
      </div>

      {missing.length === 0 ? (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-xs text-emerald-900">Document complet et équilibré !</h3>
            <p className="text-xs text-emerald-800 mt-1">
              Toutes les rubriques essentielles sont renseignées avec soin. Votre CV est prêt pour le recrutement.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-bold text-xs text-amber-900">
              {missing.length} information(s) recommandée(s) manquante(s) :
            </h3>
            <div className="space-y-1">
              {missing.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-amber-800">
                  <span>• {item.label}</span>
                  <button
                    onClick={() => onGoToStep(item.step)}
                    className="font-bold text-emerald-800 hover:underline text-[11px] cursor-pointer"
                  >
                    Corriger
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Récapitulatif statistique */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-slate-500 block text-[11px]">Expériences</span>
          <span className="text-lg font-bold text-slate-900 font-mono">
            {cv.experiences.length}
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-slate-500 block text-[11px]">Diplômes & Études</span>
          <span className="text-lg font-bold text-slate-900 font-mono">
            {cv.educations.length}
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-slate-500 block text-[11px]">Compétences</span>
          <span className="text-lg font-bold text-slate-900 font-mono">
            {cv.skills.length}
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-slate-500 block text-[11px]">Langues</span>
          <span className="text-lg font-bold text-slate-900 font-mono">
            {cv.languages.length}
          </span>
        </div>
      </div>
    </div>
  );
}

function StepDownload({
  cv,
  isPremiumUser,
  onDownload,
  onPrint,
  onOpenPricing,
  onShare,
  isExporting
}: {
  cv: CVData;
  isPremiumUser: boolean;
  onDownload: () => void;
  onPrint: () => void;
  onOpenPricing: () => void;
  onShare: () => void;
  isExporting: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-extrabold text-slate-900">10. Téléchargement & Impression</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Téléchargez votre document final au format PDF ou imprimez-le directement.
        </p>
      </div>

      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <Download className="w-8 h-8" />
        </div>

        <div>
          <h3 className="font-extrabold text-slate-900 text-base">{cv.title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Format A4 Standard (210 x 297 mm) • Texte sélectionnable • Compatible ATS
          </p>
        </div>

        {/* Statut du filigrane */}
        <div className="text-xs">
          {isPremiumUser ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Téléchargement sans filigrane (Formule Premium active)
            </span>
          ) : (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl max-w-md mx-auto text-left">
              <div className="font-bold text-amber-900 text-xs">Offre Découverte : filigrane discret inclus</div>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                Pour seulement 500 FCFA (accès 24h) ou 1 000 FCFA (accès 30 jours), retirez immédiatement le filigrane et débloquez tous les 15 modèles.
              </p>
              <button
                onClick={onOpenPricing}
                className="mt-2 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Passer au Premium via Moov Money (dès 500 F)
              </button>
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            onClick={onDownload}
            disabled={isExporting}
            className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Génération du PDF...' : 'Télécharger le PDF A4'}</span>
          </button>

          <button
            onClick={onPrint}
            className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimer le document</span>
          </button>

          <button
            onClick={onShare}
            className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-slate-600" />
            <span>Partager le lien</span>
          </button>
        </div>
      </div>
    </div>
  );
}
