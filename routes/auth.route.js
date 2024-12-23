const express = require("express");
const multer = require("multer");
const {
  generateOtp,
  verifyOtp,
  loginUser,
  createPassword,
  createProfile,
  resendOtp,
  updateProfile,
  getUser,
  gallery,
} = require("../controllers/auth.controller");
const { protect } = require("../middlewares/authMiddleware");
const upload = multer({ dest: "uploads/" });

const authRoute = express.Router();

authRoute.post("/send-otp", generateOtp);
authRoute.get("/", protect, getUser);
authRoute.get("/create-gallery", protect, upload.array("images", 5), gallery);
authRoute.post("/verify-otp", verifyOtp);
authRoute.post("/resend-otp", resendOtp);
authRoute.post("/create-profile", upload.single("image"), createProfile);
authRoute.post("/create-password", createPassword);
authRoute.put("/update-profile", updateProfile);
authRoute.post("/login", loginUser);
module.exports = authRoute;
