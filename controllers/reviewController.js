// controllers/reviewController.js
const Review = require('../models/Review');

// 1. STUDENT ROUTE: Submit or Update a review (UPSERT FIX APPLIED)
const submitReview = async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        const reviewerId = req.user._id;

        if (!rating) {
            return res.status(400).json({ message: "Please select a star rating." });
        }

        // Upsert: Looks for this user's review. If it exists, it updates it. If not, it creates it.
        await Review.findOneAndUpdate(
            { userId: reviewerId }, 
            { rating, feedback },   
            { new: true, upsert: true } 
        );
        
        res.status(200).json({ 
            success: true, 
            message: "Thank you for your feedback!" 
        });

    } catch (error) {
        console.error("Review Submission Error:", error);
        res.status(500).json({ message: "Failed to submit review." });
    }
};

// 2. ADMIN ROUTE: Fetch all reviews for the Admin Dashboard
const getAllReviews = async (req, res) => {
    try {
        // .populate() pulls the student's name and avatar so you can see who wrote it
        const reviews = await Review.find()
            .populate('userId', 'name avatarUrl')
            .sort({ createdAt: -1 }); // Newest reviews first
            
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error("Fetch Reviews Error:", error);
        res.status(500).json({ message: "Failed to fetch reviews." });
    }
};

// 3. ADMIN ROUTE: Select the 3 best reviews for the landing page
const toggleFeaturedStatus = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // If you are trying to feature a new review, ensure you haven't hit the 3 limit
        if (!review.isFeatured) {
            const featuredCount = await Review.countDocuments({ isFeatured: true });
            if (featuredCount >= 3) {
                return res.status(400).json({ 
                    message: "You can only feature 3 reviews at a time. Please unfeature one first." 
                });
            }
        }

        // Toggle the status and save
        review.isFeatured = !review.isFeatured;
        await review.save();

        res.status(200).json({ success: true, data: review });
    } catch (error) {
        console.error("Toggle Featured Error:", error);
        res.status(500).json({ message: "Failed to update review status." });
    }
};

// 4. PUBLIC ROUTE: Fetch the 3 selected reviews for the logged-out Landing Page
const getFeaturedReviews = async (req, res) => {
    try {
        // Only grabs the ones you marked as true!
        const featuredReviews = await Review.find({ isFeatured: true })
            .populate('userId', 'name avatarUrl')
            .limit(3);

        res.status(200).json({ success: true, data: featuredReviews });
    } catch (error) {
        console.error("Fetch Featured Reviews Error:", error);
        res.status(500).json({ message: "Failed to fetch testimonials." });
    }
};

module.exports = {
    submitReview,
    getAllReviews,
    toggleFeaturedStatus,
    getFeaturedReviews
};