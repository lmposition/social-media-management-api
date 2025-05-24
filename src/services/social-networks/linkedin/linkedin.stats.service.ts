import axios, { AxiosInstance } from 'axios';
import { BaseStatsService, StatsCollectionRule } from '../base/base.stats.service.js';
import { Channel } from '../../../types/channel.js';
import { MetricData, MetricType } from '../../../types/metrics.js';
import { v4 as uuidv4 } from 'uuid';

interface LinkedInCredentials {
  ACCESS_TOKEN: string;
  USER_URN?: string;
  ORGANIZATION_URN?: string;
}

export class LinkedInStatsService extends BaseStatsService {
  private client: AxiosInstance;
  private credentials: LinkedInCredentials;

  // Règles de collecte LinkedIn avec votre spécification exacte
  protected collectionRules: StatsCollectionRule[] = [
    { post_age_hours: 0, collection_frequency_minutes: 5, metrics_to_collect: ['likes', 'comments', 'shares', 'views', 'impressions'] }, // 0-1h
    { post_age_hours: 1, collection_frequency_minutes: 30, metrics_to_collect: ['likes', 'comments', 'shares', 'views', 'impressions'] }, // 1-6h
    { post_age_hours: 6, collection_frequency_minutes: 60, metrics_to_collect: ['likes', 'comments', 'shares', 'views', 'impressions'] }, // 6-24h
    { post_age_hours: 24, collection_frequency_minutes: 120, metrics_to_collect: ['likes', 'comments', 'shares', 'views'] }, // 24h-3j
    { post_age_hours: 72, collection_frequency_minutes: 360, metrics_to_collect: ['likes', 'comments', 'shares', 'views'] }, // 3-7j
    { post_age_hours: 168, collection_frequency_minutes: 720, metrics_to_collect: ['likes', 'comments', 'shares'] }, // 7-14j
    { post_age_hours: 336, collection_frequency_minutes: 1440, metrics_to_collect: ['likes', 'comments', 'shares'] }, // 14-21j
    { post_age_hours: 504, collection_frequency_minutes: 2880, metrics_to_collect: ['likes', 'comments'] }, // 21-30j
    { post_age_hours: 720, collection_frequency_minutes: 10080, metrics_to_collect: ['likes', 'comments'] }, // 30j-3m
    { post_age_hours: 2160, collection_frequency_minutes: 43200, metrics_to_collect: ['likes'] }, // 3m-1an
    { post_age_hours: 8760, collection_frequency_minutes: 129600, metrics_to_collect: ['likes'] }, // 1-5ans
    { post_age_hours: 43800, collection_frequency_minutes: 525600, metrics_to_collect: ['likes'] } // 5ans+
  ];

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

  async collectPostMetrics(postId: string): Promise<MetricData[]> {
    try {
      const metrics: MetricData[] = [];
      const now = new Date().toISOString();

      // 1. Récupérer les statistiques sociales de base (likes, comments, shares)
      const socialResponse = await this.client.get(`/socialActions/${postId}`);
      const socialData = socialResponse.data;

      if (socialData.likesSummary) {
        metrics.push({
          id: uuidv4(),
          channel_id: this.channel.id,
          workspace_id: this.channel.workspace_id,
          platform: 'linkedin',
          post_id: postId,
          metric_type: 'likes',
          value: socialData.likesSummary.totalLikes || 0,
          metadata: { 
            likedByCurrentUser: socialData.likesSummary.likedByCurrentUser 
          },
          collected_at: now
        });
      }

      if (socialData.commentsSummary) {
        metrics.push({
          id: uuidv4(),
          channel_id: this.channel.id,
          workspace_id: this.channel.workspace_id,
          platform: 'linkedin',
          post_id: postId,
          metric_type: 'comments',
          value: socialData.commentsSummary.totalFirstLevelComments || 0,
          metadata: { 
            aggregatedTotalComments: socialData.commentsSummary.aggregatedTotalComments 
          },
          collected_at: now
        });
      }

      // 2. Pour les pages d'organisation, récupérer les statistiques détaillées
      if (this.credentials.ORGANIZATION_URN) {
        try {
          const shareStatsResponse = await this.client.get('/organizationalEntityShareStatistics', {
            params: {
              organizationalEntity: `urn:li:organization:${this.credentials.ORGANIZATION_URN}`,
              'shares[0]': postId
            }
          });

          const shareStats = shareStatsResponse.data.elements?.[0]?.totalShareStatistics;
          
          if (shareStats) {
            // Impressions
            if (shareStats.impressionCount !== undefined) {
              metrics.push({
                id: uuidv4(),
                channel_id: this.channel.id,
                workspace_id: this.channel.workspace_id,
                platform: 'linkedin',
                post_id: postId,
                metric_type: 'impressions',
                value: shareStats.impressionCount,
                metadata: { 
                  uniqueImpressions: shareStats.uniqueImpressionsCount 
                },
                collected_at: now
              });
            }

            // Vues (unique impressions)
            if (shareStats.uniqueImpressionsCount !== undefined) {
              metrics.push({
                id: uuidv4(),
                channel_id: this.channel.id,
                workspace_id: this.channel.workspace_id,
                platform: 'linkedin',
                post_id: postId,
                metric_type: 'views',
                value: shareStats.uniqueImpressionsCount,
                metadata: {},
                collected_at: now
              });
            }

            // Clics
            if (shareStats.clickCount !== undefined) {
              metrics.push({
                id: uuidv4(),
                channel_id: this.channel.id,
                workspace_id: this.channel.workspace_id,
                platform: 'linkedin',
                post_id: postId,
                metric_type: 'clicks',
                value: shareStats.clickCount,
                metadata: {},
                collected_at: now
              });
            }

            // Partages
            if (shareStats.shareCount !== undefined) {
              metrics.push({
                id: uuidv4(),
                channel_id: this.channel.id,
                workspace_id: this.channel.workspace_id,
                platform: 'linkedin',
                post_id: postId,
                metric_type: 'shares',
                value: shareStats.shareCount,
                metadata: { 
                  shareMentionsCount: shareStats.shareMentionsCount 
                },
                collected_at: now
              });
            }

            // Calcul du taux d'engagement
            if (shareStats.engagement !== undefined) {
              metrics.push({
                id: uuidv4(),
                channel_id: this.channel.id,
                workspace_id: this.channel.workspace_id,
                platform: 'linkedin',
                post_id: postId,
                metric_type: 'engagement_rate',
                value: shareStats.engagement * 100, // Convertir en pourcentage
                metadata: {
                  rawEngagement: shareStats.engagement,
                  totalEngagements: (shareStats.likeCount || 0) + (shareStats.commentCount || 0) + (shareStats.shareCount || 0)
                },
                collected_at: now
              });
            }
          }
        } catch (orgError) {
          // Les stats d'organisation peuvent ne pas être disponibles pour tous les comptes
          console.warn('Organization stats not available:', orgError);
        }
      }

      return metrics;

    } catch (error) {
      this.handleError(error, 'collect post metrics');
    }
  }

  async getAccountMetrics(): Promise<MetricData[]> {
    try {
      const metrics: MetricData[] = [];
      const now = new Date().toISOString();

      if (this.credentials.ORGANIZATION_URN) {
        // Statistiques de la page d'organisation
        const pageStatsResponse = await this.client.get('/organizationPageStatistics', {
          params: {
            q: 'organization',
            organization: `urn:li:organization:${this.credentials.ORGANIZATION_URN}`
          }
        });

        const pageStats = pageStatsResponse.data.elements?.[0];
        
        if (pageStats?.totalPageStatistics) {
          const stats = pageStats.totalPageStatistics;
          
          // Vues de page
          if (stats.views?.allPageViews?.pageViews !== undefined) {
            metrics.push({
              id: uuidv4(),
              channel_id: this.channel.id,
              workspace_id: this.channel.workspace_id,
              platform: 'linkedin',
              metric_type: 'views',
              value: stats.views.allPageViews.pageViews,
              metadata: { 
                type: 'page_views',
                uniquePageViews: stats.views.allPageViews.uniquePageViews 
              },
              collected_at: now
            });
          }

          // Visiteurs uniques
          if (stats.views?.allPageViews?.uniquePageViews !== undefined) {
            metrics.push({
              id: uuidv4(),
              channel_id: this.channel.id,
              workspace_id: this.channel.workspace_id,
              platform: 'linkedin',
              metric_type: 'reach',
              value: stats.views.allPageViews.uniquePageViews,
              metadata: { type: 'unique_page_visitors' },
              collected_at: now
            });
          }
        }
      }

      return metrics;

    } catch (error) {
      this.handleError(error, 'get account metrics');
    }
  }

  protected validateCredentials(): void {
    super.validateCredentials();
    
    const creds = this.channel.credentials as LinkedInCredentials;
    
    if (!creds.ACCESS_TOKEN) {
      throw new Error('LinkedIn ACCESS_TOKEN is required for stats collection');
    }
  }
}