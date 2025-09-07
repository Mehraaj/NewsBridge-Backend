"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const node_html_parser_1 = require("node-html-parser");
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const GeminiService_1 = require("./ai/GeminiService");
const typedi_1 = require("typedi");
const uuid_1 = require("uuid");
const node_nlp_1 = require("node-nlp");
const path = __importStar(require("path"));
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
    async webScrapeArticle(url) {
        console.log("entered the webscrape article function");
        try {
            const response = await axios_1.default.get(url, {
                timeout: 10000, // 10 second timeout
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                },
            });
            const html = response.data;
            const root = (0, node_html_parser_1.parse)(html);
            console.log('got the html for the article');
            //find all html tags of h1. If not h1, then h2, if not h2, then h3. Assign this value to title. 
            let title = '';
            const h1 = root.querySelector('h1');
            const h2 = root.querySelector('h2');
            const h3 = root.querySelector('h3');
            if (h1) {
                title = h1.toString();
            }
            else if (h2) {
                title = h2.toString();
            }
            else if (h3) {
                title = h3.toString();
            }
            console.log('got the title for the article');
            //find all p tags, there will be multiple. Assign this value to content. Put a new line between each p tag.
            //put a tab before each p tag
            let content = '';
            const pTags = root.querySelectorAll('p');
            for (const p of pTags) {
                //if the p tag has a class of related-content{any characters after it}, then skip it.
                if (p.classList.contains('related-content__headline')) {
                    continue;
                }
                if (p.classList.contains('related-content__headline-text')) {
                    continue;
                }
                content += '\t' + p.toString() + '\n\n';
            }
            console.log('got the content for the article');
            //need to clean title and content to remove all html tags
            title = title.replace(/<[^>]*>?/g, '');
            content = content.replace(/<[^>]*>?/g, '');
            // Decode HTML entities
            const decodeHtmlEntities = (text) => {
                const entities = {
                    '&quot;': '"',
                    '&amp;': '&',
                    '&lt;': '<',
                    '&gt;': '>',
                    '&apos;': "'",
                    '&#x27;': "'",
                    '&#x2F;': '/',
                    '&#39;': "'",
                    '&nbsp;': ' ',
                    '&ldquo;': '"',
                    '&rdquo;': '"',
                    '&lsquo;': "'",
                    '&rsquo;': "'"
                };
                return text.replace(/&[#\w]+;/g, (entity) => {
                    return entities[entity] || entity;
                });
            };
            title = decodeHtmlEntities(title);
            content = decodeHtmlEntities(content);
            //Remove the remaining html tags from the content 
            content = content.replace(/<[^>]*>?/g, '');
            return { title: title.trim(), content: content.trim() };
        }
        catch (error) {
            console.error('Error fetching article:', error);
            return { title: '', content: '' };
        }
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
        console.log('offset:', offset);
        console.log('limit:', limit);
        const pageSize = Math.min(limit, 100); // News API max is 100
        const page = Math.floor(offset / pageSize) + 1; // Convert offset to page number
        console.log('Pagesize:', pageSize);
        console.log('Page:', page);
        try {
            let response;
            console.log('servicefilters:', filters);
            if (filters.category === 'breaking-news') {
                console.log('fetching breaking news');
                const { category, search, ...otherFilters } = filters;
                response = await axios_1.default.get(`${this.baseNewsURL}top-headlines`, {
                    params: {
                        apiKey: this.newsKey,
                        ...otherFilters,
                        q: search ? search : undefined,
                        country: 'us',
                        pageSize,
                        page,
                    }
                });
                //console.log('Breaking news response:', response.data);
            }
            else {
                const { category, search, ...otherFilters } = filters;
                response = await axios_1.default.get(`${this.baseNewsURL}everything`, {
                    params: {
                        apiKey: this.newsKey,
                        ...otherFilters,
                        q: search,
                        pageSize,
                        page,
                        language: 'en'
                    }
                });
            }
            if (response.status !== 200) {
                console.error('Error fetching articles:', response.statusText);
                return;
            }
            // First, check which articles already exist in our database
            const existingArticles = await prisma_1.default.articles.findMany({
                where: {
                    url: {
                        in: response.data.articles?.map(a => a.url) ?? []
                    }
                }
            });
            console.log('existing articles count:', existingArticles.length);
            //store articles that are not in the existing database 
            let newArticles = response.data.articles?.filter(a => !existingArticles.some(e => e.url === a.url)) ?? [];
            console.log('new articles count:', newArticles.length);
            //map to be identifed article 
            const identifiedArticles = newArticles.map(a => ({
                id: (0, uuid_1.v4)(),
                source: a.source.name,
                title: a.title,
                url: a.url,
                image_url: a.urlToImage,
                published_at: a.publishedAt ? new Date(a.publishedAt) : null,
                author: a.author,
                content: a.content,
                category: filters.category === 'breaking-news' ? '' : filters.category,
                lat: null,
                lng: null,
                location_name: null
            }));
            console.log('attempting to categorize the articles');
            await this.categorizeArticles(identifiedArticles);
            console.log('attempting to store the articles');
            await this.storeArticles(identifiedArticles);
            console.log('stored articles');
            return;
        }
        catch (error) {
            console.error('Error fetching articles:', error);
            throw error;
        }
    }
    async storeArticles(articles) {
        try {
            //console.log('Storing articles in service, input:', articles);
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
            // Update location field with PostGIS geometry for articles with coordinates
            const articlesWithLocation = articles.filter(article => article.lat !== null && article.lng !== null);
            if (articlesWithLocation.length > 0) {
                const articleIds = articlesWithLocation.map(article => article.id);
                // Update location field with PostGIS geometry
                await prisma_1.default.$executeRaw `
          UPDATE articles 
          SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
          WHERE id = ANY(${articleIds}::uuid[])
        `;
                console.log(`Updated location field for ${articlesWithLocation.length} articles with PostGIS geometry`);
            }
            //console.log('Store articles result in service:', result);
            return result;
        }
        catch (error) {
            console.error('Error storing articles in service:', error);
            throw error;
        }
    }
    async updateArticle(article) {
        // First update the article fields
        //i need to turn lat and lng into floats
        const lat = article.lat ? parseFloat(article.lat.toString()) : null;
        const lng = article.lng ? parseFloat(article.lng.toString()) : null;
        console.log('Updating article in service:', article.id);
        await prisma_1.default.articles.update({
            where: { id: article.id },
            data: {
                title: article.title,
                content: article.content,
                summary: article.summary,
                sentiment: article.sentiment,
                significance: article.significance,
                category: article.category,
                lat: lat,
                lng: lng,
                location_name: article.location_name,
                future_implications: article.future_implications
            }
        });
        // Update location field with PostGIS geometry if coordinates exist
        if (lat !== null && lng !== null) {
            await prisma_1.default.$executeRaw `
        UPDATE articles 
        SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        WHERE id = ${article.id}::uuid
      `;
            console.log(`Updated location field for article ${article.id} with PostGIS geometry`);
        }
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
                // Create the relation using create with error handling for race conditions
                try {
                    await prisma_1.default.article_entities.create({
                        data: {
                            article_id: article.id,
                            entity_id: dbEntity.id
                        }
                    });
                }
                catch (error) {
                    // If we get a unique constraint error, it means the relationship already exists
                    // This can happen due to race conditions, so we'll skip it
                    if (error.code === 'P2002') {
                        console.log(`Article-entity relationship already exists for article ${article.id} and entity ${dbEntity.id}`);
                        continue;
                    }
                    throw error; // Re-throw any other errors
                }
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
                console.log("first going to webscrape the article");
                //first webscrape the article 
                if (article.url) {
                    let { title, content } = await this.webScrapeArticle(article.url);
                    if (title !== '' || content !== '') {
                        if (article.title !== title) {
                            console.log('title mismatch, using webscraped title');
                            console.log('original title:', article.title);
                            console.log('webscraped title:', title);
                            article.title = title || article.title;
                        }
                        if (article.content !== content) {
                            console.log('content mismatch, using webscraped content');
                            //console.log('original content:', article.content);
                            //console.log('webscraped content:', content);
                            article.content = content || article.content;
                        }
                    }
                }
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
    async getFilteredArticles(filters, paginate) {
        //expand all the filters 
        let { category, startDate, endDate, author, sources, tags, search, hasLocation } = filters;
        console.log("********SEARCH TERM********", search);
        let { offset, limit } = paginate; //|| {offset: 0, limit: 6};
        console.log('getting filtered articles');
        console.log("filtered Articles offset", offset);
        console.log("filtered Articles limit", limit);
        let where = {};
        where.category = (category === 'breaking-news' || category === 'all') ? undefined : category;
        //if category is in where, I need to search for it as lowercase, and as first letter capitalized
        if (category !== 'all' && category !== 'breaking-news' && category !== undefined) {
            where.category = {
                equals: category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
                mode: 'insensitive'
            };
        }
        where.author = author ? { contains: author } : undefined;
        //I need to getSources and then get the sources from the sources array 
        const sourcesResponse = await this.getSources();
        //create a map of sources. key being the id and value being the name 
        const sourcesMap = new Map(sourcesResponse.sources?.map(s => [s.id, s.name]));
        //console.log('sourcesMap:', sourcesMap);
        //take the sources string and split it by comma and trim each source. Then map it to be its name 
        const sourcesArray = sources?.split(',').map(s => s.trim()).map(s => sourcesMap.get(s) || '');
        //console.log('sourcesArray:', sourcesArray);
        where.source = sourcesArray ? {
            in: sourcesArray
        } : undefined;
        where.tags = tags ? {
            in: tags.split(',').map(t => t.trim())
        } : undefined;
        where.location_name = hasLocation ? { contains: hasLocation } : undefined;
        // Search across multiple fields
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                { summary: { contains: search, mode: 'insensitive' } }
            ];
        }
        // // Map date filters to published_at field. If there is no start date, then set it to 10 days ago . If there is no end date, then set it to tomorrow.
        // if (!startDate) {
        //   startDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        // }
        // if (!endDate) {
        //   endDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        // }
        if (startDate || endDate) {
            where.published_at = {};
            if (startDate)
                where.published_at.gte = startDate;
            if (endDate)
                where.published_at.lte = endDate;
        }
        console.log('where:', where);
        //get the articles from the database. But I only want to get articles that follow the pagination details offset and limit. 
        const articles = await prisma_1.default.articles.findMany({
            where: where,
            skip: offset,
            take: limit,
            include: {
                article_entities: {
                    include: {
                        entities: true
                    }
                }
            }
        });
        console.log('got from DB articles:', articles.length);
        return {
            articles: articles.map(a => this.serializeArticle({
                ...a,
                entities: a.article_entities.map(ae => ({ ...ae.entities, id: ae.entities.id.toString() }))
            })),
            total: articles.length
        };
    }
    async categorizeArticles(articles) {
        // Load the trained model
        const manager = new node_nlp_1.NlpManager({ languages: ['en'], forceNER: false });
        const modelPath = path.join(__dirname, '../../NLPTraining/model.nlp');
        await manager.load(modelPath);
        console.log('loaded the model');
        // Process each article
        for (const article of articles) {
            const textToAnalyze = `${article.title} ${article.content || ''}`.trim();
            if (!textToAnalyze)
                continue;
            const result = await manager.process('en', textToAnalyze);
            const bestMatch = result.classifications?.[0];
            if (bestMatch && bestMatch.score > 0.3) {
                const category = bestMatch.intent.charAt(0).toUpperCase() + bestMatch.intent.slice(1).toLowerCase();
                console.log(`Article "${article.title}" categorized as: ${category} (${(bestMatch.score * 100).toFixed(1)}%)`);
                article.category = category;
            }
            else {
                console.log(`Article "${article.title}" not categorized`);
                //call a fallback function to categorize the article
                await this.fallbackCategorize(article);
            }
        }
    }
    async fallbackCategorize(article) {
        const textToAnalyze = `${article.title} ${article.content || ''}`.toLowerCase().trim();
        if (!textToAnalyze)
            return;
        // Optimized keywords with better coverage and weighted importance
        const keywords = {
            Technology: {
                words: ['technology', 'tech', 'gadget', 'innovation', 'software', 'hardware', 'ai', 'artificial intelligence', 'machine learning', 'blockchain', 'programming', 'coding', 'developer', 'algorithm', 'data', 'digital', 'computer', 'internet', 'app', 'platform', 'startup', 'cybersecurity'],
                weight: 1.2
            },
            Environment: {
                words: ['environment', 'climate', 'ecology', 'sustainability', 'green', 'eco', 'pollution', 'air quality', 'water quality', 'waste', 'recycling', 'carbon', 'emissions', 'renewable', 'solar', 'wind', 'energy', 'conservation', 'wildlife', 'forest', 'ocean'],
                weight: 1.1
            },
            Business: {
                words: ['business', 'company', 'market', 'economy', 'finance', 'stock', 'investment', 'profit', 'revenue', 'earnings', 'quarterly', 'merger', 'acquisition', 'ceo', 'executive', 'corporate', 'industry', 'sector', 'trading', 'portfolio'],
                weight: 1.0
            },
            Politics: {
                words: ['politics', 'government', 'election', 'policy', 'congress', 'legislation', 'president', 'prime minister', 'senator', 'representative', 'democrat', 'republican', 'campaign', 'vote', 'ballot', 'democracy', 'parliament', 'minister', 'official'],
                weight: 1.0
            },
            Science: {
                words: ['science', 'research', 'experiment', 'discovery', 'scientist', 'university', 'academia', 'study', 'analysis', 'laboratory', 'hypothesis', 'theory', 'evidence', 'peer-reviewed', 'journal', 'publication', 'innovation'],
                weight: 1.1
            },
            Health: {
                words: ['health', 'medicine', 'medical', 'fitness', 'nutrition', 'wellness', 'doctor', 'hospital', 'pharmacy', 'treatment', 'therapy', 'disease', 'patient', 'clinical', 'vaccine', 'drug', 'surgery', 'diagnosis'],
                weight: 1.0
            },
            Entertainment: {
                words: ['entertainment', 'movie', 'film', 'tv', 'television', 'music', 'artist', 'actor', 'actress', 'celebrity', 'hollywood', 'broadway', 'concert', 'album', 'show', 'series', 'drama', 'comedy', 'award'],
                weight: 1.0
            },
            Crime: {
                words: ['crime', 'police', 'law', 'court', 'judge', 'lawyer', 'attorney', 'criminal', 'arrest', 'investigation', 'evidence', 'trial', 'verdict', 'sentence', 'prison', 'jail', 'felony', 'misdemeanor'],
                weight: 1.0
            },
            Weather: {
                words: ['weather', 'storm', 'hurricane', 'tornado', 'earthquake', 'flood', 'fire', 'disaster', 'forecast', 'temperature', 'rain', 'snow', 'wind', 'climate', 'meteorology', 'atmospheric'],
                weight: 1.0
            },
            Sports: {
                words: ['sports', 'football', 'basketball', 'tennis', 'golf', 'baseball', 'soccer', 'cricket', 'hockey', 'rugby', 'olympics', 'championship', 'tournament', 'game', 'match', 'player', 'team', 'coach', 'athlete'],
                weight: 1.0
            },
            Travel: {
                words: ['travel', 'vacation', 'destination', 'tourism', 'hotel', 'flight', 'airline', 'airport', 'resort', 'beach', 'mountain', 'adventure', 'trip', 'journey', 'explore', 'visit', 'tourist'],
                weight: 1.0
            }
        };
        // Create a word frequency map for faster lookup
        const wordFrequency = {};
        const words = textToAnalyze.split(/\s+/).filter(word => word.length > 2); // Filter out short words
        for (const word of words) {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
        // Calculate weighted scores for each category
        const categoryScores = {};
        for (const [category, config] of Object.entries(keywords)) {
            let score = 0;
            for (const keyword of config.words) {
                if (wordFrequency[keyword]) {
                    score += wordFrequency[keyword] * config.weight;
                }
            }
            if (score > 0) {
                categoryScores[category] = score;
            }
        }
        // Find the category with the highest score
        const bestCategory = Object.entries(categoryScores)
            .sort(([, a], [, b]) => b - a)[0];
        // Update the article category if we found a confident match
        if (bestCategory && bestCategory[1] >= 1.0) {
            console.log(`Article "${article.title}" fallback categorized as: ${bestCategory[0]} (score: ${bestCategory[1].toFixed(2)})`);
            article.category = bestCategory[0];
        }
        else {
            console.log(`Article "${article.title}" could not be categorized with keywords`);
        }
    }
    // ===== OLD CLUSTER-BASED IMPLEMENTATION (COMMENTED OUT) =====
    /*
    async getMapClusters(
      bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
      },
      zoom: number,
      category?: string,
      limit: number = 50
    ): Promise<{
      clusters: Array<{
        id: string;
        coordinates: [number, number];
        point_count: number;
        articles: SummarizedArticle[];
        bounds: {
          north: number;
          south: number;
          east: number;
          west: number;
        };
      }>;
      total_articles: number;
    }> {
      try {
        console.log('ArticleService: Getting map clusters for bounds:', bounds, 'zoom:', zoom);
        
        // Determine cluster radius based on zoom level
        const clusterRadius = this.getClusterRadiusDegrees(zoom);
        console.log('ArticleService: Using cluster radius (degrees):', clusterRadius);
        
        // Build category filter
        let categoryFilter = '';
        if (category && category !== 'all') {
          const categoryValue = category === 'Breaking News' ? 'breaking-news' :
            category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
          categoryFilter = `AND category = '${categoryValue}'`;
        }
        
        // Use PostGIS spatial queries for optimal performance at scale
        let query: any;
        let params: any[];
        
        if (categoryFilter) {
          // Query with category filter
          query = Prisma.sql`
            WITH bounds_geom AS (
              SELECT ST_MakeEnvelope(${bounds.west}, ${bounds.south}, ${bounds.east}, ${bounds.north}, 4326) AS geom
            ),
            articles_with_location AS (
              SELECT
                id,
                title,
                content,
                summary,
                sentiment,
                significance,
                category,
                author,
                source,
                url,
                image_url,
                published_at,
                lat,
                lng,
                location_name,
                ST_SetSRID(ST_MakePoint(lng, lat), 4326) AS geom
              FROM articles
              WHERE location IS NOT NULL
                AND lat BETWEEN ${bounds.south} AND ${bounds.north}
                AND lng BETWEEN ${bounds.west} AND ${bounds.east}
                AND category = ${category === 'Breaking News' ? 'breaking-news' : (category ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase() : '')}
            ),
            clustered_points AS (
              SELECT
                CASE
                  WHEN ${zoom} >= 14 THEN
                    -- High zoom: show individual articles
                    id::text
                  ELSE
                    -- Lower zoom: create clusters using grid-based clustering
                    'cluster_' ||
                    FLOOR((lat - ${bounds.south}) / ${clusterRadius}) || '_' ||
                    FLOOR((lng - ${bounds.west}) / ${clusterRadius})
                END AS cluster_id,
                id,
                title,
                content,
                summary,
                sentiment,
                significance,
                category,
                author,
                source,
                url,
                image_url,
                published_at,
                lat,
                lng,
                location_name,
                geom
              FROM articles_with_location
            ),
            cluster_summary AS (
              SELECT
                cluster_id,
                COUNT(*) as point_count,
                ST_Centroid(ST_Collect(geom)) AS center_geom,
                ST_Envelope(ST_Collect(geom)) AS bounds_geom,
                array_agg(id ORDER BY published_at DESC) AS article_ids
              FROM clustered_points
              GROUP BY cluster_id
            )
            SELECT
              cs.cluster_id,
              cs.point_count,
              ST_X(cs.center_geom) as center_lng,
              ST_Y(cs.center_geom) as center_lat,
              ST_XMin(cs.bounds_geom) as bounds_west,
              ST_XMax(cs.bounds_geom) as bounds_east,
              ST_YMin(cs.bounds_geom) as bounds_south,
              ST_YMax(cs.bounds_geom) as bounds_north,
              cs.article_ids
            FROM cluster_summary cs
            ORDER BY cs.point_count DESC
            LIMIT ${limit}
          `;
        } else {
          // Query without category filter
          query = Prisma.sql`
            WITH bounds_geom AS (
              SELECT ST_MakeEnvelope(${bounds.west}, ${bounds.south}, ${bounds.east}, ${bounds.north}, 4326) AS geom
            ),
            articles_with_location AS (
              SELECT
                id,
                title,
                content,
                summary,
                sentiment,
                significance,
                category,
                author,
                source,
                url,
                image_url,
                published_at,
                lat,
                lng,
                location_name,
                ST_SetSRID(ST_MakePoint(lng, lat), 4326) AS geom
              FROM articles
              WHERE location IS NOT NULL
                AND lat BETWEEN ${bounds.south} AND ${bounds.north}
                AND lng BETWEEN ${bounds.west} AND ${bounds.east}
            ),
            clustered_points AS (
              SELECT
                CASE
                  WHEN ${zoom} >= 14 THEN
                    -- High zoom: show individual articles
                    id::text
                  ELSE
                    -- Lower zoom: create clusters using grid-based clustering
                    'cluster_' ||
                    FLOOR((lat - ${bounds.south}) / ${clusterRadius}) || '_' ||
                    FLOOR((lng - ${bounds.west}) / ${clusterRadius})
                END AS cluster_id,
                id,
                title,
                content,
                summary,
                sentiment,
                significance,
                category,
                author,
                source,
                url,
                image_url,
                published_at,
                lat,
                lng,
                location_name,
                geom
              FROM articles_with_location
            ),
            cluster_summary AS (
              SELECT
                cluster_id,
                COUNT(*) as point_count,
                ST_Centroid(ST_Collect(geom)) AS center_geom,
                ST_Envelope(ST_Collect(geom)) AS bounds_geom,
                array_agg(id ORDER BY published_at DESC) AS article_ids
              FROM clustered_points
              GROUP BY cluster_id
            )
            SELECT
              cs.cluster_id,
              cs.point_count,
              ST_X(cs.center_geom) as center_lng,
              ST_Y(cs.center_geom) as center_lat,
              ST_XMin(cs.bounds_geom) as bounds_west,
              ST_XMax(cs.bounds_geom) as bounds_east,
              ST_YMin(cs.bounds_geom) as bounds_south,
              ST_YMax(cs.bounds_geom) as bounds_north,
              cs.article_ids
            FROM cluster_summary cs
            ORDER BY cs.point_count DESC
            LIMIT ${limit}
          `;
        }
        
        // Execute the spatial query
        const result = await prisma.$queryRaw<any[]>(query);
        
        console.log('ArticleService: PostGIS query returned clusters:', result.length);
        
        if (result.length === 0) {
          return {
            clusters: [],
            total_articles: 0
          };
        }
        
        // Get detailed article data for each cluster
        const clusters = await Promise.all(
          result.map(async (cluster) => {
            // Get full article data with entities
            const articles = await prisma.articles.findMany({
              where: {
                id: {
                  in: cluster.article_ids
                }
              },
              include: {
                article_entities: {
                  include: {
                    entities: true
                  }
                }
              },
              orderBy: {
                published_at: 'desc'
              },
              take: 5 // Limit articles per cluster for performance
            });
            
            // Serialize articles
            const serializedArticles = articles.map(article => this.serializeArticle({
              ...article,
              entities: article.article_entities.map((ae: any) => ({
                ...ae.entities,
                id: ae.entities.id.toString()
              }))
            }));
            
            return {
              id: cluster.cluster_id,
              coordinates: [cluster.center_lng, cluster.center_lat] as [number, number],
              point_count: parseInt(cluster.point_count),
              articles: serializedArticles,
              bounds: {
                north: parseFloat(cluster.bounds_north),
                south: parseFloat(cluster.bounds_south),
                east: parseFloat(cluster.bounds_east),
                west: parseFloat(cluster.bounds_west)
              }
            };
          })
        );
        
        // Calculate total articles across all clusters
        const total_articles = clusters.reduce((sum, cluster) => sum + cluster.point_count, 0);
        
        console.log('ArticleService: Created PostGIS-optimized clusters:', clusters.length, 'total articles:', total_articles);
        
        return {
          clusters,
          total_articles
        };
        
      } catch (error) {
        console.error('ArticleService: Error in getMapClusters:', error);
        throw error;
      }
    }
    */
    // ===== NEW ARTICLE-BASED IMPLEMENTATION =====
    /**
     * Get articles for map view with spatial filtering
     * Returns articles directly instead of clusters for frontend flexibility
     */
    async getMapArticles(bounds, zoom, category, limit = 200, offset = 0, search) {
        try {
            console.log('ArticleService: Getting map articles for bounds:', bounds, 'zoom:', zoom, 'category:', category, 'limit:', limit, 'offset:', offset, 'search:', search);
            if (search) {
                console.log('ArticleService: Searching for articles with search:', search);
            }
            // Build the where clause for spatial and category filtering
            const where = {
                // Spatial filtering - check for coordinates
                lat: {
                    not: null,
                    gte: bounds.south,
                    lte: bounds.north
                },
                lng: {
                    not: null,
                    gte: bounds.west,
                    lte: bounds.east
                }
            };
            // adjust the where clause to look for serach in title, summary, content, and source
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { summary: { contains: search, mode: 'insensitive' } },
                    { content: { contains: search, mode: 'insensitive' } },
                    { source: { contains: search, mode: 'insensitive' } }
                ];
            }
            // Category filtering
            if (category && category !== 'all') {
                const categoryValue = category === 'Breaking News' ? 'breaking-news' :
                    category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
                where.category = categoryValue;
            }
            console.log('ArticleService: Database query where clause:', where);
            // Get total count for pagination
            const totalCount = await prisma_1.default.articles.count({ where });
            console.log('ArticleService: Total articles in bounds:', totalCount);
            // Get articles with entities using Prisma
            const articles = await prisma_1.default.articles.findMany({
                where,
                include: {
                    article_entities: {
                        include: {
                            entities: true
                        }
                    }
                },
                orderBy: {
                    published_at: 'desc'
                },
                skip: offset,
                take: limit
            });
            console.log('ArticleService: Found articles with location:', articles.length);
            // Serialize articles
            const serializedArticles = articles.map(article => this.serializeArticle({
                ...article,
                entities: article.article_entities.map((ae) => ({
                    ...ae.entities,
                    id: ae.entities.id.toString()
                }))
            }));
            console.log('ArticleService: Returning articles:', serializedArticles.length, 'of', totalCount);
            return {
                articles: serializedArticles,
                total: totalCount
            };
        }
        catch (error) {
            console.error('ArticleService: Error in getMapArticles:', error);
            throw error;
        }
    }
};
exports.ArticleService = ArticleService;
exports.ArticleService = ArticleService = __decorate([
    (0, typedi_1.Service)('ArticleService'),
    __param(0, (0, typedi_1.Inject)('GeminiService')),
    __metadata("design:paramtypes", [GeminiService_1.GeminiService])
], ArticleService);
