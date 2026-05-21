import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    userEmail: String,
    title: String,
    messages: [
      {
        role: String,
        content: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);