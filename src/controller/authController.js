const {
  registerService,
  verifyEmailService,
  resendOTPService,
  loginService,
  logoutService,
  forgotPasswordService,
  resetPasswordService,
  getMeService,
} = require("../service/authService");

const asyncHandler = require("../middleware/asyncHandler");

// Register
exports.register = asyncHandler(async (req, res) => {
  const result = await registerService(req.body);

  res.status(201).json({
    status: "success",
    message: result.message,
    data: {
      userId: result.userId,
      email: result.email,
    },
  });
});

// Verify email
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await verifyEmailService(email, otp);

  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
    data: {
      user,
    },
  });
});

// Resend OTP
exports.resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await resendOTPService(email);

  res.status(200).json({
    status: "success",
    message: "A new OTP has been sent to your email",
    data: {
      email: result.user.email,
    },
  });
});

// Login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await loginService(email, password);

  res.status(200).json({
    status: "success",
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

// Logout
exports.logout = asyncHandler(async (req, res) => {
  await logoutService(req.user.id);

  res.status(200).json({
    status: "success",
    message: "Logout successful",
  });
});

// Forgot password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await forgotPasswordService(email);

  res.status(200).json({
    status: "success",
    message: result.message,
  });
});

// Reset password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  await resetPasswordService(email, otp, newPassword);

  res.status(200).json({
    status: "success",
    message: "Password reset successfully",
  });
});

// Get current user
exports.getMe = asyncHandler(async (req, res) => {
  const user = await getMeService(req.user.id);

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});
