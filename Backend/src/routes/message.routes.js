    import express from 'express';
    import {protectRoute} from '../middleware/auth.middleware.js';
    import {getUsersForSidebar, getMessages, sendMessages, analyze_sentiment,delete_message,scheduleMessage, getSmartReplies} from '../controllers/message.controllers.js';

    const router = express.Router();

  
    router.get("/users", protectRoute, getUsersForSidebar);
    router.get("/:id", protectRoute, getMessages);
    router.post("/send/:id", protectRoute, sendMessages);
    router.post("/analyze_sentiment", protectRoute, analyze_sentiment);
    router.delete("/delete/:id",protectRoute,delete_message);
    router.post("/schedule/:id",protectRoute,scheduleMessage);
    router.post("/smart_reply",protectRoute,getSmartReplies);

    export default router;