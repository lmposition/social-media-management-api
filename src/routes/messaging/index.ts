import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { MessagingController } from '../../controllers/messaging.controller.js';

const messagingController = new MessagingController();

export const messagingRoutes: FastifyPluginAsync = async (fastify) => {
  // Envoi d'un message
  fastify.post('/', {
    schema: {
      body: Type.Object({
        workspace_id: Type.String(),
        channel_id: Type.String(),
        recipient_id: Type.String(),
        content: Type.String(),
        metadata: Type.Optional(Type.Record(Type.String(), Type.Any()))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            platform_message_id: Type.String(),
            status: Type.Union([
              Type.Literal('sent'),
              Type.Literal('failed')
            ]),
            error: Type.Optional(Type.String())
          })
        })
      }
    }
  }, messagingController.sendMessage);

  // Récupération des messages
  fastify.get('/:workspace_id/:channel_id', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String(),
        channel_id: Type.String()
      }),
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
        offset: Type.Optional(Type.Number({ minimum: 0 }))
      })
    }
  }, messagingController.getMessages);

  // Marquer comme lu
  fastify.put('/:workspace_id/:channel_id/:message_id/read', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String(),
        channel_id: Type.String(),
        message_id: Type.String()
      })
    }
  }, messagingController.markAsRead);
};