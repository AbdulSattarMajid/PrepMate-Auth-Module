// routes/serviceRoutes.js
const express = require("express");
const router = express.Router();

// ✅ FIX: Removed curly braces so the middleware imports correctly
const protect = require("../middlewares/authMiddleware"); 
const { chargeTokens } = require("../middlewares/tokenMiddleware");
const { startInterview, startResumeAnalysis } = require("../controllers/serviceController");

// The cost of services (adjust these numbers as needed)
const TOKEN_COSTS = {
  INTERVIEW: 20,
  RESUME: 10
};

// 1. Interview Route: Checks for free pass, or charges 20 tokens
router.post(
  "/start-interview", 
  protect, 
  chargeTokens(TOKEN_COSTS.INTERVIEW, 'interview'), 
  startInterview
);

// 2. Resume Route: Checks for free pass, or charges 10 tokens
router.post(
  "/start-resume", 
  protect, 
  chargeTokens(TOKEN_COSTS.RESUME, 'resume'), 
  startResumeAnalysis
);

module.exports = router;