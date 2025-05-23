// tests/unit/services/xano.service.test.ts
import { XanoService } from '../../../src/services/xano.service';
import { xanoClient } from '../../../src/config/database';
import { SocialNetworkType } from '../../../src/interfaces/common';

// Mock du client Xano
jest.mock('../../../src/config/database');
const mockXanoClient = xanoClient as jest.Mocked<typeof xanoClient>;

describe('XanoService', () => {
  let xanoService: XanoService;

  beforeEach(() => {
    xanoService = new XanoService();
    jest.clearAllMocks();
  });

  describe('getNetworkAccounts', () => {
    it('devrait récupérer les comptes d\'un utilisateur', async () => {
      // Arrange
      const userId = 'user-123';
      const mockAccounts = [
        {
          id: 'account-1',
          networkType: SocialNetworkType.FACEBOOK,
          accountId: 'fb-123',
          accountName: 'Mon Compte FB',
          accessToken: 'token-123',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockXanoClient.get.mockResolvedValue(mockAccounts);

      // Act
      const result = await xanoService.getNetworkAccounts(userId);

      // Assert
      expect(mockXanoClient.get).toHaveBeenCalledWith(`/users/${userId}/accounts`);
      expect(result).toEqual(mockAccounts);
    });

    it('devrait lever une erreur si la requête échoue', async () => {
      // Arrange
      const userId = 'user-123';
      mockXanoClient.get.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(xanoService.getNetworkAccounts(userId))
        .rejects.toThrow('Impossible de récupérer les comptes');
    });
  });

  describe('savePosts', () => {
    it('devrait sauvegarder des posts en lot', async () => {
      // Arrange
      const posts = [
        {
          id: 'post-1',
          networkType: SocialNetworkType.FACEBOOK,
          accountId: 'account-1',
          content: { text: 'Test post' },
          status: 'published',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockXanoClient.post.mockResolvedValue(posts);

      // Act
      const result = await xanoService.savePosts(posts);

      // Assert
      expect(mockXanoClient.post).toHaveBeenCalledWith('/posts/batch', { posts });
      expect(result).toEqual(posts);
    });
  });
});