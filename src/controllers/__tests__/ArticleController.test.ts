// backend/src/controllers/__tests__/ArticleController.test.ts

import { ArticleController } from '../ArticleController';
import { ArticleService } from '../../services/ArticleService';
import { GeminiService } from '../../services/ai/GeminiService';
import { UserService } from '../../services/UserService';
import { Container } from 'typedi';
import { IdentifiedArticle, SummarizedArticle } from '../../types/article.types';

describe('ArticleController', () => {
  let controller: ArticleController;
  let articleService: jest.Mocked<ArticleService>;
  let geminiService: jest.Mocked<GeminiService>;
  let userService: jest.Mocked<UserService>;

  // Common test data
  const mockArticle: IdentifiedArticle = {
    id: '1',
    title: 'Test Article',
    source: 'Test Source',
    content: 'Test Content',
    url: 'http://test.com',
    published_at: new Date(),
    author: 'Test Author',
    category: 'test'
  };

  const mockSummarizedArticle: SummarizedArticle = {
    ...mockArticle,
    summary: 'Test Summary',
    sentiment: 'neutral',
    significance: 'Test Significance',
    entities: [],
    future_implications: 'Test Future Implications'
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Get mocked services
    articleService = Container.get('ArticleService') as jest.Mocked<ArticleService>;
    geminiService = Container.get('GeminiService') as jest.Mocked<GeminiService>;
    userService = Container.get('UserService') as jest.Mocked<UserService>;
    
    // Create controller instance
    controller = new ArticleController(articleService, userService);
  });

  describe('createArticle', () => {
    it('should create article successfully', async () => {
      articleService.storeArticles.mockResolvedValue({ count: 1 });

      const result = await controller.createArticle(mockArticle);

      expect(result).toEqual({
        message: 'Article created successfully',
        id: mockArticle.id
      });
      expect(articleService.storeArticles).toHaveBeenCalledWith([mockArticle]);
    });

    it('should handle creation errors', async () => {
      articleService.storeArticles.mockRejectedValue(new Error('DB Error'));

      await expect(controller.createArticle(mockArticle))
        .rejects
        .toThrow('Failed to create article: DB Error');
    });
  });

  describe('getArticle', () => {
    it('should return article when found', async () => {
      articleService.getArticle.mockResolvedValue([mockSummarizedArticle]);

      const result = await controller.getArticle(mockArticle, {} as any);

      expect(result).toEqual(mockSummarizedArticle);
      expect(articleService.getArticle).toHaveBeenCalledWith(
        mockArticle.id,
        undefined,
        undefined,
        { offset: 0, limit: 10 }
      );
    });

    it('should throw error when article not found', async () => {
      articleService.getArticle.mockResolvedValue([]);

      await expect(controller.getArticle(mockArticle, {} as any))
        .rejects
        .toThrow('Article not found');
    });

    it('should handle service errors', async () => {
      articleService.getArticle.mockRejectedValue(new Error('Service Error'));

      await expect(controller.getArticle(mockArticle, {} as any))
        .rejects
        .toThrow('Failed to fetch article: Service Error');
    });
  });


  describe('updateArticle', () => {
    it('should update article successfully', async () => {
      articleService.updateArticle.mockResolvedValue();

      const result = await controller.updateArticle(mockSummarizedArticle);

      expect(result).toEqual(mockSummarizedArticle);
      expect(articleService.updateArticle).toHaveBeenCalledWith(mockSummarizedArticle);
    });

    it('should handle update errors', async () => {
      articleService.updateArticle.mockRejectedValue(new Error('Update Error'));

      await expect(controller.updateArticle(mockSummarizedArticle))
        .rejects
        .toThrow('Failed to update article: Update Error');
    });
  });
});