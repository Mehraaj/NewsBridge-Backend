import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import bcrypt from 'bcrypt';
import { Service } from 'typedi';
import { v4 as uuidv4 } from 'uuid';
import prisma, { withRetry } from '../utils/prisma';
import { supabase } from '../config/supabase';
import { AuthError, User } from '@supabase/supabase-js';
import { UnauthorizedError } from 'routing-controllers';

@Service('UserService')
export class UserService {
  constructor() {}

  async createUser(username: string, email: string, password: string) {
    console.log('Creating user:', username, email);
    
    // Check if user already exists in auth table 
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(email);
    if (authData?.user) {
      throw new Error('User already exists with this email');
    }

    try {
      // Create user in Supabase Auth
      console.log('Creating user in Supabase Auth...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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
      const publicUser = await prisma.public_users.create({
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
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: { preferences?: any }) {
    const updatedUser = await prisma.public_users.update({
      where: { id: userId },
      data: {
        preferences: updates.preferences as any // Type assertion needed due to Prisma's JSON handling
      }
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      preferences: updatedUser.preferences
    };
  }

  async loginWithGoogle(token: string, provider: string) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: provider,
      token: token,
    })

    if (error) {
      throw new Error('Login failed');
    }

    //if user not in our database, create them
    let user = await prisma.public_users.findUnique({
      where: { id: data.user.id }
    })
    if (user) {
      console.log('User already exists in our database');
    }

    if (!user) {
      user = await prisma.public_users.create({
        data: { id: data.user.id, name: data.user.user_metadata.name, email: data.user.email }
      })
    
    }

    //create session token 
    const sessionToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

   //create or update session in our database
   await prisma.public_sessions.upsert({
    where: { user_id: user.id },
    update: { token: sessionToken, expires: expiresAt },
    create: { user_id: user.id, token: sessionToken, expires: expiresAt }
   })

    const result = { 
      "status": "success",
      "user": user
    }
    return { result, sessionToken };
  }

  async loginUser(email: string, password: string) {
    try {
      // Use Supabase auth to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        const authError = error as AuthError;
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
      const publicUser = await prisma.public_users.findUnique({
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
      const sessionToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

      // Create or update session in our database
      await prisma.public_sessions.upsert({
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
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  async getUser(username: string) {
    const user = await prisma.public_users.findUnique({
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

  async validateSession(token: string) {
    console.log("validateSession called with token:", token)
    console.log("Token type:", typeof token)
    console.log("Token is undefined:", token === undefined)
    console.log("Token is null:", token === null)

    try {
      const session = await withRetry(async () => {
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

      console.log("Database query result:", session)
      console.log("Session is null:", session === null)

      if (!session) {
        console.log("Throwing UnauthorizedError because session is null/undefined")
        throw new UnauthorizedError('Invalid or expired session');
      }

      console.log("Found user session", session.users)
      return session.users;
    } catch (error) {
      // If it's already an UnauthorizedError, re-throw it
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      
      // For database connection errors that couldn't be retried, convert to UnauthorizedError
      console.error("Database error in validateSession:", error);
      throw new UnauthorizedError('Authentication service temporarily unavailable');
    }
  }

  async getUserBySessionToken(token: string) {
    try {
      const session = await withRetry(async () => {
        return await prisma.public_sessions.findFirst({
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
    } catch (error) {
      console.error("Database error in getUserBySessionToken:", error);
      return null;
    }
  }

  async addUserViewHistory(userId: string, articleId: string) {
    await prisma.user_article_views.create({
      data: {
        user_id: userId,
        article_id: articleId
      }
    });
  }

  async getUserViewHistory(userId: string) {
    const viewHistory = await prisma.user_article_views.findMany({
      where: { user_id: userId }
    });

    return viewHistory.map(view => view.article_id);
  }
}
