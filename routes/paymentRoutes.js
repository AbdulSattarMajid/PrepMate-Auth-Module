const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const protect = require('../middlewares/authMiddleware');

// POST /api/payments/create-checkout-session
router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const { planName, price } = req.body; 

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', 
      customer_email: req.user.email,
      
      metadata: {
        userId: req.user._id.toString(), 
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
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/premium`,
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ success: false, message: "Could not create checkout session" });
  }
});

// POST /api/payments/verify-session
router.post('/verify-session', protect, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const purchasedPlan = session.metadata.plan;

      // 1. Upgrade Plan
      req.user.plan = purchasedPlan;

      // 2. 🌟 NEW: Grant Tokens & Upgrade Cap based on plan
      if (purchasedPlan === "Pro") {
        req.user.tokens += 500;
        req.user.maxTokens = 1000;
      } else if (purchasedPlan === "Elite") {
        req.user.tokens += 1200;
        req.user.maxTokens = 3000;
      } else if (purchasedPlan === "Recruiter") { 
        req.user.tokens += 1000;
        req.user.maxTokens = 10000;
        req.user.role = "recruiter"; // Ensure role upgrades too if it's the recruiter pack
      }

      await req.user.save();

      return res.json({ 
        success: true, 
        plan: purchasedPlan,
        tokens: req.user.tokens,
        maxTokens: req.user.maxTokens 
      });
    } else {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ success: false, message: "Could not verify session" });
  }
});

module.exports = router;