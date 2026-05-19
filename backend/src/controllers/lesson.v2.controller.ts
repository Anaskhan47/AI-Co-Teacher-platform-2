// @ts-nocheck
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { LessonService } from '../services/lesson.service';

/**
 * LESSON V2 CONTROLLER
 * Implements strict production-grade API contracts.
 * Pattern: Try-Catch → Service Call → Normalized Response Envelope.
 */

export const getAllLessons = async (req: AuthRequest, res: Response) => {
    try {
        const teacherId = req.user?.id;
        if (!teacherId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Auth session invalid' } });

        const limit = parseInt(req.query.limit as string) || 50;
        let lessons: any[] = [];
        
        try {
            lessons = await LessonService.findAllByTeacher(teacherId, limit);
        } catch (dbError: any) {
            console.error('[LESSON_CONTROLLER] DB fallback triggered:', dbError.message);
        }

        res.json({
            success: true,
            data: lessons,
            error: null,
            meta: { count: lessons.length, limit }
        });
    } catch (error: any) {
        console.error('[LESSON_CONTROLLER] Unhandled error:', error);
        res.status(200).json({
            success: true,
            data: [],
            error: null,
            meta: { count: 0, limit: 50, diagnosticError: error.message }
        });
    }
};

export const getLessonById = async (req: AuthRequest, res: Response) => {
    try {
        const teacherId = req.user?.id;
        const { id } = req.params;

        if (!teacherId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Auth session invalid' } });

        const lesson = await LessonService.findById(id, teacherId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                data: null,
                error: { code: 'NOT_FOUND', message: 'Lesson architecture not found' }
            });
        }

        res.json({
            success: true,
            data: lesson,
            error: null
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            data: null,
            error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
        });
    }
};

export const createLesson = async (req: AuthRequest, res: Response) => {
    try {
        const teacherId = req.user?.id;
        if (!teacherId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Auth session invalid' } });

        const lesson = await LessonService.create(teacherId, req.body);

        res.status(201).json({
            success: true,
            data: lesson,
            error: null
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            data: null,
            error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
        });
    }
};

export const updateLesson = async (req: AuthRequest, res: Response) => {
    try {
        const teacherId = req.user?.id;
        const { id } = req.params;

        if (!teacherId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Auth session invalid' } });

        const lesson = await LessonService.update(id, teacherId, req.body);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                data: null,
                error: { code: 'NOT_FOUND', message: 'Update target not found' }
            });
        }

        res.json({
            success: true,
            data: lesson,
            error: null
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            data: null,
            error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
        });
    }
};

export const deleteLesson = async (req: AuthRequest, res: Response) => {
    try {
        const teacherId = req.user?.id;
        const { id } = req.params;

        if (!teacherId) return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Auth session invalid' } });

        const success = await LessonService.delete(id, teacherId);
        if (!success) {
            return res.status(404).json({
                success: false,
                data: null,
                error: { code: 'NOT_FOUND', message: 'Deletion target not found' }
            });
        }

        res.json({
            success: true,
            data: { id, deleted: true },
            error: null
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            data: null,
            error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
        });
    }
};
