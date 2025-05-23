import request from 'supertest';
import app from '../../../src/app';
import { xanoClient } from '../../../src/config/database';

// Mock Xano
jest.mock('../../../src/config/database');
const mockXanoClient = xanoClient as jest.Mocked<typeof xanoClient>;

describe('Posting API', () => {
  const authToken = 'Bearer test-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/posting/:accountId', () => {
    it('devrait retourner 401 sans token d\'authentification', async () => {
      const response = await request(app)
        .post('/api/posting/account-123')
        .send({
          content: {
            text: 'Test post'
          }
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('devrait retourner 400 pour des données invalides', async () => {
      const response = await request(app)
        .post('/api/posting/account-123')
        .set('Authorization', authToken)
        .send({
          content: {}  // Contenu vide
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Données invalides');
    });

    it('devrait valider les URLs de médias', async () => {
      const response = await request(app)
        .post('/api/posting/account-123')
        .set('Authorization', authToken)
        .send({
          content: {
            text: 'Test avec média',
            media: [
              {
                type: 'image',
                url: 'not-a-valid-url'  // URL invalide
              }
            ]
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/posting/:accountId/posts', () => {
    it('devrait récupérer les posts d\'un compte', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          content: { text: 'Post 1' },
          status: 'published',
          createdAt: new Date().toISOString()
        }
      ];

      mockXanoClient.get.mockResolvedValue(mockPosts);

      const response = await request(app)
        .get('/api/posting/account-123/posts')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPosts);
    });

    it('devrait supporter la pagination', async () => {
      mockXanoClient.get.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/posting/account-123/posts?limit=10&offset=20')
        .set('Authorization', authToken);

      expect(mockXanoClient.get).toHaveBeenCalledWith(
        '/accounts/account-123/posts',
        { params: { limit: 10, offset: 20 } }
      );
    });
  });
});
