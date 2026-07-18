const { TOKEN_COSTS } = require("../utils/tokenEconomy");

const chargeTokens = (cost, serviceType = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authorized. Please log in." });
      }

      const today = new Date().toDateString();

      if (serviceType === 'interview') {
        const lastFree = req.user.lastFreeInterviewDate ? new Date(req.user.lastFreeInterviewDate).toDateString() : null;
        if (lastFree !== today) {
          req.user.lastFreeInterviewDate = new Date();
          await req.user.save();
          req.usedFreePass = true; 
          return next();
        }
      }

      if (serviceType === 'resume') {
        const lastFree = req.user.lastFreeResumeDate ? new Date(req.user.lastFreeResumeDate).toDateString() : null;
        if (lastFree !== today) {
          req.user.lastFreeResumeDate = new Date();
          await req.user.save();
          req.usedFreePass = true; 
          return next();
        }
      }

      if (req.user.tokens < cost) {
        return res.status(402).json({ 
          success: false, 
          message: `Not enough tokens. This action costs ${cost} tokens, but you only have ${req.user.tokens}.`,
          shortfall: cost - req.user.tokens
        });
      }

      req.user.tokens -= cost;
      await req.user.save();

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error processing token transaction." });
    }
  };
};

module.exports = { chargeTokens };