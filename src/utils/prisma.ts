import { PrismaClient } from '../../generated/prisma';

// Configure Prisma client with connection resilience settings
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// Retry utility function for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Only retry on connection-related errors
      const isConnectionError = 
        error.code === 'P1001' || // Can't reach database server
        error.code === 'P1008' || // Operations timed out
        error.code === 'P1017' || // Server has closed the connection
        error.message?.includes("Can't reach database server") ||
        error.message?.includes("Connection refused") ||
        error.message?.includes("timeout");
      
      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(`Database connection attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export default prisma; 