import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { PostingController } from '../../controllers/posting.controller.js';

const postingController = new PostingController();

export const postingRoutes: FastifyPluginAsync = async (fastify) => {
  // Création d'un post
  fastify.post('/', {
    schema: {
      body: Type.Object({
        workspace_id: Type.String(),
        channel_id: Type.String(),
        content: Type.String({ minLength: 1 }),
        media_urls: Type.Optional(Type.Array(Type.String({ format: 'uri' }))),
        scheduled_at: Type.Optional(Type.String({ format: 'date-time' })),
        metadata: Type.Optional(Type.Record(Type.String(), Type.Any()))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            platform_post_id: Type.String(),
            status: Type.Union([
              Type.Literal('published'),
              Type.Literal('scheduled'),
              Type.Literal('failed')
            ]),
            url: Type.Optional(Type.String()),
            error: Type.Optional(Type.String())
          })
        }),
        403: Type.Object({
          error: Type.String()
        }),
        500: Type.Object({
          error: Type.String()
        })
      }
    }
  }, postingController.createPost);

  // Mise à jour d'un post
  fastify.put('/', {
    schema: {
      body: Type.Object({
        workspace_id: Type.String(),
        channel_id: Type.String(),
        post_id: Type.String(),
        content: Type.Optional(Type.String({ minLength: 1 })),
        media_urls: Type.Optional(Type.Array(Type.String({ format: 'uri' }))),
        metadata: Type.Optional(Type.Record(Type.String(), Type.Any()))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            platform_post_id: Type.String(),
            status: Type.Union([
              Type.Literal('published'),
              Type.Literal('scheduled'),
              Type.Literal('failed')
            ]),
            error: Type.Optional(Type.String())
          })
        }),
        403: Type.Object({
          error: Type.String()
        }),
        500: Type.Object({
          error: Type.String()
        })
      }
    }
  }, postingController.updatePost);

  // Suppression d'un post
  fastify.delete('/:workspace_id/:channel_id/:post_id', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String({ minLength: 1 }),
        channel_id: Type.String({ minLength: 1 }),
        post_id: Type.String({ minLength: 1 })
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            success: Type.Boolean(),
            error: Type.Optional(Type.String())
          })
        }),
        403: Type.Object({
          error: Type.String()
        }),
        500: Type.Object({
          error: Type.String()
        })
      }
    }
  }, postingController.deletePost);

  // Récupération des posts d'un channel
  fastify.get('/:workspace_id/:channel_id', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String({ minLength: 1 }),
        channel_id: Type.String({ minLength: 1 })
      }),
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
        status: Type.Optional(Type.Union([
          Type.Literal('published'),
          Type.Literal('scheduled'),
          Type.Literal('draft'),
          Type.Literal('failed')
        ])),
        sort: Type.Optional(Type.Union([
          Type.Literal('created_at_desc'),
          Type.Literal('created_at_asc'),
          Type.Literal('scheduled_at_desc'),
          Type.Literal('scheduled_at_asc')
        ]))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(Type.Object({
            id: Type.String(),
            content: Type.String(),
            platform_post_id: Type.String(),
            created_at: Type.String(),
            status: Type.String(),
            url: Type.Optional(Type.String()),
            media_urls: Type.Optional(Type.Array(Type.String())),
            scheduled_at: Type.Optional(Type.String()),
            metadata: Type.Optional(Type.Record(Type.String(), Type.Any()))
          })),
          pagination: Type.Object({
            total: Type.Number(),
            limit: Type.Number(),
            offset: Type.Number(),
            has_more: Type.Boolean()
          })
        }),
        403: Type.Object({
          error: Type.String()
        }),
        500: Type.Object({
          error: Type.String()
        })
      }
    }
  }, postingController.getPosts);

  // Récupération d'un post spécifique
  fastify.get('/:workspace_id/:channel_id/:post_id', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String({ minLength: 1 }),
        channel_id: Type.String({ minLength: 1 }),
        post_id: Type.String({ minLength: 1 })
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String(),
            content: Type.String(),
            platform_post_id: Type.String(),
            created_at: Type.String(),
            updated_at: Type.Optional(Type.String()),
            status: Type.String(),
            url: Type.Optional(Type.String()),
            media_urls: Type.Optional(Type.Array(Type.String())),
            scheduled_at: Type.Optional(Type.String()),
            metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
            engagement: Type.Optional(Type.Object({
              likes: Type.Number(),
              comments: Type.Number(),
              shares: Type.Number(),
              views: Type.Number()
            }))
          })
        }),
        403: Type.Object({
          error: Type.String()
        }),
        404: Type.Object({
          error: Type.String()
        }),
        500: Type.Object({
          error: Type.String()
        })
      }
    }
  }, postingController.getPost);

  // Programmation d'un post (pour les posts en brouillon)
  fastify.post('/:workspace_id/:channel_id/:post_id/schedule', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String({ minLength: 1 }),
        channel_id: Type.String({ minLength: 1 }),
        post_id: Type.String({ minLength: 1 })
      }),
      body: Type.Object({
        scheduled_at: Type.String({ format: 'date-time' })
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            platform_post_id: Type.String(),
            status: Type.Literal('scheduled'),
            scheduled_at: Type.String()
          })
        }),
        403: Type.Object({
          error: Type.String()
        }),
        404: Type.Object({
          error: Type.String()
        }),
        500: Type.Object({
          error: Type.String()
        })
      }
    }
  }, postingController.schedulePost);

  // Publication immédiate d'un post (pour les posts en brouillon ou programmés)
  fastify.post('/:workspace_id/:channel_id/:post_id/publish', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String({ minLength: 1 }),
        channel_id: Type.String({ minLength: 1 }),
        post_id: Type.String({ minLength: 1 })
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            platform_post_id: Type.String(),
            status: Type.Literal('published'),
            url: Type.Optional(Type.String()),
            published_at: Type.String()
          })
        }),
        403: Type.Object({
          error: Type.String()
        }),
        404: Type.Object({
          error: Type.String()
        }),
        500: Type.Object({
          error: Type.String()
        })
      }
    }
  }, postingController.publishPost);

  // Duplication d'un post
  fastify.post('/:workspace_id/:channel_id/:post_id/duplicate', {
    schema: {
      params: Type.Object({
        workspace_id: Type.String({ minLength: 1 }),
        channel_id: Type.String({ minLength: 1 }),
        post_id: Type.String({ minLength: 1 })
      }),
      body: Type.Optional(Type.Object({
        target_channel_id: Type.Optional(Type.String()),
        modifications: Type.Optional(Type.Object({
          content: Type.Optional(Type.String()),
          media_urls: Type.Optional(Type.Array(Type.String())),
          scheduled_at: Type.Optional(Type.String({ format: 'date-time' }))
        }))
      })),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            original_post_id: Type.String(),
            duplicated_post_id: Type.String(),
            status: Type.String()
          })
        }),
        403: Type.Object({
          error: Type.String()
        }),
        404: Type.Object({
          error: Type.String()
        }),
        500: Type.Object({
          error: Type.String()
        })
      }
    }
  }, postingController.duplicatePost);
};