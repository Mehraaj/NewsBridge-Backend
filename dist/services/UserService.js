"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const typedi_1 = require("typedi");
const uuid_1 = require("uuid");
let UserService = class UserService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async createUser(username, email, password) {
        // Check if user already exists
        const existingUser = await this.prisma.users.findFirst({
            where: { email },
        });
        if (existingUser) {
            throw new Error('User already exists');
        }
        // Generate a salt and hash the password
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(password, salt);
        // Create user in our public schema
        const publicUser = await this.prisma.users.create({
            data: {
                id: (0, uuid_1.v4)(), // Generate our own UUID
                name: username,
                email,
                password: hashedPassword,
                preferences: {},
            },
        });
        return {
            id: publicUser.id,
            name: publicUser.name,
            email: publicUser.email,
        };
    }
    async updateUser(userId, updates) {
        const updatedUser = await this.prisma.users.update({
            where: { id: userId },
            data: {
                preferences: updates.preferences,
            },
        });
        return {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            preferences: updatedUser.preferences,
        };
    }
    async loginUser(email, password) {
        // First verify the user exists
        const user = await this.prisma.users.findFirst({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                password: true
            }
        });
        if (!user) {
            throw new Error('User not found');
        }
        if (!user.password) {
            throw new Error('User authentication data not found');
        }
        // Compare provided password with stored hash
        const isValidPassword = await bcrypt_1.default.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid password');
        }
        // Generate session token
        const sessionToken = (0, uuid_1.v4)();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 1 days
        // Store session token
        await this.prisma.public_sessions.upsert({
            where: { user_id: user.id },
            update: {
                token: sessionToken,
                expires: expiresAt
            },
            create: {
                user_id: user.id,
                token: sessionToken,
                expires: expiresAt
            }
        });
        return {
            token: sessionToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        };
    }
    async getUser(username) {
        const user = await this.prisma.users.findUnique({
            where: { name: username },
            select: {
                id: true,
                name: true,
                email: true,
                preferences: true,
                created_at: true,
            },
        });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    async validateSession(token) {
        const session = await this.prisma.public_sessions.findFirst({
            where: {
                token,
                expires: { gt: new Date() }
            },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!session) {
            throw new Error('Invalid or expired session');
        }
        return session.users;
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, typedi_1.Service)('UserService'),
    __metadata("design:paramtypes", [])
], UserService);
