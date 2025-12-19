require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/appError");

const app = express();

//load routes
const authRoute = require("./route/authRoute");

// middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());

const { generalLimiter } = require("./middleware/rateLimiting");

// Middleware to increase timeout for all req
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000);
  next();
});

// Routes
app.use("/auth", authRoute);

app.use(generalLimiter);

app.set("trust proxy", 1);

app.all("/*splat", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

// Error middleware
const errorHandler = require("./middleware/errorHandler");

app.use(errorHandler);

module.exports = app;
