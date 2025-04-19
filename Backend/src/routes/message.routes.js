    import express from 'express';
    import {protectRoute} from '../middleware/auth.middleware.js';
    import {getUsersForSidebar, getMessages, sendMessages,delete_message,sendDocument} from '../controllers/message.controllers.js';

    const router = express.Router();

  
    router.get("/users", protectRoute, getUsersForSidebar);
    router.get("/:id", protectRoute, getMessages);
    router.post("/send/:id", protectRoute, sendMessages);
    router.post('/send-document', protectRoute, sendDocument);
    router.delete("/delete/:id",protectRoute,delete_message);

    export default router;