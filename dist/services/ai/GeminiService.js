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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const axios_1 = __importDefault(require("axios"));
const typedi_1 = require("typedi");
let GeminiService = class GeminiService {
    constructor(apiKey) {
        this.WIKI_API_BASE = 'https://en.wikipedia.org/w/api.php';
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
    async analyzeArticle(article) {
        //Short hand instead of doing article.source, article.title, article.content, article.category
        let { source, title, content, category } = article;
        if (!content) {
            //DO not tthrow error, just return article as is 
            console.log('SUMMARIZATION FAILED: Article content is required for analysis');
            return {
                ...article,
                summary: null,
                significance: null,
                sentiment: null,
                entities: null,
                future_implications: null
            };
        }
        const prompt = `
      Analyze this article from ${source || 'unknown source'} titled "${title || 'untitled'}" in the ${category || 'general'} category.
      
      Article content:
      ${content}

      Please provide a detailed analysis in JSON format with the following structure:
      {
        "title": "exact article title",
        "summary": "7-8 sentence summary of the key points",
        "future_implications": "3-4 sentences of what to look out for in the future based on this article. This can be potential impacts, opportunities, people to watch, etc. Imagine these are bullet point items. Separate each item with a new line.",
        "significance": "7-8 sentence analysis of why this matters and future implications",
        "sentiment": "sentiment of the article",
        "entities": [
          {
            "name": "entity name",
            "type": "PERSON/ORG/EVENT/PRODUCT",
            "description": "brief description of entity's role/relevance"
          }
        ],
        "location_name": "location of the article. If not mentioned, give your best guess based on the content",
        "lat" : "latitude of the location of the article. If not mentioned, give your best guess based on the content",
        "lng" : "longitude of the location of the article. If not mentioned, give your best guess based on the content",
        "category": "category of the article. Can only be one of the following: 'Politics', 'Business', 'Technology', 'Science', 'Health', 'Entertainment', 'Sports', 'Crime', 'Weather', 'Travel', 'Other'",

      }

      Ensure the summary and significance sections are thorough but concise.
      For entities, identify all key people, organizations, and events mentioned.
      For sentiment, you may only answer with "positive", "negative", or "neutral". No other words.
    `;
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        if (!response)
            throw new Error('Failed to get response from Gemini');
        const text = response.text();
        const regex = /\{[\s\S]*\}/;
        const match = text.match(regex);
        if (!match)
            throw new Error('Failed to detect JSON in response');
        try {
            const analysis = JSON.parse(match[0]);
            console.log('Article title and content:', article.title, article.content?.substring(0, 500));
            const base_article = {
                ...article,
                summary: analysis.summary,
                significance: analysis.significance,
                entities: analysis.entities.map((entity) => ({
                    name: entity.name,
                    type: entity.type,
                    description: entity.description
                })),
                sentiment: analysis.sentiment,
                category: analysis.category,
                lat: analysis.lat,
                lng: analysis.lng,
                location_name: analysis.location_name,
                future_implications: analysis.future_implications
            };
            const enhanced_article = await this.enhanceArticle(base_article);
            //Error handling if function throws an error 
            if (!enhanced_article) {
                throw new Error('Failed to enhance article');
            }
            console.log('Enhanced article:', enhanced_article);
            console.log('Enhanced article entities:', enhanced_article.entities);
            return enhanced_article;
        }
        catch (error) {
            console.error('Failed to parse Gemini response:', error);
            throw new Error('Failed to analyze article');
        }
    }
    async enhanceArticle(article) {
        // Process all entities in parallel
        await Promise.all((article.entities ?? []).map(async (entity, index) => {
            try {
                // 1. Search Wikipedia for the entity
                const wikiSearchResult = await this.searchWikipedia(entity.name);
                if (!wikiSearchResult) {
                    return; // Keep original entity if no Wikipedia page found
                }
                // 2. Get Wikipedia page content (now returns clean plain text)
                const wikiContent = await this.getWikipediaContent(wikiSearchResult.title);
                if (!wikiContent) {
                    // Update just the wiki_url if we can't get content
                    article.entities[index] = {
                        ...entity,
                        wiki_url: entity.wiki_url || `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiSearchResult.title)}`
                    };
                    return;
                }
                // Update the entity with clean Wikipedia content and URL
                article.entities[index] = {
                    ...entity,
                    description: wikiContent, // Clean plain text from Wikipedia
                    wiki_url: entity.wiki_url || `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiSearchResult.title)}`
                };
            }
            catch (error) {
                console.error(`Failed to enhance entity ${entity.name}:`, error);
                // Keep original entity if enhancement fails
            }
        }));
        return article;
    }
    async searchWikipedia(query) {
        try {
            const response = await axios_1.default.get(this.WIKI_API_BASE, {
                params: {
                    action: 'query',
                    list: 'search',
                    srsearch: query,
                    format: 'json',
                    origin: '*'
                }
            });
            const searchResults = response.data.query.search;
            if (searchResults && searchResults.length > 0) {
                return {
                    title: searchResults[0].title,
                    snippet: searchResults[0].snippet
                };
            }
            return null;
        }
        catch (error) {
            console.error('Wikipedia search failed:', error);
            return null;
        }
    }
    async getWikipediaContent(title) {
        try {
            const response = await axios_1.default.get(this.WIKI_API_BASE, {
                params: {
                    action: 'query',
                    prop: 'extracts',
                    titles: title,
                    format: 'json',
                    exintro: true, // Only get the introduction
                    explaintext: true, // Get plain text
                    origin: '*'
                }
            });
            const pages = response.data.query.pages;
            const pageId = Object.keys(pages)[0];
            const content = pages[pageId].extract;
            if (!content)
                return null;
            // Clean the text: remove extra whitespace, normalize newlines, trim
            return content
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .replace(/\n+/g, ' ') // Replace newlines with space
                .trim(); // Remove leading/trailing whitespace
        }
        catch (error) {
            console.error('Wikipedia content fetch failed:', error);
            return null;
        }
    }
};
exports.GeminiService = GeminiService;
exports.GeminiService = GeminiService = __decorate([
    (0, typedi_1.Service)('GeminiService'),
    __metadata("design:paramtypes", [String])
], GeminiService);
