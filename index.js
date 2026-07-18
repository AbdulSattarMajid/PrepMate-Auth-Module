const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const forumRoutes = require("./routes/forumRoutes");
const reviewRoutes = require('./routes/reviewRoutes');
const contactRoutes = require('./routes/contactRoutes');
const recruiterRoutes = require("./routes/recruiterRoutes");
const passport = require("passport");
const cors = require("cors");
const errorHandler = require("./middlewares/errorMiddleware");
const paymentRoutes = require('./routes/paymentRoutes');

// 1. Import native HTTP server module and Socket.io
const http = require("http");
const { Server } = require("socket.io");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Load Passport Configuration
require("./config/passport");

const app = express();

// 2. Wrap the Express app in a native HTTP server instance
const server = http.createServer(app);

// 3. Initialize Socket.io and attach it to the HTTP server
const io = new Server(server, {
  cors: {
    // Matches your Express CORS config below
    origin: process.env.FRONTEND_URL || "http://localhost:5173", 
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// 4. Pass our Socket.io instance into the routing file
require("./sockets/supportSocket")(io);

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
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/contact", contactRoutes);
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
    message: "PrepMate API is live, running, and WebSocket enabled!",
    environment: process.env.NODE_ENV || "development"
  });
});

// --- ERROR HANDLING ---

// IMPORTANT: This must be placed AFTER all routes to catch errors
app.use(errorHandler);

// --- SERVER START ---

const PORT = process.env.PORT || 5000;

// 5. CRITICAL: Start the HTTP server wrapper instead of the app direct runner
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT} (WebSockets active)`)
);