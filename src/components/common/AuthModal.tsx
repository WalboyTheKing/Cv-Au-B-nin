/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { storageService, INITIAL_USER, INITIAL_ADMIN } from '../../services/storage';
import { X, Lock, Mail, User, Phone, CheckCircle2, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+229 ');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    if (mode === 'login') {
      const users = storageService.getUsers();
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (found) {
        storageService.setCurrentUser(found);
        onLoginSuccess(found);
        onClose();
      } else {
        // Pour les tests, on autorise la connexion en créant la session si non existant
        const newUser: UserProfile = {
          id: 'user_' + Date.now(),
          email,
          firstName: email.split('@')[0],
          lastName: 'Bénin',
          countryCode: 'BJ',
          phoneNumber: phone,
          role: 'user',
          subscription: {
            id: 'sub_' + Date.now(),
            userId: 'user_' + Date.now(),
            planId: 'plan_free',
            planCode: 'free',
            status: 'active',
            startsAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
            createdAt: new Date().toISOString()
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        storageService.saveUser(newUser);
        storageService.setCurrentUser(newUser);
        onLoginSuccess(newUser);
        onClose();
      }
    } else {
      if (!firstName || !lastName) {
        setErrorMsg('Veuillez renseigner votre nom et prénom.');
        return;
      }
      const newUser: UserProfile = {
        id: 'user_' + Date.now(),
        email,
        firstName,
        lastName,
        countryCode: 'BJ',
        phoneNumber: phone,
        role: 'user',
        subscription: {
          id: 'sub_' + Date.now(),
          userId: 'user_' + Date.now(),
          planId: 'plan_free',
          planCode: 'free',
          status: 'active',
          startsAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
          createdAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      storageService.saveUser(newUser);
      storageService.setCurrentUser(newUser);
      onLoginSuccess(newUser);
      onClose();
    }
  };

  const handleQuickLogin = (user: UserProfile) => {
    storageService.setCurrentUser(user);
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {mode === 'login' ? 'Connexion Espace Personnel' : 'Créer mon Compte Candidat'}
              </h3>
              <p className="text-[11px] text-slate-500">Retrouvez et sauvegardez vos CV en toute sécurité</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean-Eudes"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 outline-hidden focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="DOSSOU"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Adresse e-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@gmail.com"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 outline-hidden focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 outline-hidden focus:border-emerald-600"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Numéro Mobile Bénin (+229)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+229 97 00 00 00"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 outline-hidden focus:border-emerald-600 font-mono"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {mode === 'login' ? 'Me connecter' : 'Créer mon compte'}
          </button>

          <div className="text-center pt-2">
            {mode === 'login' ? (
              <p className="text-xs text-slate-500">
                Vous n'avez pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Inscrivez-vous ici
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Déjà inscrit ?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Connectez-vous
                </button>
              </p>
            )}
          </div>

          {/* Accès rapide pour démonstration */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block text-center">
              Accès rapide démonstration :
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin(INITIAL_USER)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-[11px] text-center"
              >
                Candidat Démo (Cotonou)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin(INITIAL_ADMIN)}
                className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium text-[11px] text-center"
              >
                Admin Master
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
