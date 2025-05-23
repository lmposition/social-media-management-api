// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { xanoService } from '../services/xano.service';
import { AuthenticationError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userTokens?: Record<string, string>;
}

export const authMiddleware = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Récupérer le token depuis les headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token d\'authentification manquant');
    }

    const token = authHeader.substring(7);

    // Valider le token avec Xano
    // Cette logique dépendra de votre implémentation Xano
    // Pour l'instant, on fait une validation basique
    if (!token || token.length < 10) {
      throw new AuthenticationError('Token invalide');
    }

    // Ici, vous devriez valider le token avec Xano
    // et récupérer les informations utilisateur
    // Exemple d'implémentation :
    /*
    const userInfo = await xanoService.validateToken(token);
    req.userId = userInfo.userId;
    req.userTokens = await xanoService.getUserAccessTokens(userInfo.userId);
    */

    // Pour la démonstration, on simule un utilisateur valide
    req.userId = 'demo-user-id';
    req.userTokens = {};

    logger.debug(`Utilisateur authentifié: ${req.userId}`);
    next();
  } catch (error) {
    logger.warn('Échec authentification:', error);
    next(error);
  }
};