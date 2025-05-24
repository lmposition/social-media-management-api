import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { CommentsController } from '../../controllers/comments.controller.js';

const commentsController = new CommentsController();

export const commentsRoutes: FastifyPluginAsync = async (fastify) => {
  // Récupérer les commentaires d'un post spécifique
  fastify.get('/post/:workspace_id/:post_id', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String(),
        post_id: Type.String()
      }),
      querystring: Type.Object({
        platform: Type.String(),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 200 })),
        offset: Type.Optional(Type.Number({ minimum: 0 })),
        sort_by: Type.Optional(Type.Union([
          Type.Literal('created_at'),
          Type.Literal('likes'),
          Type.Literal('ai_score')
        ])),
        filter_replied: Type.Optional(Type.Boolean())
      })
    }
  }, commentsController.getPostComments);

  // Récupérer tous les commentaires d'un compte/workspace
  fastify.get('/account/:workspace_id', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String()
      }),
      querystring: Type.Object({
        channel_id: Type.Optional(Type.String()),
        platform: Type.Optional(Type.String()),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 200 })),
        offset: Type.Optional(Type.Number({ minimum: 0 })),
        sort_by: Type.Optional(Type.Union([
          Type.Literal('created_at'),
          Type.Literal('likes'),
          Type.Literal('ai_score')
        ])),
filter_replied: Type.Optional(Type.Boolean()),
        date_from: Type.Optional(Type.String({ format: 'date-time' })),
        date_to: Type.Optional(Type.String({ format: 'date-time' }))
      })
    }
  }, commentsController.getAccountComments);

  // Déclencher l'analyse IA des commentaires
  fastify.post('/analyze/:workspace_id', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String()
      }),
      body: Type.Object({
        channel_id: Type.Optional(Type.String()),
        post_id: Type.Optional(Type.String()),
        force_reanalysis: Type.Optional(Type.Boolean())
      })
    }
  }, commentsController.analyzeComments);

  // Récupérer les commentaires pour le swipe (Easy Reply)
  fastify.get('/swipe/:workspace_id', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String()
      }),
      querystring: Type.Object({
        channel_id: Type.Optional(Type.String()),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })),
        min_score: Type.Optional(Type.Number({ minimum: 0, maximum: 100, default: 50 }))
      })
    }
  }, commentsController.getSwipeComments);

  // Marquer un commentaire comme répondu
  fastify.put('/reply/:comment_id', {
    schema: {
      params: Type.Object({
        comment_id: Type.String()
      }),
      body: Type.Object({
        workspace_id: Type.String(),
        reply_content: Type.Optional(Type.String()),
        is_replied: Type.Boolean()
      })
    }
  }, commentsController.markAsReplied);
};