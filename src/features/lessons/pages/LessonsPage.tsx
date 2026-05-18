import React, { useState } from 'react';
import { LessonList } from '../components/LessonList';
import { Lesson } from '../types';
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * LESSON RESOURCE ARCHIVE
 * The primary entry point for lesson management in the new architecture.
 */
export const LessonsPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("");

    const handleLessonSelect = (lesson: Lesson) => {
        console.log("Selected Lesson for Inspection:", lesson.id);
        // Navigation logic will go here in next step
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ── Header Section ────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Pedagogical Archive</h1>
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] italic">Institutional Lesson Management System v2.0</p>
                </div>

                <div className="flex items-center gap-4">
                    <Button className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95 border border-indigo-400/20 gap-3">
                        <Plus className="w-4 h-4" />
                        Initialize Synthesis
                    </Button>
                </div>
            </div>

            {/* ── Search & Filters ──────────────────────────────────────────── */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <Input 
                        placeholder="SEARCH ARCHIVE BY TITLE OR SUBJECT..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                        className="h-14 pl-14 pr-6 bg-slate-50 border-none rounded-2xl text-[10px] font-black tracking-widest placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-500/20 transition-all uppercase"
                    />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <Button variant="outline" className="h-14 px-6 rounded-2xl border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all gap-3">
                        <Filter className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                    </Button>
                </div>
            </div>

            {/* ── Data Grid ─────────────────────────────────────────────────── */}
            <div className="min-h-[400px]">
                <LessonList onSelect={handleLessonSelect} />
            </div>
        </div>
    );
};
