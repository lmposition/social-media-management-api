import Fastify from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import 'dotenv/config'; // Charger les variables d'environnement

import { xanoPlugin } from './plugins/xano.plugin';
import { postgresPlugin } from './plugins/postgres.plugin';
import { postingRoutes } from './routes/posting/index';
import { messagingRoutes } from './routes/messaging/index';
import { statsRoutes } from './routes/stats/index';
import { routes } from './routes/index.js';
import { logger } from './utils/logger';

import { commentsRoutes } from './routes/comments/index.js';
import { easyReplyRoutes } from './routes/easy-reply/index.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: logger,
    trustProxy: true
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Plugins de sécurité
  await fastify.register(cors, {
    origin: true,
    credentials: true
  });

  await fastify.register(helmet);

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  // Plugins personnalisés
  await fastify.register(xanoPlugin);
  await fastify.register(postgresPlugin);

  // Routes
  await fastify.register(routes);
  await fastify.register(postingRoutes, { prefix: '/api/posting' });
  await fastify.register(messagingRoutes, { prefix: '/api/messaging' });
  await fastify.register(statsRoutes, { prefix: '/api/stats' });

  // Route de santé
  fastify.get('/health', async () => {
    return { status: 'OK', timestamp: new Date().toISOString() };
  });

  return fastify;
}

async function start() {
  try {
    const app = await buildApp();
    const port = Number(process.env.PORT) || 3000;
    
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Server running on http://localhost:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}