import { FastifyRequest, FastifyReply } from 'fastify';
import { CommentsService } from '../services/comments/comments.service.js';
import { CommentAnalysisService } from '../services/ai/comment-analysis.service.js';

export class CommentsController {
  // ... méthodes existantes ...

  async markAsReplied(request: FastifyRequest, reply: FastifyReply) {
    const { comment_id } = request.params as any;
    const { workspace_id, reply_content, is_replied } = request.body as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const commentsService = new CommentsService(request.server.postgres);
      
      await commentsService.updateCommentReplyStatus(comment_id, {
        is_replied_by_us: is_replied,
        reply_content: reply_content || undefined,
        replied_at: is_replied ? new Date().toISOString() : undefined
      });

      // Log de l'activité dans Xano
      await request.server.xano.logActivity({
        workspace_id,
        user_id: 'user_id',
        action: is_replied ? 'mark_comment_replied' : 'mark_comment_unreplied',
        resource_type: 'comment',
        resource_id: comment_id,
        metadata: { reply_content: reply_content || null }
      });

      return reply.send({
        success: true,
        message: is_replied ? 'Comment marked as replied' : 'Comment marked as not replied',
        data: {
          comment_id,
          is_replied,
          replied_at: is_replied ? new Date().toISOString() : null
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getPostComments(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, post_id } = request.params as any;
    const { 
      platform, 
      limit, 
      offset, 
      sort_by, 
      filter_replied 
    } = request.query as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const commentsService = new CommentsService(request.server.postgres);
      
      const result = await commentsService.getPostComments({
        workspace_id,
        post_id,
        platform,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        sort_by,
        filter_replied: filter_replied !== undefined ? filter_replied === 'true' : undefined
      });

      return reply.send({
        success: true,
        data: result.comments,
        pagination: {
          total: result.total,
          limit: limit || 50,
          offset: offset || 0,
          has_more: (offset || 0) + (limit || 50) < result.total
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getAccountComments(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id } = request.params as any;
    const { 
      channel_id,
      platform, 
      limit, 
      offset, 
      sort_by, 
      filter_replied,
      date_from,
      date_to
    } = request.query as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const commentsService = new CommentsService(request.server.postgres);
      
      const result = await commentsService.getAccountComments({
        workspace_id,
        channel_id,
        platform,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        sort_by,
        filter_replied: filter_replied !== undefined ? filter_replied === 'true' : undefined,
        date_from,
        date_to
      });

      return reply.send({
        success: true,
        data: result.comments,
        pagination: {
          total: result.total,
          limit: limit || 50,
          offset: offset || 0,
          has_more: (offset || 0) + (limit || 50) < result.total
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async analyzeComments(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id } = request.params as any;
    const { channel_id, post_id, force_reanalysis = false } = request.body as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const commentsService = new CommentsService(request.server.postgres);
      const analysisService = new CommentAnalysisService(request.server.postgres);
      
      // Récupérer les commentaires non analysés ou à re-analyser
      let whereCondition = force_reanalysis ? '' : 'AND ai_analyzed_at IS NULL';
      
      const client = await request.server.postgres.connect();
      try {
        const query = `
          SELECT * FROM easy_reply.comments 
          WHERE workspace_id = $1 
          ${channel_id ? 'AND channel_id = $2' : ''}
          ${post_id ? `AND post_id = $${channel_id ? 3 : 2}` : ''}
          ${whereCondition}
          ORDER BY comment_created_at DESC
          LIMIT 100
        `;
        
        const params = [workspace_id];
        if (channel_id) params.push(channel_id);
        if (post_id) params.push(post_id);
        
        const result = await client.query(query, params);
        const comments = result.rows;
        
        if (comments.length === 0) {
          return reply.send({
            success: true,
            message: 'No comments to analyze',
            analyzed_count: 0
          });
        }
        
        // Analyser les commentaires en batch
        await analysisService.analyzeAndSaveComments(comments);
        
        return reply.send({
          success: true,
          message: `Analyzed ${comments.length} comments`,
          analyzed_count: comments.length
        });
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getSwipeComments(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id } = request.params as any;
    const { channel_id, limit, min_score } = request.query as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const analysisService = new CommentAnalysisService(request.server.postgres);
      
      const comments = await analysisService.getCommentsForSwipe({
        workspace_id,
        channel_id,
        limit: limit ? parseInt(limit) : undefined,
        min_score: min_score ? parseInt(min_score) : undefined
      });

      return reply.send({
        success: true,
        data: comments,
        count: comments.length
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}