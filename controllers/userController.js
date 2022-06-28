const User = require("../Models/userModel");
const AppError = require("../utls/appError");
const catchAsync = require("../utls/catchAsync");
const { deleteOne, updateOne, getOne, getAll } = require("./handleFactory");

const filterObj = (obj, ...allowedFields) => {
  const newObj = [];
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined! Please use /signup instead.",
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //* CREATE ERROR IF USER POSTS PASSWORD DATA
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for update password. Please use /updatemypassword",
        400
      )
    );
  }
  //* UPDATE USER DATA
  const filteredBody = filterObj(req.body, "name", "email");

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "Success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "Success",
    user: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllUser = getAll(User);
exports.getUser = getOne(User);
exports.deleteUser = deleteOne(User);
exports.updateUser = updateOne(User);
