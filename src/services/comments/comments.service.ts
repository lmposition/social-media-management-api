import { Pool } from 'pg';
import { Comment } from '../../types/comments.js';

export class CommentsService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async saveComments(comments: Comment[]): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO easy_reply.comments (
          workspace_id, channel_id, platform, platform_comment_id,
          comment_content, comment_author_name, comment_author_id, comment_author_avatar_url,
          comment_likes_count, comment_replies_count, comment_created_at,
          post_id, post_content, post_cdn_url, post_created_at,
          has_official_reply, is_replied_by_us
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (platform_comment_id, platform, channel_id) 
        DO UPDATE SET 
          comment_content = EXCLUDED.comment_content,
          comment_likes_count = EXCLUDED.comment_likes_count,
          comment_replies_count = EXCLUDED.comment_replies_count,
          has_official_reply = EXCLUDED.has_official_reply,
          updated_at = NOW()
      `;

      for (const comment of comments) {
        await client.query(query, [
          comment.workspace_id,
          comment.channel_id,
          comment.platform,
          comment.platform_comment_id,
          comment.comment_content,
          comment.comment_author_name,
          comment.comment_author_id,
          comment.comment_author_avatar_url,
          comment.comment_likes_count,
          comment.comment_replies_count,
          comment.comment_created_at,
          comment.post_id,
          comment.post_content,
          comment.post_cdn_url,
          comment.post_created_at,
          comment.has_official_reply,
          comment.is_replied_by_us
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getPostComments(params: {
    workspace_id: string;
    post_id: string;
    platform: string;
    limit?: number;
    offset?: number;
    sort_by?: 'created_at' | 'likes' | 'ai_score';
    filter_replied?: boolean;
  }): Promise<{ comments: Comment[]; total: number }> {
    const client = await this.pool.connect();
    
    try {
      const { workspace_id, post_id, platform, limit = 50, offset = 0, sort_by = 'created_at', filter_replied } = params;
      
      let whereConditions = 'WHERE workspace_id = $1 AND post_id = $2 AND platform = $3';
      const queryParams: any[] = [workspace_id, post_id, platform];
      
      if (filter_replied !== undefined) {
        whereConditions += ` AND is_replied_by_us = $${queryParams.length + 1}`;
        queryParams.push(filter_replied);
      }
      
      const orderBy = sort_by === 'ai_score' ? 'ai_score DESC NULLS LAST' : 
                     sort_by === 'likes' ? 'comment_likes_count DESC' : 
                     'comment_created_at DESC';
      
      const query = `
        SELECT * FROM easy_reply.comments 
        ${whereConditions}
        ORDER BY ${orderBy}
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total FROM easy_reply.comments ${whereConditions}
      `;
      
      queryParams.push(limit, offset);
      
      const [commentsResult, countResult] = await Promise.all([
        client.query(query, queryParams),
        client.query(countQuery, queryParams.slice(0, -2))
      ]);
      
      return {
        comments: commentsResult.rows,
        total: parseInt(countResult.rows[0].total)
      };
    } finally {
      client.release();
    }
  }

  async getAccountComments(params: {
    workspace_id: string;
    channel_id?: string;
    platform?: string;
    limit?: number;
    offset?: number;
    sort_by?: 'created_at' | 'likes' | 'ai_score';
    filter_replied?: boolean;
    date_from?: string;
    date_to?: string;
  }): Promise<{ comments: Comment[]; total: number }> {
    const client = await this.pool.connect();
    
    try {
      const { 
        workspace_id, 
        channel_id, 
        platform, 
        limit = 50, 
        offset = 0, 
        sort_by = 'created_at', 
        filter_replied,
        date_from,
        date_to
      } = params;
      
      let whereConditions = 'WHERE workspace_id = $1';
      const queryParams: any[] = [workspace_id];
      
      if (channel_id) {
        whereConditions += ` AND channel_id = $${queryParams.length + 1}`;
        queryParams.push(channel_id);
      }
      
      if (platform) {
        whereConditions += ` AND platform = $${queryParams.length + 1}`;
        queryParams.push(platform);
      }
      
      if (filter_replied !== undefined) {
        whereConditions += ` AND is_replied_by_us = $${queryParams.length + 1}`;
        queryParams.push(filter_replied);
      }
      
      if (date_from) {
        whereConditions += ` AND comment_created_at >= $${queryParams.length + 1}`;
        queryParams.push(date_from);
      }
      
      if (date_to) {
        whereConditions += ` AND comment_created_at <= $${queryParams.length + 1}`;
        queryParams.push(date_to);
      }
      
      const orderBy = sort_by === 'ai_score' ? 'ai_score DESC NULLS LAST' : 
                     sort_by === 'likes' ? 'comment_likes_count DESC' : 
                     'comment_created_at DESC';
      
      const query = `
        SELECT * FROM easy_reply.comments 
        ${whereConditions}
        ORDER BY ${orderBy}
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total FROM easy_reply.comments ${whereConditions}
      `;
      
      queryParams.push(limit, offset);
      
      const [commentsResult, countResult] = await Promise.all([
        client.query(query, queryParams),
        client.query(countQuery, queryParams.slice(0, -2))
      ]);
      
      return {
        comments: commentsResult.rows,
        total: parseInt(countResult.rows[0].total)
      };
    } finally {
      client.release();
    }
  }

  async updateCommentReplyStatus(commentId: string, replyData: {
    is_replied_by_us: boolean;
    reply_content?: string;
    replied_at?: string;
  }): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        UPDATE easy_reply.comments 
        SET 
          is_replied_by_us = $1,
          reply_content = $2,
          replied_at = $3,
          updated_at = NOW()
        WHERE id = $4
      `, [
        replyData.is_replied_by_us,
        replyData.reply_content,
        replyData.replied_at || new Date().toISOString(),
        commentId
      ]);
    } finally {
      client.release();
    }
  }
}