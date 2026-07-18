const User = require("../models/User");

// @desc    Get all candidates (Masked unless unlocked)
// @route   GET /api/recruiter/talent-pool
exports.getTalentPool = async (req, res) => {
  try {
    // 1. Fetch all candidates
    const candidates = await User.find({ role: "candidate" }).select("-password");

    // 2. Map through candidates and apply the Privacy Mask
    const talentPool = candidates.map(candidate => {
      // Check if the recruiter has already spent a token on this specific candidate
      const isUnlocked = req.user.unlockedProfiles.some(
        (id) => id.toString() === candidate._id.toString()
      );

      return {
        _id: candidate._id,
        // 🌟 THE PRIVACY WALL: Mask data if not unlocked
        name: isUnlocked ? candidate.name : "Anonymous Candidate",
        email: isUnlocked ? candidate.email : "Hidden (Requires Unlock)",
        avatarUrl: isUnlocked ? candidate.avatarUrl : null,
        
        // Publicly visible stats to help them decide to buy
        points: candidate.points,
        plan: candidate.plan,
        isUnlocked: isUnlocked,
        
        // NOTE: Since you haven't linked the final Interview schema yet, 
        // you can attach the AI Hireability Score here later!
        status: "Actively Interviewing" 
      };
    });

    res.status(200).json({ success: true, data: talentPool });
  } catch (error) {
    console.error("Talent Pool Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching talent pool" });
  }
};

// @desc    Spend 1 Token to Unlock a Candidate
// @route   POST /api/recruiter/unlock/:id
exports.unlockCandidate = async (req, res) => {
  try {
    const candidateId = req.params.id;
    const recruiter = req.user; // Provided by your 'protect' middleware

    // 1. Verify candidate exists
    const candidate = await User.findById(candidateId).select("-password");
    if (!candidate || candidate.role !== "candidate") {
      return res.status(404).json({ success: false, message: "Candidate not found." });
    }

    // 2. Check if already unlocked to prevent double-charging
    const alreadyUnlocked = recruiter.unlockedProfiles.some(
      (id) => id.toString() === candidateId.toString()
    );
    if (alreadyUnlocked) {
      return res.status(400).json({ success: false, message: "Profile is already unlocked." });
    }

    // 3. 🛑 TOKEN ECONOMY CHECK
    if (recruiter.tokens < 1) {
      return res.status(402).json({ 
        success: false, 
        message: "Insufficient tokens. Please purchase more tokens to unlock this profile." 
      });
    }

    // 4. Perform the transaction
    recruiter.tokens -= 1; // Deduct 1 token
    recruiter.unlockedProfiles.push(candidateId); // Add to wallet
    await recruiter.save();

    res.status(200).json({ 
      success: true, 
      message: "Candidate unlocked successfully!",
      tokensRemaining: recruiter.tokens,
      unlockedProfile: candidate // Return the full unmasked profile!
    });

  } catch (error) {
    console.error("Unlock Error:", error);
    res.status(500).json({ success: false, message: "Server error unlocking candidate." });
  }
};