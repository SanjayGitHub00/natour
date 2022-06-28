const AppError = require("../utls/appError");

const handleCastErrorDb = (err) => {
  const message = `Invalid ${err.path}:${err.value}.`;

  return new AppError(message, 400);
};
const handleDuplicateFieldDb = (err) => {
  // const value = err.errmng.match(/(['"])(\\?.)*?\1/)[0];
  const value = err.keyValue.name;
  const message = `Duplicate field value: ${value}, Please use another value.`;

  return new AppError(message, 400);
};
const handleValidationErrorDb = (err) => {
  const { errors } = err;
  const errMessages = Object.values(errors).map((el) => el.message);
  const message = `Invalid input data. ${errMessages.join(". ")}`;

  return new AppError(message, 400);
};

const handleJsonWebTokenError = () =>
  new AppError("Invalid Token. Please login again.", 401);

const handleTokenExpiredError = () =>
  new AppError("Your token has been expired. Please login again.", 401);

const sendErrDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Log Error
    console.error("Error 💣💣💣💣", err);

    res.status(500).json({
      status: "fail",
      message: "Something Went Wrong.",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  // console.log(err);

  if (process.env.NODE_ENV.trim() === "development") {
    sendErrDev(err, res);
  } else if (process.env.NODE_ENV.trim() === "production") {
    // let error = { ...JSON.parse(JSON.stringify(err)) };
    let error = JSON.parse(JSON.stringify(err));

    if (error.name === "CastError") {
      error = handleCastErrorDb(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldDb(error);
    }
    if (error.name === "ValidationError") {
      error = handleValidationErrorDb(error);
    }
    if (error.name === "jsonWebTokenError") {
      error = handleJsonWebTokenError(error);
    }
    if (error.name === "tokenExpiredError") {
      error = handleTokenExpiredError(error);
    }
    sendErrProd(error, res);
  }
};
