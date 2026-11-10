/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { parseCVFile, parseCVText, ParseResult } from '../../services/documentParser';
import { CVData, Experience, Education, Skill, Language, CustomSection } from '../../types';
import { BENIN_CITIES, BENIN_INSTITUTIONS } from '../../config';
import { TemplateGallery } from '../templates/TemplateGallery';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  User,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Globe,
  Linkedin,
  FileCheck2,
  Palette
} from 'lucide-react';

interface CVImportModalProps {
  onCVImported: (cv: CVData) => void;
  onCancel: () => void;
}

export const CVImportModal: React.FC<CVImportModalProps> = ({ onCVImported, onCancel }) => {
  // Navigation du wizard : 1 = Import, 2 = Vérification, 3 = Choix du modèle
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Méthode d'import : fichier vs collage
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // États de chargement et progression
  const [loading, setLoading] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Données extraites
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [verifiedCV, setVerifiedCV] = useState<CVData | null>(null);

  // Onglet actif dans la page de vérification (étape 2)
  const [verificationTab, setVerificationTab] = useState<
    'identity' | 'summary' | 'experiences' | 'educations' | 'skills' | 'languages' | 'others'
  >('identity');

  // Input file ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gestion du glisser-déposer
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const validateAndSetFile = (f: File) => {
    setErrorMsg('');
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const nameLower = f.name.toLowerCase();
    const isValid = validExtensions.some((ext) => nameLower.endsWith(ext));

    if (!isValid) {
      setErrorMsg('Format de fichier non accepté. Veuillez fournir un fichier PDF, DOCX, DOC ou TXT.');
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg('Le fichier est trop lourd. La taille maximale autorisée est de 10 Mo.');
      return;
    }

    setFile(f);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setErrorMsg('');
    setProgressPercent(0);
    setProgressLabel('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Traitement du fichier
  const handleProcessFile = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMsg('');
    setProgressPercent(10);
    setProgressLabel('Initialisation de la lecture...');

    try {
      const res = await parseCVFile(file, (p, label) => {
        setProgressPercent(p);
        setProgressLabel(label);
      });
      setParseResult(res);
      setVerifiedCV(res.cvData);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de l'analyse du document.");
    } finally {
      setLoading(false);
    }
  };

  // Traitement du texte brut
  const handleProcessText = () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setProgressPercent(50);
    setProgressLabel('Analyse des rubriques...');

    try {
      const res = parseCVText(rawText);
      setParseResult(res);
      setVerifiedCV(res.cvData);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de l'analyse du texte.");
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour des informations personnelles
  const updatePersonalInfo = (field: string, val: string) => {
    if (!verifiedCV) return;
    setVerifiedCV({
      ...verifiedCV,
      personalInfo: {
        ...verifiedCV.personalInfo,
        [field]: val
      }
    });
  };

  // Gestion des expériences
  const updateExperience = (id: string, field: string, val: any) => {
    if (!verifiedCV) return;
    setVerifiedCV({
      ...verifiedCV,
      experiences: verifiedCV.experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: val } : exp
      )
    });
  };

  const addExperience = () => {
    if (!verifiedCV) return;
    const newExp: Experience = {
      id: `exp_new_${Date.now()}`,
      role: 'Intitulé du poste',
      company: 'Nom de l’entreprise',
      city: verifiedCV.personalInfo.city || 'Cotonou',
      country: 'Bénin',
      startDate: '2023',
      endDate: '',
      current: true,
      description: 'Description synthétique de vos responsabilités majeures.',
      achievements: []
    };
    setVerifiedCV({
      ...verifiedCV,
      experiences: [newExp, ...verifiedCV.experiences]
    });
  };

  const removeExperience = (id: string) => {
    if (!verifiedCV) return;
    setVerifiedCV({
      ...verifiedCV,
      experiences: verifiedCV.experiences.filter((exp) => exp.id !== id)
    });
  };

  const moveExperience = (index: number, direction: 'up' | 'down') => {
    if (!verifiedCV) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= verifiedCV.experiences.length) return;
    const list = [...verifiedCV.experiences];
    const item = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = item;
    setVerifiedCV({ ...verifiedCV, experiences: list });
  };

  // Gestion des formations
  const updateEducation = (id: string, field: string, val: any) => {
    if (!verifiedCV) return;
    setVerifiedCV({
      ...verifiedCV,
      educations: verifiedCV.educations.map((edu) =>
        edu.id === id ? { ...edu, [field]: val } : edu
      )
    });
  };

  const addEducation = () => {
    if (!verifiedCV) return;
    const newEdu: Education = {
      id: `edu_new_${Date.now()}`,
      degree: 'Intitulé du diplôme / Licence / Master',
      institution: 'Université / Institut',
      city: verifiedCV.personalInfo.city || 'Cotonou',
      country: 'Bénin',
      startDate: '2021',
      endDate: '2024',
      current: false,
      description: ''
    };
    setVerifiedCV({
      ...verifiedCV,
      educations: [newEdu, ...verifiedCV.educations]
    });
  };

  const removeEducation = (id: string) => {
    if (!verifiedCV) return;
    setVerifiedCV({
      ...verifiedCV,
      educations: verifiedCV.educations.filter((edu) => edu.id !== id)
    });
  };

  const moveEducation = (index: number, direction: 'up' | 'down') => {
    if (!verifiedCV) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= verifiedCV.educations.length) return;
    const list = [...verifiedCV.educations];
    const item = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = item;
    setVerifiedCV({ ...verifiedCV, educations: list });
  };

  // Gestion des compétences
  const [newSkillName, setNewSkillName] = useState<string>('');
  const [newSkillCategory, setNewSkillCategory] = useState<Skill['category']>('transverse');

  const addSkill = () => {
    if (!verifiedCV || !newSkillName.trim()) return;
    const newSkill: Skill = {
      id: `sk_new_${Date.now()}`,
      name: newSkillName.trim(),
      category: newSkillCategory,
      level: 4
    };
    setVerifiedCV({
      ...verifiedCV,
      skills: [...verifiedCV.skills, newSkill]
    });
    setNewSkillName('');
  };

  const removeSkill = (id: string) => {
    if (!verifiedCV) return;
    setVerifiedCV({
      ...verifiedCV,
      skills: verifiedCV.skills.filter((s) => s.id !== id)
    });
  };

  // Gestion des langues
  const [newLangName, setNewLangName] = useState<string>('');
  const [newLangLevel, setNewLangLevel] = useState<Language['level']>('courant');

  const addLanguage = () => {
    if (!verifiedCV || !newLangName.trim()) return;
    const newLang: Language = {
      id: `lang_new_${Date.now()}`,
      name: newLangName.trim(),
      level: newLangLevel
    };
    setVerifiedCV({
      ...verifiedCV,
      languages: [...verifiedCV.languages, newLang]
    });
    setNewLangName('');
  };

  const removeLanguage = (id: string) => {
    if (!verifiedCV) return;
    setVerifiedCV({
      ...verifiedCV,
      languages: verifiedCV.languages.filter((l) => l.id !== id)
    });
  };

  // Choix final du modèle
  const handleSelectTemplate = (templateId: string) => {
    if (!verifiedCV) return;
    const updatedCV: CVData = {
      ...verifiedCV,
      settings: {
        ...verifiedCV.settings,
        templateId
      }
    };
    onCVImported(updatedCV);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* En-tête Wizard */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                Importez votre CV et transformez-le en un document professionnel
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Étape {step} sur 3 • {step === 1 ? 'Importation du document' : step === 2 ? 'Vérification des informations' : 'Choix du modèle'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicateur d'étapes */}
        <div className="bg-slate-100/70 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-xs font-bold text-slate-600">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-700' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-emerald-700 text-white' : 'bg-slate-300 text-slate-700'}`}>1</span>
            <span>1. Importer</span>
          </div>
          <div className="h-0.5 bg-slate-200 flex-1 mx-3" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-700' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-emerald-700 text-white' : 'bg-slate-300 text-slate-700'}`}>2</span>
            <span>2. Vérifier les données</span>
          </div>
          <div className="h-0.5 bg-slate-200 flex-1 mx-3" />
          <div className={`flex items-center gap-2 ${step === 3 ? 'text-emerald-700' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-emerald-700 text-white' : 'bg-slate-300 text-slate-700'}`}>3</span>
            <span>3. Choisir le modèle</span>
          </div>
        </div>

        {/* Corps principal selon l'étape */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* ========================================================= */}
          {/* ÉTAPE 1 : IMPORTATION DU DOCUMENT OU TEXTE */}
          {/* ========================================================= */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Deux méthodes claires */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'file' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Méthode A : Importer un document (PDF, DOCX, TXT)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'text' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Méthode B : Coller directement le contenu</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {activeTab === 'file' ? (
                <div className="space-y-5">
                  {/* Zone de glisser-déposer */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
                      isDragging
                        ? 'border-emerald-600 bg-emerald-50/50 scale-[1.01]'
                        : 'border-slate-300 hover:border-emerald-600 bg-slate-50/60 hover:bg-emerald-50/10'
                    }`}
                  >
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-xs">
                      <Upload className="w-7 h-7" />
                    </div>

                    <p className="font-extrabold text-sm sm:text-base text-slate-800">
                      Glissez et déposez votre ancien CV ici
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      ou cliquez sur le bouton pour parcourir vos dossiers
                    </p>

                    <div className="mt-4">
                      <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span>Sélectionner un fichier</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx,.doc,.txt"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="mt-4 text-[11px] text-slate-400">
                      Formats acceptés : PDF, DOCX, DOC, TXT • Taille maximale : 10 Mo
                    </div>
                  </div>

                  {/* Fichier sélectionné */}
                  {file && (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-emerald-300 flex items-center justify-center text-emerald-700">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{file.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {(file.size / 1024).toFixed(1)} Ko • {file.type || 'Document'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Retirer ce fichier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Barre de progression pendant l'analyse */}
                  {loading && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{progressLabel || 'Analyse en cours...'}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleProcessFile}
                    disabled={!file || loading}
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Analyser et extraire les informations</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Collez l'intégralité du texte de votre CV :
                    </label>
                    <textarea
                      rows={10}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Exemple :&#10;Jean-Eudes DOSSOU&#10;Ingénieur Télécoms - Cotonou&#10;Téléphone : +229 97 12 34 56&#10;Email : jeaneudes.dossou@gmail.com&#10;&#10;EXPÉRIENCES PROFESSIONNELLES :&#10;Chef de projet Réseau - Bénin Télécoms (2022 - Présent)&#10;• Déploiement et sécurisation de la fibre optique...&#10;&#10;FORMATION ACADÉMIQUE :&#10;Master Réseaux & Télécoms - EPAC / UAC (2020)"
                      className="w-full text-xs p-4 rounded-2xl border border-slate-300 focus:border-emerald-600 outline-hidden font-mono leading-relaxed"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{rawText.length} caractères saisis</span>
                      <span>Conserve la mise en page originale</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleProcessText}
                    disabled={!rawText.trim() || loading}
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Extraire et structurer mon CV</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* ÉTAPE 2 : VÉRIFICATION ET ÉDITION DES INFORMATIONS */}
          {/* ========================================================= */}
          {step === 2 && verifiedCV && (
            <div className="space-y-6">
              {/* Résumé des rubriques détectées */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                    <FileCheck2 className="w-4 h-4 text-emerald-700" />
                    <span>Vérifiez les informations de votre CV</span>
                  </div>
                  {parseResult?.isAI && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-700 text-white rounded-md flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-3 h-3" />
                      Extraction Intelligente
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-800">
                  Toutes les rubriques extraites sont affichées ci-dessous. Vous pouvez corriger, réorganiser ou compléter chaque champ librement avant de choisir votre modèle.
                </p>
                {parseResult?.detectedFields && parseResult.detectedFields.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {parseResult.detectedFields.map((f, i) => (
                      <span key={i} className="text-[10px] bg-white border border-emerald-300 text-emerald-900 px-2 py-0.5 rounded-md font-semibold">
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation par onglets de vérification */}
              <div className="flex overflow-x-auto gap-1 border-b border-slate-200 pb-2 text-xs font-bold scrollbar-none">
                <button
                  type="button"
                  onClick={() => setVerificationTab('identity')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    verificationTab === 'identity' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Identité ({verifiedCV.personalInfo.firstName ? '100%' : 'À vérifier'})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationTab('summary')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    verificationTab === 'summary' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Profil</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationTab('experiences')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    verificationTab === 'experiences' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Expériences ({verifiedCV.experiences.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationTab('educations')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    verificationTab === 'educations' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Formations ({verifiedCV.educations.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationTab('skills')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    verificationTab === 'skills' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Compétences ({verifiedCV.skills.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationTab('languages')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    verificationTab === 'languages' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>Langues ({verifiedCV.languages.length})</span>
                </button>
              </div>

              {/* CONTENU DE L'ONGLET SÉLECTIONNÉ */}
              {/* 1. Identité */}
              {verificationTab === 'identity' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Prénom *</label>
                      <input
                        type="text"
                        value={verifiedCV.personalInfo.firstName}
                        onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
                        placeholder="Ex: Boris Fabrice"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nom de famille *</label>
                      <input
                        type="text"
                        value={verifiedCV.personalInfo.lastName}
                        onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                        placeholder="Ex: DOSSOUVI"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-medium"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Titre professionnel visé *</label>
                      <input
                        type="text"
                        value={verifiedCV.personalInfo.jobTitle}
                        onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
                        placeholder="Ex: Ingénieur Informaticien Full-Stack"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Email</label>
                      <input
                        type="email"
                        value={verifiedCV.personalInfo.email}
                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                        placeholder="nom@exemple.bj"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Téléphone béninois</label>
                      <input
                        type="tel"
                        value={verifiedCV.personalInfo.phone}
                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                        placeholder="+229 97 00 00 00"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Ville de résidence</label>
                      <select
                        value={verifiedCV.personalInfo.city}
                        onChange={(e) => updatePersonalInfo('city', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-medium"
                      >
                        {BENIN_CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Adresse ou Quartier</label>
                      <input
                        type="text"
                        value={verifiedCV.personalInfo.address || ''}
                        onChange={(e) => updatePersonalInfo('address', e.target.value)}
                        placeholder="Ex: Haie Vive, Cotonou"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Profil LinkedIn (optionnel)</label>
                      <input
                        type="text"
                        value={verifiedCV.personalInfo.linkedIn || ''}
                        onChange={(e) => updatePersonalInfo('linkedIn', e.target.value)}
                        placeholder="linkedin.com/in/nom"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Site Web / Portfolio / GitHub</label>
                      <input
                        type="text"
                        value={verifiedCV.personalInfo.website || ''}
                        onChange={(e) => updatePersonalInfo('website', e.target.value)}
                        placeholder="github.com/mon-compte"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Profil */}
              {verificationTab === 'summary' && (
                <div className="space-y-3">
                  <label className="font-bold text-xs text-slate-700 block">
                    Résumé professionnel / Objectif de carrière :
                  </label>
                  <textarea
                    rows={6}
                    value={verifiedCV.profileSummary}
                    onChange={(e) => setVerifiedCV({ ...verifiedCV, profileSummary: e.target.value })}
                    placeholder="Présentez brièvement vos compétences, vos années d'expérience et ce que vous apportez à l'entreprise..."
                    className="w-full p-4 rounded-2xl border border-slate-300 focus:border-emerald-600 outline-hidden text-xs leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400">
                    💡 Un bon résumé compte 3 à 5 phrases soulignant votre rigueur, votre spécialité et votre disponibilité au Bénin.
                  </p>
                </div>
              )}

              {/* 3. Expériences */}
              {verificationTab === 'experiences' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">
                      {verifiedCV.experiences.length} expérience(s) répertoriée(s) :
                    </span>
                    <button
                      type="button"
                      onClick={addExperience}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter une expérience</span>
                    </button>
                  </div>

                  {verifiedCV.experiences.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                      Aucune expérience professionnelle détectée. Cliquez sur le bouton ci-dessus pour en ajouter une ou passez à l'étape suivante.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {verifiedCV.experiences.map((exp, idx) => (
                        <div key={exp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800">
                              #{idx + 1} {exp.role || 'Poste'} — {exp.company || 'Entreprise'}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveExperience(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                                title="Monter"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveExperience(idx, 'down')}
                                disabled={idx === verifiedCV.experiences.length - 1}
                                className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                                title="Descendre"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeExperience(exp.id)}
                                className="p-1 text-slate-400 hover:text-red-600 ml-2"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Poste / Rôle</label>
                              <input
                                type="text"
                                value={exp.role}
                                onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Entreprise</label>
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Date de début</label>
                              <input
                                type="text"
                                value={exp.startDate}
                                onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                placeholder="Ex: Janv 2022"
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Date de fin</label>
                              <input
                                type="text"
                                value={exp.current ? 'Présent' : exp.endDate}
                                onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                disabled={exp.current}
                                placeholder="Ex: Déc 2024"
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-100"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={exp.current}
                                  onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>Poste actuellement occupé</span>
                              </label>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Missions et réalisations</label>
                              <textarea
                                rows={3}
                                value={exp.description}
                                onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. Formations */}
              {verificationTab === 'educations' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">
                      {verifiedCV.educations.length} diplôme(s) & formation(s) :
                    </span>
                    <button
                      type="button"
                      onClick={addEducation}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter une formation</span>
                    </button>
                  </div>

                  {verifiedCV.educations.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                      Aucune formation académique détectée. Cliquez sur le bouton ci-dessus pour en ajouter une.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {verifiedCV.educations.map((edu, idx) => (
                        <div key={edu.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800">
                              #{idx + 1} {edu.degree || 'Diplôme'} — {edu.institution || 'Établissement'}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveEducation(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveEducation(idx, 'down')}
                                disabled={idx === verifiedCV.educations.length - 1}
                                className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeEducation(edu.id)}
                                className="p-1 text-slate-400 hover:text-red-600 ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Diplôme / Filière</label>
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Établissement / Université</label>
                              <input
                                type="text"
                                value={edu.institution}
                                onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                                placeholder="Ex: Université d'Abomey-Calavi (UAC)"
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Année d'obtention</label>
                              <input
                                type="text"
                                value={edu.endDate}
                                onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                                placeholder="Ex: 2024"
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Ville</label>
                              <input
                                type="text"
                                value={edu.city}
                                onChange={(e) => updateEducation(edu.id, 'city', e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. Compétences */}
              {verificationTab === 'skills' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap sm:flex-nowrap gap-2 items-center">
                    <input
                      type="text"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="Ajouter une compétence (ex: Comptabilité SYSCOHADA, React.js)..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-hidden"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <select
                      value={newSkillCategory}
                      onChange={(e) => setNewSkillCategory(e.target.value as any)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    >
                      <option value="informatique">Informatique</option>
                      <option value="dev_web">Développement Web</option>
                      <option value="bureautique">Bureautique</option>
                      <option value="gestion">Gestion / Finance</option>
                      <option value="vente">Commerce / Vente</option>
                      <option value="transverse">Qualités personnelles</option>
                    </select>
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0"
                    >
                      Ajouter
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {verifiedCV.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl text-xs font-semibold"
                      >
                        <span>{skill.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Langues */}
              {verificationTab === 'languages' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap sm:flex-nowrap gap-2 items-center">
                    <input
                      type="text"
                      value={newLangName}
                      onChange={(e) => setNewLangName(e.target.value)}
                      placeholder="Ajouter une langue (ex: Français, Fon, Anglais, Yoruba)..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-hidden"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLanguage();
                        }
                      }}
                    />
                    <select
                      value={newLangLevel}
                      onChange={(e) => setNewLangLevel(e.target.value as any)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                    >
                      <option value="maternelle">Langue maternelle</option>
                      <option value="courant">Bilingue / Courant</option>
                      <option value="professionnel">Professionnel</option>
                      <option value="intermediaire">Intermédiaire</option>
                      <option value="notions">Notions de base</option>
                    </select>
                    <button
                      type="button"
                      onClick={addLanguage}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0"
                    >
                      Ajouter
                    </button>
                  </div>

                  <div className="space-y-2 pt-2">
                    {verifiedCV.languages.map((lang) => (
                      <div
                        key={lang.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold"
                      >
                        <div className="flex items-center gap-2">
                          <Languages className="w-4 h-4 text-emerald-600" />
                          <span>{lang.name}</span>
                          <span className="text-slate-400 font-normal">({lang.level})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLanguage(lang.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton pour continuer vers le choix de modèle */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Importer un autre fichier</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <span>Valider les informations et choisir un modèle</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ÉTAPE 3 : GALERIE COMPLÈTE ET CHOIX DU MODÈLE */}
          {/* ========================================================= */}
          {step === 3 && verifiedCV && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-base sm:text-lg">
                    Choisissez votre modèle parmi nos 15 styles professionnels
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toutes vos données vérifiées s'adaptent instantanément à chaque modèle. Vous pourrez changer à volonté sans perdre vos informations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Modifier les données</span>
                </button>
              </div>

              {/* Galerie complète des 15 modèles avec les 8 catégories officielles */}
              <TemplateGallery
                selectedTemplateId={verifiedCV.settings.templateId || 'moderne'}
                onSelectTemplate={handleSelectTemplate}
                cv={verifiedCV}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
