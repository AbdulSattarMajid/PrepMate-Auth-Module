const { TOKEN_COSTS } = require("../utils/tokenEconomy");

const chargeTokens = (cost) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authorized. Please log in." });
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