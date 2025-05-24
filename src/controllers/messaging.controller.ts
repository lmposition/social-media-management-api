import { FastifyRequest, FastifyReply } from 'fastify';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  platform_message_id: string;
  created_at: string;
  read_at?: string;
}

export class MessagingController {
  async sendMessage(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id, recipient_id, content, metadata } = request.body as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const channel = await request.server.xano.getChannel(channel_id, workspace_id);
      
      // const messagingService = SocialNetworkServiceFactory.createMessagingService(channel);
      // const result = await messagingService.sendMessage({ recipient_id, content, metadata });
      
      const result = {
        platform_message_id: 'mock_message_id',
        status: 'sent' as const
      };

      await request.server.xano.logActivity({
        workspace_id,
        user_id: 'user_id',
        action: 'send_message',
        resource_type: 'message',
        resource_id: result.platform_message_id,
        metadata: { channel_id, platform: channel.platform, recipient_id }
      });

      return reply.send({ success: true, data: result });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getMessages(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id } = request.params as any;
    const { limit = 20, offset = 0 } = request.query as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const channel = await request.server.xano.getChannel(channel_id, workspace_id);
      
      // const messagingService = SocialNetworkServiceFactory.createMessagingService(channel);
      // const messages = await messagingService.getMessages(limit, offset);

      const messages: Message[] = []; // Type explicite pour éviter l'erreur

      return reply.send({ success: true, data: messages });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async markAsRead(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id, message_id } = request.params as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const channel = await request.server.xano.getChannel(channel_id, workspace_id);
      
      // const messagingService = SocialNetworkServiceFactory.createMessagingService(channel);
      // const result = await messagingService.markAsRead(message_id);

      const result = { success: true };

      return reply.send({ success: true, data: result });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}