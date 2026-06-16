const express = require('express');
const router = express.Router();
// 🌟 Initialize Stripe using your secret environment variable
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const protect = require('../middlewares/authMiddleware');

// POST /api/payments/create-checkout-session
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const { planName, price } = req.body; 

    // Ask Stripe to build a secure checkout page
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // 'payment' is for one-time. Use 'subscription' for recurring monthly charges.
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `PrepMate ${planName} Plan`,
              description: `Upgrade to the ${planName} tier for premium features.`,
            },
            // 🌟 CRITICAL: Stripe expects amounts in CENTS. So $15.00 is 1500.
            unit_amount: price * 100, 
          },
          quantity: 1,
        },
      ],
      // Where should Stripe send the user after they pay (or cancel)?
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing?payment=cancelled`,
    });

    // Send the secure URL back to React
    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ success: false, message: "Could not create checkout session" });
  }
});

module.exports = router;