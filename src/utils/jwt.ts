/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { envConfig } from "../config/env";
import { generateJti } from "./crypto";

export type TokenType = "access" | "refresh" | "temp_2fa" | "email_verify";

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  jti: string;
  role: string;
  type: "access";
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  jti: string;
  sessionId: string;
  type: "refresh";
}

export interface Temp2FATokenPayload extends JwtPayload {
  sub: string;
  type: "temp_2fa";
}

export interface EmailVerifyTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  type: "email_verify";
}

const sign = (payload: object, secret: string, opts: SignOptions): string =>
  jwt.sign(payload, secret, opts);

// ------------------- ACCESS TOKEN -------------------
export const createAccessToken = (params: { userId: string; role: string; jti?: string }): {
  token: string;
  jti: string;
  expiresInSeconds: number;
} => {
  const jti = params.jti ?? generateJti();
  const token = sign(
    { sub: params.userId, jti, role: params.role, type: "access" },
    envConfig.ACCESS_TOKEN_SECRET,
    { expiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN } as SignOptions
  );
  const decoded = jwt.decode(token) as JwtPayload | null;
  const expiresInSeconds = decoded?.exp && decoded?.iat ? decoded.exp - decoded.iat : 15 * 60;
  return { token, jti, expiresInSeconds };
};

// ------------------- REFRESH TOKEN -------------------
export const createRefreshToken = (params: {
  userId: string;
  sessionId: string;
  jti?: string;
}): { token: string; jti: string; expiresInSeconds: number; expiresAt: Date } => {
  const jti = params.jti ?? generateJti();
  const token = sign(
    { sub: params.userId, jti, sessionId: params.sessionId, type: "refresh" },
    envConfig.REFRESH_TOKEN_SECRET,
    { expiresIn: envConfig.REFRESH_TOKEN_EXPIRES_IN } as SignOptions
  );
  const decoded = jwt.decode(token) as JwtPayload | null;
  const expiresInSeconds =
    decoded?.exp && decoded?.iat ? decoded.exp - decoded.iat : 7 * 24 * 60 * 60;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  return { token, jti, expiresInSeconds, expiresAt };
};

// ------------------- TEMP 2FA TOKEN -------------------
export const createTemp2FAToken = (userId: string): string => {
  return sign(
    { sub: userId, type: "temp_2fa" },
    envConfig.TEMP_2FA_TOKEN_SECRET,
    { expiresIn: "5m" } as SignOptions
  );
};

// ------------------- EMAIL VERIFY TOKEN -------------------
export const createEmailVerifyToken = (params: { userId: string; email: string }): string => {
  return sign(
    { sub: params.userId, email: params.email, type: "email_verify" },
    envConfig.JWT_EMAIL_TOKEN_SECRET,
    { expiresIn: "10m" } as SignOptions
  );
};

// ------------------- VERIFIERS -------------------
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, envConfig.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
  if (decoded.type !== "access") throw new Error("Invalid token type");
  return decoded;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const decoded = jwt.verify(token, envConfig.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
  if (decoded.type !== "refresh") throw new Error("Invalid token type");
  return decoded;
};

export const verifyTemp2FAToken = (token: string): Temp2FATokenPayload => {
  const decoded = jwt.verify(token, envConfig.TEMP_2FA_TOKEN_SECRET) as Temp2FATokenPayload;
  if (decoded.type !== "temp_2fa") throw new Error("Invalid token type");
  return decoded;
};

export const verifyEmailToken = (token: string): EmailVerifyTokenPayload => {
  const decoded = jwt.verify(token, envConfig.JWT_EMAIL_TOKEN_SECRET) as EmailVerifyTokenPayload;
  if (decoded.type !== "email_verify") throw new Error("Invalid token type");
  return decoded;
};

// Backwards-compatible facade
export const jwtUtils = {
  createAccessToken,
  createRefreshToken,
  createTemp2FAToken,
  createEmailVerifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyTemp2FAToken,
  verifyEmailToken,
  // legacy
  generateEmailToken: (payload: { email: string; name: string }) =>
    sign(payload, envConfig.JWT_EMAIL_TOKEN_SECRET, { expiresIn: "5m" } as SignOptions),
  decodeToken: (token: string) => jwt.decode(token) as JwtPayload,
};
