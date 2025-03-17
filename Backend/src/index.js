import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import {connectdb} from './lib/db.js';
import  authRoutes from './routes/auth.routes.js';
import  messageRoutes from './routes/message.routes.js';
import cors from 'cors';

dotenv.config()
const app=express();
const port=process.env.PORT
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
}))
app.use("/api/auth",authRoutes);
app.use("/api/message",messageRoutes);
app.listen(port,()=>{
    console.log("Listening on port:"+port);
    connectdb();
});