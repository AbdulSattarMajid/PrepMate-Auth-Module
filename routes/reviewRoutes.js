// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { submitReview } = require('../controllers/reviewController');
const protect = require('../middlewares/authMiddleware'); // Your middleware file name

// The 'protect' middleware ensures only logged-in users can hit this route
router.post('/submit', protect, submitReview);

module.exports = router;