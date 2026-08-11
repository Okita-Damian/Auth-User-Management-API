const bcrypt = require("bcryptjs");
const otpModel = require("../model/otpModel");
const generateOTP = require("../utils/generateOTP");
const AppError = require("../utils/appError");
const logger = require("../utils/logger");

class OTPService {
  // Create and save a new OTP
  async createOTP(userId, purpose, expiryMinutes = 60) {
    // Remove all previous OTPs for this user and purpose
    await otpModel.deleteMany({
      userId,
      purpose,
    });

    const otp = generateOTP();

    const hashedOTP = await bcrypt.hash(otp, 10);

    await otpModel.create({
      userId,
      otp: hashedOTP,
      purpose,
      expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
      attempts: 0,
    });

    return otp;
  }

  // Verify OTP
  async verifyOTP(userId, otp, purpose) {
    const otpDetails = await otpModel
      .findOne({ userId, purpose })
      .sort({ createdAt: -1 });

    if (!otpDetails || new Date(otpDetails.expiresAt).getTime() < Date.now()) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    if (otpDetails.attempts >= 3) {
      await otpModel.deleteOne({
        _id: otpDetails._id,
      });

      throw new AppError(
        "Too many failed attempts. Please request a new OTP.",
        400,
      );
    }

    const submittedOtp = String(otp).trim();

    const isMatch = await bcrypt.compare(submittedOtp, otpDetails.otp);

    if (!isMatch) {
      await otpModel.updateOne(
        { _id: otpDetails._id },
        { $inc: { attempts: 1 } },
      );

      throw new AppError("Invalid OTP", 400);
    }

    await otpModel.deleteOne({
      _id: otpDetails._id,
    });

    logger.info("OTP verified successfully", {
      userId,
      purpose,
    });

    return otpDetails;
  }

  // Delete OTP after use
  async deleteOTP(otpId) {
    await otpModel.deleteOne({ _id: otpId });
    logger.info("OTP deleted", { otpId });
  }

  // Delete all OTPs for a user & purpose
  async deleteUserOTPs(userId, purpose) {
    const result = await otpModel.deleteMany({ userId, purpose });
    logger.info("Deleted all OTPs for user and purpose", {
      userId,
      purpose,
      deletedCount: result.deletedCount,
    });
  }

  // Check rate limiting for OTP requests
  async checkRateLimit(userId, purpose, waitSeconds = 30) {
    const existingOtp = await otpModel
      .findOne({ userId, purpose })
      .sort({ createdAt: -1 });

    if (existingOtp) {
      const now = Date.now();
      const createdAt = new Date(existingOtp.createdAt).getTime();
      const timeSinceLastOtp = (now - createdAt) / 1000;

      if (timeSinceLastOtp < waitSeconds) {
        logger.warn("OTP request rate limited", {
          userId,
          purpose,
          waitSeconds,
        });
        throw new AppError(
          `Please wait ${Math.ceil(
            waitSeconds - timeSinceLastOtp,
          )}s before requesting another OTP.`,
          429,
        );
      }
    }
  }
}

module.exports = new OTPService();
