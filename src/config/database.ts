// src/config/database.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getConfig } from './environment';
import { logger } from '../utils/logger';

export class XanoClient {
  private client: AxiosInstance;
  private config = getConfig();

  constructor() {
    this.client = axios.create({
      baseURL: this.config.XANO_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.XANO_API_KEY}`
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Intercepteur de requête
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Requête Xano: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Erreur requête Xano:', error);
        return Promise.reject(error);
      }
    );

    // Intercepteur de réponse
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Réponse Xano: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Erreur réponse Xano:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  public async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(endpoint, config);
    return response.data;
  }

  public async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(endpoint, data, config);
    return response.data;
  }

  public async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(endpoint, data, config);
    return response.data;
  }

  public async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(endpoint, config);
    return response.data;
  }
}

export const xanoClient = new XanoClient();