// src/networks/index.ts
import { networkRegistry } from '../services/base-network.service';
import { logger } from '../utils/logger';

/**
 * Initialise tous les services de réseaux sociaux
 * 
 * À compléter lors de l'ajout de chaque réseau :
 * 
 * import { FacebookService } from './facebook/facebook.service';
 * import { InstagramService } from './instagram/instagram.service';
 * import { TwitterService } from './twitter/twitter.service';
 * 
 * export const initializeNetworkServices = () => {
 *   logger.info('Initialisation des services réseau...');
 *   
 *   // Enregistrer chaque service
 *   networkRegistry.register(new FacebookService());
 *   networkRegistry.register(new InstagramService());
 *   networkRegistry.register(new TwitterService());
 *   
 *   const stats = networkRegistry.getRegistryStats();
 *   logger.info('Services réseau initialisés', stats);
 * };
 */

export const initializeNetworkServices = (): void => {
  logger.info('Initialisation des services réseau...');
  
  // Actuellement aucun réseau implémenté
  // Les services seront ajoutés ici au fur et à mesure
  
  const stats = networkRegistry.getRegistryStats();
  logger.info('Services réseau initialisés', {
    ...stats,
    note: 'Aucun réseau implémenté pour le moment'
  });
};

// Export du registry pour utilisation dans d'autres modules
export { networkRegistry } from '../services/base-network.service';