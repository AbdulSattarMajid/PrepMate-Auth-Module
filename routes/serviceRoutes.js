// routes/serviceRoutes.js
const express = require("express");
const router = express.Router();

// Adjust the paths to your middlewares based on your folder structure
const { protect } = require("../middlewares/authMiddleware"); // Or whatever your auth middleware is named
const { chargeTokens } = require("../middlewares/tokenMiddleware");
const { startInterview, startResumeAnalysis } = require("../controllers/serviceController");

// The cost of services (adjust these numbers as needed)
const TOKEN_COSTS = {
  INTERVIEW: 20,
  RESUME: 10
};

// --- ROUTES ---

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