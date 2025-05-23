import { SocialNetworkType } from "./common";

// src/interfaces/statistics.ts
export interface PostStatistics {
  postId: string;
  networkPostId: string;
  networkType: SocialNetworkType;
  metrics: PostMetrics;
  lastUpdated: Date;
}

export interface PostMetrics {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  saves?: number;
  clicks?: number;
  reach?: number;
  impressions?: number;
  engagement?: number;
  engagementRate?: number;
}

export interface AccountStatistics {
  accountId: string;
  networkType: SocialNetworkType;
  metrics: AccountMetrics;
  period: StatisticsPeriod;
  lastUpdated: Date;
}

export interface AccountMetrics {
  followers?: number;
  following?: number;
  posts?: number;
  totalLikes?: number;
  totalComments?: number;
  totalShares?: number;
  totalViews?: number;
  averageEngagement?: number;
  growthRate?: number;
}

export enum StatisticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface StatisticsRequest {
  accountId: string;
  postIds?: string[];
  period: StatisticsPeriod;
  startDate?: Date;
  endDate?: Date;
  metrics?: string[];
}

export interface StatisticsUpdateRule {
  networkType: SocialNetworkType;
  postAgeHours: number;
  updateFrequencyMinutes: number;
}

export interface StatisticsResponse {
  postStatistics?: PostStatistics[];
  accountStatistics?: AccountStatistics;
  generatedAt: Date;
}