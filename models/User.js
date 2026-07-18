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

  // 🌟 NEW: UNIFIED TOKEN ECONOMY
  tokens: { 
    type: Number, 
    default: 100 // New users get 100 on signup
  },
  maxTokens: {
    type: Number,
    default: 200 // Basic plan cap limits hoarding
  },
  lastDailyRewardDate: {
    type: Date,
    default: null
  },
  unlockedProfiles: [{
    type: mongoose.Schema.ObjectId,
    ref: "User"
  }],

  // --- OTP & VERIFICATION ---
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date },

}, { timestamps: true });

userSchema.pre("save", async function () {
  // 1. Master Admin Override
  if (this.email === "prepmate.services@gmail.com") {
    this.role = "admin";
  }

  // 2. Hash Password (if modified)
  if (!this.isModified("password") || !this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; 
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);