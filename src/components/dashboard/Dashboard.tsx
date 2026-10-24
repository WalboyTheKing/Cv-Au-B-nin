/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CVData, PaymentTransaction, Plan, UserProfile } from '../../types';
import { storageService } from '../../services/storage';
import { generateCVPdf } from '../../services/pdfGenerator';
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
  AlertCircle
} from 'lucide-react';

interface DashboardProps {
  currentUser: UserProfile;
  cvs: CVData[];
  onEditCV: (cv: CVData) => void;
  onCreateNewCV: () => void;
  onOpenPricing: () => void;
  onRefreshData: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  cvs,
  onEditCV,
  onCreateNewCV,
  onOpenPricing,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'cvs' | 'subscription' | 'profile'>('cvs');
  const [deleteModalCVId, setDeleteModalCVId] = useState<string | null>(null);
  const [renameCVId, setRenameCVId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState<string>('');

  const payments = storageService.getPayments(currentUser.id);
  const manualOrders = storageService.getManualOrders(currentUser.id);
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

  const planQuota = subscription?.planCode === 'plus_30d' ? 10 : subscription?.planCode === 'premium_7d' ? 3 : 1;
  const isQuotaReached = cvs.length >= planQuota;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* En-tête du tableau de bord */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-0.5 rounded-full text-xs font-bold mb-2">
              <span>Espace Personnel • Bénin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Bonjour, {currentUser.firstName} {currentUser.lastName}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Gérez vos documents de candidature et suivez vos forfaits de téléchargement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCreateNewCV}
              disabled={isQuotaReached}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                isQuotaReached
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Créer un nouveau CV</span>
            </button>
          </div>
        </div>

        {/* Onglets de navigation */}
        <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('cvs')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'cvs'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Mes CV ({cvs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subscription')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'subscription'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Abonnement & Transactions FCFA</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mon Profil & Données</span>
          </button>
        </div>

        {/* 1. MES CVS */}
        {activeTab === 'cvs' && (
          <div className="space-y-6">
            {isQuotaReached && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Vous avez atteint la limite de {planQuota} CV de votre formule actuelle.
                  </span>
                </div>
                <button
                  onClick={onOpenPricing}
                  className="font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1 rounded-lg transition-colors"
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
                  className="px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer mon premier CV</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cvs.map((cvItem) => (
                  <div
                    key={cvItem.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                  >
                    <div>
                      {/* En-tête de carte */}
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          Modèle {cvItem.settings?.templateId}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(cvItem.updatedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>

                      {/* Titre éditable */}
                      {renameCVId === cvItem.id ? (
                        <div className="flex gap-2 my-2">
                          <input
                            type="text"
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            className="text-xs p-1.5 border rounded flex-1 font-bold"
                          />
                          <button
                            onClick={() => handleRenameSave(cvItem.id)}
                            className="px-2 py-1 bg-emerald-700 text-white text-[11px] rounded font-bold"
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
                          className="font-extrabold text-sm text-slate-900 hover:text-emerald-800 cursor-pointer mb-1"
                          title="Cliquez pour renommer"
                        >
                          {cvItem.title}
                        </h3>
                      )}

                      <p className="text-xs text-slate-600 font-medium">
                        {cvItem.personalInfo.firstName} {cvItem.personalInfo.lastName} •{' '}
                        {cvItem.personalInfo.jobTitle || 'Candidat'}
                      </p>

                      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{cvItem.experiences.length} exp.</span>
                        <span>•</span>
                        <span>{cvItem.educations.length} diplômes</span>
                        <span>•</span>
                        <span>{cvItem.skills.length} comp.</span>
                      </div>
                    </div>

                    {/* Actions sur le CV */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => onEditCV(cvItem)}
                        className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicate(cvItem.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Dupliquer ce CV"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModalCVId(cvItem.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer ce CV"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. ABONNEMENT & PAIEMENTS */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {/* Statut Forfait */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Votre Forfait Actuel
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {subscription?.planCode === 'plus_30d'
                      ? 'Pack Carrière 30 Jours'
                      : subscription?.planCode === 'premium_7d'
                      ? 'Accès Candidature 7 Jours'
                      : 'Formule Découverte Gratuite'}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Statut : {subscription?.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                    {subscription?.expiresAt && (
                      <span className="text-slate-500">
                        Expire le : {new Date(subscription.expiresAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={onOpenPricing}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Changer d'offre / Recharger
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block">Quota de CV autorisés</span>
                  <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                    {cvs.length} / {planQuota} CV créés
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block">Filigrane sur les PDF</span>
                  <span className="text-base font-bold text-slate-900 mt-0.5 block">
                    {subscription?.planCode !== 'free' ? 'Retiré (Documents Pro)' : 'Inclus (Version gratuite)'}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block">Assistance Rédaction IA</span>
                  <span className="text-base font-bold text-slate-900 mt-0.5 block">
                    {subscription?.planCode !== 'free' ? 'Illimitée' : 'Suggestions standards'}
                  </span>
                </div>
              </div>
            </div>

            {/* Suivi des commandes Moov Money Bénin */}
            {manualOrders.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-900">
                    Suivi de mes Commandes Moov Money
                  </h3>
                  <span className="text-xs text-slate-500">
                    Bénéficiaire : Waaliyou Z Labouda (0194537741)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b">
                      <tr>
                        <th className="py-2.5 px-3">Commande</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Offre</th>
                        <th className="py-2.5 px-3">Montant</th>
                        <th className="py-2.5 px-3">Réf Moov déclarée</th>
                        <th className="py-2.5 px-3">Statut de vérification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {manualOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {ord.orderNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {new Date(ord.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{ord.planName}</td>
                          <td className="py-3 px-3 font-bold font-mono text-emerald-800">
                            {ord.amountXOF.toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-blue-900">
                            {ord.submission?.transactionRef || (
                              <span className="text-slate-400 italic font-normal">Non renseignée</span>
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
                                Validé & Forfait Actif
                              </span>
                            )}
                            {ord.status === 'rejected' && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-900 px-2 py-0.5 rounded-full">
                                  Refusé
                                </span>
                                {ord.decision?.rejectionReason && (
                                  <div className="text-[10px] text-red-700">
                                    {ord.decision.rejectionReason}
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
              </div>
            )}

            {/* Historique des transactions Mobile Money */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
              <h3 className="font-extrabold text-base text-slate-900 mb-4">
                Historique des Paiements Confirmés (FCFA)
              </h3>
              {payments.length === 0 ? (
                <p className="text-xs text-slate-500">Aucune transaction enregistrée.</p>
              ) : (
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
              )}
            </div>
          </div>
        )}

        {/* 3. PROFIL & GESTION DES DONNÉES */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs max-w-2xl space-y-6">
            <h3 className="font-extrabold text-base text-slate-900">
              Paramètres du Compte & Conformité APDP Bénin
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nom complet</label>
                <input
                  type="text"
                  disabled
                  value={`${currentUser.firstName} ${currentUser.lastName}`}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Adresse e-mail de connexion</label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Téléphone mobile (+229)</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.phoneNumber || '+229 97 00 00 00'}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-600"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 space-y-3">
              <h4 className="font-bold text-red-600 text-xs">Zone de confidentialité avancée</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Conformément au Code du Numérique du Bénin, vous pouvez demander l'effacement définitif de toutes vos données et CV archivés.
              </p>
              <button
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer tous vos CV enregistrés ?')) {
                    cvs.forEach((c) => storageService.deleteCV(c.id));
                    onRefreshData();
                  }
                }}
                className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors"
              >
                Purger mes CV enregistrés
              </button>
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
                className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
