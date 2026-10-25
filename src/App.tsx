/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CVData, Plan, UserProfile } from './types';
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

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
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
    setCurrentTab('builder');
  };

  const handleCreateNewCV = () => {
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
    setCurrentTab('builder');
  };

  const handleEditCV = (cvToEdit: CVData) => {
    setActiveCV(cvToEdit);
    setCurrentTab('builder');
  };

  const handleCVImported = (importedCV: CVData) => {
    if (currentUser) {
      importedCV.userId = currentUser.id;
    }
    storageService.saveCV(importedCV);
    setActiveCV(importedCV);
    setImportModalOpen(false);
    refreshData();
    setCurrentTab('builder');
  };

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentTab('home');
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
          onNavigate={(tab) => {
            if (tab === 'import') {
              setImportModalOpen(true);
            } else {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAuth={() => setAuthModalOpen(true)}
        />
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
          />
        )}

        {/* 7. CONSOLE D'ADMINISTRATION */}
        {currentTab === 'admin' && (
          <AdminPanel onBack={() => setCurrentTab('home')} />
        )}
      </div>

      {/* Pied de page universel */}
      {currentTab !== 'admin' && (
        <Footer
          onOpenLegal={(topic) => setLegalTopic(topic)}
          onNavigate={(tab) => {
            if (tab === 'import') {
              setImportModalOpen(true);
            } else {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
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
          currentUser={
            currentUser || {
              id: 'guest_user',
              email: 'candidat@cvprobenin.bj',
              firstName: 'Candidat',
              lastName: 'Bénin',
              countryCode: 'BJ',
              role: 'user',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
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
