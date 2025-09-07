"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("reflect-metadata");
const supertest_1 = __importDefault(require("supertest"));
const typedi_1 = require("typedi");
const routing_controllers_1 = require("routing-controllers");
const ArticleController_1 = require("../../controllers/ArticleController");
const ArticleService_1 = require("../../services/ArticleService");
const GeminiService_1 = require("../../services/ai/GeminiService");
const UserService_1 = require("../../services/UserService");
const prisma_1 = __importDefault(require("../../utils/prisma"));
require("dotenv/config");
describe('Simple Article Tests', () => {
    let app;
    const TEST_ARTICLE_ID = '11111111-1111-1111-1111-111111111111';
    beforeAll(async () => {
        // Connect to database
        try {
            await prisma_1.default.$connect();
            console.log('Successfully connected to test database');
        }
        catch (error) {
            console.error('Failed to connect to test database:', error);
            throw error;
        }
        // Create and register services - fix variable order
        const geminiService = new GeminiService_1.GeminiService('test-api-key');
        const articleService = new ArticleService_1.ArticleService(geminiService);
        typedi_1.Container.set(GeminiService_1.GeminiService, geminiService);
        typedi_1.Container.set(ArticleService_1.ArticleService, articleService);
        typedi_1.Container.set(UserService_1.UserService, {}); // Mock UserService for this test
        // Create and register controller - ArticleController expects (ArticleService, UserService)
        const controller = new ArticleController_1.ArticleController(articleService, {});
        typedi_1.Container.set(ArticleController_1.ArticleController, controller);
        // Setup Express app
        (0, routing_controllers_1.useContainer)(typedi_1.Container);
        const expressApp = (0, express_1.default)();
        app = (0, routing_controllers_1.useExpressServer)(expressApp, {
            controllers: [ArticleController_1.ArticleController],
            defaultErrorHandler: false,
            classTransformer: true,
            validation: true
        });
    });
    afterAll(async () => {
        await prisma_1.default.$disconnect();
    });
    it('should create an article', async () => {
        const testArticle = {
            id: TEST_ARTICLE_ID,
            title: 'Simple Test Article',
            source: 'Test Source',
            content: 'Test Content',
            url: 'http://test.com/article1',
            published_at: new Date(),
            author: 'Test Author',
            category: 'test'
        };
        const response = await (0, supertest_1.default)(app)
            .post('/articles')
            .send(testArticle)
            .expect(201);
        console.log('Create article response:', response.body);
        expect(response.body).toEqual({
            message: 'Article created successfully',
            id: TEST_ARTICLE_ID
        });
    });
    it('should fetch an article', async () => {
        const response = await (0, supertest_1.default)(app)
            .get('/articles')
            .send({ id: '123e4567-e89b-12d3-a456-426614174000' })
            .expect(200);
        console.log('Get article response:', response.body);
        expect(response.body).toMatchObject({
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Simple Test Article'
        });
    });
});
