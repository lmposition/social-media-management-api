// src/config/environment.ts
export interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: string;
  XANO_API_URL: string;
  XANO_API_KEY: string;
  LOG_LEVEL: string;
  ALLOWED_ORIGINS: string;
}

export const validateEnvironment = (): void => {
  const requiredVars = [
    'XANO_API_URL',
    'XANO_API_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Variables d'environnement manquantes: ${missingVars.join(', ')}`);
  }
};

export const getConfig = (): EnvironmentConfig => ({
  PORT: parseInt(process.env.PORT || '3000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  XANO_API_URL: process.env.XANO_API_URL!,
  XANO_API_KEY: process.env.XANO_API_KEY!,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000'
});