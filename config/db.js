import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState >= 1) {
            return;
        }
        const conn = await mongoose.connect(process.env.MONGO_URI, { dbName: 'ecommerce' });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        throw error; // Propagate error to the caller
    }
};



export default connectDB;