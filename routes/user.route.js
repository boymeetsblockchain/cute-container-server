const express = require("express");
const {
  getAllUsers,
  getSingleUser,
  getUsersByGender,
  sendMatchRequest,
  handleMatchRequest,
  getMatchedUsers,
  getAllUsersExceptMeAndOppositeGender,
} = require("../controllers/user.controller");
const { protect } = require("../middlewares/authMiddleware");
const userRoute = express.Router();

userRoute.get("/getallusers", getAllUsers);
userRoute.get("/", protect, getAllUsersExceptMeAndOppositeGender);
userRoute.get("/getsingleuser/:id", getSingleUser);
userRoute.get("/matchedusers/:userId", getMatchedUsers);
userRoute.get("/gender", getUsersByGender);
userRoute.post("/match", sendMatchRequest);
userRoute.post("/handle", handleMatchRequest);

module.exports = userRoute;
