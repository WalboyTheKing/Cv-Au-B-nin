/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { parseCVFile, parseCVText, ParseResult } from '../../services/documentParser';
import { CVData, Experience, Education, Skill, Language, CustomSection, TemplateDefinition } from '../../types';
import { BENIN_CITIES, CV_TEMPLATES, TEMPLATE_CATEGORIES } from '../../config';
import { TemplateMiniature } from '../templates/TemplateMiniature';
import { TemplatePreviewModal } from '../templates/TemplatePreviewModal';
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
  Check,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CVImportModalProps {
  onCVImported: (cv: CVData) => void;
  onCancel: () => void;
}

export const CVImportModal: React.FC<CVImportModalProps> = ({ onCVImported, onCancel }) => {
  // Navigation du wizard : 1 = Importation / Collage, 2 = Choix du modèle & validation
  const [step, setStep] = useState<1 | 2>(1);

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

  // Modèle choisi (par défaut 'moderne')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('moderne');
  const [selectedCategory, setSelectedCategory] = useState<string>('tous');
  const [previewingTemplate, setPreviewingTemplate] = useState<TemplateDefinition | null>(null);

  // Accordéon pour voir/modifier les détails extraits
  const [showEditDetails, setShowEditDetails] = useState<boolean>(false);

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
      setErrorMsg('Format non pris en charge. Veuillez fournir un fichier PDF, Word (DOCX/DOC) ou Texte (TXT).');
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
    setProgressPercent(15);
    setProgressLabel('Lecture de votre document...');

    try {
      const res = await parseCVFile(file, (p, label) => {
        setProgressPercent(p);
        setProgressLabel(label);
      });
      setParseResult(res);
      setVerifiedCV(res.cvData);
      if (res.cvData.settings?.templateId) {
        setSelectedTemplateId(res.cvData.settings.templateId);
      }
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de l'analyse du document. Vous pouvez aussi coller le texte directement.");
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
    setProgressLabel('Structuration des informations...');

    try {
      const res = parseCVText(rawText);
      setParseResult(res);
      setVerifiedCV(res.cvData);
      if (res.cvData.settings?.templateId) {
        setSelectedTemplateId(res.cvData.settings.templateId);
      }
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de l'analyse du texte.");
    } finally {
      setLoading(false);
    }
  };

  // Mise à jour rapide des informations personnelles
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

  // Validation finale avec le modèle choisi
  const handleConfirmAndOpenBuilder = (templateIdToUse?: string) => {
    if (!verifiedCV) return;
    const tpl = templateIdToUse || selectedTemplateId || 'moderne';
    const updatedCV: CVData = {
      ...verifiedCV,
      settings: {
        ...verifiedCV.settings,
        templateId: tpl
      }
    };
    onCVImported(updatedCV);
  };

  const filteredTemplates = CV_TEMPLATES.filter((t) => {
    if (!t.isActive) return false;
    if (selectedCategory === 'tous') return true;
    return t.category === selectedCategory;
  });

  const selectedTemplateObj = CV_TEMPLATES.find((t) => t.id === selectedTemplateId) || CV_TEMPLATES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* En-tête de la modale */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                {step === 1
                  ? 'Importer votre CV (Fichier ou Texte)'
                  : 'Choisissez votre modèle parmi nos 15 styles béninois'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 1
                ? 'Étape 1/2 : Importez votre document pour en extraire le contenu sans effort'
                : 'Étape 2/2 : Sélectionnez le modèle de présentation qui valorise le mieux votre profil'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps principal */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* ========================================================= */}
          {/* ÉTAPE 1 : IMPORTATION DU FICHIER OU COLLAGE DU TEXTE      */}
          {/* ========================================================= */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Onglets de méthode d'import */}
              <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'file'
                      ? 'bg-white shadow-xs text-emerald-800 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Option 1 : Importer un fichier (PDF, Word DOCX/DOC, TXT)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-white shadow-xs text-emerald-800 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Option 2 : Coller le texte de votre CV</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {activeTab === 'file' ? (
                <div className="space-y-5">
                  {/* Zone glisser-déposer */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all ${
                      isDragging
                        ? 'border-emerald-600 bg-emerald-50/60 scale-[1.01]'
                        : 'border-slate-300 hover:border-emerald-600 bg-slate-50/60 hover:bg-emerald-50/20'
                    }`}
                  >
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
                      <Upload className="w-8 h-8" />
                    </div>

                    <p className="font-extrabold text-base text-slate-800">
                      Glissez et déposez votre CV ici
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Notre intelligence d'extraction analysera vos coordonnées, expériences, diplômes et compétences sans que vous n'ayez à tout retaper.
                    </p>

                    <div className="mt-5">
                      <label className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm">
                        <FileText className="w-4 h-4 text-emerald-300" />
                        <span>Sélectionner mon fichier CV</span>
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
                      Formats acceptés : PDF, DOCX, DOC, TXT • Jusqu'à 10 Mo
                    </div>
                  </div>

                  {/* Fichier prêt */}
                  {file && (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-emerald-300 flex items-center justify-center text-emerald-700">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{file.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {(file.size / 1024).toFixed(1)} Ko • Prêt pour l'extraction
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Retirer ce fichier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Progression */}
                  {loading && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{progressLabel || 'Analyse en cours...'}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
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
                    className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{loading ? 'Analyse en cours...' : 'Analyser et choisir mon modèle →'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Collez le contenu textuel de votre CV :
                    </label>
                    <textarea
                      rows={12}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Exemple :&#10;Jean-Eudes DOSSOU&#10;Ingénieur Logiciel & Concepteur d'applications&#10;Téléphone : +229 97 12 34 56&#10;Email : jeaneudes.dossou@gmail.com&#10;Cotonou, Bénin&#10;&#10;EXPÉRIENCES PROFESSIONNELLES :&#10;Lead Développeur - Digital Solutions Bénin (2022 - Présent)&#10;• Conception et mise en production de plateformes web...&#10;&#10;FORMATIONS :&#10;Master Génie Logiciel - IFRI / Université d'Abomey-Calavi (2021)&#10;&#10;COMPÉTENCES :&#10;TypeScript, React, Node.js, PostgreSQL, SYSCOHADA"
                      className="w-full text-xs p-4 rounded-2xl border border-slate-300 focus:border-emerald-600 outline-hidden font-mono leading-relaxed bg-slate-50 focus:bg-white"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{rawText.length} caractères saisis</span>
                      <span>Extraction automatique de toutes les rubriques</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleProcessText}
                    disabled={!rawText.trim() || loading}
                    className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{loading ? 'Analyse en cours...' : 'Structurer et choisir mon modèle →'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* ÉTAPE 2 : CHOIX DU MODÈLE (15 MODÈLES) & APERÇU IMMÉDIAT   */}
          {/* ========================================================= */}
          {step === 2 && verifiedCV && (
            <div className="space-y-6">
              {/* Carte résumé compacte des données extraites */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm sm:text-base">
                        Informations extraites avec succès !
                      </h4>
                      <p className="text-xs text-slate-600">
                        {verifiedCV.personalInfo.firstName || 'Candidat'} {verifiedCV.personalInfo.lastName || ''} •{' '}
                        {verifiedCV.personalInfo.jobTitle || 'Professionnel'}
                      </p>
                    </div>
                  </div>

                  {/* Bouton pour ajuster les coordonnées */}
                  <button
                    type="button"
                    onClick={() => setShowEditDetails(!showEditDetails)}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/80 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{showEditDetails ? 'Masquer l’ajustement rapide' : 'Ajuster mes coordonnées'}</span>
                    {showEditDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Badges statistiques */}
                <div className="flex flex-wrap gap-2 text-xs font-medium text-emerald-900 pt-1 border-t border-emerald-200/60">
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>{verifiedCV.experiences.length}</strong> expériences
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>{verifiedCV.educations.length}</strong> formations
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>{verifiedCV.skills.length}</strong> compétences
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>{verifiedCV.languages.length}</strong> langues
                  </span>
                  {verifiedCV.personalInfo.phone && (
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      {verifiedCV.personalInfo.phone}
                    </span>
                  )}
                  {verifiedCV.personalInfo.email && (
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      {verifiedCV.personalInfo.email}
                    </span>
                  )}
                </div>

                {/* Formulaire dépliable d'ajustement rapide */}
                {showEditDetails && (
                  <div className="bg-white rounded-2xl p-4 border border-emerald-200 space-y-3 pt-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Prénom</label>
                        <input
                          type="text"
                          value={verifiedCV.personalInfo.firstName}
                          onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
                          placeholder="Ex: Jean-Eudes"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:border-emerald-600 outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Nom</label>
                        <input
                          type="text"
                          value={verifiedCV.personalInfo.lastName}
                          onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
                          placeholder="Ex: DOSSOU"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:border-emerald-600 outline-hidden"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">Intitulé du poste visé</label>
                        <input
                          type="text"
                          value={verifiedCV.personalInfo.jobTitle}
                          onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
                          placeholder="Ex: Lead Développeur Full-Stack"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:border-emerald-600 outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Téléphone béninois</label>
                        <input
                          type="text"
                          value={verifiedCV.personalInfo.phone}
                          onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                          placeholder="+229 97 00 00 00"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:border-emerald-600 outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Ville de résidence</label>
                        <select
                          value={verifiedCV.personalInfo.city || 'Cotonou'}
                          onChange={(e) => updatePersonalInfo('city', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:border-emerald-600 outline-hidden"
                        >
                          {BENIN_CITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Barre de filtres des 8 catégories */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Sélectionnez votre modèle de CV :
                  </h4>
                  <span className="text-xs text-slate-500">
                    Modèle sélectionné : <strong className="text-emerald-800">{selectedTemplateObj.name}</strong> ({selectedTemplateObj.styleLabel})
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {TEMPLATE_CATEGORIES.map((cat) => {
                    const isCurrent = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isCurrent
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {cat.id === 'tous' ? 15 : cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grille des 15 modèles avec prévisualisation fidèle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTemplates.map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`group bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer shadow-2xs hover:shadow-lg ${
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-600/30 shadow-md bg-emerald-50/10'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {/* Miniature visuelle */}
                      <div className="relative p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
                            {tpl.styleLabel}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 z-10 bg-emerald-700 text-white rounded-full p-1 shadow-sm">
                            <Check className="w-3 h-3" />
                          </div>
                        )}

                        <div className="w-32 transition-transform duration-200 group-hover:scale-105">
                          <TemplateMiniature template={tpl} color={tpl.defaultColor} cv={verifiedCV} />
                        </div>
                      </div>

                      {/* Infos modèle */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {tpl.name}
                            </h5>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                              {tpl.description}
                            </p>
                          </div>
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-white shadow-2xs"
                            style={{ backgroundColor: tpl.defaultColor }}
                          />
                        </div>

                        <div className="flex gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewingTemplate(tpl);
                            }}
                            className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Aperçu</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmAndOpenBuilder(tpl.id);
                            }}
                            className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-700 text-white'
                                : 'bg-slate-900 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{isSelected ? 'Choisir' : 'Sélectionner'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Barre de confirmation en bas */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Importer un autre document</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmAndOpenBuilder()}
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <span>Créer mon CV avec le modèle « {selectedTemplateObj.name} »</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modale d'aperçu grand format */}
      {previewingTemplate && verifiedCV && (
        <TemplatePreviewModal
          template={previewingTemplate}
          cv={verifiedCV}
          onSelect={(tplId) => {
            setSelectedTemplateId(tplId);
            setPreviewingTemplate(null);
            handleConfirmAndOpenBuilder(tplId);
          }}
          onClose={() => setPreviewingTemplate(null)}
        />
      )}
    </div>
  );
};
