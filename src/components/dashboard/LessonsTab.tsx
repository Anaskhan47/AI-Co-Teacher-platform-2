import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, MoreVertical, Loader2, Search, Filter, Clock, FileText, HelpCircle, GraduationCap, Download, Archive } from "lucide-react";
import { downloadAsFile } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LessonsTabProps {
    onLessonSelect?: (lesson: any) => void;
}

export function LessonsTab({ onLessonSelect }: LessonsTabProps) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month">("all");
    const { data: lessons, isLoading } = useQuery({
        queryKey: ['lessons'],
        queryFn: async () => {
            const res = await api.get('/lessons');
            return res.data?.data || res.data || []; // Safe unwrap
        }
    });

    const filteredLessons = lessons?.filter((lesson: any) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = (
            lesson.title?.toLowerCase().includes(search) ||
            lesson.subject?.name?.toLowerCase().includes(search) ||
            lesson.subject?.toLowerCase?.().includes(search) ||
            lesson.topic?.name?.toLowerCase().includes(search) ||
            lesson.topic?.toLowerCase?.().includes(search)
        );

        if (!matchesSearch) return false;

        if (timeFilter === "all") return true;

        const lessonDate = new Date(lesson.createdAt || lesson.updatedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lessonDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (timeFilter === "today") return diffDays <= 1;
        if (timeFilter === "week") return diffDays <= 7;
        if (timeFilter === "month") return diffDays <= 30;

        return true;
    });

    const handleDownload = (lesson: any) => {
        let content = "";
        const title = lesson.title || "Untitled";
        
        if (lesson.type === 'QUIZ' || lesson.questions) {
            const questions = typeof lesson.questions === 'string' ? JSON.parse(lesson.questions) : (lesson.questions || []);
            content = `# ${title}\n\n`;
            questions.forEach((q: any, i: number) => {
                content += `Q${i + 1}: ${q.question}\n`;
                if (q.options) {
                    q.options.forEach((opt: string, optIdx: number) => {
                        content += `${String.fromCharCode(65 + optIdx)}) ${opt}\n`;
                    });
                }
                content += `Correct Answer: ${q.correctAnswer}\n\n`;
            });
        } else {
            content = `# ${title}\n\n`;
            content += `Objective: ${lesson.objective}\n\n`;
            content += `Duration: ${lesson.duration} mins\n\n`;
            
            if (lesson.activities) {
                content += `## Activities\n`;
                const activities = typeof lesson.activities === 'string' ? JSON.parse(lesson.activities) : lesson.activities;
                activities.forEach((act: any, i: number) => {
                    content += `${i + 1}. [${act.time}] ${act.description}\n`;
                    if (act.tip) content += `   Tip: ${act.tip}\n`;
                });
                content += `\n`;
            }
            
            if (lesson.homework) content += `## Homework\n${lesson.homework}\n\n`;
            if (lesson.resources) content += `## Resources\n${lesson.resources}\n\n`;
        }

        downloadAsFile(`${title.replace(/[^a-z0-9]/gi, '_')}.md`, content);
        toast.success("Download started!");
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* SaaS Header Alignment */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                <div className="text-left space-y-3">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
                        Institutional Archive
                    </h1>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] italic">
                        Pedagogical Asset Management & Retrieval
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100 mt-2">
                        <BookOpen className="w-3 h-3 text-indigo-600" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">{filteredLessons?.length || 0} Assets Archived</span>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-end gap-4 max-w-2xl w-full">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            placeholder="Search archives, subjects or topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 h-14 bg-white border-slate-100 rounded-[1.2rem] focus-visible:ring-indigo-500/20 text-slate-900 placeholder:text-slate-300 shadow-sm"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className={cn(
                                "h-14 px-6 rounded-[1.2rem] border-slate-100 font-black uppercase tracking-widest text-[10px] bg-white text-slate-400 hover:text-indigo-600 transition-all",
                                timeFilter !== 'all' && "text-indigo-600 border-indigo-100 bg-indigo-50"
                            )}>
                                <Filter className="w-4 h-4 mr-2" />
                                {timeFilter === 'all' ? 'Filter' : timeFilter.toUpperCase()}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white border-slate-100 rounded-2xl p-2 shadow-2xl">
                            <DropdownMenuItem onClick={() => setTimeFilter("all")} className="rounded-xl font-black uppercase tracking-widest text-[9px] py-3 cursor-pointer">All Time</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeFilter("today")} className="rounded-xl font-black uppercase tracking-widest text-[9px] py-3 cursor-pointer flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" /> Today
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeFilter("week")} className="rounded-xl font-black uppercase tracking-widest text-[9px] py-3 cursor-pointer">Last Week</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTimeFilter("month")} className="rounded-xl font-black uppercase tracking-widest text-[9px] py-3 cursor-pointer">Last Month</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-24 text-slate-400">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-6" />
                        <p className="font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Synchronizing Archives...</p>
                    </div>
                ) : filteredLessons?.length === 0 ? (
                    <div className="text-center py-32 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                        <Archive className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">
                            {searchTerm || timeFilter !== 'all' ? `No matching archives found` : "Your institutional archive is empty"}
                        </p>
                    </div>
                ) : (
                    filteredLessons?.map((lesson: any) => (
                        <Card
                            key={lesson.id}
                            onClick={() => onLessonSelect?.(lesson)}
                            className="border border-slate-100 shadow-sm bg-white hover:bg-slate-50 hover:border-indigo-100 transition-all cursor-pointer group active:scale-[0.99] rounded-[2rem] overflow-hidden"
                        >
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 duration-500",
                                            lesson.type === 'QUIZ' ? 'bg-amber-500 text-white shadow-amber-500/20' :
                                            lesson.type === 'MATERIAL' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                            lesson.type === 'ASSIGNMENT' ? 'bg-indigo-600 text-white shadow-indigo-600/20' :
                                            'bg-indigo-600 text-white shadow-indigo-600/20'
                                        )}>
                                            {lesson.type === 'QUIZ' ? <HelpCircle className="w-8 h-8" /> :
                                             lesson.type === 'MATERIAL' ? <BookOpen className="w-8 h-8" /> :
                                             lesson.type === 'ASSIGNMENT' ? <FileText className="w-8 h-8" /> :
                                             <GraduationCap className="w-8 h-8" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-none tracking-tight uppercase">{lesson.title}</h3>
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border",
                                                    lesson.type === 'QUIZ' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    lesson.type === 'MATERIAL' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                )}>
                                                    {lesson.type || 'LESSON'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{lesson.subject?.name || lesson.subjectName || lesson.subject || 'General'}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{lesson.topic?.name || lesson.topicName || lesson.topic || 'Intro'}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Grade {lesson.grade || 10}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        {lesson.type === 'QUIZ' && (
                                            <Button
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/quiz/${lesson.id}`);
                                                }}
                                                className="h-10 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 font-black text-[9px] text-white shadow-xl shadow-amber-500/20 transition-all uppercase tracking-widest"
                                            >
                                                Deploy Protocol
                                            </Button>
                                        )}
                                        <span className={cn(
                                            "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border",
                                            lesson.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                        )}>
                                            {lesson.status || 'DRAFT'}
                                        </span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button 
                                                    className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 bg-white border-slate-100 rounded-2xl p-2 shadow-2xl">
                                                <DropdownMenuItem 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(lesson);
                                                    }}
                                                    className="rounded-xl flex items-center gap-2 font-black uppercase tracking-widest text-[9px] py-3 cursor-pointer text-slate-600 hover:text-indigo-600"
                                                >
                                                    <Download className="w-4 h-4 text-indigo-400" />
                                                    Export Artifact
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toast.info("Archiving protocol initiated (Simulation)");
                                                    }}
                                                    className="rounded-xl flex items-center gap-2 font-black uppercase tracking-widest text-[9px] py-3 cursor-pointer text-rose-500 hover:bg-rose-50"
                                                >
                                                    <Archive className="w-4 h-4" />
                                                    Archive Record
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

