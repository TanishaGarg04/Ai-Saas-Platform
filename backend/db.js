import mongoose from "mongoose";

let connection;

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.log("DB ERROR: MONGO_URI is not set");
    return;
  }

  if (!connection) {
    connection = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
      .then(
        () => console.log("MongoDB connected ✅"),
        (error) => {
          console.log("DB ERROR:", error.message);
          // Allow the next request to retry instead of caching the failure.
          connection = undefined;
        }
      );
  }

  return connection;
};
