// tests/setup.ts
import { logger } from '../src/utils/logger';

// Configuration globale des tests
beforeAll(() => {
  // Désactiver les logs pendant les tests
  logger.transports.forEach(transport => {
    transport.silent = true;
  });
});

afterAll(() => {
  // Réactiver les logs après les tests
  logger.transports.forEach(transport => {
    transport.silent = false;
  });
});

// Mock de Xano pour les tests
jest.mock('../src/config/database', () => ({
  xanoClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

// Variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.XANO_API_URL = 'https://test.xano.com/api';
process.env.XANO_API_KEY = 'test-api-key';