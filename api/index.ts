import fs from "fs";
import path from "path";

// ── VERCEL SQLITE SURVIVAL LAYER ────────────────────────────────────────────────
// Vercel serverless functions run in a read-only filesystem except for /tmp.
// To prevent Prisma from crashing with a 500 error when trying to write the SQLite journal,
// we must copy the database to /tmp and override the connection string on cold boot.
if (process.env.VERCEL) {
    const tmpDbPath = "/tmp/dev.db";
    const localDbPath = path.resolve(process.cwd(), "dev.db");
    
    try {
        if (!fs.existsSync(tmpDbPath) && fs.existsSync(localDbPath)) {
            console.log("[VERCEL] Bootstrapping ephemeral SQLite DB to /tmp/dev.db");
            fs.copyFileSync(localDbPath, tmpDbPath);
        }
        // Force Prisma to use the writable /tmp database
        process.env.DATABASE_URL = `file:${tmpDbPath}`;
        console.log("[VERCEL] Overrode DATABASE_URL to use writable /tmp volume.");
    } catch (e) {
        console.error("[VERCEL] Failed to bootstrap SQLite:", e);
    }
}

// Ensure the survival layer executes BEFORE Express/Prisma are initialized
import app from "../backend/src/app";

// Vercel @vercel/node expects standard HTTP Request/Response listeners.
// Do NOT use serverless-http wrapper.
export default app;
