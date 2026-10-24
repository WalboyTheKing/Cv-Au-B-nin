/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AdminMetrics,
  AuditLog,
  ManualPaymentOrder,
  Plan,
  TemplateDefinition,
  UserProfile
} from '../../types';
import { storageService } from '../../services/storage';
import { MOOV_MONEY_BENEFICIARY } from '../../config';
import {
  Shield,
  Users,
  CreditCard,
  FileText,
  DollarSign,
  Activity,
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  Lock,
  RefreshCw,
  Clock,
  AlertTriangle,
  FileCheck2,
  Check,
  X,
  Eye,
  ExternalLink
} from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'manual_orders' | 'users' | 'plans' | 'templates' | 'logs'>('manual_orders');
  const [searchUser, setSearchUser] = useState<string>('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending_verification' | 'approved' | 'rejected'>('all');
  const [searchOrder, setSearchOrder] = useState<string>('');

  // Modales d'action sur les commandes
  const [orderToApprove, setOrderToApprove] = useState<ManualPaymentOrder | null>(null);
  const [orderToReject, setOrderToReject] = useState<ManualPaymentOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [viewProofOrder, setViewProofOrder] = useState<ManualPaymentOrder | null>(null);

  // Cases à cocher obligatoires pour l'approbation
  const [checkAccount, setCheckAccount] = useState<boolean>(false);
  const [checkAmount, setCheckAmount] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const metrics: AdminMetrics = storageService.getAdminMetrics();
  const users: UserProfile[] = storageService.getUsers();
  const plans: Plan[] = storageService.getPlans();
  const templates: TemplateDefinition[] = storageService.getTemplates();
  const auditLogs: AuditLog[] = storageService.getAuditLogs();
  const manualOrders: ManualPaymentOrder[] = storageService.getManualOrders();

  const filteredUsers = users.filter((u) => {
    const q = searchUser.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q)
    );
  });

  const filteredOrders = manualOrders.filter((ord) => {
    if (orderFilter !== 'all' && ord.status !== orderFilter) return false;
    if (!searchOrder.trim()) return true;
    const q = searchOrder.toLowerCase();
    return (
      ord.orderNumber.toLowerCase().includes(q) ||
      ord.userName.toLowerCase().includes(q) ||
      ord.userEmail.toLowerCase().includes(q) ||
      (ord.submission?.transactionRef || '').toLowerCase().includes(q) ||
      (ord.submission?.senderPhone || '').includes(q)
    );
  });

  const handleApproveOrder = () => {
    if (!orderToApprove) return;
    if (!checkAccount || !checkAmount) {
      alert("Veuillez cocher les cases attestant de la vérification préalable de votre compte Moov Money.");
      return;
    }

    const res = storageService.approveManualOrder(
      orderToApprove.id,
      'admin_master',
      'admin@cvprobenin.bj'
    );

    if (res.success) {
      setActionMessage(`La commande ${orderToApprove.orderNumber} a été validée. Le forfait a été activé pour ${orderToApprove.userName}.`);
      setOrderToApprove(null);
      setCheckAccount(false);
      setCheckAmount(false);
      setTimeout(() => setActionMessage(null), 4000);
    } else {
      alert(res.error || "Erreur lors de l'approbation.");
    }
  };

  const handleRejectOrder = () => {
    if (!orderToReject) return;
    if (!rejectionReason.trim()) {
      alert("Veuillez indiquer un motif de refus.");
      return;
    }

    const res = storageService.rejectManualOrder(
      orderToReject.id,
      'admin_master',
      'admin@cvprobenin.bj',
      rejectionReason.trim()
    );

    if (res.success) {
      setActionMessage(`La commande ${orderToReject.orderNumber} a été marquée comme rejetée.`);
      setOrderToReject(null);
      setRejectionReason('');
      setTimeout(() => setActionMessage(null), 4000);
    } else {
      alert(res.error || "Erreur lors du rejet.");
    }
  };

  const togglePlanActive = (planId: string) => {
    const updated = plans.map((p) => (p.id === planId ? { ...p, isActive: !p.isActive } : p));
    storageService.savePlans(updated);
    storageService.addAuditLog({
      actorId: 'admin_master',
      actorEmail: 'admin@cvprobenin.bj',
      action: `Basculement statut offre ${planId}`,
      resourceType: 'plan',
      resourceId: planId
    });
  };

  const updatePlanPrice = (planId: string, newPrice: number) => {
    const updated = plans.map((p) => (p.id === planId ? { ...p, priceXOF: newPrice } : p));
    storageService.savePlans(updated);
    storageService.addAuditLog({
      actorId: 'admin_master',
      actorEmail: 'admin@cvprobenin.bj',
      action: `Modification tarif offre ${planId} à ${newPrice} FCFA`,
      resourceType: 'plan',
      resourceId: planId
    });
  };

  const toggleTemplatePremium = (templateId: string) => {
    const updated = templates.map((t) =>
      t.id === templateId ? { ...t, isPremium: !t.isPremium } : t
    );
    storageService.saveTemplates(updated);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* En-tête de la console d'administration */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 p-6 rounded-3xl border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">Console d'Administration</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                  Admin Master
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bénéficiaire Moov Money : <strong>{MOOV_MONEY_BENEFICIARY.beneficiaryName}</strong> ({MOOV_MONEY_BENEFICIARY.formattedPhone})
              </p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
          >
            Retourner au site public
          </button>
        </div>

        {/* Message d'action de succès */}
        {actionMessage && (
          <div className="p-4 bg-emerald-900/60 border border-emerald-600 text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Navigation d'onglets */}
        <div className="flex flex-wrap gap-2 text-xs font-bold border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('manual_orders')}
            className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'manual_orders'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            <span>Paiements Manuels Moov Money</span>
            {metrics.pendingManualOrdersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 animate-pulse">
                {metrics.pendingManualOrdersCount} en attente
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'metrics' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Métriques & Chiffre d'Affaires
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'users' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Utilisateurs ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'plans' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Configuration Forfaits XOF
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'templates' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Gestion des 15 Modèles
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl transition-colors cursor-pointer ${
              activeTab === 'logs' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Journal d'Audit
          </button>
        </div>

        {/* 1. SECTION PRINCIPALE : PAIEMENTS MANUELS MOOV MONEY */}
        {activeTab === 'manual_orders' && (
          <div className="space-y-6">
            {/* Bannière de consigne impérative */}
            <div className="bg-blue-950/70 border-2 border-blue-600 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-extrabold text-white text-sm">
                    Consigne de Sécurité Financière : Compte Moov Money {MOOV_MONEY_BENEFICIARY.formattedPhone}
                  </div>
                  <p className="text-blue-200 leading-relaxed">
                    Avant de cliquer sur <strong>« Valider et Activer »</strong>, connectez-vous obligatoirement à votre compte Moov Money au <strong>0194537741 ({MOOV_MONEY_BENEFICIARY.beneficiaryName})</strong> pour constater la réception réelle du montant et la référence SMS. L'activation Premium est irréversible.
                  </p>
                </div>
              </div>
            </div>

            {/* Filtres & Recherche de commandes */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                <button
                  onClick={() => setOrderFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    orderFilter === 'all' ? 'bg-slate-700 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Toutes ({manualOrders.length})
                </button>
                <button
                  onClick={() => setOrderFilter('pending_verification')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    orderFilter === 'pending_verification'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-amber-400 hover:text-amber-300'
                  }`}
                >
                  À vérifier ({manualOrders.filter((o) => o.status === 'pending_verification').length})
                </button>
                <button
                  onClick={() => setOrderFilter('approved')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    orderFilter === 'approved' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Validées ({manualOrders.filter((o) => o.status === 'approved').length})
                </button>
                <button
                  onClick={() => setOrderFilter('rejected')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    orderFilter === 'rejected' ? 'bg-red-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Rejetées ({manualOrders.filter((o) => o.status === 'rejected').length})
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Réf commande, SMS, tél..."
                  value={searchOrder}
                  onChange={(e) => setSearchOrder(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            {/* Table des commandes manuelles */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Aucune commande manuelle ne correspond aux critères sélectionnés.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                      <tr>
                        <th className="p-3.5">Commande</th>
                        <th className="p-3.5">Client & Contact</th>
                        <th className="p-3.5">Offre & Montant</th>
                        <th className="p-3.5">Réf Transaction Moov</th>
                        <th className="p-3.5">Date déclaration</th>
                        <th className="p-3.5">Statut</th>
                        <th className="p-3.5 text-right">Actions de Contrôle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-750 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-white">
                            <div>{ord.orderNumber}</div>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {new Date(ord.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <div className="font-bold text-slate-200">{ord.userName}</div>
                            <div className="text-[11px] text-slate-400">{ord.userEmail}</div>
                            {ord.submission?.senderPhone && (
                              <div className="text-[11px] font-mono text-blue-300 mt-0.5">
                                Envoyé par : {ord.submission.senderPhone}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5">
                            <div className="font-semibold text-slate-200">{ord.planName}</div>
                            <div className="font-mono font-black text-emerald-400 text-sm">
                              {ord.amountXOF.toLocaleString('fr-FR')} FCFA
                            </div>
                          </td>

                          <td className="p-3.5">
                            {ord.submission?.transactionRef ? (
                              <div className="space-y-1">
                                <span className="font-mono font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-amber-500/40 inline-block text-[11px]">
                                  {ord.submission.transactionRef}
                                </span>
                                {ord.submission.proofUrl && (
                                  <div>
                                    <button
                                      onClick={() => setViewProofOrder(ord)}
                                      className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Voir capture SMS</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">
                                En attente de paiement
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-slate-300 text-[11px]">
                            {ord.submission?.submittedAt
                              ? new Date(ord.submission.submittedAt).toLocaleString('fr-FR')
                              : '—'}
                          </td>

                          <td className="p-3.5">
                            {ord.status === 'pending_payment' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                                En attente transfert
                              </span>
                            )}
                            {ord.status === 'pending_verification' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                                <Clock className="w-3 h-3" />
                                À VÉRIFIER
                              </span>
                            )}
                            {ord.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-600 px-2.5 py-0.5 rounded-full">
                                <Check className="w-3 h-3" />
                                Validé & Payé
                              </span>
                            )}
                            {ord.status === 'rejected' && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-900/80 text-red-300 border border-red-700 px-2.5 py-0.5 rounded-full">
                                  <X className="w-3 h-3" />
                                  Rejeté
                                </span>
                                {ord.decision?.rejectionReason && (
                                  <div className="text-[10px] text-red-400 line-clamp-1 max-w-xs">
                                    {ord.decision.rejectionReason}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {ord.status === 'pending_verification' ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setOrderToApprove(ord);
                                      setCheckAccount(false);
                                      setCheckAmount(false);
                                    }}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Valider</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOrderToReject(ord);
                                      setRejectionReason('');
                                    }}
                                    className="px-2.5 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Refuser</span>
                                  </button>
                                </>
                              ) : ord.status === 'approved' ? (
                                <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                                  Validé par {ord.decision?.adminEmail || 'Admin'}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-500 italic">
                                  Traité
                                </span>
                              )}
                            </div>
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

        {/* 2. MÉTRIQUES ET CHIFFRE D'AFFAIRES */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold block">Chiffre d'Affaires Encaissé</span>
                <span className="text-3xl font-black text-emerald-400 font-mono mt-1 block">
                  {metrics.totalRevenueXOF.toLocaleString('fr-FR')} FCFA
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Uniquement sur les commandes validées après contrôle
                </span>
              </div>

              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold block">Commandes en Attente</span>
                <span className="text-3xl font-black text-amber-400 font-mono mt-1 block">
                  {metrics.pendingManualOrdersCount}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Moov Money 0194537741</span>
              </div>

              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold block">Abonnements Actifs</span>
                <span className="text-3xl font-black text-white font-mono mt-1 block">
                  {metrics.activeSubscriptions}
                </span>
                <span className="text-[10px] text-emerald-400 mt-1 block">Utilisateurs Premium en cours</span>
              </div>

              <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold block">Comptes Inscrits</span>
                <span className="text-3xl font-black text-white font-mono mt-1 block">
                  {metrics.totalUsers}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Base candidats Bénin</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. UTILISATEURS */}
        {activeTab === 'users' && (
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">Comptes Utilisateurs</h3>
              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher nom ou email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Utilisateur</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Téléphone</th>
                    <th className="p-3">Rôle</th>
                    <th className="p-3">Forfait</th>
                    <th className="p-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="p-3 font-bold text-white">{u.firstName} {u.lastName}</td>
                      <td className="p-3 text-slate-300">{u.email}</td>
                      <td className="p-3 text-slate-400">{u.phoneNumber || 'N/A'}</td>
                      <td className="p-3 font-mono capitalize text-slate-300">{u.role}</td>
                      <td className="p-3 text-emerald-400 font-semibold">{u.subscription?.planCode || 'free'}</td>
                      <td className="p-3">
                        <span className="text-[10px] bg-slate-700 text-slate-200 px-2 py-0.5 rounded font-bold">
                          Actif
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Conformité APDP : Le contenu privé des CV n'est pas exposé aux administrateurs.
            </p>
          </div>
        )}

        {/* 4. CONFIGURATION DES FORFAITS */}
        {activeTab === 'plans' && (
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-6">
            <div>
              <h3 className="font-bold text-sm text-white">Tarifs des Forfaits (FCFA)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Ajustez les prix en FCFA demandés aux candidats lors du transfert Moov Money.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((pl) => (
                <div key={pl.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-700 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{pl.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">Code : {pl.code}</span>
                    </div>
                    <button
                      onClick={() => togglePlanActive(pl.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        pl.isActive ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {pl.isActive ? 'Actif' : 'Désactivé'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Prix officiel (FCFA) :</label>
                    <input
                      type="number"
                      value={pl.priceXOF}
                      onChange={(e) => updatePlanPrice(pl.id, Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Durée : {pl.durationDays} jours</span>
                    <span className="text-[11px] text-slate-400 block">Quota max CV : {pl.quotas.maxCVs}</span>
                    <span className="text-[11px] text-slate-400 block">
                      Sans filigrane : {pl.quotas.allowWatermarkRemoval ? 'Oui' : 'Non'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. GESTION DES MODÈLES */}
        {activeTab === 'templates' && (
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-sm text-white">Statut des 15 Modèles de CV</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{tpl.name}</span>
                    <span className="text-slate-400 text-[10px] capitalize">{tpl.category}</span>
                  </div>
                  <button
                    onClick={() => toggleTemplatePremium(tpl.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      tpl.isPremium ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {tpl.isPremium ? 'Premium' : 'Gratuit'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. JOURNAL D'AUDIT */}
        {activeTab === 'logs' && (
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-sm text-white">Journal d'Audit & Sécurité</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Acteur</th>
                    <th className="p-3">Action exécutée</th>
                    <th className="p-3">Ressource</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="p-3 text-slate-400">{new Date(log.createdAt).toLocaleString('fr-FR')}</td>
                      <td className="p-3 text-amber-400 font-semibold">{log.actorEmail}</td>
                      <td className="p-3 text-slate-200">{log.action}</td>
                      <td className="p-3 text-slate-400">{log.resourceType}:{log.resourceId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODALE DE VALIDATION D'UNE COMMANDE */}
      {orderToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border-2 border-emerald-500 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <FileCheck2 className="w-5 h-5" />
                <span>Validation Encaissement Moov Money</span>
              </div>
              <button
                onClick={() => setOrderToApprove(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Commande :</span>
                <span className="font-mono font-bold text-white">{orderToApprove.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Client :</span>
                <span className="font-bold text-white">{orderToApprove.userName} ({orderToApprove.userEmail})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Forfait demandé :</span>
                <span className="font-bold text-emerald-400">{orderToApprove.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Montant attendu :</span>
                <span className="font-mono font-black text-white text-sm">{orderToApprove.amountXOF} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Réf Moov déclarée :</span>
                <span className="font-mono font-extrabold text-amber-300">{orderToApprove.submission?.transactionRef || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Numéro expéditeur :</span>
                <span className="font-mono text-slate-200">{orderToApprove.submission?.senderPhone || 'N/A'}</span>
              </div>
            </div>

            {/* Checklist de confirmation administrative */}
            <div className="space-y-2 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkAccount}
                  onChange={(e) => setCheckAccount(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-500"
                />
                <span className="text-slate-200">
                  J'atteste avoir consulté le compte Moov Money <strong>0194537741 ({MOOV_MONEY_BENEFICIARY.beneficiaryName})</strong> et confirmé la réception des fonds.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkAmount}
                  onChange={(e) => setCheckAmount(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-500"
                />
                <span className="text-slate-200">
                  La référence <strong>{orderToApprove.submission?.transactionRef}</strong> et le montant de <strong>{orderToApprove.amountXOF} FCFA</strong> correspondent exactement.
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setOrderToApprove(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleApproveOrder}
                disabled={!checkAccount || !checkAmount}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmer l'encaissement et Activer Premium</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE REJET D'UNE COMMANDE */}
      {orderToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-red-500 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Refuser la déclaration de paiement</span>
              </div>
              <button
                onClick={() => setOrderToReject(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Indiquez le motif de refus pour la commande <strong>{orderToReject.orderNumber}</strong>. Le client pourra consulter ce motif sur son tableau de bord.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Motif de rejet *</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex : Référence introuvable sur le compte Moov Money au 0194537741. Veuillez vérifier votre SMS de transfert."
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white outline-hidden focus:border-red-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setOrderToReject(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleRejectOrder}
                disabled={!rejectionReason.trim()}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE D'APERÇU DU JUSTIFICATIF */}
      {viewProofOrder && viewProofOrder.submission?.proofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-700 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-xs">
                Justificatif SMS — {viewProofOrder.orderNumber} ({viewProofOrder.submission.transactionRef})
              </span>
              <button
                onClick={() => setViewProofOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-800 flex justify-center bg-black/50 p-2">
              <img
                src={viewProofOrder.submission.proofUrl}
                alt="Capture preuve"
                className="max-w-full max-h-[65vh] object-contain rounded-lg"
              />
            </div>

            <button
              onClick={() => setViewProofOrder(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
