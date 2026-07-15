const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const forumRoutes = require("./routes/forumRoutes");
const reviewRoutes = require('./routes/reviewRoutes');
const passport = require("passport");
const cors = require("cors");
const errorHandler = require("./middlewares/errorMiddleware");
const paymentRoutes = require('./routes/paymentRoutes');
// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Load Passport Configuration
require("./config/passport");

const app = express();

// --- MIDDLEWARES ---

// 1. Cookie Parser: Must be before routes to read JWTs from cookies
app.use(cookieParser()); 

// 2. Body Parsers: To read JSON and URL-encoded data from requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. CORS Configuration: Allows your friend's frontend to connect securely
app.use(cors({
  // In production (Render), set FRONTEND_URL to your friend's hosted URL
  origin: process.env.FRONTEND_URL || "http://localhost:5173", 
  credentials: true 
}));

// 4. Passport Initialization: (session: false since we are using JWT)
app.use(passport.initialize());

// --- ROUTES ---
app.use('/api/reviews', reviewRoutes);
// Mount Authentication Routes
app.use("/api/auth", authRoutes);
app.use("/api/forum/posts", forumRoutes);
app.use("/api/payments", paymentRoutes);
// API Health Check: Replaces the deleted home/test views
app.get("/", (req, res) => {
  res.json({ 
    success: true, 
    message: "PrepMate API is live and running",
    environment: process.env.NODE_ENV || "development"
  });
});

// --- ERROR HANDLING ---

// IMPORTANT: This must be placed AFTER all routes to catch errors
app.use(errorHandler);

// --- SERVER START ---

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);