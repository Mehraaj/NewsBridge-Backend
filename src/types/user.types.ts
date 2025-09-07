export interface CreateUserInput {
  id: string;
  name?: string | null;
  email?: string | null;
  preferences?: Record<string, any> | null;
}

export interface UpdateUserInput {
  name?: string | null;
  email?: string | null;
  preferences?: Record<string, any> | null;
  last_active?: Date | null;
}

export interface UserPreferences {
  // Add specific preference types here
  theme?: 'light' | 'dark';
  notifications?: boolean;
  // Add more preferences as needed
}

export interface UserWithRelations {
  id: string;
  name?: string | null;
  email?: string | null;
  preferences?: UserPreferences | null;
  created_at?: Date | null;
  last_active?: Date | null;
  bookmark_folders?: Array<{
    id: number;
    name?: string | null;
    is_standard?: boolean | null;
    created_at?: Date | null;
    user_id?: string | null;
  }>;
  bookmarks?: Array<{
    id: number;
    article_id?: string | null;
    bookmarked_at?: Date | null;
    folder_id?: number | null;
    user_id?: string | null;
  }>;
  likes?: Array<{
    id: number;
    article_id?: string | null;
    liked_at?: Date | null;
    user_id?: string | null;
  }>;
  views?: Array<{
    id: number;
    article_id?: string | null;
    viewed_at?: Date | null;
    user_id?: string | null;
  }>;
} 