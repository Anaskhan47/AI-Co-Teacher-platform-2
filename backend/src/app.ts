import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import cors from 'cors';
import './lib/firebase.js'; // Ensure Firebase Admin SDK is initialized
import authRoutes from './routes/auth.routes.js';
import lessonRoutes from './routes/lesson.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import curriculumRoutes from './routes/curriculum.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import materialRoutes from './routes/material.routes.js';
import messageRoutes from './routes/message.routes.js';
import examRoutes from './routes/exam.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import studentDashboardRoutes from './routes/student_dashboard.routes.js';
import parentDashboardRoutes from './routes/parent_dashboard.routes.js';
import studentRoutes from './routes/student.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import lessonV2Routes from './routes/lesson.v2.routes.js';

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';

// ---- Allowed origins ----
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:8080,http://localhost:5173,http://localhost:3000,http://localhost:8081').split(',');

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. curl, mobile apps)
        if (!origin) return callback(null, true);
        
        // Match localhost with any port in development for ease of use
        if (origin.startsWith('http://localhost:')) return callback(null, true);

        // Allow all Vercel deployment domains (production & previews)
        if (origin.endsWith('.vercel.app') || origin.includes('vercel.app')) return callback(null, true);

        // Strict matching for production domains
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        
        // Production fallback: If in production, be stricter. In dev, allow fallback.
        if (NODE_ENV === 'production') {
            console.error(`[SECURITY] Blocked CORS request from unauthorized origin: ${origin}`);
            return callback(new Error('Not allowed by CORS'));
        }
        
        callback(null, true);
    },
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

const REDACT_KEYS = new Set([
    'password',
    'token',
    'authorization',
    'pdfText',
    'file',
    'content',
    'body',
]);

function redact(value: unknown, key?: string): unknown {
    if (key && REDACT_KEYS.has(key)) return '[REDACTED]';
    if (Array.isArray(value)) return value.map((v) => redact(v));
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            out[k] = redact(v, k);
        }
        return out;
    }
    if (typeof value === 'string' && value.length > 500) return `${value.substring(0, 500)}...[TRUNCATED]`;
    return value;
}

// LOGGING MIDDLEWARE
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        if (NODE_ENV !== 'production') {
            const duration = Date.now() - start;
            console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
        }
    });
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/student-dashboard', studentDashboardRoutes);
app.use('/api/parent-dashboard', parentDashboardRoutes);
app.use('/api/ai', analysisRoutes);
app.use('/api/v2/lessons', lessonV2Routes);

import healthRoutes from './routes/health.routes.js';
import dbTestRoutes from './routes/db-test.routes.js';
import lessonsTestRoutes from './routes/lessons-test.routes.js';

app.use('/api/health', healthRoutes);
app.use('/api/db-test', dbTestRoutes);
app.use('/api/v2/lessons-test', lessonsTestRoutes);
// GLOBAL ERROR HANDLER
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);

  return res.status(500).json({
    success: false,
    data: null,
    error: {
      code: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message
    }
  });
});

export default app;
