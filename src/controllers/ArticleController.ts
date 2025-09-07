import { Request, Response } from 'express';
import { ArticleService } from '../services/ArticleService';
import { GeminiService } from '../services/ai/GeminiService';

import { CreateArticleInput, UpdateArticleInput, ArticleFilters, IdentifiedArticle, SummarizedArticle } from '../types/article.types';

import { JsonController, Post, Body, Req, Get, Param, QueryParam, Delete, HttpCode, OnUndefined, Put, UseBefore, Authorized } from 'routing-controllers';
import { Inject, Service } from 'typedi';
import { UserService } from '../services/UserService';
import { AuthMiddleware} from '../middleware/auth';

interface AnalyzeArticleResponse {
  analysisId: string;
  initialAnalysis: SummarizedArticle;
}


@JsonController('/articles')
@Service('ArticleController')
export class ArticleController {
  constructor(
    @Inject('ArticleService') private articleService: ArticleService,
    @Inject('UserService') private userService: UserService
  ) {
    // Add this to verify the service is injected
    console.log('ArticleController constructed with service:', !!this.articleService);
  }

  // Create a new article
  @Post('/') 
  @HttpCode(201)
  async createArticle(@Body() article: IdentifiedArticle): Promise<{ message: string; id: string }> {
    try {
      await this.articleService.storeArticles([article]);
      return { message: "Article created successfully", id: article.id };
    } catch (error) {
      console.error('Error creating article:', error);
      throw new Error(`Failed to create article: ${error instanceof Error ? error.message : String(error) }`);
    }
  }

// Get fresh articles from the News API
@Get('/fresh')
//@UseBefore(AuthMiddleware) //QUESTION. If this is present, then the auth middleware is called but fails because it cannot see cookies, but randomly on the 4th try it does see cookies, but still fails, and then continues to not see cookies. Results FAIL
//@Authorized()
async getFreshArticles(
  @Body() filters: ArticleFilters, 
  @QueryParam('offset') offset: number, 
  @QueryParam('limit') limit: number,
  @Req() req: Request
): Promise<{ articles: SummarizedArticle[], total: number }> {

  //QUESTION: If this is present, then the auth middleware is running but cannot see where it is being called. But Results WORK. 
  // //check if the user is authenticated
  // const user = await this.userService.getUserBySessionToken(req.cookies.sessionToken);
  // console.log("Got user session token:", req.cookies.sessionToken);
  // if (!user) {
  //   throw new Error('User not found');
  // }

  //search may be in query param, so add it to filters 
  console.log("article controller search term", filters.search)
  console.log("article controller category", filters.category)
  console.log("article controller offset", offset)
  console.log("article controller limit", limit)
  //filters.search = search;
  console.log('Received filters:', filters);
  if (offset === undefined) {
    offset = 0;
  }
  if (limit === undefined) {
    limit = 10;
  }
  const paginate = { offset, limit };
  await this.articleService.fetchArticles(filters, paginate); 

  console.log('Fetched articles and stored in db, now fetching from db');

  return await this.articleService.getFilteredArticles(filters, paginate);
}

  // Get article by ID - for summarized articles 
  @Get('/')
  async getArticle(
    @Body() article: IdentifiedArticle,
    @Req() req: Request
  ): Promise<SummarizedArticle> {
    try {
      //console.log('Received article request:', article);
      console.log('Article ID:', article.id);
      
      // Add this log to see what's happening before the service call
      console.log('About to call articleService.getArticle');
      
      const articles = await this.articleService.getArticle(article.id, undefined, undefined, {
        offset: 0,
        limit: 10
      });

      // Add this log to see what we got back
      //console.log('Articles returned from service:', articles);

      if (!articles || articles.length === 0) {
        throw new Error('Article not found');
      }

      // Try to mark down that the user has fetched the article, but don't fail if session is invalid
      try {
        const user = await this.userService.getUserBySessionToken(req.cookies.sessionToken);
        console.log("Got user session token:", req.cookies.sessionToken);
        if (user) {
          await this.userService.addUserViewHistory(user.id, articles[0].id);
          console.log("added user view history");
        } else {
          console.log("No user found, skipping view history");
        }
      } catch (sessionError) {
        console.log("Session validation failed, skipping view history:", sessionError);
        // Continue without adding view history
      }

      return articles[0];

    } catch (error) {
      console.error('Error fetching article:', error);
      throw new Error(`Failed to fetch article: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  @Get('/db')
  async getDBArticles(
    @Body() filters: ArticleFilters, 
    @QueryParam('offset') offset: number, 
    @QueryParam('limit') limit: number
  ): Promise<{ articles: SummarizedArticle[], total: number }> {
    return await this.articleService.getFilteredArticles(filters, {offset, limit});
  }

  // Update article  
  @Put('/')
  async updateArticle(
    @Body() article: SummarizedArticle
  ): Promise<SummarizedArticle> {
    try {
      const { id } = article
      await this.articleService.updateArticle(article);
      return article;
    } catch (error) {
      console.error('Error updating article:', error);
      throw new Error(`Failed to update article: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  @Get('/webscrape')
  async webScrapeArticle(
    @QueryParam('url') url: string
  ): Promise<{ title: string; content: string }> {
    return await this.articleService.webScrapeArticle(url);
  }

  // Get articles for map view
  @Post('/map')
  @HttpCode(200)
  async getMapArticles(
    @Body() request: {
      bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
      };
      zoom: number;
      category?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    articles: SummarizedArticle[];
    total: number;
  }> {
    try {
      console.log('MapController: Received map request:', request);
      
      // Validate bounds
      if (!request.bounds || 
          typeof request.bounds.north !== 'number' || 
          typeof request.bounds.south !== 'number' || 
          typeof request.bounds.east !== 'number' || 
          typeof request.bounds.west !== 'number') {
        throw new Error('Invalid bounds provided');
      }
      
      // Validate zoom
      if (typeof request.zoom !== 'number' || request.zoom < 0 || request.zoom > 20) {
        throw new Error('Invalid zoom level provided');
      }

      let res = null;
      
      if (request.search === "" || request.search === undefined) {
        const result = await this.articleService.getMapArticles(
          request.bounds,
          request.zoom,
          request.category,
          request.limit || 100,
          request.offset || 0
        );
        res = result;

      } else {
        const result = await this.articleService.getMapArticles(
          request.bounds,
          request.zoom,
          request.category,
          request.limit || 100,
          request.offset || 0,
          request.search
        );
        res = result;
      }
      console.log('MapController: Returning articles:', res.articles.length);
      if (res === null) {
        throw new Error('No articles found');
      }
      return res;
    } catch (error) {
      console.error('Error fetching map articles:', error);
      
      // Return a proper error response instead of throwing
      return {
        articles: [],
        total: 0
      };
    }
  }
  
}
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