/**
 * Backend origin for browser requests. On Netlify the API runs as a function under
 * /api on the same site. Set NEXT_PUBLIC_API_URL only to use a separately hosted backend.
 */
const configuredUrl = process.env.NEXT_PUBLIC_API_URL;

export const API_URL = (
  configuredUrl &&
  // A leftover localhost URL would break the deployed site, so only honor it in development.
  (process.env.NODE_ENV === "development" || !/localhost|127\.0\.0\.1/.test(configuredUrl))
    ? configuredUrl
    : "/api"
).replace(/\/$/, "");
