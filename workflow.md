Here’s a refined, enterprise‑grade authentication system blueprint. I’ve re‑filed all steps, filled every gap, and added the security, scalability, and maintainability layers that turn a basic flow into a production‑ready SaaS auth module.

---

# 🔐 Advanced Full‑Stack Authentication System  
### Modern SaaS / Enterprise Grade

## 1. Overview  
A complete, stateless‑ready authentication system with:
- Email/password registration with verified email (OTP)
- JWT access + refresh tokens (httpOnly secure cookies)
- Session/device management
- Role‑Based Access Control (RBAC)
- Social login (Google OAuth 2.0)
- 2‑Factor Authentication (TOTP / email OTP fallback)
- Account linking (convert social to email+password)
- Security: rate limiting, CSRF protection, breached password check, Redis‑based blacklist & cache

---

## 2. Technology Stack
| Layer       | Technology                                         |
|-------------|----------------------------------------------------|
| Backend     | Node.js (Express / Fastify) + TypeScript           |
| Database    | PostgreSQL (primary), Redis (caching, queues, blacklist) |
| Queue       | BullMQ with Redis (email, background tasks)        |
| Mailer      | Nodemailer with HTML templates                     |
| Auth Tokens | JWT (access + refresh), httpOnly secure cookies    |
| Social      | `passport-google-oauth20`, `google-auth-library`   |
| 2FA         | `speakeasy` (TOTP), fallback email OTP             |
| Security    | `helmet`, `express-rate-limit`, `bcrypt`, `csrf-csrf`, `zod` validation |

---

enum UserRole {
    customer
    admin
    moderator
    support
}

enum UserStatus {
    active
    banned
    deleted
}

enum AuthType {
    local
    oauth
    both
}

enum OAuthProvider {
    google
    github
    facebook
}

enum DeviceType {
    desktop
    mobile
    tablet
}

enum RevokeReason {
    logout
    logout_all
    password_change
    admin_revoke
    token_theft
    expired
}


enum LoyaltyTier {
    bronze
    silver
    gold
    platinum
}

enum AuditAction {
    REGISTER
    EMAIL_VERIFIED
    LOGIN
    LOGIN_FAILED
    LOGOUT
    LOGOUT_ALL
    TOKEN_REFRESH
    TOKEN_THEFT
    PASSWORD_CHANGE
    PASSWORD_RESET_REQUEST
    PASSWORD_RESET_COMPLETE
    PROFILE_UPDATE
    ROLE_CHANGE
    ACCOUNT_DELETED
    USER_BANNED
    USER_UNBANNED
    GOOGLE_LINKED
    TWO_FA_ENABLED
    TWO_FA_DISABLED
    IMPERSONATION
    UNAUTHORIZED_ACCESS
}

enum AuditStatus {
    success
    failed
}


## 3. Database Schema (Key Tables)

model User {
  id String @id @default(uuid()) @db.Uuid

  name     String  @db.VarChar(100)
  username String? @unique @db.VarChar(50)
  email    String  @unique @db.VarChar(255)

  country  String? @db.VarChar(100)
  city     String? @db.VarChar(100)
  timezone String? @db.VarChar(60)
  locale   String  @default("en") @db.VarChar(10)

  role UserRole @default(customer)

  status    UserStatus
  banReason String?    @map("ban_reason")
  bannedAt  DateTime?  @map("banned_at")

  deletedAt   DateTime? @map("deleted_at")
  deletedById String?   @map("deleted_by") @db.Uuid

  lastLoginAt DateTime? @map("last_login_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  account         Account?
  oauthProviders  OAuthProviderOptions[]
  sessions        Session[]
  customerProfile CustomerProfile?
  adminProfile    AdminProfile?
  passwordHistory PasswordHistory[]

  deletedBy    User?  @relation("DeletedBy", fields: [deletedById], references: [id], onDelete: SetNull)
  deletedUsers User[] @relation("DeletedBy")

  auditLogs    AuditLog[] @relation("AuditUser")
  auditActedBy AuditLog[] @relation("AuditActedBy")

  @@index([role])
  @@index([deletedAt])
  @@map("users")
}

### `users`
| Column           | Type        | Description                     |
|------------------|-------------|---------------------------------|
| id               | uuid (PK)   |                                 |
| name             | text        |                                 |
| email            | text unique |                                 |
| password         | text        | hashed (nullable for social)    |
| email_verified   | boolean     | default false                   |
| totp_secret      | text        | encrypted, for 2FA              |
| two_factor_enabled | boolean   | default false                   |
| auth_provider    | enum('local','google') | default 'local'   |
| google_id        | text unique |                                 |
| role             | text        | 'user','admin','moderator'...   |
| created_at       | timestamptz |                                 |
| updated_at       | timestamptz |                                 |
| deleted_at       | timestamptz | soft delete                     |


model CustomerProfile {
  userId String @id @map("user_id") @db.Uuid
    avatarUrl     String?   @map("avatar_url")
  bio           String?
  phoneNumber   String?   @map("phone_number") @db.VarChar(20)
  phoneVerified Boolean   @default(false) @map("phone_verified")
  dateOfBirth   DateTime? @map("date_of_birth") @db.Date

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("customer_profiles")
}

model AdminProfile {
  userId String @id @map("user_id") @db.Uuid

  department String? @db.VarChar(100)
  jobTitle   String? @map("job_title") @db.VarChar(100)
  employeeId String? @unique @map("employee_id") @db.VarChar(50)

  permissions    String[] @default([])
  canImpersonate Boolean  @default(false) @map("can_impersonate")
  accessLevel    Int      @default(1) @map("access_level") @db.SmallInt

  require2fa             Boolean   @default(true) @map("require_2fa")
  lastPermissionReviewAt DateTime? @map("last_permission_review_at")

  notes String?

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([accessLevel])
  @@map("admin_profiles")
}

### `sessions`
| Column       | Type        | Description                     |
|--------------|-------------|---------------------------------|
| id           | uuid (PK)   |                                 |
| user_id      | uuid (FK)   | references users                |
| refresh_token| text unique | hashed refresh token            |
| device_info  | jsonb       | user-agent, ip, device name     |
| is_active    | boolean     | default true                    |
| expires_at   | timestamptz | refresh token expiry            |
| created_at   | timestamptz |                                 |

### `email_verifications`
| Column       | Type        | Description                     |
|--------------|-------------|---------------------------------|
| id           | uuid (PK)   |                                 |
| user_id      | uuid (FK)   |                                 |
| otp          | text        | hashed OTP                      |
| token        | text        | one‑time token for URL          |
| expires_at   | timestamptz | 10 minutes                      |
| used         | boolean     | default false                   |

### `password_resets`
| Column       | Type        | Description                     |
|--------------|-------------|---------------------------------|
| id           | uuid (PK)   |                                 |
| user_id      | uuid (FK)   |                                 |
| token        | text        | URL token (hashed in DB)        |
| expires_at   | timestamptz | 15 minutes                      |

---

## 4. Redis Usage
- **Blacklist:** `bl:access:{jti}` for revoked access tokens  
- **Banned users:** `banned_users` set (user IDs)  
- **Cache:** `user:{id}` hash for fast profile loading  
- **Rate limiting:** `rate_limit:{ip}:{endpoint}`  
- **Queue:** BullMQ jobs for sending emails

---

## 5. API Endpoints & Detailed Flows

### 5.1 Registration (Email/Password)
**POST /api/auth/register**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongP@ss1",
  "agreeTerms": true
}
```


























**Backend Process:**
1. Validate input (Zod).
2. Check if email already exists (active users).
3. Hash password with bcrypt (cost 12).
4. Check password against HaveIBeenPwned API (optional).
5. Create user record (email_verified=false, auth_provider='local').
6. Generate a cryptographically secure email verification token (JWT or random UUID).
7. Hash the OTP (6 digits) and store in `email_verifications` with expiry (10 min).
8. Push email job to BullMQ: `sendVerificationEmail({ email, name, otp, token })`.
9. Return:
```json
{
  "message": "Registration successful. Please verify your email.",
  "redirectUrl": "/verify-email?token=<verificationToken>"
}
```
*User is redirected to a verification page.*

---

### 5.2 Email Verification
**Page:** `/verify-email?token=<verificationToken>`  
**POST /api/auth/verify-email**
```json
{
  "token": "verificationToken",
  "otp": "123456"
}
```

**Backend Process:**
1. Validate token and OTP.
2. Find `email_verifications` by token, check expiry, not used.
3. Compare hashed OTP with stored hash.
4. Mark verification as used, set `users.email_verified = true`.
5. Return success, instruct frontend to redirect to login.

*Now user can log in.*

---

### 5.3 Login
**POST /api/auth/login**
```json
{
  "email": "john@example.com",
  "password": "StrongP@ss1"
}
```

**Backend Process:**
1. Find user by email, ensure not soft-deleted, auth_provider='local'.
2. Compare password with bcrypt.
3. **Check email verification** – if not verified, return error with option to resend verification.
4. **Check 2FA:** If `two_factor_enabled` is true, generate a temporary token (signed, short-lived) and require a second step (TOTP or email OTP). The login response then becomes `{require2FA: true, tempToken: "..."}`. After successful 2FA, proceed.
5. Generate:
   - **Access token** (JWT, 15 min), contains: sub (user id), jti (unique), role, type='access'
   - **Refresh token** (JWT, 7 days, opaque to client), contains: sub, jti, session_id, type='refresh'
6. Create a new session record: store hashed refresh token, device info (parsed user-agent + IP), expiry.
7. Set cookies:
   - `access_token` – httpOnly, Secure, SameSite=Strict, path=/, maxAge=15min
   - `refresh_token` – httpOnly, Secure, SameSite=Strict, path=/api/auth/refresh, maxAge=7d
8. Return user profile (without sensitive data):
```json
{
  "user": { "id", "name", "email", "role", ... },
  "requires2FA": false
}
```

*If 2FA is enabled, after TOTP verification the same token issuance happens.*

---

### 5.4 Token Refresh
**POST /api/auth/refresh**
(Cookie `refresh_token` is automatically sent)

**Backend Process:**
1. Extract refresh token from cookie.
2. Verify JWT signature and expiry.
3. Retrieve session by `session_id` from payload.
4. Ensure session is active, not expired, and that the hashed token matches.
5. **Refresh token rotation**: Invalidate the old session (mark inactive or delete) and issue a new refresh token (new JWT with new jti), update session record with new hash.
6. Issue new access token.
7. Update cookies with new tokens.
8. Return minimal payload.

---

### 5.5 Protected Route Middleware
**Authentication Middleware (`authMiddleware`):**
1. Extract `access_token` from cookie. If missing, return 401.
2. Verify JWT signature and expiry.
3. Check if `jti` exists in Redis blacklist (`bl:access:{jti}`) – if yes, reject.
4. Check if user ID is in `banned_users` set – if yes, reject.
5. Fetch user from cache (`user:{id}`). On cache miss, query DB and populate cache (TTL 5 min).
6. Attach user info to `req.user` (or `response.locals.user`).
7. `next()`.

**Role Middleware (`authorize(...roles)`):**
1. Check `req.user.role` against allowed roles.
2. If not permitted, respond 403.

---

### 5.6 Profile Management
- **GET /api/users/me** – returns cached/DB user data (requires auth).
- **PUT /api/users/me** – update name, avatar, etc. Validate, update DB, clear user cache.
- **Change Password** – **POST /api/auth/change-password**
  1. Requires current password + new password.
  2. Verify current password.
  3. Hash new password, update DB.
  4. Optionally invalidate all sessions (force logout from other devices).

- **Forgot / Reset Password**
  - **POST /api/auth/forgot-password** – sends reset link with token (hashed in DB, expires 15 min).
  - **POST /api/auth/reset-password** – token + new password → set new password, invalidate previous reset tokens, log out all sessions.

---

### 5.7 Session & Device Management
- **GET /api/auth/sessions** – list active sessions (device info, IP, last used). Requires auth.
- **DELETE /api/auth/sessions/:sessionId** – logout specific session (invalidate refresh token, delete session).
- **DELETE /api/auth/sessions** – logout all sessions except current (or all).
- **Logout** – **POST /api/auth/logout**
  1. Revoke current refresh token (invalidate session).
  2. Add current access token JTI to Redis blacklist with TTL = access token remaining life.
  3. Clear cookies.

---

### 5.8 Social Login (Google)
**GET /api/auth/google** – redirects to Google consent.  
**GET /api/auth/google/callback** – handles OAuth callback.

**Backend Process (first time):**
1. Exchange code for tokens, fetch user info.
2. Find user by `google_id` or email.
3. If user exists and `auth_provider='google'`, skip to token issuance.
4. If user exists but with `auth_provider='local'`, return error prompting account linking (see below).
5. If new: create user with `auth_provider='google'`, `email_verified=true` (Google verified), skip OTP. No password.
6. Generate tokens and session as in normal login.

**Existing user, Google sign-in subsequent:** same token flow.

---

### 5.9 Account Linking (Google → Email/Password)
User who signed up via Google wants to set a password (convert to email/password auth).
- **POST /api/auth/link-password**
  1. Requires current auth (access token).
  2. User provides new password.
  3. Set `password` field, keep `auth_provider='local'` (or dual? best to keep local). Then user can log in with email+password.

This is secure because the user is already authenticated.

---

## 6. Security Measures (Checklist)
- **Passwords:** bcrypt (cost 12+), zxcvbn strength check, HIBP validation.
- **Tokens:** Short-lived access tokens (15 min), refresh rotation with reuse detection.
- **Cookies:** httpOnly, Secure, SameSite=Strict, `__Host-` prefix.
- **CSRF:** Use `csrf-csrf` double-submit cookie pattern for SPA.
- **Rate Limiting:** On login (5 attempts/min/IP), registration, OTP verify.
- **Breached Token Revocation:** Refresh token reuse detection → invalidate all user sessions (possible theft).
- **Blacklist:** Access token blacklist via Redis with TTL equal to expiry.
- **Banned Users:** Redis set updated on admin action, checked in middleware.
- **Data Privacy:** PII encrypted at rest if needed; soft deletes and GDPR hooks.
- **Email OTP:** hashed, single use, 6 digits, 10 min expiry.
- **2FA TOTP:** Use `speakeasy` with encrypted secret; enable/disable with backup codes.

---

## 7. Architecture Diagram (Text)
```
Client (SPA / Mobile)
   |
   v
[API Gateway] -- rate limiter, CSRF
   |
   v
Express Routes
   |
   v
Auth Middleware --> Redis (blacklist, banned, cache, rate limiter)
   |
   v
Controllers (register, login, etc.)
   |
   v
Services / Database (PostgreSQL)  <--> Redis Cache
   |                                    
   v
BullMQ (Email Queue) --> Redis --> Worker --> Nodemailer --> SMTP
```

---



7. **Token refresh**  
   - Route: `POST /api/auth/refresh` (uses cookie `refresh_token`).  
   - Verify JWT, load session, compare hashed refresh token, check expiry and active status.  
   - Implement refresh token rotation: invalidate old session, create new session with new refresh token, issue new access token, update cookies.  
   - Return minimal response.

8. **Upgrade authentication middleware**  
   - Modify existing `authMiddleware` (or create new) to:  
     - Extract `access_token` cookie.  
     - Verify JWT.  
     - Check `jti` is not in Redis blacklist (`bl:access:<jti>`).  
     - Check user ID is not in Redis `banned_users` set.  
     - Fetch user from Redis cache (`user:<id>`); if miss, query DB and cache for 5 minutes.  
     - Attach user to `req.user` (or `res.locals.user`).  
   - Role middleware: `authorize(...roles)` that checks `req.user.role` and returns 403 if not allowed.

9. **Reset password flows**  
   - `POST /api/auth/forgot-password`: generate reset token, store hashed in `PasswordReset` with 15‑min expiry, send email (via queue).  
   - `POST /api/auth/reset-password`: validate token, hash new password, update user, invalidate all existing sessions (log out all devices).  
   - `POST /api/auth/change-password` (authenticated): require current password, validate, update with new password, optionally invalidate other sessions.

10. **Device & session management**  
    - `GET /api/auth/sessions` – list all active sessions (include device info, created time).  
    - `DELETE /api/auth/sessions/:sessionId` – revoke a specific session (delete session, optionally blacklist its refresh token).  
    - `DELETE /api/auth/sessions` – log out all sessions except current (or all).  
    - `POST /api/auth/logout` – revoke current refresh token (mark session inactive), add current access token JTI to Redis blacklist with TTL equal to remaining life, clear cookies.

11. **Additional requirements**  
    - Use existing utility functions for hashing, JWT, Redis, email sending, queue.  
    - All new routes must be properly validated (e.g., Zod).  
    - Rate limiting on login, registration, and OTP endpoints.  
    - CSRF protection if not already present (use `csrf-csrf` double‑submit cookie pattern).  
    - Environment variables for all secrets (JWT keys, Redis URL, DB connection, Google OAuth credentials).  
    - Production‑ready error handling and logging.  
    - After implementing, **remove any placeholder or stub code** and ensure the entire codebase is clean and follows consistent folder structure.

    Expected final result: All above APIs work exactly as described in `workflow.md`, and the system is ready to be deployed as an enterprise‑grade authentication backend.

    Start by reading `workflow.md`, then the existing code, then perform all modifications.