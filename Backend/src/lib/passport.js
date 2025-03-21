// lib/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.models.js';
import dotenv from 'dotenv';

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check for existing user by googleId
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          console.log('Found existing Google user:', user);
          if (user.authMethod !== 'google') {
            user.authMethod = 'google';
            await user.save();
          }
          return done(null, user);
        }

        // Check for existing user by email
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          console.log('Linking Google to existing user:', user);
          user.googleId = profile.id;
          user.authMethod = 'google'; // Explicitly set to 'google'
          await user.save();
          return done(null, user);
        }

        // Create new Google user
        const newUser = new User({
          googleId: profile.id,
          fullname: profile.displayName,
          email: profile.emails[0].value,
          profilepic: profile.photos[0]?.value || '',
          authMethod: 'google',
        });
        await newUser.save();
        console.log('Created new Google user:', newUser);
        done(null, newUser);
      } catch (error) {
        console.log('Error in Google Strategy:', error.message);
        done(error, null);
      }
    }
  )
);

export default passport;