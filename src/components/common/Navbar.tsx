/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { APP_CONFIG } from '../../config';
import { UserProfile } from '../../types';
import {
  FileText,
  LayoutGrid,
  Upload,
  CreditCard,
  BookOpen,
  User,
  Shield,
  Menu,
  X,
  LogOut,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  onLogout,
  onOpenAuth
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Accueil' },
    { id: 'builder', label: 'Créer un CV', highlight: true },
    { id: 'templates', label: 'Modèles de CV' },
    { id: 'import', label: 'Importer un CV' },
    { id: 'pricing', label: 'Tarifs' },
    { id: 'tips', label: 'Conseils CV' }
  ];

  const planBadge = () => {
    if (!currentUser?.subscription || currentUser.subscription.status !== 'active') {
      return (
        <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-300">
          Gratuit
        </span>
      );
    }
    const code = currentUser.subscription.planCode;
    if (code === 'plus_30d') {
      return (
        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
          Pass Carrière (30j)
        </span>
      );
    }
    if (code === 'premium_7d') {
      return (
        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
          Premium (7j)
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-300">
        Découverte
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform relative overflow-hidden">
            {/* Petit rappel discret des couleurs du Bénin */}
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-amber-400" />
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-red-500" />
            <FileText className="w-5 h-5 relative z-10 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                {APP_CONFIG.brandName}
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded">
                Bénin
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              Vos candidatures à l'échelle supérieure
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            if (link.highlight) {
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 mx-1 ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  {link.label}
                </button>
              );
            }
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'text-emerald-800 bg-emerald-50/70 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* User Account & Actions */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {currentUser.firstName?.[0] || 'U'}
                </div>
                <div className="hidden lg:block pr-1">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.firstName} {currentUser.lastName?.[0]}.
                  </div>
                  <div className="mt-0.5">{planBadge()}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900">{currentUser.firstName} {currentUser.lastName}</p>
                    <p className="text-slate-500 text-[11px] truncate">{currentUser.email}</p>
                    <div className="mt-1.5">{planBadge()}</div>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate('dashboard');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-700"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Mon Tableau de bord (Mes CV)
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('pricing');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-emerald-700"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Changer de forfait (Paiement Bénin)
                  </button>

                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        onNavigate('admin');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-amber-50 flex items-center gap-2 font-medium text-amber-900 border-t border-slate-100"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                      Panneau d'Administration
                    </button>
                  )}

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        onLogout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Se connecter
              </button>
              <button
                onClick={() => onNavigate('builder')}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm transition-all"
              >
                Créer mon CV
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center gap-2">
          {currentUser && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold"
            >
              Mes CV
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between ${
                currentTab === link.id
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{link.label}</span>
              {link.highlight && (
                <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-full">
                  Éditeur
                </span>
              )}
            </button>
          ))}

          <div className="border-t border-slate-200 pt-3 mt-2">
            {currentUser ? (
              <div className="space-y-2">
                <div className="px-3 py-1 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    {currentUser.firstName} {currentUser.lastName}
                  </span>
                  {planBadge()}
                </div>
                <button
                  onClick={() => {
                    onNavigate('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Mes CV enregistrés
                </button>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-amber-800 bg-amber-50 font-semibold"
                  >
                    Console d'Administration
                  </button>
                )}
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 font-semibold"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center rounded-lg border border-slate-300 text-xs font-bold text-slate-700"
                >
                  Connexion
                </button>
                <button
                  onClick={() => {
                    onNavigate('builder');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center rounded-lg bg-emerald-700 text-white text-xs font-bold"
                >
                  Créer mon CV
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
