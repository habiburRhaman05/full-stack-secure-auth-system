import { redis } from "../config/redis";

const BLACKLIST_PREFIX = "bl:access:";
const BANNED_SET_KEY = "banned_users";
const USER_CACHE_PREFIX = "user:";
const USER_CACHE_TTL_SECONDS = 60 * 5; // 5 min

/**
 * Add an access token jti to blacklist with TTL = remaining lifetime.
 */
export const blacklistJti = async (jti: string, ttlSeconds: number): Promise<void> => {
  if (ttlSeconds <= 0) return;
  await redis.set(`${BLACKLIST_PREFIX}${jti}`, "1", "EX", ttlSeconds);
};

export const isJtiBlacklisted = async (jti: string): Promise<boolean> => {
  const val = await redis.get(`${BLACKLIST_PREFIX}${jti}`);
  return val !== null;
};

// -------------- Banned users --------------
export const banUser = async (userId: string): Promise<void> => {
  await redis.sadd(BANNED_SET_KEY, userId);
};

export const unbanUser = async (userId: string): Promise<void> => {
  await redis.srem(BANNED_SET_KEY, userId);
};

export const isUserBanned = async (userId: string): Promise<boolean> => {
  const res = await redis.sismember(BANNED_SET_KEY, userId);
  return res === 1;
};

// -------------- User profile cache --------------
export interface CachedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  authProvider: string;
  avatarUrl?: string | null;
}

export const getCachedUser = async (userId: string): Promise<CachedUser | null> => {
  const raw = await redis.get(`${USER_CACHE_PREFIX}${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedUser;
  } catch {
    return null;
  }
};

export const setCachedUser = async (user: CachedUser): Promise<void> => {
  await redis.set(
    `${USER_CACHE_PREFIX}${user.id}`,
    JSON.stringify(user),
    "EX",
    USER_CACHE_TTL_SECONDS
  );
};

export const clearCachedUser = async (userId: string): Promise<void> => {
  await redis.del(`${USER_CACHE_PREFIX}${userId}`);
};
