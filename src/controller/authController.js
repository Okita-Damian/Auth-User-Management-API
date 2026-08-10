const User = require("../model/authModel");
const crypto = require("crypto");
const logger = require("../utils/logger");
const { registerSchema, loginSchema } = require("../validation/authValidation");
const AppError = require("../utils/appError");
const asyncHandler = require("../middleware/asyncHandler");

// services
const authService = require("../service/authService");
const otpService = require("../service/otpService");
const emailService = require("../service/emailService");

exports.register = asyncHandler(async (req, res, next) => {
  // validate the request body
  const { error, value } = registerSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) return next(new AppError(error.details[0].message, 400));

  // validate the email
  const emailExist = await authService.emailExist(value.email);
  if (emailExist) return next(new AppError("Email already Exist", 409));

  // generate email verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // create a user
  const newUser = await authService.createUser({
    ...value,
    verificationToken,
  });

  // create Otp
  const otp = await otpService.createOTP(newUser._id, "verify-email", 60);

  // send email verification email
  try {
    await emailService.sendVerificationEmail(newUser.email, otp);
  } catch (err) {
    logger.error("Email Verification failed", {
      email: newUser.email,
      error: err.message,
    });
    throw new AppError("failed to send verification email", 500);
  }

  logger.info("User registered successfully", {
    userId: newUser._id,
    email: newUser.email,
  });

  // json response
  res.status(200).json({
    status: "success",
    message:
      "Registration successful. Please check your email for otp Verification",
  });
});

// ====== Verify OTP =====
exports.verifyOtp = asyncHandler(async (req, res, next) => {
  //  Extract input
  const { email, otp } = req.body;

  //  Validate required fields
  if (!email || !otp) {
    return next(new AppError("Email and OTP are required", 400));
  }

  //  Sanitize and validate OTP format (6 digits)
  const sanitizedOtp = otp.toString().trim();
  if (!/^[a-z0-9]{6}$/.test(sanitizedOtp)) {
    return next(new AppError("Invalid OTP format", 400));
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  //  Verify OTP
  const otpDetails = await otpService.verifyOTP(
    user._id,
    sanitizedOtp,
    "verify-email",
  );

  // Perform action based on OTP purpose
  if (otpDetails.purpose === "verify-email") {
    await authService.verifyUserEmail(user._id);
  }

  logger.info("OTP verified successfully", {
    userId: user._id,
    purpose: otpDetails.purpose,
  });

  // Respond
  res.status(200).json({
    status: "success",
    message:
      otpDetails.purpose === "verify-email"
        ? "Email verified successfully."
        : "OTP verified. You may now reset your password.",
  });
});

exports.resentOtp = asyncHandler(async (req, res, next) => {
  // extract input
  const { email, purpose } = req.body;

  // validate the req.body
  if (!email || !purpose)
    return next(new AppError("Email and purpose are required", 400));

  // Normalize and validate purpose
  const normalizedPurpose = purpose.toLowerCase().trim();
  const allowedPurposes = ["verify-email", "reset-password"];

  if (!allowedPurposes.includes(normalizedPurpose)) {
    return next(new AppError("Invalid OTP purpose", 400));
  }

  // find user by email
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // validate the fnd
  if (!user) return next(new AppError("No user is found", 404));

  // prevent resending verification if verified
  if (normalizedPurpose === "verify-email" && user.isEmailVerified)
    return next(new AppError("Email is already verified", 400));

  // rate limiting OTP resend
  await otpService.checkRateLimit(user._id, normalizedPurpose, 30);

  //  Create a new OTP
  const otp = await otpService.createOTP(user._id, normalizedPurpose, 1);

  // Send OTP email
  await emailService.sendResendOTPEmail(user.email, otp);

  logger.info("OTP resent successfully", {
    userId: user._id,
    purpose: normalizedPurpose,
  });

  //  Respond to client
  res.status(200).json({
    status: "success",
    message: "OTP sent to email successfully.",
  });
});

exports.requestPasswordReset = asyncHandler(async (req, res, next) => {
  //1. Extract email from request body
  const { email } = req.body;

  //2. Validate email presence
  if (!email) return next(new AppError("Email is required", 400));

  //3. Look up user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(200).json({
      status: "success",
      message: "A password reset OTP has been sent to your email.",
    });
  }
  //   - Delete any existing reset-password OTPs
  await otpService.deleteUserOTPs(user._id, "reset-password");

  //   - Create a new OTP (expiry 60 min)
  const otp = await otpService.createOTP(user._id, "reset-password", 1);

  //   - Send OTP via email
  try {
    await emailService.sendPasswordResetEmail(email, otp);
  } catch (error) {
    logger.error("Password reset email failed", {
      email,
      error: error.message,
    });
  }

  logger.info("Password reset requested", { userId: user._id });

  //5. Return a generic success response
  res.status(200).json({
    status: "success",
    message: "A password reset otp has been sent to your email.",
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Extract email, OTP, newPassword
  const { email, otp, newPassword } = req.body;

  // Validate presence of all fields
  if (!email || !otp || !newPassword) {
    return next(new AppError("Email, OTP, and new password are required", 400));
  }
  //Validate new password strength
  if (newPassword.length < 8) {
    return next(new AppError("Password must be at least 8 characters", 400));
  }
  // Find user by email
  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new AppError("User not found", 404));
  // Verify OTP
  const otpDetails = await otpService.verifyOTP(
    user._id,
    otp,
    "reset-password",
  );
  // Update user password (hash)
  await authService.updatePassword(user, newPassword);
  // Delete used OTP
  await otpService.deleteOTP(otpDetails._id);
  // Send success email notification
  await emailService.sendPasswordResetSuccessEmail(email, user.fullname);

  logger.info("Password reset successfully", { userId: user._id });

  //Respond with success
  res.status(200).json({
    status: "success",
    message: "Password reset successfully.",
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  // Validate login input via Joi
  const { error, value } = loginSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));
  // Verify credentials (email + password)
  const user = await authService.verifyCredentials(value.email, value.password);

  // Generate access & refresh tokens
  const { accessToken, refreshToken } = authService.generateToken(user);
  // Save refresh token in DB
  await authService.saveRefreshToken(user._id, refreshToken);
  //Set refresh token as HttpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  logger.info("User logged in", { userId: user._id });

  // Return access token and user info
  res.status(200).json({
    status: "success",
    message: "Login successful",
    token: accessToken,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  });
});

exports.logout = asyncHandler(async (req, res, next) => {
  // Get refresh token from cookie or body
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  // Verify token if exists
  if (refreshToken) {
    try {
      const decoded = authService.verifyRefreshToken(refreshToken);
      // Clear refresh token in DB
      await authService.clearRefreshToken(decoded.userid);

      logger.info("User logged out", { userId: decoded.userid });
    } catch (error) {
      // token invalid or expired still progress to logout
    }
  }
  //Clear cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
  });
  // Return success message
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

exports.refreshToken = asyncHandler(async (req, res, next) => {
  //1. Get refresh token from cookie or body
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  // validate the refreshToken
  if (!refreshToken)
    return next(new AppError("No refresh token provided", 401));

  // 2. Verify refresh token
  let decoded;
  try {
    decoded = authService.verifyRefreshToken(refreshToken);
  } catch (err) {
    return next(new AppError("Invalid or expired refresh token", 401));
  }
  // 3. Fetch user by decoded ID
  const user = await User.findById(decoded.userid);
  if (!user) return next(new AppError("User not Found", 401));

  // 4. Check token matches DB
  if (user.refreshToken !== refreshToken) {
    return next(new AppError("Invalid refresh token", 401));
  }

  //5. Generate new access & refresh tokens (rotation)
  const { accessToken, refreshToken: newRefreshToken } =
    authService.generateToken(user);

  // 6. Save new refresh token in DB
  await authService.saveRefreshToken(user._id, newRefreshToken);

  //7. Set cookie with new refresh token
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });

  logger.info("Refresh token rotated", { userId: user._id });

  //8. Return new access token
  res.status(200).json({
    status: "success",
    token: accessToken,
  });
});
