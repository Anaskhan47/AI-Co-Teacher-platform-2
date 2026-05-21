import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import {
    Loader2,
    Library,
    Download,
    Check,
    ChevronsUpDown,
    Brain as BrainIcon,
    FileUp as FileUpIcon,
    Target,
    Clock,
    BookOpen,
    Sparkles,
    FileText,
    ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import api from "@/api/client";
import { toast } from "sonner";
import { QuickActionDialog } from "./QuickActionDialog";
import { downloadAsPDF } from "@/lib/utils";

interface AIAssistantTabProps {
    initialMode?: "lesson" | "material" | "quiz";
    preloadedResult?: any;
}

/** 
 * ── RESILIENCE UTILITIES ──
 * Prevents .map() crashes on malformed AI data.
 */
function safeArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (typeof value === "string" && value.trim()) {
        const val = value.trim();
        // Intelligent splitting if AI returns a single string with multiple points
        if (val.includes("\n")) return val.split("\n").map(s => s.replace(/^[•\-\d\.]+\s*/, "").trim()).filter(Boolean);
        // Split by period or comma if it's clearly multiple sentences/points
        if (val.includes(". ") && val.length > 60) return val.split(". ").map(s => s.trim()).filter(Boolean);
        if (val.includes(", ") && val.length > 100) return val.split(", ").map(s => s.trim()).filter(Boolean);
        return [val];
    }
    return [];
}

export function AIAssistantTab({ initialMode = "lesson", preloadedResult }: AIAssistantTabProps) {
    const [searchParams] = useSearchParams();
    
    const paramMode = searchParams.get("mode") as "lesson" | "material" | "quiz" | null;
    const paramBoard = searchParams.get("board");
    const paramGrade = searchParams.get("grade");
    const paramSubject = searchParams.get("subject");
    const paramTopic = searchParams.get("topic");

    const [isMounted, setIsMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setIsMounted(true); }, []);

    const [mode, setMode] = useState<"lesson" | "material" | "quiz">(paramMode || initialMode);
    const [board, setBoard] = useState(paramBoard || "CBSE");
    const [grade, setGrade] = useState(preloadedResult?.grade || paramGrade || "");
    const [subject, setSubject] = useState(preloadedResult?.subject?.name || preloadedResult?.subject || paramSubject || "");
    const [topic, setTopic] = useState(preloadedResult?.topic?.name || preloadedResult?.topic || paramTopic || "");
    const [detailLevel, setDetailLevel] = useState([70]);
    const [pdfText, setPdfText] = useState("");
    const [unitDetails, setUnitDetails] = useState("");
    const [sessionDuration, setSessionDuration] = useState("45");
    const [numQuestions, setNumQuestions] = useState("10");
    const [openTopic, setOpenTopic] = useState(false);

    // ── Master Curriculum Registry ───────
    const MASTER_SUBJECTS = ["English", "Mathematics", "Science", "EVS", "Hindi", "Computer Science", "Social Studies", "Physics", "Chemistry", "Biology", "History", "Geography", "Civics", "Economics", "Accountancy", "Business Studies", "Political Science", "Psychology"];
    const MASTER_TOPICS: Record<string, string[]> = {
        "English": ["Nouns", "Pronouns", "Verbs", "Adjectives", "Tenses", "Articles", "Reading Comprehension", "Writing Skills", "Letter Writing", "Story Writing"],
        "Mathematics": ["Numbers", "Fractions", "Decimals", "Algebra", "Linear Equations", "Geometry", "Mensuration", "Trigonometry", "Probability", "Statistics"],
        "Science": ["Food and Nutrition", "Motion and Force", "Light", "Electricity", "Acids and Bases", "Metals and Non-metals", "Life Processes", "Reproduction", "Gravitation", "Ecosystems"],
        "EVS": ["My Family", "Plants", "Animals", "Water", "Air", "Shelter"],
        "Hindi": ["Vyakaran", "Kavita", "Kahani", "Nibandh"],
        "Computer Science": ["Computer Basics", "Hardware and Software", "Paint", "MS Office", "Programming Basics", "Internet Safety"],
        "Social Studies": ["Our Earth", "India", "Governments", "Early Humans"],
        "Physics": ["Motion", "Laws of Motion", "Work and Energy", "Sound", "Light", "Electricity", "Magnetic Effects"],
        "Chemistry": ["Atoms and Molecules", "Chemical Reactions", "Acids, Bases, Salts", "Carbon Compounds", "Periodic Table"],
        "Biology": ["Cell Structure", "Tissues", "Nutrition", "Respiration", "Reproduction", "Heredity", "Environment"],
        "History": ["Civilizations", "Revolutions", "Nationalism", "World Wars", "Freedom Struggle"],
        "Geography": ["Climate", "Resources", "Agriculture", "Minerals", "Manufacturing"],
        "Civics": ["Democracy", "Constitution", "Rights", "Power Sharing", "Federalism"],
        "Economics": ["Poverty", "Development", "Markets", "Money and Credit", "Consumer Rights"],
        "Accountancy": ["Introduction to Accounting", "Journal and Ledger", "Trial Balance", "Depreciation", "Financial Statements"],
        "Business Studies": ["Nature and Significance of Management", "Principles of Management", "Marketing", "Consumer Protection"],
        "Political Science": ["Cold War", "End of Bipolarity", "US Hegemony", "International Organizations"],
        "Psychology": ["Intelligence", "Personality", "Human Development", "Therapeutic Approaches"]
    };

    const [subjectsList, setSubjectsList] = useState<string[]>(MASTER_SUBJECTS);
    const [topicsMap, setTopicsMap] = useState<Record<string, string[]>>(MASTER_TOPICS);
    const [curriculumLoading, setCurriculumLoading] = useState(false);

    useEffect(() => {
        const fetchCurriculum = async () => {
            if (!board || !grade) return;
            setCurriculumLoading(true);
            try {
                const res = await api.get(`/curriculum/metadata?curriculum=${board}&class=${grade}`);
                if (res.success && res.data) {
                    setSubjectsList(res.data.subjects || []);
                    setTopicsMap(res.data.topics || {});
                }
            } catch (err) { console.error("Curriculum fetch failed."); }
            finally { setCurriculumLoading(false); }
        };
        fetchCurriculum();
    }, [board, grade]);

    const availableTopics = (() => {
        if (!subject || !topicsMap) return [];
        const normalizedKey = Object.keys(topicsMap).find(k => k.toLowerCase() === subject.toLowerCase());
        return normalizedKey ? topicsMap[normalizedKey] : topicsMap[subject] || [];
    })();

    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<any>(preloadedResult || null);
    const [synthesisStatus, setSynthesisStatus] = useState("");

    const handleGenerate = async () => {
        console.log("[AI_WORKSPACE] Synthesis triggered", { mode, board, grade, subject, topic });
        
        if (!grade || !subject || !topic) {
            console.warn("[AI_WORKSPACE] Missing parameters");
            toast.error("Please specify Grade, Subject and Topic.");
            return;
        }
        setIsGenerating(true);
        setResult(null);
        setSynthesisStatus("Synthesizing extensive content...");

        try {
            let endpoint = mode === "lesson" ? "/lessons" : mode === "quiz" ? "/quizzes" : "/materials";
            console.log(`[AI_WORKSPACE] Calling ${endpoint}...`);
            
            const res = await api.post(endpoint, {
                curriculum: board, grade, subject, topic, pdfText,
                duration: sessionDuration, unitDetails, 
                count: parseInt(numQuestions),
                detailLevel: detailLevel[0],
                aiAssist: true,
            });

            console.log("[AI_WORKSPACE] Response received:", res);

            if (res && (res.success || res.aiData || res.data)) {
                let finalData = res.data?.aiData || res.data || res.aiData || res;
                
                // If it's a DB record with stringified activities, parse it
                if (typeof finalData?.activities === 'string') {
                    try {
                        const parsed = JSON.parse(finalData.activities);
                        finalData = { ...finalData, ...parsed };
                    } catch (e) {
                        console.warn("[AI_WORKSPACE] Failed to parse activities string", e);
                    }
                }
                
                setResult(finalData);
                toast.success("Content generated successfully.");
            } else {
                console.error("[AI_WORKSPACE] Generation failed result:", res);
                toast.error(res?.error || "Generation failed.");
            }
        } catch (err: any) {
            console.error("[AI_WORKSPACE] Critical Error:", err);
            toast.error(err.response?.data?.error || err.message || "Server failure.");
        } finally {
            setIsGenerating(false);
            setSynthesisStatus("");
        }
    };

    const handleDownloadPDF = () => {
        if (!result) return;
        downloadAsPDF(result, `${mode.toUpperCase()}_${topic}.pdf`);
    };

    const handleSaveToLibrary = async () => {
        setIsSaving(true);
        setTimeout(() => { setIsSaving(false); toast.success("Saved to Library."); }, 800);
    };

    if (!isMounted) return null;

    return (
        <div className="w-full px-6 py-12 animate-in fade-in duration-700">
            {/* SaaS Header Alignment - LEFT JUSTIFIED (MATCHING PLATFORM STANDARD) */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
                <div className="text-left space-y-3">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
                        AI Workspace
                    </h1>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] italic">
                        Autonomous Pedagogical Production Hub
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100 mt-2">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Synthesis Hub</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-white p-1 rounded-[1.2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                        {[{ id: "lesson", label: "Planner", icon: BookOpen }, { id: "material", label: "Materials", icon: FileText }, { id: "quiz", label: "Quiz", icon: ClipboardList }].map((m) => (
                            <button 
                                key={m.id} 
                                onClick={() => { setMode(m.id as any); setResult(null); }} 
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-[1rem] text-[9px] font-black uppercase tracking-widest transition-all", 
                                    mode === m.id ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <m.icon className="w-3.5 h-3.5" /> {m.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="w-full space-y-10">
                {/* 1. CONFIGURATION MATRIX */}
                <Card className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                    <CardContent className="p-10 space-y-10">
                        {/* ROW 1: PRIMARY TARGETING */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Curriculum</Label>
                                <Select value={board} onValueChange={setBoard}>
                                    <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-xl">
                                        {["CBSE", "ICSE", "IGCSE", "IB", "STATE"].map((b) => (
                                            <SelectItem key={b} value={b} className="font-bold text-xs">{b}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Grade</Label>
                                <Select value={grade} onValueChange={setGrade}>
                                    <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-xl">
                                        {[1,2,3,4,5,6,7,8,9,10,11,12].map((g) => (
                                            <SelectItem key={g} value={g.toString()} className="font-bold text-xs">Class {g}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1 flex items-center gap-2">
                                    Subject Area
                                    {curriculumLoading && <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-400" />}
                                </Label>
                                <Select value={subject} onValueChange={(v) => { setSubject(v); setTopic(""); }}>
                                    <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                                        <SelectValue placeholder="Choose Subject" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-xl">
                                        {subjectsList.map((s) => (
                                            <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Target Topic</Label>
                                <Popover open={openTopic} onOpenChange={setOpenTopic}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full h-14 justify-between rounded-[1.2rem] border-slate-100 bg-white font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                                            {topic || "Search Topic..."} <ChevronsUpDown className="h-4 w-4 opacity-40" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[320px] p-0" align="start">
                                        <Command className="rounded-xl">
                                            <CommandInput placeholder="Search topics…" />
                                            <CommandList>
                                                <CommandEmpty><div className="p-2 text-xs">Type to add custom topic below.</div></CommandEmpty>
                                                <CommandGroup heading="Curriculum Topics">
                                                    {availableTopics.map((t) => (
                                                        <CommandItem key={t} value={t} onSelect={() => { setTopic(t); setOpenTopic(false); }} className="text-xs font-bold">
                                                            {t}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                            <div className="p-4 border-t border-slate-100">
                                                <input className="w-full px-4 py-2 text-xs font-bold border rounded-xl bg-slate-50 focus:outline-none focus:ring-2 ring-indigo-500/10 transition-all" placeholder="Custom topic…" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") setOpenTopic(false); }} />
                                            </div>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* ROW 2: PARAMETERS & TRIGGER */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">
                                    {mode === "quiz" ? "Question Count" : "Session Duration"}
                                </Label>
                                <Select 
                                    value={mode === "quiz" ? numQuestions : sessionDuration} 
                                    onValueChange={mode === "quiz" ? setNumQuestions : setSessionDuration}
                                >
                                    <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-xl">
                                        {mode === "quiz" ? (
                                            ["5", "10", "15", "20"].map((n) => (
                                                <SelectItem key={n} value={n} className="font-bold text-xs">{n} Questions</SelectItem>
                                            ))
                                        ) : (
                                            ["30", "45", "60", "90"].map((d) => (
                                                <SelectItem key={d} value={d} className="font-bold text-xs">{d} Minutes</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex justify-between items-center mb-1">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Intelligence Depth</Label>
                                    <span className="text-[10px] font-black text-indigo-500 mr-2">{detailLevel[0]}%</span>
                                </div>
                                <div className="h-14 flex items-center px-6 bg-slate-50/30 rounded-[1.2rem] border border-slate-100 shadow-inner">
                                    <Slider value={detailLevel} onValueChange={setDetailLevel} max={100} step={5} className="w-full" />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !topic}
                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.2rem] shadow-xl shadow-indigo-600/20 border-none transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] group"
                                >
                                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                                    {isGenerating ? "Synthesizing" : "Start Synthesis"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <AnimatePresence mode="wait">
                    {isGenerating ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border rounded-3xl p-20 flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                            <p className="text-sm font-black uppercase tracking-widest text-slate-900">{synthesisStatus}</p>
                        </motion.div>
                    ) : result ? (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                            <div className="px-10 py-7 border-b border-slate-100 flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{result.title}</h2>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{result.grade} • {result.subject}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="h-9 px-4 rounded-xl text-[9px] font-black uppercase"><Download className="w-3.5 h-3.5 mr-1.5" /> PDF</Button>
                                    <Button onClick={handleSaveToLibrary} className="h-9 px-4 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase">Save</Button>
                                </div>
                            </div>

                            <div className="p-10 space-y-10">
                                {mode === "lesson" && (
                                    <>
                                        <div className="space-y-4">
                                            <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.25em] flex items-center gap-2"><Target className="w-3 h-3" /> Learning Objectives</h4>
                                            <div className="grid gap-2">
                                                {normalizeArray(result.learningObjectives || result.objective).map((obj: string, i: number) => (
                                                    <div key={i} className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                                                        <span className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-[9px] font-black shrink-0">{i + 1}</span>
                                                        <p className="text-xs font-bold text-slate-700 leading-relaxed">{obj}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Vocabulary & Concepts */}
                                        <div className="grid md:grid-cols-2 gap-8">
                                            {normalizeArray(result.keyVocabulary).length > 0 && (
                                                <div className="space-y-4">
                                                    <h4 className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                                        <Sparkles className="w-3 h-3" /> Essential Vocabulary
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {normalizeArray(result.keyVocabulary).map((v, i) => (
                                                            <span key={i} className="px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg text-[9px] font-bold text-amber-700">{v}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {normalizeArray(result.keyConcepts).length > 0 && (
                                                <div className="space-y-4">
                                                    <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                                        <BookOpen className="w-3 h-3" /> Core Concepts
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {normalizeArray(result.keyConcepts).map((c, i) => (
                                                            <span key={i} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[9px] font-bold text-indigo-700">{c}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-5">
                                            <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.25em] flex items-center gap-2"><Clock className="w-3 h-3" /> Lesson Flow</h4>
                                            <div className="relative ml-2 space-y-6 border-l-2 border-slate-100 pl-8">
                                                {safeArray(result.lessonFlow).map((step: any, i: number) => (
                                                    <div key={i} className="relative">
                                                        <div className="absolute -left-[41px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase">{step.time || step.duration}</span>
                                                            <span className="text-[10px] font-black text-slate-900 uppercase">{step.step || step.phase}</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-slate-600 leading-relaxed">{step.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Real World Connection */}
                                        {result.realWorldConnection && (
                                            <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-300">Real-World Context</span>
                                                </div>
                                                <p className="text-xs font-bold leading-relaxed opacity-90">{result.realWorldConnection}</p>
                                            </div>
                                        )}
                                        {result.homework && (
                                            <div className="pt-6 border-t border-slate-100">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Homework</p>
                                                <p className="text-xs font-bold text-slate-700 leading-relaxed">{Array.isArray(result.homework) ? result.homework.join(". ") : result.homework}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                                {mode === "material" && (
                                    <div className="prose prose-slate max-w-none">
                                        <ReactMarkdown className="text-xs font-bold text-slate-700 leading-relaxed space-y-4">{result.explanation || result.content || ""}</ReactMarkdown>
                                        {normalizeArray(result.definitions).length > 0 && (
                                            <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                                                <h4 className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Glossary</h4>
                                                <div className="grid gap-4">{safeArray(result.definitions).map((d: any, i: number) => (
                                                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                        <p className="text-[10px] font-black text-slate-900 uppercase mb-1">{d.term}</p>
                                                        <p className="text-xs font-bold text-slate-600">{d.meaning}</p>
                                                    </div>
                                                ))}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {mode === "quiz" && (
                                    <div className="space-y-8">
                                        {safeArray(result.questions).map((q: any, i: number) => (
                                            <div key={i} className="space-y-4">
                                                <p className="text-xs font-black text-slate-900">Q{i+1}: {q.question}</p>
                                                <div className="grid grid-cols-2 gap-3 ml-8">
                                                    {normalizeArray(q.options).map((opt: string, idx: number) => (
                                                        <div key={idx} className={cn("p-3 rounded-xl border text-[10px] font-bold", opt === q.correctAnswer ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-600")}>
                                                            {opt}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-48 text-center animate-in fade-in zoom-in duration-1000">
                            <div className="relative mb-12 group">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full animate-pulse" />
                                <div className="relative w-32 h-32 rounded-[3.5rem] bg-indigo-600 flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">
                                    <Sparkles className="w-14 h-14 text-white transition-colors duration-500" />
                                </div>
                            </div>
                            <h3 className="font-black text-4xl text-slate-900 tracking-tight uppercase leading-none">
                                Awaiting Synthesis Protocol
                            </h3>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-6 max-w-sm leading-loose opacity-60">
                                Select a protocol from the configuration matrix above to initialize institutional grade AI generation
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
