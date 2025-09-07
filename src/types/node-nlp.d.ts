declare module 'node-nlp' {
  export interface Classification {
    intent: string;
    score: number;
  }

  export interface ProcessResult {
    classifications?: Classification[];
    language?: string;
  }

  export interface NlpManagerOptions {
    languages?: string[];
    forceNER?: boolean;
  }

  export class NlpManager {
    constructor(options?: NlpManagerOptions);
    
    addDocument(language: string, text: string, intent: string): void;
    addAnswer(language: string, intent: string, answer: string): void;
    
    train(): Promise<void>;
    save(filePath?: string): void;
    load(filePath?: string): Promise<void>;
    
    process(language: string, text: string): Promise<ProcessResult>;
  }
} 