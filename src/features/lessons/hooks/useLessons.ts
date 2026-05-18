import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LessonsAPI } from "../api/lessons.api";
import { CreateLessonDTO, UpdateLessonDTO } from "../types";
import { toast } from "sonner";

/**
 * DEFENSIVE HOOKS POLICY:
 * 1. Retry: 1 (Avoid flooding the server if it's down)
 * 2. refetchOnWindowFocus: false (Predictable UI state)
 * 3. Graceful fallbacks for data
 */

export const useLessons = () => {
    return useQuery({
        queryKey: ['lessons'],
        queryFn: async () => {
            const res = await LessonsAPI.getAll();
            if (!res.success) throw new Error(res.error || 'Failed to fetch lessons');
            return Array.isArray(res.data) ? res.data : [];
        },
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useLesson = (id: string | undefined) => {
    return useQuery({
        queryKey: ['lessons', id],
        queryFn: async () => {
            if (!id) return null;
            const res = await LessonsAPI.getById(id);
            if (!res.success) throw new Error(res.error || 'Lesson not found');
            return res.data;
        },
        enabled: !!id,
        retry: 1,
        refetchOnWindowFocus: false,
    });
};

export const useCreateLesson = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateLessonDTO) => LessonsAPI.create(dto),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['lessons'] });
                toast.success("Lesson synthesized successfully.");
            }
        }
    });
};

export const useUpdateLesson = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string, dto: UpdateLessonDTO }) => 
            LessonsAPI.update(id, dto),
        onSuccess: (res, variables) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['lessons'] });
                queryClient.invalidateQueries({ queryKey: ['lessons', variables.id] });
                toast.success("Lesson architecture updated.");
            }
        }
    });
};

export const useDeleteLesson = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => LessonsAPI.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lessons'] });
            toast.success("Lesson decommissioned.");
        }
    });
};
