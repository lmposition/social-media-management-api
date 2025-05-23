// src/routes/messaging.routes.ts
import { Router } from 'express';
import { messagingController } from '../controllers/messaging.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateMessaging, validateAccountId, validateMessageId } from '../middleware/validation.middleware';

const router = Router();

// Middleware d'authentification
router.use(authMiddleware);

// POST /api/messaging/:accountId - Envoyer un message
router.post(
  '/:accountId',
  validateAccountId,
  validateMessaging,
  messagingController.sendMessage.bind(messagingController)
);

// GET /api/messaging/:accountId/messages - Récupérer les messages d'un compte
router.get(
  '/:accountId/messages',
  validateAccountId,
  messagingController.getMessagesByAccount.bind(messagingController)
);

// PUT /api/messaging/messages/:messageId/read - Marquer un message comme lu
router.put(
  '/messages/:messageId/read',
  validateMessageId,
  messagingController.markAsRead.bind(messagingController)
);

// POST /api/messaging/:accountId/sync - Synchroniser les messages
router.post(
  '/:accountId/sync',
  validateAccountId,
  messagingController.syncMessages.bind(messagingController)
);

export default router;