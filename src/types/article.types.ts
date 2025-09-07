export type NewsAPIResponse = {
    status: string;
    totalResults?: number;
    sources?: Array<{
      id: string;
      name: string;
      description: string;
      url: string;
      category: string;
      language: string;
      country: string;
    }>;
    articles?: Array<{
      source: {
        id: string;
        name: string;
      };
      author: string;
      title: string;
      description: string;
      url: string;
      urlToImage: string;
      publishedAt: string;
      content: string;
    }>;
  }

export type ArticleAnalysis = { 
    summary: string;
    key_figures: Record<string, string>;
    key_events: Record<string, string>;
    sentiment: 'positive' | 'negative' | 'neutral' | null;
    topics: string[];
    entities: string[];
}

export type IdentifiedArticle = { 
    id: string;
    source?: string | null
    title?: string | null
    url?: string | null
    image_url?: string | null
    published_at?: Date | null
    author?: string | null
    content?: string | null
    lat?: number | null
    lng?: number | null
    location_name?: string | null
    category?: string | null
}

export type Entity = {
    name: string;
    type: 'PERSON' | 'ORG' | 'EVENT' | string;
    description?: string | null;
    wiki_url?: string | null;
  };


export type SummarizedArticle = IdentifiedArticle & { 
    summary: string | null;
    significance: string | null;
    sentiment: 'positive' | 'negative' | 'neutral' | null;
    entities: Entity[] | null;
    future_implications: string | null;
}

// **************************************************



export interface CreateArticleInput {
  source?: string | null;
  title?: string | null;
  url?: string | null;
  image_url?: string | null;
  published_at?: Date | null;
  category?: string | null;
  author?: string | null;
  content?: string | null;
  summary?: string | null;
  lat?: number | null;
  lng?: number | null;
  location_name?: string | null;
}

export interface UpdateArticleInput {
  source?: string | null;
  title?: string | null;
  url?: string | null;
  image_url?: string | null;
  published_at?: Date | null;
  category?: string | null;
  author?: string | null;
  content?: string | null;
  summary?: string | null;
  lat?: number | null;
  lng?: number | null;
  location_name?: string | null;
}

export type ArticleFilters = {
  category?: string;
  author?: string;
  sources?: string;
  startDate?: Date;
  endDate?: Date;
  hasLocation?: boolean;
  tags?: string;
  search?: string;
} 



export type Paginate = {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}