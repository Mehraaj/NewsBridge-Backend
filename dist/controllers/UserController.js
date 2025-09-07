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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const routing_controllers_1 = require("routing-controllers");
const typedi_1 = require("typedi");
const UserService_1 = require("../services/UserService");
const auth_1 = require("../middleware/auth");
let UserController = class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    async createUser(body) {
        try {
            const user = await this.userService.createUser(body.username, body.email, body.password);
            return { success: true, user };
        }
        catch (error) {
            const apiError = error;
            return { success: false, error: apiError.message };
        }
    }
    async updateUser(token, updates) {
        try {
            const session = await this.userService.validateSession(token);
            const updatedUser = await this.userService.updateUser(session.id, updates);
            return { success: true, user: updatedUser };
        }
        catch (error) {
            const apiError = error;
            if (apiError.message === 'Invalid or expired session') {
                throw new routing_controllers_1.UnauthorizedError('Invalid session');
            }
            return { success: false, error: apiError.message };
        }
    }
    async loginUser(credentials) {
        try {
            const { token, user } = await this.userService.loginUser(credentials.email, credentials.password);
            // Set the session token as a cookie
            // Note: In your Express app setup, you'll need to configure cookie-parser
            // and set appropriate cookie options (httpOnly, secure, etc.)
            return {
                success: true,
                user,
                cookie: {
                    name: 'sessionToken',
                    value: token,
                    options: {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                        sameSite: 'strict'
                    }
                }
            };
        }
        catch (error) {
            const apiError = error;
            return { success: false, error: apiError.message };
        }
    }
    async getUser(username) {
        try {
            const user = await this.userService.getUser(username);
            return { success: true, user };
        }
        catch (error) {
            const apiError = error;
            return { success: false, error: apiError.message };
        }
    }
};
exports.UserController = UserController;
__decorate([
    (0, routing_controllers_1.Post)('/register'),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "createUser", null);
__decorate([
    (0, routing_controllers_1.Put)('/profile'),
    (0, routing_controllers_1.UseBefore)(auth_1.validateSession),
    __param(0, (0, routing_controllers_1.CookieParam)('sessionToken')),
    __param(1, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateUser", null);
__decorate([
    (0, routing_controllers_1.Post)('/login'),
    __param(0, (0, routing_controllers_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "loginUser", null);
__decorate([
    (0, routing_controllers_1.Get)('/:username'),
    (0, routing_controllers_1.UseBefore)((0, auth_1.validateSession)()),
    __param(0, (0, routing_controllers_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUser", null);
exports.UserController = UserController = __decorate([
    (0, routing_controllers_1.JsonController)('/users'),
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [UserService_1.UserService])
], UserController);
