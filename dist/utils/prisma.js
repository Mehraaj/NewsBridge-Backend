"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
const prisma_1 = require("../../generated/prisma");
// Configure Prisma client with connection resilience settings
const prisma = new prisma_1.PrismaClient({
    log: ['warn', 'error'],
});
// Retry utility function for database operations
async function withRetry(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            // Only retry on connection-related errors
            const isConnectionError = error.code === 'P1001' || // Can't reach database server
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
    throw lastError;
}
exports.default = prisma;
