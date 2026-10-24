/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { parseCVFile, parseCVText, ParseResult } from '../../services/documentParser';
import { CVData } from '../../types';
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, X, Loader2 } from 'lucide-react';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setErrorMsg('');
      setParseResult(null);
    }
  };

  const handleProcessFile = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await parseCVFile(file);
      setParseResult(res);
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
      setParseResult(res);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de l'analyse du texte.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (parseResult?.cvData) {
      onCVImported(parseResult.cvData as CVData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Importer et Moderniser mon CV existant
            </h3>
            <p className="text-xs text-slate-500">
              Transformez votre ancien CV en un document professionnel optimisé.
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
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'file' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-600'
                  }`}
                >
                  Fichier PDF ou DOCX
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'text' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-600'
                  }`}
                >
                  Copier-coller le texte
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {activeTab === 'file' ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl p-8 text-center transition-colors bg-slate-50 hover:bg-emerald-50/20">
                    <Upload className="w-10 h-10 text-emerald-700 mx-auto mb-3" />
                    <label className="cursor-pointer block">
                      <span className="font-bold text-xs text-slate-800 hover:text-emerald-700">
                        Cliquez pour sélectionner votre fichier
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-1">
                        Formats acceptés : PDF, DOCX, TXT (Max 5 Mo)
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {file && (
                      <div className="mt-4 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 inline-flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>{file.name}</span>
                        <span className="text-[10px] text-slate-400">
                          ({(file.size / 1024).toFixed(1)} Ko)
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleProcessFile}
                    disabled={!file || loading}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyse du document en cours...</span>
                      </>
                    ) : (
                      <span>Analyser et pré-remplir mon CV</span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Collez ici le texte brut de votre ancien CV..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-mono"
                  />
                  <button
                    onClick={handleProcessText}
                    disabled={!rawText.trim() || loading}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Extraire les informations</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Résultats de l'analyse */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Analyse réussie ! Informations détectées :</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {parseResult.detectedFields.map((f, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-white border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded font-semibold"
                    >
                      ✓ {f}
                    </span>
                  ))}
                </div>
              </div>

              {parseResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                  {parseResult.warnings.map((w, i) => (
                    <p key={i}>• {w}</p>
                  ))}
                </div>
              )}

              {/* Aperçu des champs extraits */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800">Aperçu des données importées :</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Nom détecté :</span>
                    <span className="font-semibold text-slate-800">
                      {parseResult.cvData.personalInfo?.firstName}{' '}
                      {parseResult.cvData.personalInfo?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Poste :</span>
                    <span className="font-semibold text-slate-800">
                      {parseResult.cvData.personalInfo?.jobTitle || 'Non détecté'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Email :</span>
                    <span className="font-semibold text-slate-800">
                      {parseResult.cvData.personalInfo?.email || 'Non détecté'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Téléphone :</span>
                    <span className="font-semibold text-slate-800">
                      {parseResult.cvData.personalInfo?.phone || 'Non détecté'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setParseResult(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
                >
                  Recommencer
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Ouvrir dans l'éditeur de CV</span>
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
