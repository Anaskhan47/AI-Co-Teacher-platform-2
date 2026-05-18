import { useState, useRef } from 'react';
import { Upload, FileText, BarChart3, Users, MessageSquare, AlertCircle, Loader2, Sparkles, X, FileSpreadsheet, ChevronDown, Download, Check, FileCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/api/client';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

export const DataAnalysisTab = () => {
    const [file, setFile] = useState<File | null>(null);
    const [analysisType, setAnalysisType] = useState<string>("class_performance");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [dragActive, setDragActive] = useState(false);
    const [selectedDetailSubject, setSelectedDetailSubject] = useState<string>("");
    const [selectedImprovementSubject, setSelectedImprovementSubject] = useState<string>("");
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Chat State for "Ask Questions"
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!validExtensions.includes(fileExtension)) {
            toast.error("Please upload a CSV or Excel file.");
            return;
        }
        setFile(file);
        setResult(null);
        toast.success(`File ${file.name} ready for analysis.`);
    };

    const handleAnalyze = async () => {
        if (!file) {
            toast.error("Please upload a file first.");
            return;
        }

        setIsAnalyzing(true);

        try {
            let csvData = "";
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

            if (fileExtension === '.csv') {
                csvData = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.onerror = (e) => reject(e);
                    reader.readAsText(file);
                });
            } else {
                csvData = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const data = e.target?.result;
                            if (!data) throw new Error("File reading failed");
                            const workbook = XLSX.read(data, { type: 'array' });
                            if (!workbook.SheetNames.length) throw new Error("No sheets found in Excel file");
                            const sheetName = workbook.SheetNames[0];
                            const sheet = workbook.Sheets[sheetName];
                            const csv = XLSX.utils.sheet_to_csv(sheet);
                            if (!csv.trim()) throw new Error("Excel sheet appears empty");
                            resolve(csv);
                        } catch (err) {
                            reject(err instanceof Error ? err : new Error("Failed to parse Excel file"));
                        }
                    };
                    reader.onerror = () => reject(new Error("Failed to read file"));
                    reader.readAsArrayBuffer(file);
                });
            }

            const res = await api.post('/ai/analyze-data', {
                csvData,
                analysisType
            });

            if (res.success) {
                setResult(res.data);
                toast.success("Analysis generated successfully!");
            } else {
                toast.error(res.error || "Failed to process data analysis.");
            }

        } catch (error: any) {
            console.error("Analysis error:", error);
            const errorMessage = error.response?.data?.error || error.message || "Something went wrong while processing the file.";
            toast.error(errorMessage);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getSubjects = () => result?.subjectInsights ? Object.keys(result.subjectInsights) : [];

    if (result && result.subjectInsights && !selectedDetailSubject) {
        const subjects = Object.keys(result.subjectInsights);
        if (subjects.length > 0) {
            if (!selectedDetailSubject) setSelectedDetailSubject(subjects[0]);
            if (!selectedImprovementSubject) setSelectedImprovementSubject(subjects[0]);
        }
    }

    return (
        <div className="w-full space-y-10 animate-in fade-in duration-700">
            {/* 1. CONFIGURATION MATRIX */}
            <Card className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                <div className="p-10 space-y-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* LEFT: File Upload Protocol */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                    <Upload className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Data Injection Protocol</h3>
                            </div>
                            
                            <div
                                className={cn(
                                    "relative border-2 border-dashed rounded-[2rem] h-64 flex flex-col items-center justify-center gap-4 transition-all overflow-hidden group",
                                    dragActive ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                                )}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <input type="file" ref={fileInputRef} accept=".csv, .xlsx, .xls" className="hidden" onChange={handleChange} />
                                
                                {!file ? (
                                    <>
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-slate-100 flex items-center justify-center text-slate-300 shadow-sm group-hover:scale-110 transition-transform">
                                            <FileSpreadsheet className="w-8 h-8" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-slate-900 font-black uppercase tracking-widest text-[11px]">Drag & Drop Dataset</p>
                                            <p className="text-slate-400 font-bold text-[9px] mt-1 uppercase tracking-widest">CSV, Excel • Max 200MB</p>
                                        </div>
                                        <Button
                                            onClick={() => fileInputRef.current?.click()}
                                            variant="outline"
                                            className="bg-white border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest px-6 h-10 shadow-sm hover:border-indigo-200"
                                        >
                                            Browse Files
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm">
                                            <FileCheck className="w-8 h-8" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-slate-900 font-black text-xs">{file.name}</p>
                                            <p className="text-slate-400 font-black text-[9px] mt-1 uppercase">{(file.size / 1024).toFixed(2)} KB • READY</p>
                                        </div>
                                        <button onClick={() => setFile(null)} className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors">Discard Record</button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-4">
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-[9px] text-amber-700 font-black uppercase tracking-wider leading-relaxed">
                                    Ensure columns: <span className="text-amber-900">Roll No, Name, Attendance</span> + Subject Scores.
                                </p>
                            </div>
                        </div>

                        {/* RIGHT: Analysis Targeting */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Synthesis Targeting</h3>
                            </div>

                            <div className="grid gap-3">
                                {[
                                    { id: "class_performance", label: "Class-Wide Performance", desc: "Aggregate statistical distribution", icon: BarChart3 },
                                    { id: "student_performance", label: "Student-Specific Audit", desc: "Individual trajectory analysis", icon: Users },
                                    { id: "attendance_analysis", label: "Presence Correlation", desc: "Attendance vs. Performance", icon: FileText },
                                    { id: "ask_questions", label: "Query Matrix", desc: "Ask AI specific data questions", icon: MessageSquare },
                                ].map((type) => (
                                    <label
                                        key={type.id}
                                        className={cn(
                                            "flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all border",
                                            analysisType === type.id 
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                                        )}
                                    >
                                        <input type="radio" name="analysisType" value={type.id} checked={analysisType === type.id} onChange={(e) => { setAnalysisType(e.target.value); setResult(null); }} className="hidden" />
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", analysisType === type.id ? 'bg-white/20' : 'bg-slate-50')}>
                                            <type.icon className={cn("w-5 h-5", analysisType === type.id ? 'text-white' : 'text-slate-400')} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest">{type.label}</p>
                                            <p className={cn("text-[9px] font-bold mt-1 uppercase tracking-widest opacity-60", analysisType === type.id ? 'text-white' : 'text-slate-400')}>{type.desc}</p>
                                        </div>
                                        {analysisType === type.id && <Check className="w-4 h-4 text-white" />}
                                    </label>
                                ))}
                            </div>

                            <Button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !file}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.2rem] shadow-xl shadow-indigo-600/20 border-none transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px]"
                            >
                                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {isAnalyzing ? "Synthesizing Analysis" : "Initialize Synthesis"}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* 2. RESULTS DISPLAY */}
            <AnimatePresence mode="wait">
                {isAnalyzing ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border rounded-[2.5rem] p-24 flex flex-col items-center gap-6 shadow-sm border-slate-100">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 animate-pulse">Processing Institutional Data Matrix...</p>
                    </motion.div>
                ) : result ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 overflow-hidden">
                        <div className="p-10 space-y-10">
                            {/* Result Header */}
                            <div className="flex items-start justify-between border-b border-slate-100 pb-8">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{analysisType.replace(/_/g, ' ')} Report</h2>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        {file?.name} • {(file?.size || 0) / 1024 > 1024 ? ((file?.size || 0) / 1024 / 1024).toFixed(2) + ' MB' : ((file?.size || 0) / 1024).toFixed(2) + ' KB'}
                                    </p>
                                </div>
                                <Button onClick={() => setResult(null)} variant="outline" className="h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest border-slate-100 text-slate-400 hover:text-slate-900 transition-all">Reset Matrix</Button>
                            </div>

                            {/* Dynamic Content Rendering */}
                            <div className="space-y-10">
                                {analysisType === "student_performance" && (
                                    <div className="space-y-10">
                                        {/* Top Performers */}
                                        <div className="space-y-6">
                                            <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.25em] flex items-center gap-2"><Sparkles className="w-4 h-4" /> Elite Tier Performers</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {result.toppers?.map((student: any, idx: number) => (
                                                    <div key={idx} className="bg-emerald-50/30 border border-emerald-100 p-8 rounded-[1.5rem] relative overflow-hidden group">
                                                        <div className="absolute -right-4 -top-4 text-7xl font-black text-emerald-500/5 group-hover:scale-110 transition-transform">#{student.rank || idx + 1}</div>
                                                        <p className="text-emerald-700 font-black uppercase tracking-widest text-[10px] mb-1">{student.name}</p>
                                                        <p className="text-4xl font-black text-slate-900 tracking-tighter">{student.percentage}%</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Needs Attention */}
                                        <div className="space-y-6">
                                            <h3 className="text-[11px] font-black text-rose-600 uppercase tracking-[0.25em] flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Priority Support Vectors</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {result.struggling?.map((student: any, idx: number) => (
                                                    <div key={idx} className="bg-rose-50/30 border border-rose-100 p-6 rounded-2xl flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <p className="text-slate-900 font-black uppercase tracking-widest text-[10px]">{student.name}</p>
                                                            <p className="text-rose-600 font-bold text-[9px] uppercase tracking-widest opacity-70">Focus: {student.needsHelpIn}</p>
                                                        </div>
                                                        <div className="text-2xl font-black text-rose-500">{student.percentage}%</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Table */}
                                        <div className="bg-slate-50/50 rounded-[2rem] border border-slate-100 overflow-hidden shadow-inner">
                                            <div className="p-8 border-b border-slate-100 bg-white/50">
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Aggregate Registry</h3>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-white/50 h-12">
                                                            <th className="px-8 font-black text-slate-400 text-[9px] uppercase tracking-widest">Identity</th>
                                                            <th className="px-8 font-black text-slate-400 text-[9px] uppercase tracking-widest">Aggregate</th>
                                                            <th className="px-8 font-black text-slate-400 text-[9px] uppercase tracking-widest">Yield</th>
                                                            <th className="px-8 font-black text-slate-400 text-[9px] uppercase tracking-widest">Grade</th>
                                                            <th className="px-8 font-black text-slate-400 text-[9px] uppercase tracking-widest">Audit Remarks</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {result.allStudents?.map((student: any, idx: number) => (
                                                            <tr key={idx} className="h-16 hover:bg-white transition-all group">
                                                                <td className="px-8 font-black text-slate-700 text-[11px] uppercase">{student.name}</td>
                                                                <td className="px-8 font-bold text-slate-500 text-[11px]">{student.total}</td>
                                                                <td className={cn("px-8 font-black text-[11px]", student.percentage >= 75 ? 'text-emerald-600' : student.percentage < 40 ? 'text-rose-600' : 'text-amber-600')}>
                                                                    {student.percentage}%
                                                                </td>
                                                                <td className="px-8">
                                                                    <span className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", student.grade === 'A' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200')}>
                                                                        {student.grade}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 text-[10px] font-bold text-slate-400 italic">{student.remarks}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {analysisType === "attendance_analysis" && (
                                    <div className="space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-indigo-50/30 border border-indigo-100 p-10 rounded-[2.5rem] text-center shadow-sm">
                                                <p className="text-indigo-400 font-black uppercase tracking-widest text-[10px] mb-3">Overall Presence Quotient</p>
                                                <p className="text-6xl font-black text-slate-900 tracking-tighter">{result.overallAttendance}%</p>
                                            </div>
                                            <div className="bg-slate-50/50 border border-slate-100 p-10 rounded-[2.5rem] flex items-center justify-center">
                                                <p className="text-slate-500 font-black text-xs uppercase tracking-widest leading-relaxed text-center italic opacity-70">"{result.correlation}"</p>
                                            </div>
                                        </div>

                                        <div className="bg-rose-50/30 border border-rose-100 rounded-[2rem] p-8">
                                            <h3 className="text-rose-600 font-black uppercase tracking-[0.2em] text-[10px] mb-6 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Attendance Deficit Index ({'<'}75%)</h3>
                                            <div className="grid gap-3">
                                                {result.lowAttendanceList?.length > 0 ? (
                                                    result.lowAttendanceList.map((student: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-rose-100 shadow-sm">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 font-black text-xs">!</div>
                                                                <span className="font-black text-slate-900 uppercase tracking-widest text-[10px]">{student.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-6">
                                                                <span className="text-rose-600 font-black text-xs">{student.attendance}%</span>
                                                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">{student.performanceStatus}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-emerald-600 font-black uppercase tracking-widest text-[10px] py-8 text-center">Zero Attendance Deficits Detected Protocol Clear 🎉</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h3 className="text-slate-900 font-black uppercase tracking-widest text-[10px] ml-1">Key Correlation Insights</h3>
                                            <div className="grid gap-4">
                                                {result.insights?.map((insight: string, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-2xl">
                                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 shrink-0 shadow-lg shadow-indigo-500/40" />
                                                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{insight}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {analysisType === "ask_questions" && (
                                    <div className="h-[650px] flex flex-col">
                                        <div className="flex-1 overflow-y-auto space-y-6 p-8 bg-slate-50/50 rounded-[2.5rem] mb-6 border border-slate-100 shadow-inner custom-scrollbar">
                                            {result.summary && (
                                                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl mb-6">
                                                    <div className="flex items-center gap-2 mb-2 text-indigo-600">
                                                        <Sparkles className="w-4 h-4" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Active Data Context</span>
                                                    </div>
                                                    <p className="text-indigo-900 text-xs font-bold leading-relaxed">{result.summary}</p>
                                                </div>
                                            )}
                                            {chatMessages.map((msg, idx) => (
                                                <div key={idx} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                                    <div className={cn(
                                                        "max-w-[85%] rounded-[1.5rem] p-5 shadow-sm",
                                                        msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                                    )}>
                                                        <p className="text-xs font-bold leading-relaxed">{msg.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {isChatLoading && (
                                                <div className="flex justify-start">
                                                    <div className="bg-white border border-slate-100 rounded-[1.5rem] p-5 rounded-tl-none flex items-center gap-3">
                                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Thinking...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full h-16 bg-white border border-slate-200 rounded-[1.2rem] pl-8 pr-16 text-slate-900 font-bold text-xs focus:ring-4 ring-indigo-500/5 transition-all shadow-xl shadow-slate-200/40"
                                                placeholder="Query the dataset (e.g. 'Who has the highest attendance?')..."
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter' && chatInput.trim()) {
                                                        const q = chatInput; setChatInput("");
                                                        setChatMessages(p => [...p, { role: 'user', content: q }]);
                                                        setIsChatLoading(true);
                                                        await new Promise(r => setTimeout(r, 1200));
                                                        setChatMessages(p => [...p, { role: 'assistant', content: `Analysis complete for protocol "${q}". Based on institutional datasets, specific insights suggest... [Simulated Response]` }]);
                                                        setIsChatLoading(false);
                                                    }
                                                }}
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Button size="icon" className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">
                                                    <Sparkles className="w-4 h-4 text-white" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {analysisType === "class_performance" && result.subjectInsights && (
                                    <div className="space-y-12">
                                        <div className="space-y-8">
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Aggregate Domain Audit</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-lg w-fit">Optimal Yield Domains</p>
                                                    <div className="grid gap-3">
                                                        {result.summary?.performingWell?.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                                <span className="font-black text-slate-700 text-[10px] uppercase tracking-widest">{item.subject}</span>
                                                                <span className="font-black text-emerald-600 text-xs">{item.score}/100</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-lg w-fit">Support Intensive Domains</p>
                                                    <div className="grid gap-3">
                                                        {result.summary?.struggling?.map((item: any, idx: number) => (
                                                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                                <span className="font-black text-slate-700 text-[10px] uppercase tracking-widest">{item.subject}</span>
                                                                <span className="font-black text-rose-600 text-xs">{item.score}/100</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chart & Detail */}
                                        <div className="pt-10 border-t border-slate-100 space-y-8">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Deep-Dive Analysis</h3>
                                                <div className="relative w-full md:w-72">
                                                    <select
                                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-5 text-xs font-black uppercase tracking-widest text-slate-900 appearance-none cursor-pointer focus:ring-4 ring-indigo-500/5 shadow-sm"
                                                        value={selectedDetailSubject}
                                                        onChange={(e) => setSelectedDetailSubject(e.target.value)}
                                                    >
                                                        {getSubjects().map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            {selectedDetailSubject && result.subjectInsights?.[selectedDetailSubject] && (
                                                <div className="space-y-10">
                                                    <div className="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-sm overflow-hidden relative">
                                                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-10">Marks Yield Distribution: {selectedDetailSubject}</h4>
                                                        <div className="h-[350px] w-full">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart data={result.subjectInsights[selectedDetailSubject].distribution}>
                                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                                    <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                                                                    <YAxis tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} axisLine={false} tickLine={false} />
                                                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: 10, textTransform: 'uppercase' }} />
                                                                    <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={50} />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        {[
                                                            { label: 'Domain Mean', value: result.subjectInsights[selectedDetailSubject].average, color: 'text-indigo-600' },
                                                            { label: 'Domain Ceiling', value: result.subjectInsights[selectedDetailSubject].highest, color: 'text-emerald-600' },
                                                            { label: 'Domain Floor', value: result.subjectInsights[selectedDetailSubject].lowest, color: 'text-rose-600' },
                                                        ].map((stat, i) => (
                                                            <div key={i} className="bg-slate-50/50 border border-slate-100 p-8 rounded-2xl text-center shadow-sm">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                                                                <p className={cn("text-4xl font-black tracking-tighter", stat.color)}>{stat.value}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Strip */}
                            <div className="pt-10 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                                <Button
                                    onClick={() => {
                                        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `Institutional_Analysis_Audit.json`;
                                        a.click();
                                    }}
                                    className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20"
                                >
                                    <Download className="w-4 h-4 mr-2" /> Export Audit Matrix
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-48 text-center animate-in fade-in zoom-in duration-1000">
                        <div className="relative mb-12 group">
                            <div className="absolute inset-0 bg-indigo-500/10 blur-[80px] rounded-full animate-pulse" />
                            <div className="relative w-32 h-32 rounded-[3.5rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:rotate-12 group-hover:scale-110">
                                <FileSpreadsheet className="w-14 h-14 text-indigo-600 transition-colors duration-500" />
                            </div>
                        </div>
                        <h3 className="font-black text-4xl text-slate-900 tracking-tight uppercase leading-none">
                            Awaiting Data Ingestion
                        </h3>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-6 max-w-sm leading-loose opacity-60">
                            Upload institutional datasets to initialize autonomous pedagogical audit protocols
                        </p>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
