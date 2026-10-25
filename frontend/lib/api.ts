/** Backend origin for browser requests. Set NEXT_PUBLIC_API_URL in deployments. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
