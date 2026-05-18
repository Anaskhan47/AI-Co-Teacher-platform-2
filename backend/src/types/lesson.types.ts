export interface CreateLessonDTO {
    title: string;
    objective: string;
    duration: number;
    subjectId: string;
    topicId: string;
    activities?: any;
    homework?: string;
    resources?: string;
}

export interface UpdateLessonDTO extends Partial<CreateLessonDTO> {
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}
