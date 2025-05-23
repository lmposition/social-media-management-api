import dotenv from 'dotenv';
import app from './app';
import { logger } from './utils/logger';
import { validateEnvironment } from './config/environment';
import { initializeNetworkServices } from './networks';

// Charger les variables d'environnement
dotenv.config();

// Valider l'environnement
validateEnvironment();

// Initialiser les services réseau
initializeNetworkServices();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 Serveur démarré sur le port ${PORT}`);
  logger.info(`📖 Documentation API disponible sur http://localhost:${PORT}/api/docs`);
});

// Gestion propre de l'arrêt du serveur
process.on('SIGINT', () => {
  logger.info('🛑 Arrêt du serveur...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
