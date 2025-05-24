import axios, { AxiosInstance } from 'axios';
import { BasePostingService, PostData, PostResult } from '../base/base.posting.service.js';
import { Channel } from '../../../types/channel.js';

interface LinkedInCredentials {
  ACCESS_TOKEN: string;
  PAGE_ID?: string; // Pour les pages d'entreprise
  USER_URN?: string; // URN de l'utilisateur
  ORGANIZATION_URN?: string; // URN de l'organisation
}

interface LinkedInPostData extends PostData {
  visibility?: 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN_MEMBERS';
  commentary?: string;
}

export class LinkedInPostingService extends BasePostingService {
  private client: AxiosInstance;
  private credentials: LinkedInCredentials;

  constructor(channel: Channel) {
    super(channel);
    this.validateCredentials();
    
    this.credentials = channel.credentials as LinkedInCredentials;
    
    this.client = axios.create({
      baseURL: 'https://api.linkedin.com/rest',
      headers: {
        'Authorization': `Bearer ${this.credentials.ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202405'
      }
    });
  }

  async createPost(data: LinkedInPostData): Promise<PostResult> {
    try {
      // Déterminer si c'est un post personnel ou d'organisation
      const author = this.credentials.ORGANIZATION_URN 
        ? `urn:li:organization:${this.credentials.ORGANIZATION_URN}`
        : `urn:li:person:${this.credentials.USER_URN}`;

      const postData = {
        author,
        commentary: data.content,
        visibility: data.visibility || 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        content: data.media_urls && data.media_urls.length > 0 ? {
          media: {
            title: data.metadata?.title || 'Shared content',
            id: data.media_urls[0] // LinkedIn nécessite un traitement spécial pour les médias
          }
        } : undefined,
        lifecycleState: data.scheduled_at ? 'DRAFT' : 'PUBLISHED',
        isReshareDisabledByAuthor: false
      };

      const response = await this.client.post('/posts', postData);
      
      const postId = response.data.id;
      const postUrl = `https://www.linkedin.com/feed/update/${postId}`;

      return {
        platform_post_id: postId,
        status: data.scheduled_at ? 'scheduled' : 'published',
        url: postUrl,
        metadata: {
          linkedin_urn: postId,
          author_urn: author,
          visibility: data.visibility || 'PUBLIC'
        }
      };

    } catch (error) {
      this.handleError(error, 'create post');
    }
  }

  async updatePost(postId: string, data: Partial<LinkedInPostData>): Promise<PostResult> {
    try {
      // LinkedIn ne permet pas la modification du contenu d'un post publié
      // On peut seulement modifier certains paramètres comme la visibilité
      const updateData: any = {};
      
      if (data.visibility) {
        updateData.visibility = data.visibility;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('LinkedIn does not support editing post content after publication');
      }

      await this.client.patch(`/posts/${postId}`, updateData);

      return {
        platform_post_id: postId,
        status: 'published',
        metadata: updateData
      };

    } catch (error) {
      this.handleError(error, 'update post');
    }
  }

  async deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.delete(`/posts/${postId}`);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async getPost(postId: string): Promise<any> {
    try {
      const response = await this.client.get(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'get post');
    }
  }

  async getPosts(limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      const author = this.credentials.ORGANIZATION_URN 
        ? `urn:li:organization:${this.credentials.ORGANIZATION_URN}`
        : `urn:li:person:${this.credentials.USER_URN}`;

      const response = await this.client.get('/posts', {
        params: {
          q: 'author',
          author,
          count: limit,
          start: offset,
          sortBy: 'CREATED'
        }
      });

      return response.data.elements || [];
    } catch (error) {
      this.handleError(error, 'get posts');
    }
  }

  protected validateCredentials(): void {
    super.validateCredentials();
    
    const creds = this.channel.credentials as LinkedInCredentials;
    
    if (!creds.ACCESS_TOKEN) {
      throw new Error('LinkedIn ACCESS_TOKEN is required');
    }

    // Au moins un URN doit être présent
    if (!creds.USER_URN && !creds.ORGANIZATION_URN) {
      throw new Error('Either USER_URN or ORGANIZATION_URN must be provided for LinkedIn');
    }
  }
}