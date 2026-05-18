import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Sparkles, Loader2, BookOpen, Presentation, ClipboardList, Upload } from "lucide-react";
import { toast } from "sonner";
import { downloadAsFile, downloadAsPDF, cn } from "@/lib/utils";
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

export function TeachingMaterialTab() {
    const [board, setBoard] = useState("CBSE");
    const [grade, setGrade] = useState("10");
    const [subject, setSubject] = useState("");
    const [topic, setTopic] = useState("");
    const [openTopic, setOpenTopic] = useState(false);
    const [type, setType] = useState("NOTES");
    const [generatedContent, setGeneratedContent] = useState<any>(null);

    const { data: curriculumMeta } = useQuery({
        queryKey: ['material-curriculum-meta', board, grade],
        queryFn: async () => {
            const res = await api.get('/curriculum/metadata', { params: { curriculum: board, class: grade } }) as any;
            return res.success ? res.data : { subjects: [], topics: {} };
        }
    });

    const [pdfText, setPdfText] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const generateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/materials/generate', { ...data, pdfText });
            return res;
        },
        onSuccess: (res) => {
            if (res && res.success) {
                setGeneratedContent(res.data);
                toast.success(`${type} synthesized successfully!`);
            } else {
                toast.error(res.error || `Failed to generate ${type}`);
            }
        }
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = (textOverride?: string) => {
        if (!subject || !topic) return;
        generateMutation.mutate({ 
            type, 
            curriculum: board, 
            grade, 
            subject, 
            topic,
            pdfText: textOverride !== undefined ? textOverride : pdfText
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log("[TEACHING MATERIAL] Staging artifact:", file.name, file.size);

        if (file.size > 50 * 1024 * 1024) {
            toast.error("Artifact exceeds 50MB limit.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        const loadingToast = toast.loading(`Uploading context: ${file.name}...`);

        try {
            console.log("[TEACHING MATERIAL] Transmitting to /upload/pdf...");
            const res = await api.post('/upload/pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (p) => {
                    const progress = Math.round((p.loaded * 100) / (p.total || 1));
                    console.log(`[TEACHING MATERIAL] Upload progress: ${progress}%`);
                }
            });

            console.log("[TEACHING MATERIAL] Response received:", res);

            if (res.success) {
                const extractedText = res.data.text;
                setPdfText(extractedText);
                toast.success(`Context inherited: ${res.data.originalName || file.name}`, { id: loadingToast });
                
                // Auto-trigger generation if topic is already selected
                if (subject && topic) {
                    console.log("[TEACHING MATERIAL] Subject/Topic detected. Auto-synthesizing...");
                    toast.info("Auto-triggering synthesis protocol...");
                    handleGenerate(extractedText);
                }
            } else {
                toast.error(res.error || "Context extraction failed.", { id: loadingToast });
            }
        } catch (err: any) {
            console.error("[TEACHING MATERIAL] CRITICAL ERROR:", err);
            const errorMsg = err.response?.data?.error || err.message || "Network failure during transmission.";
            toast.error(errorMsg, { id: loadingToast });
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const materialTypes = [
        { id: 'NOTES', label: 'Study Notes', icon: BookOpen, accent: 'indigo', activeClasses: 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' },
        { id: 'WORKSHEET', label: 'Worksheet', icon: ClipboardList, accent: 'violet', activeClasses: 'bg-violet-600/10 border-violet-500/30 text-violet-400' },
        { id: 'PPT', label: 'PPT Outline', icon: Presentation, accent: 'amber', activeClasses: 'bg-amber-600/10 border-amber-500/30 text-indigo-400' },
    ];

    const activeType = materialTypes.find(t => t.id === type);

    const handleDownload = () => {
        if (!generatedContent) return;
        const title = generatedContent.title || "Untitled_Material";
        downloadAsPDF(generatedContent, `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
        toast.success("Artifact exported as PDF!");
    };

    return (
        <div className="w-full px-6 py-12 animate-in fade-in duration-700">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
                <div className="text-left space-y-3">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">
                        Material Synthesis
                    </h1>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] italic">
                        Professional Teaching Resource Generation Engine
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100 mt-2">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Synthesis Protocol</span>
                    </div>
                </div>
            </div>

            <div className="w-full space-y-10">
                {/* CONFIGURATION MATRIX */}
                <Card className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                    <CardContent className="p-10 space-y-10">
                        {/* ROW 1: PRIMARY TARGETING */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Curriculum Board</Label>
                                <Select value={board} onValueChange={setBoard}>
                                    <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-xl">
                                        <SelectItem value="CBSE" className="font-bold text-xs">CBSE</SelectItem>
                                        <SelectItem value="ICSE" className="font-bold text-xs">ICSE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Grade Level</Label>
                                <Select value={grade} onValueChange={setGrade}>
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
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Subject Area</Label>
                                <Select value={subject} onValueChange={(v) => { setSubject(v); setTopic(""); }}>
                                    <SelectTrigger className="h-14 bg-white border-slate-100 rounded-[1.2rem] text-slate-900 font-black text-xs px-6 shadow-sm hover:border-indigo-200 transition-all">
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 rounded-xl">
                                        {curriculumMeta?.subjects?.map((s: any) => (
                                            <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Topic Protocol</Label>
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
                                                <CommandEmpty>
                                                    <div className="p-4 text-center">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Curriculum Match</p>
                                                        <p className="text-[8px] font-bold text-slate-400 mt-1">Type custom protocol below</p>
                                                    </div>
                                                </CommandEmpty>
                                                <CommandGroup heading="Curriculum Topics">
                                                    {(subject ? (curriculumMeta?.topics?.[subject] || []) : []).map((t: string) => (
                                                        <CommandItem key={t} value={t} onSelect={() => { setTopic(t); setOpenTopic(false); }} className="text-xs font-bold py-3">
                                                            <Check className={cn("mr-2 h-4 w-4", topic === t ? "opacity-100" : "opacity-0")} />
                                                            {t}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                                                <input 
                                                    className="w-full px-4 py-2 text-xs font-bold border rounded-xl bg-white focus:outline-none focus:ring-2 ring-indigo-500/10 transition-all" 
                                                    placeholder="Custom Topic Protocol…" 
                                                    value={topic} 
                                                    onChange={(e) => setTopic(e.target.value)} 
                                                    onKeyDown={(e) => { if (e.key === "Enter") setOpenTopic(false); }} 
                                                />
                                            </div>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* ROW 2: MATERIAL FORMATS */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Synthesis Format</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {materialTypes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setType(t.id)}
                                        className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${type === t.id
                                            ? 'border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm'
                                            : 'border-slate-100 bg-white hover:border-slate-200 text-slate-400'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${type === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 border border-slate-100'}`}>
                                            <t.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-xs uppercase tracking-widest leading-none">{t.label}</p>
                                            <p className="text-[8px] font-bold uppercase tracking-widest mt-1.5 opacity-60">
                                                {t.id === 'NOTES' ? 'Comprehensive Guide' : t.id === 'WORKSHEET' ? 'Active Assessment' : 'Visual Framework'}
                                            </p>
                                        </div>
                                        {type === t.id && (
                                            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                                <Sparkles className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ACTION STRIP */}
                        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                            {/* Left: PDF Context */}
                            <div className="flex items-center gap-5">
                                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileUpload} />
                                <Button
                                    variant="ghost"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className={`h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center gap-2 ${
                                        pdfText ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-slate-500 hover:bg-slate-50"
                                    }`}
                                >
                                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                    {pdfText ? "Context Inherited ✓" : "Inject PDF Context"}
                                </Button>
                            </div>

                            {/* Right: Primary CTA */}
                            <Button
                                onClick={() => handleGenerate()}
                                disabled={generateMutation.isPending || !subject || !topic}
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

                {/* RESULT VIEWPORT */}
                <div className="w-full min-h-[600px]">
                    {generatedContent ? (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <Card className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                                <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center gap-8 justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-black text-2xl text-slate-900 tracking-tight uppercase leading-none">{generatedContent.title}</h3>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                {generatedContent.subjectName} · {generatedContent.topicName}
                                            </p>
                                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">
                                                {activeType?.label}
                                            </span>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={handleDownload}
                                        className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] border-none transition-all gap-3 shadow-xl"
                                    >
                                        <Download className="w-4 h-4" /> Export Professional PDF
                                    </Button>
                                </div>
                                <div className="p-12">
                                    <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-base font-medium max-w-4xl mx-auto">
                                        {generatedContent.content}
                                    </pre>
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in zoom-in duration-1000">
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
                                Configure the material matrix above to initialize high-fidelity academic resource generation
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
