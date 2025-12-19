const sendEmail = require("../utils/sendEmail");
const verifyEmailTemplate = require("../utils/emailTemplates.js/verifyEmail");
const resendOTPTemplate = require("../utils/emailTemplates.js/resendOTP");
const passwordResetTemplate = require("../utils/emailTemplates.js/passwordReset");
const passwordResetSuccessTemplate = require("../utils/emailTemplates.js/passwordResetSuccess");
const logger = require("../utils/logger");

class EmailService {
  constructor() {
    this.from = `"${process.env.EMAIL_DISPLAY_NAME}" <${process.env.EMAIL_USERNAME}>`;
  }

  async sendVerificationEmail(email, otp) {
    try {
      await sendEmail({
        from: this.from,
        to: email,
        subject: "Verify Your Email - Auth App",
        html: verifyEmailTemplate(otp),
      });
      logger.info("Verification email sent", { email });
    } catch (error) {
      logger.error("Failed to send verification email", {
        email,
        error: error.message,
      });
      throw error; // propagate so controller can handle
    }
  }

  async sendResendOTPEmail(email, otp) {
    try {
      await sendEmail({
        from: this.from,
        to: email,
        subject: "Your New OTP - Auth App",
        html: resendOTPTemplate(otp),
      });
      logger.info("Resend OTP email sent", { email });
    } catch (error) {
      logger.error("Failed to resend OTP email", {
        email,
        error: error.message,
      });
      throw error;
    }
  }

  async sendPasswordResetEmail(email, otp) {
    try {
      await sendEmail({
        from: this.from,
        to: email,
        subject: "Password Reset Request - Auth App",
        html: passwordResetTemplate(otp),
      });
      logger.info("Password reset email sent", { email });
    } catch (error) {
      logger.error("Failed to send password reset email", {
        email,
        error: error.message,
      });
      throw error;
    }
  }

  async sendPasswordResetSuccessEmail(email, fullName) {
    try {
      await sendEmail({
        from: this.from,
        to: email,
        subject: "Password Reset Successful - Auth App",
        html: passwordResetSuccessTemplate(fullName),
      });
      logger.info("Password reset success email sent", { email });
    } catch (error) {
      logger.error("Failed to send password reset success email", {
        email,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new EmailService();
