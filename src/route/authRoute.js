const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate");
const {
  registerSchema,
  loginSchema,
  otpSchema,
  resendOtpSchema,
  requestPasswordResetSchema,
  passwordResetSchema,
} = require("../validation/authValidation");
const authController = require("../controller/authController");

const { loginLimiter, otpLimiter } = require("../middleware/rateLimiting");

// sign up
router.post("/register", validate(registerSchema), authController.register);

// login
router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  authController.login
);

// verify OTP
router.post(
  "/verify-otp",
  otpLimiter,
  validate(otpSchema),
  authController.verifyOtp
);

// resend OTP
router.post(
  "/resend-otp",
  otpLimiter,
  validate(resendOtpSchema),
  authController.resentOtp
);

// ==== PASSWORD RESET ====
router.post(
  "/request-password-reset",
  otpLimiter,
  validate(requestPasswordResetSchema),
  authController.requestPasswordReset
);
router.post(
  "/reset-password",
  validate(passwordResetSchema),
  authController.resetPassword
);

module.exports = router;



// 2. E-Commerce Backend (Products, Orders, Payments)
// - Products CRUD
// - Brands, categories
// - Cart and checkout logic
// - Orders and payment simulation

