import mongoose from 'mongoose';
export const connectdb= async() =>{
    try{
        const connect=await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Mongo Database Connected :${connect.connection.host}`)

    }catch(error){
        console.log("Error conncecting the database",error)

    }
}