import crypto from "crypto";
import { envConfig } from "../config/env";

/**
 * Deterministic SHA-256 hash of a high-entropy token.
 * Used for refresh tokens, email verification tokens, password reset tokens
 * so we can look them up in the DB while keeping them unusable if the DB leaks.
 */
export const sha256 = (value: string): string => {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
};

/**
 * Generate a cryptographically secure random URL-safe token.
 */
export const generateRandomToken = (bytes: number = 48): string => {
  return crypto.randomBytes(bytes).toString("base64url");
};

/**
 * Generate a random hex string (for jti, ids, etc.).
 */
export const generateJti = (): string => {
  return crypto.randomUUID();
};

/**
 * Constant-time comparison helper.
 */
export const safeEqual = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

// ---------------- AES-256-GCM for TOTP secret encryption ----------------

const ALGO = "aes-256-gcm";

const getKey = (): Buffer => {
  const raw = envConfig.TOTP_ENCRYPTION_KEY;
  // Accept 32-byte hex (64 chars) or raw 32-byte string
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  return Buffer.from(raw.padEnd(32, "0").slice(0, 32), "utf8");
};

export const encryptSecret = (plaintext: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
};

export const decryptSecret = (payload: string): string => {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted payload");
  }
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
};
