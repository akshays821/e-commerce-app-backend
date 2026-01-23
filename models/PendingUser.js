import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // Documents expire after 600 seconds (10 minutes)
});

const PendingUser = mongoose.model("PendingUser", pendingUserSchema);
export default PendingUser;
