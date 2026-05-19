// @ts-nocheck
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import prisma from '../lib/prisma.js';
import { AIService } from '../services/ai.service.js';
import { BoardType } from '@prisma/client';
import fs from 'fs';
import pdfParse from "pdf-parse";
import { resolveCurriculumTopic } from '../lib/curriculum-resolver.js';

export const createLesson = async (req: AuthRequest, res: Response) => {
    if (!process.env.GROQ_API_KEY) {
       return res.json({
          success:true,
          data:{fallback:true, title: "Fallback Lesson", objective: "System Check", activities: "None", duration: 45}
       });
    }

    try {
        let { title, subjectId, topicId, grade, objective, duration, activities, homework, resources, aiAssist, curriculum: board, subject: subjectName, topic: topicName, pdfText, unitDetails, numSessions, detailLevel } = req.body;

        // Normalize board to valid Prisma BoardType enum values
        const VALID_BOARDS = ['CBSE', 'ICSE', 'IGCSE', 'IB', 'STATE', 'SSC'];
        const normalizedBoard = (board && VALID_BOARDS.includes(board.toUpperCase())) 
            ? board.toUpperCase() 
            : 'CBSE';

        let finalSubjectId = subjectId;
        let finalTopicId = topicId;

        // --- DYNAMIC ENTITY RESOLUTION (transactional, deduplicated) ---
        if (normalizedBoard && grade && subjectName && topicName) {
            const gradeNum = parseInt(grade);
            const { subject, topic } = await resolveCurriculumTopic(prisma, {
                board: normalizedBoard as BoardType,
                grade: gradeNum,
                subjectName,
                topicName,
            });
            finalSubjectId = subject.id;
            finalTopicId = topic.id;
        }

        // --- AI GENERATION WITH FALLBACKS ---
        let aiData: any = null;
        let aiMeta: any = null;
        if (aiAssist || (board && grade)) {
            let sName = subjectName;
            let tName = topicName;

            if (!sName && finalSubjectId) {
                const s = await prisma.subject.findUnique({ where: { id: finalSubjectId } });
                sName = s?.name;
            }
            if (!tName && finalTopicId) {
                const t = await prisma.topic.findUnique({ where: { id: finalTopicId } });
                tName = t?.name;
            }

            if (!tName || !sName) return res.status(400).json({ success: false, data: null, error: 'Invalid Subject or Topic context' });

            const result = await AIService.generateLessonPlan(tName, grade || "10", sName, pdfText, unitDetails, duration, numSessions, Number(detailLevel) || 50);
            aiData = result.data;
            aiMeta = result.meta;
        }

        const teacherId = req.user?.id;
        if (!teacherId) return res.status(401).json({ success: false, data: null, error: "Unauthorized" });

        if (!finalSubjectId || !finalTopicId) {
            return res.status(400).json({ 
                success: false, 
                data: null, 
                error: "The pedagogical context (Subject/Topic) could not be resolved. Please verify curriculum mapping." 
            });
        }
        const lesson = await prisma.lessonPlan.create({
            data: {
                title: title || aiData?.title || `Lesson: ${topicName || 'Generated'}`,
                teacherId: teacherId,
                subjectId: finalSubjectId,
                topicId: finalTopicId,
                objective: (aiData?.learningObjectives || aiData?.objective) 
                    ? (Array.isArray(aiData.learningObjectives || aiData.objective) 
                        ? (aiData.learningObjectives || aiData.objective).join(', ') 
                        : (aiData.learningObjectives || aiData.objective)) 
                    : objective || '',
                duration: parseInt(duration) || 45,
                activities: aiData
                    ? JSON.stringify({
                        introduction: aiData.introduction,
                        learningObjectives: aiData.learningObjectives,
                        priorKnowledge: aiData.priorKnowledge,
                        keyVocabulary: aiData.keyVocabulary,
                        keyConcepts: aiData.keyConcepts,
                        lessonFlow: aiData.lessonFlow,
                        activities: aiData.activities,
                        bloomsTaxonomy: aiData.bloomsTaxonomy,
                        differentiationStrategies: aiData.differentiationStrategies,
                        misconceptions: aiData.misconceptions || aiData.commonMisconceptions,
                        realWorldConnection: aiData.realWorldConnection,
                        assessment: aiData.assessment,
                        summary: aiData.summary,
                    })
                    : (typeof activities === 'string' ? activities : JSON.stringify(activities || [])),
                homework: (Array.isArray(aiData?.homework) ? aiData.homework.join('. ') : aiData?.homework) || homework || '',
                resources: aiData?.resources || (aiData?.materialsRequired ? aiData.materialsRequired.join(', ') : resources) || '',
                status: 'DRAFT',
            }
        });

        res.status(201).json({ success: true, data: { ...lesson, aiMeta }, error: null });
    } catch (error: any) {
        console.error("CRITICAL: Create Lesson Error:\n", error.stack);
        res.status(500).json({ success: false, data: null, error: error.message || 'Failed to create lesson plan' });
    }
};

export const getLessons = async (req: AuthRequest, res: Response) => {
    try {
        const teacherId = req.user?.id;
        if (!teacherId) {
            return res.status(401).json({ success: false, data: [], error: 'Session context missing' });
        }

        const limitRaw = (req.query.limit as string) || '50';
        const limit = Math.min(Math.max(parseInt(limitRaw) || 50, 1), 100);

        const lessons = await prisma.lessonPlan.findMany({
            where: { teacherId },
            include: { 
                subject: { select: { id: true, name: true } }, 
                topic: { select: { id: true, name: true } } 
            },
            orderBy: { updatedAt: 'desc' },
            take: limit,
        });

        // Normalize JSON activities if they are stored as strings
        const normalized = lessons.map(l => {
            let parsedActivities = l.activities;
            if (typeof l.activities === 'string') {
                try {
                    parsedActivities = JSON.parse(l.activities);
                } catch (e) {
                    // If it's not valid JSON (e.g. raw Markdown from Materials), keep it as a string
                    parsedActivities = l.activities;
                }
            }
            return { ...l, activities: parsedActivities };
        });

        res.json({ success: true, data: normalized, error: null });
    } catch (error: any) {
        console.error("[PEDAGOGICAL_AUDIT_FAILURE] V1_GET_LESSONS_CRASH:", {
            message: error.message,
            stack: error.stack,
            teacherId: req.user?.id
        });
        res.status(500).json({ success: false, data: [], error: 'The pedagogical index is temporarily desynchronized.' });
    }
};

export const getLessonById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const lesson = await prisma.lessonPlan.findFirst({
            where: { id, teacherId: req.user?.id },
            include: { subject: true, topic: true }
        });

        if (!lesson) return res.status(404).json({ success: false, data: null, error: 'Lesson not found' });
        
        res.json({ success: true, data: lesson, error: null });
    } catch (error: any) {
        res.status(500).json({ success: false, data: null, error: error.message || 'Failed to fetch lesson' });
    }
};

export const updateLesson = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const lesson = await prisma.lessonPlan.updateMany({
            where: { id, teacherId: req.user?.id },
            data: { ...req.body }
        });
        
        if (lesson.count === 0) return res.status(404).json({ success: false, data: null, error: 'Lesson not found' });
        
        res.json({ success: true, data: { id, message: 'Updated' }, error: null });
    } catch (error: any) {
        res.status(500).json({ success: false, data: null, error: error.message || 'Update failed' });
    }
};

export const deleteLesson = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const result = await prisma.lessonPlan.deleteMany({
            where: { id, teacherId: req.user?.id }
        });
        
        if (result.count === 0) return res.status(404).json({ success: false, data: null, error: 'Lesson not found' });
        
        res.json({ success: true, data: null, error: null });
    } catch (error: any) {
        res.status(500).json({ success: false, data: null, error: error.message || 'Delete failed' });
    }
};

export const summarizeLesson = async (req: AuthRequest, res: Response) => {
    try {
        const { text } = req.body;
        const { data: summary, meta } = await AIService.summarizeContent(text);
        res.json({ success: true, data: { ...summary, aiMeta: meta }, error: null });
    } catch (error: any) {
        res.status(500).json({ success: false, data: null, error: error.message || 'Summarization failed' });
    }
};

export const summarizeLessonPdf = async (req: AuthRequest, res: Response) => {
    let filePath = '';
    try {
        console.log("[BACKEND] Received summarize-pdf request");
        if (!req.file) {
            console.warn("[BACKEND] No file attached to request");
            return res.status(400).json({ success: false, data: null, error: 'No PDF provided' });
        }
        
        filePath = req.file.path;
        console.log("[BACKEND] Staged file path:", filePath);
        
        if (!fs.existsSync(filePath)) {
            console.error("[BACKEND] File missing on disk after upload:", filePath);
            throw new Error("Staged file not found on intelligence bus.");
        }

        console.log("[BACKEND] Reading buffer...");
        const dataBuffer = fs.readFileSync(filePath);
        console.log("[BACKEND] Buffer size:", dataBuffer.length);
        
        console.log("[BACKEND] Initiating PDF parse protocol...");
        
        console.log("[BACKEND] Initiating PDF parse protocol (Stable v1.1.1)...");
        
        try {
            const data = await pdfParse(dataBuffer);
            const text = data.text;

            console.log("[BACKEND] PDF Extraction Success. Length:", text?.length || 0);
            
            if (!text || text.trim().length < 20) {
                console.warn("[BACKEND] Extraction warning: Content too short or empty.");
                return res.status(400).json({ 
                    success: false, 
                    data: null, 
                    error: "Unable to extract readable text from PDF. Artifact might be image-based or protected." 
                });
            }

            console.log("[BACKEND] Invoking AI synthesis...");
            const { data: summary, meta } = await AIService.summarizeContent(text);
            
            console.log("[BACKEND] Synthesis complete. Provider:", meta.provider);
            res.json({ success: true, data: { ...summary, aiMeta: meta }, error: null });
        } catch (parseError: any) {
            console.error("[BACKEND] Parser failure:", parseError.message);
            throw new Error(`PDF Parsing failed: ${parseError.message}`);
        }
    } catch (error: any) {
        console.error("[BACKEND] CRITICAL SUMMARIZATION FAILURE:", error);
        res.status(500).json({ 
            success: false, 
            data: null, 
            error: `Protocol failure: ${error.message || 'Unknown internal error'}` 
        });
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            console.log("[BACKEND] Cleaning up artifact:", filePath);
            fs.unlinkSync(filePath);
        }
    }
};
