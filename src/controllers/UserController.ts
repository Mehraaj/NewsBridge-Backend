import { JsonController, Post, Body, Get, Param, Put, UseBefore, CookieParam, UnauthorizedError, Res } from 'routing-controllers';
import { Service } from 'typedi';
import { UserService } from '../services/UserService';
import { AuthMiddleware } from '../middleware/auth';
import { Response } from 'express';

interface CreateUserDto {
  username: string;
  email: string;
  password: string;
}

interface UpdateUserDto {
  preferences?: any;
}

interface LoginDto {
  email: string;
  password: string;
}

interface ApiError extends Error {
  message: string;
  status?: number;
}

@JsonController('/users')
@Service()
export class UserController {
  constructor(private userService: UserService) {}

  @Post('/register')
  async createUser(@Body() body: CreateUserDto) {
    try {
      const user = await this.userService.createUser(
        body.username,
        body.email,
        body.password
      );
      return { success: true, user };
    } catch (error: unknown) {
      const apiError = error as ApiError;
      return { success: false, error: apiError.message };
    }
  }

  @Put('/profile')
  @UseBefore(AuthMiddleware)
  async updateUser(
    @CookieParam('sessionToken') token: string,
    @Body() updates: UpdateUserDto
  ) {
    try {
      const session = await this.userService.validateSession(token);
      const updatedUser = await this.userService.updateUser(session.id, updates);
      return { success: true, user: updatedUser };
    } catch (error: unknown) {
      const apiError = error as ApiError;
      if (apiError.message === 'Invalid or expired session') {
        throw new UnauthorizedError('Invalid session');
      }
      return { success: false, error: apiError.message };
    }
  }

  @Post('/loginWithGoogle')
  async loginWithGoogle(@Body() body: { token: string, provider: string }, @Res() res: Response) {
    console.log("In user controller, loginWithGoogle, body is:", body)
    const { token, provider } = body;
    const { result, sessionToken } = await this.userService.loginWithGoogle(token, provider);
    console.log("sessionToken in loginWithGoogle", sessionToken)
    res.cookie('sessionToken', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'none',
      });
    return { success: true, user: result, sessionToken: sessionToken };
  }

  @Post('/login')
  async loginUser(@Body() credentials: LoginDto, @Res() res: Response) {
    try {
      const { token, user } = await this.userService.loginUser(
        credentials.email,
        credentials.password
      );
      
      // Set the session token as a cookie
      res.cookie('sessionToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'none'
      });

      return {
        success: true,
        user,
        sessionToken: token
      };
    } catch (error: unknown) {
      const apiError = error as ApiError;
      return { success: false, error: apiError.message };
    }
  }

  @Get('/:username')
  @UseBefore(AuthMiddleware) 
  async getUser(@Param('username') username: string) {
    try {
      const user = await this.userService.getUser(username);
      return { success: true, user };
    } catch (error: unknown) {
      const apiError = error as ApiError;
      return { success: false, error: apiError.message };
    }
  }

  @Get('/current-session')
  async getCurrentSession(@CookieParam('sessionToken') token: string) {
    try {
    console.log("In user controller, getCurrentSession, token is:", token)
      const user = await this.userService.validateSession(token);
      console.log("In user controller, getCurrentSession, user is:", user)
      return { 
        success: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.log("In user controller, getCurrentSession, error is:", apiError)
      throw new UnauthorizedError('Invalid or expired session');
    }
  }
}
