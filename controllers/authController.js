const Crypto = require("crypto");

const { promisify } = require("util");
const jwt = require("jsonwebtoken");

const User = require("../Models/userModel");
const catchAsync = require("../utls/catchAsync");
const AppError = require("../utls/appError");
const sendEmail = require("../utls/email");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * It creates a token and sends it to the user.
 * @param user - the user object that was created or found
 * @param statusCode - the status code of the response
 * @param res - the response object
 */

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOption = {
    expiresIn: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOption.secure = true;

  user.password = undefined;

  res.cookie("jwt", token, cookieOption);

  res.status(statusCode).json({
    status: "Success",
    token: token,
    data: {
      user: user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //* CHECK IF THE EMAIL AND PASSWORD EXIST.
  if (!email || !password) {
    return next(new AppError("Please provide a email and password", 400));
  }
  //* CHECK IF USER EXIST && PASSWORD IS MATCH.
  const user = await User.findOne({ email: email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email and password.", 401));
  }

  //* IF EVERYTHING IS OK. THEN SEND TOKEN TO THE CLIENT
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //* GET THE TOKEN OR CHECK THE TOKEN IS THERE
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. Please log in to get access!", 401)
    );
  }
  //* VERIFY TOKEN
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //* CHECK IF USER STILL EXISTS
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }
  //* CHECK IF USER CHANGE PASSWORD AFTER JWT TOKEN ISSUED.
  if (freshUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "User recently changed here password. Please login again.",
        401
      )
    );
  }
  //* Grande access to the potected route
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have the permision for performing this operation.",
          403
        )
      );
    }
    next();
  };
};

exports.forgotpassword = catchAsync(async (req, res, next) => {
  //* GET USER BY POSTED EMAIL
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email.", 404));
  }
  //* GENERATE THE RANDOM TOKEN
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //* SEND IT TO THE USER
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetpassword/${resetToken}`;

  const message = `Forgot your password? Send a PATCH request with your new password and passwordConfirm to:${resetURL}. If you not forgot yout password please ignore this email.`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token is valid fot only 10Min.",
      message,
    });

    res.status(200).json({
      status: "Success",
      message: "token send to the email.",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There is an error while sending a email. Please try again after some time.",
        500
      )
    );
  }
});

exports.resetpassword = catchAsync(async (req, res, next) => {
  //* GET USER BASED ON TOKEN
  const hashedToken = Crypto.createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //* SET NEW PASSWORD IF TOKEN WAS NOT EXPIRES & THERE IS AN USER. THEN SET THE NEW PASSWORD
  if (!user) {
    return next(new AppError("Token is invalid or expires.", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;

  await user.save();
  //* UPDATE CHANGEPASSWORDAT PROPERTY FOR THE USER
  //* LOGIN THE USER SEND TOKEN
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //* get user from collection

  const user = await User.findById(req.user.id).select("+password");
  //* check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }
  //* if correct update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //* login the user with new password
  createSendToken(user, 200, res);
});
