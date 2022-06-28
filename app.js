const express = require("express");

const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");

const app = express();

const tourRoute = require("./Routes/tourRoutes");

const userRoute = require(`./Routes/userRoutes`);
const reviewRoute = require(`./Routes/reviewRoute`);
const AppError = require("./utls/appError");
const globalErrorHandler = require("./controllers/errorController");

/* Checking if the environment is development and if it is then it will use the morgan middleware. */
if (process.env.NODE_ENV.trim() === "development") {
  app.use(morgan("dev"));
}

/* A security package that helps to secure the app. */
app.use(helmet());

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this ip please try again after one hour.",
});

/* Limiting the number of request that can be made to the server. */
app.use("/api", limiter);

/* A middleware that is used to parse the incoming request body into a json object. */
app.use(express.json({ limit: "10kb" }));

//* Data sanitization
app.use(xss());
app.use(mongoSanitize());

/* A middleware that is used to prevent parameter pollution. */
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

app.use(express.static(`${__dirname}/public`));

app.use("/api/v1/tours", tourRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/reviews", reviewRoute);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server.`, 404));
});

/* A middleware that is used to handle all the errors that are not handled by the other middlewares. */
app.use(globalErrorHandler);

module.exports = app;
