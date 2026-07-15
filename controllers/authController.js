const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

/**
 * Helper function to handle cookie setting
 */
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
        communityPoints: user.communityPoints,
        savedPosts: user.savedPosts
      },
    });
};

// @desc    Register user (Sends OTP & Handles unverified users)
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide all fields" });
    }

    // 1. Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // SCENARIO A: User is already verified - Block them
      if (user.isVerified) {
        return res.status(400).json({ success: false, message: "User already exists and is verified. Please login." });
      }

      // SCENARIO B: Ghost User (Found but not verified) - Update and Resend OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.name = name; 
      user.password = password; 
      user.otp = otp;
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      await user.save(); 

      await sendEmail({
        email: user.email,
        subject: "PrepMate Verification Code",
        message: `Welcome back! Finish your registration with this code: ${otp}. It expires in 10 minutes.`,
      });

      return res.status(200).json({
        success: true,
        message: "Unverified account found. A new verification code has been sent!",
      });
    }

    // 2. SCENARIO C: Fresh New User - Create from scratch
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    user = await User.create({
      name,
      email,
      password,
      otp,
      otpExpires,
      isVerified: false
    });

    try {
      await sendEmail({
        email: user.email,
        subject: "PrepMate Account Verification",
        message: `Welcome to PrepMate! Your verification code is: ${otp}. It expires in 10 minutes.`,
      });

      res.status(201).json({
        success: true,
        message: "Registration successful! Please check your email for the verification code.",
      });
    } catch (emailError) {
      console.error("EMAIL SEND ERROR:", emailError);
      res.status(500).json({ success: false, message: "User registered but email could not be sent." });
    }
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ 
      email, 
      otp, 
      otpExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, "Email verified successfully! You are now logged in.");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
        return res.status(403).json({ 
          success: false, 
          message: "Please verify your email before logging in." 
        });
      }
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
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
  res.status(200).json({ success: true, user: req.user });
};

// @desc    Logout user
// @route   GET /api/auth/logout
exports.logout = async (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({ success: true, message: "If an account exists with that email, a reset code has been sent." });
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetOtpExpires = Date.now() + 10 * 60 * 1000; 

    user.otp = resetOtp;
    user.otpExpires = resetOtpExpires;
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: "PrepMate Password Reset Code",
        message: `Your password reset code is: ${resetOtp}. This code expires in 10 minutes. If you did not request this, please ignore this email.`,
      });

      res.status(200).json({ success: true, message: "Reset code sent to email." });
    } catch (err) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: "Email could not be sent." });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset code." });
    }

    user.password = newPassword;
    user.otp = undefined; 
    user.otpExpires = undefined;
    user.isVerified = true; 

    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully! You can now login." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile & avatar
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.role) user.role = req.body.role;

    if (req.file) {
      user.avatarUrl = req.file.path;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        communityPoints: user.communityPoints,
        savedPosts: user.savedPosts
      }
    });

  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ success: false, message: "Server Error updating profile" });
  }
};

// 🌟 NEW: Update Password for logged-in user
// @route   PUT /api/auth/update-password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // We need to explicitly .select("+password") because we hid it in the User model by default
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify current password using your existing bcrypt method
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Incorrect current password." });
    }

    // Set new password (the model's pre-save middleware will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Update Password Error:", error);
    res.status(500).json({ success: false, message: "Failed to update password." });
  }
};

// 🌟 NEW: Delete Own Account
// @route   DELETE /api/auth/delete-account
exports.deleteMyAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Optional safety check: Don't let Admins delete their account from the frontend settings
    if (req.user.role === 'admin') {
      return res.status(400).json({ success: false, message: "Admins cannot delete their accounts via settings." });
    }

    await User.findByIdAndDelete(userId);

    // Destroy the auth cookie since their account is gone
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });

    res.status(200).json({ success: true, message: "Account deleted successfully." });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete account." });
  }
};