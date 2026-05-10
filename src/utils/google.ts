import { OAuth2Client } from "google-auth-library";
import { envConfig } from "../config/env";

const oauth2Client = new OAuth2Client({
  clientId: envConfig.GOOGLE_CLIENT_ID,
  clientSecret: envConfig.GOOGLE_CLIENT_SECRET,
  redirectUri: envConfig.GOOGLE_REDIRECT_URI,
});

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | undefined;
}

export const getGoogleAuthUrl = (state?: string): string => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid",
    ],
    ...(state ? { state } : {}),
  });
};

export const exchangeCodeForProfile = async (code: string): Promise<GoogleProfile> => {
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.id_token) {
    throw new Error("Google did not return an id_token");
  }
  const ticket = await oauth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: envConfig.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Invalid Google token payload");
  }
  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: payload.name || payload.email.split("@")[0]!,
    picture: payload.picture,
  };
};
