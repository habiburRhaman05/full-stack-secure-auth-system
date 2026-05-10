import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { sendError } from "../utils/apiResponse";
import { CookieUtils } from "../utils/cookie";
import { verifyAccessToken } from "../utils/jwt";
import {
  clearCachedUser,
  getCachedUser,
  isJtiBlacklisted,
  isUserBanned,
  setCachedUser,
} from "../utils/redisAuth";
import { ACCESS_COOKIE_NAME } from "../utils/token";

const extractAccessToken = (req: Request): string | null => {
  const fromCookie = CookieUtils.getCookie(req, ACCESS_COOKIE_NAME);
  if (fromCookie) return fromCookie;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
};

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractAccessToken(req);
    if (!token) {
      sendError(res, { statusCode: 401, message: "Unauthorized: missing access token" });
      return;
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        sendError(res, { statusCode: 401, message: "Access token expired" });
        return;
      }
      sendError(res, { statusCode: 401, message: "Invalid access token" });
      return;
    }

    if (await isJtiBlacklisted(decoded.jti)) {
      sendError(res, { statusCode: 401, message: "Token has been revoked" });
      return;
    }

    if (await isUserBanned(decoded.sub)) {
      sendError(res, { statusCode: 403, message: "Account is banned" });
      return;
    }

    let cached = await getCachedUser(decoded.sub);
    if (!cached) {
      const user = await prisma.user.findFirst({
        where: { id: decoded.sub, deletedAt: null },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          emailVerified: true,
          twoFactorEnabled: true,
          authProvider: true,
          avatarUrl: true,
        },
      });
      if (!user) {
        sendError(res, { statusCode: 401, message: "User not found" });
        return;
      }
      if (user.status === "banned") {
        sendError(res, { statusCode: 403, message: "Account is banned" });
        return;
      }
      cached = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        authProvider: user.authProvider,
        avatarUrl: user.avatarUrl ?? null,
      };
      await setCachedUser(cached);
    }

    req.user = cached;
    req.auth = {
      userId: cached.id,
      jti: decoded.jti,
      role: cached.role,
      accessTokenExp: decoded.exp ?? 0,
    };
    res.locals.user = cached;
    res.locals.auth = req.auth;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    sendError(res, { statusCode: 500, message: "Internal server error during authentication" });
  }
};

/**
 * Require a specific role (or any of several roles).
 * Usage: authorize("admin"), authorize("admin", "moderator")
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, { statusCode: 401, message: "Unauthorized" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, { statusCode: 403, message: "Forbidden: insufficient permissions" });
      return;
    }
    next();
  };
};

/** Invalidate a user's cache entry. Call after profile updates / role change / ban. */
export const invalidateUserCache = (userId: string): Promise<void> => clearCachedUser(userId);

// Legacy alias
export const roleMiddleware = (roles: string[]) => authorize(...roles);
