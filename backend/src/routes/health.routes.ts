import { Router } from "express";

const router = Router();

router.get("/", async (_, res) => {
  res.json({
    ok: true,
    env: !!process.env.DATABASE_URL
  });
});

export default router;
