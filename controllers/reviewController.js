// controllers/reviewController.js
const Review = require('../models/Review');

const submitReview = async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        
        // Securely pull the ID from your protect middleware
        const reviewerId = req.user._id;

        if (!rating) {
            return res.status(400).json({ message: "Please select a star rating." });
        }

        const newReview = new Review({
            userId: reviewerId,
            rating,
            feedback
        });

        await newReview.save();
        
        res.status(201).json({ 
            success: true, 
            message: "Thank you for your feedback!" 
        });

    } catch (error) {
        console.error("Review Submission Error:", error);
        res.status(500).json({ message: "Failed to submit review." });
    }
};

module.exports = {
    submitReview
};