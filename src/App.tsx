/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CVData, getCVPermissions, Plan, UserProfile } from './types';
import { storageService, INITIAL_DEMO_CV } from './services/storage';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LegalModal, LegalTopic } from './components/common/LegalModal';
import { AuthModal } from './components/common/AuthModal';
import { PaymentModal } from './components/payment/PaymentModal';
import { CVImportModal } from './components/import/CVImportModal';
import { Hero } from './components/home/Hero';
import { Advantages } from './components/home/Advantages';
import { TemplateShowcase } from './components/home/TemplateShowcase';
import { HowItWorks } from './components/home/HowItWorks';
import { PricingSection } from './components/home/PricingSection';
import { CareerAdvice } from './components/home/CareerAdvice';
import { FAQSection } from './components/home/FAQSection';
import { CVBuilder } from './components/builder/CVBuilder';
import { Dashboard } from './components/dashboard/Dashboard';
import { AdminPanel } from './components/admin/AdminPanel';

const GUEST_USER_FALLBACK: UserProfile = {
  id: 'guest_user',
  email: 'candidat@cvprobenin.bj',
  firstName: 'Candidat',
  lastName: 'Bénin',
  countryCode: 'BJ',
  role: 'user',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

const getTabFromPath = (path: string, hash?: string): string => {
  const currentHash = hash !== undefined ? hash : (typeof window !== 'undefined' ? window.location.hash : '');
  if (currentHash === '#admin' || currentHash === '#/admin' || path === '/admin' || path.startsWith('/admin')) return 'admin';
  if (currentHash === '#mon-compte' || currentHash === '#dashboard' || path === '/mon-compte') return 'dashboard';
  if (currentHash === '#builder' || path === '/builder') return 'builder';
  if (currentHash === '#templates' || path === '/templates') return 'templates';
  if (currentHash === '#tarifs' || currentHash === '#pricing' || path === '/tarifs' || path === '/pricing') return 'pricing';
  if (currentHash === '#conseils' || path === '/conseils') return 'tips';
  return 'home';
};

const getPathFromTab = (tab: string): string => {
  if (tab === 'admin') return '/admin';
  if (tab === 'dashboard') return '/mon-compte';
  if (tab === 'builder') return '/builder';
  if (tab === 'templates') return '/templates';
  if (tab === 'pricing') return '/tarifs';
  if (tab === 'tips') return '/conseils';
  return '/';
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return getTabFromPath(window.location.pathname, window.location.hash);
    }
    return 'home';
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => storageService.getCurrentUser());
  const [plans, setPlans] = useState<Plan[]>(() => storageService.getPlans());
  const [cvs, setCvs] = useState<CVData[]>(() => storageService.getCVs(currentUser?.id));
  const [activeCV, setActiveCV] = useState<CVData>(() => {
    const list = storageService.getCVs();
    return list.length > 0 ? list[0] : INITIAL_DEMO_CV;
  });

  // États des modales globales
  const [legalTopic, setLegalTopic] = useState<LegalTopic | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plan | null>(null);
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);

  // Synchronisation des données
  const refreshData = () => {
    const user = storageService.getCurrentUser();
    setCurrentUser(user);
    setPlans(storageService.getPlans());
    setCvs(storageService.getCVs(user?.id));
  };

  useEffect(() => {
    refreshData();
  }, [currentTab]);

  useEffect(() => {
    const handleUrlChange = () => {
      const poppedTab = getTabFromPath(window.location.pathname, window.location.hash);
      setCurrentTab(poppedTab);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleNavigate = (tab: string) => {
    if (tab === 'import') {
      setImportModalOpen(true);
      return;
    }
    setCurrentTab(tab);
    const targetPath = getPathFromTab(tab);
    if (tab === 'admin') {
      if (window.location.hash !== '#admin') {
        window.location.hash = '#admin';
      }
    } else {
      if (window.location.hash === '#admin') {
        window.history.replaceState(null, '', targetPath);
      } else if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTemplateAndBuild = (templateId: string) => {
    const updatedCV = {
      ...activeCV,
      settings: {
        ...activeCV.settings,
        templateId
      }
    };
    setActiveCV(updatedCV);
    storageService.saveCV(updatedCV);
    handleNavigate('builder');
  };

  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  const handleCreateNewCV = () => {
    const permissions = getCVPermissions(null, currentUser, cvs.length, plans);
    if (!permissions.canCreateCV) {
      setQuotaNotice(
        `Plafond de CV atteint (${cvs.length} CV). Passez au Pack Carrière 30 Jours pour créer jusqu'à 15 CV.`
      );
      setSelectedPlanForPayment(plans.find((p) => p.code === 'career_30d') || plans[1] || plans[0]);
      return;
    }
    setQuotaNotice(null);
    const newCV: CVData = {
      ...JSON.parse(JSON.stringify(INITIAL_DEMO_CV)),
      id: 'cv_' + Date.now(),
      userId: currentUser?.id,
      title: 'Mon Nouveau CV Professionnel',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    storageService.saveCV(newCV);
    setActiveCV(newCV);
    refreshData();
    handleNavigate('builder');
  };

  const handleEditCV = (cvToEdit: CVData) => {
    setActiveCV(cvToEdit);
    handleNavigate('builder');
  };

  const handleCVImported = (importedCV: CVData) => {
    if (currentUser) {
      importedCV.userId = currentUser.id;
    }
    storageService.saveCV(importedCV);
    setActiveCV(importedCV);
    setImportModalOpen(false);
    refreshData();
    handleNavigate('builder');
  };

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    handleNavigate('home');
    refreshData();
  };

  const handlePaymentSuccess = (plan: Plan) => {
    refreshData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Barre de navigation supérieure */}
      {currentTab !== 'admin' && (
        <Navbar
          currentTab={currentTab}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAuth={() => setAuthModalOpen(true)}
        />
      )}

      {quotaNotice && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-3">
          <span className="font-semibold">{quotaNotice}</span>
          <button
            type="button"
            onClick={() => setQuotaNotice(null)}
            className="font-bold text-amber-800 hover:underline cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Rendu des Vues */}
      <div className="flex-1">
        {/* 1. ACCUEIL */}
        {currentTab === 'home' && (
          <div>
            <Hero
              onStartBuilder={() => {
                setCurrentTab('builder');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onStartImport={() => setImportModalOpen(true)}
              onExploreTemplates={() => {
                const el = document.getElementById('templates-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setCurrentTab('templates');
                }
              }}
            />
            <Advantages />
            <TemplateShowcase onSelectTemplate={handleSelectTemplateAndBuild} />
            <HowItWorks />
            <PricingSection
              plans={plans}
              currentUser={currentUser}
              onSelectPlan={(p) => {
                if (p.priceXOF === 0) {
                  if (currentUser) {
                    storageService.activateSubscription(currentUser.id, p);
                    refreshData();
                  }
                  setCurrentTab('builder');
                } else {
                  setSelectedPlanForPayment(p);
                }
              }}
            />
            <CareerAdvice />
            <FAQSection />
          </div>
        )}

        {/* 2. CONSTRUCTEUR DE CV (ÉDITEUR) */}
        {currentTab === 'builder' && (
          <CVBuilder
            initialCV={activeCV}
            currentUser={currentUser}
            plans={plans}
            onOpenPricing={() => setSelectedPlanForPayment(plans[1] || plans[0])}
            onSaveSuccess={refreshData}
          />
        )}

        {/* 3. MODÈLES DE CV (PAGE DÉDIÉE) */}
        {currentTab === 'templates' && (
          <div className="py-8">
            <TemplateShowcase onSelectTemplate={handleSelectTemplateAndBuild} />
          </div>
        )}

        {/* 4. TARIFS (PAGE DÉDIÉE) */}
        {currentTab === 'pricing' && (
          <div className="py-8">
            <PricingSection
              plans={plans}
              currentUser={currentUser}
              onSelectPlan={(p) => {
                if (p.priceXOF === 0) {
                  if (currentUser) {
                    storageService.activateSubscription(currentUser.id, p);
                    refreshData();
                  }
                  setCurrentTab('builder');
                } else {
                  setSelectedPlanForPayment(p);
                }
              }}
            />
          </div>
        )}

        {/* 5. CONSEILS CV (PAGE DÉDIÉE) */}
        {currentTab === 'tips' && (
          <div className="py-8">
            <CareerAdvice />
          </div>
        )}

        {/* 6. TABLEAU DE BORD CANDIDAT */}
        {currentTab === 'dashboard' && currentUser && (
          <Dashboard
            currentUser={currentUser}
            cvs={cvs}
            onEditCV={handleEditCV}
            onCreateNewCV={handleCreateNewCV}
            onOpenPricing={(targetCV) => {
              if (targetCV) {
                setActiveCV(targetCV);
              }
              setSelectedPlanForPayment(plans[1] || plans[0]);
            }}
            onRefreshData={refreshData}
            onLogout={handleLogout}
          />
        )}

        {/* 6b. ACCÈS MON-COMPTE SANS ÊTRE CONNECTÉ */}
        {currentTab === 'dashboard' && !currentUser && (
          <div className="min-h-[70vh] flex items-center justify-center p-4 bg-slate-50">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
                <span className="text-2xl font-black">BJ</span>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Espace Personnel Candidat
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  Connectez-vous à votre compte
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pour retrouver vos CV enregistrés, suivre vos validations Moov Money et gérer votre forfait, veuillez vous connecter ou créer un compte gratuit.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                >
                  Se connecter / Créer un compte
                </button>
                <button
                  onClick={() => handleNavigate('home')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. CONSOLE D'ADMINISTRATION */}
        {currentTab === 'admin' && (
          <AdminPanel
            onBack={() => handleNavigate('home')}
            currentUser={currentUser}
            onLoginSuccess={(u) => {
              setCurrentUser(u);
              refreshData();
            }}
          />
        )}
      </div>

      {/* Pied de page universel */}
      {currentTab !== 'admin' && (
        <Footer
          onOpenLegal={(topic) => setLegalTopic(topic)}
          onNavigate={handleNavigate}
          onOpenAuth={() => setAuthModalOpen(true)}
        />
      )}

      {/* Modale Juridique (CGU, APDP, Confidentialité, Remboursement) */}
      {legalTopic && <LegalModal topic={legalTopic} onClose={() => setLegalTopic(null)} />}

      {/* Modale d'authentification */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onLoginSuccess={(u) => {
            setCurrentUser(u);
            refreshData();
          }}
        />
      )}

      {/* Modale de Paiement Mobile Money Bénin */}
      {selectedPlanForPayment && (
        <PaymentModal
          plan={selectedPlanForPayment}
          targetCV={activeCV}
          currentUser={currentUser || GUEST_USER_FALLBACK}
          onClose={() => {
            setSelectedPlanForPayment(null);
            refreshData();
          }}
          onOrderCreated={() => {
            refreshData();
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Modale d'Importation de CV */}
      {importModalOpen && (
        <CVImportModal
          onCVImported={handleCVImported}
          onCancel={() => setImportModalOpen(false)}
        />
      )}
    </div>
  );
}
