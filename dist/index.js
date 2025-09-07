"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const routing_controllers_1 = require("routing-controllers");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const typedi_1 = require("typedi");
const ArticleController_1 = require("./controllers/ArticleController");
const UserController_1 = require("./controllers/UserController");
const GeminiService_1 = require("./services/ai/GeminiService");
const ArticleService_1 = require("./services/ArticleService");
const UserService_1 = require("./services/UserService");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Enable CORS
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true // Important for cookies
}));
// Parse cookies
app.use((0, cookie_parser_1.default)());
// Create HTTP server
const server = (0, http_1.createServer)(app);
// Register services
typedi_1.Container.set('GOOGLE_API_KEY', process.env.GOOGLE_API_KEY);
typedi_1.Container.set(UserService_1.UserService, new UserService_1.UserService());
typedi_1.Container.set(GeminiService_1.GeminiService, new GeminiService_1.GeminiService(process.env.GOOGLE_API_KEY));
typedi_1.Container.set(ArticleService_1.ArticleService, new ArticleService_1.ArticleService(typedi_1.Container.get(GeminiService_1.GeminiService)));
(0, routing_controllers_1.useContainer)(typedi_1.Container);
// Register controllers
typedi_1.Container.set(ArticleController_1.ArticleController, new ArticleController_1.ArticleController(typedi_1.Container.get(ArticleService_1.ArticleService), typedi_1.Container.get(UserService_1.UserService)));
typedi_1.Container.set(UserController_1.UserController, new UserController_1.UserController(typedi_1.Container.get(UserService_1.UserService)));
const authorizationChecker = async (action, roles) => {
    // Example: check for sessionToken cookie
    console.log("Authorization checker running to see if user session token is valid");
    const token = action.request.cookies.sessionToken;
    console.log("In Authorized() block, sesion token from cookies is:", token);
    console.log("In Authorized() block, action.request.cookies is:", action.request.cookies);
    try {
        const user = await typedi_1.Container.get(UserService_1.UserService).validateSession(token);
        if (!user) {
            return false;
        }
        return true;
    }
    catch (error) {
        console.log("Authorization checker caught error:", error);
        return false;
    }
};
// Setup routing-controllers with proper container
(0, routing_controllers_1.useExpressServer)(app, {
    controllers: [ArticleController_1.ArticleController, UserController_1.UserController],
    validation: true,
    classTransformer: true,
    defaultErrorHandler: false,
    authorizationChecker: authorizationChecker
});
// Custom error handler
const errorHandler = (err, req, res, next) => {
    if (err instanceof routing_controllers_1.UnauthorizedError) {
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
server.listen(port, host, () => {
    console.log(`Server is running on host ${host} port ${port}`);
});
