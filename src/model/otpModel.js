const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    otp: {
      type: String,
      required: true,
      select: false,
    },

    purpose: {
      type: String,
      enum: ["verify-email", "reset-password"],
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;
