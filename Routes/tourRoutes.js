const express = require("express");

const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
// const reviewController = require("../controllers/reviewController");
const reviewRouter = require("./reviewRoute");

const router = express.Router();

router.use("/:tourId/reviews", reviewRouter);

// router.param("id", tourController.checkId);
router.route("/tour-stats").get(tourController.getToursStats);
router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan
  );

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTour, tourController.getAllTour);

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getTourWithin);

router.route("/distances/:latlng/uni/:unit").get(tourController.getDistances);

router
  .route("/")
  .get(tourController.getAllTour)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  );

// router
//   .route("/:tourId/reviews")
//   .post(
//     authController.protect,
//     authController.restrictTo("users"),
//     reviewController.createReview
//   );

module.exports = router;
