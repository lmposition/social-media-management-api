// src/routes/index.ts
import { Router } from 'express';
import postingRoutes from './posting.routes';
import messagingRoutes from './messaging.routes';
import statisticsRoutes from './statistics.routes';
import { networkRegistry } from '../services/base-network.service';
import { ApiResponse } from '../interfaces/common';

const router = Router();

// Routes principales
router.use('/posting', postingRoutes);
router.use('/messaging', messagingRoutes);
router.use('/statistics', statisticsRoutes);

// Route d'information sur l'API
router.get('/', (req, res) => {
  const supportedNetworks = networkRegistry.getSupportedNetworks();
  
  const response: ApiResponse = {
    success: true,
    data: {
      name: 'Social Media Management API',
      version: '1.0.0',
      supportedNetworks,
      endpoints: {
        posting: '/api/posting',
        messaging: '/api/messaging',
        statistics: '/api/statistics'
      }
    },
    timestamp: new Date().toISOString()
  };

  res.json(response);
});

// Route de statut des services
router.get('/status', (req, res) => {
  const services = networkRegistry.getAll().map(service => ({
    network: service.getNetworkType(),
    capabilities: service.getCapabilities()
  }));

  const response: ApiResponse = {
    success: true,
    data: {
      status: 'healthy',
      services,
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  };

  res.json(response);
});

export default router;