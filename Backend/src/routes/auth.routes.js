import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
const router = express.Router();
import { login, logout, signup, update_profile, checkAuth, googleCallback } from '../controllers/auth.controllers.js'; 
import passport from '../lib/passport.js';

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.put("/update-profile", protectRoute, update_profile);
router.get("/check", protectRoute, checkAuth);

// Google OAuth routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false }), googleCallback);

export default router;