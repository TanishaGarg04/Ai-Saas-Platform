import serverless from "serverless-http";
import app from "./app.js";

// Netlify serves the API under /api, while the Express routes have no prefix.
export const handler = serverless(app, { basePath: "/api" });
