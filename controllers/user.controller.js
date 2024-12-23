const User = require("../models/user.model");
const asyncHandler = require("express-async-handler");

// Get All Users
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find().select("-otp -otpExpires -__v -password");
    res.status(200).json({
      message: "All users retrieved successfully",
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while retrieving users",
      error: error.message,
    });
  }
});

// Get Single User
const getSingleUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select(
      "-otp -otpExpires -__v -password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while retrieving the user",
      error: error.message,
    });
  }
});

const getUsersByGender = asyncHandler(async (req, res) => {
  const { gender } = req.query;

  if (!gender) {
    return res.status(400).json({
      message: "Gender is required as a query parameter.",
    });
  }

  try {
    const users = await User.find({ gender })
      .select("-otp -otpExpires -__v -password")
      .lean();

    if (!users.length) {
      return res.status(404).json({
        message: `No users found for gender: ${gender}`,
      });
    }

    res.status(200).json({
      message: "Users retrieved successfully",
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while retrieving users",
      error: error.message,
    });
  }
});

const sendMatchRequest = asyncHandler(async (req, res) => {
  const { senderId, receiverId } = req.body;

  if (!senderId || !receiverId) {
    return res
      .status(400)
      .json({ message: "Both senderId and receiverId are required." });
  }

  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  if (!sender || !receiver) {
    return res.status(404).json({ message: "Sender or Receiver not found." });
  }

  const existingRequest = receiver.matchRequests.find(
    (request) => request.senderId.toString() === senderId
  );
  if (existingRequest) {
    return res.status(400).json({ message: "Match request already sent." });
  }

  receiver.matchRequests.push({ senderId });
  await receiver.save();

  res.status(200).json({ message: "Match request sent successfully." });
});

const handleMatchRequest = asyncHandler(async (req, res) => {
  const { receiverId, senderId, action } = req.body;

  if (!receiverId || !senderId || !action) {
    return res
      .status(400)
      .json({ message: "receiverId, senderId, and action are required." });
  }

  const receiver = await User.findById(receiverId).populate(
    "matchRequests.senderId"
  );
  const sender = await User.findById(senderId);

  if (!receiver || !sender) {
    return res.status(404).json({ message: "Sender or Receiver not found." });
  }

  const requestIndex = receiver.matchRequests.findIndex(
    (request) => request.senderId._id.toString() === senderId
  );

  if (requestIndex === -1) {
    return res.status(404).json({ message: "Match request not found." });
  }

  if (action === "accept") {
    // Update status
    receiver.matchRequests[requestIndex].status = "accepted";

    // Add both users to each other's matches
    receiver.matchedUsers.push(senderId);
    sender.matchedUsers.push(receiverId);

    await sender.save();
  } else if (action === "reject") {
    // Update status
    receiver.matchRequests[requestIndex].status = "rejected";
  } else {
    return res
      .status(400)
      .json({ message: "Invalid action. Use 'accept' or 'reject'." });
  }

  await receiver.save();

  res.status(200).json({ message: `Match request ${action}ed successfully.` });
});

const getMatchedUsers = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the current user
    const user = await User.findById(userId).populate({
      path: "matchedUsers",
      select: "firstname lastname email profilePic gender",
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Retrieve matched users
    const matchedUsers = user.matchedUsers;

    if (matchedUsers.length === 0) {
      return res.status(200).json({
        message: "No matches found",
        matches: [],
      });
    }

    res.status(200).json({
      message: "Matched users retrieved successfully",
      matches: matchedUsers,
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while retrieving matches",
      error: error.message,
    });
  }
});

module.exports = {
  getAllUsers,
  getSingleUser,
  getUsersByGender,
  sendMatchRequest,
  handleMatchRequest,
  getMatchedUsers,
};
