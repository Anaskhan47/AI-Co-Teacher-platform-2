import React from 'react';
import { useLessons } from '../hooks/useLessons';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Clock, ChevronRight, Inbox } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Lesson } from '../types';

interface LessonListProps {
    onSelect?: (lesson: Lesson) => void;
}

/**
 * PRODUCTION-GRADE LESSON LIST
 * Features:
 * 1. Defensive array rendering
 * 2. Explicit loading/empty/error states
 * 3. Sanitized property access
 */
export const LessonList: React.FC<LessonListProps> = ({ onSelect }) => {
    const { data, isLoading, error } = useLessons();

    // ── DEFENSIVE DATA NORMALIZATION ──────────────────────────────────────────
    const lessons = Array.isArray(data) ? data : [];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400"> Synchronizing Archives...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center">
                <p className="text-xs font-bold text-red-600 uppercase tracking-tight">Access Protocol Failure</p>
                <p className="text-[10px] text-red-400 mt-2">{(error as Error).message}</p>
            </div>
        );
    }

    if (lessons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm mb-6">
                    <Inbox className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Zero Lessons Indexed</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] max-w-xs leading-relaxed italic">
                    The pedagogical archive is currently vacant. Initiate a new synthesis to begin.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
                <Card 
                    key={lesson.id} 
                    className="group border-slate-200 hover:border-indigo-600/30 transition-all duration-500 rounded-3xl overflow-hidden cursor-pointer bg-white shadow-sm hover:shadow-xl hover:shadow-indigo-600/5 active:scale-[0.98]"
                    onClick={() => onSelect?.(lesson)}
                >
                    <CardContent className="p-0">
                        {/* Status Ribbon */}
                        <div className="h-1.5 w-full bg-slate-100 relative overflow-hidden">
                            <div className={cn(
                                "absolute inset-0 transition-transform duration-700",
                                lesson.status === 'PUBLISHED' ? "bg-emerald-500" : "bg-amber-400"
                            )} />
                        </div>

                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <Badge className={cn(
                                    "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border-none shadow-none",
                                    lesson.status === 'PUBLISHED' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                )}>
                                    {lesson.status}
                                </Badge>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    {format(new Date(lesson.updatedAt), "MMM dd, yyyy")}
                                </p>
                            </div>

                            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                {lesson.title || "Untitled Fragment"}
                            </h3>

                            <div className="flex flex-col gap-3 pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-3">
                                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate">
                                        {lesson.subject?.name || "General Domain"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                        {lesson.duration} Minute Session
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
                                        </div>
                                    ))}
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
