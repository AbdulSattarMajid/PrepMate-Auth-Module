const express = require("express");
const router = express.Router();

const { 
  createPost, 
  getPosts, 
  toggleUpvote, 
  getLeaderboard,
  addComment,    
  getComments,
  updatePost,    
  deletePost,   
  deleteComment    
} = require("../controllers/forumController");

const  protect  = require("../middlewares/authMiddleware"); 

// Public: Get all posts | Private: Create a post
router.route("/")
  .get(getPosts)
  .post(protect, createPost);

  router.route("/:id")
  .put(protect, updatePost)    // Edit a post
  .delete(protect, deletePost); // Delete a post
// Public: Get top contributors
router.get("/leaderboard", getLeaderboard);

// Private: Toggle upvote
router.put("/:id/upvote", protect, toggleUpvote);

// --- NEW COMMENT ROUTES ---
// Public: Get comments | Private: Add a comment
router.route("/:id/comments")
  .get(getComments)
  .post(protect, addComment);

router.delete("/comments/:commentId", protect, deleteComment);
module.exports = router;