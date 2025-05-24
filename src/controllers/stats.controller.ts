import { FastifyRequest, FastifyReply } from 'fastify';
import { StatsRequest } from '../types/metrics.js';

export class StatsController {
  async getWorkspaceStats(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id } = request.params as any;
    const statsRequest = request.body as StatsRequest;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const stats = await request.server.metricsService.getStats({
        ...statsRequest,
        workspace_id
      });

      return reply.send({ success: true, data: stats });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getChannelStats(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id } = request.params as any;
    const statsRequest = request.body as Omit<StatsRequest, 'channel_ids'>;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const stats = await request.server.metricsService.getStats({
        ...statsRequest,
        workspace_id,
        channel_ids: [channel_id]
      });

      return reply.send({ success: true, data: stats });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async collectChannelMetrics(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id } = request.params as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const channel = await request.server.xano.getChannel(channel_id, workspace_id);
      
      // const statsService = SocialNetworkServiceFactory.createStatsService(channel);
      // const metrics = await statsService.getAccountMetrics();
      // await request.server.metricsService.saveMetrics(metrics);

      return reply.send({ 
        success: true, 
        message: 'Metrics collection initiated',
        data: { channel_id, workspace_id }
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getPostMetrics(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id, post_id } = request.params as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      // Récupération directe depuis PostgreSQL pour un post spécifique
      const client = await request.server.postgres.connect();
      
      try {
        const result = await client.query(`
          SELECT metric_type, value, collected_at, metadata
          FROM metrics 
          WHERE workspace_id = $1 AND channel_id = $2 AND post_id = $3
          ORDER BY collected_at DESC
        `, [workspace_id, channel_id, post_id]);

        const metrics = result.rows.reduce((acc, row) => {
          if (!acc[row.metric_type]) {
            acc[row.metric_type] = [];
          }
          acc[row.metric_type].push({
            value: row.value,
            collected_at: row.collected_at,
            metadata: row.metadata
          });
          return acc;
        }, {});

        return reply.send({ success: true, data: metrics });
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}