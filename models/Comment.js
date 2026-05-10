const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, "Please add comment text"]
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: "Post",
    required: true
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Comment", commentSchema);