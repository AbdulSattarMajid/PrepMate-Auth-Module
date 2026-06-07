const express = require("express");
const router = express.Router();
const passport = require("passport");

const { register, login, getProfile, logout, verifyOTP,forgotPassword, resetPassword } = require("../controllers/authController");
const protect = require("../middlewares/authMiddleware");
const generateToken = require("../utils/generateToken");

// Standard JWT Routes
router.post("/register", register);
router.post("/login", login);

// --- NEW OTP ROUTE ---
router.post("/verify-otp", verifyOTP); 

router.get("/logout", logout);
router.get("/profile", protect, getProfile);

// --- Password Reset Routes ---
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

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
    
    // Grab the base URL, default to localhost for development
    let frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
    
    // Safely append /dashboard and the token to the URL so React can catch it
    const redirectUrl = frontendURL.endsWith('/dashboard') 
      ? `${frontendURL}?token=${token}` 
      : `${frontendURL}/dashboard?token=${token}`;

    res.redirect(redirectUrl);
  }
);

module.exports = router;