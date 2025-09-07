"use strict";
// backend/src/controllers/__tests__/ArticleController.test.ts
Object.defineProperty(exports, "__esModule", { value: true });
const ArticleController_1 = require("../ArticleController");
const typedi_1 = require("typedi");
describe('ArticleController', () => {
    let controller;
    let articleService;
    let geminiService;
    // Common test data
    const mockArticle = {
        id: '1',
        title: 'Test Article',
        source: 'Test Source',
        content: 'Test Content',
        url: 'http://test.com',
        published_at: new Date(),
        author: 'Test Author',
        category: 'test'
    };
    const mockSummarizedArticle = {
        ...mockArticle,
        summary: 'Test Summary',
        sentiment: 'neutral',
        significance: 'Test Significance',
        entities: []
    };
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Get mocked services
        articleService = typedi_1.Container.get('ArticleService');
        geminiService = typedi_1.Container.get('GeminiService');
        // Create controller instance
        controller = new ArticleController_1.ArticleController(articleService);
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
            const result = await controller.getArticle(mockArticle);
            expect(result).toEqual(mockSummarizedArticle);
            expect(articleService.getArticle).toHaveBeenCalledWith(mockArticle.id, undefined, undefined, { offset: 0, limit: 10 });
        });
        it('should throw error when article not found', async () => {
            articleService.getArticle.mockResolvedValue([]);
            await expect(controller.getArticle(mockArticle))
                .rejects
                .toThrow('Article not found');
        });
        it('should handle service errors', async () => {
            articleService.getArticle.mockRejectedValue(new Error('Service Error'));
            await expect(controller.getArticle(mockArticle))
                .rejects
                .toThrow('Failed to fetch article: Service Error');
        });
    });
    describe('getArticleByTitle', () => {
        it('should return article when found by title', async () => {
            articleService.getArticle.mockResolvedValue([mockSummarizedArticle]);
            const result = await controller.getArticleByTitle({ id: '1', title: 'Test Article' });
            expect(result).toEqual(mockSummarizedArticle);
            expect(articleService.getArticle).toHaveBeenCalledWith(undefined, undefined, 'Test Article', { offset: 0, limit: 10 });
        });
        it('should handle null title', async () => {
            articleService.getArticle.mockResolvedValue([mockSummarizedArticle]);
            await controller.getArticleByTitle({ id: '1', title: null });
            expect(articleService.getArticle).toHaveBeenCalledWith(undefined, undefined, undefined, { offset: 0, limit: 10 });
        });
        it('should throw error when article not found', async () => {
            articleService.getArticle.mockResolvedValue([]);
            await expect(controller.getArticleByTitle({ id: '1', title: 'Nonexistent' }))
                .rejects
                .toThrow('Article not found');
        });
    });
    describe('getArticlesBySource', () => {
        it('should return articles when found by source', async () => {
            const mockArticles = [mockSummarizedArticle, { ...mockSummarizedArticle, id: '2' }];
            articleService.getArticle.mockResolvedValue(mockArticles);
            const result = await controller.getArticlesBySource({ id: '1', source: 'Test Source' });
            expect(result).toEqual(mockArticles);
            expect(articleService.getArticle).toHaveBeenCalledWith(undefined, 'Test Source', undefined, { offset: 0, limit: 10 });
        });
        it('should handle null source', async () => {
            articleService.getArticle.mockResolvedValue([]);
            await expect(controller.getArticlesBySource({
                id: '1',
                source: null
            })).rejects.toThrow('Article not found');
            expect(articleService.getArticle).toHaveBeenCalledWith(undefined, undefined, undefined, { offset: 0, limit: 10 });
        });
        it('should throw error when no articles found', async () => {
            articleService.getArticle.mockResolvedValue([]);
            await expect(controller.getArticlesBySource({ id: '1', source: 'Nonexistent' }))
                .rejects
                .toThrow('Article not found');
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
