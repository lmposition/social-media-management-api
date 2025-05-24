import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { StatsController } from '../../controllers/stats.controller.js';

const statsController = new StatsController();

const MetricTypeEnum = Type.Union([
  Type.Literal('likes'),
  Type.Literal('comments'),
  Type.Literal('shares'),
  Type.Literal('views'),
  Type.Literal('clicks'),
  Type.Literal('impressions'),
  Type.Literal('engagement_rate'),
  Type.Literal('reach')
]);

const StatsRequestSchema = Type.Object({
  metrics: Type.Array(MetricTypeEnum),
  period: Type.Object({
    start_date: Type.String({ format: 'date-time' }),
    end_date: Type.String({ format: 'date-time' })
  }),
  granularity: Type.Optional(Type.Union([
    Type.Literal('hour'),
    Type.Literal('day'),
    Type.Literal('week'),
    Type.Literal('month')
  ]))
});

export const statsRoutes: FastifyPluginAsync = async (fastify) => {
  // Statistiques de workspace
  fastify.post('/workspace/:workspace_id', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String()
      }),
      body: Type.Intersect([
        StatsRequestSchema,
        Type.Object({
          channel_ids: Type.Optional(Type.Array(Type.String()))
        })
      ])
    }
  }, statsController.getWorkspaceStats);

  // Statistiques de channel
  fastify.post('/workspace/:workspace_id/channel/:channel_id', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String(),
        channel_id: Type.String()
      }),
      body: StatsRequestSchema
    }
  }, statsController.getChannelStats);

  // Déclenchement de collecte de métriques pour un channel
  fastify.post('/workspace/:workspace_id/channel/:channel_id/collect', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String(),
        channel_id: Type.String()
      })
    }
  }, statsController.collectChannelMetrics);

  // Métriques d'un post spécifique
  fastify.get('/workspace/:workspace_id/channel/:channel_id/post/:post_id', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String(),
        channel_id: Type.String(),
        post_id: Type.String()
      })
    }
  }, statsController.getPostMetrics);
};