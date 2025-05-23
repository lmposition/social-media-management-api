// tests/unit/utils/validators.test.ts
import {
  validatePostingRequest,
  validateMessagingRequest,
  validateUrl,
  validateHashtag,
  validateMention,
  validatePagination
} from '../../../src/utils/validators';
import { MediaType } from '../../../src/interfaces/common';

describe('Validators', () => {
  describe('validatePostingRequest', () => {
    it('devrait valider une requête de posting valide', () => {
      const validRequest = {
        accountId: 'account-123',
        content: {
          text: 'Mon post de test',
          hashtags: ['test', 'api'],
          mentions: ['@user1']
        }
      };

      expect(() => validatePostingRequest(validRequest)).not.toThrow();
    });

    it('devrait rejeter un contenu vide', () => {
      const invalidRequest = {
        accountId: 'account-123',
        content: {}
      };

      expect(() => validatePostingRequest(invalidRequest)).toThrow();
    });

    it('devrait valider les médias', () => {
      const requestWithMedia = {
        accountId: 'account-123',
        content: {
          media: [
            {
              type: MediaType.IMAGE,
              url: 'https://example.com/image.jpg',
              altText: 'Description de l\'image'
            }
          ]
        }
      };

      expect(() => validatePostingRequest(requestWithMedia)).not.toThrow();
    });
  });

  describe('validateUrl', () => {
    it('devrait valider des URLs correctes', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://localhost:3000')).toBe(true);
      expect(validateUrl('https://sub.domain.com/path?query=1')).toBe(true);
    });

    it('devrait rejeter des URLs incorrectes', () => {
      expect(validateUrl('not-an-url')).toBe(false);
      expect(validateUrl('ftp://example.com')).toBe(false);
      expect(validateUrl('')).toBe(false);
    });
  });

  describe('validateHashtag', () => {
    it('devrait valider des hashtags corrects', () => {
      expect(validateHashtag('test')).toBe(true);
      expect(validateHashtag('test123')).toBe(true);
      expect(validateHashtag('test_tag')).toBe(true);
    });

    it('devrait rejeter des hashtags incorrects', () => {
      expect(validateHashtag('test-tag')).toBe(false);
      expect(validateHashtag('test tag')).toBe(false);
      expect(validateHashtag('test@tag')).toBe(false);
    });
  });

  describe('validatePagination', () => {
    it('devrait normaliser les paramètres de pagination', () => {
      expect(validatePagination(50, 10)).toEqual({ limit: 50, offset: 10 });
      expect(validatePagination(200, -5)).toEqual({ limit: 100, offset: 0 });
      expect(validatePagination()).toEqual({ limit: 20, offset: 0 });
    });
  });
});
