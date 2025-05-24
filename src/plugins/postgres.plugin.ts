import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Pool } from 'pg';
import { MetricsService } from '../services/stats/metrics.service.js';

declare module 'fastify' {
  interface FastifyInstance {
    postgres: Pool;
    metricsService: MetricsService;
  }
}

export const postgresPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  const metricsService = new MetricsService(pool);

  fastify.decorate('postgres', pool);
  fastify.decorate('metricsService', metricsService);

  fastify.addHook('onClose', async () => {
    await pool.end();
  });
});