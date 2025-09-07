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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticleController = void 0;
const ArticleService_1 = require("../services/ArticleService");
const routing_controllers_1 = require("routing-controllers");
const typedi_1 = require("typedi");
let ArticleController = class ArticleController {
    constructor(articleService) {
        this.articleService = articleService;
        // Add this to verify the service is injected
        console.log('ArticleController constructed with service:', !!this.articleService);
    }
    // Create a new article
    async createArticle(article) {
        try {
            await this.articleService.storeArticles([article]);
            return { message: "Article created successfully", id: article.id };
        }
        catch (error) {
            console.error('Error creating article:', error);
            throw new Error(`Failed to create article: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Get fresh articles from the News API
    async getFreshArticles(filters, offset, limit) {
        console.log('Received filters:', filters);
        if (offset === undefined) {
            offset = 0;
        }
        if (limit === undefined) {
            limit = 10;
        }
        const paginate = { offset, limit };
        return await this.articleService.fetchArticles(filters, paginate);
    }
    // Get article by ID - for summarized articles 
    async getArticle(article) {
        try {
            console.log('Received article request:', article);
            console.log('Article ID:', article.id);
            // Add this log to see what's happening before the service call
            console.log('About to call articleService.getArticle');
            const articles = await this.articleService.getArticle(article.id, undefined, undefined, {
                offset: 0,
                limit: 10
            });
            // Add this log to see what we got back
            console.log('Articles returned from service:', articles);
            if (!articles || articles.length === 0) {
                throw new Error('Article not found');
            }
            return articles[0];
        }
        catch (error) {
            console.error('Error fetching article:', error);
            throw new Error(`Failed to fetch article: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Get article by title
    async getArticleByTitle(article) {
        try {
            const { id, title, source } = article;
            const articles = await this.articleService.getArticle(undefined, undefined, title ?? undefined, {
                offset: 0,
                limit: 10
            });
            if (!articles || articles.length === 0) {
                throw new Error('Article not found');
            }
            return articles[0];
        }
        catch (error) {
            console.error('Error fetching article:', error);
            throw new Error(`Failed to fetch article: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Get articles by source
    async getArticlesBySource(article) {
        try {
            const { source } = article;
            const articles = await this.articleService.getArticle(undefined, source ?? undefined, undefined, {
                offset: 0,
                limit: 10
            });
            if (!articles || articles.length === 0) {
                throw new Error('Article not found');
            }
            return articles;
        }
        catch (error) {
            console.error('Error fetching articles:', error);
            throw new Error(`Failed to fetch articles: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Update article  
    async updateArticle(article) {
        try {
            const { id } = article;
            await this.articleService.updateArticle(article);
            return article;
        }
        catch (error) {
            console.error('Error updating article:', error);
            throw new Error(`Failed to update article: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
};
exports.ArticleController = ArticleController;
__decorate([
    (0, routing_controllers_1.Post)('/'),
    (0, routing_controllers_1.HttpCode)(201),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "createArticle", null);
__decorate([
    (0, routing_controllers_1.Get)('/fresh'),
    __param(0, (0, routing_controllers_1.Body)()),
    __param(1, (0, routing_controllers_1.QueryParam)('offset')),
    __param(2, (0, routing_controllers_1.QueryParam)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "getFreshArticles", null);
__decorate([
    (0, routing_controllers_1.Get)('/'),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "getArticle", null);
__decorate([
    (0, routing_controllers_1.Get)('/title'),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "getArticleByTitle", null);
__decorate([
    (0, routing_controllers_1.Get)('/source'),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "getArticlesBySource", null);
__decorate([
    (0, routing_controllers_1.Put)('/'),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ArticleController.prototype, "updateArticle", null);
exports.ArticleController = ArticleController = __decorate([
    (0, routing_controllers_1.JsonController)('/articles'),
    (0, typedi_1.Service)('ArticleController'),
    __param(0, (0, typedi_1.Inject)('ArticleService')),
    __metadata("design:paramtypes", [ArticleService_1.ArticleService])
], ArticleController);
//   // Delete article
//   @Delete('/:id')
//   @HttpCode(204)
//   @OnUndefined(204)
//   async deleteArticle(@Param('id') id: string): Promise<void> {
//     try {
//       // Since there's no direct delete method, we'll use getArticle to check if it exists first
//       const articles = await this.articleService.getArticle(id);
//       if (!articles || articles.length === 0) {
//         throw new Error('Article not found');
//       }
//       // TODO: Implement actual deletion in ArticleService
//       throw new Error('Article deletion not implemented');
//     } catch (error) {
//       console.error('Error deleting article:', error);
//       throw new Error(`Failed to delete article: ${error instanceof Error ? error.message : String(error)}`);
//     }
//   }
//   // Get articles with filters
//   @Get('/')
//   async getArticles(
//     @Param('category') category?: string,
//     @Param('language') language?: string,
//     @Param('country') country?: string,
//     @Param('page') page: string = '1',
//     @Param('pageSize') pageSize: string = '10'
//   ): Promise<{ articles: SummarizedArticle[]; total: number }> {
//     try {
//       const filters: ArticleFilters = { category, language, country };
//       const pageNum = parseInt(page) || 1;
//       const pageSizeNum = parseInt(pageSize) || 10;
//       // Since there's no direct list method, we'll use getArticle with source undefined
//       const articles = await this.articleService.getArticle(undefined, undefined, undefined, {
//         ...filters,
//         offset: (pageNum - 1) * pageSizeNum,
//         limit: pageSizeNum
//       });
//       // TODO: Implement proper pagination in ArticleService
//       return {
//         articles,
//         total: articles.length // This is not accurate, needs proper count from service
//       };
//     } catch (error) {
//       console.error('Error fetching articles:', error);
//       throw new Error(`Failed to fetch articles: ${error instanceof Error ? error.message : String(error)}`);
//     }
//   }
//   // Add tags to article
//   async addTagsToArticle(req: Request, res: Response) {
//     try {
//       const { id } = req.params;
//       const { tags } = req.body;
//       if (!Array.isArray(tags)) {
//         return res.status(400).json({ error: 'Tags must be an array' });
//       }
//       const article = await this.articleService.addTagsToArticle(id, tags);
//       res.json(article);
//     } catch (error) {
//       console.error('Error adding tags:', error);
//       res.status(500).json({ error: 'Failed to add tags' });
//     }
//   }
//   // Remove tags from article
//   async removeTagsFromArticle(req: Request, res: Response) {
//     try {
//       const { id } = req.params;
//       const { tags } = req.body;
//       if (!Array.isArray(tags)) {
//         return res.status(400).json({ error: 'Tags must be an array' });
//       }
//       const article = await this.articleService.removeTagsFromArticle(id, tags);
//       res.json(article);
//     } catch (error) {
//       console.error('Error removing tags:', error);
//       res.status(500).json({ error: 'Failed to remove tags' });
//     }
//   }
//   // Add entities to article
//   async addEntitiesToArticle(req: Request, res: Response) {
//     try {
//       const { id } = req.params;
//       const { entities } = req.body;
//       if (!Array.isArray(entities)) {
//         return res.status(400).json({ error: 'Entities must be an array' });
//       }
//       const article = await this.articleService.addEntitiesToArticle(id, entities);
//       res.json(article);
//     } catch (error) {
//       console.error('Error adding entities:', error);
//       res.status(500).json({ error: 'Failed to add entities' });
//     }
//   }
//   // Remove entities from article
//   async removeEntitiesFromArticle(req: Request, res: Response) {
//     try {
//       const { id } = req.params;
//       const { entities } = req.body;
//       if (!Array.isArray(entities)) {
//         return res.status(400).json({ error: 'Entities must be an array' });
//       }
//       const article = await this.articleService.removeEntitiesFromArticle(id, entities);
//       res.json(article);
//     } catch (error) {
//       console.error('Error removing entities:', error);
//       res.status(500).json({ error: 'Failed to remove entities' });
//     }
//   }
//   // Add geo event to article
//   async addGeoEvent(req: Request, res: Response) {
//     try {
//       const { id } = req.params;
//       const { lat, lng, zoomLevel, label } = req.body;
//       if (typeof lat !== 'number' || typeof lng !== 'number' || typeof zoomLevel !== 'number' || typeof label !== 'string') {
//         return res.status(400).json({ error: 'Invalid geo event data' });
//       }
//       const article = await this.articleService.addGeoEvent(id, lat, lng, zoomLevel, label);
//       res.json(article);
//     } catch (error) {
//       console.error('Error adding geo event:', error);
//       res.status(500).json({ error: 'Failed to add geo event' });
//     }
//   }
//   // Remove geo event from article
//   async removeGeoEvent(req: Request, res: Response) {
//     try {
//       const { eventId } = req.params;
//       const article = await this.articleService.removeGeoEvent(eventId);
//       res.json(article);
//     } catch (error) {
//       console.error('Error removing geo event:', error);
//       res.status(500).json({ error: 'Failed to remove geo event' });
//     }
//   }
//   // Analyze article with AI
//   @Post('/analyze')
//   @HttpCode(200)
//   async analyzeArticle(
//     @Body() article: IdentifiedArticle
//   ): Promise<AnalyzeArticleResponse> {
//     // Generate a unique ID for this analysis
//     const analysisId = this.wsService.generateAnalysisId();
//     // Get initial analysis
//     const initialAnalysis = await this.geminiService.analyzeArticle(article);
//     // Start enhancement process asynchronously
//     this.enhanceArticleAsync(analysisId, initialAnalysis);
//     return {
//       analysisId,
//       initialAnalysis
//     };
//   }
//   private async enhanceArticleAsync(analysisId: string, article: SummarizedArticle) {
//     try {
//       // Perform enhancement
//       await this.geminiService.enhanceArticle(article);
//       // Send enhanced analysis through WebSocket
//       this.wsService.sendEnhancedAnalysis(analysisId, article);
//     } catch (error) {
//       console.error('Error enhancing article:', error);
//       // You might want to send an error message through WebSocket here
//       this.wsService.sendEnhancedAnalysis(analysisId, {
//         error: 'Failed to enhance article analysis'
//       });
//     }
//   }
//   // Generate article summary
//   async generateSummary(req: Request, res: Response) {
//     try {
//       const { id } = req.params;
//       const articles = await this.articleService.getArticle(id);
//       if (!articles || articles.length === 0 || !articles[0].content) {
//         return res.status(404).json({ error: 'Article not found or has no content' });
//       }
//       // TODO: Implement summary generation in GeminiService
//       res.status(501).json({ error: 'Summary generation not implemented' });
//     } catch (error) {
//       console.error('Error generating summary:', error);
//       res.status(500).json({ error: 'Failed to generate summary' });
//     }
//   }
//   // Extract entities from article
//   async extractEntities(req: Request, res: Response) {
//     try {
//       const { id } = req.params;
//       const articles = await this.articleService.getArticle(id);
//       if (!articles || articles.length === 0 || !articles[0].content) {
//         return res.status(404).json({ error: 'Article not found or has no content' });
//       }
//       // TODO: Implement entity extraction in GeminiService
//       res.status(501).json({ error: 'Entity extraction not implemented' });
//     } catch (error) {
//       console.error('Error extracting entities:', error);
//       res.status(500).json({ error: 'Failed to extract entities' });
//     }
//   }
//   // Categorize article
//   async categorizeArticle(req: Request, res: Response) {
//     try {
//       const { id } = req.params;
//       const articles = await this.articleService.getArticle(id);
//       if (!articles || articles.length === 0 || !articles[0].content) {
//         return res.status(404).json({ error: 'Article not found or has no content' });
//       }
//       // TODO: Implement article categorization in GeminiService
//       res.status(501).json({ error: 'Article categorization not implemented' });
//     } catch (error) {
//       console.error('Error categorizing article:', error);
//       res.status(500).json({ error: 'Failed to categorize article' });
//     }
//   }
// } 
