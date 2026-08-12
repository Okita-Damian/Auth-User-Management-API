const Joi = require("joi");

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.registerSchema = Joi.object({
  fullname: Joi.string().required().messages({
    "any.required": "Please type a Name",
    "string.empty": "Name can't be empty",
  }),
  email: Joi.string()
    .pattern(emailPattern)
    .lowercase()
    .email()
    .required()
    .messages({
      "any.required": "Please provide an Email",
      "string.empty": "Email can't be Empty",
      "string.email": "Email must be valid",
    }),
  gender: Joi.string().lowercase().valid("male", "female").messages({
    "any.required": "Gender is required",
    "string.empty": "Gender cannot be empty",
  }),
  phoneNumber: Joi.string()
    .trim()
    .pattern(/^(?:\+234|0)[789][01]\d{8}$/) // Validates Nigerian format (en-NG)
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
      "any.required": "Please provide your phone number",
    }),
  password: Joi.string().pattern(passwordPattern).min(8).required().messages({
    "string.pattern.base":
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    "any.required": "Password is required",
    "string.empty": "Password cannot be empty",
  }),

  isVerified: Joi.boolean().default(false),

  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
    "any.required": "Please confirm your password",
    "string.empty": "Confirm password cannot be empty",
  }),
});

// ========== VERIFY OTP ==========
exports.otpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email must be valid",
    "any.required": "Email is required",
  }),
  otp: Joi.string().length(6).required().messages({
    "string.length": "OTP must be 6 digits",
    "any.required": "OTP is required",
  }),
});

exports.resendOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  purpose: Joi.string().valid("verify-email", "reset-password").required(),
});

// ========== RESET PASSWORD ==========
exports.passwordResetSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email must be valid",
    "any.required": "Email is required",
  }),
  otp: Joi.string().length(6).required().messages({
    "string.length": "OTP must be 6 digits",
    "any.required": "OTP is required",
  }),
  newPassword: Joi.string().min(8).required().messages({
    "string.min": "New password must be at least 8 characters",
    "any.required": "New password is required",
  }),
});

exports.requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.base": "Email must be a string",
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
});

// ========== RESET PASSWORD ==========
exports.resetPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required().lowercase().messages({
    "string.email": "Email must be valid",
    "any.required": "Email is required",
  }),
  newPassword: Joi.string().pattern(passwordPattern).required().messages({
    "string.pattern.base":
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    "any.required": "New password is required",
    "string.empty": "New password cannot be empty",
  }),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.email": "Email must be valid",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
    "string.empty": "Password cannot be empty",
  }),
});
