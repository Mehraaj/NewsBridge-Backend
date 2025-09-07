import express from 'express';
import { Express } from 'express';
import 'reflect-metadata';
import request from 'supertest';
import { Container } from 'typedi';
import { useExpressServer, useContainer } from 'routing-controllers';
import { ArticleController } from '../../controllers/ArticleController';
import { ArticleService } from '../../services/ArticleService';
import { GeminiService } from '../../services/ai/GeminiService';
import { UserService } from '../../services/UserService';
import { IdentifiedArticle } from '../../types/article.types';
import prisma from '../../utils/prisma';
import 'dotenv/config';

describe('Simple Article Tests', () => {
  let app: Express;
  const TEST_ARTICLE_ID = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    // Connect to database
    try {
      await prisma.$connect();
      console.log('Successfully connected to test database');
    } catch (error) {
      console.error('Failed to connect to test database:', error);
      throw error;
    }

    // Create and register services - fix variable order
    const geminiService = new GeminiService('test-api-key');
    const articleService = new ArticleService(geminiService);
    
    Container.set(GeminiService, geminiService);
    Container.set(ArticleService, articleService);
    Container.set(UserService, {} as any); // Mock UserService for this test

    // Create and register controller - ArticleController expects (ArticleService, UserService)
    const controller = new ArticleController(articleService, {} as any);
    Container.set(ArticleController, controller);

    // Setup Express app
    useContainer(Container);
    const expressApp = express();
    app = useExpressServer(expressApp, {
      controllers: [ArticleController],
      defaultErrorHandler: false,
      classTransformer: true,
      validation: true
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create an article', async () => {
    const testArticle: IdentifiedArticle = {
      id: TEST_ARTICLE_ID,
      title: 'Simple Test Article',
      source: 'Test Source',
      content: 'Test Content',
      url: 'http://test.com/article1',
      published_at: new Date(),
      author: 'Test Author',
      category: 'test'
    };

    const response = await request(app)
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
    const response = await request(app)
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
