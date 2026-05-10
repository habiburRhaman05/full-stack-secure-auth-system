import { z } from "zod";

const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const registerUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long").max(100),
  email: z.string().email("Please provide a valid email address"),
  password: strongPassword,
  agreeTerms: z.literal(true, { message: "You must agree to the terms" }),
  role: z.enum(["customer", "admin", "moderator", "support"]).optional(),
});

const loginUserSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric"),
});

const resendVerificationSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

const verify2FASchema = z.object({
  tempToken: z.string().min(1, "Temporary token is required"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: strongPassword,
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: strongPassword,
});

const linkPasswordSchema = z.object({
  newPassword: strongPassword,
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

const revokeSessionSchema = z.object({
  sessionId: z.string().uuid("Invalid session id"),
});

export const authSchemas = {
  registerUserSchema,
  loginUserSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  verify2FASchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  linkPasswordSchema,
  updateProfileSchema,
  revokeSessionSchema,
};
