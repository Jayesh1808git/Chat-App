import express from 'express';
import {protectRoute} from '../middleware/auth.middleware.js';
import {getUsersForSidebar, getMessages, sendMessages, analyze_sentiment} from '../controllers/message.controllers.js';

const router = express.Router();

// Define the more specific route first
router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessages);
router.post("/analyze_sentiment", protectRoute, analyze_sentiment);

export default router;