const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/authModel");
const AppError = require("../utils/appError");
const logger = require("../utils/logger");

class AuthService {
  // email verification and query the DB to check email, return user doc if found or null if no user is found
  async emailExist(email) {
    const user = await User.findOne({ email });
    logger.info("Checked if email exist", { email, exists: !!user });
    return user;
  }
  // create a new user
  async createUser(userData) {
    // hash password before saving
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // create the user record
    const newUser = await User.create({
      fullname: userData.fullname,
      email: userData.email,
      password: hashedPassword,
    });
    logger.info("New user created", {
      userId: newUser._id,
      email: newUser.email,
    });
    return newUser;
  }

  // verify the login credentials
  async verifyCredentials(email, password) {
    // find user by email and exclude the password
    const user = await User.findOne({ email }).select("+password");

    // if user not found and credential did't match throw error
    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn("failed login attempt", { email });
      throw new AppError("Incorrect email or password", 401);
    }

    // Block login if email not verified
    if (!user.isEmailVerified) {
      logger.warn("Attempted login without verified email", {
        userId: user._id,
      });
      logger.warn("Attempted login without verified email", {
        userId: user._id,
      });
      throw new AppError("Please verify you email", 403);
    }
    logger.info("User login verified", { userId: user._id });
    return user;
  }

  // create access token
  generateToken(user) {
    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_KEY,
      { expiresIn: "15m" }
    );

    // create a refresh token
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: "7d" }
    );

    logger.info("Tokens generated", { userId: user._id });
    return { accessToken, refreshToken };
  }

  // verify the refreshToken
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_KEY);
    } catch (err) {
      logger.warn("Invalid refresh token", { error: err.message });
      throw new AppError("Invalid or expired refresh token", 401);
    }
  }

  // update user password
  async updatePassword(user, newPassword) {
    // prevent password reuse
    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      logger.warn("Attempt password reuse", { userId: user._id });
      throw new AppError(
        "New password can not be same as the old password",
        400
      );
    }

    // hash and save the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    logger.info("User password updated", { userId: user._id });
  }
  // verify user email
  async verifyUserEmail(userId) {
    await User.findByIdAndUpdate(userId, { isEmailVerified: true });
    logger.info("User email verified", { userId });
  }

  async saveRefreshToken(userId, refreshToken) {
    // find user by id
    const user = await User.findById(userId);
    // store refresh the token
    user.refreshToken = refreshToken;
    // mark user logged in true
    user.isLoggedIn = true;
    // save
    await user.save();
    logger.info("Refresh token saved", { userId });
  }

  // clear the refresh token (logout)
  async clearRefreshToken(userId) {
    // find the user by id and update
    await User.findByIdAndUpdate(
      userId,
      // clear the refresh token from the DB
      { refreshToken: null },
      { runValidators: false }
    );
    logger.info("Refresh token cleared", { userId });
  }
}

module.exports = new AuthService();
