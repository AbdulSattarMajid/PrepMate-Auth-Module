const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // 1. Look for the token in the cookies (Matches our new secure approach)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } 
  // 2. Keep this as a backup in case you still use Bearer tokens for mobile or testing
  else if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // If no token is found in either place
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token found" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user to the request object (excluding password)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

module.exports = protect;