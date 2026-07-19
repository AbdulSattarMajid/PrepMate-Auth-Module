const express = require('express');
const router = express.Router();
// Import deleteJob here!
const { createJob, getJobs, deleteJob } = require('../controllers/jobController');

const protect = require('../middlewares/authMiddleware'); 

// Your existing routes
router.route('/')
  .get(protect, getJobs)
  .post(protect, createJob);

// ADD THIS NEW ROUTE for deleting
router.route('/:id')
  .delete(protect, deleteJob);

module.exports = router;