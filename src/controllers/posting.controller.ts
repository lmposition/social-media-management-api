// src/controllers/posting.controller.ts
import { Request, Response, NextFunction } from 'express';
import { xanoService } from '../services/xano.service';
import { networkRegistry } from '../services/base-network.service';
import { 
  ApiResponse, 
  PostingRequest, 
  SocialNetworkType 
} from '../interfaces/common';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError, NetworkError } from '../utils/errors';

export class PostingController {
  // ============================================================================
  // PUBLIER UN POST
  // ============================================================================
  async publishPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accountId } = req.params;
      const postingRequest: PostingRequest = req.body;

      // Récupérer le compte depuis Xano
      const account = await xanoService.getNetworkAccount(accountId);
      
      // Vérifier que le réseau est supporté
      if (!networkRegistry.isSupported(account.networkType)) {
        throw new ValidationError(`Réseau ${account.networkType} non supporté`);
      }

      // Obtenir le service réseau approprié
      const networkService = networkRegistry.get(account.networkType);

      // Vérifier les capacités de posting
      if (!networkService.supportsPosting()) {
        throw new ValidationError(`Le posting n'est pas supporté pour ${account.networkType}`);
      }

      // Publier le post
      const result = await networkService.publishPost(account, postingRequest);

      // Sauvegarder le post dans Xano
      const post = {
        id: result.postId,
        networkType: account.networkType,
        accountId: account.id,
        content: postingRequest.content,
        status: result.status,
        networkPostId: result.networkPostId,
        publishedAt: result.publishedAt,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await xanoService.savePosts([post]);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Post publié avec succès',
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
      logger.info(`Post publié: ${result.postId} sur ${account.networkType}`);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // SUPPRIMER UN POST
  // ============================================================================
  async deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;

      // Récupérer le post depuis Xano
      const post = await xanoService.getPost(postId);
      
      // Récupérer le compte
      const account = await xanoService.getNetworkAccount(post.accountId);

      // Obtenir le service réseau
      const networkService = networkRegistry.get(account.networkType);

      // Supprimer sur le réseau social
      if (post.networkPostId) {
        await networkService.deletePost(account, post.networkPostId);
      }

      // Supprimer de Xano
      await xanoService.deletePost(postId);

      const response: ApiResponse = {
        success: true,
        message: 'Post supprimé avec succès',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
      logger.info(`Post supprimé: ${postId}`);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // ÉDITER UN POST
  // ============================================================================
  async editPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;
      const postingRequest: PostingRequest = req.body;

      // Récupérer le post depuis Xano
      const post = await xanoService.getPost(postId);
      
      // Récupérer le compte
      const account = await xanoService.getNetworkAccount(post.accountId);

      // Obtenir le service réseau
      const networkService = networkRegistry.get(account.networkType);

      // Vérifier si l'édition est supportée
      if (!networkService.getCapabilities().posting.supportsEditing) {
        throw new ValidationError(`L'édition n'est pas supportée pour ${account.networkType}`);
      }

      // Éditer sur le réseau social
      let result;
      if (post.networkPostId) {
        result = await networkService.editPost(account, post.networkPostId, postingRequest);
      }

      // Mettre à jour dans Xano
      const updatedPost = await xanoService.updatePost(postId, {
        content: postingRequest.content,
        updatedAt: new Date()
      });

      const response: ApiResponse = {
        success: true,
        data: { post: updatedPost, networkResult: result },
        message: 'Post modifié avec succès',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
      logger.info(`Post modifié: ${postId}`);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // RÉCUPÉRER LES POSTS D'UN COMPTE
  // ============================================================================
  async getPostsByAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accountId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const posts = await xanoService.getPostsByAccount(
        accountId, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );

      const response: ApiResponse = {
        success: true,
        data: posts,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // RÉCUPÉRER UN POST SPÉCIFIQUE
  // ============================================================================
  async getPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;

      const post = await xanoService.getPost(postId);

      const response: ApiResponse = {
        success: true,
        data: post,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const postingController = new PostingController();
