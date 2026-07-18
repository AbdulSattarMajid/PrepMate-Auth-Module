// controllers/serviceController.js
const axios = require('axios'); 

// The URL of your Python AI server
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || "http://localhost:8000";

// --- INTERVIEW BRIDGE ---
exports.startInterview = async (req, res) => {
  try {
    // If the code reaches here, the user has either used their free pass OR paid tokens.
    // We forward the request to the Python backend's reset endpoint
    const response = await axios.post(`${PYTHON_AI_URL}/reset`);

    res.json({
      success: true,
      usedFreePass: req.usedFreePass || false, 
      data: response.data 
    });

  } catch (error) {
    console.error("Python Interview microservice failed:", error.message);
    res.status(500).json({ success: false, message: "AI Engine failed to start the interview." });
  }
};

// --- RESUME ANALYSIS BRIDGE ---
exports.startResumeAnalysis = async (req, res) => {
  try {
    // Forward to whatever your Python resume endpoint is
    const response = await axios.post(`${PYTHON_AI_URL}/resume/analyze`, req.body);

    res.json({
      success: true,
      usedFreePass: req.usedFreePass || false,
      data: response.data
    });

  } catch (error) {
    console.error("Python Resume microservice failed:", error.message);
    res.status(500).json({ success: false, message: "AI Engine failed to analyze the resume." });
  }
};