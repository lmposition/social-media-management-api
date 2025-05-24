import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { EasyReplyController } from '../../controllers/easy-reply.controller';

const easyReplyController = new EasyReplyController();

export const easyReplyRoutes: FastifyPluginAsync = async (fastify) => {
  // Démarrer une session de swipe
  fastify.post('/session/start', {
    schema: {
      body: Type.Object({
        workspace_id: Type.String(),
        channel_id: Type.Optional(Type.String()),
        user_id: Type.String()
      })
    }
  }, easyReplyController.startSwipeSession);

  // Terminer une session de swipe
  fastify.put('/session/:session_id/end', {
    schema: {
      params: Type.Object({
        session_id: Type.String()
      })
    }
  }, easyReplyController.endSwipeSession);

  // Enregistrer une action de swipe
  fastify.post('/swipe', {
    schema: {
      body: Type.Object({
        session_id: Type.String(),
        comment_id: Type.String(),
        action: Type.Union([
          Type.Literal('swipe_right'), // Répondre
          Type.Literal('swipe_left'),  // Ignorer
          Type.Literal('swipe_up')     // Archiver
        ]),
        reply_content: Type.Optional(Type.String())
      })
    }
  }, easyReplyController.recordSwipe);

  // Obtenir les statistiques Easy Reply
  fastify.get('/stats/:workspace_id', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String()
      }),
      querystring: Type.Object({
        period_days: Type.Optional(Type.Number({ minimum: 1, maximum: 365, default: 30 }))
      })
    }
  }, easyReplyController.getEasyReplyStats);

  // Générer une réponse suggérée par l'IA
  fastify.post('/suggest-reply', {
    schema: {
      body: Type.Object({
        comment_id: Type.String(),
        workspace_id: Type.String(),
        tone: Type.Optional(Type.Union([
          Type.Literal('professional'),
          Type.Literal('friendly'),
          Type.Literal('formal'),
          Type.Literal('casual')
        ])),
        context: Type.Optional(Type.String()) // Contexte supplémentaire
      })
    }
  }, easyReplyController.generateSuggestedReply);
};