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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const typedi_1 = require("typedi");
const UserService_1 = require("../services/UserService");
const routing_controllers_1 = require("routing-controllers");
let AuthMiddleware = class AuthMiddleware {
    constructor(userService) {
        this.userService = userService;
    }
    async use(req, res, next) {
        console.log("AuthMiddleware use called");
        console.log("Cookies:", req.cookies);
        const token = req.cookies.sessionToken;
        console.log("*****************SESSION TOKEN*****************", token);
        if (!token) {
            throw new routing_controllers_1.UnauthorizedError('No session token provided');
        }
        try {
            const user = await this.userService.validateSession(token);
            // Attach user to request for use in controllers
            req.user = user;
            next();
        }
        catch (error) {
            console.log("error in auth middleware", error);
            // Only clear cookie for actual authentication failures, not temporary service issues
            if (error instanceof routing_controllers_1.UnauthorizedError) {
                const isTemporaryError = error.message.includes('temporarily unavailable');
                if (!isTemporaryError) {
                    // Clear invalid session cookie only for actual auth failures
                    res.clearCookie('sessionToken');
                }
            }
            throw error;
        }
    }
};
exports.AuthMiddleware = AuthMiddleware;
exports.AuthMiddleware = AuthMiddleware = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [UserService_1.UserService])
], AuthMiddleware);
