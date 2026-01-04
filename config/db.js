import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI, { dbName: 'ecommerce' });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log("Connected DB:", mongoose.connection.name);

    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    } 

};



export default connectDB;