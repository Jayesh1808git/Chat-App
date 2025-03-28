import Message from "../models/message.models.js";
import User from "../models/message.models.js";
import {HfInference} from "@huggingface/inference";
const hf=new HfInference(process.env.HUGGINGFACE_API_KEY);
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