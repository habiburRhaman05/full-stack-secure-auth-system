import type { CachedUser } from "../utils/redisAuth";

declare global {
  namespace Express {
    interface Request {
      user?: CachedUser;
      auth?: {
        userId: string;
        jti: string;
        role: string;
        accessTokenExp: number;
      };
      validated?: unknown;
      rawBody?: Buffer;
    }
  }
}

export {};
