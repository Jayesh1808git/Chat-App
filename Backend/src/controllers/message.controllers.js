import { getReceiverSocketId,io } from "../lib/socket.js";
import Message from "../models/message.models.js";
import User from "../models/user.models.js"; 
import cloudinary from "../lib/cloudinary.js";
import { HfInference } from "@huggingface/inference";
import fs from "fs";
import axios from "axios";
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);


export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedin_user_id = req.user._id;
    const filtered_users = await User.find({ _id: { $ne: loggedin_user_id } }).select("-password");
    res.status(200).json(filtered_users);
  } catch (error) {
    console.log("Error in getUsersForSidebar controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userTochatId } = req.params;
    const myId = req.user._id;
    const message = await Message.find({
      $or: [
        { senderId: myId, receiverId: userTochatId },
        { senderId: userTochatId, receiverId: myId }
      ]
    });
    res.status(200).json(message);
  } catch (error) {
    console.log("Error in getMessages controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendMessages = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const sendDocument = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Received files:', req.files);
    const { senderId, receiverId } = req.body;
    const file = req.files?.file;

    if (!file || !senderId || !receiverId) {
      console.log('Missing fields:', { file: !!file, senderId, receiverId });
      return res.status(400).json({ message: 'File, senderId, and receiverId are required' });
    }

    if (!file.mimetype.startsWith('application/') && !file.mimetype.startsWith('text/')) {
      return res.status(400).json({ message: 'Invalid file type. Only documents allowed.' });
    }

    const originalFilename = file.name.replace(/\s+/g, '_').replace(/[\[\]]/g, '');
    const uniquePublicId = `${Date.now()}_${originalFilename}`; // Timestamp for Cloudinary

    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'chat_documents',
      resource_type: 'raw',
      public_id: uniquePublicId,
      overwrite: true,
      access_control: [{ access_type: "anonymous" }],
      // Suggest original filename to Cloudinary (may not always work)
      original_filename: originalFilename,
    });
    console.log('Cloudinary upload result with details:', {
      secure_url: result.secure_url,
      public_id: result.public_id,
      original_filename: originalFilename,
      resource_type: result.resource_type,
      upload_response: result,
    });

    if (!result.secure_url) {
      throw new Error('Cloudinary upload failed: No secure URL returned');
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      document: result.secure_url,
      filename: originalFilename, // Must be the original name
      createdAt: new Date(),
    });
    await newMessage.save();

    const io = req.app.get('io');
    if (io) {
      io.to(senderId).to(receiverId).emit('newMessage', newMessage);
    }

    res.status(200).json(newMessage);
  } catch (error) {
    console.log('Error in sendDocument controller:', error.message, error.stack);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
export const delete_message= async (req,res)=>{
  try {
    const{id:messageId}=req.params;
    const userId=req.user._id;
    const message=await Message.findById(messageId);
    if(!message){
      return res.status(404).json({message:"Message not found"});
    } 
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this message" });
    }
    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted successfully" });

  } catch (error) {
    console.log("Error in delete_message controller:", error.message);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
    
  }
};
export const scheduleMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { text, image, sendAt } = req.body;
    const senderId = req.user._id;

    console.log("Received schedule request:", { receiverId, text, image, sendAt, senderId });

    if ((!text && !image) || !sendAt) {
      console.log("Validation failed: Missing content or sendAt");
      return res.status(400).json({ message: "Message content (text or image) and send time are required" });
    }

    const scheduledTime = new Date(sendAt);
    if (isNaN(scheduledTime.getTime())) {
      console.log("Invalid sendAt:", sendAt);
      return res.status(400).json({ message: "Invalid send time format" });
    }

    const now = new Date();
    if (scheduledTime < now) {
      console.log("Scheduled time in past:", scheduledTime, "vs Now:", now);
      return res.status(400).json({ message: "Scheduled time cannot be in the past" });
    }
    const Sent=false;
    const current_time=Date.now();
    const time_difference=scheduledTime-current_time;
    if(time_difference==0){
      Sent=true;
    }

    const scheduledMessage = new Message({
      senderId,
      receiverId,
      text: text || "",
      image: image || "",
      scheduledAt: scheduledTime,
      isScheduled: true,
      isSent:Sent,
    });

    console.log("Saving scheduled message:", scheduledMessage);
    await scheduledMessage.save();
    console.log("Message saved successfully:", scheduledMessage._id);

   
    if (io) {
      io.to(receiverId).emit("scheduledMessage", scheduledMessage.toObject());
      io.to(senderId).emit("scheduledMessage", scheduledMessage.toObject());
      console.log("Emitted scheduledMessage to:", receiverId, senderId);
    } else {
      console.warn("Socket.io not available");
    }

    res.status(200).json({ message: "Message scheduled successfully", scheduledMessage: scheduledMessage.toObject() });
  } catch (error) {
    console.error("Error in scheduleMessage controller:", error.stack);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const analyze_sentiment = async (req, res) => {
  try {
    const { text } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: "Text is required and must be a string" });
    }

    // Perform sentiment analysis using Hugging Face
    const result = await hf.textClassification({
      model: 'cardiffnlp/twitter-roberta-base-sentiment',
      inputs: text,
    });

    // Map the result to a consistent format
    const topLabel = result[0].label;
    const topScore = result[0].score;

    // Convert the label to positive, negative, or neutral
    let sentimentLabel;
    let sentimentScore;
    if (topLabel === 'LABEL_2') {
      sentimentLabel = 'positive';
      sentimentScore = topScore;
    } else if (topLabel === 'LABEL_0') {
      sentimentLabel = 'negative';
      sentimentScore = -topScore;
    } else {
      sentimentLabel = 'neutral';
      sentimentScore = 0;
    }

    // Return the sentiment analysis result
    res.status(200).json({
      text,
      label: sentimentLabel,
      score: sentimentScore,
    });
  } catch (error) {
    console.log("Error in analyzeSentiment controller:", error.message);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
export const getSmartReplies = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: "Text is required and must be a string" });
    }

    // Enhanced prompt with stricter instruction for Mixtral
    const prompt = `[INST]Generate exactly one short, casual reply (max 5 words, no newlines or special characters) to: "${text}". Output only the reply.[/INST]`;
    const suggestions = new Set();

    const result = await hf.textGeneration({
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      inputs: prompt,
      parameters: {
        max_new_tokens: 12, // Increased to ensure full reply within 5 words
        temperature: 0.5,   // Lowered for more focused and consistent replies
        top_k: 30,          // Reduced to focus on top candidates
        top_p: 0.85,        // Tightened for better coherence
        repetition_penalty: 1.5, // Increased to avoid repetition and artifacts
        num_return_sequences: 1, // Single reply
      },
    });

    if (result && result.generated_text) {
      const fullResponse = result.generated_text.trim();
      console.log("Full Response:", fullResponse); // Debug log to inspect raw output

      // Extract reply after [/INST] and clean it
      const replyStartIndex = fullResponse.indexOf('[/INST]') + 7;
      let reply = fullResponse.substring(replyStartIndex).trim();

      // Advanced cleaning: remove newlines, special characters, and enforce word limit
      reply = reply
        .replace(/[\n\r]/g, ' ') // Replace newlines with space
        .replace(/[^a-zA-Z0-9\s.,!?]/g, '') // Remove special characters except basic punctuation
        .split(' ')
        .filter(word => word.length > 0) // Remove empty words
        .slice(0, 5) // Limit to 5 words
        .join(' ');

      // Fallback if reply is invalid or too short
      if (!reply || reply.length <= 2 || reply.includes('Generate') || reply.includes('INST')) {
        reply = "Sorry, try again later."; // Updated fallback
      }

      if (reply && reply.length > 2) {
        suggestions.add(reply);
      }
    } else {
      // Handle case where result or generated_text is undefined
      console.warn("No valid result from text generation");
      suggestions.add("Sorry, try again later.");
    }

    res.status(200).json({ suggestions: Array.from(suggestions) });

  } catch (error) {
    console.error("Error in getSmartReplies controller:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};