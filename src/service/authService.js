const User = require("../model/authModel");
const OTP = require("../model/otpModel");
const AppError = require("../utils/appError");
const hashPassword = require("../utils/hashPassword");
const generateOTP = require("../utils/generateOTP");
const generateRefreshToken = require("../utils/generateRefreshToken");
const generateToken = require("../utils/generateToken");
const emailService = require("../service/emailService");
const comparePassword = require("../utils/comparePassword");

const logger = require("../utils/logger");

// Register a user
const registerService = async (data) => {
  const { fullName, email, password, gender } = data;

  const normalizedEmail = email.toLowerCase();

  // Find user by email or phone number
  const existingEmail = await User.findOne({
    email: normalizedEmail,
  });

  if (existingEmail) {
    throw new AppError("Email already exists", 400);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const newUser = new User({
    fullName,
    password: hashedPassword,
    gender,
    email: normalizedEmail,
    isVerified: false,
  });

  // Generate OTP
  const { otp, hashedOTP } = generateOTP();

  await newUser.save();

  const otpRecord = await OTP.create({
    userId: newUser._id,
    otp: hashedOTP,
    purpose: "verify-email",
  });

  await emailService.sendVerificationEmail(normalizedEmail, otp);
  logger.info("User registered successfully", {
    userId: newUser._id,
    email: normalizedEmail,
  });

  return {
    userId: newUser._id,
    email: normalizedEmail,
    message:
      "Registration successful. Please check your email for the verification OTP.",
  };
};

const verifyEmailService = async (email, otp) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("Email already verified", 400);
  }

  const otpRecord = await OTP.findOne({
    userId: user._id,
    purpose: "verify-email",
  }).select("+otp");

  if (!otpRecord) {
    // Debug: see what OTP records actually exist for this user
    const allUserOtps = await OTP.find({
      userId: user._id,
    }).select("+otp");

    throw new AppError("OTP not found or expired", 404);
  }

  const hashedOTP = generateOTP.hashOTP(otp);

  if (otpRecord.otp !== hashedOTP) {
    otpRecord.attempts += 1;

    if (otpRecord.attempts >= 5) {
      await OTP.findByIdAndDelete(otpRecord._id);

      throw new AppError("Too many failed attempts. Request a new OTP.", 429);
    }

    await otpRecord.save();

    throw new AppError("Invalid OTP", 400);
  }

  user.isVerified = true;
  await user.save();

  await OTP.findByIdAndDelete(otpRecord._id);

  return user;
};

const resendOTPService = async (email) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("Email already verified", 400);
  }

  await OTP.deleteMany({
    userId: user._id,
    purpose: "verify-email",
  });

  const { otp, hashedOTP } = generateOTP();

  await OTP.create({
    userId: user._id,
    otp: hashedOTP,
    purpose: "verify-email",
  });

  await emailService.sendVerificationEmail(email.toLowerCase(), otp);
  return {
    user,
  };
};

const loginService = async (email, password) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select("+password +refreshToken");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isVerified) {
    throw new AppError("Please verify your email before logging in", 401);
  }

  const isPasswordCorrect = await comparePassword(password, user.password);

  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = generateToken(user._id);

  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;

  await user.save();

  return {
    user,
    accessToken,
    refreshToken,
  };
};

// Logout
const logoutService = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, { refreshToken: null });
  if (!user) {
    throw new AppError("User not found", 404);
  }
};

const forgotPasswordService = async (email) => {
  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    throw new AppError("No user found with this email", 404);
  }

  await OTP.deleteMany({ userId: user._id, purpose: "reset-password" });

  const { otp, hashedOTP } = generateOTP();

  await OTP.create({
    otp: hashedOTP,
    userId: user._id,
    purpose: "reset-password",
  });

  await emailService.sendPasswordResetEmail(email.toLowerCase(), otp);

  return {
    message: "Password reset OTP has been sent to your email",
  };
};

const resetPasswordService = async (email, otp, newPassword) => {
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const otpRecord = await OTP.findOne({
    userId: user._id,
    purpose: "reset-password",
  }).select("+otp");

  if (!otpRecord) {
    throw new AppError("OTP not found or expired", 400);
  }

  const hashedOTP = generateOTP.hashOTP(otp);

  if (otpRecord.otp !== hashedOTP) {
    otpRecord.attempts += 1;

    if (otpRecord.attempts >= 5) {
      await OTP.findByIdAndDelete(otpRecord._id);

      throw new AppError("Too many failed attempts. Request a new OTP.", 429);
    }

    await otpRecord.save();

    throw new AppError("Invalid OTP", 400);
  }

  user.password = await hashPassword(newPassword);

  await user.save();

  await OTP.findByIdAndDelete(otpRecord._id);

  await emailService.sendPasswordResetSuccessEmail(
    normalizedEmail,
    user.fullName,
  );

  return true;
};

// get user profile
const getMeService = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

module.exports = {
  registerService,
  verifyEmailService,
  resendOTPService,
  loginService,
  logoutService,
  forgotPasswordService,
  resetPasswordService,
  getMeService,
};
