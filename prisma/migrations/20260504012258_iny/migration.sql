/*
  Warnings:

  - You are about to drop the column `address_line1` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `address_line2` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `country_code` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `loyalty_points` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `loyalty_tier` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `marketing_emails` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `postal_code` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferred_currency` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `sms_notifications` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `customer_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `avatar_url` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `banned_by` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `date_of_birth` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `is_banned` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone_verified` on the `users` table. All the data in the column will be lost.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `status` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'admin', 'moderator', 'support');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'banned', 'deleted');

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_banned_by_fkey";

-- DropIndex
DROP INDEX "customer_profiles_loyalty_tier_idx";

-- DropIndex
DROP INDEX "users_is_banned_idx";

-- AlterTable
ALTER TABLE "customer_profiles" DROP COLUMN "address_line1",
DROP COLUMN "address_line2",
DROP COLUMN "city",
DROP COLUMN "country_code",
DROP COLUMN "loyalty_points",
DROP COLUMN "loyalty_tier",
DROP COLUMN "marketing_emails",
DROP COLUMN "postal_code",
DROP COLUMN "preferred_currency",
DROP COLUMN "sms_notifications",
DROP COLUMN "state",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "phone_number" VARCHAR(20),
ADD COLUMN     "phone_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatar_url",
DROP COLUMN "banned_by",
DROP COLUMN "bio",
DROP COLUMN "date_of_birth",
DROP COLUMN "is_active",
DROP COLUMN "is_banned",
DROP COLUMN "phone_number",
DROP COLUMN "phone_verified",
ADD COLUMN     "status" "UserStatus" NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'customer';

-- DropEnum
DROP TYPE "Role";

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");
