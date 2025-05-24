import { Channel } from '../../../types/channel.js';

export interface MessageData {
  recipient_id: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface MessageResult {
  platform_message_id: string;
  status: 'sent' | 'failed';
  error?: string;
}

export abstract class BaseMessagingService {
  protected channel: Channel;

  constructor(channel: Channel) {
    this.channel = channel;
  }

  abstract sendMessage(data: MessageData): Promise<MessageResult>;
  abstract getMessages(limit?: number, offset?: number): Promise<any[]>;
  abstract markAsRead(messageId: string): Promise<{ success: boolean }>;

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