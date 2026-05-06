const User = require("../models/User");
const generateToken = require("../utils/generateToken");

/**
 * Helper function to handle cookie setting
 * Ensures consistency across login, register, and OAuth flows.
 */
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    // On Render, cookies must be secure in production for HTTPS
    secure: process.env.NODE_ENV === "production",
    // "None" is essential for cross-domain integration (e.g., Vercel frontend to Render backend)
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  };

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      message,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all fields",
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    sendTokenResponse(user, 201, res, "User registered successfully");
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user and explicitly select password (since select: false in model)
    const user = await User.findOne({ email }).select("+password");

    // 2. Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      sendTokenResponse(user, 200, res, "Logged in successfully");
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
exports.getProfile = async (req, res) => {
  // req.user is populated by the 'protect' middleware (authMiddleware.js)
  // Check if req.user exists just in case
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  res.status(200).json({
    success: true,
    user: req.user
  });
};

// @desc    Logout user (Clear Cookie)
// @route   GET /api/auth/logout
exports.logout = async (req, res) => {
  // Clear the cookie by setting it to 'none' and expiring it immediately
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000), 
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
};