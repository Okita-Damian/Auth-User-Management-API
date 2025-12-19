const crypto = require("crypto");

function generateSecureOTP(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz123456789";
  let otp = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    const index = bytes[i] % chars.length;
    otp += chars[index];
  }
  return otp;
}

module.exports = generateSecureOTP;
