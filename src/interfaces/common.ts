// src/interfaces/common.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface NetworkAccount {
  id: string;
  networkType: SocialNetworkType;
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum SocialNetworkType {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  PINTEREST = 'pinterest'
}

export interface NetworkCapabilities {
  posting: PostingCapabilities;
  messaging: MessagingCapabilities;
  statistics: StatisticsCapabilities;
}

export interface PostingCapabilities {
  enabled: boolean;
  supportedMediaTypes: MediaType[];
  maxMediaCount: number;
  maxTextLength: number;
  supportsScheduling: boolean;
  supportsEditing: boolean;
  supportsDrafts: boolean;
}

export interface MessagingCapabilities {
  enabled: boolean;
  supportsPrivateMessages: boolean;
  supportsGroupMessages: boolean;
  supportsMediaMessages: boolean;
  supportsAutoReply: boolean;
}

export interface StatisticsCapabilities {
  enabled: boolean;
  availableMetrics: string[];
  realTimeData: boolean;
  historicalDataDays: number;
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document'
}