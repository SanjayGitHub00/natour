const express = require("express");

const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

router.post("/signup", authController.signUp);
router.post("/login", authController.login);
router.post("/forgotpassword", authController.forgotpassword);
router.patch("/resetpassword/:token", authController.resetpassword);

/* A middleware that protects the routes that come after it. */
router.use(authController.protect);

router.patch("/updatemypassword", authController.updatePassword);

router.route("/me").get(userController.getMe, userController.getUser);

router.patch("/updateme", userController.updateMe);
router.delete("/deleteMe", userController.deleteMe);

router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUser)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
