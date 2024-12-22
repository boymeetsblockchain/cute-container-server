const asyncHandler = require("express-async-handler");
const sendOTPEmail = require("../services/email");
const generateOTP = require("../services/generateOtp");
const User = require("../models/user.model");
const cloudinary = require("../config/cloudinary");
const { hash, compare } = require("bcryptjs");
const fs = require("fs");
const generateToken = require("../services/token");
const generateOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email input
  if (!email) {
    return res.status(400).json({
      message: "Please provide a valid email",
    });
  }

  // Check if the email already exists in the database
  const checkEmailExists = await User.findOne({ email });
  if (checkEmailExists) {
    return res.status(401).json({
      message: "User already exists. Provide new details",
    });
  }

  // Generate OTP and create a new user
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  const user = new User({
    email,
    otp,
    otpExpires,
  });

  try {
    await sendOTPEmail(email, otp);
    await user.save();
    res.status(201).json({
      message: "OTP sent successfully",
      email,
    });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    res.status(500).json({
      message: "Failed to send OTP. Please try again later.",
    });
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  // Validate email and OTP input
  if (!email || !otp) {
    return res.status(400).json({
      message: "Please provide a valid email and OTP",
    });
  }

  // Check if the user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      message: "User does not exist. Provide valid details.",
    });
  }

  // Check if OTP is valid and not expired
  if (user.otp !== otp) {
    return res.status(400).json({
      message: "Invalid OTP. Please try again.",
    });
  }

  if (user.otpExpires < Date.now()) {
    return res.status(400).json({
      message: "OTP has expired. Please request a new one.",
    });
  }

  // Update user verification status
  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;

  await user.save();

  res.status(200).json({
    message: "User successfully verified.",
  });
});

const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email input
  if (!email) {
    return res.status(400).json({
      message: "Please provide a valid email",
    });
  }

  // Check if the user exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      message: "User does not exist. Provide valid details.",
    });
  }

  // Generate a new OTP and set expiration time (e.g., 5 minutes)
  const newOtp = generateOTP();
  const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes from now

  user.otp = newOtp;
  user.otpExpires = otpExpires;

  // Save the updated user
  await user.save();

  // Send the new OTP to the user's email
  try {
    await sendOTPEmail(email, newOtp);
    res.status(200).json({
      message: "OTP resent successfully.",
    });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    res.status(500).json({
      message: "Failed to resend OTP. Please try again later.",
    });
  }
});

const createProfile = asyncHandler(async (req, res) => {
  const { email, firstname, lastname, birthDate } = req.body;

  console.log({
    email,
    firstname,
    lastname,
    birthDate,
  });
  // Validate email and required fields
  if (!email || !firstname || !lastname || !birthDate) {
    return res.status(400).json({
      message: "Please fill in all required fields",
    });
  }

  // Validate if a file is uploaded
  if (!req.file || !req.file.path) {
    return res.status(400).json({
      message: "No image file provided",
    });
  }

  try {
    const imagePath = req.file.path;

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "cute-container",
    });

    const profilePic = result.secure_url;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found. Please sign up.",
      });
    }

    // Update user details
    user.firstname = firstname;
    user.lastname = lastname;
    user.birthDate = birthDate;
    user.profilePic = profilePic;

    await user.save();

    // Delete the local file after successful upload
    fs.unlinkSync(imagePath);

    res.status(200).json({
      message: "User profile created successfully",
      profile: {
        firstname,
        lastname,
        birthDate,
        profilePic,
      },
    });
  } catch (error) {
    console.error("Error creating user profile:", error);

    // Clean up the local file in case of error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Something went wrong while creating user profile",
      error: error.message,
    });
  }
});

const updateProfile = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user fields based on provided data
    const updatableFields = [
      "firstname",
      "lastname",
      "birthDate",
      "about",
      "gallery",
      "gender",
      "interests",
      "address",
      "gender",
    ];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    // Save the updated user
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      profile: {
        firstname: user.firstname,
        lastname: user.lastname,
        birthDate: user.birthDate,
        about: user.about,
        gallery: user.gallery,
        interests: user.interests,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      message: "An error occurred while updating the profile",
      error: error.message,
    });
  }
});

const createPassword = asyncHandler(async (req, res) => {
  const { password, email } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Please fill in all fields" });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({
      message: "User Doesn't exist please create user",
    });
  }

  const hashedPassword = await hash(password, 10);

  user.password = hashedPassword;
  user.save();

  res.status(200).json({ message: "Password Created" });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      message: "Please Fill in All fields",
    });
  }
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    res.status(400).json({
      message: "User not found, please signup",
    });
  }
  if (!existingUser.isVerified) {
    res.status(400).json({
      message: "Please Verify Your Email",
    });
  }

  const isPasswordCorrect = await compare(password, existingUser.password);

  const token = generateToken(existingUser._id);

  if (isPasswordCorrect) {
    // Send HTTP-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: "none",
      secure: true,
    });
  }

  if (existingUser && isPasswordCorrect) {
    const { _id, email } = existingUser;
    res.status(200).json({
      token,
      email,
      _id,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});
module.exports = {
  generateOtp,
  verifyOtp,
  resendOtp,
  createPassword,
  createProfile,
  updateProfile,
  loginUser,
};
