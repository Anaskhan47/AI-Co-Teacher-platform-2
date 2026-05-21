import React, { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Share2, Plus, Sparkles, Wand2, Layers, Presentation, BookOpen, GraduationCap, Clock, Upload, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
import pptxgen from "pptxgenjs";

export function PPTGeneratorTab() {
    const [searchParams] = useSearchParams();
    
    const [topic, setTopic] = useState(searchParams.get("topic") || '');
    const [grade, setGrade] = useState(searchParams.get("grade") || '');
    const [numSlides, setNumSlides] = useState('5');
    const [curriculum, setCurriculum] = useState(searchParams.get("board") || 'CBSE');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPPT, setGeneratedPPT] = useState<any>(null);
    const [pdfText, setPdfText] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [openTopic, setOpenTopic] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [subject, setSubject] = useState(searchParams.get("subject") || '');
    const [duration, setDuration] = useState('45');
    const [unitDetails, setUnitDetails] = useState('');
    const [detailLevel, setDetailLevel] = useState([50]);

    const MASTER_TOPICS: Record<string, string[]> = {
        "Mathematics": ["Numbers", "Fractions", "Decimals", "Algebra", "Linear Equations", "Geometry", "Mensuration", "Trigonometry", "Probability", "Statistics"],
        "Physics": ["Motion", "Laws of Motion", "Work and Energy", "Sound", "Light", "Electricity", "Magnetic Effects"],
        "Chemistry": ["Atoms and Molecules", "Chemical Reactions", "Acids, Bases, Salts", "Carbon Compounds", "Periodic Table"],
        "Biology": ["Cell Structure", "Tissues", "Nutrition", "Respiration", "Reproduction", "Heredity", "Environment"],
        "English Literature": ["Nouns", "Pronouns", "Verbs", "Adjectives", "Tenses", "Articles", "Reading Comprehension", "Writing Skills", "Letter Writing", "Story Writing"],
        "History": ["Civilizations", "Revolutions", "Nationalism", "World Wars", "Freedom Struggle"],
        "Geography": ["Climate", "Resources", "Agriculture", "Minerals", "Manufacturing"],
        "Economics": ["Poverty", "Development", "Markets", "Money and Credit", "Consumer Rights"],
        "Computer Science": ["Computer Basics", "Hardware and Software", "Programming Basics", "Internet Safety", "Data Structures", "Algorithms"]
    };

    const availableTopics = subject ? (MASTER_TOPICS[subject] || []) : [];

    const handleGenerate = async (textOverride?: string) => {
        if (!topic || !grade || !curriculum || !subject) {
            toast.error("Please fill in all required fields (Topic, Subject, Grade, Curriculum).");
            return;
        }

        setIsGenerating(true);
        const loadingToast = toast.loading("Synthesizing educational intelligence...");

        try {
            const res = await api.post('/materials/generate-ppt', {
                topic, grade, curriculum, subject, duration, unitDetails,
                detailLevel: detailLevel[0],
                slideCount: parseInt(numSlides),
                pdfText: textOverride || pdfText
            });

            if (res.success) {
                setGeneratedPPT(res.data);
                toast.success("Presentation synthesized successfully!", { id: loadingToast });
            } else {
                toast.error(res.error || "Synthesis failed.", { id: loadingToast });
            }
        } catch (err: any) {
            toast.error("Network failure during synthesis.", { id: loadingToast });
        } finally {
            setIsGenerating(false);
        }
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
                if (topic && grade && curriculum) handleGenerate(res.data.text);
            } else {
                toast.error(res.error || "Extraction failed.", { id: loadingToast });
            }
        } catch (err: any) {
            toast.error("Network failure during transmission.", { id: loadingToast });
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleDownload = async () => {
        if (!generatedPPT) return;

        const pres = new pptxgen();
        pres.title = topic;
        pres.layout = 'LAYOUT_16x9';

        generatedPPT.slides.forEach((slide: any, idx: number) => {
            const pptSlide = pres.addSlide();
            pptSlide.background = { color: '0F172A' };

            if (slide.layout === 'organic_title') {
                // Title Slide Alignment
                pptSlide.addText(slide.title, { 
                    x: 0, y: 1.8, w: '100%', h: 1.5, fontSize: 54, bold: true, color: 'FFFFFF', align: 'center', transform: { uppercase: true }
                });
                pptSlide.addShape(pres.ShapeType.rect, { x: 4, y: 3.5, w: 2, h: 0.1, fill: { color: '6366F1' } });
                pptSlide.addText(slide.subtitle_1 || "Institutional Protocol", { x: 0, y: 3.8, w: '100%', fontSize: 16, color: '818CF8', align: 'center', bold: true, transform: { uppercase: true } });
                pptSlide.addText(slide.subtitle_2 || `Pedagogical Synthesis`, { x: 0, y: 4.2, w: '100%', fontSize: 12, color: '64748B', align: 'center' });
            } else {
                // Content Slide Alignment - Adaptive Grid Logic for PPTX
                pptSlide.addText(slide.title, { x: 0.5, y: 0.4, w: '90%', fontSize: 28, bold: true, color: 'FFFFFF', transform: { uppercase: true } });
                pptSlide.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.0, w: 1, h: 0.05, fill: { color: '6366F1' } });
                
                const points = slide.content || [];
                const isDual = points.length > 4;
                
                points.forEach((point: string, i: number) => {
                    // Split points into two columns if in dual mode
                    const isRightCol = isDual && i >= points.length / 2;
                    const colIdx = isRightCol ? i - Math.ceil(points.length / 2) : i;
                    
                    const xBase = isRightCol ? 5.2 : 0.5;
                    const yPos = 1.4 + (colIdx * 0.9);
                    
                    pptSlide.addShape(pres.ShapeType.rect, { x: xBase, y: yPos + 0.05, w: 0.2, h: 0.2, fill: { color: '1E293B' } });
                    pptSlide.addText(`${i + 1}`, { x: xBase, y: yPos + 0.05, w: 0.2, h: 0.2, fontSize: 8, color: '6366F1', align: 'center', bold: true });
                    pptSlide.addText(`${point}`, { x: xBase + 0.35, y: yPos, w: isDual ? '40%' : '85%', fontSize: isDual ? 11 : 13, color: 'CBD5E1', align: 'left', lineSpacing: 20 });
                });
                
                // Footer Page Number
                pptSlide.addText(`${idx + 1}`, { x: 9.3, y: 5.3, w: 0.5, fontSize: 10, color: '334155', align: 'center' });
            }
        });

        pres.writeFile({ fileName: `${topic.replace(/\s+/g, '_')}_Synthesized_Artifact.pptx` })
            .then(() => toast.success("PowerPoint compiled & exported!"))
            .catch(() => toast.error("Compilation failed."));
    };

    return (
        <div className="max-w-6xl mx-auto px-6 py-12 animate-in fade-in duration-700">
            {/* SaaS Header Alignment */}
            <div className="text-center mb-16 space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Institutional Visual Engine</span>
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">Presentation Synthesis</h1>
                <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] italic">Autonomous Pedagogical Orchestration Protocol</p>
            </div>

            <div className="space-y-12">
                {/* 1. CONFIGURATION MATRIX - VERTICAL TOP FLOW */}
                <Card className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
                    <CardContent className="p-8 space-y-10">
                        {/* ROW 1: PRIMARY TARGETING (4 COLS) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Presentation Topic</Label>
                                <Popover open={openTopic} onOpenChange={setOpenTopic}>
                                    <PopoverTrigger asChild>
                                        <Button 
                                            variant="outline" 
                                            role="combobox"
                                            aria-expanded={openTopic}
                                            className="w-full h-14 justify-between bg-slate-50 border-slate-200 rounded-2xl text-slate-900 font-bold text-xs px-4"
                                        >
                                            {topic || "Search or type topic..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0 bg-white border-slate-200">
                                        <Command className="bg-white">
                                            <CommandInput placeholder="Search curriculum topics..." className="h-10 text-xs font-bold" />
                                            <CommandList>
                                                <CommandEmpty>
                                                    <div className="p-3 text-[10px] font-bold text-slate-400 italic">No curriculum match. Type to add custom topic.</div>
                                                </CommandEmpty>
                                                {availableTopics.length > 0 && (
                                                    <CommandGroup heading="Suggested Topics" className="text-slate-400 font-black uppercase text-[8px] tracking-widest">
                                                        {availableTopics.map((t) => (
                                                            <CommandItem
                                                                key={t}
                                                                value={t}
                                                                onSelect={(currentValue) => {
                                                                    setTopic(currentValue);
                                                                    setOpenTopic(false);
                                                                }}
                                                                className="text-xs font-bold text-slate-900 hover:bg-slate-50"
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4 text-indigo-600", topic === t ? "opacity-100" : "opacity-0")} />
                                                                {t}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                )}
                                            </CommandList>
                                            <div className="p-3 border-t border-slate-100">
                                                <input
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 ring-indigo-500/10"
                                                    placeholder="Enter custom topic..."
                                                    value={topic}
                                                    onChange={(e) => setTopic(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') setOpenTopic(false); }}
                                                />
                                            </div>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Subject Area</Label>
                                <Select value={subject} onValueChange={setSubject}>
                                    <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 font-bold text-xs">
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                                        {["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English Literature", "History", "Geography", "Economics", "Business Studies", "Social Science", "Environmental Science"].map(sub => (
                                            <SelectItem key={sub} value={sub} className="font-bold text-xs">{sub}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Curriculum</Label>
                                <Select value={curriculum} onValueChange={setCurriculum}>
                                    <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 font-bold text-xs">
                                        <SelectValue placeholder="Select Board" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                                        <SelectItem value="cbse" className="font-bold text-xs">CBSE</SelectItem>
                                        <SelectItem value="icse" className="font-bold text-xs">ICSE</SelectItem>
                                        <SelectItem value="igcse" className="font-bold text-xs">IGCSE</SelectItem>
                                        <SelectItem value="ib" className="font-bold text-xs">IB</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Grade Level</Label>
                                <Select value={grade} onValueChange={setGrade}>
                                    <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 font-bold text-xs">
                                        <SelectValue placeholder="Select Grade" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                                        {[6, 7, 8, 9, 10, 11, 12].map(g => (
                                            <SelectItem key={g} value={g.toString()} className="font-bold text-xs">Grade {g}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* ROW 2: ADVANCED PARAMETERS */}
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px_250px] gap-8 items-end">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Specific Instructions & Pedagogy</Label>
                                <textarea
                                    value={unitDetails}
                                    onChange={(e) => setUnitDetails(e.target.value)}
                                    placeholder="Add specific requirements for slide content, tone, or activities..."
                                    className="w-full min-h-[140px] bg-slate-50 border-slate-200 rounded-3xl text-slate-900 font-bold text-xs p-5 focus:ring-indigo-500/20 focus:outline-none resize-none"
                                />
                            </div>
                            
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Slide Count</Label>
                                    <Select value={numSlides} onValueChange={setNumSlides}>
                                        <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 font-bold text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                                            <SelectItem value="3" className="font-bold text-xs">3 Slides (Summary)</SelectItem>
                                            <SelectItem value="5" className="font-bold text-xs">5 Slides (Standard)</SelectItem>
                                            <SelectItem value="8" className="font-bold text-xs">8 Slides (Detailed)</SelectItem>
                                            <SelectItem value="12" className="font-bold text-xs">12 Slides (Elite)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                                <Button 
                                    variant="outline" 
                                    className={`w-full h-14 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all ${pdfText ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-500'}`}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                    {pdfText ? 'Neural Context Latched' : 'Inject Context (PDF)'}
                                </Button>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Synthesis Depth</Label>
                                    <div className="h-14 flex flex-col justify-center px-5 bg-slate-50 rounded-2xl border border-slate-200">
                                        <input 
                                            type="range" 
                                            min="0" max="100" 
                                            value={detailLevel[0]} 
                                            onChange={(e) => setDetailLevel([parseInt(e.target.value)])}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <div className="flex justify-between mt-1.5">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Essential</span>
                                            <span className="text-[8px] font-black text-indigo-600 uppercase">{detailLevel[0]}%</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Extensive</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleGenerate()}
                                    disabled={isGenerating}
                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-indigo-600/20 border-none transition-all gap-3 flex items-center justify-center group"
                                >
                                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                                    {isGenerating ? "Synthesizing..." : "Initialize Synthesis"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. SYNTHESIS VIEWPORT - FULL WIDTH BELOW */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {generatedPPT ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-12"
                            >
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                            <Presentation className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight uppercase">{generatedPPT.title}</h3>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Class {grade} Readiness</span>
                                                <div className="w-1 h-1 rounded-full bg-slate-700" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">{generatedPPT.slides.length} Tactical Slides</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={handleDownload}
                                        className="h-14 px-10 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-500 transition-all gap-3 border-none shadow-xl shadow-indigo-600/20"
                                    >
                                        <Download className="w-5 h-5" /> Compile & Export .PPTX
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 gap-16">
                                    {generatedPPT.slides.map((slide: any, idx: number) => (
                                        <div key={idx} className="space-y-8 group max-w-5xl mx-auto w-full">
                                            <div className="flex items-center gap-8">
                                                <span className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-300">Section 0{idx + 1}</span>
                                                <div className="h-px flex-1 bg-slate-100" />
                                                <div className="flex gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-slate-100" />
                                                    <div className="w-2 h-2 rounded-full bg-slate-100" />
                                                </div>
                                            </div>
                                            <div className="bg-slate-950 rounded-[3.5rem] overflow-hidden aspect-video shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] flex flex-col relative border border-slate-900 group/slide transition-all duration-700 hover:shadow-indigo-500/10">
                                                <div className="absolute inset-0 z-0">
                                                    <img src={slide.image || "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000"} alt="Background" className="w-full h-full object-cover opacity-20 grayscale-[0.5] group-hover/slide:scale-105 group-hover/slide:grayscale-0 transition-all duration-[10s]" />
                                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/80 to-transparent" />
                                                </div>

                                                <div className="relative z-10 flex flex-col h-full p-12 md:p-16">
                                                    {slide.layout === 'organic_title' ? (
                                                        <div className="flex flex-col items-center justify-center flex-1 text-center">
                                                            <div className="mb-10 p-2 bg-indigo-500/10 backdrop-blur-xl rounded-full border border-indigo-500/20">
                                                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 px-8 py-2.5 block">{slide.tag || "Strategic Entry"}</span>
                                                            </div>
                                                            <h2 className={cn(
                                                                "font-black text-white leading-[1.1] uppercase mb-10 tracking-tighter max-w-4xl transition-all duration-500",
                                                                slide.title.length > 60 ? "text-3xl md:text-5xl" : slide.title.length > 30 ? "text-4xl md:text-6xl" : "text-5xl md:text-7xl"
                                                            )}>
                                                                {slide.title}
                                                            </h2>
                                                            <div className="w-32 h-1 bg-indigo-500 rounded-full mb-12 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
                                                            <div className="space-y-3">
                                                                <p className="text-xs font-black uppercase tracking-[0.5em] text-indigo-300 opacity-60">{slide.subtitle_1}</p>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">{slide.subtitle_2}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col h-full">
                                                            <div className="mb-8 flex justify-between items-start shrink-0">
                                                                <div>
                                                                    <div className="flex items-center gap-3 mb-3">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                                                                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-indigo-400">
                                                                            {slide.tag || "Technical Analysis"}
                                                                        </span>
                                                                    </div>
                                                                    <h2 className={cn(
                                                                        "font-black text-white uppercase leading-[1.1] tracking-tight max-w-3xl",
                                                                        slide.title.length > 60 ? "text-lg md:text-xl" : "text-xl md:text-3xl"
                                                                    )}>
                                                                        {slide.title}
                                                                    </h2>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* ADAPTIVE CONTENT MATRIX - DYNAMIC SCALING ENGINE */}
                                                            <div className="flex-1 overflow-hidden">
                                                                <div className={cn(
                                                                    "grid gap-x-12 gap-y-6 h-full items-start",
                                                                    (slide.content || []).length > 3 ? "grid-cols-2 content-start" : "grid-cols-1 justify-center"
                                                                )}>
                                                                    {(slide.content || []).map((point: string, i: number) => (
                                                                        <div key={i} className="flex gap-5 items-start group/point">
                                                                            <div className="shrink-0 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-[10px] text-indigo-400 shadow-sm group-hover/point:bg-indigo-500 group-hover/point:text-white transition-all duration-500">
                                                                                {i + 1}
                                                                            </div>
                                                                            <div className="pt-1 flex-1">
                                                                                <p className={cn(
                                                                                    "text-slate-400 font-bold leading-relaxed group-hover/point:text-white transition-all duration-500",
                                                                                    point.length > 150 ? "text-[9px] md:text-[10px]" : point.length > 100 ? "text-[10px] md:text-xs" : "text-xs md:text-sm"
                                                                                )}>
                                                                                    {point}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* INSTITUTIONAL FOOTER */}
                                                            <div className="pt-6 mt-auto border-t border-white/5 flex justify-between items-center shrink-0">
                                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-700">Institutional Synthesis Protocol v4.0</span>
                                                                <span className="text-[10px] font-black text-slate-500">Slide {idx + 1}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex items-center justify-center py-40">
                                <div className="text-center space-y-10 max-w-md mx-auto">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full" />
                                        <div className="relative w-40 h-40 rounded-[4rem] bg-white border border-slate-100 flex items-center justify-center shadow-xl mx-auto group hover:rotate-6 transition-all duration-700">
                                            <Presentation className="w-16 h-16 text-slate-200 group-hover:text-indigo-600 transition-colors duration-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-black text-4xl text-slate-900 tracking-tight uppercase">Awaiting Protocol</h3>
                                        <p className="text-[11px] font-black text-slate-400 leading-relaxed uppercase tracking-[0.4em] max-w-xs mx-auto">
                                            Execute the configuration matrix above to begin artifact synthesis
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
