const express = require("express");
const router = express.Router();

const { 
  createPost, 
  getPosts, 
  getSinglePost,
  updatePost,    
  deletePost,   
  toggleUpvote, 
  toggleSavePost,
  getLeaderboard,
  addComment,    
  getComments,
  deleteComment    
} = require("../controllers/forumController");

const protect = require("../middlewares/authMiddleware"); 

// Core Feed Endpoints
router.route("/")
  .get(getPosts)
  .post(protect, createPost);

// Gamified Stats
router.get("/leaderboard", getLeaderboard);

// Dynamic Single Post Target Endpoints
router.route("/:id")
  .get(getSinglePost)
  .put(protect, updatePost)
  .delete(protect, deletePost);

// Intermediary Interaction Handles
router.put("/:id/upvote", protect, toggleUpvote);
router.put("/:id/save", protect, toggleSavePost);

// Comment Extensions
router.route("/:id/comments")
  .get(getComments)
  .post(protect, addComment);

router.delete("/comments/:commentId", protect, deleteComment);

module.exports = router;