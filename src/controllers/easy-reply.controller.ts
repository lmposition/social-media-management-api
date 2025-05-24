import { FastifyRequest, FastifyReply } from 'fastify';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { CommentsService } from '../services/comments/comments.service.js';
import { OpenAI } from 'openai';

export class EasyReplyController {
  async startSwipeSession(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id, user_id } = request.body as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, user_id);
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const client = await request.server.postgres.connect();
      
      try {
        const sessionId = uuidv4();
        
        await client.query(`
          INSERT INTO easy_reply.swipe_sessions (
            id, workspace_id, channel_id, user_id, session_metadata
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          sessionId,
          workspace_id,
          channel_id,
          user_id,
          JSON.stringify({ started_from: 'web_app' })
        ]);

        return reply.send({
          success: true,
          data: {
            session_id: sessionId,
            started_at: new Date().toISOString()
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async endSwipeSession(request: FastifyRequest, reply: FastifyReply) {
    const { session_id } = request.params as any;
    
    try {
      const client = await request.server.postgres.connect();
      
      try {
        // Mettre à jour la session avec les stats finales
        const statsQuery = `
          SELECT 
            COUNT(*) as comments_reviewed,
            COUNT(*) FILTER (WHERE reply_sent = true) as comments_replied
          FROM easy_reply.comment_swipes 
          WHERE session_id = $1
        `;
        
        const statsResult = await client.query(statsQuery, [session_id]);
        const stats = statsResult.rows[0];
        
        await client.query(`
          UPDATE easy_reply.swipe_sessions 
          SET 
            session_ended_at = NOW(),
            comments_reviewed = $1,
            comments_replied = $2
          WHERE id = $3
        `, [
          parseInt(stats.comments_reviewed),
          parseInt(stats.comments_replied),
          session_id
        ]);

        return reply.send({
          success: true,
          data: {
            session_id,
            ended_at: new Date().toISOString(),
            stats: {
              comments_reviewed: parseInt(stats.comments_reviewed),
              comments_replied: parseInt(stats.comments_replied)
            }
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async recordSwipe(request: FastifyRequest, reply: FastifyReply) {
    const { session_id, comment_id, action, reply_content } = request.body as any;
    
    try {
      const client = await request.server.postgres.connect();
      
      try {
        await client.query('BEGIN');
        
        // Enregistrer le swipe
        await client.query(`
          INSERT INTO easy_reply.comment_swipes (
            session_id, comment_id, action, reply_sent, reply_content
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          session_id,
          comment_id,
          action,
          action === 'swipe_right' && reply_content ? true : false,
          reply_content
        ]);

        // Mettre à jour le statut du commentaire
        let newStatus = 'pending';
        if (action === 'swipe_right') newStatus = 'reviewed';
        if (action === 'swipe_up') newStatus = 'archived';
        if (action === 'swipe_left') newStatus = 'ignored';

        await client.query(`
          UPDATE easy_reply.comments 
          SET 
            status = $1,
            is_replied_by_us = $2,
            reply_content = $3,
            replied_at = $4,
            reviewed_at = NOW(),
            updated_at = NOW()
          WHERE id = $5
        `, [
          newStatus,
          action === 'swipe_right' && reply_content ? true : false,
          reply_content,
          action === 'swipe_right' && reply_content ? new Date().toISOString() : null,
          comment_id
        ]);

        await client.query('COMMIT');

        return reply.send({
          success: true,
          data: {
            swipe_recorded: true,
            action,
            comment_status: newStatus
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getEasyReplyStats(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id } = request.params as any;
    const { period_days = 30 } = request.query as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const client = await request.server.postgres.connect();
      
      try {
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - period_days);
        
        // Stats globales
        const globalStatsQuery = `
          SELECT 
            COUNT(*) as total_comments,
            COUNT(*) FILTER (WHERE ai_analyzed_at IS NOT NULL) as analyzed_comments,
            COUNT(*) FILTER (WHERE is_replied_by_us = true) as replied_comments,
            AVG(ai_score) FILTER (WHERE ai_score IS NOT NULL) as avg_ai_score,
            COUNT(*) FILTER (WHERE ai_priority = 'high') as high_priority_comments
          FROM easy_reply.comments 
          WHERE workspace_id = $1 
          AND created_at >= $2
        `;
        
        const globalStats = await client.query(globalStatsQuery, [workspace_id, dateFrom.toISOString()]);
        
        // Stats par catégorie IA
        const categoryStatsQuery = `
          SELECT 
            ai_category,
            COUNT(*) as count,
            COUNT(*) FILTER (WHERE is_replied_by_us = true) as replied_count
          FROM easy_reply.comments 
          WHERE workspace_id = $1 
          AND created_at >= $2
          AND ai_category IS NOT NULL
          GROUP BY ai_category
          ORDER BY count DESC
        `;
        
        const categoryStats = await client.query(categoryStatsQuery, [workspace_id, dateFrom.toISOString()]);
        
        // Stats des sessions de swipe
        const sessionStatsQuery = `
          SELECT 
            COUNT(*) as total_sessions,
            AVG(comments_reviewed) as avg_comments_per_session,
            AVG(comments_replied) as avg_replies_per_session,
            SUM(comments_replied) as total_replies_sent
          FROM easy_reply.swipe_sessions 
          WHERE workspace_id = $1 
          AND session_started_at >= $2
        `;
        
        const sessionStats = await client.query(sessionStatsQuery, [workspace_id, dateFrom.toISOString()]);

        return reply.send({
          success: true,
          data: {
            period_days,
            global_stats: globalStats.rows[0],
            category_breakdown: categoryStats.rows,
            swipe_sessions: sessionStats.rows[0],
            generated_at: new Date().toISOString()
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async generateSuggestedReply(request: FastifyRequest, reply: FastifyReply) {
    const { comment_id, workspace_id, tone = 'professional', context } = request.body as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const client = await request.server.postgres.connect();
      
      try {
        // Récupérer le commentaire
        const commentResult = await client.query(`
          SELECT * FROM easy_reply.comments WHERE id = $1
        `, [comment_id]);
        
        if (commentResult.rows.length === 0) {
          return reply.status(404).send({ error: 'Comment not found' });
        }
        
        const comment = commentResult.rows[0];
        
        // Générer la réponse avec OpenAI
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });

        const prompt = `
Génère une réponse ${tone} à ce commentaire. Retourne UNIQUEMENT un JSON avec cette structure :

{
  "suggested_reply": "Votre réponse ici",
  "confidence_score": 0.85,
  "alternative_replies": ["Alternative 1", "Alternative 2"]
}

CONTEXTE :
Post original: "${comment.post_content || 'N/A'}"
Commentaire: "${comment.comment_content}"
Auteur: ${comment.comment_author_name || 'Utilisateur'}
Plateforme: ${comment.platform}
Ton demandé: ${tone}
${context ? `Contexte supplémentaire: ${context}` : ''}

RÈGLES :
- Sois ${tone} mais authentique
- Maximum 280 caractères pour LinkedIn/Twitter
- Réponds directement au commentaire
- Sois utile et engageant
- N'invente pas d'informations

Retourne UNIQUEMENT le JSON, rien d'autre.
`;

        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 400
        });

        const responseContent = aiResponse.choices[0]?.message?.content?.trim();
        const parsedResponse = JSON.parse(responseContent || '{}');

        // Sauvegarder la suggestion
        await client.query(`
          INSERT INTO easy_reply.ai_suggested_replies (
            comment_id, suggested_reply, tone, confidence_score
          ) VALUES ($1, $2, $3, $4)
        `, [
          comment_id,
          parsedResponse.suggested_reply,
          tone,
          parsedResponse.confidence_score || 0.5
        ]);

        return reply.send({
          success: true,
          data: {
            suggested_reply: parsedResponse.suggested_reply,
            confidence_score: parsedResponse.confidence_score,
            alternative_replies: parsedResponse.alternative_replies || [],
            tone,
            comment_preview: comment.comment_content.substring(0, 100) + "..."
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}