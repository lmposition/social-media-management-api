import { Channel } from '../../../types/channel.js';

export interface PostData {
  content: string;
  media_urls?: string[];
  scheduled_at?: string;
  metadata?: Record<string, any>;
}

export interface PostResult {
  platform_post_id: string;
  url?: string;
  status: 'published' | 'scheduled' | 'failed';
  error?: string;
  metadata?: Record<string, any>;
}

export abstract class BasePostingService {
  protected channel: Channel;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  abstract createPost(data: PostData): Promise<PostResult>;
  abstract updatePost(postId: string, data: Partial<PostData>): Promise<PostResult>;
  abstract deletePost(postId: string): Promise<{ success: boolean; error?: string }>;
  abstract getPost(postId: string): Promise<any>;
  abstract getPosts(limit?: number, offset?: number): Promise<any[]>;

  protected validateCredentials(): void {
    if (!this.channel.credentials || Object.keys(this.channel.credentials).length === 0) {
      throw new Error(`No credentials configured for ${this.channel.platform}`);
    }
  }

  protected handleError(error: any, operation: string): never {
    const message = error?.response?.data?.error || error.message || 'Unknown error';
    throw new Error(`${this.channel.platform} ${operation} failed: ${message}`);
  }
}