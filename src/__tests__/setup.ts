import { Container } from 'typedi';
import { ArticleService } from '../services/ArticleService';
import { GeminiService } from '../services/ai/GeminiService';

// Mock services
jest.mock('../services/ArticleService');
jest.mock('../services/ai/GeminiService');

// Register mock services
Container.set('ArticleService', new ArticleService(new GeminiService('mock-api-key')));
Container.set('GeminiService', new GeminiService('mock-api-key'));
