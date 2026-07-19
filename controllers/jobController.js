const Job = require('../models/Job');

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Private (Recruiters/HR)
exports.createJob = async (req, res) => {
  try {
    const { title, company, location, type, experience, skills } = req.body;

    // Ensure the user exists in the request (requires auth middleware)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const newJob = await Job.create({
      title,
      company,
      location,
      type,
      experience,
      skills,
      postedBy: req.user._id // Assumes your auth middleware attaches the user object to req
    });

    res.status(201).json({ success: true, data: newJob });
  } catch (error) {
    console.error("Create Job Error:", error);
    res.status(500).json({ success: false, message: "Server error while creating job" });
  }
};

// @desc    Get all active job postings
// @route   GET /api/jobs
// @access  Private
exports.getJobs = async (req, res) => {
  try {
    // Fetch all active jobs, sort newest first, and optionally grab recruiter details
    const jobs = await Job.find({ isActive: true })
                          .sort({ createdAt: -1 })
                          .populate('postedBy', 'name role');

    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    console.error("Get Jobs Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching jobs" });
  }
};