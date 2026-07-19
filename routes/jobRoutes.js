const express = require('express');
const router = express.Router();
const { createJob, getJobs } = require('../controllers/jobController');


const  protect  = require('../middlewares/authMiddleware'); 

router.route('/')
  .get(protect, getJobs)
  .post(protect, createJob);

module.exports = router;