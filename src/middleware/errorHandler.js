const logger = require("../utils/logger");

// ========== DEV MODE ERROR ==========
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

// ========== PROD MODE ERROR ==========
const sendErrorProd = (err, req, res) => {
  // Operational errors (AppError)
  if (err.isOperational) {
    logger.warn("Operational error", {
      message: err.message,
      statusCode: err.statusCode,
      path: req.originalUrl,
      method: req.method,
    });

    return res.status(err.statusCode || 500).json({
      status: err.status || "error",
      message: err.message,
    });
  }

  // Programming / unknown errors
  logger.error("Unexpected error", {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  res.status(500).json({
    status: "error",
    message: "Something went wrong. Please try again later.",
  });
};

// ========== GLOBAL ERROR HANDLER ==========
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "production") {
    let error = object.assign({}, err);
    error.message = err.message;

    // Default
    let message = error.message;
    let statusCode = error.statusCode;

    // Invalid ObjectId
    if (err.name === "CastError") {
      message = `Invalid ${err.path}: ${err.value}`;
      statusCode = 400;
    }

    // Duplicate key error
    if (err.code === 11000) {
      const keyValue = err.keyValue || {};
      const field = Object.keys(keyValue)[0] || "field";
      const fieldValue = keyValue[field] || "unknown";
      message = `Duplicate value for '${field}': '${fieldValue}'. Please use a different value.`;
      statusCode = 400;
    }

    // Validation error
    if (err.name === "ValidationError") {
      const errors = err.errors || {};
      message = Object.values(errors)
        .map((val) => val.message)
        .join(", ");
      statusCode = 400;
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
      message = "Invalid token. Please log in again.";
      statusCode = 401;
    } else if (err.name === "TokenExpiredError") {
      message = "Your token has expired. Please log in again.";
      statusCode = 401;
    }

    // Assign updated message and status
    error.message = message;
    error.statusCode = statusCode;

    sendErrorProd(error, res);
  } else {
    sendErrorDev(err, res);
  }
};

module.exports = errorHandler;
