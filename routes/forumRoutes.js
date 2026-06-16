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

// 🌟 Import the Cloudinary engine
const { upload } = require("../config/cloudinary"); 

// Core Feed Endpoints
router.route("/")
  .get(getPosts)
  .post(protect, upload.single("image"), createPost);

// Gamified Stats
router.get("/leaderboard", getLeaderboard);

// Dynamic Single Post Target Endpoints
router.route("/:id")
  .get(getSinglePost)
  // 🌟 THE FIX: Injected upload.single("image") so edits can process FormData
  .put(protect, upload.single("image"), updatePost)
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