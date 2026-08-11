const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const keyGenerator = (req) => {
  // if user  is authenticated use the user ID
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  // otherwise, fall back to ip address
  return ipKeyGenerator(req);
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max requests per window
  keyGenerator, // custom key logic
  standardHeaders: true, // send rate limit info in headers
  legacyHeaders: false, // disable old headers
  message: {
    status: "error",
    message: "Too many requests. Please try again later.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // max attempts
  keyGenerator: (req) => ipKeyGenerator(req.ip), // IP only
  skipFailedRequests: false,
  skipSuccessfulRequests: true,
  message: {
    status: "error",
    message: "Too many login attempts. Try again later.",
  },
});

const otpLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many OTP requests. Try again in later .",
  },
});

module.exports = {
  generalLimiter,
  otpLimiter,
  loginLimiter,
};
