// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, 
  googleId: { type: String }, 
  
  role: { 
    type: String, 
    enum: ["candidate", "recruiter", "admin"],
    default: "candidate" 
  },
  
  plan: {
    type: String,
    enum: ["Basic", "Pro", "Elite"],
    default: "Basic"
  },
  
  avatarUrl: { type: String, default: "" },
  points: { type: Number, default: 0 },
  
  savedPosts: [{
    type: mongoose.Schema.ObjectId,
    ref: "Post"
  }],

  tokens: { 
    type: Number, 
    default: 100 
  },
  maxTokens: {
    type: Number,
    default: 200 
  },
  lastDailyRewardDate: {
    type: Date,
    default: null
  },
  
  lastFreeInterviewDate: {
    type: Date,
    default: null
  },
  lastFreeResumeDate: {
    type: Date,
    default: null
  },

  unlockedProfiles: [{
    type: mongoose.Schema.ObjectId,
    ref: "User"
  }],

  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },

}, { timestamps: true });

// --- MIDDLEWARE HOOKS ---
userSchema.pre("save", async function () {
  // 1. Admin Assignment
  if (this.email === "prepmate.services@gmail.com") {
    this.role = "admin";
  }

  // 2. 🌟 Auto-adjust Token Cap based on Plan Status
  // This runs when a new user registers OR when an existing user's plan changes
  if (this.isModified("plan") || this.isNew) {
    if (this.plan === "Basic") this.maxTokens = 200;
    if (this.plan === "Pro") this.maxTokens = 500;    // Adjust these caps as needed
    if (this.plan === "Elite") this.maxTokens = 1000;
  }

  // 3. Password Hashing
  // If password wasn't changed, skip hashing to prevent re-hashing an already hashed password
  if (!this.isModified("password") || !this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// --- INSTANCE METHODS ---
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; 
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);