import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, { dbName: 'ecommerce' });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log("Connected DB:", mongoose.connection.name);

    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
    } 

};



export default connectDB;