const jwt = require("jsonwebtoken");
const User = require("../model/authModel");
const AppError = require("../utils/appError");
const asyncHandler = require("../middleware/asyncHandler");

exports.authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new AppError("Not logged in. Please provide a valid token.", 401)
    );
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_KEY);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(
        new AppError("Your token has expired. Please log in again.", 401)
      );
    }
    return next(new AppError("Invalid token. Please log in again.", 401));
  }

  const user = await User.findById(decoded.userId).select("-password");
  if (!user) return next(new AppError("User not found", 404));

  req.user = { id: user.id, role: user.role };

  next();
});
