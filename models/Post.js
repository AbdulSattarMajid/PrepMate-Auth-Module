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
    enum: ["Interview Experiences", "Resume Review", "Salary & Offer", "General Advice"]
  },
  tags: [{
    type: String
  }],
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  upvotes: [{
    type: mongoose.Schema.ObjectId,
    ref: "User"
  }],
  commentCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);