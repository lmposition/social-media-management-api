import axios, { AxiosInstance } from 'axios';
import { BaseMessagingService, MessageData, MessageResult } from '../base/base.messaging.service.js';
import { Channel } from '../../../types/channel.js';

interface LinkedInCredentials {
  ACCESS_TOKEN: string;
  USER_URN: string;
}

export class LinkedInMessagingService extends BaseMessagingService {
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

  async sendMessage(data: MessageData): Promise<MessageResult> {
    try {
      // Note: L'API de messagerie LinkedIn est très limitée et nécessite
      // des permissions spéciales. La plupart des apps ne peuvent pas envoyer de messages directs.
      
      const messageData = {
        recipients: [`urn:li:person:${data.recipient_id}`],
        message: {
          subject: data.metadata?.subject || 'Message',
          body: data.content
        },
        sender: `urn:li:person:${this.credentials.USER_URN}`
      };

      // Cette fonctionnalité nécessite l'approbation de LinkedIn
      // et n'est disponible que pour certains partenaires
      throw new Error('LinkedIn messaging API requires special partnership approval');

      // const response = await this.client.post('/messages', messageData);
      // return {
      //   platform_message_id: response.data.id,
      //   status: 'sent'
      // };

    } catch (error) {
      this.handleError(error, 'send message');
    }
  }

  async getMessages(limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      // Même limitation que pour l'envoi de messages
      throw new Error('LinkedIn messaging API requires special partnership approval');
      
      // const response = await this.client.get('/messages', {
      //   params: {
      //     q: 'participant',
      //     participant: `urn:li:person:${this.credentials.USER_URN}`,
      //     count: limit,
      //     start: offset
      //   }
      // });
      // return response.data.elements || [];

    } catch (error) {
      this.handleError(error, 'get messages');
    }
  }

  async markAsRead(messageId: string): Promise<{ success: boolean }> {
    try {
      throw new Error('LinkedIn messaging API requires special partnership approval');
    } catch (error) {
      return { success: false };
    }
  }

  protected validateCredentials(): void {
    super.validateCredentials();
    
    const creds = this.channel.credentials as LinkedInCredentials;
    
    if (!creds.ACCESS_TOKEN || !creds.USER_URN) {
      throw new Error('LinkedIn ACCESS_TOKEN and USER_URN are required for messaging');
    }
  }
}