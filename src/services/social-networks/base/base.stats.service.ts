import { Channel } from '../../../types/channel.js';
import { MetricType, MetricData } from '../../../types/metrics.js';

export interface StatsCollectionRule {
  // Règles de collecte basées sur l'âge du post
  post_age_hours: number;
  collection_frequency_minutes: number;
  metrics_to_collect: MetricType[];
  max_collections?: number; // Limite optionnelle du nombre de collectes
}

export abstract class BaseStatsService {
  protected channel: Channel;
  
  // Règles par défaut - à surcharger dans chaque implémentation
  protected abstract collectionRules: StatsCollectionRule[];

  constructor(channel: Channel) {
    this.channel = channel;
  }

  abstract collectPostMetrics(postId: string): Promise<MetricData[]>;
  abstract getAccountMetrics(): Promise<MetricData[]>;
  
  /**
   * Détermine si les métriques d'un post doivent être collectées
   * basé sur l'âge du post et les règles de collecte
   */
  shouldCollectMetrics(postCreatedAt: Date, lastCollectionAt?: Date): {
    should_collect: boolean;
    next_collection_at?: Date;
    metrics_to_collect: MetricType[];
  } {
    const postAgeHours = (Date.now() - postCreatedAt.getTime()) / (1000 * 60 * 60);
    
    // Trouve la règle applicable basée sur l'âge du post
    const applicableRule = this.collectionRules
      .sort((a, b) => b.post_age_hours - a.post_age_hours)
      .find(rule => postAgeHours >= rule.post_age_hours);

    if (!applicableRule) {
      return { should_collect: false, metrics_to_collect: [] };
    }

    // Vérifie si assez de temps s'est écoulé depuis la dernière collecte
    if (lastCollectionAt) {
      const timeSinceLastCollection = Date.now() - lastCollectionAt.getTime();
      const frequencyMs = applicableRule.collection_frequency_minutes * 60 * 1000;
      
      if (timeSinceLastCollection < frequencyMs) {
        const nextCollection = new Date(lastCollectionAt.getTime() + frequencyMs);
        return {
          should_collect: false,
          next_collection_at: nextCollection,
          metrics_to_collect: applicableRule.metrics_to_collect
        };
      }
    }

    return {
      should_collect: true,
      metrics_to_collect: applicableRule.metrics_to_collect
    };
  }

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