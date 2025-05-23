// src/controllers/messaging.controller.ts
import { Request, Response, NextFunction } from 'express';
import { xanoService } from '../services/xano.service';
import { networkRegistry } from '../services/base-network.service';
import { 
  ApiResponse, 
  MessagingRequest 
} from '../interfaces/common';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

export class MessagingController {
  // ============================================================================
  // ENVOYER UN MESSAGE
  // ============================================================================
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accountId } = req.params;
      const messagingRequest: MessagingRequest = req.body;

      // Récupérer le compte depuis Xano
      const account = await xanoService.getNetworkAccount(accountId);
      
      // Obtenir le service réseau approprié
      const networkService = networkRegistry.get(account.networkType);

      // Vérifier les capacités de messaging
      if (!networkService.supportsMessaging() || !networkService.sendMessage) {
        throw new ValidationError(`Le messaging n'est pas supporté pour ${account.networkType}`);
      }

      // Envoyer le message
      const result = await networkService.sendMessage(account, messagingRequest);

      // Sauvegarder le message dans Xano
      const message = {
        id: result.messageId,
        networkType: account.networkType,
        accountId: account.id,
        conversationId: result.conversationId,
        senderId: account.accountId,
        recipientId: messagingRequest.recipientId,
        content: messagingRequest.content,
        isIncoming: false,
        isRead: true,
        sentAt: result.sentAt,
        networkMessageId: result.networkMessageId
      };

      await xanoService.saveMessages([message]);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Message envoyé avec succès',
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
      logger.info(`Message envoyé: ${result.messageId} sur ${account.networkType}`);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // RÉCUPÉRER LES MESSAGES D'UN COMPTE
  // ============================================================================
  async getMessagesByAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accountId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await xanoService.getMessagesByAccount(
        accountId,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      const response: ApiResponse = {
        success: true,
        data: messages,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // MARQUER UN MESSAGE COMME LU
  // ============================================================================
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messageId } = req.params;

      await xanoService.markMessageAsRead(messageId);

      const response: ApiResponse = {
        success: true,
        message: 'Message marqué comme lu',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // SYNCHRONISER LES MESSAGES DEPUIS LE RÉSEAU
  // ============================================================================
  async syncMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accountId } = req.params;

      // Récupérer le compte
      const account = await xanoService.getNetworkAccount(accountId);
      
      // Obtenir le service réseau
      const networkService = networkRegistry.get(account.networkType);

      // Vérifier les capacités
      if (!networkService.supportsMessaging() || !networkService.getMessages) {
        throw new ValidationError(`La synchronisation des messages n'est pas supportée pour ${account.networkType}`);
      }

      // Récupérer les messages depuis le réseau
      const networkMessages = await networkService.getMessages(account);

      // Convertir et sauvegarder dans Xano
      const messages = networkMessages.map((msg: any) => ({
        // Mapping spécifique selon le format de chaque réseau
        // À adapter selon les réponses de chaque API
        ...msg,
        accountId: account.id,
        networkType: account.networkType
      }));

      if (messages.length > 0) {
        await xanoService.saveMessages(messages);
      }

      const response: ApiResponse = {
        success: true,
        data: { synchronized: messages.length },
        message: `${messages.length} messages synchronisés`,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
      logger.info(`Messages synchronisés: ${messages.length} pour ${accountId}`);
    } catch (error) {
      next(error);
    }
  }
}

export const messagingController = new MessagingController();