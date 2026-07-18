const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const protect = require('../middlewares/authMiddleware');

router.post('/create-checkout-session', protect, async (req, res) => {
  try {
    const { planName, price } = req.body; 

    // 🌟 STRICT SECURITY LOCK: Prevent cross-buying or double-buying
    // You MUST be "Basic" to buy a new plan.
    if (req.user.plan !== "Basic") {
      return res.status(400).json({ 
        success: false, 
        message: `You are currently on the ${req.user.plan} plan. Please cancel your current plan before switching.` 
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // One-time purchase for token buckets
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
      // URL to redirect to after successful or canceled payment
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/premium`,
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ success: false, message: "Could not create checkout session" });
  }
});

router.post('/verify-session', protect, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const purchasedPlan = session.metadata.plan;

      // Update the user's plan in the database
      req.user.plan = purchasedPlan;

      // Grant Tokens (maxTokens is handled automatically by User.js pre-save hook)
      if (purchasedPlan === "Pro") {
        req.user.tokens += 500;
      } else if (purchasedPlan === "Elite") {
        req.user.tokens += 1200;
      } else if (purchasedPlan === "Recruiter") { 
        req.user.tokens += 1000;
        req.user.role = "recruiter"; 
      }

      // Save changes. This triggers your schema hook to update maxTokens.
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


router.post('/cancel-plan', protect, async (req, res) => {
  try {
    // Prevent canceling if they are already on the lowest tier
    if (req.user.plan === "Basic") {
      return res.status(400).json({ 
        success: false, 
        message: "You are already on the Basic plan." 
      });
    }

    // Downgrade plan to Basic
    req.user.plan = "Basic";

    // If they were a recruiter, revert their role back to candidate
    if (req.user.role === "recruiter") {
      req.user.role = "candidate"; 
    }

    // Save changes. The schema hook will see the plan is "Basic" and instantly drop maxTokens to 200.
    await req.user.save();

    return res.json({ 
      success: true, 
      message: "Plan successfully canceled. You have been downgraded to Basic.",
      plan: req.user.plan,
      maxTokens: req.user.maxTokens
    });

  } catch (error) {
    console.error("Cancel Error:", error);
    res.status(500).json({ success: false, message: "Could not cancel plan" });
  }
});

module.exports = router;