const express = require("express");
const router = express.Router();

const { 
  createPost, 
  getPosts, 
  toggleUpvote, 
  getLeaderboard,
  addComment,     // --- NEW ---
  getComments     // --- NEW ---
} = require("../controllers/forumController");

const  protect  = require("../middlewares/authMiddleware"); 

// Public: Get all posts | Private: Create a post
router.route("/")
  .get(getPosts)
  .post(protect, createPost);

// Public: Get top contributors
router.get("/leaderboard", getLeaderboard);

// Private: Toggle upvote
router.put("/:id/upvote", protect, toggleUpvote);

// --- NEW COMMENT ROUTES ---
// Public: Get comments | Private: Add a comment
router.route("/:id/comments")
  .get(getComments)
  .post(protect, addComment);

module.exports = router;