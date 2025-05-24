import { Channel } from './channel.js';

export interface XanoResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export interface XanoRequest {
  workspace_id: string;
  user_id: string;
  [key: string]: any;
}

export interface XanoChannel extends Channel {
  // Données supplémentaires de Xano si nécessaire
}