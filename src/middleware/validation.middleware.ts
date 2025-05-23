// src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';
import { 
  SocialNetworkType, 
  MediaType, 
  StatisticsPeriod 
} from '../interfaces/common';

// Schémas de validation
const postingSchema = Joi.object({
  content: Joi.object({
    text: Joi.string().max(10000).optional(),
    media: Joi.array().items(
      Joi.object({
        type: Joi.string().valid(...Object.values(MediaType)).required(),
        url: Joi.string().uri().required(),
        altText: Joi.string().optional(),
        dimensions: Joi.object({
          width: Joi.number().positive().required(),
          height: Joi.number().positive().required()
        }).optional()
      })
    ).optional(),
    hashtags: Joi.array().items(Joi.string()).optional(),
    mentions: Joi.array().items(Joi.string()).optional(),
    location: Joi.object({
      name: Joi.string().required(),
      latitude: Joi.number().optional(),
      longitude: Joi.number().optional(),
      placeId: Joi.string().optional()
    }).optional()
  }).required(),
  scheduledAt: Joi.date().greater('now').optional(),
  isDraft: Joi.boolean().optional()
});

const messagingSchema = Joi.object({
  conversationId: Joi.string().optional(),
  recipientId: Joi.string().optional(),
  content: Joi.object({
    text: Joi.string().required(),
    media: Joi.array().items(
      Joi.object({
        type: Joi.string().valid(...Object.values(MediaType)).required(),
        url: Joi.string().uri().required()
      })
    ).optional()
  }).required(),
  replyToMessageId: Joi.string().optional()
});

// Middlewares de validation
export const validatePosting = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = postingSchema.validate(req.body);
  if (error) {
    throw new ValidationError(`Données invalides: ${error.details[0].message}`);
  }
  next();
};

export const validateMessaging = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = messagingSchema.validate(req.body);
  if (error) {
    throw new ValidationError(`Données invalides: ${error.details[0].message}`);
  }
  next();
};

export const validateAccountId = (req: Request, res: Response, next: NextFunction): void => {
  const { accountId } = req.params;
  if (!accountId || accountId.length < 3) {
    throw new ValidationError('ID de compte invalide');
  }
  next();
};

export const validatePostId = (req: Request, res: Response, next: NextFunction): void => {
  const { postId } = req.params;
  if (!postId || postId.length < 3) {
    throw new ValidationError('ID de post invalide');
  }
  next();
};

export const validateMessageId = (req: Request, res: Response, next: NextFunction): void => {
  const { messageId } = req.params;
  if (!messageId || messageId.length < 3) {
    throw new ValidationError('ID de message invalide');
  }
  next();
};