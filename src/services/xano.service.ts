import axios, { AxiosInstance } from 'axios';
import { XanoResponse, XanoRequest } from '../types/xano.js';
import { Channel } from '../types/channel.js';

export class XanoService {
  private client: AxiosInstance;

  constructor(baseURL: string, apiKey: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getWorkspaceChannels(workspaceId: string): Promise<Channel[]> {
    const response = await this.client.get<XanoResponse<Channel[]>>(
      '/channels',
      { params: { workspace_id: workspaceId } }
    );
    
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    
    return response.data.data || [];
  }

  async getChannel(channelId: string, workspaceId: string): Promise<Channel> {
    const response = await this.client.get<XanoResponse<Channel>>(
      `/channels/${channelId}`,
      { params: { workspace_id: workspaceId } }
    );
    
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    
    if (!response.data.data) {
      throw new Error('Channel not found');
    }
    
    return response.data.data;
  }

  async validateWorkspaceAccess(workspaceId: string, userId: string): Promise<boolean> {
    try {
      const response = await this.client.post<XanoResponse<{ has_access: boolean }>>(
        '/workspace/validate-access',
        { workspace_id: workspaceId, user_id: userId }
      );
      
      return response.data.data?.has_access || false;
    } catch {
      return false;
    }
  }

  async logActivity(data: {
    workspace_id: string;
    user_id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.client.post('/activity-log', data);
  }
}