import { getReceiverSocketId,io } from "../lib/socket.js";
import Message from "../models/message.models.js";
import User from "../models/user.models.js"; 
import cloudinary from "../lib/cloudinary.js";
import mongoose from 'mongoose';



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
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error in sendMessage controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const sendDocument = async (req, res) => {
  try {
    console.log('sendDocument received:', {
      body: req.body,
      files: req.files,
      file: req.files?.file,
    });
    const { senderId, receiverId, text } = req.body;
    const file = req.files?.file;

    if (!file || !senderId || !receiverId) {
      console.error('Missing required fields:', { file: !!file, senderId, receiverId });
      return res.status(400).json({ message: 'File, senderId, and receiverId are required' });
    }

  
    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      console.error('Invalid ObjectId:', { senderId, receiverId });
      return res.status(400).json({ message: 'Invalid senderId or receiverId' });
    }

    const originalFilename = file.name.replace(/\s+/g, '_').replace(/[\[\]]/g, '');
    const uniquePublicId = `${Date.now()}_${originalFilename}`;
    let resourceType = 'raw';
    let fieldName = 'document';

    if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
      fieldName = 'image';
    } else if (!file.mimetype.startsWith('application/') && !file.mimetype.startsWith('text/')) {
      return res.status(400).json({ message: 'Invalid file type. Only images or documents allowed.' });
    }

    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: fieldName === 'image' ? 'chat_images' : 'chat_documents',
      resource_type: resourceType,
      public_id: uniquePublicId,
      overwrite: true,
      access_control: [{ access_type: 'anonymous' }],
      original_filename: originalFilename,
    });

    if (!result.secure_url) {
      throw new Error('Cloudinary upload failed: No secure URL returned');
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || '',
      [fieldName]: result.secure_url,
      filename: fieldName === 'document' ? originalFilename : undefined,
      createdAt: new Date(),
    });

    await newMessage.save();
    console.log('Message saved:', newMessage);
    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId=getReceiverSocketId(senderId);
    if(receiverSocketId ){
      io.to(receiverSocketId).emit('newMessage', newMessage);
      console.log('Emitted newMessage to:', { senderId, receiverId });
    }
   

    

    res.status(200).json(newMessage);
  } catch (error) {
    console.error('Error in sendDocument:', error.message, error.stack);
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


