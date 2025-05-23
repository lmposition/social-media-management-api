// src/services/base-network.service.ts
import { 
  SocialNetworkType, 
  NetworkCapabilities, 
  PostingRequest, 
  PostingResponse,
  MessagingRequest,
  MessagingResponse,
  StatisticsRequest,
  StatisticsResponse,
  NetworkAccount,
  Post,
  Message,
  PostStatistics,
  AccountStatistics
} from '../interfaces/common';
import { logger } from '../utils/logger';

export abstract class BaseNetworkService {
  protected networkType: SocialNetworkType;
  protected capabilities: NetworkCapabilities;

  constructor(networkType: SocialNetworkType, capabilities: NetworkCapabilities) {
    this.networkType = networkType;
    this.capabilities = capabilities;
  }

  // ============================================================================
  // MÉTHODES ABSTRAITES - À IMPLÉMENTER PAR CHAQUE RÉSEAU
  // ============================================================================

  // Posting - Méthodes obligatoires
  abstract publishPost(account: NetworkAccount, request: PostingRequest): Promise<PostingResponse>;
  abstract deletePost(account: NetworkAccount, postId: string): Promise<void>;
  abstract editPost(account: NetworkAccount, postId: string, request: PostingRequest): Promise<PostingResponse>;
  abstract getPost(account: NetworkAccount, postId: string): Promise<any>;

  // Messaging - Méthodes optionnelles selon les capacités
  abstract sendMessage?(account: NetworkAccount, request: MessagingRequest): Promise<MessagingResponse>;
  abstract getMessages?(account: NetworkAccount, conversationId?: string): Promise<any[]>;
  abstract markAsRead?(account: NetworkAccount, messageId: string): Promise<void>;
  abstract getConversations?(account: NetworkAccount): Promise<any[]>;

  // Statistics - Méthodes obligatoires
  abstract getPostStatistics(account: NetworkAccount, postId: string): Promise<any>;
  abstract getAccountStatistics(account: NetworkAccount, request: StatisticsRequest): Promise<any>;

  // Authentication - Méthodes optionnelles
  abstract refreshAccessToken?(account: NetworkAccount): Promise<{ accessToken: string; expiresAt?: Date }>;
  abstract validateToken?(account: NetworkAccount): Promise<boolean>;

  // ============================================================================
  // MÉTHODES COMMUNES
  // ============================================================================

  getNetworkType(): SocialNetworkType {
    return this.networkType;
  }

  getCapabilities(): NetworkCapabilities {
    return this.capabilities;
  }

  supportsPosting(): boolean {
    return this.capabilities.posting.enabled;
  }

  supportsMessaging(): boolean {
    return this.capabilities.messaging.enabled;
  }

  supportsStatistics(): boolean {
    return this.capabilities.statistics.enabled;
  }

  canSchedulePosts(): boolean {
    return this.capabilities.posting.supportsScheduling;
  }

  canEditPosts(): boolean {
    return this.capabilities.posting.supportsEditing;
  }

  supportsDrafts(): boolean {
    return this.capabilities.posting.supportsDrafts;
  }

  getMaxMediaCount(): number {
    return this.capabilities.posting.maxMediaCount;
  }

  getMaxTextLength(): number {
    return this.capabilities.posting.maxTextLength;
  }

  getSupportedMediaTypes(): string[] {
    return this.capabilities.posting.supportedMediaTypes;
  }

  // ============================================================================
  // MÉTHODES DE VALIDATION
  // ============================================================================

  protected async validateAccount(account: NetworkAccount): Promise<void> {
    if (account.networkType !== this.networkType) {
      throw new Error(`Type de réseau incompatible: attendu ${this.networkType}, reçu ${account.networkType}`);
    }

    if (!account.isActive) {
      throw new Error('Compte désactivé');
    }

    if (account.tokenExpiresAt && account.tokenExpiresAt < new Date()) {
      throw new Error('Token d\'accès expiré');
    }

    if (!account.accessToken) {
      throw new Error('Token d\'accès manquant');
    }
  }

  protected validatePostingRequest(request: PostingRequest): void {
    if (!request.content) {
      throw new Error('Contenu manquant');
    }

    // Vérifier qu'il y a au moins du texte ou des médias
    if (!request.content.text && (!request.content.media || request.content.media.length === 0)) {
      throw new Error('Au moins du texte ou des médias doivent être fournis');
    }

    // Vérifier la longueur du texte
    if (request.content.text && request.content.text.length > this.capabilities.posting.maxTextLength) {
      throw new Error(`Texte trop long (max: ${this.capabilities.posting.maxTextLength} caractères)`);
    }

    // Vérifier le nombre de médias
    if (request.content.media && request.content.media.length > this.capabilities.posting.maxMediaCount) {
      throw new Error(`Trop de médias (max: ${this.capabilities.posting.maxMediaCount})`);
    }

    // Vérifier les types de médias supportés
    if (request.content.media) {
      for (const media of request.content.media) {
        if (!this.capabilities.posting.supportedMediaTypes.includes(media.type)) {
          throw new Error(`Type de média non supporté: ${media.type}`);
        }
      }
    }

    // Vérifier la programmation si demandée
    if (request.scheduledAt && !this.capabilities.posting.supportsScheduling) {
      throw new Error('La programmation de posts n\'est pas supportée');
    }
  }

  protected validateMessagingRequest(request: MessagingRequest): void {
    if (!this.capabilities.messaging.enabled) {
      throw new Error('Le messaging n\'est pas supporté pour ce réseau');
    }

    if (!request.content || !request.content.text) {
      throw new Error('Contenu du message manquant');
    }

    if (!request.conversationId && !request.recipientId) {
      throw new Error('conversationId ou recipientId requis');
    }

    // Vérifier les médias si présents
    if (request.content.media && !this.capabilities.messaging.supportsMediaMessages) {
      throw new Error('Les médias ne sont pas supportés dans les messages');
    }
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  protected formatError(error: any, operation: string): Error {
    const message = `Erreur ${this.networkType} - ${operation}: ${error.message || 'Erreur inconnue'}`;
    logger.error(message, { networkType: this.networkType, operation, originalError: error });
    return new Error(message);
  }

  protected logOperation(operation: string, details?: any): void {
    logger.info(`${this.networkType} - ${operation}`, details);
  }

  protected isTokenExpired(account: NetworkAccount): boolean {
    if (!account.tokenExpiresAt) {
      return false; // Si pas de date d'expiration, on considère que c'est valide
    }
    return account.tokenExpiresAt < new Date();
  }

  protected shouldRefreshToken(account: NetworkAccount): boolean {
    if (!account.tokenExpiresAt) {
      return false;
    }
    // Rafraîchir si le token expire dans moins de 10 minutes
    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
    return account.tokenExpiresAt < tenMinutesFromNow;
  }

  // ============================================================================
  // MÉTHODES DE GESTION D'ERREURS COMMUNES
  // ============================================================================

  protected handleRateLimitError(error: any): Error {
    logger.warn(`Rate limit atteint pour ${this.networkType}`, error);
    return new Error(`Rate limit atteint pour ${this.networkType}. Veuillez réessayer plus tard.`);
  }

  protected handleAuthenticationError(error: any): Error {
    logger.error(`Erreur d'authentification ${this.networkType}`, error);
    return new Error(`Token invalide ou expiré pour ${this.networkType}`);
  }

  protected handleNetworkError(error: any): Error {
    logger.error(`Erreur réseau ${this.networkType}`, error);
    return new Error(`Erreur de connexion à ${this.networkType}`);
  }

  protected handleApiError(error: any, operation: string): Error {
    // Gestion générique des erreurs API
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 401:
          return this.handleAuthenticationError(error);
        case 429:
          return this.handleRateLimitError(error);
        case 403:
          return new Error(`Permission refusée pour ${operation} sur ${this.networkType}`);
        case 404:
          return new Error(`Ressource non trouvée pour ${operation} sur ${this.networkType}`);
        case 500:
        case 502:
        case 503:
          return new Error(`Erreur serveur ${this.networkType}. Veuillez réessayer plus tard.`);
        default:
          return new Error(`Erreur ${this.networkType} (${status}): ${message}`);
      }
    }

    return this.handleNetworkError(error);
  }
}

// ============================================================================
// REGISTRY DES SERVICES RÉSEAUX
// ============================================================================

export class NetworkServiceRegistry {
  private services: Map<SocialNetworkType, BaseNetworkService> = new Map();

  register(service: BaseNetworkService): void {
    this.services.set(service.getNetworkType(), service);
    logger.info(`Service ${service.getNetworkType()} enregistré avec succès`, {
      capabilities: service.getCapabilities()
    });
  }

  unregister(networkType: SocialNetworkType): void {
    if (this.services.has(networkType)) {
      this.services.delete(networkType);
      logger.info(`Service ${networkType} désenregistré`);
    }
  }

  get(networkType: SocialNetworkType): BaseNetworkService {
    const service = this.services.get(networkType);
    if (!service) {
      throw new Error(`Service non trouvé pour le réseau: ${networkType}`);
    }
    return service;
  }

  getAll(): BaseNetworkService[] {
    return Array.from(this.services.values());
  }

  isSupported(networkType: SocialNetworkType): boolean {
    return this.services.has(networkType);
  }

  getSupportedNetworks(): SocialNetworkType[] {
    return Array.from(this.services.keys());
  }

  getNetworkCapabilities(networkType: SocialNetworkType): NetworkCapabilities | null {
    const service = this.services.get(networkType);
    return service ? service.getCapabilities() : null;
  }

  getServicesWithCapability(capability: 'posting' | 'messaging' | 'statistics'): BaseNetworkService[] {
    return this.getAll().filter(service => {
      const capabilities = service.getCapabilities();
      return capabilities[capability].enabled;
    });
  }

  // Méthode utilitaire pour valider qu'un réseau supporte une fonctionnalité
  validateNetworkSupport(networkType: SocialNetworkType, capability: 'posting' | 'messaging' | 'statistics'): void {
    if (!this.isSupported(networkType)) {
      throw new Error(`Réseau ${networkType} non supporté`);
    }

    const service = this.get(networkType);
    const capabilities = service.getCapabilities();

    if (!capabilities[capability].enabled) {
      throw new Error(`${capability} non supporté pour ${networkType}`);
    }
  }

  // Statistiques du registry
  getRegistryStats(): {
    totalServices: number;
    supportedNetworks: SocialNetworkType[];
    capabilitiesSummary: {
      posting: number;
      messaging: number;
      statistics: number;
    };
  } {
    const services = this.getAll();
    
    return {
      totalServices: services.length,
      supportedNetworks: this.getSupportedNetworks(),
      capabilitiesSummary: {
        posting: services.filter(s => s.supportsPosting()).length,
        messaging: services.filter(s => s.supportsMessaging()).length,
        statistics: services.filter(s => s.supportsStatistics()).length
      }
    };
  }
}

export const networkRegistry = new NetworkServiceRegistry();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Fonction utilitaire pour initialiser tous les services réseau
export const initializeNetworkServices = (): void => {
  logger.info('Initialisation des services réseau...');
  
  // Cette fonction sera appelée depuis src/networks/index.ts
  // où tous les services seront enregistrés
  
  const stats = networkRegistry.getRegistryStats();
  logger.info('Services réseau initialisés', stats);
};

// Fonction pour obtenir un service avec gestion d'erreurs
export const getNetworkService = (networkType: SocialNetworkType): BaseNetworkService => {
  try {
    return networkRegistry.get(networkType);
  } catch (error) {
    logger.error(`Service non trouvé: ${networkType}`, error);
    throw error;
  }
};

// Fonction pour valider les capacités avant une opération
export const validateOperation = (
  networkType: SocialNetworkType, 
  operation: 'posting' | 'messaging' | 'statistics'
): void => {
  networkRegistry.validateNetworkSupport(networkType, operation);
};