/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CVData, getCVPermissions, PaymentTransaction, Plan, UserProfile } from '../../types';
import { storageService } from '../../services/storage';
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  Edit,
  Download,
  Sparkles,
  CreditCard,
  User,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  Phone,
  Mail,
  KeyRound,
  ExternalLink,
  Info,
  MessageCircle
} from 'lucide-react';

interface DashboardProps {
  currentUser: UserProfile;
  cvs: CVData[];
  onEditCV: (cv: CVData) => void;
  onCreateNewCV: () => void;
  onOpenPricing: (targetCV?: CVData) => void;
  onRefreshData: () => void;
  onLogout?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  cvs,
  onEditCV,
  onCreateNewCV,
  onOpenPricing,
  onRefreshData,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'cvs' | 'orders' | 'subscription' | 'profile'>('cvs');
  const [deleteModalCVId, setDeleteModalCVId] = useState<string | null>(null);
  const [renameCVId, setRenameCVId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState<string>('');
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Formulaire d'édition du profil
  const [firstName, setFirstName] = useState<string>(currentUser.firstName || '');
  const [lastName, setLastName] = useState<string>(currentUser.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(currentUser.phoneNumber || '');
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulaire de changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordSaving, setPasswordSaving] = useState<boolean>(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modale de suppression de compte
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState<boolean>(false);
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState<string>('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState<boolean>(false);

  // Horloge en temps réel pour le décompte seconde par seconde
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const manualOrders = storageService.getManualOrders(currentUser.id);
  const payments = storageService.getPayments(currentUser.id);
  const subscription = currentUser.subscription;

  const handleDeleteConfirm = () => {
    if (deleteModalCVId) {
      storageService.deleteCV(deleteModalCVId);
      setDeleteModalCVId(null);
      onRefreshData();
    }
  };

  const handleDuplicate = (id: string) => {
    const copy = storageService.duplicateCV(id);
    if (copy) {
      onRefreshData();
    }
  };

  const handleRenameSave = (id: string) => {
    const cv = storageService.getCVById(id);
    if (cv && renameTitle.trim()) {
      cv.title = renameTitle.trim();
      storageService.saveCV(cv);
      setRenameCVId(null);
      onRefreshData();
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await storageService.updateMyProfile({
        firstName,
        lastName,
        phoneNumber
      });
      if (res.success) {
        setProfileMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
        onRefreshData();
      } else {
        setProfileMessage({ type: 'error', text: res.error || 'Erreur lors de la mise à jour.' });
      }
    } catch {
      setProfileMessage({ type: 'error', text: 'Une erreur imprévue est survenue.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' });
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await storageService.changeMyPassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordMessage({ type: 'success', text: 'Mot de passe modifié avec succès.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: res.error || 'Erreur lors du changement de mot de passe.' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Impossible de joindre le service de sécurité.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountConfirmText !== 'SUPPRIMER') return;
    setDeleteAccountLoading(true);
    try {
      const res = await storageService.deleteMyAccount();
      if (res.success) {
        setDeleteAccountModalOpen(false);
        if (onLogout) {
          onLogout();
        } else {
          window.location.href = '/';
        }
      } else {
        alert(res.error || 'Impossible de supprimer le compte.');
      }
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const plans = storageService.getPlans();
  const accountPermissions = getCVPermissions(null, currentUser, cvs.length, plans);
  const activePlanDef = plans.find((p) => p.code === (subscription?.planCode || 'free'));
  const planQuota =
    activePlanDef?.quotas?.maxCVs ??
    (subscription?.planCode === 'career_30d' || subscription?.planCode === 'plus_30d' ? 15 : 5);
  const isQuotaReached = !accountPermissions.canCreateCV;

  const handleExportPersonalDataJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      platform: 'CV Pro Bénin',
      compliance: 'APDP Bénin — Droit à la portabilité',
      user: currentUser,
      cvs,
      manualOrders,
      payments
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cv-pro-benin-donnees-${currentUser.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* En-tête du tableau de bord */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-0.5 rounded-full text-xs font-bold mb-2">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Espace Personnel Candidat • République du Bénin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Bonjour, {currentUser.firstName} {currentUser.lastName}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {currentUser.email} • Suivez vos documents et vos droits d'exportation Moov Money.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCreateNewCV}
              disabled={isQuotaReached}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                isQuotaReached
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Créer un nouveau CV</span>
            </button>
          </div>
        </div>

        {/* Onglets de navigation */}
        <div className="flex border-b border-slate-200 gap-4 sm:gap-6 text-xs font-bold overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('cvs')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'cvs'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Mes CV ({cvs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Commandes Moov Money ({manualOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subscription')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'subscription'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Mon Forfait & Droits</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil & Sécurité</span>
          </button>
        </div>

        {/* 1. MES CVS */}
        {activeTab === 'cvs' && (
          <div className="space-y-6">
            {isQuotaReached && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Vous avez atteint le plafond de <strong>{planQuota} CV</strong> de votre formule actuelle.
                  </span>
                </div>
                <button
                  onClick={() => onOpenPricing()}
                  className="font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Augmenter mes quotas
                </button>
              </div>
            )}

            {cvs.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-base">Aucun CV pour l'instant</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Démarrez avec l'un de nos modèles professionnels adaptés au marché béninois.
                </p>
                <button
                  onClick={onCreateNewCV}
                  className="px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer mon premier CV</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cvs.map((cvItem) => {
                  const access = cvItem.access;
                  const expiresTime = access?.expiresAt ? new Date(access.expiresAt).getTime() : 0;
                  const isAccessActive = Boolean(access && access.status === 'active' && expiresTime > nowTimestamp);
                  const isAccessExpired = Boolean(access && access.expiresAt && expiresTime <= nowTimestamp);

                  // Décompte précis
                  const remainingMs = expiresTime - nowTimestamp;
                  let remainingText = '';
                  if (isAccessActive) {
                    const totalSec = Math.floor(remainingMs / 1000);
                    const d = Math.floor(totalSec / 86400);
                    const h = Math.floor((totalSec % 86400) / 3600);
                    const m = Math.floor((totalSec % 3600) / 60);
                    const s = totalSec % 60;
                    if (d > 0) remainingText = `${d}j ${h}h ${m}m restants`;
                    else if (h > 0) remainingText = `${h}h ${m}m ${s}s restants`;
                    else remainingText = `${m}m ${s}s restants`;
                  }

                  const pendingOrder = manualOrders.find(
                    (o) => o.cvId === cvItem.id && o.status === 'pending_verification'
                  );

                  return (
                    <div
                      key={cvItem.id}
                      className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                        isAccessActive
                          ? 'border-emerald-300 shadow-sm ring-1 ring-emerald-400/30'
                          : isAccessExpired
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-slate-200 shadow-2xs hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* En-tête : Modèle & Badge de droit */}
                        <div className="flex flex-wrap justify-between items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            Modèle {cvItem.settings?.templateId}
                          </span>

                          {isAccessActive ? (
                            <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {access?.planCode === 'career_30d' || access?.planCode === 'plus_30d'
                                ? 'Pack 30j Actif'
                                : 'Accès 24h Actif'}
                            </span>
                          ) : isAccessExpired ? (
                            <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Accès Expiré
                            </span>
                          ) : pendingOrder ? (
                            <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-900 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-600" />
                              Vérif Moov en cours
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              Brouillon non payé
                            </span>
                          )}
                        </div>

                        {/* Titre éditable */}
                        {renameCVId === cvItem.id ? (
                          <div className="flex gap-2 my-2">
                            <input
                              type="text"
                              value={renameTitle}
                              onChange={(e) => setRenameTitle(e.target.value)}
                              className="text-xs p-1.5 border rounded flex-1 font-bold"
                              autoFocus
                            />
                            <button
                              onClick={() => handleRenameSave(cvItem.id)}
                              className="px-2 py-1 bg-emerald-700 text-white text-[11px] rounded font-bold cursor-pointer"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <h3
                            onClick={() => {
                              setRenameCVId(cvItem.id);
                              setRenameTitle(cvItem.title);
                            }}
                            className="font-extrabold text-sm text-slate-900 hover:text-emerald-800 cursor-pointer mb-0.5"
                            title="Cliquez pour renommer ce CV"
                          >
                            {cvItem.title}
                          </h3>
                        )}

                        <p className="text-xs text-slate-600 font-medium">
                          {cvItem.personalInfo.firstName} {cvItem.personalInfo.lastName} •{' '}
                          {cvItem.personalInfo.jobTitle || 'Candidat'}
                        </p>

                        {/* Bloc commercial statut & temps restant */}
                        <div className="rounded-xl p-3 text-xs space-y-1.5 bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-medium">Offre associée :</span>
                            <span className="font-bold text-slate-800">
                              {access?.planName || (isAccessExpired ? 'Accès expiré' : 'Formule Gratuite')}
                            </span>
                          </div>

                          {isAccessActive && (
                            <>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500 font-medium">Expire le :</span>
                                <span className="font-bold text-emerald-800 font-mono">
                                  {new Date(access!.expiresAt!).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}{' '}
                                  à{' '}
                                  {new Date(access!.expiresAt!).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="pt-1 border-t border-emerald-100 flex items-center justify-between">
                                <span className="text-emerald-700 font-semibold text-[10px] uppercase tracking-wider">
                                  Temps restant :
                                </span>
                                <span className="text-xs font-black font-mono text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                                  ⏱ {remainingText}
                                </span>
                              </div>
                            </>
                          )}

                          {isAccessExpired && (
                            <div className="space-y-1 text-[11px] text-amber-900 pt-1">
                              <p className="font-medium leading-tight">
                                Accès expiré le{' '}
                                <strong className="font-mono">
                                  {new Date(access!.expiresAt!).toLocaleDateString('fr-FR')} à{' '}
                                  {new Date(access!.expiresAt!).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </strong>
                                . Vos données sont conservées.
                              </p>
                              <p className="text-[10px] text-amber-800">
                                Réactivez les exports sans filigrane : <strong>500 FCFA (24h)</strong> ou{' '}
                                <strong>1 000 FCFA (30j)</strong>.
                              </p>
                            </div>
                          )}

                          {!isAccessActive && !isAccessExpired && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Export sans filigrane verrouillé jusqu'à l'approbation du paiement.</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>{cvItem.experiences.length} exp.</span>
                          <span>•</span>
                          <span>{cvItem.educations.length} diplômes</span>
                          <span>•</span>
                          <span>{cvItem.skills.length} comp.</span>
                        </div>
                      </div>

                      {/* Actions sur le CV */}
                      <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEditCV(cvItem)}
                            className="flex-1 px-3 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Modifier</span>
                          </button>

                          <button
                            onClick={() => onEditCV(cvItem)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                              isAccessActive
                                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                            title={
                              isAccessActive
                                ? 'Ouvrir l’aperçu et exporter le PDF Pro A4 sans filigrane'
                                : 'Ouvrir l’aperçu et exporter le PDF avec filigrane'
                            }
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {isAccessActive ? 'PDF Pro' : 'PDF'}
                            </span>
                          </button>

                          <button
                            onClick={() => handleDuplicate(cvItem.id)}
                            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            title="Dupliquer ce CV"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteModalCVId(cvItem.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="Supprimer ce CV"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Bouton d'achat ou de renouvellement pour CE CV */}
                        {!isAccessActive && (
                          <button
                            onClick={() => onOpenPricing(cvItem)}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isAccessExpired
                                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-2xs'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                              {isAccessExpired
                                ? 'Renouveler l’accès (500 ou 1 000 FCFA)'
                                : 'Débloquer l’export sans filigrane (Moov Money)'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. COMMANDES MOOV MONEY BÉNIN */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Historique de mes Commandes Moov Money Bénin
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chaque transfert vers le <strong>01 94 53 77 41</strong> (Waaliyou Z Labouda) est vérifié par nos équipes sous 15 minutes.
                  </p>
                </div>
                <button
                  onClick={() => onOpenPricing()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Nouvelle commande
                </button>
              </div>

              {manualOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-medium">Vous n'avez passé aucune commande pour le moment.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b">
                      <tr>
                        <th className="py-2.5 px-3">Numéro Commande</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Offre</th>
                        <th className="py-2.5 px-3">Montant</th>
                        <th className="py-2.5 px-3">Référence Moov</th>
                        <th className="py-2.5 px-3">Statut de validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {manualOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {ord.orderNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {new Date(ord.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{ord.planName}</td>
                          <td className="py-3 px-3 font-bold font-mono text-emerald-800">
                            {ord.amountXOF.toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-900">
                            {ord.submission?.transactionRef || (
                              <span className="text-slate-400 italic font-normal">En attente de saisie</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {ord.status === 'pending_payment' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                                En attente transfert
                              </span>
                            )}
                            {ord.status === 'pending_verification' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                                <Clock className="w-3 h-3 text-amber-600" />
                                En cours de vérification
                              </span>
                            )}
                            {ord.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Approuvé • Forfait Actif
                              </span>
                            )}
                            {ord.status === 'rejected' && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-900 px-2 py-0.5 rounded-full">
                                  Refusé
                                </span>
                                {ord.decision?.rejectionReason && (
                                  <div className="text-[10px] text-red-700 font-medium">
                                    Motif : {ord.decision.rejectionReason}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. MON FORFAIT & DROITS */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Formule Actuelle du Compte
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {subscription?.planCode === 'plus_30d' || subscription?.planCode === 'career_30d'
                      ? 'Pack Carrière 30 Jours'
                      : subscription?.planCode === 'premium_7d' || subscription?.planCode === 'cand_24h'
                      ? 'Accès Candidature'
                      : 'Formule Découverte Gratuite'}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Statut : {subscription?.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                    {subscription?.expiresAt && (
                      <span className="text-slate-500 font-mono">
                        Expire le : {new Date(subscription.expiresAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onOpenPricing()}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Changer d'offre / Débloquer
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block font-semibold">1. Création de CV</span>
                  <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                    {cvs.length} / {planQuota} CV
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {accountPermissions.canCreateCV
                      ? 'Autorisée dans votre quota actif'
                      : 'Plafond atteint (passez au Pack Carrière)'}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block font-semibold">2. Modification & Conservation</span>
                  <span className="text-base font-bold text-emerald-800 mt-0.5 block">
                    {accountPermissions.canEditCV ? 'Toujours autorisée' : 'Restreinte'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Vos CV expirés restent conservés et modifiables sans suppression.
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block font-semibold">3. Export PDF A4</span>
                  <span className="text-base font-bold text-slate-900 mt-0.5 block">
                    {cvs.filter((c) => c.access?.status === 'active' && c.access?.expiresAt && new Date(c.access.expiresAt).getTime() > nowTimestamp).length > 0 ||
                    accountPermissions.canDownloadCleanPDF
                      ? 'Sans filigrane actif'
                      : 'Découverte (avec filigrane)'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Débloqué par commande Moov Money validée côté serveur.
                  </span>
                </div>
              </div>

              {/* Assistance WhatsApp Directe */}
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-emerald-950">Assistance & Support Client Bénin</div>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      Une question sur un transfert Moov Money ou votre CV ? Écrivez-nous directement au +229 01 94 53 77 41.
                    </p>
                  </div>
                </div>
                <a
                  href="https://wa.me/2290194537741"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Contacter sur WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Historique des paiements confirmés */}
            {payments.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
                <h3 className="font-extrabold text-base text-slate-900">
                  Paiements enregistrés et archivés
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Référence</th>
                        <th className="py-2.5 px-3">Forfait</th>
                        <th className="py-2.5 px-3">Moyen</th>
                        <th className="py-2.5 px-3">Montant</th>
                        <th className="py-2.5 px-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 text-slate-600">
                            {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">
                            {p.providerReference}
                          </td>
                          <td className="py-3 px-3 text-slate-900 font-semibold">{p.planName}</td>
                          <td className="py-3 px-3 uppercase text-[11px] text-slate-600 font-medium">
                            {p.provider.replace('_', ' ')}
                          </td>
                          <td className="py-3 px-3 font-bold font-mono text-slate-900">
                            {p.amountXOF.toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              Validé
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. PROFIL & SÉCURITÉ */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulaire des Informations Personnelles */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Informations Personnelles</h3>
                  <p className="text-xs text-slate-500">Mettez à jour vos coordonnées de contact</p>
                </div>
              </div>

              {profileMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    profileMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {profileMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Prénom</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nom</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Adresse Email (Identifiant)</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    L'adresse email sert d'identifiant unique et ne peut être modifiée.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Téléphone Mobile (+229 Bénin)</span>
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+229 97 00 00 00"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    {profileSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </form>
            </div>

            {/* Formulaire de Sécurité & Mot de Passe */}
            <div className="space-y-8">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Mot de Passe & Sécurité</h3>
                    <p className="text-xs text-slate-500">Sécurisez l'accès à vos CV et historiques</p>
                  </div>
                </div>

                {passwordMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      passwordMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {passwordMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Mot de passe actuel</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nouveau mot de passe (min 8 car.)</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      {passwordSaving ? 'Vérification...' : 'Mettre à jour le mot de passe'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Zone Conformité APDP Bénin & Portabilité */}
              <div className="bg-red-50/50 rounded-3xl p-6 sm:p-8 border border-red-200 space-y-4">
                <div className="flex items-center gap-2 text-red-900">
                  <Shield className="w-4 h-4 text-red-600" />
                  <h4 className="font-extrabold text-sm">Conformité APDP Bénin • Données personnelles</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  En vertu du Code du Numérique de la République du Bénin, vous pouvez télécharger l'intégralité de vos données personnelles au format JSON ou demander l'effacement définitif de votre compte.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportPersonalDataJSON}
                    className="px-4 py-2 bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exporter mes données (JSON — APDP)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteAccountModalOpen(true)}
                    className="px-4 py-2 bg-white text-red-600 border border-red-300 hover:bg-red-600 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    Supprimer définitivement mon compte
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALE DE SUPPRESSION DE CV */}
      {deleteModalCVId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="font-extrabold text-slate-900 text-base">Supprimer ce CV ?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Cette action est définitive. Les données de ce CV seront effacées de votre compte.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteModalCVId(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE SUPPRESSION DE COMPTE (APDP BÉNIN) */}
      {deleteAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-red-200 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="font-black text-slate-900 text-lg">Supprimer votre compte ?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cette action est <strong>irréversible</strong>. Tous vos CV ({cvs.length}), historiques de commandes et données personnelles seront immédiatement et définitivement purgés des serveurs.
              </p>
              <p className="text-xs text-slate-700 font-bold pt-2">
                Pour confirmer, tapez <span className="text-red-600 font-mono">SUPPRIMER</span> ci-dessous :
              </p>
            </div>

            <input
              type="text"
              value={deleteAccountConfirmText}
              onChange={(e) => setDeleteAccountConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-center font-mono font-bold text-xs uppercase focus:ring-2 focus:ring-red-600 focus:outline-hidden"
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteAccountModalOpen(false);
                  setDeleteAccountConfirmText('');
                }}
                disabled={deleteAccountLoading}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteAccountConfirmText !== 'SUPPRIMER' || deleteAccountLoading}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer"
              >
                {deleteAccountLoading ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
