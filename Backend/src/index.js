import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectdb } from './lib/db.js';
import authRoutes from './routes/auth.routes.js';
import messageRoutes from './routes/message.routes.js';
import cors from 'cors';
import passport from './lib/passport.js';
import session from 'express-session';
import { io, app, server } from './lib/socket.js';
import fileUpload from 'express-fileupload';

dotenv.config();

const port = process.env.PORT;

app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true })); 
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' },
}));


app.use(passport.initialize());
app.use(passport.session());

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 10 * 1024 * 1024 },
  abortOnLimit: true,
}));

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

server.listen(port, () => {
  console.log(`Listening on port: ${port}`);
  connectdb();
});