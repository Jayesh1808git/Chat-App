import Message from "../models/message.models.js";
import User from "../models/message.models.js";
export const getUsersForSidebar= async (req,res) =>{
    try {
        const loggedin_user_id=req.user._id;
        const filtered_users=await User.find({_id:{$ne:loggedin_user_id}}).select("-password");
        res.status(200).json(filtered_users);
    } catch (error) {
        console.log("Error in getUsersForSidebar controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};
export const getMessages = async (req,res)=>{
    try {
        const {id:userTochatId}=req.params;
        const myId=req.user._id;
        const message= await Message.find({
            $or:[
                {senderId:myId,receiverId:userTochatId},
                {senderId:userTochatId,receiverId:myId}
            ]
        });
        res.status(200).json(message);

    } catch (error) {
        console.log("Error in getMessages controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
        
    }
};
export const sendMessages = async (req,res)=>{
    try {
        const {text,image}=req.body;
        const {id:receiverId}=req.params;
        const senderId=req.user._id;
        let imageUrl;
        if(image){
            const uploadResponse=await cloudinary.uploader.upload(image);
            imageUrl=uploadResponse.secure_url;
        }
        const newMessage= new Message({
            senderId,
            receiverId,
            text,
            image:imageUrl
        });
        await newMessage.save();
        //todo:Realtime functionality
        res.status(200).json({message:"Message Sent"});
    } catch (error) {
        console.log("Error in sendMessages controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}