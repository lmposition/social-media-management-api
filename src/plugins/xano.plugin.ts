import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { XanoService } from '../services/xano.service.js';

declare module 'fastify' {
  interface FastifyInstance {
    xano: XanoService;
  }
}

export const xanoPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const xanoService = new XanoService(
    process.env.XANO_API_URL || '',
    process.env.XANO_API_KEY || ''
  );

  fastify.decorate('xano', xanoService);
});