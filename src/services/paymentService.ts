/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { APP_CONFIG, MOOV_MONEY_BENEFICIARY } from '../config';
import { ManualPaymentOrder, PaymentSubmission, Plan } from '../types';
import { storageService } from './storage';

export interface CreateOrderParams {
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  cvId?: string;
  cvTitle?: string;
}

export interface OrderCreationResult {
  success: boolean;
  order?: ManualPaymentOrder;
  error?: string;
}

export interface DeclarationResult {
  success: boolean;
  error?: string;
  order?: ManualPaymentOrder;
}

/**
 * Service de gestion des paiements manuels Moov Money Bénin
 * SÉCURITÉ : Aucun paiement n'est validé automatiquement.
 * L'accès Premium nécessite l'approbation explicite de l'administrateur après vérification réelle du relevé Moov Money.
 */
export class PaymentService {
  /**
   * Crée une commande en attente de paiement
   */
  createOrder(params: CreateOrderParams): OrderCreationResult {
    const { userId, userEmail, userName, planId, cvId, cvTitle } = params;

    // Récupération stricte du prix côté configuration (jamais depuis le client)
    const plan = storageService.getPlanById(planId);
    if (!plan) {
      return { success: false, error: 'Forfait introuvable ou indisponible.' };
    }

    if (!plan.isActive) {
      return { success: false, error: 'Cette offre est actuellement suspendue.' };
    }

    if (plan.priceXOF <= 0) {
      // Offre gratuite : activation immédiate sans paiement
      storageService.activateSubscription(userId, plan);
      return { success: true };
    }

    // Création de la commande formelle rattachée au CV spécifique
    const order = storageService.createManualOrder({
      userId,
      userEmail,
      userName,
      plan,
      cvId,
      cvTitle
    });

    return {
      success: true,
      order
    };
  }

  /**
   * Enregistre la déclaration de paiement transmise par le client
   * Statut : passe à 'pending_verification' (EN ATTENTE DE VÉRIFICATION ADMINISTRATIVE)
   */
  submitDeclaration(orderId: string, submission: PaymentSubmission): DeclarationResult {
    if (!submission.transactionRef || submission.transactionRef.trim().length < 4) {
      return {
        success: false,
        error: 'Veuillez renseigner une référence de transaction Mobile Money valide (ex: reçu par SMS de Moov Money).'
      };
    }

    if (!submission.amountDeclared || submission.amountDeclared <= 0) {
      return {
        success: false,
        error: 'Le montant envoyé en FCFA doit être supérieur à zéro.'
      };
    }

    if (!submission.senderPhone || submission.senderPhone.trim().length < 8) {
      return {
        success: false,
        error: 'Veuillez indiquer le numéro de téléphone utilisé pour envoyer les fonds.'
      };
    }

    return storageService.submitPaymentDeclaration(orderId, submission);
  }

  /**
   * Informations officielles du bénéficiaire
   */
  getBeneficiaryInfo() {
    return MOOV_MONEY_BENEFICIARY;
  }
}

export const paymentService = new PaymentService();
