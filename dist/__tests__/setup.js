"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const ArticleService_1 = require("../services/ArticleService");
const GeminiService_1 = require("../services/ai/GeminiService");
// Mock services
jest.mock('../services/ArticleService');
jest.mock('../services/ai/GeminiService');
// Register mock services
typedi_1.Container.set('ArticleService', new ArticleService_1.ArticleService(new GeminiService_1.GeminiService('mock-api-key')));
typedi_1.Container.set('GeminiService', new GeminiService_1.GeminiService('mock-api-key'));
