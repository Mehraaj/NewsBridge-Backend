"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleService = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const GeminiService_1 = require("./ai/GeminiService");
const typedi_1 = require("typedi");
const uuid_1 = require("uuid");
let ArticleService = class ArticleService {
    constructor(geminiService) {
        this.geminiService = geminiService;
        const newsKey = process.env.NEWS_API_KEY;
        if (!newsKey) {
            throw new Error('NEWS_API_KEY is not set');
        }
        this.baseNewsURL = `https://newsapi.org/v2/`;
        this.newsKey = newsKey;
    }
    async getSources() {
        const response = await axios_1.default.get(`${this.baseNewsURL}top-headlines/sources`, {
            params: {
                apiKey: this.newsKey,
                language: 'en',
                country: 'us'
            }
        });
        //console.log(response.data); 
        return response.data;
    }
    //bc of our API plan, we only get articles from the last 30 days. As in, the DB will have more articles not returned by this  
    async fetchArticles(filters, paginate) {
        console.log('Fetching articles with filters:', filters);
        // Convert our pagination to News API format
        const { offset = 0, limit = 12 } = paginate || {};
        const pageSize = Math.min(limit, 100); // News API max is 100
        const page = Math.floor(offset / pageSize) + 1; // Convert offset to page number
        console.log('Pagesize:', pageSize);
        console.log('Page:', page);
        try {
            const response = await axios_1.default.get(`${this.baseNewsURL}everything`, {
                params: {
                    apiKey: this.newsKey,
                    ...filters,
                    pageSize,
                    page
                }
            });
            if (response.status !== 200) {
                console.error('Error fetching articles:', response.statusText);
                return { articles: [], total: 0 };
            }
            // First, check which articles already exist in our database
            const existingArticles = await prisma_1.default.articles.findMany({
                where: {
                    url: {
                        in: response.data.articles?.map(a => a.url) ?? []
                    }
                }
            });
            console.log('Existing articles:', existingArticles.length);
            // Create a map of URL to existing article
            const existingArticleMap = new Map(existingArticles.map(a => [a.url, a]));
            // Map the response to the IdentifiedArticle type
            const articles = response.data.articles?.map((article) => {
                // If article exists, use its database ID
                const existingArticle = article.url ? existingArticleMap.get(article.url) : null;
                return {
                    id: existingArticle?.id ?? (0, uuid_1.v4)(), // Only generate new ID if article doesn't exist
                    source: article.source.name,
                    title: article.title,
                    url: article.url,
                    image_url: article.urlToImage,
                    published_at: article.publishedAt ? new Date(article.publishedAt) : null,
                    author: article.author,
                    content: article.content,
                    category: filters.category,
                    lat: null,
                    lng: null,
                    location_name: null
                };
            }) ?? [];
            console.log('Articles:', articles.length);
            // Store only new articles
            const newArticles = articles.filter(article => !existingArticleMap.has(article.url));
            if (newArticles.length > 0) {
                console.log('Storing new articles:', newArticles.length);
                await this.storeArticles(newArticles);
            }
            //combine new and existing articles
            const allArticles = [...newArticles, ...existingArticles];
            return { articles: allArticles, total: allArticles.length };
        }
        catch (error) {
            console.error('News API Error:', {
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
                headers: error?.response?.headers,
                message: error?.message,
                code: error?.code,
                url: error?.config?.url,
                params: error?.config?.params
            });
            throw error;
        }
    }
    async storeArticles(articles) {
        try {
            console.log('Storing articles in service, input:', articles);
            const result = await prisma_1.default.articles.createMany({
                data: articles.map((article) => ({
                    id: article.id,
                    source: article.source,
                    title: article.title,
                    url: article.url,
                    image_url: article.image_url,
                    published_at: article.published_at,
                    author: article.author,
                    content: article.content,
                    category: article.category,
                    lat: article.lat,
                    lng: article.lng,
                    location_name: article.location_name,
                })),
                skipDuplicates: true // Add this to handle potential duplicates
            });
            console.log('Store articles result in service:', result);
            const storedArticles = await prisma_1.default.articles.findMany({
                where: {
                    title: {
                        in: articles.map(a => a.title ?? '')
                    }
                }
            });
            console.log('Found articles in verify fetch:', storedArticles.map(a => ({ id: a.id, title: a.title, content: a.content })));
            return result;
        }
        catch (error) {
            console.error('Error storing articles in service:', error);
            throw error;
        }
    }
    async updateArticle(article) {
        // First update the article fields
        await prisma_1.default.articles.update({
            where: { id: article.id },
            data: {
                summary: article.summary,
                sentiment: article.sentiment,
                significance: article.significance
            }
        });
        // Then handle entities
        if (article.entities && article.entities.length > 0) {
            // First delete existing entity relations to avoid duplicates
            await prisma_1.default.article_entities.deleteMany({
                where: { article_id: article.id }
            });
            // For each entity, find or create it
            for (const entity of article.entities) {
                const dbEntity = await prisma_1.default.entities.upsert({
                    where: { name: entity.name },
                    update: {
                        type: entity.type,
                        description: entity.description,
                        wiki_url: entity.wiki_url
                    },
                    create: {
                        name: entity.name,
                        type: entity.type,
                        description: entity.description,
                        wiki_url: entity.wiki_url
                    }
                });
                // Create the relation using upsert to handle existing relations
                await prisma_1.default.article_entities.upsert({
                    where: {
                        article_id_entity_id: {
                            article_id: article.id,
                            entity_id: dbEntity.id
                        }
                    },
                    update: {}, // No updates needed for existing relations
                    create: {
                        article_id: article.id,
                        entity_id: dbEntity.id
                    }
                });
            }
        }
        return;
    }
    async getArticle(id, source, title, paginate) {
        const pageSize = paginate?.pageSize || 6;
        const page = paginate?.page || 1;
        const skip = (page - 1) * pageSize;
        // Build the where clause
        const where = {};
        if (id)
            where.id = id;
        if (source)
            where.source = source;
        if (title)
            where.title = title;
        // Get total count for pagination
        const totalItems = await prisma_1.default.articles.count({ where });
        const totalPages = Math.ceil(totalItems / pageSize);
        // Get the articles
        const articles = await prisma_1.default.articles.findMany({
            where,
            include: {
                article_entities: {
                    include: {
                        entities: true
                    }
                }
            },
            skip,
            take: pageSize,
            orderBy: {
                published_at: 'desc'
            }
        });
        // Process articles (summarize if needed)
        const processedArticles = await Promise.all(articles.map(async (article) => {
            if (!article.summary) {
                console.log('Article not summarized, summarizing it');
                const summarizedArticle = await this.geminiService.analyzeArticle(article);
                await this.updateArticle(summarizedArticle);
                return this.serializeArticle(summarizedArticle);
            }
            return this.serializeArticle({
                ...article,
                entities: article.article_entities.map(ae => ({
                    ...ae.entities,
                    id: ae.entities.id.toString()
                }))
            });
        }));
        // Return paginated response
        return processedArticles;
    }
    // Helper method to serialize article data
    serializeArticle(article) {
        if (!article)
            return article;
        // Helper function to convert any BigInt to string and handle dates
        const convertBigIntToString = (value) => {
            if (typeof value === 'bigint') {
                return value.toString();
            }
            if (value instanceof Date) {
                return value.toISOString();
            }
            if (Array.isArray(value)) {
                return value.map(convertBigIntToString);
            }
            if (value && typeof value === 'object') {
                const converted = {};
                for (const [key, val] of Object.entries(value)) {
                    converted[key] = convertBigIntToString(val);
                }
                return converted;
            }
            return value;
        };
        // Convert all BigInt values to strings and dates to ISO strings
        return convertBigIntToString(article);
    }
};
exports.ArticleService = ArticleService;
exports.ArticleService = ArticleService = __decorate([
    (0, typedi_1.Service)('ArticleService'),
    __param(0, (0, typedi_1.Inject)('GeminiService')),
    __metadata("design:paramtypes", [GeminiService_1.GeminiService])
], ArticleService);
