import prisma, { withRetry } from './prisma';
import { UnauthorizedError } from 'routing-controllers';

/**
 * Database helper functions with built-in retry logic for common operations
 */

export class DatabaseHelpers {
  /**
   * Find a session with retry logic
   */
  static async findSession(token: string) {
    return withRetry(async () => {
      return await prisma.public_sessions.findFirst({
        where: { 
          token: token,
          expires: { gt: new Date() }
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    });
  }

  /**
   * Find articles with retry logic
   */
  static async findArticles(where: any, include?: any) {
    return withRetry(async () => {
      return await prisma.articles.findMany({
        where,
        include
      });
    });
  }

  /**
   * Create or update operations with retry logic
   */
  static async upsertArticle(data: any) {
    return withRetry(async () => {
      return await prisma.articles.upsert({
        where: { url: data.url },
        update: data,
        create: data
      });
    });
  }

  /**
   * Generic retry wrapper for any prisma operation
   */
  static async withDatabaseRetry<T>(operation: () => Promise<T>): Promise<T> {
    return withRetry(operation);
  }
}

/**
 * Connection health check utility
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await withRetry(async () => {
      await prisma.$queryRaw`SELECT 1`;
    });
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Graceful database disconnect
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
} 