const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a title"],
    trim: true,
    maxlength: [100, "Title cannot be more than 100 characters"]
  },
  content: {
    type: String,
    required: [true, "Please add some content"]
  },
  category: {
    type: String,
    required: [true, "Please specify a category"],
    enum: ["Interview Experiences", "Resume Review", "Salary & Offer", "General Advice", "Question"]
  },
  tags: [{
    type: String
  }],
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  
  // --- 🌟 NEW: IMAGE UPLOADS ---
  imageUrl: {
    type: String, // Will store the secure Cloudinary URL
    default: ""
  },

  // --- 🌟 NEW: ADMIN MODERATION ---
  isFlagged: {
    type: Boolean, // Admin can hide inappropriate posts without hard-deleting them
    default: false
  },

  upvotes: [{
    type: mongoose.Schema.ObjectId,
    ref: "User"
  }],
  commentCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  pinned: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);