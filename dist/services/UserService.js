"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const typedi_1 = require("typedi");
const uuid_1 = require("uuid");
const prisma_1 = __importStar(require("../utils/prisma"));
const supabase_1 = require("../config/supabase");
const routing_controllers_1 = require("routing-controllers");
let UserService = class UserService {
    constructor() { }
    async createUser(username, email, password) {
        console.log('Creating user:', username, email);
        // Check if user already exists in auth table 
        const { data: authData, error: authError } = await supabase_1.supabase.auth.admin.getUserById(email);
        if (authData?.user) {
            throw new Error('User already exists with this email');
        }
        try {
            // Create user in Supabase Auth
            console.log('Creating user in Supabase Auth...');
            const { data: authData, error: authError } = await supabase_1.supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    name: username
                }
            });
            if (authError) {
                console.error('Supabase auth error details:', {
                    message: authError.message,
                    status: authError.status,
                    name: authError.name,
                    code: authError.code
                });
                throw new Error(`Auth error: ${authError.message}`);
            }
            if (!authData?.user) {
                throw new Error('Failed to create user in auth system');
            }
            console.log('User created in auth system:', authData.user.id);
            // Create the corresponding public_users record
            console.log('Creating public user record...');
            const publicUser = await prisma_1.default.public_users.create({
                data: {
                    id: authData.user.id,
                    name: username,
                    email,
                    preferences: {},
                    created_at: new Date()
                }
            });
            console.log('User created successfully:', {
                id: publicUser.id,
                name: publicUser.name,
                email: publicUser.email
            });
            return {
                id: publicUser.id,
                name: publicUser.name,
                email: publicUser.email
            };
        }
        catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }
    async updateUser(userId, updates) {
        const updatedUser = await prisma_1.default.public_users.update({
            where: { id: userId },
            data: {
                preferences: updates.preferences // Type assertion needed due to Prisma's JSON handling
            }
        });
        return {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            preferences: updatedUser.preferences
        };
    }
    async loginWithGoogle(token, provider) {
        const { data, error } = await supabase_1.supabase.auth.signInWithIdToken({
            provider: provider,
            token: token,
        });
        if (error) {
            throw new Error('Login failed');
        }
        //if user not in our database, create them
        let user = await prisma_1.default.public_users.findUnique({
            where: { id: data.user.id }
        });
        if (user) {
            console.log('User already exists in our database');
        }
        if (!user) {
            user = await prisma_1.default.public_users.create({
                data: { id: data.user.id, name: data.user.user_metadata.name, email: data.user.email }
            });
        }
        //create session token 
        const sessionToken = (0, uuid_1.v4)();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days
        //create or update session in our database
        await prisma_1.default.public_sessions.upsert({
            where: { user_id: user.id },
            update: { token: sessionToken, expires: expiresAt },
            create: { user_id: user.id, token: sessionToken, expires: expiresAt }
        });
        const result = {
            "status": "success",
            "user": user
        };
        return { result, sessionToken };
    }
    async loginUser(email, password) {
        try {
            // Use Supabase auth to sign in
            const { data, error } = await supabase_1.supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) {
                const authError = error;
                console.error('Login error:', {
                    message: authError.message,
                    status: authError.status,
                    name: authError.name
                });
                throw new Error(`Login failed: ${authError.message}`);
            }
            if (!data?.user) {
                throw new Error('No user data returned');
            }
            // Get the user's public profile
            const publicUser = await prisma_1.default.public_users.findUnique({
                where: { id: data.user.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    preferences: true
                }
            });
            if (!publicUser) {
                throw new Error('User profile not found');
            }
            // Generate session token
            const sessionToken = (0, uuid_1.v4)();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days
            // Create or update session in our database
            await prisma_1.default.public_sessions.upsert({
                where: { user_id: publicUser.id },
                update: {
                    token: sessionToken,
                    expires: expiresAt
                },
                create: {
                    user_id: publicUser.id,
                    token: sessionToken,
                    expires: expiresAt
                }
            });
            // Return both the session token and user data
            return {
                token: sessionToken,
                user: {
                    id: publicUser.id,
                    name: publicUser.name,
                    email: publicUser.email,
                    preferences: publicUser.preferences
                }
            };
        }
        catch (error) {
            console.error('Error during login:', error);
            throw error;
        }
    }
    async getUser(username) {
        const user = await prisma_1.default.public_users.findUnique({
            where: { name: username },
            select: {
                id: true,
                name: true,
                email: true,
                preferences: true,
                created_at: true
            }
        });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    async validateSession(token) {
        console.log("validateSession called with token:", token);
        console.log("Token type:", typeof token);
        console.log("Token is undefined:", token === undefined);
        console.log("Token is null:", token === null);
        try {
            const session = await (0, prisma_1.withRetry)(async () => {
                return await prisma_1.default.public_sessions.findFirst({
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
            console.log("Database query result:", session);
            console.log("Session is null:", session === null);
            if (!session) {
                console.log("Throwing UnauthorizedError because session is null/undefined");
                throw new routing_controllers_1.UnauthorizedError('Invalid or expired session');
            }
            console.log("Found user session", session.users);
            return session.users;
        }
        catch (error) {
            // If it's already an UnauthorizedError, re-throw it
            if (error instanceof routing_controllers_1.UnauthorizedError) {
                throw error;
            }
            // For database connection errors that couldn't be retried, convert to UnauthorizedError
            console.error("Database error in validateSession:", error);
            throw new routing_controllers_1.UnauthorizedError('Authentication service temporarily unavailable');
        }
    }
    async getUserBySessionToken(token) {
        try {
            const session = await (0, prisma_1.withRetry)(async () => {
                return await prisma_1.default.public_sessions.findFirst({
                    where: {
                        token: token,
                        expires: { gt: new Date() }
                    },
                    include: {
                        users: true
                    }
                });
            });
            return session?.users || null;
        }
        catch (error) {
            console.error("Database error in getUserBySessionToken:", error);
            return null;
        }
    }
    async addUserViewHistory(userId, articleId) {
        await prisma_1.default.user_article_views.create({
            data: {
                user_id: userId,
                article_id: articleId
            }
        });
    }
    async getUserViewHistory(userId) {
        const viewHistory = await prisma_1.default.user_article_views.findMany({
            where: { user_id: userId }
        });
        return viewHistory.map(view => view.article_id);
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, typedi_1.Service)('UserService'),
    __metadata("design:paramtypes", [])
], UserService);
