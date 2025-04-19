import { getReceiverSocketId,io } from "../lib/socket.js";
import Message from "../models/message.models.js";
import User from "../models/user.models.js"; 
import cloudinary from "../lib/cloudinary.js";



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

    // Log the image size for debugging
    if (image) {
      const base64Length = Buffer.byteLength(image, 'base64');
      console.log(`Base64 image size: ${base64Length} bytes`);
      if (base64Length > 10 * 1024 * 1024) { // 10MB limit
        return res.status(400).json({ error: 'Image too large (max 10MB)' });
      }
    }

    let imageUrl;
    if (image) {
      // Upload base64 image to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: 'chat_messages',
        resource_type: 'image',
        access_control: [{ access_type: "anonymous" }],
      });
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
      io.to(receiverSocketId).emit('newMessage', newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log('Error in sendMessage controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
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


