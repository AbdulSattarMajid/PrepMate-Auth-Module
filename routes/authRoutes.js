const express = require("express");
const router = express.Router();
const passport = require("passport");

const { register, login, getProfile, logout } = require("../controllers/authController");
const protect = require("../middlewares/authMiddleware");
const generateToken = require("../utils/generateToken");

// Standard JWT Routes
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout); // Good to have this explicitly in routes

// Profile route - returns JSON data, no redirection logic needed here
router.get("/profile", protect, getProfile);

// --- Google OAuth Routes ---

// @desc    Initiate Google Authentication
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// @desc    Google Authentication Callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    // 1. Generate the token
    const token = generateToken(req.user._id);

    // 2. Set the HttpOnly cookie
    // Note: sameSite: "None" and secure: true are often needed for cross-site cookies on Render
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", 
    };

    res.cookie("token", token, cookieOptions);
    
    // 3. Redirect to the FRONTEND dashboard
    // We use an environment variable so you can change it easily when you deploy
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000/dashboard";
    res.redirect(frontendURL);
  }
);

module.exports = router;