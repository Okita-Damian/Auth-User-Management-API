const bcrypt = require("bcryptjs");
const otpModel = require("../model/otpModel");
const generateOTP = require("../utils/generateOTP");
const AppError = require("../utils/appError");
const logger = require("../utils/logger");

class OTPService {
  // Create and save a new OTP
  async createOTP(userId, purpose, expiryMinutes = 60) {
    const otp = generateOTP().toLowerCase();
    const hashedOTP = await bcrypt.hash(String(otp), 10);

    await otpModel.create({
      otp: hashedOTP,
      userId,
      purpose,
      expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
    });

    logger.info("OTP created", { userId, purpose, expiryMinutes });
    return otp;
  }

  // Verify OTP
  async verifyOTP(userId, otp, purpose) {
    const otpDetails = await otpModel.findOne({ userId, purpose });

    if (!otpDetails || otpDetails.expiresAt < Date.now()) {
      logger.warn("OTP verification failed: invalid or expired", {
        userId,
        purpose,
      });
      throw new AppError("Invalid or expired OTP", 400);
    }

    const isMatch = await bcrypt.compare(
      String(otp).toLocaleLowerCase(),
      otpDetails.otp
    );
    if (!isMatch) {
      logger.warn("OTP verification failed: incorrect OTP", {
        userId,
        purpose,
      });
      throw new AppError("Invalid OTP", 400);
    }

    logger.info("OTP verified successfully", { userId, purpose });
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
    const existingOtp = await otpModel.findOne({ userId, purpose });

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
            waitSeconds - timeSinceLastOtp
          )}s before requesting another OTP.`,
          429
        );
      }

      await this.deleteOTP(existingOtp._id);
    }
  }
}

module.exports = new OTPService();
