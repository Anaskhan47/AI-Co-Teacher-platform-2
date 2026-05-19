import { Router } from "express";

const router = Router();

router.get("/", async (_, res) => {
  // Stub endpoint exactly as requested by user to verify routing vs service errors
  res.json({
    success: true,
    data: [],
    _diagnostic: "stub"
  });
});

export default router;
