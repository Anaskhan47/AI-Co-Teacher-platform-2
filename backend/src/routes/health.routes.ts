import { Router } from "express";

const router = Router();

router.get("/", async (_, res) => {
  const dbUrl = !!process.env.DATABASE_URL;
  const groqKey = !!process.env.GROQ_API_KEY;
  const jwtSecret = !!process.env.JWT_SECRET;

  res.json({
    ok: true,
    env: {
      DATABASE_URL: dbUrl,
      GROQ_API_KEY: groqKey,
      JWT_SECRET: jwtSecret
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
