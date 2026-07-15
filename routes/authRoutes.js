const express = require("express");
const router = express.Router();
const passport = require("passport");

const User = require("../models/User"); 

const { 
  register, 
  login, 
  getProfile, 
  logout, 
  verifyOTP,
  forgotPassword, 
  resetPassword,
  updateProfile,
  updatePassword,   // 🌟 NEW
  deleteMyAccount   // 🌟 NEW
} = require("../controllers/authController");

const protect = require("../middlewares/authMiddleware");
const generateToken = require("../utils/generateToken");

const { upload } = require("../config/cloudinary"); 

// --- Standard Auth Routes ---
router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOTP); 
router.get("/logout", logout);
router.get("/profile", protect, getProfile);

// Catch image and send to Cloudinary
router.put("/profile", protect, upload.single("avatar"), updateProfile);

// 🌟 NEW SECURE ROUTES
router.put("/update-password", protect, updatePassword);
router.delete("/delete-account", protect, deleteMyAccount);

// --- Password Reset Routes ---
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// --- ADMIN ROUTES --- 
// GET /api/auth/users - Fetch all users (Admin Only)
router.get("/users", protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching users' });
  }
});

// DELETE /api/auth/users/:id - Delete a specific user (Admin Only)
router.delete("/users/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }

    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting user' });
  }
});

// --- Google OAuth Routes ---
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    const token = generateToken(req.user._id);

    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", 
    };
    res.cookie("token", token, cookieOptions);
    
    let frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
    const redirectUrl = frontendURL.endsWith('/dashboard') 
      ? `${frontendURL}?token=${token}` 
      : `${frontendURL}/dashboard?token=${token}`;

    res.redirect(redirectUrl);
  }
);

module.exports = router;