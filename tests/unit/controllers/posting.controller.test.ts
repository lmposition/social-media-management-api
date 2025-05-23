// tests/unit/controllers/posting.controller.test.ts
import { Request, Response, NextFunction } from 'express';
import { PostingController } from '../../../src/controllers/posting.controller';
import { xanoService } from '../../../src/services/xano.service';
import { networkRegistry } from '../../../src/services/base-network.service';
import { SocialNetworkType } from '../../../src/interfaces/common';

// Mocks
jest.mock('../../../src/services/xano.service');
jest.mock('../../../src/services/base-network.service');

const mockXanoService = xanoService as jest.Mocked<typeof xanoService>;
const mockNetworkRegistry = networkRegistry as jest.Mocked<typeof networkRegistry>;

describe('PostingController', () => {
  let controller: PostingController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new PostingController();
    mockReq = {
      params: {},
      body: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('publishPost', () => {
    it('devrait publier un post avec succès', async () => {
      // Arrange
      mockReq.params = { accountId: 'account-123' };
      mockReq.body = {
        content: {
          text: 'Mon premier post'
        }
      };

      const mockAccount = {
        id: 'account-123',
        networkType: SocialNetworkType.FACEBOOK,
        accountId: 'fb-123',
        isActive: true
      };

      const mockNetworkService = {
        supportsPosting: jest.fn().mockReturnValue(true),
        publishPost: jest.fn().mockResolvedValue({
          postId: 'post-123',
          networkPostId: 'fb-post-456',
          status: 'published',
          publishedAt: new Date()
        })
      };

      mockXanoService.getNetworkAccount.mockResolvedValue(mockAccount);
      mockNetworkRegistry.isSupported.mockReturnValue(true);
      mockNetworkRegistry.get.mockReturnValue(mockNetworkService as any);
      mockXanoService.savePosts.mockResolvedValue([]);

      // Act
      await controller.publishPost(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Post publié avec succès'
        })
      );
    });

    it('devrait gérer les erreurs de réseau non supporté', async () => {
      // Arrange
      mockReq.params = { accountId: 'account-123' };
      mockReq.body = { content: { text: 'Test' } };

      const mockAccount = {
        id: 'account-123',
        networkType: SocialNetworkType.FACEBOOK,
        isActive: true
      };

      mockXanoService.getNetworkAccount.mockResolvedValue(mockAccount);
      mockNetworkRegistry.isSupported.mockReturnValue(false);

      // Act
      await controller.publishPost(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('non supporté')
        })
      );
    });
  });
});