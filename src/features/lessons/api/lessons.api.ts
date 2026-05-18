import api, { ApiResponse } from "@/api/client";
import { Lesson, CreateLessonDTO, UpdateLessonDTO } from "../types";

/**
 * LESSON DOMAIN NORMALIZATION LAYER
 * Ensures that the data entering the React state is clean, validated, and resilient.
 */
const normalizeLesson = (raw: any): Lesson => {
    return {
        id: raw.id || '',
        title: raw.title || 'Untitled Lesson',
        objective: raw.objective || '',
        duration: Number(raw.duration) || 0,
        activities: Array.isArray(raw.activities) 
            ? raw.activities 
            : typeof raw.activities === 'string' 
                ? JSON.parse(raw.activities || '[]') 
                : [],
        homework: raw.homework || '',
        resources: raw.resources || '',
        status: (['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(raw.status) ? raw.status : 'DRAFT') as any,
        teacherId: raw.teacherId || '',
        subjectId: raw.subjectId || '',
        topicId: raw.topicId || '',
        createdAt: raw.createdAt || new Date().toISOString(),
        updatedAt: raw.updatedAt || new Date().toISOString(),
        subject: raw.subject ? { id: raw.subject.id, name: raw.subject.name } : undefined,
        topic: raw.topic ? { id: raw.topic.id, name: raw.topic.name } : undefined,
    };
};

export const LessonsAPI = {
    /**
     * Fetch all lessons for the authenticated teacher
     */
    async getAll(): Promise<ApiResponse<Lesson[]>> {
        const response = await api.get('/v2/lessons');
        if (response.success && Array.isArray(response.data)) {
            response.data = response.data.map(normalizeLesson);
        }
        return response;
    },

    /**
     * Fetch a single lesson by ID
     */
    async getById(id: string): Promise<ApiResponse<Lesson>> {
        const response = await api.get(`/v2/lessons/${id}`);
        if (response.success && response.data) {
            response.data = normalizeLesson(response.data);
        }
        return response;
    },

    /**
     * Persist a new lesson to the domain
     */
    async create(dto: CreateLessonDTO): Promise<ApiResponse<Lesson>> {
        const response = await api.post('/v2/lessons', dto);
        if (response.success && response.data) {
            response.data = normalizeLesson(response.data);
        }
        return response;
    },

    /**
     * Update an existing lesson
     */
    async update(id: string, dto: UpdateLessonDTO): Promise<ApiResponse<Lesson>> {
        const response = await api.patch(`/v2/lessons/${id}`, dto);
        if (response.success && response.data) {
            response.data = normalizeLesson(response.data);
        }
        return response;
    },

    /**
     * Delete a lesson (Soft delete / Archive recommended in production)
     */
    async delete(id: string): Promise<ApiResponse<void>> {
        return await api.delete(`/v2/lessons/${id}`);
    }
};
