import cron from "node-cron";
import Message from "../models/message.models.js";
import { io } from "./socket.js";

// Run the scheduler every minute

cron.schedule("* * * * *", async () => {
  const now = new Date();
  const messagesToSend = await Message.find({
    isScheduled: true,
    isSent: false,
    sendAt: { $lte: now }
  });

  for (const msg of messagesToSend) {
    const receiverSocketId = getReceiverSocketId(msg.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("scheduledMessage", msg);
    }

    msg.isScheduled = false;
    await msg.save();
  }
});
