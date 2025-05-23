// src/routes/posting.routes.ts
import { Router } from 'express';
import { postingController } from '../controllers/posting.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validatePosting, validatePostId, validateAccountId } from '../middleware/validation.middleware';

const router = Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// POST /api/posting/:accountId - Publier un post
router.post(
  '/:accountId',
  validateAccountId,
  validatePosting,
  postingController.publishPost.bind(postingController)
);

// DELETE /api/posting/posts/:postId - Supprimer un post
router.delete(
  '/posts/:postId',
  validatePostId,
  postingController.deletePost.bind(postingController)
);

// PUT /api/posting/posts/:postId - Éditer un post
router.put(
  '/posts/:postId',
  validatePostId,
  validatePosting,
  postingController.editPost.bind(postingController)
);

// GET /api/posting/:accountId/posts - Récupérer les posts d'un compte
router.get(
  '/:accountId/posts',
  validateAccountId,
  postingController.getPostsByAccount.bind(postingController)
);

// GET /api/posting/posts/:postId - Récupérer un post spécifique
router.get(
  '/posts/:postId',
  validatePostId,
  postingController.getPost.bind(postingController)
);

export default router;