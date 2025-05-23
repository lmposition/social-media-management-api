import { MediaType, SocialNetworkType } from "./common";

// src/interfaces/posting.ts
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

export interface PostContent {
  text?: string;
  media?: MediaItem[];
  hashtags?: string[];
  mentions?: string[];
  location?: Location;
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

export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed',
  DELETED = 'deleted'
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