import User from "../models/user.models.js"
import {generate_token} from "../lib/utils.js"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "cloudinary";
export const signup= async (req,res) =>{
    const {fullname,email,password}=req.body;
    try {
        if(!fullname || !email || !password){
            return res.status(400).json({message:"All fields are required"});
        }  
        
        if(password.length<6){
            return res.status(400).json({message:"Password must be atleast 6 characters long"});
        }
        const user = await User.findOne({email});
        if(user){
            return res.status(400).json({message:"User already exists"});
        }
        const salt= await bcrypt.genSalt(10);
        const hashedpassword= await bcrypt.hash(password,salt);
        const new_user=new User({
            email,
            fullname,
            password:hashedpassword
        });
        if(new_user){
            //Generate JWT tokens
            generate_token(new_user._id,res);
            await new_user.save();
            res.status(201).json({
                _id:new_user.id,
                fullname:new_user.fullname,
                email:new_user.email,
                profilepic:new_user.profilepic, 
            })


        }else{
            res.status(400).json({message:"Invalid credentials"});
        }
        
    } catch (error) {
        console.log("Error in signup controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};
export const login= async  (req,res) =>{
    const {email,password}=req.body;
    try {
        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"Invalid Credentials"});
        }
        const is_password_correct = await bcrypt.compare(password,user.password);
        if(!is_password_correct){
            return res.status(400).json({message:"Invalid Credentials"});
        }
        generate_token(user._id,res);
        res.status(200).json({
            _id:user.id,
            fullname:user.fullname,
            email:user.email,
            profilepic:user.profilepic
        });
    } catch (error) {
        console.log("Error in Login controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};
export const logout= (req,res) =>{
    try {
        res.clearCookie("token");
        res.status(200).json({message:"Logged out successfully"});
        
    } catch (error) {
        console.log("Error in logout controller",error.message);
        res.status(500).json({message:"Internal Server Error"});   
    }
};


export const update_profile = async (req,res)=>{
    try {
        const {profilepic}=req.body;
        const userId=req.user._id;
        if(!profilepic){
            return res.status(400).json({message:"Profile pic is required"});
        }
        const upload_response=await cloudinary.UploadStream.upload(profilepic)
        const update_user=await User.findByIdAndUpdate(userId,{profilepic:upload_response.secure_url},{new:true});
        res.status(200).json(update_user);
    } catch (error) {
        
    }
}
export const checkAuth= async (req,res)=>{
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}