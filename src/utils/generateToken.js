const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");

const generateRefreshToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError("jwt-secret is missing", 500);
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

module.exports = generateRefreshToken;
