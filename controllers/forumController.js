const Post = require("../models/Post");
const User = require("../models/User"); 
const Comment = require("../models/Comment");

// @desc    Create a new discussion
// @route   POST /api/forum/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    req.body.author = req.user._id;
    const post = await Post.create(req.body);
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all posts (Paginated, Sorting, Search, and Category Filter)
// @route   GET /api/forum/posts
// @access  Public
exports.getPosts = async (req, res) => {
  try {
    let query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { tags: { $regex: req.query.search, $options: "i" } }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let postsQuery = Post.find(query)
      .populate("author", "name profilePicture role")
      .skip(skip)
      .limit(limit);

    if (req.query.sort === "top") {
      postsQuery = postsQuery.sort({ upvotes: -1 });
    } else {
      postsQuery = postsQuery.sort({ createdAt: -1 });
    }

    const posts = await postsQuery;
    const total = await Post.countDocuments(query);

    // Securely mask user records if marked Anonymous
    const maskedPosts = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.isAnonymous) {
        postObj.author = { name: "Anonymous", profilePicture: "", role: "user" };
      }
      return postObj;
    });

    res.status(200).json({ 
      success: true, 
      count: maskedPosts.length, 
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: maskedPosts 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single post by ID (Increments view counts)
// @route   GET /api/forum/posts/:id
// @access  Public
exports.getSinglePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id, 
      { $inc: { views: 1 } }, 
      { new: true }
    ).populate("author", "name profilePicture role");

    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const postObj = post.toObject();
    if (postObj.isAnonymous) {
      postObj.author = { name: "Anonymous", profilePicture: "", role: "user" };
    }

    res.status(200).json({ success: true, data: postObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a post
// @route   PUT /api/forum/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: "Not authorized to edit this post" });
    }

    post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a post
// @route   DELETE /api/forum/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: "Not authorized to delete this post" });
    }

    // Clear accompanying comments
    await Comment.deleteMany({ post: req.params.id });
    await post.deleteOne();
    
    res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Upvote on a post
// @route   PUT /api/forum/posts/:id/upvote
// @access  Private
exports.toggleUpvote = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isUpvoted = post.upvotes.includes(req.user._id);
    const author = await User.findById(post.author);

    if (isUpvoted) {
      post.upvotes = post.upvotes.filter(id => id.toString() !== req.user._id.toString());
      if (author) author.points = Math.max(0, author.points - 5);
    } else {
      post.upvotes.push(req.user._id);
      if (author) author.points += 5;
    }

    await post.save();
    if (author) await author.save();

    res.status(200).json({ success: true, upvotes: post.upvotes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Save/Bookmark a post
// @route   PUT /api/forum/posts/:id/save
// @access  Private
exports.toggleSavePost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.savedPosts) user.savedPosts = [];

    const isSaved = user.savedPosts.includes(req.params.id);

    if (isSaved) {
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== req.params.id.toString());
    } else {
      user.savedPosts.push(req.params.id);
    }

    await user.save();
    res.status(200).json({ success: true, savedPosts: user.savedPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Top Contributors for Leaderboard
// @route   GET /api/forum/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find()
      .sort({ points: -1 })
      .limit(5)
      .select("name profilePicture points role");

    res.status(200).json({ success: true, data: topUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a comment to a post
// @route   POST /api/forum/posts/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const comment = await Comment.create({
      text: req.body.text,
      post: req.params.id,
      author: req.user._id
    });

    post.commentCount += 1;
    await post.save();

    await comment.populate("author", "name profilePicture role");
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get comments for a specific post
// @route   GET /api/forum/posts/:id/comments
// @access  Public
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate("author", "name profilePicture role")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/forum/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: "Not authorized to delete this comment" });
    }

    const postId = comment.post;
    await comment.deleteOne();
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } });

    res.status(200).json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};