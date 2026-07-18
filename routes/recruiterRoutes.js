const express = require("express");
const router = express.Router();
const { getTalentPool, unlockCandidate } = require("../controllers/recruiterController");
const protect = require("../middlewares/authMiddleware");

// Inline middleware to double-check role
const isRecruiter = (req, res, next) => {
  if (req.user && (req.user.role === 'recruiter' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ success: false, message: "Access denied. Recruiters only." });
  }
};

// --- Recruiter Dashboard Routes ---
router.get("/talent-pool", protect, isRecruiter, getTalentPool);
router.post("/unlock/:id", protect, isRecruiter, unlockCandidate);

module.exports = router;