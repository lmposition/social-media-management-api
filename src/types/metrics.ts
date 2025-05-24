import { SocialPlatform } from "./channel";

export interface MetricData {
  id: string;
  channel_id: string;
  workspace_id: string;
  platform: SocialPlatform;
  post_id?: string;
  metric_type: MetricType;
  value: number;
  metadata: Record<string, any>;
  collected_at: string;
  post_created_at?: string;
}

export type MetricType = 
  | 'likes'
  | 'comments' 
  | 'shares'
  | 'views'
  | 'clicks'
  | 'impressions'
  | 'engagement_rate'
  | 'reach';

export interface StatsRequest {
  workspace_id: string;
  channel_ids?: string[];
  metrics: MetricType[];
  period: {
    start_date: string;
    end_date: string;
  };
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export interface StatsResponse {
  metrics: {
    [key in MetricType]?: {
      current_value: number;
      previous_value?: number;
      change_percentage?: number;
      data_points: Array<{
        date: string;
        value: number;
      }>;
    };
  };
}