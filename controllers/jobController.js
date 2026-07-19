const Job = require('../models/Job');
const Application = require('../models/applicationModel'); // Ensure this matches your file name

exports.createJob = async (req, res) => {
  try {
    const { title, company, location, type, experience, skills } = req.body;

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
      postedBy: req.user._id 
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
    // Fetch all active jobs, sort newest first, and grab recruiter details
    // We add .lean() to convert Mongoose documents to standard JS objects so we can attach the applications array
    const jobs = await Job.find({ isActive: true })
                          .sort({ createdAt: -1 })
                          .populate('postedBy', 'name role')
                          .lean();

    // Check if the user is a recruiter
    const isRecruiter = req.user && (req.user.role === 'hr' || req.user.role === 'recruiter');

    // If recruiter, attach applications to the jobs they created
    if (isRecruiter) {
      for (let job of jobs) {
        // Because we populated postedBy, it is an object. We must safely check its _id
        if (job.postedBy && job.postedBy._id.toString() === req.user._id.toString()) {
          const applications = await Application.find({ job: job._id }).sort({ createdAt: -1 });
          job.applications = applications;
        } else {
          job.applications = [];
        }
      }
    }

    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    console.error("Get Jobs Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching jobs" });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Security check: Make sure the user deleting the job is the one who created it
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this job' });
    }

    await job.deleteOne();

    res.status(200).json({ success: true, message: 'Job removed successfully', data: {} });
  } catch (error) {
    console.error("Delete Job Error:", error);
    res.status(500).json({ success: false, message: "Server error while deleting job" });
  }
};

// @desc    Apply for a specific job
// @route   POST /api/jobs/:id/apply
// @access  Private (Candidates only)
exports.applyForJob = async (req, res) => {
  try {
    const { name, email, experience, coverLetter } = req.body;
    const jobId = req.params.id;

    // Verify the job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Prevent double applications
    const existingApplication = await Application.findOne({ job: jobId, applicant: req.user._id });
    if (existingApplication) {
      return res.status(400).json({ success: false, message: 'You have already applied for this role' });
    }

    // Create the application
    const application = await Application.create({
      job: jobId,
      applicant: req.user._id,
      name,
      email,
      experience,
      coverLetter
    });

    res.status(201).json({ success: true, message: 'Application submitted successfully', data: application });
  } catch (error) {
    console.error("Apply Job Error:", error);
    res.status(500).json({ success: false, message: "Server error while submitting application" });
  }
};