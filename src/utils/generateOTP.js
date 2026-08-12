const crypto = require("node:crypto");

const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const generateOTP = () => {
  const otp = crypto.randomInt(100000, 1000000).toString();

  return {
    otp,
    hashedOTP: hashOTP(otp),
  };
};

generateOTP.hashOTP = hashOTP;

module.exports = generateOTP;
