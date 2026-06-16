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

// 🌟 NEW: Import the same Cloudinary engine we used for profiles
const { upload } = require("../config/cloudinary"); 

// Core Feed Endpoints
router.route("/")
  .get(getPosts)
  // 🌟 UPDATE: Inject 'upload.single("image")' here. 
  // The frontend needs to use the key "image" when sending FormData.
  .post(protect, upload.single("image"), createPost);

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