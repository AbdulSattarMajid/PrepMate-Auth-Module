const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Updated to fallback directly to your live Render URL
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://prepmate-auth-module.onrender.com/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check if user already exists by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // 2. Check if the email exists from a manual signup
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            user.googleId = profile.id;
            // No password change here, so pre-save hook will skip hashing
            await user.save();
          } else {
            // 3. Create brand new user
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              password: Math.random().toString(36).slice(-12), 
              isVerified: true // Important: Bypass OTP since Google already verified them
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);