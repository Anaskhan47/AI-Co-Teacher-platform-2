export type LessonStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Lesson {
    id: string;
    title: string;
    objective: string;
    duration: number; // in minutes
    activities: any[]; // Normalized as an array
    homework?: string;
    resources?: string;
    status: LessonStatus;
    teacherId: string;
    subjectId: string;
    topicId: string;
    createdAt: string;
    updatedAt: string;
    
    // Expanded Relations (Optional)
    subject?: {
        id: string;
        name: string;
    };
    topic?: {
        id: string;
        name: string;
    };
}

export interface LessonSummary {
    id: string;
    title: string;
    subjectName: string;
    topicName: string;
    updatedAt: string;
    status: LessonStatus;
}

export interface CreateLessonDTO {
    title: string;
    objective: string;
    duration: number;
    subjectId: string;
    topicId: string;
    activities?: any[];
    homework?: string;
    resources?: string;
}

export interface UpdateLessonDTO extends Partial<CreateLessonDTO> {
    status?: LessonStatus;
}
