import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Plus, 
    FileText, 
    Calendar, 
    Loader2, 
    ChevronRight, 
    Sparkles, 
    Download, 
    Printer, 
    Share2, 
    UserPlus, 
    Inbox, 
    CheckCircle2,
    Settings2,
    FileUp as FileUpIcon
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

/** 
 * ── RESILIENCE UTILITIES ──
 * Prevents .map() crashes on malformed AI data.
 */
function safeArray<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
}

function GradingInterface({ assignment }: { assignment: any }) {
    const queryClient = useQueryClient();
    const { data: submissions, isLoading } = useQuery({
        queryKey: ['submissions', assignment.id],
        queryFn: async () => {
            const res = await api.get(`/assignments/${assignment.id}/submissions`);
            return res.data?.data || res.data || [];
        }
    });

    const gradeMutation = useMutation({
        mutationFn: async ({ submissionId, grade, feedback }: any) => {
            const res = await api.post(`/assignments/submissions/${submissionId}/grade`, { grade, feedback });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Grade saved successfully");
            queryClient.invalidateQueries({ queryKey: ['submissions', assignment.id] });
        }
    });

    const handleSaveGrade = (submissionId: string, grade: string, feedback: string) => {
        gradeMutation.mutate({ submissionId, grade, feedback });
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
    }

    if (!submissions || submissions.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Inbox className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Submissions Yet</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2">
                    Students haven't submitted this assignment yet. Once they do, their work will appear here for grading.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <Button variant="outline" className="gap-2">
                        <UserPlus className="w-4 h-4" /> Add Mock Submission
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
                {submissions.map((sub: any) => (
                    <SubmissionCard key={sub.id} submission={sub} onSave={handleSaveGrade} maxScore={assignment.maxScore} />
                ))}
            </div>
        </div>
    );
}

function SubmissionCard({ submission, onSave, maxScore }: any) {
    const [grade, setGrade] = useState(submission.grade || "");
    const [feedback, setFeedback] = useState(submission.feedback || "");

    return (
        <Card className="border border-slate-200 bg-white rounded-3xl overflow-hidden shadow-sm hover:border-indigo-500 transition-all">
            <div className="flex flex-col md:flex-row">
                <div className="p-8 flex-1 space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 border border-slate-100 shadow-sm">
                            <AvatarImage src={submission.student?.user?.avatar} />
                            <AvatarFallback className="bg-slate-50 text-slate-400 font-black text-xs">
                                {submission.student?.user?.name?.substring(0, 2).toUpperCase() || "ST"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="font-black text-slate-900 text-base tracking-tight">{submission.student?.user?.name || "Student Entity"}</h4>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Submitted {new Date(submission.submittedAt).toLocaleDateString()}</p>
                        </div>
                        {submission.status === 'LATE' && (
                            <span className="bg-rose-50 text-rose-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-rose-100 ml-auto">Late Entry</span>
                        )}
                    </div>

                    <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                        <p className="text-slate-600 leading-relaxed text-sm font-medium">
                            {submission.content || "No textual data provided."}
                        </p>
                        {submission.attachments && submission.attachments.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {submission.attachments.map((att: string, i: number) => (
                                    <a key={i} href={att} target="_blank" rel="noreferrer" className="text-[9px] flex items-center gap-2 text-indigo-600 font-black uppercase tracking-widest bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
                                        <FileText className="w-3 h-3" /> Artifact {i + 1}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 w-full md:w-80 bg-slate-50 border-l border-slate-100 flex flex-col gap-6">
                    <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1">Assessment Score</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                className="font-black text-xl h-12 bg-white border-slate-200 rounded-xl text-slate-900 text-center focus:ring-indigo-500/20"
                                placeholder="0"
                            />
                            <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">/ {maxScore || 100}</span>
                        </div>
                    </div>
 
                    <div className="flex-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1">Critical Feedback</Label>
                        <Textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="bg-white border-slate-200 min-h-[100px] rounded-xl text-slate-900 font-medium text-sm resize-none focus:ring-indigo-500/20 p-4"
                            placeholder="Synthesize feedback..."
                        />
                    </div>

                    <Button onClick={() => onSave(submission.id, grade, feedback)} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-indigo-600/10 border-none transition-all">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                        Finalize Assessment
                    </Button>
                </div>
            </div>
        </Card>
    );
}

export function AssignmentsTab() {
    return (
        <div className="w-full px-6 py-12 animate-in fade-in duration-700">
            <Tabs defaultValue="generator" className="w-full space-y-12">
                {/* SaaS Header Alignment - LEFT JUSTIFIED (MATCHING EXAM BUILDER) */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
                    <div className="text-left space-y-3">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
                            Assignment Vault
                        </h1>
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] italic">
                            Institutional Student Production & Deployment Pipeline
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100 mt-2">
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Synthesis Protocol</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <TabsList className="inline-flex h-12 bg-white p-1 rounded-[1.2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
                            <TabsTrigger value="generator" className="px-8 rounded-[1rem] font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-slate-400 flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5" />
                                Synthesis
                            </TabsTrigger>
                            <TabsTrigger value="list" className="px-8 rounded-[1rem] font-black uppercase tracking-widest text-[9px] data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all text-slate-400">Deployment Grid</TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                <TabsContent value="generator" className="mt-0 outline-none">
                    <AssignmentGenerator />
                </TabsContent>

                <TabsContent value="list" className="mt-0 outline-none">
                    <AssignmentsList />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function AssignmentGenerator() {
    const [selectedBoard, setSelectedBoard] = useState("CBSE");
    const [selectedGrade, setSelectedGrade] = useState("10");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [topicId, setTopicId] = useState("");
    const [openTopic, setOpenTopic] = useState(false);
    const [assignmentType, setAssignmentType] = useState("Homework");
    const [difficulty, setDifficulty] = useState("Medium");
    const [numQuestions, setNumQuestions] = useState("10");
    const [detailLevel, setDetailLevel] = useState([50]);
    const [pdfText, setPdfText] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: metadata } = useQuery({
        queryKey: ['curriculum-metadata', selectedBoard, selectedGrade],
        queryFn: async () => {
            const res = await api.get(`/curriculum/metadata?curriculum=${selectedBoard}&class=${selectedGrade}`);
            return res.data;
        }
    });

    const subjectsList = metadata?.topics ? Object.keys(metadata.topics) : [];
    const topicsList = (selectedSubject && metadata?.topics?.[selectedSubject]) || [];

    const generateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/assignments/generate', { ...data, pdfText });
            return res;
        },
        onSuccess: (res) => {
            if (res.success) {
                setGeneratedContent(res.data);
                toast.success("Assignment synthesized successfully!");
            } else {
                toast.error(res.error || "Failed to generate assignment");
            }
        }
    });

    const handleGenerate = (textOverride?: string) => {
        if (!topicId) {
            toast.error("Please select a topic.");
            return;
        }

        generateMutation.mutate({
            topic: topicId,
            subject: selectedSubject || "General",
            grade: selectedGrade,
            curriculum: selectedBoard,
            assignmentType,
            difficultyLevel: difficulty,
            numQuestions: parseInt(numQuestions),
            detailLevel: detailLevel[0],
            pdfText: textOverride !== undefined ? textOverride : pdfText
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            toast.error("Artifact exceeds 50MB limit.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        setIsUploading(true);
        const loadingToast = toast.loading(`Transmitting artifact...`);

        try {
            const res = await api.post('/upload/pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.success) {
                setPdfText(res.data.text);
                toast.success(`Context inherited: ${file.name}`, { id: loadingToast });
                if (topicId) handleGenerate(res.data.text);
            } else {
                toast.error(res.error || "Extraction failed.", { id: loadingToast });
            }
        } catch (err: any) {
            toast.error("Network failure.", { id: loadingToast });
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDownload = () => {
        if (!generatedContent) return;
        const title = generatedContent.title || "Assignment";
        downloadAsPDF({
            ...generatedContent,
            subject: selectedSubject,
            grade: `Grade ${selectedGrade}`,
            curriculum: selectedBoard,
            duration: "N/A"
        }, `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
        toast.success("Assignment exported!");
    };

    return (
        <div className="space-y-12">
            {/* 1. CONFIGURATION MATRIX - HORIZONTAL TOP FLOW */}
            <Card className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                <CardContent className="p-10 space-y-10">
                    {/* ROW 1: PRIMARY TARGETING */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Grade Level</Label>
                            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
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

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Subject Area</Label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 rounded-xl">
                                    {subjectsList.map(s => (
                                        <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Curriculum</Label>
                            <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                                <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 rounded-xl">
                                    {["CBSE", "ICSE", "IGCSE", "IB"].map(b => (
                                        <SelectItem key={b} value={b} className="font-bold text-xs">{b}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Target Topic</Label>
                            <Popover open={openTopic} onOpenChange={setOpenTopic}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full h-14 justify-between rounded-[1.2rem] border-slate-100 bg-white font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all disabled:opacity-50" disabled={!selectedSubject}>
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
                                                {topicsList.map((t: string) => (
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
                    </div>

                    {/* ROW 2: PEDAGOGICAL PARAMETERS — 4-col clean grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Mission Format</Label>
                            <Select value={assignmentType} onValueChange={setAssignmentType}>
                                <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 rounded-xl">
                                    <SelectItem value="Homework" className="font-bold text-xs">Homework</SelectItem>
                                    <SelectItem value="Worksheet" className="font-bold text-xs">Worksheet</SelectItem>
                                    <SelectItem value="Project" className="font-bold text-xs">Project</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Complexity</Label>
                            <Select value={difficulty} onValueChange={setDifficulty}>
                                <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 rounded-xl">
                                    <SelectItem value="Easy" className="font-bold text-xs">Fundamental</SelectItem>
                                    <SelectItem value="Medium" className="font-bold text-xs">Standard</SelectItem>
                                    <SelectItem value="Hard" className="font-bold text-xs">Elite</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Question Count</Label>
                            <Select value={numQuestions} onValueChange={setNumQuestions}>
                                <SelectTrigger className="h-14 bg-indigo-50 border-indigo-100 rounded-[1.2rem] text-indigo-700 font-black text-xs px-6 shadow-sm hover:border-indigo-300 transition-all">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 rounded-xl">
                                    {["5", "10", "15", "20", "25", "30"].map((n) => (
                                        <SelectItem key={n} value={n} className="font-bold text-xs">{n} Questions</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Intel Depth</Label>
                                <span className="text-[10px] font-black text-indigo-500">{detailLevel[0]}%</span>
                            </div>
                            <div className="h-14 flex items-center px-6 bg-slate-50/50 rounded-[1.2rem] border border-slate-100 shadow-inner">
                                <Slider value={detailLevel} onValueChange={setDetailLevel} max={100} step={5} className="w-full" />
                            </div>
                        </div>
                    </div>

                    {/* ROW 3: ACTION STRIP — full width, no clipping */}
                    <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Left: Context upload */}
                        <div className="flex items-center gap-5">
                            <div className="w-11 h-11 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center shrink-0">
                                <FileUpIcon className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Context Injection</h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">Synchronize with reference PDF</p>
                            </div>
                            <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                            <Button
                                variant="ghost"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className={`h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center gap-2 ${
                                    pdfText
                                        ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                                        : "text-slate-500 hover:bg-slate-50"
                                }`}
                            >
                                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileUpIcon className="w-3 h-3" />}
                                {pdfText ? "Context Latched" : "Attach PDF"}
                            </Button>
                        </div>

                        {/* Right: Primary CTA */}
                        <Button
                            onClick={() => handleGenerate()}
                            disabled={generateMutation.isPending || !topicId}
                            className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.2rem] shadow-xl shadow-indigo-600/20 border-none font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 group shrink-0"
                        >
                            {generateMutation.isPending
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            }
                            {generateMutation.isPending ? "Synthesizing..." : "Initialize Synthesis"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 2. SYNTHESIS VIEWPORT - FULL WIDTH BELOW */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {generatedContent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-12"
                        >
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                        <FileText className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase">{generatedContent.title}</h3>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{assignmentType} Mission</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">{difficulty} Intensity</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button 
                                        variant="outline"
                                        className="h-14 px-8 bg-transparent border-slate-700 text-slate-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:text-white hover:border-slate-500 transition-all gap-3"
                                    >
                                        <Printer className="w-5 h-5" />
                                    </Button>
                                    <Button 
                                        onClick={handleDownload}
                                        className="h-14 px-10 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-500 transition-all gap-3 border-none shadow-xl shadow-indigo-600/20"
                                    >
                                        <Download className="w-5 h-5" /> Compile & Export PDF
                                    </Button>
                                </div>
                            </div>

                            {/* Document Preview - "Sheet of Paper" Aesthetic */}
                            <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-sm p-16 md:p-24 min-h-[1000px] relative font-serif">
                                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
                                
                                <div className="space-y-16">
                                    <div className="text-center space-y-6 pb-12 border-b border-slate-100">
                                        <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-slate-900 font-sans">{generatedContent.title}</h1>
                                        <div className="flex justify-center items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-sans">
                                            <span>Subject: {selectedSubject}</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                                            <span>Class {selectedGrade}</span>
                                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                                            <span>Marks: 25</span>
                                        </div>
                                    </div>

                                    {/* Mission Guidelines */}
                                    <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 font-sans">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-2">
                                            <Settings2 className="w-4 h-4" /> Tactical Instructions
                                        </h4>
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                                            {generatedContent.instructions}
                                        </p>
                                    </div>

                                    {/* Assessment Sections */}
                                    <div className="space-y-16">
                                        {/* MCQs */}
                                        {safeArray(generatedContent.mcqs).length > 0 && (
                                            <div className="space-y-10">
                                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100 pb-4 font-sans">Section A: Objective Discovery</h3>
                                                <div className="space-y-10">
                                                    {safeArray(generatedContent.mcqs).map((q: any, i: number) => (
                                                        <div key={i} className="space-y-6">
                                                            <div className="flex gap-4">
                                                                <span className="font-black text-slate-900 min-w-[1.5rem] font-sans">Q{i + 1}.</span>
                                                                <p className="text-lg text-slate-800 leading-snug font-serif font-medium">{q.question}</p>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-x-12 gap-y-4 pl-10 font-sans">
                                                                {safeArray(q.options).map((opt: string, optIdx: number) => (
                                                                    <div key={optIdx} className="text-sm text-slate-600 flex items-center gap-3">
                                                                        <span className="text-[10px] font-black text-slate-300">({String.fromCharCode(97 + optIdx)})</span>
                                                                        <span className="font-bold">{opt}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Subjective */}
                                        {safeArray(generatedContent.assignmentQuestions).length > 0 && (
                                            <div className="space-y-10">
                                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100 pb-4 font-sans">Section B: Critical Analysis</h3>
                                                <div className="space-y-8">
                                                    {safeArray(generatedContent.assignmentQuestions).map((q: string, i: number) => (
                                                        <div key={i} className="flex gap-4 items-start">
                                                            <span className="font-black text-slate-900 min-w-[1.5rem] font-sans">Q{i + 1}.</span>
                                                            <p className="text-lg text-slate-800 leading-relaxed font-serif font-medium">{q}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Practical/Activity */}
                                        {safeArray(generatedContent.activityQuestions).length > 0 && (
                                            <div className="space-y-10">
                                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100 pb-4 font-sans">Section C: Tactical Execution</h3>
                                                <div className="space-y-8">
                                                    {safeArray(generatedContent.activityQuestions).map((q: string, i: number) => (
                                                        <div key={i} className="flex gap-4 items-start p-8 bg-slate-50/50 rounded-3xl border border-slate-100/50">
                                                            <span className="font-black text-indigo-400 min-w-[1.5rem] font-sans">ACT {i + 1}.</span>
                                                            <p className="text-lg text-slate-800 leading-relaxed font-serif font-medium italic">{q}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Institutional Footer */}
                                    <div className="pt-24 text-center">
                                        <div className="w-16 h-1 bg-slate-100 mx-auto mb-8" />
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.8em] font-sans">
                                            Institutional Synthesis Protocol • v4.0
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 text-center">
                            <div className="relative mb-12 group">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full" />
                                <div className="relative w-40 h-40 rounded-[4rem] bg-white border border-slate-100 flex items-center justify-center shadow-xl mx-auto group hover:rotate-6 transition-all duration-700">
                                    <Sparkles className="w-16 h-16 text-slate-200 group-hover:text-indigo-600 transition-colors duration-500" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-black text-4xl text-slate-900 tracking-tight uppercase">Awaiting Protocol</h3>
                                <p className="text-[11px] font-black text-slate-400 leading-relaxed uppercase tracking-[0.4em] max-w-xs mx-auto">
                                    Execute the configuration matrix above to begin artifact synthesis
                                </p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function AssignmentsList() {
    const [gradingAssignment, setGradingAssignment] = useState<any>(null);

    const { data: assignments, isLoading } = useQuery({
        queryKey: ['assignments'],
        queryFn: async () => {
            const res = await api.get('/assignments');
            return res.data?.data || res.data || [];
        }
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                        <p className="font-black uppercase tracking-[0.2em] text-[9px]">Syncing Deployment Grid...</p>
                    </div>
                ) : safeArray(assignments).length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                        <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Grid Empty</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mt-1">Initialize assignments via AI synthesis</p>
                    </div>
                ) : safeArray(assignments).map((asn: any) => (
                    <Card key={asn.id} className="border border-slate-200 shadow-xl shadow-slate-200/40 bg-white hover:border-indigo-500 hover:-translate-y-2 transition-all duration-500 rounded-[2.5rem] overflow-hidden group">
                        <CardContent className="p-10">
                            <div className="flex items-start justify-between mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                    <FileText className="w-7 h-7" />
                                </div>
                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100 uppercase tracking-widest">
                                    {asn.subject?.name || 'Academic'}
                                </span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{asn.title}</h3>
                            <p className="text-sm text-slate-500 mb-10 line-clamp-2 font-medium leading-relaxed italic">{asn.description}</p>

                            <div className="flex items-center justify-between pt-8 border-t border-slate-100">
                                <div className="flex items-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                                    Due: {asn.dueDate ? new Date(asn.dueDate).toLocaleDateString() : 'N/A'}
                                </div>
                                <Button
                                    onClick={() => setGradingAssignment(asn)}
                                    className="h-12 px-8 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    Assess Production <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Grading Dialog */}
            <Dialog open={!!gradingAssignment} onOpenChange={(open) => !open && setGradingAssignment(null)}>
                <DialogContent className="max-w-6xl max-h-[90vh] bg-white border-none p-0 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
                    <DialogHeader className="p-10 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">Assessment Console</DialogTitle>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Evaluating Production Artifact: {gradingAssignment?.title}</p>
                            </div>
                            <span className="text-[10px] font-black text-indigo-600 bg-white px-6 py-3 rounded-full border border-slate-200 shadow-sm uppercase tracking-[0.2em]">{gradingAssignment?.subject?.name || 'Academic'} Protocol</span>
                        </div>
                    </DialogHeader>
                    <div className="p-10 overflow-y-auto flex-1">
                        {gradingAssignment && <GradingInterface assignment={gradingAssignment} />}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
