import jwt from 'jsonwebtoken';

export const generate_token= (userID,res)=>{
    const token = jwt.sign({userID},process.env.JWT_SECRET,{expiresIn:"7d"});
    res.cookie("token",token,{
        maxAge:7*24*60*60*1000,
        httpOnly:true,
        sameSite:true,
        secure:process.env.NODE_ENV==="development"?false:true
    });
    return token; 
}
