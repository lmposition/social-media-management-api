// src/interfaces/common.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
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

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document'
}

export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed',
  DELETED = 'deleted'
}

export enum StatisticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number;
}

export interface Location {
  name: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

export interface PostContent {
  text?: string;
  media?: MediaItem[];
  hashtags?: string[];
  mentions?: string[];
  location?: Location;
}

export interface MessageContent {
  text?: string;
  media?: MediaItem[];
  attachments?: AttachmentItem[];
}

export interface AttachmentItem {
  id: string;
  type: string;
  name: string;
  url: string;
  fileSize?: number;
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

export interface Post {
  id: string;
  networkType: SocialNetworkType;
  accountId: string;
  content: PostContent;
  status: PostStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  networkPostId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  networkType: SocialNetworkType;
  accountId: string;
  conversationId: string;
  senderId: string;
  recipientId?: string;
  content: MessageContent;
  isIncoming: boolean;
  isRead: boolean;
  sentAt: Date;
  readAt?: Date;
  networkMessageId: string;
}

export interface Conversation {
  id: string;
  networkType: SocialNetworkType;
  accountId: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostStatistics {
  postId: string;
  networkPostId: string;
  networkType: SocialNetworkType;
  metrics: PostMetrics;
  lastUpdated: Date;
}

export interface AccountStatistics {
  accountId: string;
  networkType: SocialNetworkType;
  metrics: AccountMetrics;
  period: StatisticsPeriod;
  lastUpdated: Date;
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

export interface PostingRequest {
  accountId: string;
  content: PostContent;
  scheduledAt?: Date;
  isDraft?: boolean;
}

export interface PostingResponse {
  postId: string;
  networkPostId?: string;
  status: PostStatus;
  publishedAt?: Date;
  url?: string;
}

export interface MessagingRequest {
  accountId: string;
  conversationId?: string;
  recipientId?: string;
  content: MessageContent;
  replyToMessageId?: string;
}

export interface MessagingResponse {
  messageId: string;
  networkMessageId: string;
  sentAt: Date;
  conversationId: string;
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