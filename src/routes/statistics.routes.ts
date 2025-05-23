// src/routes/statistics.routes.ts
import { Router } from 'express';
import { statisticsController } from '../controllers/statistics.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateAccountId, validatePostId } from '../middleware/validation.middleware';

const router = Router();

// Middleware d'authentification
router.use(authMiddleware);

// GET /api/statistics/posts/:postId - Statistiques d'un post
router.get(
  '/posts/:postId',
  validatePostId,
  statisticsController.getPostStatistics.bind(statisticsController)
);

// GET /api/statistics/accounts/:accountId - Statistiques d'un compte
router.get(
  '/accounts/:accountId',
  validateAccountId,
  statisticsController.getAccountStatistics.bind(statisticsController)
);

// POST /api/statistics/accounts/:accountId/sync - Synchroniser les statistiques des posts
router.post(
  '/accounts/:accountId/sync',
  validateAccountId,
  statisticsController.syncPostsStatistics.bind(statisticsController)
);

export default router;