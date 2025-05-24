import { FastifyPluginAsync } from 'fastify';

export const routes: FastifyPluginAsync = async (fastify) => {
  // Routes principales - pour l'instant vide
  // Les routes spécifiques sont dans posting/, messaging/, stats/
  
  fastify.get('/', async () => {
    return { 
      message: 'Social Media Manager API',
      version: '1.0.0',
      endpoints: {
        posting: '/api/posting',
        messaging: '/api/messaging', 
        stats: '/api/stats',
        health: '/health'
      }
    };
  });
};