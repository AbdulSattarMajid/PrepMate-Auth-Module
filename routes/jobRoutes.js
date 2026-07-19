const express = require('express');
const router = express.Router();

// Import the new applyForJob function alongside your existing ones
const { createJob, getJobs, deleteJob, applyForJob } = require('../controllers/jobController');
const protect = require('../middlewares/authMiddleware'); 

// Your existing routes
router.route('/')
  .get(protect, getJobs)
  .post(protect, createJob);

router.route('/:id')
  .delete(protect, deleteJob);

// ADD THIS NEW ROUTE
router.route('/:id/apply')
  .post(protect, applyForJob);

module.exports = router;