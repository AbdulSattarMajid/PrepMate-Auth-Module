const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, 
  googleId: { type: String }, 
  
  // --- UPDATED ROLE FIELD ---
  role: { 
    type: String, 
    enum: ["candidate", "recruiter", "admin"],
    default: "candidate" 
  },
  
  // --- IDENTITY & COMMUNITY EXTENSION ---
  avatarUrl: { // Stores the Cloudinary string
    type: String, 
    default: "" 
  },
  communityPoints: { // Drives the Gamification badges
    type: Number, 
    default: 0 
  },
  savedPosts: [{
    type: mongoose.Schema.ObjectId,
    ref: "Post"
  }],

  // --- OTP & VERIFICATION ---
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  otp: { type: String },
  otpExpires: { type: Date },

}, { timestamps: true });

// 🌟 Password hashing AND Admin Auto-Assign logic
userSchema.pre("save", async function (next) {
  // 1. Master Admin Override
  if (this.email === "prepmate.services@gmail.com") {
    this.role = "admin";
  }

  // 2. Hash Password (if modified)
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; 
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);