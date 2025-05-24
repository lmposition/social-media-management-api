import { FastifyRequest, FastifyReply } from 'fastify';
import { BasePostingService, PostData } from '../services/social-networks/base/base.posting.service.js';

interface Post {
  id: string;
  content: string;
  platform_post_id: string;
  created_at: string;
  updated_at?: string;
  status: string;
  url?: string;
  media_urls?: string[];
  scheduled_at?: string;
  metadata?: Record<string, any>;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}

export class PostingController {
  async createPost(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id, ...postData } = request.body as any;
    
    try {
      // Validation de l'accès au workspace
      const hasAccess = await request.server.xano.validateWorkspaceAccess(
        workspace_id,
        'user_id' // À récupérer du token JWT ou header
      );
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      // Récupération du channel depuis Xano
      const channel = await request.server.xano.getChannel(channel_id, workspace_id);
      
      // Ici, on créerait une instance du service spécifique au réseau social
      // const postingService = SocialNetworkServiceFactory.createPostingService(channel);
      // const result = await postingService.createPost(postData as PostData);
      
      // Pour l'instant, on simule la réponse
      const result = {
        platform_post_id: 'mock_post_id',
        status: 'published' as const,
        url: 'https://example.com/post'
      };

      // Log de l'activité dans Xano
      await request.server.xano.logActivity({
        workspace_id,
        user_id: 'user_id',
        action: 'create_post',
        resource_type: 'post',
        resource_id: result.platform_post_id,
        metadata: { channel_id, platform: channel.platform }
      });

      return reply.send({ success: true, data: result });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  }

  async updatePost(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id, post_id, ...updateData } = request.body as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const channel = await request.server.xano.getChannel(channel_id, workspace_id);
      
      // const postingService = SocialNetworkServiceFactory.createPostingService(channel);
      // const result = await postingService.updatePost(post_id, updateData);
      
      const result = {
        platform_post_id: post_id,
        status: 'published' as const
      };

      await request.server.xano.logActivity({
        workspace_id,
        user_id: 'user_id',
        action: 'update_post',
        resource_type: 'post',
        resource_id: post_id,
        metadata: { channel_id, platform: channel.platform }
      });

      return reply.send({ success: true, data: result });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async deletePost(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id, post_id } = request.params as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const channel = await request.server.xano.getChannel(channel_id, workspace_id);
      
      // const postingService = SocialNetworkServiceFactory.createPostingService(channel);
      // const result = await postingService.deletePost(post_id);

      const result = { success: true };

      await request.server.xano.logActivity({
        workspace_id,
        user_id: 'user_id',
        action: 'delete_post',
        resource_type: 'post',
        resource_id: post_id,
        metadata: { channel_id, platform: channel.platform }
      });

      return reply.send({ success: true, data: result });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getPosts(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id } = request.params as any;
    const { limit = 20, offset = 0, status, sort } = request.query as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const channel = await request.server.xano.getChannel(channel_id, workspace_id);
      
      // const postingService = SocialNetworkServiceFactory.createPostingService(channel);
      // const posts = await postingService.getPosts(limit, offset, { status, sort });

      const posts: Post[] = []; // Simulation pour l'instant

      // Simulation de pagination
      const total = 0;
      const hasMore = offset + limit < total;

      return reply.send({ 
        success: true, 
        data: posts,
        pagination: {
          total,
          limit,
          offset,
          has_more: hasMore
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getPost(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id, post_id } = request.params as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const channel = await request.server.xano.getChannel(channel_id, workspace_id);
      
      // const postingService = SocialNetworkServiceFactory.createPostingService(channel);
      // const post = await postingService.getPost(post_id);

      // Simulation d'un post pour l'instant
      const post: Post = {
        id: post_id,
        content: 'Sample post content',
        platform_post_id: post_id,
        created_at: new Date().toISOString(),
        status: 'published',
        url: 'https://example.com/post/' + post_id,
        engagement: {
          likes: 42,
          comments: 8,
          shares: 3,
          views: 156
        }
      };

      return reply.send({ success: true, data: post });
    } catch (error) {
      request.log.error(error);
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({ error: 'Post not found' });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async schedulePost(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id, post_id } = request.params as any;
    const { scheduled_at } = request.body as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const channel = await request.server.xano.getChannel(channel_id, workspace_id);
      
      // Validation de la date de programmation
      const scheduledDate = new Date(scheduled_at);
      if (scheduledDate <= new Date()) {
        return reply.status(400).send({ error: 'Scheduled date must be in the future' });
      }

      // const postingService = SocialNetworkServiceFactory.createPostingService(channel);
      // const result = await postingService.schedulePost(post_id, scheduled_at);

      const result = {
        platform_post_id: post_id,
        status: 'scheduled' as const,
        scheduled_at: scheduled_at
      };

      await request.server.xano.logActivity({
        workspace_id,
        user_id: 'user_id',
        action: 'schedule_post',
        resource_type: 'post',
        resource_id: post_id,
        metadata: { channel_id, platform: channel.platform, scheduled_at }
      });

      return reply.send({ success: true, data: result });
    } catch (error) {
      request.log.error(error);
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({ error: 'Post not found' });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async publishPost(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id, post_id } = request.params as any;
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const channel = await request.server.xano.getChannel(channel_id, workspace_id);
      
      // const postingService = SocialNetworkServiceFactory.createPostingService(channel);
      // const result = await postingService.publishPost(post_id);

      const result = {
        platform_post_id: post_id,
        status: 'published' as const,
        url: 'https://example.com/post/' + post_id,
        published_at: new Date().toISOString()
      };

      await request.server.xano.logActivity({
        workspace_id,
        user_id: 'user_id',
        action: 'publish_post',
        resource_type: 'post',
        resource_id: post_id,
        metadata: { channel_id, platform: channel.platform }
      });

      return reply.send({ success: true, data: result });
    } catch (error) {
      request.log.error(error);
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({ error: 'Post not found' });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async duplicatePost(request: FastifyRequest, reply: FastifyReply) {
    const { workspace_id, channel_id, post_id } = request.params as any;
    const { target_channel_id, modifications } = request.body as any || {};
    
    try {
      const hasAccess = await request.server.xano.validateWorkspaceAccess(workspace_id, 'user_id');
      
      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied to workspace' });
      }

      const channel = await request.server.xano.getChannel(channel_id, workspace_id);
      
      // Si un channel cible est spécifié, vérifier qu'il existe et qu'on y a accès
      let targetChannel = channel;
      if (target_channel_id && target_channel_id !== channel_id) {
        targetChannel = await request.server.xano.getChannel(target_channel_id, workspace_id);
      }

      // const postingService = SocialNetworkServiceFactory.createPostingService(channel);
      // const originalPost = await postingService.getPost(post_id);
      
      // const targetPostingService = SocialNetworkServiceFactory.createPostingService(targetChannel);
      // const duplicatedPost = await targetPostingService.createPost({
      //   ...originalPost,
      //   ...modifications
      // });

      // Simulation pour l'instant
      const duplicatedPostId = 'duplicated_' + post_id + '_' + Date.now();
      const result = {
        original_post_id: post_id,
        duplicated_post_id: duplicatedPostId,
        status: 'draft'
      };

      await request.server.xano.logActivity({
        workspace_id,
        user_id: 'user_id',
        action: 'duplicate_post',
        resource_type: 'post',
        resource_id: duplicatedPostId,
        metadata: { 
          channel_id, 
          target_channel_id: targetChannel.id,
          original_post_id: post_id,
          platform: targetChannel.platform 
        }
      });

      return reply.send({ success: true, data: result });
    } catch (error) {
      request.log.error(error);
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.status(404).send({ error: 'Post not found' });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}