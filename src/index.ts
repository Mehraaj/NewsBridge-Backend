import 'reflect-metadata';
import express, { ErrorRequestHandler } from 'express';
import { useContainer, useExpressServer, UnauthorizedError, Action } from 'routing-controllers';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Container } from 'typedi';
import { ArticleController } from './controllers/ArticleController';
import { UserController } from './controllers/UserController';
import { WebSocketService } from './services/WebSocketService';
import { GeminiService } from './services/ai/GeminiService';
import { ArticleService } from './services/ArticleService';
import { UserService } from './services/UserService';

dotenv.config();

const app = express();

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL ||  'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true  // Important for cookies
}));

// Parse cookies
app.use(cookieParser());

// Create HTTP server
const server = createServer(app);

// Add health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic endpoint to test server
app.get('/', (req, res) => {
  res.json({ message: 'NewsBridge Backend API', status: 'running' });
});

// Validate required environment variables
if (!process.env.GOOGLE_API_KEY) {
  console.error('GOOGLE_API_KEY environment variable is required');
  process.exit(1);
}

// Register services with error handling
try {
  Container.set('GOOGLE_API_KEY', process.env.GOOGLE_API_KEY!);
  Container.set(UserService, new UserService());
  Container.set(GeminiService, new GeminiService(process.env.GOOGLE_API_KEY!));
  Container.set(ArticleService, new ArticleService(Container.get(GeminiService)));
  console.log('Services registered successfully');
} catch (error) {
  console.error('Failed to register services:', error);
  process.exit(1);
}

useContainer(Container);

// Register controllers with error handling
try {
  Container.set(ArticleController, new ArticleController(
    Container.get(ArticleService),
    Container.get(UserService)
  ));
  Container.set(UserController, new UserController(
    Container.get(UserService)
  ));
  console.log('Controllers registered successfully');
} catch (error) {
  console.error('Failed to register controllers:', error);
  process.exit(1);
}

const authorizationChecker = async (action: Action, roles: string[]) => {
  // Example: check for sessionToken cookie
  console.log("Authorization checker running to see if user session token is valid")
  const token = action.request.cookies.sessionToken;
  console.log("In Authorized() block, sesion token from cookies is:", token)
  console.log("In Authorized() block, action.request.cookies is:", action.request.cookies)
  try {
    const user = await Container.get(UserService).validateSession(token);
    if (!user) {
      return false;
    }
    return true;
  } catch (error) {
    console.log("Authorization checker caught error:", error);
    return false;
  }
};

// Setup routing-controllers with proper container
try {
  useExpressServer(app, {
    controllers: [ArticleController, UserController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: false,
    authorizationChecker: authorizationChecker
  });
  console.log('Routing controllers configured successfully');
} catch (error) {
  console.error('Failed to setup routing controllers:', error);
  process.exit(1);
}

// Custom error handler
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof UnauthorizedError) {
    // Always return 401 status for unauthorized errors
    res.status(401).json({
      success: false,
      error: err.message
    });
    return;
  }
  
  // Handle other errors
  console.error(err);
  res.status(err.httpCode || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
};

app.use(errorHandler);

const port = parseInt(process.env.PORT || '5001', 10);
const host = process.env.HOST || '0.0.0.0';

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server with error handling
server.listen(port, host, () => {
  console.log(`Server is running on host ${host} port ${port}`);
  console.log(`Health check available at http://${host}:${port}/health`);
}).on('error', (error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
}); 