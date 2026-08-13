const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      require: true,
      trim: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: "please provide a valid email",
      },
    },
    gender: {
      type: String,
      required: false,
      enum: ["male", "female"],
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isLoggedIn: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Auth", userSchema);
