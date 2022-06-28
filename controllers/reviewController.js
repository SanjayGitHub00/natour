const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require("./handleFactory");
const Review = require("../Models/reviewModel");

exports.setUserTourIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

/* Exporting the deleteOne function from the factory file. */
exports.getAllReviews = getAll(Review);
exports.deleteReview = deleteOne(Review);
exports.updateReview = updateOne(Review);
exports.createReview = createOne(Review);
exports.getReview = getOne(Review);
