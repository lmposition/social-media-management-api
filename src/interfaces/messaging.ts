import { SocialNetworkType } from "./common";
import { MediaItem } from "./posting";

// src/interfaces/messaging.ts
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