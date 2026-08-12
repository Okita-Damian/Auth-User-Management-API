const express = require("express");

const {
  registerSchema,
  loginSchema,
  otpSchema,
  resendOtpSchema,
  requestPasswordResetSchema,
  passwordResetSchema,
} = require("../validation/authValidation");

const validate = require("../middleware/validate");
const authController = require("../controller/authController");

const { loginLimiter, otpLimiter } = require("../middleware/rateLimiting");

const router = express.Router();

// ==================== AUTH ====================

// Register
router.post("/register", validate(registerSchema), authController.register);

// Login
router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  authController.login,
);

// Verify email OTP
router.post(
  "/verify-otp",
  otpLimiter,
  validate(otpSchema),
  authController.verifyEmail,
);

// Resend email OTP
router.post(
  "/resend-otp",
  otpLimiter,
  validate(resendOtpSchema),
  authController.resendOTP,
);

// ==================== PASSWORD RESET ====================

// Request password reset
router.post(
  "/request-password-reset",
  otpLimiter,
  validate(requestPasswordResetSchema),
  authController.forgotPassword,
);

// Reset password
router.post(
  "/reset-password",
  validate(passwordResetSchema),
  authController.resetPassword,
);

module.exports = router;
