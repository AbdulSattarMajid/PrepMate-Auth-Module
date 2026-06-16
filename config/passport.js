const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://prepmate-auth-module.onrender.com/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleEmail = profile.emails[0].value;
        const googleId = profile.id;

        // 1. Check if an account with this email ALREADY exists
        let user = await User.findOne({ email: googleEmail });

        if (user) {
          // The user exists! Link the Google ID if they don't have one yet.
          if (!user.googleId) {
            user.googleId = googleId;
            user.isVerified = true; // Google emails are already verified
            await user.save();
          }
        } else {
          // 2. No account exists. Create a brand new one!
          user = await User.create({
            name: profile.displayName,
            email: googleEmail,
            googleId: googleId,
            isVerified: true, 
            role: "candidate" // Matches our new database model
          });
        }

        return done(null, user);
      } catch (error) {
        console.error("Google Auth Error:", error);
        return done(error, null);
      }
    }
  )
);