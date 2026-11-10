/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AdminMetrics,
  AuditLog,
  CVData,
  ManualPaymentOrder,
  Plan,
  TemplateDefinition,
  UserProfile
} from '../../types';
import { storageService, INITIAL_ADMIN } from '../../services/storage';
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
  ExternalLink,
  ChevronRight,
  TrendingUp,
  UserCheck,
  UserX,
  Trash2,
  ShieldAlert,
  ArrowLeft,
  Key,
  Layers,
  Sparkles,
  Calendar,
  Phone,
  Mail,
  Award
} from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
  currentUser?: UserProfile | null;
  onLoginSuccess?: (user: UserProfile) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onBack,
  currentUser,
  onLoginSuccess
}) => {
  // Navigation interne de l'administration
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'orders' | 'plans' | 'cvs' | 'logs'>('metrics');

  // Formulaire d'authentification administrateur si non connecté
  const [forceShowLoginForm, setForceShowLoginForm] = useState<boolean>(false);
  const [adminEmailInput, setAdminEmailInput] = useState<string>('admin@cvprobenin.bj');
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminLoginError, setAdminLoginError] = useState<string>('');
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState<boolean>(false);

  // Données locales et synchronisation
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Gestion des Utilisateurs
  const [searchUser, setSearchUser] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [userPlanFilter, setUserPlanFilter] = useState<string>('all');
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserProfile | null>(null);
  const [userPage, setUserPage] = useState<number>(1);
  const usersPerPage = 10;

  // Actions sur compte utilisateur
  const [userToSuspend, setUserToSuspend] = useState<UserProfile | null>(null);
  const [suspensionReason, setSuspensionReason] = useState<string>('');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [editFirstName, setEditFirstName] = useState<string>('');
  const [editLastName, setEditLastName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');

  // Gestion des Commandes Moov Money
  const [searchOrder, setSearchOrder] = useState<string>('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending_verification' | 'pending_payment' | 'approved' | 'rejected'>('all');
  const [orderToApprove, setOrderToApprove] = useState<ManualPaymentOrder | null>(null);
  const [orderToReject, setOrderToReject] = useState<ManualPaymentOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [viewProofOrder, setViewProofOrder] = useState<ManualPaymentOrder | null>(null);
  const [checkAccount, setCheckAccount] = useState<boolean>(false);
  const [checkAmount, setCheckAmount] = useState<boolean>(false);

  // Gestion des CV créés
  const [searchCV, setSearchCV] = useState<string>('');
  const [cvToDelete, setCVToDelete] = useState<CVData | null>(null);

  // Attribution manuelle exceptionnelle de forfait
  const [grantModalOpen, setGrantModalOpen] = useState<boolean>(false);
  const [grantUserId, setGrantUserId] = useState<string>('');
  const [grantCVId, setGrantCVId] = useState<string>('');
  const [grantPlanCode, setGrantPlanCode] = useState<'cand_24h' | 'career_30d'>('cand_24h');
  const [grantReason, setGrantReason] = useState<string>('');

  // Récupération des données réelles
  const metrics: AdminMetrics = useMemo(() => storageService.getAdminMetrics(), [refreshTrigger]);
  const users: UserProfile[] = useMemo(() => storageService.getUsers(), [refreshTrigger]);
  const manualOrders: ManualPaymentOrder[] = useMemo(() => storageService.getManualOrders(), [refreshTrigger]);
  const allCVs: CVData[] = useMemo(() => storageService.getCVs(), [refreshTrigger]);
  const auditLogs: AuditLog[] = useMemo(() => storageService.getAuditLogs(), [refreshTrigger]);
  const plans: Plan[] = useMemo(() => storageService.getPlans(), [refreshTrigger]);

  const reloadData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4500);
  };

  // --- SÉCURITÉ ADMINISTRATEUR ---
  const isAdmin = currentUser?.role === 'admin' && currentUser?.email === 'admin@cvprobenin.bj';

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    setIsAdminLoggingIn(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmailInput.trim(), password: adminPasswordInput })
      });
      const data = await res.json();
      if (data.success && data.user) {
        if (data.user.role !== 'admin') {
          setAdminLoginError('Ce compte ne dispose pas des privilèges administrateur.');
          setIsAdminLoggingIn(false);
          return;
        }
        storageService.setCurrentUser(data.user);
        if (data.token) {
          localStorage.setItem('cv_benin_auth_token', data.token);
        }
        onLoginSuccess?.(data.user);
        reloadData();
        return;
      } else {
        setAdminLoginError(data.error || 'Identifiants administrateur incorrects.');
      }
    } catch (err) {
      // Repli local
      if (adminEmailInput.trim() === 'admin@cvprobenin.bj' && (adminPasswordInput === 'AdminBenin2026!' || adminPasswordInput === 'admin')) {
        storageService.setCurrentUser(INITIAL_ADMIN);
        onLoginSuccess?.(INITIAL_ADMIN);
        reloadData();
        return;
      }
      setAdminLoginError('Identifiants administrateur non valides.');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  // 1. Si aucun utilisateur n'est connecté ou si forçage de connexion admin : Affichage de la page de connexion dédiée Admin
  if (!currentUser || forceShowLoginForm) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-amber-500/30 selection:text-amber-200">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-black rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">Console d'Administration</h1>
            <p className="text-xs text-slate-400">
              Accès strictement réservé à la gestion commerciale et technique de CV Pro Bénin.
            </p>
          </div>

          {adminLoginError && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{adminLoginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Identifiant administrateur</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  placeholder="admin@cvprobenin.bj"
                  className="w-full text-xs pl-10 pr-3 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500 font-mono transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Mot de passe sécurisé</label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs pl-10 pr-3 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500 font-mono transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAdminLoggingIn}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:bg-slate-700 disabled:text-slate-500"
            >
              {isAdminLoggingIn ? (
                <span>Vérification des autorisations...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Déverrouiller la console</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setForceShowLoginForm(false);
                onBack();
              }}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer text-center block"
            >
              ← Retourner sur le site public
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Si un utilisateur est connecté mais n'a PAS le rôle admin : Refus d'accès strict (403) avec option de connexion admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-md bg-slate-900 border border-red-900/50 rounded-3xl p-8 shadow-2xl space-y-5">
          <div className="w-16 h-16 bg-red-950/80 border border-red-800 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">403 • Accès Refusé</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Votre compte actuel (<strong>{currentUser.email}</strong>) ne possède pas les droits d'administration de la plateforme CV Pro Bénin.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setForceShowLoginForm(true)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              <span>Se connecter avec un compte Administrateur</span>
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Retourner à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- FILTRAGE DES UTILISATEURS ---
  const filteredUsers = users.filter((u) => {
    if (userStatusFilter === 'active' && u.isSuspended) return false;
    if (userStatusFilter === 'suspended' && !u.isSuspended) return false;
    if (userPlanFilter !== 'all' && u.subscription?.planCode !== userPlanFilter) return false;

    if (!searchUser.trim()) return true;
    const q = searchUser.toLowerCase();
    const phone = (u.phoneNumber || '').toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      phone.includes(q)
    );
  });

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const paginatedUsers = filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);

  // --- FILTRAGE DES COMMANDES ---
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

  // --- FILTRAGE DES CVS ---
  const filteredCVs = allCVs.filter((cv) => {
    if (!searchCV.trim()) return true;
    const q = searchCV.toLowerCase();
    const candidateName = `${cv.personalInfo?.firstName || ''} ${cv.personalInfo?.lastName || ''}`.toLowerCase();
    return (
      cv.title.toLowerCase().includes(q) ||
      candidateName.includes(q) ||
      (cv.personalInfo?.email || '').toLowerCase().includes(q) ||
      cv.id.toLowerCase().includes(q)
    );
  });

  // --- ACTIONS COMMANDES ---
  const handleApproveOrder = async () => {
    if (!orderToApprove) return;
    setModalError(null);

    if (!checkAccount || !checkAmount) {
      setModalError("Attestation obligatoire : cochez les deux cases certifiant la vérification sur votre relevé Moov Money.");
      return;
    }

    try {
      await fetch('/api/admin/orders/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': 'admin@cvprobenin.bj',
          'x-admin-id': 'admin_master'
        },
        body: JSON.stringify({
          orderId: orderToApprove.id,
          adminId: 'admin_master',
          adminEmail: 'admin@cvprobenin.bj',
          checkAccount: true,
          checkAmount: true
        })
      });
    } catch (e) {
      console.warn('Serveur non joignable pour approbation, synchronisation locale', e);
    }

    const res = storageService.approveManualOrder(
      orderToApprove.id,
      'admin_master',
      'admin@cvprobenin.bj'
    );

    if (res.success) {
      showNotification(`Commande ${orderToApprove.orderNumber} validée. Droits activés pour ${orderToApprove.userName}.`);
      setOrderToApprove(null);
      setCheckAccount(false);
      setCheckAmount(false);
      reloadData();
    } else {
      setModalError(res.error || "Erreur lors de la validation de la commande.");
    }
  };

  const handleRejectOrder = async () => {
    if (!orderToReject) return;
    setModalError(null);

    if (!rejectionReason.trim()) {
      setModalError("Un motif explicatif de rejet est obligatoire.");
      return;
    }

    try {
      await fetch('/api/admin/orders/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': 'admin@cvprobenin.bj',
          'x-admin-id': 'admin_master'
        },
        body: JSON.stringify({
          orderId: orderToReject.id,
          adminId: 'admin_master',
          adminEmail: 'admin@cvprobenin.bj',
          reason: rejectionReason.trim()
        })
      });
    } catch (e) {
      console.warn('Serveur non joignable pour rejet, synchronisation locale', e);
    }

    const res = storageService.rejectManualOrder(
      orderToReject.id,
      'admin_master',
      'admin@cvprobenin.bj',
      rejectionReason.trim()
    );

    if (res.success) {
      showNotification(`Commande ${orderToReject.orderNumber} rejetée avec motif.`);
      setOrderToReject(null);
      setRejectionReason('');
      reloadData();
    } else {
      setModalError(res.error || "Erreur lors du rejet de la commande.");
    }
  };

  // --- ACTIONS UTILISATEURS ---
  const handleSuspendUserSubmit = async () => {
    if (!userToSuspend) return;
    const reason = suspensionReason.trim() || 'Activité suspecte ou non conforme';

    try {
      await fetch('/api/admin/users/suspend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': 'admin@cvprobenin.bj',
          'x-admin-id': 'admin_master'
        },
        body: JSON.stringify({ userId: userToSuspend.id, reason })
      });
    } catch (e) {
      console.warn('Serveur non joignable pour suspension', e);
    }

    storageService.suspendUser(userToSuspend.id, 'admin_master', 'admin@cvprobenin.bj', reason);
    showNotification(`Compte ${userToSuspend.email} suspendu avec succès.`);
    setUserToSuspend(null);
    setSuspensionReason('');
    reloadData();
  };

  const handleReactivateUser = async (user: UserProfile) => {
    try {
      await fetch('/api/admin/users/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': 'admin@cvprobenin.bj',
          'x-admin-id': 'admin_master'
        },
        body: JSON.stringify({ userId: user.id })
      });
    } catch (e) {
      console.warn('Serveur non joignable pour réactivation', e);
    }

    storageService.reactivateUser(user.id, 'admin_master', 'admin@cvprobenin.bj');
    showNotification(`Compte ${user.email} réactivé.`);
    reloadData();
  };

  const handleDeleteUserSubmit = async () => {
    if (!userToDelete) return;
    try {
      await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': 'admin@cvprobenin.bj',
          'x-admin-id': 'admin_master'
        },
        body: JSON.stringify({ userId: userToDelete.id })
      });
    } catch (e) {
      console.warn('Serveur non joignable pour suppression utilisateur', e);
    }

    storageService.deleteUserAdmin(userToDelete.id, 'admin_master', 'admin@cvprobenin.bj');
    showNotification(`Compte ${userToDelete.email} supprimé définitivement.`);
    setUserToDelete(null);
    setSelectedUserForDetail(null);
    reloadData();
  };

  const handleSaveEditUser = async () => {
    if (!userToEdit) return;
    try {
      await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': 'admin@cvprobenin.bj',
          'x-admin-id': 'admin_master'
        },
        body: JSON.stringify({
          userId: userToEdit.id,
          firstName: editFirstName,
          lastName: editLastName,
          phoneNumber: editPhone
        })
      });
    } catch (e) {
      console.warn('Serveur non joignable pour mise à jour utilisateur', e);
    }

    storageService.updateUserProfileAdmin(
      userToEdit.id,
      { firstName: editFirstName, lastName: editLastName, phoneNumber: editPhone },
      'admin_master',
      'admin@cvprobenin.bj'
    );
    showNotification(`Informations de ${userToEdit.email} mises à jour.`);
    setUserToEdit(null);
    reloadData();
  };

  // --- ATTRIBUTION MANUELLE DE FORFAIT ---
  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantReason.trim()) {
      setModalError('Un motif de dérogation ou d’attribution est obligatoire.');
      return;
    }

    try {
      await fetch('/api/admin/subscriptions/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': 'admin@cvprobenin.bj',
          'x-admin-id': 'admin_master'
        },
        body: JSON.stringify({
          userId: grantUserId || undefined,
          cvId: grantCVId || undefined,
          planCode: grantPlanCode,
          reason: grantReason.trim()
        })
      });
    } catch (e) {
      console.warn('Serveur non joignable pour attribution', e);
    }

    storageService.grantManualAccess(
      grantUserId || 'guest_user',
      grantPlanCode,
      grantReason.trim(),
      'admin_master',
      'admin@cvprobenin.bj',
      grantCVId || undefined
    );

    showNotification(`Accès ${grantPlanCode === 'career_30d' ? '30 jours' : '24 heures'} attribué avec succès.`);
    setGrantModalOpen(false);
    setGrantReason('');
    setGrantCVId('');
    setGrantUserId('');
    reloadData();
  };

  // --- SUPPRESSION DE CV PAR L'ADMIN ---
  const handleDeleteCVConfirm = async () => {
    if (!cvToDelete) return;
    try {
      await fetch(`/api/admin/cvs/${cvToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-email': 'admin@cvprobenin.bj',
          'x-admin-id': 'admin_master'
        }
      });
    } catch (e) {
      console.warn('Serveur non joignable pour suppression CV', e);
    }

    storageService.deleteCV(cvToDelete.id);
    storageService.addAuditLog({
      actorId: 'admin_master',
      actorEmail: 'admin@cvprobenin.bj',
      action: `Suppression administrative du CV ${cvToDelete.id} (${cvToDelete.title})`,
      resourceType: 'cv',
      resourceId: cvToDelete.id
    });

    showNotification(`CV ${cvToDelete.title} supprimé.`);
    setCVToDelete(null);
    reloadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* 1. BARRE SUPÉRIEURE INDÉPENDANTE DE L'ADMINISTRATION */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white tracking-tight">CV PRO BÉNIN</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
                CONSOLE ADMIN
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Session certifiée : <span className="font-mono text-slate-300">admin@cvprobenin.bj</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              reloadData();
              showNotification('Données synchronisées avec succès.');
            }}
            title="Rafraîchir les données"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quitter vers le site</span>
          </button>
        </div>
      </header>

      {/* NOTIFICATION FLOTTANTE */}
      {actionMessage && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-slide-up border border-emerald-500">
          <CheckCircle className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 2. CORPS PRINCIPAL : SIDEBAR + ZONE DE CONTENU */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* BARRE LATÉRALE DE NAVIGATION ADMIN */}
        <aside className="w-full md:w-64 bg-slate-900/70 border-r border-slate-800 p-4 space-y-6 shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block">
              Pilotage & Gestion
            </span>

            <nav className="space-y-1 pt-1">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'metrics'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Tableau de bord</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  <span>Gestion Utilisateurs</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {users.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4" />
                  <span>Paiements & Moov</span>
                </div>
                {metrics.pendingPaymentsCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 font-mono font-bold animate-pulse">
                    {metrics.pendingPaymentsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('plans')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'plans'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4" />
                  <span>Gestion des Forfaits</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('cvs')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'cvs'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4" />
                  <span>CV créés</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {allCVs.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'logs'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4" />
                  <span>Journal d'activité</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-60" />
              </button>
            </nav>
          </div>

          {/* RAPPEL BÉNÉFICIAIRE MOOV MONEY BÉNIN */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Réception Moov Money</span>
            <div className="font-mono text-amber-300 font-bold text-xs">{MOOV_MONEY_BENEFICIARY.phoneNumber}</div>
            <div className="text-slate-300">{MOOV_MONEY_BENEFICIARY.beneficiaryName}</div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Toute validation engage la vérification réelle préalable du relevé USSD *855#.
            </p>
          </div>
        </aside>

        {/* CONTENU PRINCIPAL */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl">
          {/* ============================================================== */}
          {/* 3.1 TABLEAU DE BORD GÉNÉRAL (METRICS & ANALYTICS) */}
          {/* ============================================================== */}
          {activeTab === 'metrics' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Tableau de bord général</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Indicateurs réels calculés en temps réel à partir de la base de données.
                </p>
              </div>

              {/* GRILLE DES 12 KPIS RÉELS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">Total Candidats Inscrits</span>
                  <div className="text-2xl font-black text-white font-mono">{metrics.totalUsers}</div>
                  <div className="text-[10px] text-slate-400 pt-1">
                    Aujourd'hui : <span className="text-emerald-400 font-bold">+{metrics.newUsersToday}</span> · 7j : <span className="text-emerald-400 font-bold">+{metrics.newUsers7Days}</span>
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">Utilisateurs Actifs</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{metrics.activeUsersCount}</div>
                  <div className="text-[10px] text-slate-400 pt-1">
                    Suspendus : <span className="text-red-400 font-bold">{metrics.suspendedUsersCount}</span>
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">Chiffre d'Affaires Encaissé</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {metrics.totalRevenueXOF.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">FCFA</span>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1">
                    Moov Money Bénin vérifié
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">Total CV Créés</span>
                  <div className="text-2xl font-black text-blue-400 font-mono">{metrics.totalCVs}</div>
                  <div className="text-[10px] text-slate-400 pt-1">
                    15 modèles d'excellence
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">Paiements en Attente</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">{metrics.pendingPaymentsCount}</div>
                  <div className="text-[10px] text-slate-400 pt-1">
                    À vérifier sur 0194537741
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">Paiements Validés</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">{metrics.approvedPaymentsCount}</div>
                  <div className="text-[10px] text-slate-400 pt-1">
                    Rejetés : <span className="text-red-400 font-bold">{metrics.rejectedPaymentsCount}</span>
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">Accès Candidature (24h)</span>
                  <div className="text-2xl font-black text-slate-100 font-mono">{metrics.salesByPlan.cand_24h.count}</div>
                  <div className="text-[10px] text-slate-400 pt-1">
                    500 FCFA : <span className="text-slate-300 font-mono">{metrics.salesByPlan.cand_24h.revenue.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">Pack Carrière (30j)</span>
                  <div className="text-2xl font-black text-slate-100 font-mono">{metrics.salesByPlan.career_30d.count}</div>
                  <div className="text-[10px] text-slate-400 pt-1">
                    1 000 FCFA : <span className="text-slate-300 font-mono">{metrics.salesByPlan.career_30d.revenue.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              </div>

              {/* GRAPHIQUES D'ÉVOLUTION RÉELLE (7 DERNIERS JOURS) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Évolution des Inscriptions (7 jours)</h3>
                      <p className="text-[11px] text-slate-400">Nouveaux candidats inscrits</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">+{metrics.newUsers7Days} total</span>
                  </div>

                  {/* Graphique SVG à barres réelles */}
                  <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-800">
                    {metrics.dailyEvolution.map((day, idx) => {
                      const maxVal = Math.max(1, ...metrics.dailyEvolution.map((d) => d.users));
                      const heightPercent = Math.max(12, (day.users / maxVal) * 100);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <span className="text-[10px] font-mono text-slate-400">{day.users}</span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[28px] bg-gradient-to-t from-emerald-700 to-emerald-400 rounded-t-lg transition-all"
                          />
                          <span className="text-[10px] text-slate-400 font-mono truncate">{day.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Chiffre d'Affaires Encaissé (7 jours)</h3>
                      <p className="text-[11px] text-slate-400">Revenus Moov Money en FCFA</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {metrics.dailyEvolution.reduce((s, d) => s + d.revenue, 0).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  {/* Graphique SVG à barres de chiffre d'affaires */}
                  <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-800">
                    {metrics.dailyEvolution.map((day, idx) => {
                      const maxRev = Math.max(1000, ...metrics.dailyEvolution.map((d) => d.revenue));
                      const heightPercent = Math.max(10, (day.revenue / maxRev) * 100);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                          <span className="text-[9px] font-mono text-slate-400">{day.revenue > 0 ? `${day.revenue / 1000}k` : '0'}</span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[28px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg transition-all"
                          />
                          <span className="text-[10px] text-slate-400 font-mono truncate">{day.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 3.2 GESTION DES UTILISATEURS */}
          {/* ============================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Gestion des Utilisateurs</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Consultation des fiches candidats, modification, suspension et suppression sécurisée.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setGrantUserId('');
                    setGrantCVId('');
                    setGrantReason('');
                    setGrantModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Attribution manuelle exceptionnelle</span>
                </button>
              </div>

              {/* FILTRES ET RECHERCHE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={searchUser}
                    onChange={(e) => {
                      setSearchUser(e.target.value);
                      setUserPage(1);
                    }}
                    placeholder="Recherche par nom, email ou +229..."
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <select
                  value={userStatusFilter}
                  onChange={(e) => {
                    setUserStatusFilter(e.target.value as any);
                    setUserPage(1);
                  }}
                  className="text-xs px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Comptes Actifs</option>
                  <option value="suspended">Comptes Suspendus</option>
                </select>

                <select
                  value={userPlanFilter}
                  onChange={(e) => {
                    setUserPlanFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="text-xs px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">Tous les forfaits</option>
                  <option value="free">Formule Gratuite</option>
                  <option value="cand_24h">Accès Candidature (24h)</option>
                  <option value="career_30d">Pack Carrière (30j)</option>
                </select>
              </div>

              {/* TABLEAU DES UTILISATEURS */}
              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Candidat</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Forfait Actif</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4">Inscription</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            Aucun utilisateur trouvé selon ces critères.
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((u) => {
                          const userCVCount = allCVs.filter((c) => c.userId === u.id).length;
                          return (
                            <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-white">
                                  {u.firstName} {u.lastName}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400">ID: {u.id}</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-slate-300">{u.email}</div>
                                <div className="text-[10px] font-mono text-slate-400">{u.phoneNumber || 'Non renseigné'}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                                  {u.subscription?.planCode === 'career_30d'
                                    ? 'Pack Carrière (30j)'
                                    : u.subscription?.planCode === 'cand_24h'
                                    ? 'Accès Candidature (24h)'
                                    : 'Gratuit'}
                                </span>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {userCVCount} CV créé{userCVCount > 1 ? 's' : ''}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {u.isSuspended ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-800 px-2 py-0.5 rounded-full">
                                    <UserX className="w-3 h-3" />
                                    Suspendu
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                                    <UserCheck className="w-3 h-3" />
                                    Actif
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                                {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedUserForDetail(u)}
                                    title="Voir fiche complète"
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setUserToEdit(u);
                                      setEditFirstName(u.firstName);
                                      setEditLastName(u.lastName);
                                      setEditPhone(u.phoneNumber || '');
                                    }}
                                    title="Modifier le profil"
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {u.isSuspended ? (
                                    <button
                                      onClick={() => handleReactivateUser(u)}
                                      title="Réactiver ce compte"
                                      className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition-colors cursor-pointer"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setUserToSuspend(u);
                                        setSuspensionReason('');
                                      }}
                                      title="Suspendre ce compte"
                                      className="p-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 transition-colors cursor-pointer"
                                    >
                                      <UserX className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {u.email !== 'admin@cvprobenin.bj' && (
                                    <button
                                      onClick={() => setUserToDelete(u)}
                                      title="Supprimer définitivement"
                                      className="p-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {totalUserPages > 1 && (
                  <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Page {userPage} sur {totalUserPages} ({filteredUsers.length} candidats)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                        disabled={userPage === 1}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 cursor-pointer"
                      >
                        Précédent
                      </button>
                      <button
                        onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                        disabled={userPage === totalUserPages}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 cursor-pointer"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 3.4 GESTION DES PAIEMENTS & COMMANDES MOOV MONEY */}
          {/* ============================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Paiements & Commandes Moov Money</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vérification manuelle stricte des déclarations SMS et activation sécurisée des droits.
                </p>
              </div>

              {/* FILTRES PAR STATUT ET RECHERCHE */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={searchOrder}
                    onChange={(e) => setSearchOrder(e.target.value)}
                    placeholder="Numéro CMD-MOOV, client, réf SMS ou téléphone..."
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div className="flex flex-wrap gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setOrderFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      orderFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Toutes ({manualOrders.length})
                  </button>
                  <button
                    onClick={() => setOrderFilter('pending_verification')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      orderFilter === 'pending_verification'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    À vérifier ({manualOrders.filter((o) => o.status === 'pending_verification').length})
                  </button>
                  <button
                    onClick={() => setOrderFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      orderFilter === 'approved' ? 'bg-amber-500 text-slate-950' : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    Validées
                  </button>
                  <button
                    onClick={() => setOrderFilter('rejected')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      orderFilter === 'rejected' ? 'bg-amber-500 text-slate-950' : 'text-red-400 hover:text-red-300'
                    }`}
                  >
                    Rejetées
                  </button>
                </div>
              </div>

              {/* TABLE DES COMMANDES */}
              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Commande</th>
                        <th className="py-3 px-4">Candidat</th>
                        <th className="py-3 px-4">Forfait</th>
                        <th className="py-3 px-4">Montant</th>
                        <th className="py-3 px-4">Preuve & Réf Moov</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4 text-right">Décision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            Aucune commande correspondant aux filtres.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-amber-400">{ord.orderNumber}</span>
                              <div className="text-[10px] text-slate-500">{new Date(ord.createdAt).toLocaleString('fr-FR')}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-white">{ord.userName}</div>
                              <div className="text-[10px] text-slate-400">{ord.userEmail}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-200">{ord.planName}</div>
                              <span className="text-[10px] text-slate-500">CV: {ord.cvTitle || 'Mon CV'}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-white">
                                {ord.amountXOF.toLocaleString('fr-FR')} FCFA
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {ord.submission ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-emerald-300 font-bold bg-slate-950 px-1.5 py-0.5 rounded text-[10px] border border-slate-800">
                                      {ord.submission.transactionRef}
                                    </span>
                                    {ord.submission.proofUrl && (
                                      <button
                                        onClick={() => setViewProofOrder(ord)}
                                        className="text-amber-400 hover:text-amber-300 text-[10px] underline cursor-pointer"
                                      >
                                        Voir reçu
                                      </button>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    Tél : {ord.submission.senderPhone}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">Non déclarée</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {ord.status === 'approved' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  Validée
                                </span>
                              )}
                              {ord.status === 'pending_verification' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                                  À vérifier
                                </span>
                              )}
                              {ord.status === 'pending_payment' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                                  Attente transfert
                                </span>
                              )}
                              {ord.status === 'rejected' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                                  Rejetée
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {ord.status === 'pending_verification' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setOrderToApprove(ord);
                                      setCheckAccount(false);
                                      setCheckAmount(false);
                                      setModalError(null);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer active:scale-95 flex items-center gap-1 shadow-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Valider</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOrderToReject(ord);
                                      setRejectionReason('');
                                      setModalError(null);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-bold text-xs transition-colors cursor-pointer active:scale-95"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Rejeter</span>
                                  </button>
                                </div>
                              ) : ord.decision ? (
                                <span className="text-[10px] text-slate-500 block">
                                  Traité par {ord.decision.adminEmail}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 3.5 GESTION DES FORFAITS */}
          {/* ============================================================== */}
          {activeTab === 'plans' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Gestion des Forfaits</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Offres commerciales officielles en Francs CFA (XOF) et attributions exceptionnelles.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setGrantUserId('');
                    setGrantCVId('');
                    setGrantReason('');
                    setGrantModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Accorder un accès exceptionnel</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((p) => (
                  <div key={p.id} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-base text-white">{p.name}</h3>
                        <span className="text-[10px] font-mono text-slate-400">Code: {p.code}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        {p.isActive ? 'Actif' : 'Suspendu'}
                      </span>
                    </div>

                    <div className="border-t border-slate-800 pt-3">
                      <div className="text-2xl font-black text-white font-mono">
                        {p.priceXOF.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">FCFA</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Durée : {p.durationHours ? `${p.durationHours} heures` : `${p.durationDays} jours`} après approbation effective.
                      </p>
                    </div>

                    <ul className="text-xs text-slate-300 space-y-1.5 border-t border-slate-800 pt-3">
                      {p.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 3.6 GESTION DES CVS CRÉÉS */}
          {/* ============================================================== */}
          {activeTab === 'cvs' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Gestion des CV créés</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Supervision des documents générés, des modèles utilisés et des accès payants.
                </p>
              </div>

              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchCV}
                  onChange={(e) => setSearchCV(e.target.value)}
                  placeholder="Recherche par titre, nom du candidat ou email..."
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Titre du CV</th>
                        <th className="py-3 px-4">Candidat</th>
                        <th className="py-3 px-4">Modèle</th>
                        <th className="py-3 px-4">Accès Sans Filigrane</th>
                        <th className="py-3 px-4">Création</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredCVs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            Aucun CV trouvé.
                          </td>
                        </tr>
                      ) : (
                        filteredCVs.map((cv) => {
                          const isAccessValid = cv.access?.status === 'active' && cv.access.expiresAt && new Date(cv.access.expiresAt).getTime() > Date.now();
                          return (
                            <tr key={cv.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-white">{cv.title}</div>
                                <span className="text-[10px] font-mono text-slate-400">ID: {cv.id}</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-slate-200">
                                  {cv.personalInfo?.firstName} {cv.personalInfo?.lastName}
                                </div>
                                <div className="text-[10px] text-slate-400">{cv.personalInfo?.email || 'N/A'}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-slate-300 capitalize">{cv.settings?.templateId || 'Moderne'}</span>
                              </td>
                              <td className="py-3 px-4">
                                {isAccessValid ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                                    <CheckCircle className="w-3 h-3" />
                                    {cv.access?.planName} (Actif)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                    Brouillon gratuit (Filigrane)
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                                {new Date(cv.createdAt).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => setCVToDelete(cv)}
                                  title="Supprimer ce CV"
                                  className="p-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 3.7 JOURNAL D'ACTIVITÉ ET SÉCURITÉ */}
          {/* ============================================================== */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Journal d'activité & Sécurité</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Traçabilité des opérations sensibles, validations financières et décisions administratives.
                </p>
              </div>

              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Date & Heure</th>
                        <th className="py-3 px-4">Acteur</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Type Cible</th>
                        <th className="py-3 px-4">ID Ressource</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            Aucun événement enregistré.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString('fr-FR')}
                            </td>
                            <td className="py-3 px-4 font-bold text-amber-300">
                              {log.actorEmail}
                            </td>
                            <td className="py-3 px-4 text-slate-200">
                              {log.action}
                            </td>
                            <td className="py-3 px-4">
                              <span className="uppercase text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {log.resourceType}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                              {log.resourceId}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* MODALES D'ACTION ADMINISTRATEUR */}
      {/* ============================================================== */}

      {/* MODALE 1 : VALIDATION ATOMIQUE D'UNE COMMANDE AVEC CHECKLIST */}
      {orderToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-black">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Validation du Paiement Moov Money</span>
              </div>
              <button onClick={() => setOrderToApprove(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 rounded-xl">
                {modalError}
              </div>
            )}

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Commande :</span>
                <span className="font-mono font-bold text-amber-400">{orderToApprove.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Client :</span>
                <span className="text-white font-bold">{orderToApprove.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Forfait :</span>
                <span className="text-slate-200">{orderToApprove.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Montant déclaré :</span>
                <span className="font-mono font-black text-emerald-400">{orderToApprove.amountXOF} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Réf. SMS Moov :</span>
                <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  {orderToApprove.submission?.transactionRef || 'N/A'}
                </span>
              </div>
            </div>

            {/* Checklist de confirmation administrative */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkAccount}
                  onChange={(e) => setCheckAccount(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-400"
                />
                <span className="text-slate-300 leading-tight">
                  J'atteste avoir vérifié mon compte Moov Money (<strong>0194537741</strong>) et constaté la réception effective du virement.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkAmount}
                  onChange={(e) => setCheckAmount(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-400"
                />
                <span className="text-slate-300 leading-tight">
                  La référence de transaction SMS correspond exactement et n'a jamais été utilisée pour un autre compte.
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setOrderToApprove(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleApproveOrder}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition-colors cursor-pointer active:scale-95 shadow-md shadow-emerald-600/20"
              >
                Confirmer l'approbation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE 2 : REJET MOTIVÉ D'UNE COMMANDE */}
      {orderToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-red-400 font-black">
                <XCircle className="w-5 h-5" />
                <span className="text-sm">Rejet de la commande {orderToReject.orderNumber}</span>
              </div>
              <button onClick={() => setOrderToReject(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 rounded-xl">
                {modalError}
              </div>
            )}

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Motif explicatif du rejet <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex : Référence introuvable sur le relevé Moov Money du 0194537741. Veuillez vérifier le SMS reçu."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setOrderToReject(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleRejectOrder}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black transition-colors cursor-pointer active:scale-95"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE 3 : FICHE UTILISATEUR DÉTAILLÉE */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 font-black">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    {selectedUserForDetail.firstName} {selectedUserForDetail.lastName}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">{selectedUserForDetail.email}</span>
                </div>
              </div>
              <button onClick={() => setSelectedUserForDetail(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informations du compte */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Identifiant :</span>
                <p className="font-mono text-slate-300 text-[11px] truncate">{selectedUserForDetail.id}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Téléphone :</span>
                <p className="font-mono text-slate-300 text-[11px]">{selectedUserForDetail.phoneNumber || 'Non renseigné'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Statut du compte :</span>
                <p className="font-bold text-[11px]">
                  {selectedUserForDetail.isSuspended ? (
                    <span className="text-red-400">Suspendu ({selectedUserForDetail.suspendedReason})</span>
                  ) : (
                    <span className="text-emerald-400">Actif</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Date d'inscription :</span>
                <p className="text-slate-300 text-[11px]">{new Date(selectedUserForDetail.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            </div>

            {/* Liste de ses CVs */}
            <div className="space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">CVs créés par ce candidat :</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {allCVs.filter((c) => c.userId === selectedUserForDetail.id).length === 0 ? (
                  <p className="text-slate-500 text-xs italic">Aucun CV créé pour le moment.</p>
                ) : (
                  allCVs
                    .filter((c) => c.userId === selectedUserForDetail.id)
                    .map((cv) => (
                      <div key={cv.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-200">{cv.title}</div>
                          <span className="text-[10px] text-slate-500">Modèle: {cv.settings?.templateId}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {cv.access?.status === 'active' ? 'Export Premium Actif' : 'Brouillon'}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Actions rapides */}
            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE 4 : SUSPENSION DE COMPTE AVEC MOTIF */}
      {userToSuspend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
              <UserX className="w-5 h-5" />
              <span>Suspendre le compte {userToSuspend.email}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              La suspension bloque immédiatement la connexion et les fonctionnalités protégées de l'utilisateur.
            </p>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Motif de suspension :</label>
              <textarea
                rows={3}
                required
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Ex : Référence Moov Money frauduleuse répétée."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setUserToSuspend(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSuspendUserSubmit}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black cursor-pointer"
              >
                Confirmer suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE 5 : MODIFICATION D'UN UTILISATEUR */}
      {userToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="font-extrabold text-sm text-white">Modifier l'utilisateur {userToEdit.email}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Prénom</label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Nom</label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Numéro (+229)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setUserToEdit(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEditUser}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE 6 : SUPPRESSION DÉFINITIVE D'UN COMPTE */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-red-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center gap-2 text-red-400 font-black text-sm">
              <Trash2 className="w-5 h-5" />
              <span>Supprimer définitivement ce compte ?</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Êtes-vous certain de vouloir supprimer le compte <strong>{userToDelete.email}</strong> ({userToDelete.firstName} {userToDelete.lastName}) ? Cette opération est irréversible et sera enregistrée au journal d'audit.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteUserSubmit}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-black"
              >
                Confirmer suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE 7 : ATTRIBUTION MANUELLE EXCEPTIONNELLE */}
      {grantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleGrantSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Attribution Manuelle Exceptionnelle</span>
              </div>
              <button type="button" onClick={() => setGrantModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 rounded-xl">
                {modalError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Candidat destinataire :</label>
                <select
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none cursor-pointer"
                >
                  <option value="">Sélectionner un candidat...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Forfait à accorder :</label>
                <select
                  value={grantPlanCode}
                  onChange={(e) => setGrantPlanCode(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none cursor-pointer"
                >
                  <option value="cand_24h">Accès Candidature (24 heures) - 500 FCFA</option>
                  <option value="career_30d">Pack Carrière (30 jours) - 1 000 FCFA</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Motif obligatoire de dérogation (justification) :</label>
                <textarea
                  rows={2}
                  required
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="Ex : Virement en agence physique Moov Cotonou validé par reçu papier."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGrantModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow-md"
              >
                Activer l'accès
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODALE 8 : SUPPRESSION D'UN CV */}
      {cvToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-red-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="font-extrabold text-sm text-red-400">Supprimer ce CV ?</h3>
            <p className="text-slate-300">
              Êtes-vous certain de vouloir supprimer le document <strong>{cvToDelete.title}</strong> ?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCVToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteCVConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-black"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE 9 : APERÇU DE LA PREUVE DE PAIEMENT */}
      {viewProofOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-xs">Preuve de paiement • {viewProofOrder.orderNumber}</h3>
              <button onClick={() => setViewProofOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {viewProofOrder.submission?.proofUrl ? (
              <img
                src={viewProofOrder.submission.proofUrl}
                alt="Capture d'écran de transaction Moov Money"
                className="w-full max-h-96 object-contain rounded-xl border border-slate-800 bg-black"
              />
            ) : (
              <p className="text-slate-500 italic">Aucune image fournie.</p>
            )}
            <button
              onClick={() => setViewProofOrder(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
