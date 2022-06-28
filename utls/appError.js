/* It's a class that extends the Error class and has a constructor that takes in a message and a
statusCode. It then sets the statusCode and status properties on the instance of the class. It also
sets the isOperational property to true. Finally, it captures the stack trace of the error. */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "failed" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
