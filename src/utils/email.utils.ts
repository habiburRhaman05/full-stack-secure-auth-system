import ejs from "ejs";
import path from "path";
import bcrypt from "bcrypt";
import { type MailType, sendMail } from "./mailServices";

export const EMAIL_CONFIG = {
  "verify-email": {
    template: "verify.ejs",
    subject: "Verify your email address",
  },
  "reset-password": {
    template: "reset.ejs",
    subject: "Reset your password",
  },
  "two-factor": {
    template: "two-factor.ejs",
    subject: "Your two-factor authentication code",
  },
  "payment-success": {
    template: "payment.ejs",
    subject: "Payment Receipt - Blitz Analyzer",
  },
} as const;

export type EmailJobName = keyof typeof EMAIL_CONFIG;

export const emailTypes = {
  verifyEmail: "verify-email" as const,
  resetPassword: "reset-password" as const,
  twoFactor: "two-factor" as const,
};

export const renderTemplate = async (
  templateName: string,
  data: Record<string, unknown>
): Promise<string> => {
  const templatePath = path.join(process.cwd(), "src/templates", templateName);
  return ejs.renderFile(templatePath, data);
};

export const buildTemplateData = (
  _jobName: string,
  data: Record<string, unknown>
): Record<string, unknown> => {
  return data;
};

export const getRecipientEmail = (data: Record<string, unknown>): string | undefined => {
  const direct = data.email;
  if (typeof direct === "string") return direct;
  const nested = (data.user as { email?: string } | undefined)?.email;
  return nested;
};

export const generateOTP = (length = 6): string => {
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return Math.floor(min + Math.random() * (max - min)).toString();
};

export const hashOTP = async (otp: string): Promise<string> => bcrypt.hash(otp, 10);

export const verifyOTP = async (otp: string, hash: string): Promise<boolean> =>
  bcrypt.compare(otp, hash);

export const getExpiry = (minutes: number): Date => new Date(Date.now() + minutes * 60 * 1000);

interface EmailPayload {
  email: string;
  subject: string;
  html: string;
  type: MailType;
}

export const sendEmail = async ({
  email,
  subject,
  html,
  type,
}: EmailPayload): Promise<unknown> =>
  sendMail({ to: email, subject, html, type });
