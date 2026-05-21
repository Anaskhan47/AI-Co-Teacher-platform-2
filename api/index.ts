// Vercel serverless entry point.
// Uses a dynamic import so that the ESM backend can be loaded
// even when the Vercel runtime initialises this file as CJS.
const appPromise = import("../backend/src/app.js");

export default async function handler(req: any, res: any) {
  const { default: app } = await appPromise;
  return app(req, res);
}
