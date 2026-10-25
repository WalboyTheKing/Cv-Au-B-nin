/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { storageService, INITIAL_USER, INITIAL_ADMIN } from '../../services/storage';
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
  Info,
  Check
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+229 ');
  const [acceptTerms, setAcceptTerms] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    if (mode === 'register') {
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMsg('Veuillez renseigner votre prénom et votre nom.');
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
        setErrorMsg('Veuillez accepter les conditions d’utilisation et la charte APDP Bénin.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        // Tentative d'authentification via l'API serveur
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password })
          });
          const data = await res.json();
          if (data.success && data.user) {
            storageService.setCurrentUser(data.user);
            storageService.saveUser(data.user);
            if (data.token) {
              localStorage.setItem('cv_benin_auth_token', data.token);
            }
            onLoginSuccess(data.user);
            onClose();
            return;
          } else if (res.status === 401) {
            setErrorMsg(data.error || 'Identifiants invalides.');
            setIsLoading(false);
            return;
          }
        } catch (netErr) {
          console.warn('Serveur non joignable, bascule sur stockage local', netErr);
        }

        // Repli local
        const users = storageService.getUsers();
        const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (found) {
          storageService.setCurrentUser(found);
          onLoginSuccess(found);
          onClose();
        } else {
          setErrorMsg('Aucun compte trouvé avec cet email. Veuillez créer un compte.');
        }
      } else {
        // Mode Inscription (Register)
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim(),
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
            onLoginSuccess(data.user);
            onClose();
            return;
          } else {
            setErrorMsg(data.error || 'Erreur lors de la création du compte.');
            setIsLoading(false);
            return;
          }
        } catch (netErr) {
          console.warn('Serveur non joignable, enregistrement local', netErr);
        }

        // Repli local
        const newUser: UserProfile = {
          id: 'user_' + Date.now(),
          email: email.trim(),
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
        onLoginSuccess(newUser);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur lors du traitement de la requête.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (user: UserProfile) => {
    storageService.setCurrentUser(user);
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header avec identité visuelle Bénin */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
              <Shield className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {mode === 'login' ? 'Connexion Espace Candidat' : 'Créer mon Compte Candidat Sécurisé'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {mode === 'login'
                  ? 'Retrouvez vos CV et commandes Moov Money'
                  : 'Sauvegarde Cloud automatique et gestion de vos CV au Bénin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps du formulaire */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span className="font-bold">•</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Fiche pédagogique claire sur l'inscription */}
          {mode === 'register' && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-[11px] text-emerald-950 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Pourquoi créer votre compte sur CV Pro Bénin ?</span>
              </div>
              <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px]">
                <li><strong>Sauvegarde Cloud :</strong> Vos CV restent modifiables sans risque de perte.</li>
                <li><strong>Multi-écrans :</strong> Commencez sur votre smartphone, finalisez sur ordinateur.</li>
                <li><strong>Forfaits Moov Money :</strong> Vos souscriptions restent rattachées à votre compte.</li>
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
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
                      className="w-full text-xs pl-8 pr-2.5 py-2.5 rounded-xl border border-slate-300 outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom de famille <span className="text-emerald-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="DOSSOU"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium uppercase"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse e-mail <span className="text-emerald-700">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@gmail.com"
                  className="w-full text-xs pl-8 pr-2.5 py-2.5 rounded-xl border border-slate-300 outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro Mobile Money Bénin (+229) <span className="text-slate-400 font-normal">(Moov / MTN)</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+229 97 00 00 00"
                    className="w-full text-xs pl-8 pr-2.5 py-2.5 rounded-xl border border-slate-300 outline-hidden focus:border-emerald-600 font-mono font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Permet d'identifier vos transferts Moov Money lors de la commande.
                </p>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Mot de passe <span className="text-emerald-700">*</span>
                </label>
                {mode === 'register' && strength.score > 0 && (
                  <span className={`text-[10px] font-bold ${
                    strength.score === 1 ? 'text-red-600' : strength.score === 2 ? 'text-amber-600' : 'text-emerald-700'
                  }`}>
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
                  className="w-full text-xs pl-8 pr-9 py-2.5 rounded-xl border border-slate-300 outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
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
                <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${(strength.score / 3) * 100}%` }}
                  />
                </div>
              )}
            </div>

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
                    className="w-full text-xs pl-8 pr-2.5 py-2.5 rounded-xl border border-slate-300 outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-600 leading-tight">
                  J'accepte les Conditions Générales et le traitement de mes données conformément à la loi n°2017-20 portant code du numérique au Bénin (APDP).
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <span>Vérification en cours...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{mode === 'login' ? 'Me connecter à mon espace' : 'Créer mon compte candidat'}</span>
                </>
              )}
            </button>

            {/* Bascule Connexion / Inscription */}
            <div className="text-center pt-2">
              {mode === 'login' ? (
                <p className="text-xs text-slate-500">
                  Vous n'avez pas encore de compte ?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg('');
                    }}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Inscrivez-vous gratuitement
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Déjà inscrit sur CV Pro Bénin ?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Connectez-vous ici
                  </button>
                </p>
              )}
            </div>
          </form>

          {/* Accès rapide pour démonstration */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block text-center">
              Accès rapide démonstration :
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin(INITIAL_USER)}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-[11px] text-center transition-colors cursor-pointer"
              >
                Candidat Démo (Cotonou)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin(INITIAL_ADMIN)}
                className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium text-[11px] text-center border border-amber-200 transition-colors cursor-pointer"
              >
                Admin Master
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
