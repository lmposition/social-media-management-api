// src/controllers/statistics.controller.ts
import { Request, Response, NextFunction } from 'express';
import { xanoService } from '../services/xano.service';
import { networkRegistry } from '../services/base-network.service';
import { ApiResponse, StatisticsRequest, StatisticsPeriod } from '../interfaces/common';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

export class StatisticsController {
  // ============================================================================
  // RÉCUPÉRER LES STATISTIQUES D'UN POST
  // ============================================================================
  async getPostStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;
      const { refresh = false } = req.query;

      // Récupérer le post
      const post = await xanoService.getPost(postId);
      
      // Si refresh demandé, récupérer depuis le réseau
      if (refresh === 'true') {
        const account = await xanoService.getNetworkAccount(post.accountId);
        const networkService = networkRegistry.get(account.networkType);

        if (networkService.supportsStatistics() && post.networkPostId) {
          const networkStats = await networkService.getPostStatistics(account, post.networkPostId);
          
          // Sauvegarder les nouvelles stats dans Xano
          const postStats = {
            postId: post.id,
            networkPostId: post.networkPostId,
            networkType: account.networkType,
            metrics: networkStats,
            lastUpdated: new Date()
          };

          await xanoService.savePostStatistics([postStats]);
        }
      }

      // Récupérer les stats depuis Xano
      const statistics = await xanoService.getPostStatistics(postId);

      const response: ApiResponse = {
        success: true,
        data: statistics,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // RÉCUPÉRER LES STATISTIQUES D'UN COMPTE
  // ============================================================================
  async getAccountStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accountId } = req.params;
      const { 
        period = StatisticsPeriod.MONTHLY, 
        refresh = false 
      } = req.query;

      const statisticsRequest: StatisticsRequest = {
        accountId,
        period: period as StatisticsPeriod
      };

      // Si refresh demandé, récupérer depuis le réseau
      if (refresh === 'true') {
        const account = await xanoService.getNetworkAccount(accountId);
        const networkService = networkRegistry.get(account.networkType);

        if (networkService.supportsStatistics()) {
          const networkStats = await networkService.getAccountStatistics(account, statisticsRequest);
          
          // Sauvegarder les nouvelles stats dans Xano
          const accountStats = {
            accountId: account.id,
            networkType: account.networkType,
            metrics: networkStats,
            period: period as StatisticsPeriod,
            lastUpdated: new Date()
          };

          await xanoService.saveAccountStatistics([accountStats]);
        }
      }

      // Récupérer les stats depuis Xano
      const statistics = await xanoService.getAccountStatistics(accountId);

      const response: ApiResponse = {
        success: true,
        data: statistics,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // SYNCHRONISER LES STATISTIQUES DE PLUSIEURS POSTS
  // ============================================================================
  async syncPostsStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accountId } = req.params;
      const { postIds = [] } = req.body;

      const account = await xanoService.getNetworkAccount(accountId);
      const networkService = networkRegistry.get(account.networkType);

      if (!networkService.supportsStatistics()) {
        throw new ValidationError(`Les statistiques ne sont pas supportées pour ${account.networkType}`);
      }

      const statisticsToSave = [];

      // Récupérer les posts à synchroniser
      const posts = postIds.length > 0 
        ? await Promise.all(postIds.map(id => xanoService.getPost(id)))
        : await xanoService.getPostsByAccount(accountId, 100, 0);

      // Récupérer les stats pour chaque post
      for (const post of posts) {
        if (post.networkPostId) {
          try {
            const networkStats = await networkService.getPostStatistics(account, post.networkPostId);
            
            statisticsToSave.push({
              postId: post.id,
              networkPostId: post.networkPostId,
              networkType: account.networkType,
              metrics: networkStats,
              lastUpdated: new Date()
            });
          } catch (error) {
            logger.warn(`Erreur récupération stats pour post ${post.id}:`, error);
          }
        }
      }

      // Sauvegarder toutes les stats
      if (statisticsToSave.length > 0) {
        await xanoService.savePostStatistics(statisticsToSave);
      }

      const response: ApiResponse = {
        success: true,
        data: { synchronized: statisticsToSave.length },
        message: `${statisticsToSave.length} statistiques synchronisées`,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
      logger.info(`Stats synchronisées: ${statisticsToSave.length} posts pour ${accountId}`);
    } catch (error) {
      next(error);
    }
  }
}

export const statisticsController = new StatisticsController();