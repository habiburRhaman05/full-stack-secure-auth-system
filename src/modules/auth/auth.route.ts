import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middlewares";
import {
  forgotPasswordRateLimiter,
  loginRateLimiter,
  otpRateLimiter,
  refreshRateLimiter,
  registerRateLimiter,
} from "../../middleware/rateLimiters";
import { validateRequest } from "../../middleware/validateRequest";
import { authControllers } from "./auth.controller";
import { authSchemas } from "./auth.validate";

const router: Router = Router();

// ---------- Public ----------
router.post(
  "/register",
  registerRateLimiter,
  validateRequest(authSchemas.registerUserSchema),
  authControllers.register
);

router.post(
  "/verify-email",
  otpRateLimiter,
  validateRequest(authSchemas.verifyEmailSchema),
  authControllers.verifyEmail
);

router.post(
  "/resend-verification",
  otpRateLimiter,
  validateRequest(authSchemas.resendVerificationSchema),
  authControllers.resendVerification
);

router.post(
  "/login",
  loginRateLimiter,
  validateRequest(authSchemas.loginUserSchema),
  authControllers.login
);

router.post(
  "/verify-2fa",
  otpRateLimiter,
  validateRequest(authSchemas.verify2FASchema),
  authControllers.verify2FA
);

router.post("/refresh", refreshRateLimiter, authControllers.refresh);

router.post(
  "/forgot-password",
  forgotPasswordRateLimiter,
  validateRequest(authSchemas.forgotPasswordSchema),
  authControllers.forgotPassword
);

router.post(
  "/reset-password",
  validateRequest(authSchemas.resetPasswordSchema),
  authControllers.resetPassword
);

// ---------- Google OAuth ----------
router.get("/google", authControllers.googleRedirect);
router.get("/google/callback", authControllers.googleCallback);

// ---------- Protected ----------
router.post("/logout", authMiddleware, authControllers.logout);
router.post("/logout-all", authMiddleware, authControllers.logoutAll);

router.get("/me", authMiddleware, authControllers.getMe);
router.put(
  "/me",
  authMiddleware,
  validateRequest(authSchemas.updateProfileSchema),
  authControllers.updateProfile
);

router.post(
  "/change-password",
  authMiddleware,
  validateRequest(authSchemas.changePasswordSchema),
  authControllers.changePassword
);

router.post(
  "/link-password",
  authMiddleware,
  validateRequest(authSchemas.linkPasswordSchema),
  authControllers.linkPassword
);

router.get("/sessions", authMiddleware, authControllers.listSessions);
router.delete(
  "/sessions/:sessionId",
  authMiddleware,
  validateRequest(authSchemas.revokeSessionSchema),
  authControllers.revokeSession
);

export default router;
