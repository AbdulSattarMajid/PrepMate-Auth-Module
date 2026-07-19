const express = require('express');
const router = express.Router();
const { createJob, getJobs } = require('../controllers/jobController');

// Import your existing authentication middleware
// Change this path if your auth middleware is named/located differently
const { protect } = require('../middleware/authMiddleware'); 

// Apply the protect middleware so only logged-in users can access these routes
router.route('/')
  .get(protect, getJobs)
  .post(protect, createJob);

module.exports = router;