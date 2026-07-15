// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
// Assuming you have an adminMiddleware, if not, just use protect for now!
// const admin = require('../middlewares/adminMiddleware'); 

const { 
    submitReview, 
    getAllReviews, 
    toggleFeaturedStatus, 
    getFeaturedReviews 
} = require('../controllers/reviewController');

// Public Route (For the Landing Page)
router.get('/featured', getFeaturedReviews);

// Protected Student Route
router.post('/submit', protect, submitReview);

// Admin Routes (You should protect these with an admin middleware eventually!)
router.get('/all', protect, getAllReviews);
router.put('/:reviewId/feature', protect, toggleFeaturedStatus);

module.exports = router;