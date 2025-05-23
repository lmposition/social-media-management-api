// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError, 
  NetworkError,
  XanoServiceError 
} from '../utils/errors';
import { ApiResponse } from '../interfaces/common';

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Erreur API:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  let statusCode = 500;
  let message = 'Erreur interne du serveur';

  // Gestion des différents types d'erreurs
  if (error instanceof ValidationError) {
    statusCode = 400;
    message = error.message;
  } else if (error instanceof AuthenticationError) {
    statusCode = 401;
    message = error.message;
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    message = error.message;
  } else if (error instanceof NetworkError) {
    statusCode = 502;
    message = 'Erreur de réseau social';
  } else if (error instanceof XanoServiceError) {
    statusCode = 503;
    message = 'Erreur de service Xano';
  } else if (error.name === 'ValidationError') {
    // Erreur Joi
    statusCode = 400;
    message = `Données invalides: ${error.message}`;
  }

  const response: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  // En développement, inclure la stack trace
  if (process.env.NODE_ENV === 'development') {
    response.data = { stack: error.stack };
  }

  res.status(statusCode).json(response);
};