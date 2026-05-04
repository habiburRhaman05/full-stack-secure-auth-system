-- CreateEnum
CREATE TYPE "Role" AS ENUM ('customer', 'admin', 'moderator', 'support');

-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('local', 'oauth', 'both');

-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('google', 'github', 'facebook');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('desktop', 'mobile', 'tablet');

-- CreateEnum
CREATE TYPE "RevokeReason" AS ENUM ('logout', 'logout_all', 'password_change', 'admin_revoke', 'token_theft', 'expired');

-- CreateEnum
CREATE TYPE "LoyaltyTier" AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('REGISTER', 'EMAIL_VERIFIED', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'LOGOUT_ALL', 'TOKEN_REFRESH', 'TOKEN_THEFT', 'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE', 'PROFILE_UPDATE', 'ROLE_CHANGE', 'ACCOUNT_DELETED', 'USER_BANNED', 'USER_UNBANNED', 'GOOGLE_LINKED', 'TWO_FA_ENABLED', 'TWO_FA_DISABLED', 'IMPERSONATION', 'UNAUTHORIZED_ACCESS');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('success', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50),
    "email" VARCHAR(255) NOT NULL,
    "avatar_url" TEXT,
    "bio" TEXT,
    "phone_number" VARCHAR(20),
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "date_of_birth" DATE,
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "timezone" VARCHAR(60),
    "locale" VARCHAR(10) NOT NULL DEFAULT 'en',
    "role" "Role" NOT NULL DEFAULT 'customer',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "ban_reason" TEXT,
    "banned_at" TIMESTAMP(3),
    "banned_by" UUID,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" UUID,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "auth_type" "AuthType" NOT NULL DEFAULT 'local',
    "password_hash" TEXT,
    "password_changed_at" TIMESTAMP(3),
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "email_otp_hash" TEXT,
    "email_otp_expires_at" TIMESTAMP(3),
    "email_otp_attempts" SMALLINT NOT NULL DEFAULT 0,
    "email_otp_last_sent_at" TIMESTAMP(3),
    "reset_token_hash" TEXT,
    "reset_token_expires_at" TIMESTAMP(3),
    "reset_requested_at" TIMESTAMP(3),
    "is_2fa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "totp_secret" TEXT,
    "totp_enabled_at" TIMESTAMP(3),
    "backup_codes" TEXT[],
    "failed_login_attempts" SMALLINT NOT NULL DEFAULT 0,
    "last_failed_login_at" TIMESTAMP(3),
    "lockout_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_providers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "provider_email" VARCHAR(255),
    "provider_name" VARCHAR(100),
    "provider_avatar" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "scopes" TEXT[],
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "jti" VARCHAR(36),
    "device_id" VARCHAR(100),
    "device_name" VARCHAR(200),
    "device_type" "DeviceType",
    "browser" VARCHAR(100),
    "os" VARCHAR(100),
    "ip_address" TEXT,
    "ip_country" VARCHAR(100),
    "ip_city" VARCHAR(100),
    "user_agent" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "revoked_at" TIMESTAMP(3),
    "revoke_reason" "RevokeReason",
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_profiles" (
    "user_id" UUID NOT NULL,
    "address_line1" VARCHAR(200),
    "address_line2" VARCHAR(200),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country_code" CHAR(2),
    "preferred_currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "marketing_emails" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "loyalty_tier" "LoyaltyTier" NOT NULL DEFAULT 'bronze',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "user_id" UUID NOT NULL,
    "department" VARCHAR(100),
    "job_title" VARCHAR(100),
    "employee_id" VARCHAR(50),
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "can_impersonate" BOOLEAN NOT NULL DEFAULT false,
    "access_level" SMALLINT NOT NULL DEFAULT 1,
    "require_2fa" BOOLEAN NOT NULL DEFAULT true,
    "last_permission_review_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "password_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "session_id" UUID,
    "acted_by" UUID,
    "action" "AuditAction" NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'success',
    "fail_reason" VARCHAR(100),
    "ip_address" TEXT,
    "user_agent" TEXT,
    "country" VARCHAR(100),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_banned_idx" ON "users"("is_banned");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "accounts_reset_token_hash_idx" ON "accounts"("reset_token_hash");

-- CreateIndex
CREATE INDEX "accounts_lockout_until_idx" ON "accounts"("lockout_until");

-- CreateIndex
CREATE INDEX "accounts_is_email_verified_idx" ON "accounts"("is_email_verified");

-- CreateIndex
CREATE INDEX "oauth_providers_user_id_idx" ON "oauth_providers"("user_id");

-- CreateIndex
CREATE INDEX "oauth_providers_provider_provider_user_id_idx" ON "oauth_providers"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_providers_provider_provider_user_id_key" ON "oauth_providers"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_providers_user_id_provider_key" ON "oauth_providers"("user_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_jti_key" ON "sessions"("jti");

-- CreateIndex
CREATE INDEX "sessions_user_id_is_active_idx" ON "sessions"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "sessions_refresh_token_hash_idx" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "customer_profiles_loyalty_tier_idx" ON "customer_profiles"("loyalty_tier");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_employee_id_key" ON "admin_profiles"("employee_id");

-- CreateIndex
CREATE INDEX "admin_profiles_access_level_idx" ON "admin_profiles"("access_level");

-- CreateIndex
CREATE INDEX "password_history_user_id_created_at_idx" ON "password_history"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_acted_by_created_at_idx" ON "audit_logs"("acted_by", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_providers" ADD CONSTRAINT "oauth_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_acted_by_fkey" FOREIGN KEY ("acted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
