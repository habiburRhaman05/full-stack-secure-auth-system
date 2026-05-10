import type { UserRole } from "../../generated/prisma/enums";
import type { DeviceInfo } from "../../utils/deviceInfo";

export interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  agreeTerms: boolean;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IRequestContext {
  userAgent: string;
  ipAddress: string | undefined;
  deviceInfo: DeviceInfo;
}

export interface IVerifyEmailPayload {
  token: string;
  otp: string;
}

export interface IVerify2FAPayload {
  tempToken: string;
  otp: string;
}

export interface IResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface IChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface IUpdateProfilePayload {
  name?: string | undefined;
  avatarUrl?: string | undefined;
}
