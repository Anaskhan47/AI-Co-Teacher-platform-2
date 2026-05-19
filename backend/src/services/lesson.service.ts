import prisma from '../lib/prisma.js';
import { CreateLessonDTO, UpdateLessonDTO } from '../types/lesson.types.js';

/**
 * LESSON DOMAIN SERVICE
 * Responsible for all persistent state transitions of the Lesson entity.
 * This service is AI-agnostic and focused strictly on data integrity and Prisma orchestration.
 */
export const LessonService = {
    /**
     * Retrieves all lessons for a specific teacher with relation expansion.
     */
    async findAllByTeacher(teacherId: string, limit: number = 50) {
        return await prisma.lessonPlan.findMany({
            where: { teacherId },
            include: {
                subject: { select: { id: true, name: true } },
                topic: { select: { id: true, name: true } }
            },
            orderBy: { updatedAt: 'desc' },
            take: limit
        });
    },

    /**
     * Retrieves a single lesson with deep relation expansion.
     */
    async findById(id: string, teacherId: string) {
        return await prisma.lessonPlan.findFirst({
            where: { id, teacherId },
            include: {
                subject: { select: { id: true, name: true } },
                topic: { select: { id: true, name: true } }
            }
        });
    },

    /**
     * Creates a new lesson record.
     */
    async create(teacherId: string, data: CreateLessonDTO) {
        return await prisma.lessonPlan.create({
            data: {
                title: data.title,
                objective: data.objective,
                duration: data.duration,
                activities: typeof data.activities === 'string' 
                    ? data.activities 
                    : JSON.stringify(data.activities || []),
                homework: data.homework,
                resources: data.resources,
                status: 'DRAFT',
                teacherId: teacherId,
                subjectId: data.subjectId,
                topicId: data.topicId,
            }
        });
    },

    /**
     * Updates an existing lesson record with partial data.
     */
    async update(id: string, teacherId: string, data: UpdateLessonDTO) {
        // We use updateMany + find to ensure teacher ownership without a separate check
        await prisma.lessonPlan.updateMany({
            where: { id, teacherId },
            data: {
                ...data,
                activities: data.activities && typeof data.activities !== 'string' 
                    ? JSON.stringify(data.activities) 
                    : data.activities,
                updatedAt: new Date()
            }
        });

        return await this.findById(id, teacherId);
    },

    /**
     * Removes a lesson record.
     */
    async delete(id: string, teacherId: string) {
        const result = await prisma.lessonPlan.deleteMany({
            where: { id, teacherId }
        });
        return result.count > 0;
    }
};
