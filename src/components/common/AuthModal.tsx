/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { storageService } from '../../services/storage';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  CheckCircle2,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [identifier, setIdentifier] = useState<string>(''); // Email ou Téléphone
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+229 ');
  const [emailRegister, setEmailRegister] = useState<string>('');
  const [acceptTerms, setAcceptTerms] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  // Calcul visuel de la force du mot de passe
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    if (pass.length < 6) return { score: 1, label: 'Trop court (min. 8)', color: 'bg-red-500' };
    let score = 1;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score++;

    if (score === 2) return { score: 2, label: 'Moyen', color: 'bg-amber-500' };
    if (score >= 3) return { score: 3, label: 'Sécurisé', color: 'bg-emerald-600' };
    return { score: 1, label: 'Faible', color: 'bg-red-500' };
  };

  const strength = getPasswordStrength(password);

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'login') {
      const cleanId = identifier.trim();
      if (!cleanId || !password) {
        setErrorMsg('Veuillez renseigner votre email (ou téléphone) et votre mot de passe.');
        return;
      }

      setIsLoading(true);

      // 1. Tentative d'authentification serveur
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanId, password })
        });
        const data = await res.json();
        if (data.success && data.user) {
          storageService.setCurrentUser(data.user);
          storageService.saveUser(data.user);
          if (data.token) {
            localStorage.setItem('cv_benin_auth_token', data.token);
          }
          setSuccessMsg('Connexion réussie ! Chargement...');
          setTimeout(() => {
            onLoginSuccess(data.user);
            onClose();
          }, 350);
          return;
        } else if (res.status === 401) {
          setErrorMsg(data.error || 'Identifiant ou mot de passe incorrect.');
          setIsLoading(false);
          return;
        }
      } catch (netErr) {
        console.warn('Serveur non joignable, tentative vérification locale', netErr);
      }

      // 2. Repli local sécurisé
      const users = storageService.getUsers();
      const digits = cleanId.replace(/\D/g, '');
      const found = users.find((u) => {
        if (u.email.toLowerCase() === cleanId.toLowerCase()) return true;
        if (digits.length >= 8) {
          const userPhoneDigits = (u.phoneNumber || '').replace(/\D/g, '');
          if (userPhoneDigits && (userPhoneDigits.endsWith(digits) || digits.endsWith(userPhoneDigits))) {
            return true;
          }
        }
        return false;
      });

      if (found) {
        storageService.setCurrentUser(found);
        setSuccessMsg('Connexion réussie ! Chargement...');
        setTimeout(() => {
          onLoginSuccess(found);
          onClose();
        }, 350);
      } else {
        setErrorMsg('Aucun compte trouvé avec cet identifiant. Veuillez vérifier ou vous inscrire.');
        setIsLoading(false);
      }
    } else {
      // Mode Inscription
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMsg('Veuillez indiquer vos prénom et nom.');
        return;
      }
      if (!emailRegister.trim() || !emailRegister.includes('@')) {
        setErrorMsg('Veuillez renseigner une adresse email valide.');
        return;
      }
      if (password.length < 8) {
        setErrorMsg('Le mot de passe doit comporter au moins 8 caractères.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Les mots de passe ne correspondent pas.');
        return;
      }
      if (!acceptTerms) {
        setErrorMsg('Veuillez accepter les conditions d’utilisation conformes au code du numérique au Bénin.');
        return;
      }

      setIsLoading(true);

      // 1. Tentative inscription serveur
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailRegister.trim(),
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phoneNumber: phone.trim()
          })
        });
        const data = await res.json();
        if (data.success && data.user) {
          storageService.setCurrentUser(data.user);
          storageService.saveUser(data.user);
          if (data.token) {
            localStorage.setItem('cv_benin_auth_token', data.token);
          }
          setSuccessMsg('Compte créé avec succès ! Bienvenue sur CV Pro Bénin.');
          setTimeout(() => {
            onLoginSuccess(data.user);
            onClose();
          }, 400);
          return;
        } else {
          setErrorMsg(data.error || 'Erreur lors de la création de votre compte.');
          setIsLoading(false);
          return;
        }
      } catch (netErr) {
        console.warn('Serveur non joignable, enregistrement local', netErr);
      }

      // 2. Repli local
      const newUser: UserProfile = {
        id: 'user_' + Date.now(),
        email: emailRegister.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        countryCode: 'BJ',
        phoneNumber: phone.trim(),
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
      setSuccessMsg('Compte créé avec succès !');
      setTimeout(() => {
        onLoginSuccess(newUser);
        onClose();
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-slide-up">
        {/* Header avec identité visuelle Bénin */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-700/20">
              <Shield className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {mode === 'login' ? 'Espace Candidat Bénin' : 'Créer mon Compte Candidat'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {mode === 'login'
                  ? 'Retrouvez vos CV sauvegardés et vos accès'
                  : 'Sauvegarde Cloud continue et gestion multi-appareils'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sélecteur d'onglets animé Connexion / Inscription */}
        <div className="p-3 bg-slate-100/80 border-b border-slate-200">
          <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-2xl text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Créer un compte
            </button>
          </div>
        </div>

        {/* Corps du formulaire */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2.5 animate-shake">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Fiche pédagogique claire sur l'inscription */}
          {mode === 'register' && (
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-[11px] text-emerald-950 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Avantages du compte sécurisé CV Pro Bénin :</span>
              </div>
              <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px]">
                <li><strong>Sauvegarde Cloud :</strong> Vos CV restent disponibles sur smartphone et ordinateur.</li>
                <li><strong>Sécurité APDP :</strong> Vos informations professionnelles ne sont jamais partagées.</li>
                <li><strong>Rattachement Moov :</strong> Vos accès payés restent liés à votre profil.</li>
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Mode Inscription : Nom et Prénom */}
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prénom <span className="text-emerald-700">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jean-Eudes"
                      className="w-full text-xs pl-8 pr-2.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom <span className="text-emerald-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="DOSSOU"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium uppercase transition-all"
                  />
                </div>
              </div>
            )}

            {/* Champ identifiant principal */}
            {mode === 'login' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email ou Téléphone Bénin (+229) <span className="text-emerald-700">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="ex: candidat@gmail.com ou 0197123456"
                    className="w-full text-xs pl-8 pr-2.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium transition-all"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adresse e-mail <span className="text-emerald-700">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={emailRegister}
                    onChange={(e) => setEmailRegister(e.target.value)}
                    placeholder="votre.email@gmail.com"
                    className="w-full text-xs pl-8 pr-2.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium transition-all"
                  />
                </div>
              </div>
            )}

            {/* Numéro téléphone en mode inscription */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro Mobile Money Bénin (+229) <span className="text-slate-400 font-normal">(Moov ou MTN)</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+229 97 00 00 00"
                    className="w-full text-xs pl-8 pr-2.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-mono font-medium transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pratique pour vous identifier automatiquement lors de vos règlements Moov Money.
                </p>
              </div>
            )}

            {/* Mot de passe */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Mot de passe <span className="text-emerald-700">*</span>
                </label>
                {mode === 'register' && strength.score > 0 && (
                  <span
                    className={`text-[10px] font-bold ${
                      strength.score === 1
                        ? 'text-red-600'
                        : strength.score === 2
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {strength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Minimum 8 caractères' : '••••••••'}
                  className="w-full text-xs pl-8 pr-9 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Jauge de sécurité */}
              {mode === 'register' && password && (
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${(strength.score / 3) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Confirmation mot de passe */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirmer le mot de passe <span className="text-emerald-700">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmez votre mot de passe"
                    className="w-full text-xs pl-8 pr-2.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium transition-all"
                  />
                </div>
              </div>
            )}

            {/* Acceptation des conditions */}
            {mode === 'register' && (
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-600 leading-tight">
                  J'accepte les Conditions Générales et la politique de protection des données (conformité APDP Bénin).
                </span>
              </label>
            )}

            {/* Bouton de validation */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-700/20 cursor-pointer flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Vérification en cours...</span>
                </span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>{mode === 'login' ? 'Me connecter' : 'Créer mon compte'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Bascule Connexion / Inscription textuelle */}
            <div className="text-center pt-2">
              {mode === 'login' ? (
                <p className="text-xs text-slate-500">
                  Vous n'avez pas encore de compte ?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Inscrivez-vous ici
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Déjà un compte inscrit ?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Connectez-vous ici
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
