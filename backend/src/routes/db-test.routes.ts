import { Router } from "express";
import prisma from '../lib/prisma';

const router = Router();

router.get("/", async (_, res) => {
  try {
    // Attempt a lightweight query to verify connectivity
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      ok: true,
      message: "Database connection successful"
    });
  } catch (error: any) {
    console.error('[DB_TEST] Connection failed:', error);
    res.status(500).json({
      ok: false,
      message: "Cannot connect to PostgreSQL",
      error: error.message
    });
  }
});

export default router;
