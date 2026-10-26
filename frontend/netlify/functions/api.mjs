import { handler } from "../../../backend/lambda.js";

// Adapts a web Request to the Express app wrapped by serverless-http.
export default async (req) => {
  const url = new URL(req.url);
  const body = Buffer.from(await req.arrayBuffer());

  const result = await handler(
    {
      httpMethod: req.method,
      path: url.pathname,
      headers: Object.fromEntries(req.headers),
      queryStringParameters: Object.fromEntries(url.searchParams),
      body: body.length ? body.toString("base64") : null,
      isBase64Encoded: true,
    },
    {}
  );

  const headers = new Headers();
  for (const [key, value] of Object.entries(result.headers || {})) {
    headers.set(key, String(value));
  }
  for (const [key, values] of Object.entries(result.multiValueHeaders || {})) {
    headers.delete(key);
    for (const value of values) headers.append(key, String(value));
  }

  const responseBody = result.isBase64Encoded
    ? Buffer.from(result.body || "", "base64")
    : result.body;

  return new Response(result.statusCode === 204 ? null : responseBody, {
    status: result.statusCode,
    headers,
  });
};

export const config = {
  path: "/api/*",
};
