// src/services/xano.service.ts
import { xanoClient } from '../config/database';
import { 
  NetworkAccount, 
  Post, 
  Message, 
  PostStatistics, 
  AccountStatistics 
} from '../interfaces/common';
import { logger } from '../utils/logger';
import { XanoServiceError } from '../utils/errors';

export class XanoService {
  // ============================================================================
  // GESTION DES COMPTES RÉSEAUX SOCIAUX
  // ============================================================================

  async getNetworkAccounts(userId: string): Promise<NetworkAccount[]> {
    try {
      return await xanoClient.get<NetworkAccount[]>(`/users/${userId}/accounts`);
    } catch (error) {
      logger.error('Erreur récupération comptes:', error);
      throw new XanoServiceError('Impossible de récupérer les comptes');
    }
  }

  async getNetworkAccount(accountId: string): Promise<NetworkAccount> {
    try {
      return await xanoClient.get<NetworkAccount>(`/accounts/${accountId}`);
    } catch (error) {
      logger.error('Erreur récupération compte:', error);
      throw new XanoServiceError('Compte non trouvé');
    }
  }

  async saveNetworkAccount(account: Partial<NetworkAccount>): Promise<NetworkAccount> {
    try {
      if (account.id) {
        return await xanoClient.put<NetworkAccount>(`/accounts/${account.id}`, account);
      } else {
        return await xanoClient.post<NetworkAccount>('/accounts', account);
      }
    } catch (error) {
      logger.error('Erreur sauvegarde compte:', error);
      throw new XanoServiceError('Impossible de sauvegarder le compte');
    }
  }

  async deleteNetworkAccount(accountId: string): Promise<void> {
    try {
      await xanoClient.delete(`/accounts/${accountId}`);
    } catch (error) {
      logger.error('Erreur suppression compte:', error);
      throw new XanoServiceError('Impossible de supprimer le compte');
    }
  }

  // ============================================================================
  // GESTION DES POSTS
  // ============================================================================

  async savePosts(posts: Post[]): Promise<Post[]> {
    try {
      return await xanoClient.post<Post[]>('/posts/batch', { posts });
    } catch (error) {
      logger.error('Erreur sauvegarde posts:', error);
      throw new XanoServiceError('Impossible de sauvegarder les posts');
    }
  }

  async getPost(postId: string): Promise<Post> {
    try {
      return await xanoClient.get<Post>(`/posts/${postId}`);
    } catch (error) {
      logger.error('Erreur récupération post:', error);
      throw new XanoServiceError('Post non trouvé');
    }
  }

  async updatePost(postId: string, updateData: Partial<Post>): Promise<Post> {
    try {
      return await xanoClient.put<Post>(`/posts/${postId}`, updateData);
    } catch (error) {
      logger.error('Erreur mise à jour post:', error);
      throw new XanoServiceError('Impossible de mettre à jour le post');
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      await xanoClient.delete(`/posts/${postId}`);
    } catch (error) {
      logger.error('Erreur suppression post:', error);
      throw new XanoServiceError('Impossible de supprimer le post');
    }
  }

  async getPostsByAccount(accountId: string, limit = 50, offset = 0): Promise<Post[]> {
    try {
      return await xanoClient.get<Post[]>(`/accounts/${accountId}/posts`, {
        params: { limit, offset }
      });
    } catch (error) {
      logger.error('Erreur récupération posts compte:', error);
      throw new XanoServiceError('Impossible de récupérer les posts');
    }
  }

  // ============================================================================
  // GESTION DES MESSAGES
  // ============================================================================

  async saveMessages(messages: Message[]): Promise<Message[]> {
    try {
      return await xanoClient.post<Message[]>('/messages/batch', { messages });
    } catch (error) {
      logger.error('Erreur sauvegarde messages:', error);
      throw new XanoServiceError('Impossible de sauvegarder les messages');
    }
  }

  async getMessagesByAccount(accountId: string, limit = 50, offset = 0): Promise<Message[]> {
    try {
      return await xanoClient.get<Message[]>(`/accounts/${accountId}/messages`, {
        params: { limit, offset }
      });
    } catch (error) {
      logger.error('Erreur récupération messages:', error);
      throw new XanoServiceError('Impossible de récupérer les messages');
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await xanoClient.put(`/messages/${messageId}/read`);
    } catch (error) {
      logger.error('Erreur marquage message lu:', error);
      throw new XanoServiceError('Impossible de marquer le message comme lu');
    }
  }

  // ============================================================================
  // GESTION DES STATISTIQUES
  // ============================================================================

  async savePostStatistics(statistics: PostStatistics[]): Promise<PostStatistics[]> {
    try {
      return await xanoClient.post<PostStatistics[]>('/statistics/posts/batch', { statistics });
    } catch (error) {
      logger.error('Erreur sauvegarde statistiques posts:', error);
      throw new XanoServiceError('Impossible de sauvegarder les statistiques');
    }
  }

  async saveAccountStatistics(statistics: AccountStatistics[]): Promise<AccountStatistics[]> {
    try {
      return await xanoClient.post<AccountStatistics[]>('/statistics/accounts/batch', { statistics });
    } catch (error) {
      logger.error('Erreur sauvegarde statistiques comptes:', error);
      throw new XanoServiceError('Impossible de sauvegarder les statistiques');
    }
  }

  async getPostStatistics(postId: string): Promise<PostStatistics | null> {
    try {
      return await xanoClient.get<PostStatistics>(`/posts/${postId}/statistics`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.error('Erreur récupération statistiques post:', error);
      throw new XanoServiceError('Impossible de récupérer les statistiques');
    }
  }

  async getAccountStatistics(accountId: string): Promise<AccountStatistics | null> {
    try {
      return await xanoClient.get<AccountStatistics>(`/accounts/${accountId}/statistics`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.error('Erreur récupération statistiques compte:', error);
      throw new XanoServiceError('Impossible de récupérer les statistiques');
    }
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  async getUserAccessTokens(userId: string): Promise<Record<string, string>> {
    try {
      const response = await xanoClient.get<{ tokens: Record<string, string> }>(`/users/${userId}/tokens`);
      return response.tokens;
    } catch (error) {
      logger.error('Erreur récupération tokens:', error);
      throw new XanoServiceError('Impossible de récupérer les tokens');
    }
  }

  async refreshAccountToken(accountId: string): Promise<NetworkAccount> {
    try {
      return await xanoClient.post<NetworkAccount>(`/accounts/${accountId}/refresh-token`);
    } catch (error) {
      logger.error('Erreur rafraîchissement token:', error);
      throw new XanoServiceError('Impossible de rafraîchir le token');
    }
  }

  async validateUserToken(token: string): Promise<{ userId: string; isValid: boolean }> {
    try {
      return await xanoClient.post<{ userId: string; isValid: boolean }>('/auth/validate-token', { token });
    } catch (error) {
      logger.error('Erreur validation token:', error);
      throw new XanoServiceError('Impossible de valider le token');
    }
  }

  async logActivity(userId: string, action: string, details: any): Promise<void> {
    try {
      await xanoClient.post('/activity-logs', {
        userId,
        action,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.warn('Erreur log activité:', error);
      // Ne pas lever d'erreur pour les logs d'activité
    }
  }
}

export const xanoService = new XanoService();