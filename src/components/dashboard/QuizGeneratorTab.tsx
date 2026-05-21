import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Save, Send, Trash2, CheckCircle2, ChevronRight, Trophy, Clock, Zap, Target, X as XIcon, Download, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { downloadAsPDF, cn } from "@/lib/utils";
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
import { ChevronsUpDown, Check } from "lucide-react";

export function QuizGeneratorTab() {
    const [searchParams] = useSearchParams();
    const paramGrade = searchParams.get("grade");
    const paramSubject = searchParams.get("subject");
    const paramTopic = searchParams.get("topic");

    const [selectedGrade, setSelectedGrade] = useState(paramGrade || "10");
    const [selectedSubject, setSelectedSubject] = useState(paramSubject || "");
    const [topicId, setTopicId] = useState(paramTopic || "");
    const [openTopic, setOpenTopic] = useState(false);
    const [questionType, setQuestionType] = useState("MCQ");
    const [questions, setQuestions] = useState<any[]>([]);

    const [instituteName, setInstituteName] = useState("");
    const [quizTitle, setQuizTitle] = useState("");
    const [difficultyLevel, setDifficultyLevel] = useState("Beginner");
    const [numQuestions, setNumQuestions] = useState(5);
    const [showPreview, setShowPreview] = useState(false);
    const [isReviewMode, setIsReviewMode] = useState(false);

    const [pdfText, setPdfText] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: curriculum, isLoading: curriculumLoading } = useQuery({
        queryKey: ['curriculum', 'CBSE', selectedGrade],
        queryFn: async () => {
            const res = await api.get('/curriculum/metadata', {
                params: { curriculum: "CBSE", class: selectedGrade }
            }) as any;
            return res.data;
        },
        enabled: !!selectedGrade
    });

    const availableTopics = (() => {
        if (!selectedSubject || !curriculum?.topics) return [];
        const topicsMap = curriculum.topics;
        const normalizedKey = Object.keys(topicsMap).find(k => k.toLowerCase() === selectedSubject.toLowerCase());
        return normalizedKey ? topicsMap[normalizedKey] : topicsMap[selectedSubject] || [];
    })();

    // Clear results on configuration change to reset synthesis viewport
    useEffect(() => {
        setQuestions([]);
    }, [selectedGrade, selectedSubject, topicId]);

    const queryClient = useQueryClient();

    const generateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/quizzes/generate', { ...data, pdfText });
            return res;
        },
        onSuccess: (res) => {
            if (res && res.success) {
                const qsRaw = res.data?.questions || res.questions || [];
                const sanitizedQuestions = qsRaw.map((q: any) => ({
                    ...q,
                    options: Array.isArray(q.options) && q.options.length === 4
                        ? q.options
                        : (Array.isArray(q.options) ? [...q.options, "", "", "", ""].slice(0, 4) : ["", "", "", ""]),
                    type: q.type || "MCQ"
                }));
                setQuestions(sanitizedQuestions);
                setIsReviewMode(false);
                setShowPreview(false); // Restore: Do not auto-launch preview
                toast.success(`Synthesized ${sanitizedQuestions.length} intelligence nodes!`);
            } else {
                toast.error(res?.error || "Failed to generate quiz");
            }
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/quizzes/save', data);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Intelligence protocol archived.");
            queryClient.invalidateQueries({ queryKey: ['quizzes'] });
        }
    });

    // AUTO-SYNTHESIS PROTOCOL
    // Automatically triggers synthesis when a topic is selected to provide a zero-click experience
    useEffect(() => {
        if (topicId && !generateMutation.isPending && questions.length === 0) {
            console.log("[QUIZ SYNTH] Target topic detected. Initializing auto-synthesis...");
            handleGenerate();
        }
    }, [topicId]);

    const handleGenerate = (textOverride?: string) => {
        if (!topicId) {
            toast.error("Enter topic protocol first.");
            return;
        }

        // AUTO-TRIGGER LOGIC: If we have text and topic, we start.
        console.log("[QUIZ SYNTH] Initializing synthesis protocol...");

        let bloomLevel = "Remember";
        if (difficultyLevel === "Intermediate") bloomLevel = "Apply";
        if (difficultyLevel === "Advanced") bloomLevel = "Evaluate";
        if (difficultyLevel === "Mixed") bloomLevel = "Mixed";

        generateMutation.mutate({
            topic: topicId,
            subject: selectedSubject || "General",
            grade: selectedGrade,
            curriculum: "CBSE",
            count: numQuestions,
            questionType,
            bloomLevel,
            instituteName,
            quizTitle,
            pdfText: textOverride !== undefined ? textOverride : pdfText
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log("[QUIZ SYNTH] Selected context artifact:", file.name, file.size);

        if (file.size > 50 * 1024 * 1024) {
            toast.error("Artifact exceeds 50MB limit.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        const loadingToast = toast.loading(`Transmitting artifact: ${file.name}...`);

        try {
            console.log("[QUIZ SYNTH] Transmitting to /upload/pdf...");
            const res = await api.post('/upload/pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (p) => {
                    const progress = Math.round((p.loaded * 100) / (p.total || 1));
                    console.log(`[QUIZ SYNTH] Transmission progress: ${progress}%`);
                }
            });

            console.log("[QUIZ SYNTH] Transmission response:", res);

            if (res.success) {
                const text = res.data.text;
                setPdfText(text);
                toast.success(`Context inherited: ${res.data.originalName || file.name}`, { id: loadingToast });

                if (topicId) {
                    console.log("[QUIZ SYNTH] Active topic detected. Handing off to reactive synthesis protocol...");
                }
            } else {
                toast.error(res.error || "Context extraction failed.", { id: loadingToast });
            }
        } catch (err: any) {
            console.error("[QUIZ SYNTH] CRITICAL FAILURE:", err);
            const errorMsg = err.response?.data?.error || err.message || "Network failure during transmission.";
            toast.error(errorMsg, { id: loadingToast });
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex: number, optIndex: number, value: string) => {
        const newQuestions = [...questions];
        const newOptions = [...newQuestions[qIndex].options];
        const oldValue = newOptions[optIndex];

        if (newQuestions[qIndex].correctAnswer === oldValue) {
            newQuestions[qIndex].correctAnswer = value;
        }

        newOptions[optIndex] = value;
        newQuestions[qIndex].options = newOptions;
        setQuestions(newQuestions);
    };

    const handleDownload = () => {
        if (questions.length === 0) return;
        const title = quizTitle || `Quiz_${topicId || 'General'}`;
        downloadAsPDF({ title, questions, grade: selectedGrade, subject: "General" }, `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
        toast.success("Assessment exported as PDF!");
    };

    const removeQuestion = (index: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    // 1. Play Mode (KBC)
    if (showPreview) {
        return <QuizPreview questions={questions} topic={topicId || 'General Intelligence'} onClose={() => setShowPreview(false)} />;
    }

    return (
        <div className="w-full px-6 py-12 animate-in fade-in duration-700">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
                <div className="text-left space-y-3">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
                        Quiz Synthesizer
                    </h1>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] italic">
                        High-Fidelity Interactive Assessment Engine
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100 mt-2">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Synthesis Protocol</span>
                    </div>
                </div>
            </div>

            <div className="w-full space-y-12">
                {/* 1. CONFIGURATION MATRIX */}
                <Card className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                    <CardContent className="p-10 space-y-10">
                        {/* ROW 1: PRIMARY TARGETING */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Grade Level</Label>
                                <Select value={selectedGrade} onValueChange={(v) => { setSelectedGrade(v); setSelectedSubject(""); setTopicId(""); }}>
                                    <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-xl">
                                        {[...Array(12)].map((_, i) => (
                                            <SelectItem key={i} value={(i + 1).toString()} className="font-bold text-xs">Grade {i + 1}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1 flex items-center gap-2">
                                    Subject Area
                                    {curriculumLoading && <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-400" />}
                                </Label>
                                <Select value={selectedSubject} onValueChange={(v) => { setSelectedSubject(v); setTopicId(""); }}>
                                    <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                                        <SelectValue placeholder="Choose Subject" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-xl">
                                        {curriculum?.subjects?.map((s: string) => (
                                            <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Topic Protocol</Label>
                                <Popover open={openTopic} onOpenChange={setOpenTopic}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full h-14 justify-between rounded-[1.2rem] border-slate-100 bg-white font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all" disabled={!selectedSubject}>
                                            {topicId || "Search Topic..."} <ChevronsUpDown className="h-4 w-4 opacity-40" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[320px] p-0" align="start">
                                        <Command className="rounded-xl">
                                            <CommandInput placeholder="Search topics…" />
                                            <CommandList>
                                                <CommandEmpty>
                                                    <div className="p-4 text-center">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Curriculum Match</p>
                                                        <p className="text-[8px] font-bold text-slate-400 mt-1">Type custom protocol below</p>
                                                    </div>
                                                </CommandEmpty>
                                                <CommandGroup heading="Curriculum Topics">
                                                    {availableTopics.map((t: string) => (
                                                        <CommandItem key={t} value={t} onSelect={() => { setTopicId(t); setOpenTopic(false); }} className="text-xs font-bold py-3">
                                                            <Check className={cn("mr-2 h-4 w-4", topicId === t ? "opacity-100" : "opacity-0")} />
                                                            {t}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                                                <input
                                                    className="w-full px-4 py-2 text-xs font-bold border rounded-xl bg-white focus:outline-none focus:ring-2 ring-indigo-500/10 transition-all"
                                                    placeholder="Custom Topic Protocol…"
                                                    value={topicId}
                                                    onChange={(e) => setTopicId(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === "Enter") setOpenTopic(false); }}
                                                />
                                            </div>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Assessment Intent</Label>
                                <Select value={questionType} onValueChange={setQuestionType}>
                                    <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-xl">
                                        <SelectItem value="MCQ" className="font-bold text-xs">Multiple Choice</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* ROW 2: ADVANCED PARAMETERS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Complexity Level</Label>
                                <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                                    <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-xl">
                                        <SelectItem value="Beginner" className="font-bold text-xs">Foundational</SelectItem>
                                        <SelectItem value="Intermediate" className="font-bold text-xs">Operational</SelectItem>
                                        <SelectItem value="Advanced" className="font-bold text-xs">Strategic</SelectItem>
                                        <SelectItem value="Mixed" className="font-bold text-xs">Matrix (Mixed)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Node Count</Label>
                                <Select value={numQuestions.toString()} onValueChange={(v) => setNumQuestions(parseInt(v))}>
                                    <SelectTrigger className="h-14 bg-indigo-50 border-indigo-100 rounded-[1.2rem] text-indigo-700 font-black text-xs px-6 shadow-sm hover:border-indigo-300 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-xl">
                                        {[5, 10, 15, 20].map((n) => (
                                            <SelectItem key={n} value={n.toString()} className="font-bold text-xs">{n} Questions</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex justify-between items-center mb-1">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Context Artifact</Label>
                                    {pdfText && <span className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Latched</span>}
                                </div>
                                <div className="flex gap-4">
                                    <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className={`flex-1 h-14 border-dashed rounded-[1.2rem] font-black uppercase tracking-widest text-[9px] transition-all gap-3 ${pdfText ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-white hover:border-indigo-300 hover:text-indigo-600'}`}
                                    >
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        {pdfText ? "Context Synchronized" : "Inject PDF Context"}
                                    </Button>
                                    {pdfText && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => setPdfText("")}
                                            className="h-14 w-14 rounded-[1.2rem] bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ACTION STRIP */}
                        <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                            <div className="hidden md:flex items-center gap-4 text-slate-300">
                                <Clock className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Est. Synthesis: 12-18s</span>
                            </div>
                            <Button
                                onClick={() => handleGenerate()}
                                disabled={generateMutation.isPending || !topicId}
                                className="h-16 px-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.2rem] shadow-2xl shadow-indigo-600/30 border-none font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-4 group"
                            >
                                {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-all" />}
                                {generateMutation.isPending ? "Synthesizing..." : "Initialize Synthesis"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. SYNTHESIS VIEWPORT - RESULTS BELOW */}
                <AnimatePresence mode="wait">
                    {questions.length > 0 ? (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            className="space-y-10 pb-20"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">System Ready</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Synthesis: {topicId}</h2>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-1">{questions.length} Intelligence Nodes Validated</p>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    <Button
                                        variant="outline"
                                        className="h-12 px-6 rounded-xl border-slate-700 bg-transparent text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-white hover:border-slate-500 transition-all"
                                        onClick={handleDownload}
                                    >
                                        <Download className="w-4 h-4 mr-2" /> Export PDF
                                    </Button>
                                    <Button
                                        className="h-12 px-6 rounded-xl bg-white text-slate-900 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all"
                                        onClick={() => setShowPreview(true)}
                                    >
                                        <Send className="w-4 h-4 mr-2" /> Simulation
                                    </Button>
                                    <Button
                                        onClick={() => saveMutation.mutate({ title: quizTitle || `Quiz: ${topicId}`, topicId, questions })}
                                        className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] border-none transition-all shadow-lg shadow-indigo-600/20"
                                        disabled={saveMutation.isPending}
                                    >
                                        {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                        Archive Protocol
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
                                {questions.map((q, idx) => (
                                    <Card key={idx} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group relative transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/50">
                                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" onClick={() => removeQuestion(idx)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <CardContent className="p-10 space-y-8">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-xs border border-indigo-100">
                                                        {idx + 1}
                                                    </div>
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Node Configuration</Label>
                                                </div>
                                                <Textarea
                                                    value={q.question}
                                                    onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                                                    className="font-black text-slate-900 bg-transparent border-none shadow-none focus-visible:ring-0 p-0 resize-none min-h-[60px] text-xl tracking-tight leading-snug placeholder:text-slate-200"
                                                    placeholder="Enter intelligence query..."
                                                />
                                            </div>

                                            {(q.type === 'MCQ' || !q.type) && q.options && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {q.options.map((opt: string, i: number) => (
                                                        <div key={i} className="flex items-center gap-4 group/opt">
                                                            <button
                                                                onClick={() => updateQuestion(idx, 'correctAnswer', opt)}
                                                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] border transition-all shrink-0 ${opt === q.correctAnswer ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-slate-50 text-slate-400 border-slate-200 group-hover/opt:border-indigo-200'}`}
                                                            >
                                                                {String.fromCharCode(65 + i)}
                                                            </button>
                                                            <Input
                                                                value={opt}
                                                                onChange={(e) => updateOption(idx, i, e.target.value)}
                                                                className={`h-12 bg-slate-50/50 border-slate-100 rounded-xl text-slate-900 font-bold text-xs focus:ring-indigo-500/10 transition-all ${opt === q.correctAnswer ? 'bg-white border-indigo-200 ring-4 ring-indigo-50' : 'hover:border-slate-200'}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        /* AWAITING PLACEHOLDER */
                        <motion.div
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-40 text-center"
                        >
                            <div className="relative mb-12 group">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full animate-pulse" />
                                <div className="relative w-32 h-32 rounded-[3.5rem] bg-indigo-600 flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">
                                    <Sparkles className="w-14 h-14 text-white" />
                                </div>
                            </div>
                            <h3 className="font-black text-4xl text-slate-900 tracking-tight uppercase leading-none">
                                Awaiting Synthesis Protocol
                            </h3>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-6 max-w-sm leading-loose opacity-60">
                                Configure the intelligence matrix above to initialize interactive quiz generation
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function QuizPreview({ questions, topic, onClose }: { questions: any[], topic: string, onClose: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);

    const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
    const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
    const [hintText, setHintText] = useState("");

    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const topRef = useRef<HTMLDivElement>(null);

    const currentQuestion = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;

    useEffect(() => {
        if (showResult || isLocked) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { clearInterval(timer); handleTimeUp(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [currentIndex, showResult, isLocked]);

    useEffect(() => {
        setIsLocked(false);
        setShowFeedback(false);
        setSelectedOption(null);
        setTimeLeft(30);
        setHiddenOptions([]);
        setHintText("");
        topRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentIndex]);

    const handleTimeUp = () => {
        setIsLocked(true);
        setShowFeedback(true);
        setTimeout(() => nextQuestion(), 2000);
    };

    const handleOptionSelect = (option: string) => {
        if (isLocked) return;
        setSelectedOption(option);
    };

    const submitAnswer = () => {
        if (!selectedOption || isLocked) return;
        setIsLocked(true);
        setTimeout(() => {
            const isCorrect = selectedOption === currentQuestion.correctAnswer;
            if (isCorrect) setScore(prev => prev + 1);
            setUserAnswers(prev => ({ ...prev, [currentIndex]: selectedOption }));
            setShowFeedback(true);
            setTimeout(() => nextQuestion(), 2000);
        }, 800);
    };

    const nextQuestion = () => {
        if (isLastQuestion) {
            generateAISuggestions();
            setShowResult(true);
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const useFiftyFifty = () => {
        if (fiftyFiftyUsed || isLocked) return;
        const correctIndex = currentQuestion.options.findIndex((opt: string) => opt === currentQuestion.correctAnswer);
        const wrongIndices = currentQuestion.options.map((_: any, idx: number) => idx).filter((idx: number) => idx !== correctIndex);
        const toHide = wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2);
        setHiddenOptions(toHide);
        setFiftyFiftyUsed(true);
    };

    const useHint = () => {
        if (hintText || isLocked) return;
        const hints = [
            "Use foundational reasoning: focus on the core subject logic.",
            "Analyzing topic nodes: The answer aligns with standard curriculum parameters.",
            "Eliminating static noise: Focus on the primary directive mentioned in the query.",
            "Data parity check: Recall the fundamental laws governing this intelligence layer."
        ];
        setHintText(hints[Math.floor(Math.random() * hints.length)]);
    };

    const generateAISuggestions = () => {
        const percentage = (score / questions.length) * 100;
        const suggestions = percentage >= 80
            ? [`Peak intelligence parity: ${score}/${questions.length} nodes verified.`, "Strengths: Perfect logic execution across complex queries.", "Command: Initiate Grade 11 advanced protocols."]
            : percentage >= 50
                ? [`Standard parity achieved: ${score}/${questions.length} nodes verified.`, "Weaknesses: Minority logic gaps in application layers.", "Command: Refine knowledge graph in Chapter 4."]
                : [`Critical failure: Only ${score}/${questions.length} nodes verified.`, "Weaknesses: Fundamental intelligence nodes disconnected.", "Command: Re-initiate baseline educational modules."];
        setAiSuggestions(suggestions);
    };

    if (showResult) {
        return (
            <div ref={topRef} className="max-w-4xl mx-auto py-12 animate-in fade-in zoom-in-95 duration-700">
                <Card className="bg-slate-950 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden relative min-h-[600px] flex flex-col justify-center ring-1 ring-white/5">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-600/10 via-transparent to-emerald-600/10 pointer-events-none opacity-50" />

                    <CardContent className="p-16 text-center relative z-10">
                        <div className="mb-12">
                            <h2 className="text-5xl font-black text-white tracking-tighter uppercase">Quiz Summary</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mt-4">Simulation Transmission Result</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                            {[
                                { label: 'Verification', val: `${score}/${questions.length}`, color: 'text-indigo-400' },
                                { label: 'Parity Rate', val: `${Math.round((score / questions.length) * 100)}%`, color: 'text-emerald-400' },
                                { label: 'Class Rank', val: 'Elite', color: 'text-violet-400' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">{stat.label}</div>
                                    <div className={`text-4xl font-black ${stat.color} tracking-tight`}>{stat.val}</div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 text-left relative overflow-hidden mb-12">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                            <h3 className="flex items-center gap-3 text-xl font-black text-white uppercase tracking-tight mb-8">
                                <Sparkles className="w-6 h-6 text-indigo-400" /> AI Quiz Report
                            </h3>
                            <ul className="space-y-6">
                                {aiSuggestions.map((suggestion, idx) => (
                                    <li key={idx} className="flex items-start gap-4 text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2.5 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                                        <span className="font-medium text-lg leading-relaxed">{suggestion}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex flex-wrap justify-center gap-6">
                            <Button
                                onClick={() => { setCurrentIndex(0); setUserAnswers({}); setScore(0); setFiftyFiftyUsed(false); setShowResult(false); }}
                                className="h-14 px-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-2xl shadow-indigo-600/20"
                            >
                                Re-Execute Simulation
                            </Button>
                            <Button
                                onClick={onClose}
                                variant="outline"
                                className="h-14 px-12 border-white/10 bg-white/5 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white/10"
                            >
                                Terminate Console
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div ref={topRef} className="fixed inset-0 z-[100] bg-slate-950 overflow-y-auto px-6 py-10 space-y-8 animate-in fade-in duration-500 custom-scrollbar">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Simulation Header */}
                <div className="flex items-center justify-between bg-slate-900/50 border border-white/10 p-6 rounded-[2rem] shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-6">
                        <Button variant="ghost" onClick={onClose} className="w-12 h-12 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 p-0">
                            <XIcon className="w-6 h-6" />
                        </Button>
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Target Node</div>
                            <div className="font-black text-white text-lg tracking-tight group-hover:text-indigo-400 transition-colors uppercase">{topic}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-12">
                        <div className="text-center">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Verification</div>
                            <div className="font-black text-2xl text-white tracking-tighter">{currentIndex + 1}<span className="text-slate-600 text-sm ml-1">/ {questions.length}</span></div>
                        </div>
                        <div className="text-center">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Parity</div>
                            <div className="font-black text-2xl text-emerald-400 tracking-tighter">{score}</div>
                        </div>
                    </div>
                </div>

                {/* Simulation Progress */}
                <div className="h-2 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                    <motion.div
                        className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(timeLeft / 30) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                    />
                </div>

                {/* Query Card */}
                <div className="flex-1 flex flex-col justify-center py-6">
                    <Card className="border border-white/10 bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden backdrop-blur-xl mb-10 ring-1 ring-white/5">
                        <CardContent className="p-16 text-center">
                            <h3 className="text-3xl font-black text-white leading-tight tracking-tight uppercase">
                                {currentQuestion.question}
                            </h3>
                        </CardContent>
                    </Card>

                    {/* AI Intervention */}
                    <AnimatePresence>
                        {hintText && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mb-10 max-w-2xl mx-auto w-full"
                            >
                                <div className="bg-indigo-600 rounded-[2rem] p-6 shadow-2xl shadow-indigo-600/30 border border-indigo-400/30 flex items-center gap-6 relative">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shrink-0 border border-white/20">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-indigo-100 opacity-70 mb-1">AI Recommendation</div>
                                        <p className="text-white font-black text-sm uppercase tracking-wider">{hintText}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setHintText("")} className="text-white/50 hover:text-white rounded-full">
                                        <XIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Option Nodes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentQuestion.options?.map((opt: string, i: number) => {
                            if (hiddenOptions.includes(i)) return <div key={i} className="invisible" />;
                            const isSelected = selectedOption === opt;
                            const isCorrect = opt === currentQuestion.correctAnswer;
                            const label = String.fromCharCode(65 + i);

                            let style = "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20";
                            let badgeStyle = "bg-slate-900 text-slate-500 border-white/10";

                            if (isLocked) {
                                if (showFeedback) {
                                    if (isCorrect) { style = "bg-emerald-600 border-emerald-500 text-white shadow-2xl shadow-emerald-600/30 scale-[1.02]"; badgeStyle = "bg-white/20 text-white border-white/20"; }
                                    else if (isSelected) { style = "bg-rose-600 border-rose-500 text-white shadow-2xl shadow-rose-600/30"; badgeStyle = "bg-white/20 text-white border-white/20"; }
                                    else { style = "bg-white/5 border-white/5 text-slate-700 opacity-30"; }
                                } else if (isSelected) {
                                    style = "bg-indigo-500 border-indigo-400 text-white shadow-2xl shadow-indigo-500/30 animate-pulse";
                                    badgeStyle = "bg-white/20 text-white border-white/20";
                                } else { style = "bg-white/5 border-white/5 text-slate-700 opacity-30"; }
                            } else if (isSelected) {
                                style = "bg-indigo-600/20 border-indigo-500/50 text-white ring-1 ring-indigo-500/50";
                                badgeStyle = "bg-indigo-600 text-white border-indigo-500";
                            }

                            return (
                                <button
                                    key={i}
                                    disabled={isLocked}
                                    onClick={() => handleOptionSelect(opt)}
                                    className={`group w-full text-left p-8 rounded-[2rem] font-black text-lg transition-all duration-300 flex items-center gap-6 border ${style} uppercase tracking-tight`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border transition-all ${badgeStyle}`}>
                                        {label}
                                    </div>
                                    <span className="leading-tight">{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sim Controls */}
                <div className="flex items-center justify-between pt-6">
                    <div className="flex gap-4">
                        <Button
                            disabled={fiftyFiftyUsed || isLocked}
                            onClick={useFiftyFifty}
                            variant="outline"
                            className={`h-14 px-8 border-white/10 bg-white/5 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all ${fiftyFiftyUsed ? 'opacity-30 grayscale' : 'hover:border-indigo-500/30 text-slate-400 hover:text-white hover:bg-indigo-600/10'}`}
                        >
                            <Zap className="w-4 h-4 mr-2" /> 50:50 Parity
                        </Button>
                        <Button
                            disabled={!!hintText || isLocked}
                            onClick={useHint}
                            variant="outline"
                            className={`h-14 px-8 border-white/10 bg-white/5 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all ${!!hintText ? 'opacity-30 grayscale' : 'hover:border-indigo-500/30 text-slate-400 hover:text-white hover:bg-indigo-600/10'}`}
                        >
                            <Target className="w-4 h-4 mr-2" /> Learning Hint
                        </Button>
                    </div>

                    {!isLocked && selectedOption && (
                        <Button
                            onClick={submitAnswer}
                            className="h-14 px-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-2xl shadow-indigo-600/40 animate-in zoom-in duration-300"
                        >
                            Lock Intelligence 🔒
                        </Button>
                    )}

                    {showFeedback && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="font-black text-xl uppercase tracking-widest"
                        >
                            {userAnswers[currentIndex] === currentQuestion.correctAnswer ? (
                                <span className="text-emerald-400">Parity Verified ✓</span>
                            ) : (
                                <span className="text-rose-400">Logic Error ✗</span>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

function XIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
    )
}
