/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { parseCVFile, parseCVText, ParseResult } from '../../services/documentParser';
import { CVData } from '../../types';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  Loader2,
  Sparkles,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

interface CVImportModalProps {
  onCVImported: (cv: CVData) => void;
  onCancel: () => void;
}

export const CVImportModal: React.FC<CVImportModalProps> = ({ onCVImported, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  // Champs modifiables de l'aperçu avant ouverture
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [city, setCity] = useState<string>('Cotonou');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setErrorMsg('');
      setParseResult(null);
    }
  };

  const syncPreviewFields = (res: ParseResult) => {
    setParseResult(res);
    setFirstName(res.cvData.personalInfo?.firstName || '');
    setLastName(res.cvData.personalInfo?.lastName || '');
    setJobTitle(res.cvData.personalInfo?.jobTitle || '');
    setEmail(res.cvData.personalInfo?.email || '');
    setPhone(res.cvData.personalInfo?.phone || '');
    setCity(res.cvData.personalInfo?.city || 'Cotonou');
  };

  const handleProcessFile = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await parseCVFile(file);
      syncPreviewFields(res);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de l'analyse du fichier.");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessText = () => {
    if (!rawText.trim()) return;
    setLoading(true);
    try {
      const res = parseCVText(rawText);
      syncPreviewFields(res);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de l'analyse du texte.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult?.cvData) return;

    // Nettoyage de sécurité strict anti-code PDF
    let safeFirstName = firstName.trim();
    let safeLastName = lastName.trim();

    if (safeFirstName.includes('%PDF') || safeFirstName.includes('obj') || safeFirstName.includes('<<')) {
      safeFirstName = 'Candidat';
    }
    if (safeLastName.includes('%PDF') || safeLastName.includes('obj') || safeLastName.includes('<<')) {
      safeLastName = '';
    }

    const updatedCV: CVData = {
      ...parseResult.cvData,
      title: `CV Modernisé - ${safeFirstName} ${safeLastName}`.trim(),
      personalInfo: {
        ...parseResult.cvData.personalInfo,
        firstName: safeFirstName || 'Candidat',
        lastName: safeLastName,
        jobTitle: jobTitle.trim() || parseResult.cvData.personalInfo.jobTitle,
        email: email.trim() || parseResult.cvData.personalInfo.email,
        phone: phone.trim() || parseResult.cvData.personalInfo.phone,
        city: city.trim() || parseResult.cvData.personalInfo.city || 'Cotonou'
      }
    };

    onCVImported(updatedCV);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-slate-900 text-base">
                Importer et Moderniser mon CV existant
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Téléversez votre CV (PDF, DOCX ou texte) : notre intelligence artificielle extrait toutes vos données automatiquement.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!parseResult ? (
            <>
              {/* Onglets Fichier / Texte */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'file' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Fichier PDF ou DOCX</span>
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'text' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Copier-coller le texte</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {activeTab === 'file' ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl p-8 text-center transition-colors bg-slate-50 hover:bg-emerald-50/20">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <label className="cursor-pointer block">
                      <span className="font-bold text-sm text-slate-800 hover:text-emerald-700 block">
                        Cliquez pour sélectionner votre fichier de CV
                      </span>
                      <span className="text-xs text-slate-500 block mt-1">
                        Formats pris en charge : PDF, DOCX, Word, TXT (Jusqu'à 10 Mo)
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {file && (
                      <div className="mt-4 p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 inline-flex items-center gap-2 shadow-2xs">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>{file.name}</span>
                        <span className="text-[10px] text-slate-500">
                          ({(file.size / 1024).toFixed(1)} Ko)
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleProcessFile}
                    disabled={!file || loading}
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extraction intelligente par IA en cours...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analyser et pré-remplir mon CV avec l'IA</span>
                      </>
                    )}
                  </button>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">💡 Ce qui est automatiquement extrait :</p>
                    <p>• Votre identité, contact et titre professionnel.</p>
                    <p>• Toutes vos expériences avec descriptions et réalisations.</p>
                    <p>• Vos diplômes, universités et années de formation.</p>
                    <p>• Vos compétences techniques et vos langues.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Collez ici le texte intégral de votre CV existant (Expériences, Formations, Coordonnées, etc.)..."
                    className="w-full text-xs p-3.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-mono"
                  />
                  <button
                    onClick={handleProcessText}
                    disabled={!rawText.trim() || loading}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extraction en cours...</span>
                      </>
                    ) : (
                      <span>Extraire les informations du texte</span>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Résultats de l'analyse & Vérification avant ouverture */
            <div className="space-y-5">
              {/* Badge Succès */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Analyse terminée avec succès !</span>
                  </div>
                  {parseResult.isAI && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-700 text-white rounded-md flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-3 h-3" />
                      Moteur IA Gemini 2.5
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parseResult.detectedFields.map((f, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-white border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded-md font-semibold"
                    >
                      ✓ {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Résumé des sections extraites */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <Briefcase className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
                  <div className="font-extrabold text-slate-800">
                    {parseResult.cvData.experiences?.length || 0}
                  </div>
                  <div className="text-[10px] text-slate-500">Expériences</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <GraduationCap className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
                  <div className="font-extrabold text-slate-800">
                    {parseResult.cvData.educations?.length || 0}
                  </div>
                  <div className="text-[10px] text-slate-500">Formations</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <Award className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
                  <div className="font-extrabold text-slate-800">
                    {parseResult.cvData.skills?.length || 0}
                  </div>
                  <div className="text-[10px] text-slate-500">Compétences</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <Languages className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
                  <div className="font-extrabold text-slate-800">
                    {parseResult.cvData.languages?.length || 0}
                  </div>
                  <div className="text-[10px] text-slate-500">Langues</div>
                </div>
              </div>

              {parseResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                  {parseResult.warnings.map((w, i) => (
                    <p key={i}>• {w}</p>
                  ))}
                </div>
              )}

              {/* Formulaire de contrôle direct avant ouverture */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Vérifiez vos coordonnées détectées (modifiable à tout moment) :</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ex: Boris Fabrice"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Nom de famille
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ex: DOSSOUVI"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Titre professionnel / Métier
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Ex: Ingénieur Informaticien"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nom@exemple.bj"
                        className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Téléphone
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+229 97 00 00 00"
                        className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Ville de résidence
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ex: Cotonou"
                        className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setParseResult(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Choisir un autre document
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <span>Valider et ouvrir dans l'éditeur de CV</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
