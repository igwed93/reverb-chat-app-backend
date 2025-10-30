import mongoose from "mongoose";

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error("FATAL ERROR: MONGODB_URI is not defined.");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log("💾 MongoDB connected successfully.");
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        process.exit(1);
    }
};


export default connectDB;