export interface ArticleAnalysis {
  summary: string;
  key_figures: Record<string, string>;
  key_events: Record<string, string>;
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  entities: string[];
}

export interface ArticleMetadata {
  content_length: number;
  summary_length: number;
  key_figures_count: number;
  key_events_count: number;
  created_at: Date;
} 