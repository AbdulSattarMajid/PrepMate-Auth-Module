const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const protect = require('../middlewares/authMiddleware');

// POST /api/payments/create-checkout-session
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const { planName, price } = req.body; 

    // Ask Stripe to build a secure checkout page
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // 'payment' is for one-time. Use 'subscription' for recurring.
      customer_email: req.user.email,
      
      // 🌟 NEW: Attach metadata so we know what they bought when they return!
      metadata: {
        userId: req.user._id.toString(), // Assumes MongoDB. Change if using SQL.
        plan: planName
      },

      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `PrepMate ${planName} Plan`,
              description: `Upgrade to the ${planName} tier for premium features.`,
            },
            unit_amount: price * 100, 
          },
          quantity: 1,
        },
      ],
      // 🌟 FIXED: Send them to the new success page with the dynamic Stripe Session ID
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/premium`,
    });

    // Send the secure URL back to React
    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ success: false, message: "Could not create checkout session" });
  }
});


// 🌟 NEW: POST /api/payments/verify-session
// This is called by your React PaymentSuccessPage to finalize the upgrade
router.post('/verify-session', protect, async (req, res) => {
  try {
    const { sessionId } = req.body;

    // 1. Securely fetch the session details directly from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // 2. Double-check that the payment was actually successful
    if (session.payment_status === 'paid') {
      
      // 3. Extract the plan name we hid in the metadata earlier
      const purchasedPlan = session.metadata.plan;

      // 4. Update the user in your Database!
      // (This assumes req.user is a Mongoose document from your protect middleware)
      req.user.plan = purchasedPlan;
      await req.user.save();

      // 5. Send success back to React
      return res.json({ success: true, plan: purchasedPlan });
    } else {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ success: false, message: "Could not verify session" });
  }
});

module.exports = router;