/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CVData, ManualPaymentOrder, Plan, UserProfile } from '../../types';
import { MOOV_MONEY_BENEFICIARY } from '../../config';
import { paymentService } from '../../services/paymentService';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Phone,
  AlertCircle,
  ArrowRight,
  Clock,
  Upload,
  FileCheck2,
  Lock,
  Info,
  FileText
} from 'lucide-react';

interface PaymentModalProps {
  plan: Plan | null;
  currentUser: UserProfile;
  targetCV?: CVData | null;
  onClose: () => void;
  onOrderCreated?: (order: ManualPaymentOrder) => void;
  onPaymentSuccess?: (plan: Plan) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  plan,
  currentUser,
  targetCV,
  onClose,
  onOrderCreated,
  onPaymentSuccess
}) => {
  const [activeStep, setActiveStep] = useState<'instructions' | 'declare' | 'submitted'>('instructions');
  const [currentOrder, setCurrentOrder] = useState<ManualPaymentOrder | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Champs de la déclaration
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [amountDeclared, setAmountDeclared] = useState<number>(plan ? plan.priceXOF : 0);
  const [senderPhone, setSenderPhone] = useState<string>(currentUser.phoneNumber || '');
  const [transactionDate, setTransactionDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // Format YYYY-MM-DDTHH:mm
  });
  const [notes, setNotes] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialisation de la commande à l'ouverture de la modale
  useEffect(() => {
    if (plan && plan.priceXOF > 0) {
      setAmountDeclared(plan.priceXOF);
      const res = paymentService.createOrder({
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'Candidat',
        planId: plan.id,
        cvId: targetCV?.id,
        cvTitle: targetCV?.title
      });
      if (res.success && res.order) {
        setCurrentOrder(res.order);
        onOrderCreated?.(res.order);

        // Synchronisation asynchrone côté serveur
        fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            userEmail: currentUser.email,
            userName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'Candidat',
            planCode: plan.code,
            cvId: targetCV?.id,
            cvTitle: targetCV?.title
          })
        }).catch((err) => console.warn('Serveur non joignable pour créer la commande', err));
      }
    }
  }, [plan, currentUser, targetCV]);

  if (!plan) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(MOOV_MONEY_BENEFICIARY.phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setErrorMsg("La taille de l'image de capture ne doit pas dépasser 3 Mo.");
        return;
      }
      setErrorMsg('');
      const reader = new FileReader();
      reader.onload = (event) => {
        setProofUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitDeclaration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentOrder) {
      setErrorMsg('Erreur : commande de paiement non initialisée.');
      return;
    }

    if (!transactionRef.trim()) {
      setErrorMsg('Veuillez saisir la référence de transaction Moov Money figurant dans votre SMS.');
      return;
    }

    if (!senderPhone.trim()) {
      setErrorMsg('Veuillez renseigner le numéro de téléphone utilisé pour envoyer les fonds.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Tentative de synchronisation serveur
      try {
        await fetch('/api/orders/declare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: currentOrder.id,
            transactionRef: transactionRef.trim(),
            amountDeclared: Number(amountDeclared),
            senderPhone: senderPhone.trim(),
            notes: notes.trim(),
            proofUrl
          })
        });
      } catch (netErr) {
        console.warn('Serveur non joignable, enregistrement déclaration local', netErr);
      }

      const res = paymentService.submitDeclaration(currentOrder.id, {
        transactionRef: transactionRef.trim(),
        amountDeclared: Number(amountDeclared),
        senderPhone: senderPhone.trim(),
        transactionDate,
        notes: notes.trim(),
        proofUrl,
        submittedAt: new Date().toISOString()
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Erreur lors de l’enregistrement de votre déclaration.');
        setIsSubmitting(false);
        return;
      }

      if (res.order) {
        setCurrentOrder(res.order);
      }
      setActiveStep('submitted');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur inattendue lors de la transmission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full inline-flex">
              <span>Paiement Manuel Moov Money Bénin</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mt-1">
              Souscription : {plan.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ÉTAPE 1 : INSTRUCTIONS DE PAIEMENT */}
          {activeStep === 'instructions' && (
            <>
              {/* Récapitulatif montant & commande */}
              {targetCV && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-emerald-950">
                      CV sélectionné : <strong>{targetCV.title}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {targetCV.personalInfo?.firstName} {targetCV.personalInfo?.lastName}
                  </span>
                </div>
              )}

              <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Montant exact à envoyer (FCFA)
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black font-mono tracking-tight text-white">
                      {plan.priceXOF.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-sm font-bold uppercase text-blue-400">FCFA</span>
                  </div>
                  {currentOrder && (
                    <span className="text-[11px] text-slate-400 block mt-1 font-mono">
                      Réf Commande : {currentOrder.orderNumber}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-full font-bold block">
                    {plan.durationHours ? `${plan.durationHours} Heures d'accès` : `${plan.durationDays} Jours d'accès`}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1.5">
                    1 seul CV • Zéro prélèvement
                  </span>
                </div>
              </div>

              {/* Coordonnées officielles du bénéficiaire */}
              <div className="p-5 bg-blue-50/70 border-2 border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                    Coordonnées Officielles de Transfert
                  </span>
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-extrabold uppercase">
                    Moov Bénin
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-800">
                  <div className="flex justify-between items-center py-1 border-b border-blue-200/60">
                    <span className="text-slate-500">Nom du bénéficiaire :</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {MOOV_MONEY_BENEFICIARY.beneficiaryName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-blue-200/60">
                    <span className="text-slate-500">Numéro Moov Money :</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-base text-blue-950">
                        {MOOV_MONEY_BENEFICIARY.formattedPhone}
                      </span>
                      <button
                        onClick={handleCopyNumber}
                        className="px-2 py-1 bg-white hover:bg-blue-100 text-blue-900 border border-blue-300 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title="Copier le numéro"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Code USSD d'accès :</span>
                    <span className="font-mono font-bold text-slate-800">
                      {MOOV_MONEY_BENEFICIARY.ussdCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions pas-à-pas */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-900 block">
                  Comment effectuer votre transfert :
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px]">
                  <li>Composez <strong>*855#</strong> ou ouvrez votre application Moov Money.</li>
                  <li>Sélectionnez <strong>Transfert d’argent</strong> vers un numéro Moov Bénin.</li>
                  <li>Entrez le numéro : <strong>0194537741</strong>.</li>
                  <li>Vérifiez le nom affiché : <strong>Waaliyou Z Labouda</strong>.</li>
                  <li>Indiquez le montant : <strong>{plan.priceXOF} FCFA</strong>.</li>
                  <li>Validez avec votre code PIN personnel sur votre téléphone.</li>
                </ol>
              </div>

              {/* Avertissement de sécurité */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Sécurité absolue :</strong> CV Pro Bénin ne vous demandera JAMAIS votre code PIN Moov Money. Vous effectuez vous-même le transfert depuis votre propre téléphone.
                </span>
              </div>

              {/* Action : passer à la déclaration */}
              <button
                onClick={() => setActiveStep('declare')}
                className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>J'ai effectué le paiement (Renseigner ma référence)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* ÉTAPE 2 : FORMULAIRE DE DÉCLARATION */}
          {activeStep === 'declare' && (
            <form onSubmit={handleSubmitDeclaration} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                <span className="font-bold block">Déclaration de votre transaction Moov Money :</span>
                Renseignez les détails du SMS reçu pour que notre administrateur valide votre compte après vérification sur le relevé 0194537741.
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Référence de transaction Moov Money *
                </label>
                <input
                  type="text"
                  required
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value.toUpperCase())}
                  placeholder="Ex : MP261024.1030.A12345 ou ID transaction SMS"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase focus:border-blue-600 outline-hidden"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Indiquez le code de transaction reçu par SMS de Moov Money Bénin.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Montant envoyé (FCFA) *</label>
                  <input
                    type="number"
                    required
                    value={amountDeclared}
                    onChange={(e) => setAmountDeclared(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold focus:border-blue-600 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Numéro expéditeur *</label>
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="Ex : 0197000000"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono focus:border-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Date et heure approximatives de l’envoi *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 outline-hidden"
                />
              </div>

              {/* Justificatif facultatif (capture d'écran SMS) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Capture d'écran du SMS de confirmation (Facultatif mais accélère la validation)
                </label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {proofUrl ? (
                    <img
                      src={proofUrl}
                      alt="Aperçu capture"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-300"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                      <Upload className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofUpload}
                      className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
                    />
                    {proofUrl && (
                      <button
                        type="button"
                        onClick={() => setProofUrl('')}
                        className="text-[10px] text-red-600 font-semibold block mt-1 hover:underline"
                      >
                        Retirer la capture
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Note additionnelle (Facultatif)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex : Transfert effectué depuis le compte de mon frère..."
                  className="w-full p-2 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('instructions')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'Enregistrement en cours...' : 'Envoyer ma déclaration'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* ÉTAPE 3 : CONFIRMATION DE RÉCEPTION DE LA DÉCLARATION */}
          {activeStep === 'submitted' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                <Clock className="w-9 h-9" />
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-lg">
                  Déclaration Reçue avec Succès !
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  Votre déclaration pour la commande <strong>{currentOrder?.orderNumber}</strong> a été transmise à notre service de gestion.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 text-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Statut :</span>
                  <span className="font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    En attente de vérification
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Montant déclaré :</span>
                  <span className="font-bold font-mono">{amountDeclared} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Réf transaction Moov :</span>
                  <span className="font-mono font-bold text-blue-900">{transactionRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bénéficiaire :</span>
                  <span className="font-medium">{MOOV_MONEY_BENEFICIARY.beneficiaryName} (0194537741)</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-[11px] text-blue-950 text-left flex items-start gap-2 border border-blue-200">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Délai moyen de validation :</strong> Quelques minutes après contrôle de la réception réelle des fonds sur le compte Moov Money. Vous retrouverez l'état de votre commande sur votre tableau de bord.
                </span>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer et retourner à mon espace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
