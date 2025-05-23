// src/utils/validators.ts
import Joi from 'joi';
import { SocialNetworkType, MediaType, StatisticsPeriod } from '../interfaces/common';

// Schémas de base
export const socialNetworkTypeSchema = Joi.string().valid(...Object.values(SocialNetworkType));
export const mediaTypeSchema = Joi.string().valid(...Object.values(MediaType));
export const statisticsPeriodSchema = Joi.string().valid(...Object.values(StatisticsPeriod));

// Schéma pour un élément média
export const mediaItemSchema = Joi.object({
  id: Joi.string().optional(),
  type: mediaTypeSchema.required(),
  url: Joi.string().uri().required(),
  thumbnailUrl: Joi.string().uri().optional(),
  altText: Joi.string().max(500).optional(),
  dimensions: Joi.object({
    width: Joi.number().positive().required(),
    height: Joi.number().positive().required()
  }).optional(),
  fileSize: Joi.number().positive().optional()
});

// Schéma pour une localisation
export const locationSchema = Joi.object({
  name: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  placeId: Joi.string().optional()
});

// Schéma pour le contenu d'un post
export const postContentSchema = Joi.object({
  text: Joi.string().max(10000).optional(),
  media: Joi.array().items(mediaItemSchema).max(10).optional(),
  hashtags: Joi.array().items(Joi.string().pattern(/^[a-zA-Z0-9_]+$/)).max(30).optional(),
  mentions: Joi.array().items(Joi.string()).max(20).optional(),
  location: locationSchema.optional()
}).custom((value, helpers) => {
  // Au moins un contenu doit être fourni
  if (!value.text && (!value.media || value.media.length === 0)) {
    return helpers.error('any.custom', { 
      message: 'Au moins un texte ou un média doit être fourni' 
    });
  }
  return value;
});

// Schéma pour le contenu d'un message
export const messageContentSchema = Joi.object({
  text: Joi.string().max(5000).optional(),
  media: Joi.array().items(mediaItemSchema).max(5).optional(),
  attachments: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      type: Joi.string().required(),
      name: Joi.string().required(),
      url: Joi.string().uri().required(),
      fileSize: Joi.number().positive().optional()
    })
  ).max(3).optional()
}).custom((value, helpers) => {
  // Au moins un contenu doit être fourni
  if (!value.text && (!value.media || value.media.length === 0) && (!value.attachments || value.attachments.length === 0)) {
    return helpers.error('any.custom', { 
      message: 'Au moins un texte, un média ou un fichier joint doit être fourni' 
    });
  }
  return value;
});

// Schéma pour une requête de posting
export const postingRequestSchema = Joi.object({
  accountId: Joi.string().required(),
  content: postContentSchema.required(),
  scheduledAt: Joi.date().greater('now').optional(),
  isDraft: Joi.boolean().optional()
});

// Schéma pour une requête de messaging
export const messagingRequestSchema = Joi.object({
  accountId: Joi.string().required(),
  conversationId: Joi.string().optional(),
  recipientId: Joi.string().optional(),
  content: messageContentSchema.required(),
  replyToMessageId: Joi.string().optional()
}).custom((value, helpers) => {
  // Soit conversationId soit recipientId doit être fourni
  if (!value.conversationId && !value.recipientId) {
    return helpers.error('any.custom', { 
      message: 'conversationId ou recipientId doit être fourni' 
    });
  }
  return value;
});

// Schéma pour une requête de statistiques
export const statisticsRequestSchema = Joi.object({
  accountId: Joi.string().required(),
  postIds: Joi.array().items(Joi.string()).optional(),
  period: statisticsPeriodSchema.optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref('startDate')).optional(),
  metrics: Joi.array().items(Joi.string()).optional()
});

// Fonctions de validation utilitaires
export const validatePostingRequest = (data: any) => {
  const { error, value } = postingRequestSchema.validate(data, { abortEarly: false });
  if (error) {
    throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
  }
  return value;
};

export const validateMessagingRequest = (data: any) => {
  const { error, value } = messagingRequestSchema.validate(data, { abortEarly: false });
  if (error) {
    throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
  }
  return value;
};

export const validateStatisticsRequest = (data: any) => {
  const { error, value } = statisticsRequestSchema.validate(data, { abortEarly: false });
  if (error) {
    throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
  }
  return value;
};

// Validation des IDs
export const validateId = (id: string, fieldName = 'ID') => {
  if (!id || typeof id !== 'string' || id.length < 3) {
    throw new Error(`${fieldName} invalide`);
  }
  return id;
};

// Validation des URLs
export const validateUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validation des hashtags
export const validateHashtag = (hashtag: string) => {
  return /^[a-zA-Z0-9_]+$/.test(hashtag);
};

// Validation des mentions
export const validateMention = (mention: string) => {
  return /^@?[a-zA-Z0-9_.-]+$/.test(mention);
};

// Helpers pour la validation des capacités réseau
export const validateNetworkCapability = (
  networkType: SocialNetworkType, 
  capability: 'posting' | 'messaging' | 'statistics'
) => {
  // Cette fonction sera utilisée pour valider si un réseau supporte une fonctionnalité
  // Les règles seront définies lors de l'ajout de chaque réseau
  return true; // Placeholder
};

// Validation des tokens d'accès
export const validateAccessToken = (token: string) => {
  if (!token || typeof token !== 'string' || token.length < 10) {
    throw new Error('Token d\'accès invalide');
  }
  return token;
};

// Validation des dates
export const validateDateRange = (startDate?: Date, endDate?: Date) => {
  if (startDate && endDate && startDate >= endDate) {
    throw new Error('La date de fin doit être postérieure à la date de début');
  }
  
  if (startDate && startDate > new Date()) {
    throw new Error('La date de début ne peut pas être dans le futur');
  }
  
  return true;
};

// Validation des limites de pagination
export const validatePagination = (limit?: number, offset?: number) => {
  const validatedLimit = Math.min(Math.max(limit || 20, 1), 100);
  const validatedOffset = Math.max(offset || 0, 0);
  
  return { limit: validatedLimit, offset: validatedOffset };
};